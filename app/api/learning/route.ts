import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODELS = [
    "mistralai/mistral-small-3.2-24b-instruct:free",
    "meta-llama/llama-3.3-8b-instruct:free"
];

const RSS_FEEDS = {
  us: "https://rss.nytimes.com/services/xml/rss/nyt/US.xml",
  technology: "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml",
  economy: "https://rss.nytimes.com/services/xml/rss/nyt/Economy.xml"
};

type RssItem = {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
};

function decodeCdataAndEntities(input: string): string {
  const withoutCdata = input.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
  return withoutCdata
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function getTag(xml: string, tag: string): string | undefined {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = xml.match(re);
  return m ? decodeCdataAndEntities(m[1]).trim() : undefined;
}

function stripHtmlTags(text: string): string {
  return text.replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseRss(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const itemRegex = /<item[\s\S]*?<\/item>/gi;
  const blocks = xml.match(itemRegex) || [];
  for (const block of blocks) {
    const title = getTag(block, "title") || "";
    const link = getTag(block, "link") || "";
    const description = getTag(block, "description");
    const pubDate = getTag(block, "pubDate");
    if (title && link) {
      items.push({ title, link, description, pubDate });
    }
  }
  return items;
}

async function fetchRssItems(url: string): Promise<RssItem[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, {
      headers: { "Accept": "application/rss+xml, application/xml;q=0.9, text/xml;q=0.8" },
      signal: controller.signal,
      cache: "no-store"
    });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRss(xml);
  } catch {
    return [];
  }
}

function stripHtmlToText(html: string): { title: string; text: string } {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : "";
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length > 6000) cleaned = cleaned.slice(0, 6000) + "…";
  return { title, text: cleaned };
}

async function fetchArticleMarkdown(url: string): Promise<{ url: string; title: string; excerpt: string } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9",
        "User-Agent": "Mozilla/5.0 (compatible; MandarinPasteBot/1.0;)"
      },
      signal: controller.signal,
      cache: "no-store"
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "";
    if (/pdf|audio|video|image/i.test(contentType)) return null;
    const html = await res.text();
    const { title, text } = stripHtmlToText(html);
    if (!text || text.length < 200) return null;
    const excerpt = text.length > 1500 ? text.slice(0, 1500) + "…" : text;
    return { url, title: title || url, excerpt };
  } catch {
    return null;
  }
}

function buildChineseSummaryPrompt(sources: { url: string; title: string; excerpt: string }[]): { system: string; user: string } {
  const system = "你是一名财经与科技新闻编辑，擅长用简体中文快速、准确地汇总要点。严格只使用 HSK 1 词汇。";
  const now = new Date().toISOString();
  const header = `请基于以下英文新闻原文摘录，用简体中文生成“美国科技要闻”和“美国金融要闻”的当日总结（时间：${now}）。要求：\n- 每部分3-6条要点，使用简短项目符号。\n- 用自己的话概括，避免逐句翻译。\n- 在文末提供来源列表（标题 + 链接）。`;
  const docs = sources.map((s, i) => `【来源${i + 1}】\n标题：${s.title}\n链接：${s.url}\n正文摘录：\n${s.excerpt}`).join("\n\n");
  const user = `${header}\n\n资料（英文）：\n${docs}`;
  return { system, user };
}

export async function POST() {
  const getCachedSummary = unstable_cache(async () => {
    const [usItems, techItems, econItems] = await Promise.all([
      fetchRssItems(RSS_FEEDS.us),
      fetchRssItems(RSS_FEEDS.technology),
      fetchRssItems(RSS_FEEDS.economy)
    ]);

    const merged = [...usItems, ...techItems, ...econItems];
    merged.sort((a, b) => {
      const ta = a.pubDate ? Date.parse(a.pubDate) : 0;
      const tb = b.pubDate ? Date.parse(b.pubDate) : 0;
      return tb - ta;
    });

    const uniqueByLink = Array.from(new Map(merged.map(i => [i.link, i])).values());
    const top = uniqueByLink.slice(0, 10);

    const articles = (await Promise.all(top.map(async (i) => {
      const fetched = await fetchArticleMarkdown(i.link);
      if (fetched) return fetched;
      const fallbackText = i.description ? stripHtmlTags(i.description) : "";
      if (!fallbackText) return null;
      const excerpt = fallbackText.length > 3000 ? `${fallbackText.slice(0, 3000)}…` : fallbackText;
      return { url: i.link, title: i.title, excerpt };
    }))).filter(Boolean) as { url: string; title: string; excerpt: string }[];

    if (articles.length === 0) {
      throw new Error("未找到可用资讯来源，请稍后再试。");
    }

    const { system, user } = buildChineseSummaryPrompt(articles);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODELS[Math.floor(Math.random() * MODELS.length)],
        temperature: 0.3,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ]
      }),
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("生成摘要失败");
    }

    const data = await response.json();
    const summary = data?.choices?.[0]?.message?.content ?? "";

    return {
      summary,
      sources: articles.map(a => ({ title: a.title, url: a.url }))
    };
  }, ["learning-summary-v1"], { revalidate: 1800 });

  try {
    const payload = await getCachedSummary();
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "s-maxage=1800, stale-while-revalidate=60"
      }
    });
  } catch {
    return NextResponse.json({ error: "生成摘要失败" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}

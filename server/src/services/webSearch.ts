export interface WebSearchResult {
  title: string
  url: string
  snippet: string
}

function decodeHtmlEntities(value: string): string {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', '\'')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
}

export async function searchWeb(query: string, topK = 5): Promise<WebSearchResult[]> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
      }
    })
    clearTimeout(timeout)

    if (!response.ok) {
      return []
    }

    const html = await response.text()
    const results: WebSearchResult[] = []
    const itemRegex = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi

    let match: RegExpExecArray | null
    while ((match = itemRegex.exec(html)) !== null && results.length < topK) {
      const [, urlText, titleHtml, snippetHtml] = match
      const title = decodeHtmlEntities(titleHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
      const snippet = decodeHtmlEntities(snippetHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
      const finalUrl = decodeHtmlEntities(urlText)
      if (title && finalUrl) {
        results.push({ title, url: finalUrl, snippet })
      }
    }

    return results
  } catch {
    return []
  }
}

export function buildWebSearchContext(results: WebSearchResult[]): string {
  if (results.length === 0) return ''

  return [
    '以下是联网搜索到的参考结果，请结合它们回答用户问题，并标注信息来源：',
    ...results.map((result, index) =>
      `${index + 1}. ${result.title}\n${result.url}\n${result.snippet}`.trim()
    )
  ].join('\n\n')
}

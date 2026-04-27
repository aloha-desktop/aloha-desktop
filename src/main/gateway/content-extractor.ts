const LINK_REGEX = /(?<!!)\[([^\]]+)\]\(([^)]+)\)/g

export type ContentLink = { text: string; url: string }
export type ContentLinks = ContentLink[]

export function extractMarkdownLinks(content: string): ContentLinks {
  const links: ContentLinks = []
  let match: string[] | null
  while ((match = LINK_REGEX.exec(content)) !== null) {
    const text = match[1]
    const url = match[2]
    links.push({ text, url })
  }

  return links
}

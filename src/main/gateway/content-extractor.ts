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

export function formatMarkdown(content: string): string {
  if (!content) return content
  let result = content

  // Protect triple-backtick code blocks from inline transforms.
  // WhatsApp uses the exact same ``` syntax for monospace blocks.
  const codeBlocks: string[] = []
  result = result.replace(/```[\s\S]*?```/g, (match) => {
    const idx = codeBlocks.push(match) - 1
    return `\x00CB${idx}\x00`
  })

  // Protect inline code from inline transforms.
  // WhatsApp uses the exact same backtick syntax.
  const inlineCodes: string[] = []
  result = result.replace(/`[^`\n]+`/g, (match) => {
    const idx = inlineCodes.push(match) - 1
    return `\x00IC${idx}\x00`
  })

  // Images: keep alt text, discard URL — WA can't render inline MD images
  result = result.replace(/!\[([^\]]*)\]\([^)]+\)/g, (_, alt) => alt)

  // Links: [text](url) → text (url)
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')

  // Bold + italic (***text*** or ___text___) → *_text_*
  // Protect this from subsequent italic and bold passes
  const boldItalics: string[] = []
  result = result.replace(/\*{3}([^*\n]+?)\*{3}/g, (_, p1) => {
    const idx = boldItalics.push(`*_${p1}_*`) - 1
    return `\x00BI${idx}\x00`
  })
  result = result.replace(/_{3}([^_\n]+?)_{3}/g, (_, p1) => {
    const idx = boldItalics.push(`*_${p1}_*`) - 1
    return `\x00BI${idx}\x00`
  })

  // Italic (*text* with single asterisks) → _text_
  // Lookahead/lookbehind prevents matching the asterisks that are part of **bold**.
  // Must run before bold so that **text** is never misidentified here.
  result = result.replace(/(?<!\*)\*(?!\*)([^*\n]+?)(?<!\*)\*(?!\*)/g, '_$1_')

  // Bold (**text** or __text__) → *text*
  result = result.replace(/\*\*([^*\n]+?)\*\*/g, '*$1*')
  result = result.replace(/__([^_\n]+?)__/g, '*$1*')

  // Strikethrough (~~text~~) → ~text~
  result = result.replace(/~~([^~\n]+?)~~/g, '~$1~')

  // Headings (# through ######) → bold text
  // Remove any internal '*' characters to prevent nested bold formatting
  result = result.replace(/^#{1,6}\s+(.+)$/gm, (_, p1) => {
    return `*${p1.replace(/\*/g, '')}*`
  })

  // Horizontal rules (--- / *** / ___) → remove entirely
  result = result.replace(/^[-*_]{3,}\s*$/gm, '')

  // Restore inline code, code blocks, and bold-italics
  inlineCodes.forEach((code, i) => {
    result = result.replace(`\x00IC${i}\x00`, code)
  })
  codeBlocks.forEach((block, i) => {
    result = result.replace(`\x00CB${i}\x00`, block)
  })
  boldItalics.forEach((text, i) => {
    result = result.replace(`\x00BI${i}\x00`, text)
  })

  return result.trim()
}

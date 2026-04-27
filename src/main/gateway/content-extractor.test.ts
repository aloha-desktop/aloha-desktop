import { describe, it, expect } from 'vitest'
import { extractMarkdownLinks, formatMarkdown } from './content-extractor'

describe('extractMarkdownLinks', () => {
  it('should return an empty array if no links are present', () => {
    const content = 'Some text without links'
    const result = extractMarkdownLinks(content)
    expect(result).toEqual([])
  })

  it('should extract a single HTTP link', () => {
    const content = 'Here is a [Google Link](https://google.com).'
    const result = extractMarkdownLinks(content)
    expect(result).toEqual([{ text: 'Google Link', url: 'https://google.com' }])
  })

  it('should extract multiple HTTP links', () => {
    const content = 'Here is [Google Link](https://google.com) and an [Example Link](http://example.com).'
    const result = extractMarkdownLinks(content)
    expect(result).toEqual([
      { text: 'Google Link', url: 'https://google.com' },
      { text: 'Example Link', url: 'http://example.com' },
    ])
  })

  it('should extract file links', () => {
    const content = 'Found [file1.txt](file:///tmp/file1.txt) and [file2.txt](file:///tmp/file2.txt).'
    const result = extractMarkdownLinks(content)
    expect(result).toEqual([
      { text: 'file1.txt', url: 'file:///tmp/file1.txt' },
      { text: 'file2.txt', url: 'file:///tmp/file2.txt' },
    ])
  })

  it('should handle both HTTP and file links together', () => {
    const content = '[web link](http://web.com) and [local doc](file:///tmp/local.doc)'
    const result = extractMarkdownLinks(content)
    expect(result).toEqual([
      { text: 'web link', url: 'http://web.com' },
      { text: 'local doc', url: 'file:///tmp/local.doc' },
    ])
  })

  it('should correctly handle links with special characters in text', () => {
    const content = 'Check out [My Document (v2).pdf](file:///tmp/doc.pdf).'
    const result = extractMarkdownLinks(content)
    expect(result).toEqual([{ text: 'My Document (v2).pdf', url: 'file:///tmp/doc.pdf' }])
  })

  it('should ignore image links (![...](...)) and only extract text links', () => {
    const content =
      '## ![icon =20x20](https://external-content.duckduckgo.com/ip3/www.travelmath.com.ico) [Flight Time from JFK to LHR - Travelmath](https://duckduckgo.com/l/?uddg=https%3A%2F%2Fwww.travelmath.com%2Fflying%2Dtime%2Ffrom%2FJFK%2Fto%2FLHR&rut=791c3d83df6318ef19f6d15322feeee6f73b42a7d9b797acb38f836fd6c3dc5d)'
    const result = extractMarkdownLinks(content)
    expect(result).toEqual([
      {
        text: 'Flight Time from JFK to LHR - Travelmath',
        url: 'https://duckduckgo.com/l/?uddg=https%3A%2F%2Fwww.travelmath.com%2Fflying%2Dtime%2Ffrom%2FJFK%2Fto%2FLHR&rut=791c3d83df6318ef19f6d15322feeee6f73b42a7d9b797acb38f836fd6c3dc5d',
      },
    ])
  })
})

describe('formatMarkdown', () => {
  it('should return empty string if content is empty', () => {
    expect(formatMarkdown('')).toBe('')
  })

  it('should convert links: [text](url) -> text (url)', () => {
    expect(formatMarkdown('Check out [Google](https://google.com)')).toBe('Check out Google (https://google.com)')
  })

  it('should convert images: ![alt](url) -> alt', () => {
    expect(formatMarkdown('Here is an image ![logo](https://example.com/logo.png)')).toBe('Here is an image logo')
  })

  it('should convert bold + italic: ***text*** or ___text___ -> *_text_*', () => {
    expect(formatMarkdown('This is ***really important***')).toBe('This is *_really important_*')
    expect(formatMarkdown('This is ___also important___')).toBe('This is *_also important_*')
  })

  it('should convert bold: **text** or __text__ -> *text*', () => {
    expect(formatMarkdown('This is **bold** text')).toBe('This is *bold* text')
    expect(formatMarkdown('This is __also bold__ text')).toBe('This is *also bold* text')
  })

  it('should convert italic: *text* -> _text_', () => {
    expect(formatMarkdown('This is *italic* text')).toBe('This is _italic_ text')
  })

  it('should prevent confusing italic with bold', () => {
    expect(formatMarkdown('This is **bold** and *italic*')).toBe('This is *bold* and _italic_')
  })

  it('should convert strikethrough: ~~text~~ -> ~text~', () => {
    expect(formatMarkdown('This is ~~deleted~~ text')).toBe('This is ~deleted~ text')
  })

  it('should convert headings: # text -> *text*', () => {
    expect(formatMarkdown('# Heading 1')).toBe('*Heading 1*')
    expect(formatMarkdown('### Heading 3')).toBe('*Heading 3*')
    expect(formatMarkdown('###### Heading 6')).toBe('*Heading 6*')
  })

  it('should remove horizontal rules', () => {
    expect(formatMarkdown('Before\n---\nAfter')).toBe('Before\n\nAfter')
    expect(formatMarkdown('Before\n***\nAfter')).toBe('Before\n\nAfter')
    expect(formatMarkdown('Before\n___\nAfter')).toBe('Before\n\nAfter')
  })

  it('should protect inline code from markdown formatting', () => {
    expect(formatMarkdown('Use `**bold** inside code`')).toBe('Use `**bold** inside code`')
  })

  it('should protect code blocks from markdown formatting', () => {
    const codeBlock = '```\n# Not a heading\n**Not bold**\n```'
    expect(formatMarkdown(codeBlock)).toBe(codeBlock)
  })

  it('should trim the resulting text', () => {
    expect(formatMarkdown('  **bold**  ')).toBe('*bold*')
  })

  it('should handle complex markdown combination', () => {
    const input = `
# Title
Check out this **bold** and *italic* and ***bold-italic*** text.
[Link](https://example.com)
![Image](https://example.com/img.png)
~~strikethrough~~
---
\`*inline*\`
\`\`\`
**block**
\`\`\`
`
    const expected = `
*Title*
Check out this *bold* and _italic_ and *_bold-italic_* text.
Link (https://example.com)
Image
~strikethrough~

\`*inline*\`
\`\`\`
**block**
\`\`\`
`.trim()
    expect(formatMarkdown(input)).toBe(expected)
  })

  it('should format key concept with emojis and bold', () => {
    const input = `### 🔑 **Key Concept**\nEstimated tax payments are **four quarterly installments** paid to the IRS (and state agencies if applicable) to cover taxes on income not subject to regular withholding (e.g., self-employment, rental income, capital gains).`
    const expected = `*🔑 Key Concept*\nEstimated tax payments are *four quarterly installments* paid to the IRS (and state agencies if applicable) to cover taxes on income not subject to regular withholding (e.g., self-employment, rental income, capital gains).`
    expect(formatMarkdown(input)).toBe(expected)
  })
})

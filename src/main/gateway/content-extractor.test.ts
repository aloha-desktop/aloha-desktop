import { describe, it, expect } from 'vitest'
import { extractMarkdownLinks, formatSimplifiedMarkdown } from './content-extractor'

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
    expect(formatSimplifiedMarkdown('')).toBe('')
  })

  it('should convert links: [text](url) -> text (url)', () => {
    expect(formatSimplifiedMarkdown('Check out [Google](https://google.com)')).toBe('Check out Google (https://google.com)')
  })

  it('should convert images: ![alt](url) -> alt', () => {
    expect(formatSimplifiedMarkdown('Here is an image ![logo](https://example.com/logo.png)')).toBe('Here is an image logo')
  })

  it('should convert bold + italic: ***text*** or ___text___ -> *_text_*', () => {
    expect(formatSimplifiedMarkdown('This is ***really important***')).toBe('This is *_really important_*')
    expect(formatSimplifiedMarkdown('This is ___also important___')).toBe('This is *_also important_*')
  })

  it('should convert bold: **text** or __text__ -> *text*', () => {
    expect(formatSimplifiedMarkdown('This is **bold** text')).toBe('This is *bold* text')
    expect(formatSimplifiedMarkdown('This is __also bold__ text')).toBe('This is *also bold* text')
  })

  it('should convert italic: *text* -> _text_', () => {
    expect(formatSimplifiedMarkdown('This is *italic* text')).toBe('This is _italic_ text')
  })

  it('should prevent confusing italic with bold', () => {
    expect(formatSimplifiedMarkdown('This is **bold** and *italic*')).toBe('This is *bold* and _italic_')
  })

  it('should convert strikethrough: ~~text~~ -> ~text~', () => {
    expect(formatSimplifiedMarkdown('This is ~~deleted~~ text')).toBe('This is ~deleted~ text')
  })

  it('should convert headings: # text -> *text*', () => {
    expect(formatSimplifiedMarkdown('# Heading 1')).toBe('*Heading 1*')
    expect(formatSimplifiedMarkdown('### Heading 3')).toBe('*Heading 3*')
    expect(formatSimplifiedMarkdown('###### Heading 6')).toBe('*Heading 6*')
  })

  it('should remove horizontal rules', () => {
    expect(formatSimplifiedMarkdown('Before\n---\nAfter')).toBe('Before\n\nAfter')
    expect(formatSimplifiedMarkdown('Before\n***\nAfter')).toBe('Before\n\nAfter')
    expect(formatSimplifiedMarkdown('Before\n___\nAfter')).toBe('Before\n\nAfter')
  })

  it('should protect inline code from markdown formatting', () => {
    expect(formatSimplifiedMarkdown('Use `**bold** inside code`')).toBe('Use `**bold** inside code`')
  })

  it('should protect code blocks from markdown formatting', () => {
    const codeBlock = '```\n# Not a heading\n**Not bold**\n```'
    expect(formatSimplifiedMarkdown(codeBlock)).toBe(codeBlock)
  })

  it('should trim the resulting text', () => {
    expect(formatSimplifiedMarkdown('  **bold**  ')).toBe('*bold*')
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
    expect(formatSimplifiedMarkdown(input)).toBe(expected)
  })

  it('should format key concept with emojis and bold', () => {
    const input = `### 🔑 **Key Concept**\nEstimated tax payments are **four quarterly installments** paid to the IRS (and state agencies if applicable) to cover taxes on income not subject to regular withholding (e.g., self-employment, rental income, capital gains).`
    const expected = `*🔑 Key Concept*\nEstimated tax payments are *four quarterly installments* paid to the IRS (and state agencies if applicable) to cover taxes on income not subject to regular withholding (e.g., self-employment, rental income, capital gains).`
    expect(formatSimplifiedMarkdown(input)).toBe(expected)
  })

  it('should format file:// links as text only without URL', () => {
    expect(formatSimplifiedMarkdown('[hotel.pdf](file:///Users/michaelf/Downloads/hotel.pdf)')).toBe('hotel.pdf')
  })

  it('should format file:// links with encoded characters as text only', () => {
    const input =
      '[Booking itinerary - Flight to San Francisco](file:///Users/michaelf/Downloads/2024%20US%20Tax%20Return/Travel/Gmail%20-%20Booking%20itinerary%20_%20eTicket%20#45729934%20-%20Flight%20to%20San%20Francisco.pdf)'
    expect(formatSimplifiedMarkdown(input)).toBe('Booking itinerary - Flight to San Francisco')
  })

  it('should format file:// links as text only while keeping HTTP links with URL', () => {
    const input = 'Check [Google](https://google.com) and [hotel.pdf](file:///Users/michaelf/Downloads/hotel.pdf)'
    expect(formatSimplifiedMarkdown(input)).toBe('Check Google (https://google.com) and hotel.pdf')
  })

  it('should handle bold file links as text only', () => {
    const input =
      '**[Booking itinerary - Flight to San Francisco](file:///Users/michaelf/Downloads/2024%20US%20Tax%20Return/Travel/Gmail%20-%20Booking%20itinerary%20_%20eTicket%20#45729934%20-%20Flight%20to%20San%20Francisco.pdf)**'
    expect(formatSimplifiedMarkdown(input)).toBe('*Booking itinerary - Flight to San Francisco*')
  })

  it('should handle multiple file links in a list', () => {
    const input = `Here are the most relevant booking reservation files found in your **Downloads** folder:

1. **[Booking itinerary - Flight to San Francisco](file:///Users/michaelf/Downloads/2024%20US%20Tax%20Return/Travel/Gmail%20-%20Booking%20itinerary%20_%20eTicket%20#45729934%20-%20Flight%20to%20San%20Francisco.pdf)**
   *(Contains flight reservations with eTicket #45729934)*

2. **[hotel.pdf](file:///Users/michaelf/Downloads/hotel.pdf)**
   *(Direct booking confirmation file)*`
    const expected = `Here are the most relevant booking reservation files found in your *Downloads* folder:

1. *Booking itinerary - Flight to San Francisco*
   _(Contains flight reservations with eTicket #45729934)_

2. *hotel.pdf*
   _(Direct booking confirmation file)_`
    expect(formatSimplifiedMarkdown(input)).toBe(expected)
  })
})

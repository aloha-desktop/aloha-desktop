import { describe, it, expect } from 'vitest'
import { extractMarkdownLinks } from './content-extractor'

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

import { describe, it, expect } from 'vitest';
import { stripHtml, stripHtmlMemoized, calculateReadTime } from './utils';

describe('stripHtml', () => {
  it('removes HTML tags', () => {
    expect(stripHtml('<p>Hello <strong>world</strong></p>')).toBe('Hello world');
  });

  it('decodes common HTML entities', () => {
    expect(stripHtml('&amp; &lt; &gt; &quot; &#39;')).toBe('& < > " \'');
  });

  it('replaces &nbsp; with space', () => {
    expect(stripHtml('Hello&nbsp;world')).toBe('Hello world');
  });

  it('normalizes whitespace', () => {
    expect(stripHtml('<p>Hello</p>   <p>World</p>')).toBe('Hello World');
  });

  it('returns empty string for empty/falsy input', () => {
    expect(stripHtml('')).toBe('');
    expect(stripHtml(undefined as unknown as string)).toBe('');
  });

  it('handles nested tags', () => {
    expect(stripHtml('<div><p><span>text</span></p></div>')).toBe('text');
  });
});

describe('stripHtmlMemoized', () => {
  it('returns same result as stripHtml', () => {
    const html = '<p>Test <em>content</em></p>';
    expect(stripHtmlMemoized(html)).toBe(stripHtml(html));
  });

  it('caches results for repeated calls', () => {
    const html = '<p>Cache test</p>';
    const first = stripHtmlMemoized(html);
    const second = stripHtmlMemoized(html);
    expect(first).toBe(second);
    expect(first).toBe('Cache test');
  });

  it('returns empty string for empty input', () => {
    expect(stripHtmlMemoized('')).toBe('');
  });
});

describe('calculateReadTime', () => {
  it('returns 1 for empty content', () => {
    expect(calculateReadTime('')).toBe(1);
  });

  it('calculates read time from plain text', () => {
    // 400 words at 200 wpm = 2 minutes
    const words = Array(400).fill('word').join(' ');
    expect(calculateReadTime(words)).toBe(2);
  });

  it('strips HTML before counting words', () => {
    const html = '<p>' + Array(200).fill('word').join(' ') + '</p>';
    expect(calculateReadTime(html)).toBe(1);
  });

  it('rounds up to nearest minute', () => {
    // 250 words at 200 wpm = 1.25, ceil = 2
    const words = Array(250).fill('word').join(' ');
    expect(calculateReadTime(words)).toBe(2);
  });

  it('respects custom wordsPerMinute', () => {
    const words = Array(300).fill('word').join(' ');
    expect(calculateReadTime(words, 100)).toBe(3);
  });

  it('returns minimum of 1 minute', () => {
    expect(calculateReadTime('short')).toBe(1);
  });
});

import { describe, it, expect } from 'vitest';
import { extractServerPreview } from './preview';

describe('extractServerPreview', () => {
  const fullContent = [
    '<p>First paragraph of the article.</p>',
    '<p>Second paragraph with more detail.</p>',
    '<p>Third paragraph wrapping up the intro.</p>',
    '<p>Fourth paragraph — premium content starts here.</p>',
    '<p>Fifth paragraph with exclusive analysis.</p>',
    '<p>Sixth paragraph conclusion.</p>',
  ].join('');

  it('extracts the first 3 paragraphs by default', () => {
    const preview = extractServerPreview(fullContent);

    expect(preview).toContain('First paragraph');
    expect(preview).toContain('Second paragraph');
    expect(preview).toContain('Third paragraph');
    expect(preview).not.toContain('Fourth paragraph');
    expect(preview).not.toContain('Fifth paragraph');
    expect(preview).not.toContain('Sixth paragraph');
  });

  it('respects custom paragraph count', () => {
    const preview = extractServerPreview(fullContent, 2);

    expect(preview).toContain('First paragraph');
    expect(preview).toContain('Second paragraph');
    expect(preview).not.toContain('Third paragraph');
  });

  it('returns all paragraphs when count exceeds available', () => {
    const short = '<p>Only one.</p>';
    const preview = extractServerPreview(short, 3);

    expect(preview).toBe('<p>Only one.</p>');
  });

  it('returns empty string for content with no paragraphs', () => {
    const preview = extractServerPreview('<div>Not a paragraph</div><h1>Heading</h1>');

    expect(preview).toBe('');
  });

  it('handles paragraphs with attributes', () => {
    const html = '<p class="intro">Styled first.</p><p data-id="2">Second.</p><p>Third.</p><p>Fourth.</p>';
    const preview = extractServerPreview(html, 3);

    expect(preview).toContain('Styled first.');
    expect(preview).toContain('Second.');
    expect(preview).toContain('Third.');
    expect(preview).not.toContain('Fourth.');
  });

  it('handles paragraphs with nested HTML (bold, links, etc.)', () => {
    const html = '<p>Text with <strong>bold</strong> and <a href="#">links</a>.</p><p>Second.</p><p>Third.</p><p>Hidden.</p>';
    const preview = extractServerPreview(html, 3);

    expect(preview).toContain('<strong>bold</strong>');
    expect(preview).toContain('<a href="#">links</a>');
    expect(preview).not.toContain('Hidden.');
  });

  it('strips content beyond the preview — no premium text leaks', () => {
    const article = [
      '<p>Free intro paragraph.</p>',
      '<p>Free second paragraph.</p>',
      '<p>Free third paragraph.</p>',
      '<p>PREMIUM: This is the secret exclusive content behind the paywall.</p>',
      '<p>PREMIUM: More exclusive analysis only for subscribers.</p>',
    ].join('');

    const preview = extractServerPreview(article, 3);

    expect(preview).not.toContain('PREMIUM');
    expect(preview).not.toContain('secret exclusive');
    expect(preview).not.toContain('subscribers');
  });

  it('returns empty string for empty input', () => {
    expect(extractServerPreview('')).toBe('');
  });
});

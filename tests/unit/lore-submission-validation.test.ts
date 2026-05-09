import {
  getYouTubeNoCookieEmbedUrl,
  loreSubmissionCreateSchema,
  normalizeAndDeduplicateLinks,
  normalizeLoreSubmissionUrl,
  normalizeTags,
} from '@/lib/lore/submissions/validation';

describe('lore submission validation and URL normalization', () => {
  it('normalizes and deduplicates tags', () => {
    expect(normalizeTags(['  #Battle  ', 'battle', 'Dark   Forest'])).toEqual([
      'battle',
      'dark forest',
    ]);
  });

  it('normalizes Twitter/X status URLs to x.com status URLs', () => {
    expect(normalizeLoreSubmissionUrl('https://mobile.twitter.com/wagdie/status/123456789?foo=bar')).toEqual({
      linkType: 'twitter',
      normalizedUrl: 'https://x.com/wagdie/status/123456789',
      platform: 'Twitter/X',
      metadata: {},
    });
  });

  it('normalizes supported YouTube URLs and derives deterministic nocookie embeds', () => {
    const result = normalizeLoreSubmissionUrl('https://youtu.be/dQw4w9WgXcQ?t=43');

    expect(result).toEqual({
      linkType: 'youtube',
      normalizedUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      platform: 'YouTube',
      metadata: {
        youtubeVideoId: 'dQw4w9WgXcQ',
        youtubeEmbedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
      },
    });
    expect(getYouTubeNoCookieEmbedUrl('dQw4w9WgXcQ')).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'
    );
  });

  it('normalizes generic URLs for deterministic deduplication', () => {
    const result = normalizeLoreSubmissionUrl('HTTPS://Example.COM:443/path?b=2&a=1#section');

    expect(result).toEqual({
      linkType: 'generic',
      normalizedUrl: 'https://example.com/path?a=1&b=2',
      metadata: {},
    });
  });

  it('deduplicates links by normalized URL while preserving first metadata', () => {
    const links = normalizeAndDeduplicateLinks([
      { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', displayTitle: 'First' },
      { url: 'https://youtu.be/dQw4w9WgXcQ?t=10', displayTitle: 'Duplicate' },
      { url: 'https://example.com/?b=2&a=1' },
      { url: 'https://example.com/?a=1&b=2' },
    ]);

    expect(links).toHaveLength(2);
    expect(links[0].displayTitle).toBe('First');
    expect(links.map((link) => link.normalizedUrl)).toEqual([
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://example.com/?a=1&b=2',
    ]);
  });

  it('rejects invalid protocols and unsupported social URL shapes', () => {
    expect(() => normalizeLoreSubmissionUrl('javascript:alert(1)')).toThrow('URL must use http or https');
    expect(() => normalizeLoreSubmissionUrl('https://x.com/wagdie')).toThrow(
      'Twitter/X URL must be a status URL'
    );
  });

  it('parses a valid create payload into normalized DTO shape', () => {
    const parsed = loreSubmissionCreateSchema.parse({
      tokenId: '42',
      title: 'A Fallen Bell Rings',
      summary: 'A community account of a strange bell echoing after the searing.',
      bodyMarkdown: '# Report\n\nA bell rang beneath the ash.',
      tags: ['#Searing', 'searing', ' Bell '],
      links: [{ url: 'https://www.youtube.com/shorts/dQw4w9WgXcQ' }],
    });

    expect(parsed.tags).toEqual(['searing', 'bell']);
    expect(parsed.links[0]).toMatchObject({
      linkType: 'youtube',
      normalizedUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    });
  });

  it('rejects non-canonical or out-of-range token ids', () => {
    for (const tokenId of ['0', '0001', '6667']) {
      const parsed = loreSubmissionCreateSchema.safeParse({
        tokenId,
        title: 'A valid title',
        summary: 'A summary long enough to satisfy the validation requirements.',
        bodyMarkdown: 'Body',
        tags: [],
        links: [{ url: 'https://example.com/source' }],
      });

      expect(parsed.success).toBe(false);
    }
  });

  it('returns field errors for payloads outside limits', () => {
    const parsed = loreSubmissionCreateSchema.safeParse({
      tokenId: 'abc',
      title: 'No',
      summary: 'too short',
      bodyMarkdown: '',
      tags: Array.from({ length: 11 }, (_, index) => `tag-${index}`),
      links: [],
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const fields = new Set(parsed.error.issues.map((issue) => issue.path[0]));
      expect(fields).toEqual(new Set(['tokenId', 'title', 'summary', 'bodyMarkdown', 'tags', 'links']));
    }
  });
});

// Hacker News Algolia API client
// API Docs: https://hn.algolia.com/api

interface HackerNewsSearchOptions {
  tags?: string; // Filter by tags: 'story', 'ask_hn', 'show_hn', 'job', 'poll'
  hitsPerPage?: number; // Results per page (default: 20)
  page?: number; // Page number (0-indexed)
  numericFilters?: string; // Numeric constraints like 'points>100'
}

interface HackerNewsHit {
  objectID: string;
  title: string;
  url?: string;
  author: string;
  points: number;
  num_comments: number;
  created_at: string;
  created_at_i: number;
  story_id: number;
  _tags: string[];
  story_text?: string;
}

interface HackerNewsResponse {
  hits: HackerNewsHit[];
  nbHits: number;
  page: number;
  nbPages: number;
  hitsPerPage: number;
  processingTimeMS: number;
}

// Result format matching Discover page expectations
export interface HackerNewsResult {
  title: string;
  url: string;
  thumbnail?: string;
  content?: string;
  author?: string;
  points?: number;
  num_comments?: number;
}

/**
 * Search Hacker News using the Algolia API
 * @param query - Search terms (optional - omit to get trending/recent stories)
 * @param opts - Search options (tags, pagination, filters)
 * @returns Normalized results matching Discover interface
 */
export const searchHackerNews = async (
  query?: string,
  opts?: HackerNewsSearchOptions,
): Promise<{ results: HackerNewsResult[] }> => {
  // Use search_by_date for recency, or search for relevance
  const endpoint = 'https://hn.algolia.com/api/v1/search';

  const url = new URL(endpoint);

  // Add query if provided
  if (query) {
    url.searchParams.append('query', query);
  }

  // Add optional parameters
  if (opts) {
    if (opts.tags) {
      url.searchParams.append('tags', opts.tags);
    }
    if (opts.hitsPerPage) {
      url.searchParams.append('hitsPerPage', opts.hitsPerPage.toString());
    }
    if (opts.page !== undefined) {
      url.searchParams.append('page', opts.page.toString());
    }
    if (opts.numericFilters) {
      url.searchParams.append('numericFilters', opts.numericFilters);
    }
  }

  try {
    const res = await fetch(url.toString());

    if (!res.ok) {
      throw new Error(`HN API request failed: ${res.status} ${res.statusText}`);
    }

    const data: HackerNewsResponse = await res.json();

    // Normalize results to match Discover page format
    const results: HackerNewsResult[] = data.hits.map((hit) => ({
      title: hit.title,
      // Use actual URL if available, otherwise link to HN discussion
      url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
      // Use HN logo as placeholder thumbnail (must be full URL for Next.js Image component)
      thumbnail: 'https://news.ycombinator.com/y18.svg',
      // Use story text as content preview, or title as fallback
      content: hit.story_text || hit.title,
      author: hit.author,
      points: hit.points,
      num_comments: hit.num_comments,
    }));

    return { results };
  } catch (error) {
    console.error('Error fetching from Hacker News API:', error);
    throw error;
  }
};

/**
 * Get recent Hacker News stories by date
 * @param query - Search terms (optional)
 * @param opts - Search options
 * @returns Recent stories sorted by date
 */
export const searchHackerNewsByDate = async (
  query?: string,
  opts?: HackerNewsSearchOptions,
): Promise<{ results: HackerNewsResult[] }> => {
  const endpoint = 'https://hn.algolia.com/api/v1/search_by_date';

  const url = new URL(endpoint);

  if (query) {
    url.searchParams.append('query', query);
  }

  if (opts) {
    if (opts.tags) {
      url.searchParams.append('tags', opts.tags);
    }
    if (opts.hitsPerPage) {
      url.searchParams.append('hitsPerPage', opts.hitsPerPage.toString());
    }
    if (opts.page !== undefined) {
      url.searchParams.append('page', opts.page.toString());
    }
    if (opts.numericFilters) {
      url.searchParams.append('numericFilters', opts.numericFilters);
    }
  }

  try {
    const res = await fetch(url.toString());

    if (!res.ok) {
      throw new Error(`HN API request failed: ${res.status} ${res.statusText}`);
    }

    const data: HackerNewsResponse = await res.json();

    const results: HackerNewsResult[] = data.hits.map((hit) => ({
      title: hit.title,
      url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
      thumbnail: 'https://news.ycombinator.com/y18.svg',
      content: hit.story_text || hit.title,
      author: hit.author,
      points: hit.points,
      num_comments: hit.num_comments,
    }));

    return { results };
  } catch (error) {
    console.error('Error fetching from Hacker News API:', error);
    throw error;
  }
};

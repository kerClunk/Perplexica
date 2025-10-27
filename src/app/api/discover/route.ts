import { searchSearxng } from '@/lib/searxng';
import { searchHackerNews } from '@/lib/hackernews';

const websitesForTopic = {
  ai: {
    query: ['artificial intelligence', 'machine learning', 'ChatGPT', 'AI research', 'neural networks', 'deep learning'],
    links: ['techcrunch.com', 'wired.com', 'theverge.com', 'arstechnica.com', 'venturebeat.com'],
    hnQuery: 'AI machine learning', // HN search terms for this category
  },
  tech: {
    query: ['technology news', 'latest tech', 'science and innovation', 'software development'],
    links: ['techcrunch.com', 'wired.com', 'theverge.com', 'arstechnica.com'],
    hnQuery: 'programming technology',
  },
  opensource: {
    query: ['open source', 'developer tools', 'GitHub', 'software development', 'programming'],
    links: ['techcrunch.com', 'theverge.com', 'arstechnica.com', 'zdnet.com'],
    hnQuery: 'open source',
  },
  security: {
    query: ['cybersecurity', 'security vulnerabilities', 'data breaches', 'infosec', 'hacking'],
    links: ['krebsonsecurity.com', 'thehackernews.com', 'bleepingcomputer.com', 'threatpost.com'],
    hnQuery: 'security cybersecurity',
  },
  linux: {
    query: ['Linux', 'open source', 'Ubuntu', 'server', 'cloud computing'],
    links: ['arstechnica.com', 'zdnet.com', 'theregister.com', 'techcrunch.com'],
    hnQuery: 'linux',
  },
};

type Topic = keyof typeof websitesForTopic;

export const GET = async (req: Request) => {
  try {
    const params = new URL(req.url).searchParams;

    const mode: 'normal' | 'preview' =
      (params.get('mode') as 'normal' | 'preview') || 'normal';
    const topic: Topic = (params.get('topic') as Topic) || 'ai';

    const selectedTopic = websitesForTopic[topic];

    let data = [];

    if (mode === 'normal') {
      const seenUrls = new Set();

      // Fetch both news articles and HN stories in parallel
      const [newsResults, hnResults] = await Promise.all([
        // Fetch news articles from traditional sources
        Promise.all(
          selectedTopic.links.flatMap((link) =>
            selectedTopic.query.map(async (query) => {
              return (
                await searchSearxng(`site:${link} ${query}`, {
                  engines: ['bing news'],
                  pageno: 1,
                  language: 'en',
                })
              ).results;
            }),
          ),
        ),
        // Fetch HN stories for this topic
        searchHackerNews(selectedTopic.hnQuery, {
          tags: 'story',
          hitsPerPage: 15, // Get ~15 HN stories to mix in
        }),
      ]);

      // Combine and deduplicate
      data = [...newsResults.flat(), ...hnResults.results]
        .filter((item) => {
          const url = item.url?.toLowerCase().trim();
          if (seenUrls.has(url)) return false;
          seenUrls.add(url);
          return true;
        })
        .sort(() => Math.random() - 0.5); // Shuffle to mix HN and news
    } else {
      // Preview mode: random source
      data = (
        await searchSearxng(
          `site:${selectedTopic.links[Math.floor(Math.random() * selectedTopic.links.length)]} ${selectedTopic.query[Math.floor(Math.random() * selectedTopic.query.length)]}`,
          {
            engines: ['bing news'],
            pageno: 1,
            language: 'en',
          },
        )
      ).results;
    }

    return Response.json(
      {
        blogs: data,
      },
      {
        status: 200,
      },
    );
  } catch (err) {
    console.error(`An error occurred in discover route: ${err}`);
    return Response.json(
      {
        message: 'An error has occurred',
      },
      {
        status: 500,
      },
    );
  }
};

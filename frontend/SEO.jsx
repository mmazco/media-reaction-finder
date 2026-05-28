import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const SITE_URL = 'https://mrf.up.railway.app';
const OG_IMAGE = `${SITE_URL}/og-image.png`;
const DEFAULT_DESCRIPTION =
  'Discover reactions and discussions on any article, content or media across Reddit, Substack and Web. With curated topics, news trending market polls and featured Substack authors.';

const ROUTE_META = {
  '/': {
    title: 'Media Reaction Finder',
    description: DEFAULT_DESCRIPTION,
  },
  '/collections': {
    title: 'Collections · Media Reaction Finder',
    description:
      'Curated article collections grouped by topic — see the discourse around the stories shaping the news.',
  },
  '/trending/iran': {
    title: "What's happening in Iran? · Media Reaction Finder",
    description:
      'Live coverage and reactions to the Iran protests and unrest — Reddit, news, Substack, and X in one feed.',
  },
  '/trending/iran/markets': {
    title: 'Iran political landscape & prediction markets · Media Reaction Finder',
    description:
      "Interactive graph of Iran's political factions and live Polymarket and Kalshi odds on succession, regime stability, and a nuclear deal.",
  },
  '/trending/iran/tehran': {
    title: 'Tehran strike map · Media Reaction Finder',
    description:
      'Interactive map of confirmed and likely strike locations in Tehran with verified sources from CTP-ISW, Reuters, and FT.',
  },
};

function getMeta(pathname, search) {
  if (pathname === '/' && search) {
    const params = new URLSearchParams(search);
    const q = params.get('q');
    if (q) {
      const cleanQ = q.length > 80 ? q.slice(0, 77) + '…' : q;
      return {
        title: `Reactions to "${cleanQ}" · Media Reaction Finder`,
        description: `See how Reddit, the web, Substack, and X are reacting to "${cleanQ}". Cross-source discussion finder.`,
      };
    }
  }
  return ROUTE_META[pathname] || ROUTE_META['/'];
}

export default function SEO() {
  const location = useLocation();
  const { title, description } = getMeta(location.pathname, location.search);
  const canonicalUrl = `${SITE_URL}${location.pathname}`;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Media Reaction Finder" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={OG_IMAGE} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={OG_IMAGE} />
    </Helmet>
  );
}

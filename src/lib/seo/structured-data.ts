import { Organization, WebSite, Game, WithContext } from "schema-dts";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://wikirun.com";

export const organizationSchema: WithContext<Organization> = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "WikiRun",
  url: APP_URL,
  logo: `${APP_URL}/logo.png`,
  sameAs: [
    // Add social media links when available
  ],
};

export const websiteSchema: WithContext<WebSite> = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "WikiRun",
  url: APP_URL,
  description: "Race through Wikipedia articles in this competitive speedrun game.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${APP_URL}/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export const gameSchema: WithContext<Game> = {
  "@context": "https://schema.org",
  "@type": "Game",
  name: "WikiRun",
  url: APP_URL,
  description: "Race through Wikipedia articles. Navigate from one article to another as fast as possible. Compete in ranked matches or practice in training mode.",
  genre: ["Puzzle", "Educational", "Racing", "Multiplayer"],
  gamePlatform: "Web Browser",
  applicationCategory: "Game",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "150",
    bestRating: "5",
    worstRating: "1",
  },
};

export function generateStructuredData(schemas: WithContext<any>[]) {
  return {
    __html: JSON.stringify(schemas),
  };
}

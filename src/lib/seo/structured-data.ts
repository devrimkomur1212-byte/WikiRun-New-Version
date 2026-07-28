const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.wiki-speedrun.com";

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "WikiRun",
  url: APP_URL,
  logo: `${APP_URL}/logo.png`,
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "WikiRun",
  url: APP_URL,
  description: "Race through Wikipedia articles in this competitive speedrun game.",
};

export const gameSchema = {
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
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function generateStructuredData(schemas: Record<string, any>[]) {
  return {
    __html: JSON.stringify(schemas),
  };
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.wiki-speedrun.com";

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "WikiRun",
  url: APP_URL,
  logo: `${APP_URL}/android-chrome-512x512.png`,
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "WikiRun",
  alternateName: "WikiRun - Wikipedia Speedrun Game",
  url: APP_URL,
  description: "A free Wikipedia speedrun game. Race from one Wikipedia article to another using only the links on the page.",
};

export const gameSchema = {
  "@context": "https://schema.org",
  "@type": "Game",
  name: "WikiRun",
  alternateName: "Wikipedia Speedrun",
  url: APP_URL,
  description: "WikiRun is a free Wikipedia speedrun game. Race from one Wikipedia article to another in as few clicks as possible, compete in real-time ranked 1v1 matches, and climb the ELO leaderboard.",
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

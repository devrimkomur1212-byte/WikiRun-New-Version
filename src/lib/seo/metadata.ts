import { Metadata } from "next";

const APP_NAME = "WikiRun";
const APP_DESCRIPTION = "Race through Wikipedia articles in this competitive speedrun game. Navigate from one article to another as fast as possible. Compete in ranked matches or practice in training mode.";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.wiki-speedrun.com";

export const baseMetadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `${APP_NAME} - Wikipedia Speedrun Game`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  authors: [{ name: APP_NAME }],
  generator: "Next.js",
  keywords: [
    "wikipedia",
    "speedrun",
    "game",
    "racing",
    "puzzle",
    "educational",
    "competitive",
    "multiplayer",
    "elo",
    "ranking",
    "leaderboard",
    "wikipedia game",
    "trivia",
    "knowledge",
  ],
  referrer: "origin-when-cross-origin",
  creator: APP_NAME,
  publisher: APP_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: APP_URL,
    siteName: APP_NAME,
    title: `${APP_NAME} - Wikipedia Speedrun Game`,
    description: APP_DESCRIPTION,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${APP_NAME} - Race through Wikipedia`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} - Wikipedia Speedrun Game`,
    description: APP_DESCRIPTION,
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: APP_URL,
  },
};

export function createPageMetadata(
  title: string,
  description?: string,
  path?: string,
  ogImage?: string
): Metadata {
  const url = path ? `${APP_URL}${path}` : APP_URL;
  const ogImageUrl = ogImage || "/og-image.png";

  return {
    title,
    description: description || APP_DESCRIPTION,
    openGraph: {
      title: `${title} | ${APP_NAME}`,
      description: description || APP_DESCRIPTION,
      url,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${APP_NAME}`,
      description: description || APP_DESCRIPTION,
      images: [ogImageUrl],
    },
    alternates: {
      canonical: url,
    },
  };
}

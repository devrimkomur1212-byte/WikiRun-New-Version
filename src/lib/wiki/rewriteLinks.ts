/**
 * Rewrites Wikipedia links to internal app routes and extracts link titles
 * Returns both the rewritten HTML and the list of outgoing links
 * This runs on the client side after the HTML is loaded
 */
export function rewriteWikiLinks(html: string, runId: string): {
  html: string;
  outgoingLinks: string[];
} {
  // Check if we're in the browser
  if (typeof document === 'undefined') {
    console.error('rewriteWikiLinks called on server side');
    return { html, outgoingLinks: [] };
  }

  try {
    // Create a temporary container to manipulate the HTML
    const container = document.createElement("div");
    container.innerHTML = html;

    // Find all internal wiki links
    const links = container.querySelectorAll('a[href^="/wiki/"]');
    const outgoingLinkTitles: string[] = [];

    links.forEach((link) => {
      const href = link.getAttribute("href");
      if (!href) return;

      // Extract the title from the href
      // Format: /wiki/Article_Title or /wiki/Article_Title#Section
      const match = href.match(/^\/wiki\/([^#]+)(#.*)?$/);
      if (!match) return;

      const encodedTitle = match[1];
      const hash = match[2] || "";

      // Skip special pages (File:, Template:, Category:, etc.)
      if (
        encodedTitle.includes(":") &&
        !encodedTitle.startsWith("Portal:") &&
        !encodedTitle.startsWith("Book:")
      ) {
        // Disable these links
        link.setAttribute("href", "#");
        link.setAttribute("onclick", "return false;");
        (link as HTMLElement).classList.add("wiki-disabled-link");
        return;
      }

      // Decode the title for display
      const title = decodeURIComponent(encodedTitle.replace(/_/g, " "));

      // Add to outgoing links list
      outgoingLinkTitles.push(title);

      // Create the internal route
      const internalHref = `/run/${runId}/article/${encodeURIComponent(title)}${hash}`;

      link.setAttribute("href", internalHref);
      link.setAttribute("data-wiki-link", "true");
      link.setAttribute("data-wiki-title", title);
    });

    // Disable external links
    const externalLinks = container.querySelectorAll(
      'a[href^="http"], a[href^="//"]'
    );
    externalLinks.forEach((link) => {
      link.setAttribute("onclick", "return false;");
      (link as HTMLElement).classList.add("wiki-external-link");
    });

    // Remove citation links (they point to footnotes which don't work in our context)
    const citationLinks = container.querySelectorAll('a[href^="#cite_"]');
    citationLinks.forEach((link) => {
      link.setAttribute("onclick", "return false;");
      (link as HTMLElement).classList.add("wiki-citation-link");
    });

    // Remove edit links
    const editSections = container.querySelectorAll(".mw-editsection");
    editSections.forEach((section) => section.remove());

    // Remove navboxes and other non-content elements
    const elementsToRemove = container.querySelectorAll(
      ".navbox, .vertical-navbox, .sistersitebox, .metadata, .ambox, .dmbox, .tmbox, .fmbox, .ombox, .mbox-small, .infobox, .sidebar"
    );
    elementsToRemove.forEach((el) => {
      // Keep infoboxes but style them differently
      if (el.classList.contains("infobox")) {
        (el as HTMLElement).classList.add("wiki-infobox");
        return;
      }
      el.remove();
    });

    return {
      html: container.innerHTML,
      outgoingLinks: [...new Set(outgoingLinkTitles)], // Remove duplicates
    };
  } catch (error) {
    console.error('Error in rewriteWikiLinks:', error);
    return { html, outgoingLinks: [] };
  }
}

/**
 * Extracts all wiki link titles from HTML
 * Used for checking if target is directly reachable
 */
export function extractWikiLinksFromHtml(html: string): string[] {
  const container = document.createElement("div");
  container.innerHTML = html;

  const links = container.querySelectorAll('a[href^="/wiki/"]');
  const titles: string[] = [];

  links.forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;

    const match = href.match(/^\/wiki\/([^#]+)/);
    if (!match) return;

    const encodedTitle = match[1];

    // Skip special pages
    if (encodedTitle.includes(":")) return;

    const title = decodeURIComponent(encodedTitle.replace(/_/g, " "));
    titles.push(title);
  });

  return [...new Set(titles)]; // Remove duplicates
}

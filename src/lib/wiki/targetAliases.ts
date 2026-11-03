/**
 * Every title that lands on the target article, lowercased: the target as
 * stored, its resolved title, and all redirects pointing at it. Article links
 * often use a redirect ("King Midas" for Midas), so comparing against the
 * target's title alone misses them.
 *
 * Only ever adds to a plain title match, so a failed lookup degrades to that.
 */
export async function fetchTargetAliases(targetTitle: string): Promise<string[]> {
  const params = new URLSearchParams({
    action: "query",
    titles: targetTitle,
    redirects: "1",
    prop: "redirects",
    rdprop: "title",
    rdnamespace: "0",
    rdlimit: "max",
    format: "json",
    formatversion: "2",
    origin: "*",
  });

  const res = await fetch(`https://en.wikipedia.org/w/api.php?${params}`);
  const data = await res.json();

  const page = data.query?.pages?.[0] as
    | { title?: string; redirects?: { title: string }[] }
    | undefined;

  const titles = [
    targetTitle,
    page?.title ?? targetTitle,
    ...(page?.redirects ?? []).map((redirect) => redirect.title),
  ];

  return [...new Set(titles.map((title) => title.toLowerCase()))];
}

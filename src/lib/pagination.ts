export const RECORDS_PAGE_SIZE = 24;

const MAX_PAGE = 10_000;

export function parsePageParam(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate || !/^\d+$/.test(candidate)) return 1;

  const page = Number(candidate);
  return Number.isSafeInteger(page) && page >= 1 ? Math.min(page, MAX_PAGE) : 1;
}

export function getPageRange(page: number, pageSize = RECORDS_PAGE_SIZE) {
  const from = (page - 1) * pageSize;
  return { from, to: from + pageSize };
}

export function takePage<T>(items: T[], pageSize = RECORDS_PAGE_SIZE) {
  return {
    items: items.slice(0, pageSize),
    hasNextPage: items.length > pageSize,
  };
}

export function getPageHref(
  pathname: string,
  searchParams: Record<string, string | string[] | undefined>,
  pageParam: string,
  page: number,
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (
      key === pageParam ||
      key === "added" ||
      key === "removed" ||
      value === undefined
    ) {
      continue;
    }
    for (const entry of Array.isArray(value) ? value : [value]) {
      params.append(key, entry);
    }
  }

  if (page > 1) params.set(pageParam, String(page));
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

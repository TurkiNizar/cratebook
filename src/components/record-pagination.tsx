import Link from "next/link";

type RecordPaginationProps = {
  page: number;
  hasNextPage: boolean;
  previousHref: string;
  nextHref: string;
  label: string;
};

export function RecordPagination({
  page,
  hasNextPage,
  previousHref,
  nextHref,
  label,
}: RecordPaginationProps) {
  if (page === 1 && !hasNextPage) return null;

  return (
    <nav className="record-pagination" aria-label={label}>
      {page > 1 ? (
        <Link className="secondary-button" href={previousHref} scroll>
          Previous
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}
      <span>Page {page}</span>
      {hasNextPage ? (
        <Link className="secondary-button" href={nextHref} scroll>
          Next
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}
    </nav>
  );
}

import {
  getCollectionCardDetails,
  getCollectionCardEdition,
  type CollectionReleaseSummary,
} from "@/lib/collection";

export type CollectionCardItem = {
  id: string;
  release: CollectionReleaseSummary & {
    artist_display: string;
    title: string;
  };
};

export function CollectionCard({ item }: { item: CollectionCardItem }) {
  const { release } = item;
  const titleId = `collection-title-${item.id}`;
  const details = getCollectionCardDetails(release);
  const edition = getCollectionCardEdition(release);

  return (
    <article className="collection-card" aria-labelledby={titleId}>
      <div className="collection-cover" aria-hidden="true">
        <span>{release.title.slice(0, 1).toUpperCase()}</span>
      </div>
      <div className="collection-card-copy">
        <h2 id={titleId}>{release.title}</h2>
        <p className="collection-artist">{release.artist_display}</p>
        {details.length > 0 ? (
          <ul className="collection-meta" aria-label="Release details">
            {details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        ) : null}
        {edition ? <p className="collection-edition">{edition}</p> : null}
      </div>
    </article>
  );
}

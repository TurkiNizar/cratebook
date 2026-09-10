import Link from "next/link";

import {
  COLLECTION_SORT_OPTIONS,
  type CollectionControls as CollectionControlsValue,
} from "@/lib/collection";
import {
  PURCHASE_STATE_OPTIONS,
  RECORD_CONDITION_OPTIONS,
  RELEASE_FORMAT_OPTIONS,
} from "@/lib/record";

type CollectionControlsProps = {
  controls: CollectionControlsValue;
};

export function CollectionControls({ controls }: CollectionControlsProps) {
  return (
    <form className="collection-controls" action="/collection" role="search">
      <div className="collection-search-row">
        <div className="field collection-search-field">
          <label htmlFor="collection-query">Search your collection</label>
          <input
            id="collection-query"
            name="q"
            type="search"
            defaultValue={controls.query}
            maxLength={200}
            placeholder="Artist, title, label, tag, or note"
          />
        </div>
        <div className="collection-search-actions">
          {controls.isActive ? (
            <Link className="secondary-button" href="/collection">
              Clear
            </Link>
          ) : null}
          <button className="button button-small" type="submit">
            Search
          </button>
        </div>
      </div>

      <details
        className="collection-filter-panel"
        {...(controls.isActive ? { open: true } : {})}
      >
        <summary>
          <span>Filters and sorting</span>
          {controls.isActive ? <strong>Active</strong> : null}
        </summary>
        <div className="collection-filter-grid">
          <div className="field">
            <label htmlFor="collection-purchase">Bought as</label>
            <select
              id="collection-purchase"
              name="purchase"
              defaultValue={controls.purchaseState}
            >
              <option value="">Any purchase state</option>
              {PURCHASE_STATE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="collection-format">Format</label>
            <select
              id="collection-format"
              name="format"
              defaultValue={controls.format}
            >
              <option value="">Any format</option>
              {RELEASE_FORMAT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="collection-condition">Condition</label>
            <select
              id="collection-condition"
              name="condition"
              defaultValue={controls.condition}
            >
              <option value="">Any media or sleeve condition</option>
              {RECORD_CONDITION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="collection-sort">Sort by</label>
            <select
              id="collection-sort"
              name="sort"
              defaultValue={controls.sort}
            >
              {COLLECTION_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="collection-filter-actions">
          <label className="checkbox-field" htmlFor="collection-favorite">
            <input
              id="collection-favorite"
              name="favorite"
              type="checkbox"
              value="1"
              defaultChecked={controls.favorite}
            />
            <span>
              <strong>Favorites only</strong>
              <small>Show records marked with a star.</small>
            </span>
          </label>
          <div>
            <button className="button button-small" type="submit">
              Apply
            </button>
          </div>
        </div>
      </details>
    </form>
  );
}

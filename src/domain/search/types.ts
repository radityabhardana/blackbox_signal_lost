import type { SearchIndexEntry } from "../../content/schemas";

export type SearchableEntityType = SearchIndexEntry["entityType"];

/**
 * Public search result. Discriminated so a classified placeholder can never
 * leak authored metadata (title, matchedTerm, rank, terms, tier).
 */
export type SearchResult =
  | {
      entityId: string;
      entityType: SearchableEntityType;
      available: true;
      title: string;
      matchedTerm: string;
    }
  | {
      entityId: string;
      entityType: SearchableEntityType;
      available: false;
    };

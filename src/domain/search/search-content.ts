import type { CaseManifest, SearchIndexEntry } from "../../content/schemas";
import { evaluateRule } from "../rules";
import type { RuleEvaluationContext } from "../rules";
import { normalizeTerm } from "./normalize";
import type { SearchResult } from "./types";

type MatchTier = "exact_title" | "exact_term" | "alias" | "partial";

const TIER_ORDER: readonly MatchTier[] = ["exact_title", "exact_term", "alias", "partial"];

/** Internal-only candidate. Tier, rank, and declaration index never leave this module. */
interface SearchCandidate {
  entry: SearchIndexEntry;
  index: number;
  tier: MatchTier;
  matchedTerm: string;
}

/**
 * Pure deterministic authored search over a validated searchableIndex.
 *
 * Normalizes the query, produces at most one candidate per entry (highest
 * precedence tier wins; first authored term in array order inside a tier),
 * ranks by tier -> authoredRank descending -> declaration order, then applies
 * availability gates. `hidden` removes a candidate; `classified_placeholder`
 * keeps its ranked position but is sanitized to available:false.
 */
export function searchContent(
  query: string,
  content: Pick<CaseManifest, "searchableIndex">,
  gateContext: RuleEvaluationContext,
): SearchResult[] {
  const normalizedQuery = normalizeTerm(query);
  if (normalizedQuery.length === 0) return [];

  const candidates: SearchCandidate[] = [];
  content.searchableIndex.forEach((entry, index) => {
    const match = bestMatch(entry, normalizedQuery);
    if (match) {
      candidates.push({ entry, index, tier: match.tier, matchedTerm: match.matchedTerm });
    }
  });

  const ranked = candidates.sort((a, b) => {
    const tierDifference = TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier);
    if (tierDifference !== 0) return tierDifference;
    if (b.entry.authoredRank !== a.entry.authoredRank) return b.entry.authoredRank - a.entry.authoredRank;
    return a.index - b.index;
  });

  const results: SearchResult[] = [];
  for (const candidate of ranked) {
    if (evaluateRule(candidate.entry.availabilityRule, gateContext)) {
      results.push({
        entityId: candidate.entry.entityId,
        entityType: candidate.entry.entityType,
        available: true,
        title: candidate.entry.title,
        matchedTerm: candidate.matchedTerm,
      });
    } else if (candidate.entry.unavailableBehavior === "classified_placeholder") {
      results.push({
        entityId: candidate.entry.entityId,
        entityType: candidate.entry.entityType,
        available: false,
      });
    }
  }
  return results;
}

/**
 * Single best match for one entry, or null. Checks tiers in precedence order
 * (exact_title > exact_term > alias > partial) and returns the first authored
 * value within the first matching tier.
 */
function bestMatch(entry: SearchIndexEntry, normalizedQuery: string): { tier: MatchTier; matchedTerm: string } | null {
  const normalizedTitle = normalizeTerm(entry.title);
  if (normalizedTitle === normalizedQuery) {
    return { tier: "exact_title", matchedTerm: normalizedTitle };
  }

  for (const term of entry.exactTerms) {
    const normalizedTerm_ = normalizeTerm(term);
    if (normalizedTerm_ === normalizedQuery) {
      return { tier: "exact_term", matchedTerm: normalizedTerm_ };
    }
  }

  for (const alias of entry.aliases) {
    const normalizedAlias = normalizeTerm(alias);
    if (normalizedAlias === normalizedQuery) {
      return { tier: "alias", matchedTerm: normalizedAlias };
    }
  }

  for (const partialTerm of entry.partialTerms) {
    const normalizedPartial = normalizeTerm(partialTerm);
    if (normalizedPartial.includes(normalizedQuery)) {
      return { tier: "partial", matchedTerm: normalizedPartial };
    }
  }

  return null;
}

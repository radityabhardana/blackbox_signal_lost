import type { HintDefinition } from "@/content/schemas";

// docs/05 §9 hint ladders — full 4-tier ladders per objective, retiered to the
// documented example texts. obj_001/obj_002 retier the docs' exact ladder;
// obj_003 is authored ONLY from documented Stage 4 facts (docs/05 L164-178).
// Ids keep the existing prefixes (hint_001_verify_location_1,
// hint_002_authenticity_1 existed before Stage 3/4) and extend them to tier 4.
export const CASE_001_HINTS: HintDefinition[] = [
  // obj_001 "Verify final location" (docs/05 §9 Objective: Verify final location)
  { id: "hint_001_verify_location_1", objectiveId: "obj_001_verify_location", tier: 1, text: "Two records describe Maya's location on the same night." },
  { id: "hint_001_verify_location_2", objectiveId: "obj_001_verify_location", tier: 2, text: "Compare the ferry archive with Sera's emergency-call metadata." },
  { id: "hint_001_verify_location_3", objectiveId: "obj_001_verify_location", tier: 3, text: "Check the timestamps 22:14 and 22:31." },
  { id: "hint_001_verify_location_4", objectiveId: "obj_001_verify_location", tier: 4, text: "The emergency call occurred after the claimed departure, so one event must be false." },

  // obj_002 "Ferry authenticity" (docs/05 §9 Puzzle: Ferry authenticity)
  { id: "hint_002_authenticity_1", objectiveId: "obj_002_determine_authenticity", tier: 1, text: "Authentic events contain more than a passenger name and time." },
  { id: "hint_002_authenticity_2", objectiveId: "obj_002_determine_authenticity", tier: 2, text: "Compare Maya's event with a normal departure from the same gate." },
  { id: "hint_002_authenticity_3", objectiveId: "obj_002_determine_authenticity", tier: 3, text: "Inspect the event source and account signature." },
  { id: "hint_002_authenticity_4", objectiveId: "obj_002_determine_authenticity", tier: 4, text: "Maya's record came from a replay service rather than a physical terminal." },

  // obj_003 "North Barrier" (authored ONLY from documented Stage 4 facts,
  // escalating to the docs/05 L178 answer)
  { id: "hint_003_north_barrier_1", objectiveId: "obj_003_reason_for_north_barrier", tier: 1, text: "Maya did not leave Nusakara of her own choice — look at what drew her to North Barrier." },
  { id: "hint_003_north_barrier_2", objectiveId: "obj_003_reason_for_north_barrier", tier: 2, text: "Investigate the Node 7 maintenance summary and Maya's manual escalation." },
  { id: "hint_003_north_barrier_3", objectiveId: "obj_003_reason_for_north_barrier", tier: 3, text: "Compare the escalation ticket with Pelaga's public reliability report." },
  { id: "hint_003_north_barrier_4", objectiveId: "obj_003_reason_for_north_barrier", tier: 4, text: "Maya entered North Barrier to collect a local diagnostic archive because remote records were being suppressed." },
];

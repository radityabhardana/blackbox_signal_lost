import { contentBundleSchema } from "@/content/validator";
import { createInitialEngineState, stepCaseEngine } from "@/domain/engine";
import type { CaseEngineState } from "@/domain/engine";
import type { ContentBundle } from "@/content/validator";
import bundleJson from "@/content/fixtures/bundles/valid/bundle_basic_valid.json";

export interface MailTestSessionFixture {
  readonly content: ContentBundle;
  readonly mailChannelId: "channel_test";
  readonly initialState: CaseEngineState;
}

/**
 * Synthetic Secure Mail test content. Test-harness only: parses the neutral
 * valid bundle and boots the real BBX-022 engine with a
 * `mail_test_bootstrap` event so queuedDialogue contains an authored mail
 * while evidence_test stays undiscovered. The bundle JSON is imported
 * statically because `__dirname` does not resolve under the Next.js bundler.
 */
export function createMailTestSession(): MailTestSessionFixture {
  const content = contentBundleSchema.parse(bundleJson);

  const afterBootstrap = stepCaseEngine(
    createInitialEngineState(),
    { kind: "game_event", event: { type: "mail_test_bootstrap" } },
    content,
  );

  return {
    content,
    mailChannelId: "channel_test",
    initialState: afterBootstrap.state,
  };
}
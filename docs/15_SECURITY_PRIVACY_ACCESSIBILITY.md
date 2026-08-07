# Security, Privacy, and Accessibility

## 1. Product stance

The game’s story examines surveillance and data control. The real product must therefore avoid careless data collection.

## 2. Threat model

Relevant risks:

- Exposed environment secrets
- Cross-site scripting through notes or remote content
- Tampered save data
- Malicious remote case content
- Unauthorized cloud-save access
- Excessive analytics
- Third-party asset tracking
- Dependency vulnerabilities
- Confusion between fictional errors and real failures

## 3. Security requirements

### Client

- Never render arbitrary HTML from case data.
- Sanitize player notes before display.
- Use Content Security Policy.
- Restrict external asset domains.
- Validate all content.
- Treat save data as untrusted on load.
- Do not use `eval` or dynamic code execution.
- Keep fictional terminal input inside a closed command parser.

### Supabase, when introduced

- Enable row-level security.
- Users access only their own save rows.
- Service-role keys remain server-side.
- Validate ownership in every mutation.
- Use signed URLs for private remote assets where required.
- Separate public demo content from private user data.

### Dependencies

- Use lockfile.
- Review high-severity advisories.
- Avoid abandoned packages for core systems.
- Do not auto-merge dependency updates without tests.

## 4. Fictional security puzzles

Allowed:

- abstract signal routing,
- metadata comparison,
- fictional checksum matching,
- pattern reconstruction,
- closed command vocabulary.

Not allowed:

- realistic credential theft,
- real exploit steps,
- bypassing actual services,
- malware creation,
- or instructions transferable to wrongdoing.

## 5. Privacy model

### Guest mode

Store locally:

- save data,
- settings,
- board notes,
- and optional local telemetry consent.

Do not require:

- name,
- email,
- birth date,
- location,
- contacts,
- or social account.

### Optional analytics

Collect only after clear notice.

Useful aggregate events:

- case started,
- objective completed,
- hint tier requested,
- report outcome,
- app opened,
- save error code.

Avoid collecting:

- free-text player notes,
- raw search queries unless explicitly justified and consented,
- message content,
- IP-derived precise location,
- or device fingerprinting.

### Cloud save

Cloud save must be optional. Explain:

- what is uploaded,
- how to delete it,
- and what happens when the account is removed.

## 6. Accessibility requirements

### Keyboard

All critical gameplay must support:

- app launcher navigation,
- window switching,
- window controls,
- list navigation,
- search,
- evidence selection,
- evidence connection alternative,
- hint access,
- conclusion submission,
- and settings.

### Screen reader

- Semantic landmarks
- Clear application and window names
- Announce new urgent messages
- Avoid announcing decorative glitch text
- Provide board list view as alternative to spatial canvas
- Provide table view for signal analysis

### Vision

- Minimum readable sizes
- 200% browser zoom support on critical flow
- High-contrast mode
- No color-only evidence
- Alt text for visual evidence
- Adjustable text scale
- Clear focus indicators

### Motion and flashing

- Reduced-motion support
- Glitch off setting
- No rapid flashing
- No essential transient visuals
- Pause or stop looping visual media

### Hearing

- Captions
- Transcripts
- Visual notification equivalents
- No audio-only clue
- Separate voice and music volume

### Cognitive

- Clear objectives
- Consistent application behavior
- Recoverable mistakes
- Optional hints
- Plain-language summaries for dense technical records
- No arbitrary time pressure in tutorials

## 7. Real error versus fictional anomaly

A real failure must show:

- a clear error label,
- retry action,
- diagnostic code,
- and progress-safety statement.

A fictional anomaly must never imitate:

- browser security warnings,
- operating-system malware alerts,
- payment prompts,
- or requests for real credentials.

## 8. Data deletion

Provide:

- Reset current case
- Delete all local saves
- Reset settings
- Future cloud-data deletion

Deletion actions require confirmation and explain scope.

## 9. Content notices

Before play, disclose:

- themes of surveillance,
- institutional pressure,
- missing persons,
- and privacy invasion.

Keep notices concise and non-spoiling.

## 10. Compliance checklist before public demo

- Privacy notice reviewed
- Analytics disabled by default or consented
- No secret keys in build
- CSP and security headers tested
- Dependency audit reviewed
- Local deletion works
- Keyboard path complete
- Captions and transcripts complete
- High contrast and reduced motion tested
- Real failures clearly distinguished from story effects
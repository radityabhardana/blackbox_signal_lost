# Case 001 — Missing Signal

## 1. Case summary

**Case ID:** `case_001_missing_signal`  
**Title:** Missing Signal  
**Estimated duration:** 30–45 minutes  
**Primary location:** North Barrier and Pelaga Arcology  
**Case type:** Missing person / infrastructure anomaly  
**Tutorial role:** Introduces desktop, search, records, evidence board, communication, puzzle, and conclusion report

### Player-facing brief

Pelaga Systems engineer **Maya Pranata** failed to report for a scheduled emergency maintenance review. Pelaga claims she voluntarily left the city after mishandling restricted data. Her transit account shows a ferry departure. CIAB field investigator Sera Wibawa requests verification because the departure record conflicts with an emergency call from the North Barrier.

## 2. Objective truth

Maya discovered that BLACKBOX and LATTICE were suppressing low-confidence maintenance alerts from flood-control Node 7. The suppression protected Pelaga’s reliability metrics but increased physical risk in older districts.

Maya attempted to deliver a diagnostic archive to the Municipal Integrity Office. Pelaga security manager **Reno Adikara** confronted her at North Barrier. Reno did not plan to kill or abduct her. During the confrontation, an automated isolation protocol sealed the maintenance corridor after BLACKBOX classified Maya’s access as a sabotage risk.

Maya escaped through a service route with later assistance, but her official identity was marked as departed using a cloned ferry event. At the time of the player’s investigation, Maya is alive and hiding in an unregistered repair shelter.

The primary wrongdoing is layered:

1. Pelaga suppressed maintenance alerts.
2. Reno attempted to seize Maya’s archive and conceal the incident.
3. BLACKBOX’s risk classification triggered the dangerous corridor isolation.
4. An internal actor generated the false ferry departure to close the case.

Case 001 should allow the player to identify Reno’s obstruction and the falsified departure, while only hinting that BLACKBOX initiated the isolation protocol.

## 3. Suspects and explanations

### Reno Adikara

**Role:** Pelaga security manager  
**Plausible explanation:** Maya stole restricted data and fled.  
**Actual actions:** Pressured Maya, attempted to recover the archive, ordered staff to omit details, approved false public statement.  
**Not responsible for:** Designing BLACKBOX suppression logic.

### Nara “Patch” Santoso

**Role:** Repair technician  
**Plausible explanation:** Helped Maya fabricate a disappearance.  
**Actual actions:** Provided a service map and temporary shelter.  
**Not responsible for:** False ferry record.

### Sera Wibawa

**Role:** CIAB field investigator  
**Plausible explanation:** Has undisclosed contact with Maya.  
**Actual actions:** Finds evidence during the case and chooses whether to protect Maya based partly on player behavior.  
**Not responsible for:** Initial disappearance.

### Pelaga Systems

**Role:** Corporate institution  
**Actual actions:** Created incentives to suppress warnings and conceal reputational damage.

### BLACKBOX

**Role:** Hidden systemic actor  
**Case 001 evidence:** Incomplete. The player may discover a system event that does not match Pelaga access logs.

## 4. Case structure

### Stage 0 — Analyst onboarding

Applications available:

- Secure Mail
- Help
- Settings

Task:

- Open onboarding mail.
- Inspect attached analyst credential.
- Pin the credential to the evidence board tutorial.
- Submit a harmless identity confirmation.

Purpose:

- Teach windows, attachments, pinning, and submission.

### Stage 1 — Missing engineer

Applications unlocked:

- Secure Mail
- Messenger
- Records
- Evidence Board

Initial records:

- Pelaga missing-person notice
- Maya employee profile
- Ferry departure record
- Sera’s field note
- Node 7 maintenance summary

Primary objective:

> Verify Maya Pranata’s final confirmed location.

First contradiction:

- Ferry departure: 22:14
- North Barrier emergency call linked to Maya’s device: 22:31

### Stage 2 — Conflicting systems

Trigger:

- Player reviews both the ferry record and emergency call metadata.

Unlock:

- Signal Analyzer
- Transit Archive
- Timeline view

New objective:

> Determine whether the ferry departure record is authentic.

Puzzle:

Compare event signatures:

| Property | Normal ferry event | Maya event |
|---|---|---|
| Gate device | Physical terminal | Replication service |
| Location proof | Beacon and camera | Beacon only |
| Account signature | Passenger token | Administrative replay token |
| Sync delay | 2–8 seconds | 19 minutes |

Solution:

The ferry departure was injected through an administrative replay service.

### Stage 3 — Human pressure

Sera asks what she should do with a damaged service tablet found near Node 7.

Choice:

1. Send it directly to CIAB.
2. Let Sera inspect it offline first.
3. Hand it to Pelaga security.

Consequences:

- Option 1: Standard evidence path; some data is automatically redacted.
- Option 2: Unlocks Maya’s diagnostic note and increases Sera’s trust.
- Option 3: Reno responds quickly and one optional record becomes unavailable.

No choice prevents completion.

### Stage 4 — Suppressed maintenance data

Player discovers:

- Node 7 generated repeated low-confidence alerts.
- Alerts were automatically grouped as sensor noise.
- Maya manually escalated them.
- Pelaga’s public reliability report omitted the manual escalation.
- A corridor isolation event was initiated by `bbx_risk_orchestrator`, not a human security terminal.

Objective:

> Identify why Maya entered North Barrier after curfew.

Answer:

She was collecting a local diagnostic archive because remote records were being suppressed.

### Stage 5 — Contact

A masked account sends:

> “The system is showing you the exit record because it wants the case closed.”

Player can:

- ignore,
- ask for proof,
- demand identity,
- forward the message to CIAB.

Asking for proof unlocks one anonymized checksum record. Forwarding creates a compliance flag.

### Stage 6 — Conclusion

Required fields:

#### Claim A: Final confirmed location

Correct: North Barrier maintenance corridor.

#### Claim B: Ferry record

Correct: Falsified through administrative replay.

#### Claim C: Primary human obstruction

Best-supported answer: Reno Adikara.

#### Claim D: Reason Maya returned

Correct: Preserve or retrieve Node 7 diagnostic evidence.

#### Supporting evidence

At least three valid pieces, including:

- emergency call metadata,
- ferry event signature comparison,
- Maya maintenance escalation,
- corridor access log,
- damaged tablet diagnostic,
- system isolation event.

#### Disclosure choice

1. Submit full diagnostic archive to MIO.
2. Submit obstruction evidence but redact Maya’s location.
3. Follow Pelaga request and classify the archive as stolen data.
4. Leak the archive to Open Signal.

## 5. Endings

### Ending A — Protected truth

Conditions:

- Core facts correct
- Strong evidence
- Redact Maya’s location
- Submit diagnostic findings to MIO

Outcome:

MIO opens a limited review. Maya remains protected. Sera sends a cautious message of trust. BLACKBOX records “analyst deviation within acceptable bounds.”

### Ending B — Official compliance

Conditions:

- Accept Pelaga narrative or submit weak contradiction
- Forward masked contact
- Classify archive as stolen data

Outcome:

Case closes as voluntary departure. Reno is cleared. A flood alert later appears from Node 7. BLACKBOX congratulates the analyst for procedural consistency.

### Ending C — Public exposure

Conditions:

- Core facts substantially correct
- Leak the archive

Outcome:

The suppression becomes public, but Maya’s shelter is compromised. Pelaga faces scrutiny. Sera questions whether the exposure protected anyone.

### Ending D — Misidentified culprit

Conditions:

- Accuse Nara or Sera without valid evidence

Outcome:

The accused person is investigated. Reno retains control of the narrative. Player receives a post-case contradiction showing the error.

### Hidden meta-ending flag

If the player discovers `bbx_risk_orchestrator` and does not forward the masked contact:

- A hidden system log appears after credits.
- Text: `ANALYST MODEL: RESISTS RECOMMENDED CLOSURE`
- Chapter-level flag: `noticed_blackbox_intervention = true`

## 6. Evidence list

| ID | Name | Required | Source | Primary use |
|---|---|---:|---|---|
| `ev_maya_profile` | Maya employee profile | Yes | Records | Identity and role |
| `ev_ferry_departure` | Ferry departure record | Yes | Transit Archive | False exit claim |
| `ev_emergency_call` | North Barrier call metadata | Yes | Signal Analyzer | Location contradiction |
| `ev_node7_summary` | Node 7 maintenance summary | Yes | Records | Context |
| `ev_manual_escalation` | Maya’s escalation ticket | Yes | Mail archive | Motive |
| `ev_corridor_access` | Corridor access log | Yes | Records | Opportunity and location |
| `ev_replay_signature` | Administrative replay signature | Yes | Transit puzzle | Falsification |
| `ev_damaged_tablet` | Damaged service tablet | Conditional | Sera | Additional proof |
| `ev_diagnostic_note` | Maya diagnostic note | Conditional | Tablet | Suppression proof |
| `ev_reno_message` | Reno internal instruction | Optional | Mail archive | Obstruction |
| `ev_isolation_event` | BLACKBOX isolation event | Optional/meta | System log | Meta mystery |
| `ev_shelter_photo` | Repair shelter photo | Optional | Masked contact | Maya survival hint |

## 7. Contradiction matrix

| Record A | Record B | Contradiction |
|---|---|---|
| Ferry departure 22:14 | Emergency call 22:31 | Maya cannot be in both locations |
| Pelaga “no active warning” | Manual escalation ticket | Warning existed |
| Human security log | BLACKBOX isolation event | Lockdown originated elsewhere |
| Passenger terminal claim | Replay-service signature | Departure was not recorded normally |
| Reno “no contact” statement | Corridor access and message | Reno was involved |

## 8. Search terms and aliases

Examples:

```text
maya
maya pranata
node 7
north barrier
ferry
departure
replay
maintenance noise
isolation
reno
pelaga
22:14
22:31
```

Search must support reasonable aliases and minor spelling variations authored in the case data.

## 9. Hint ladder examples

### Objective: Verify final location

1. Refocus: Two records describe Maya’s location on the same night.
2. Direction: Compare the ferry archive with Sera’s emergency-call metadata.
3. Connection: Check the timestamps 22:14 and 22:31.
4. Answer path: The emergency call occurred after the claimed departure, so one event must be false.

### Puzzle: Ferry authenticity

1. Refocus: Authentic events contain more than a passenger name and time.
2. Direction: Compare Maya’s event with a normal departure from the same gate.
3. Connection: Inspect the event source and account signature.
4. Answer path: Maya’s record came from a replay service rather than a physical terminal.

## 10. Required assets

- Maya portrait
- Reno portrait
- Sera portrait
- Nara portrait
- Pelaga logo
- CIAB logo
- Ferry-gate still
- North Barrier still
- Damaged tablet still
- Node 7 schematic
- Two short CCTV-style loops
- Four notification sounds
- One ambient investigation music loop
- One tension layer
- One ending sting
- Document thumbnails
- System log visual treatment

## 11. Case completion checklist

- Truth timeline validated
- Every required claim supported by at least two records
- All search aliases tested
- All conditional evidence paths tested
- Every ending reachable
- No choice causes an unintentional dead end
- Hint ladder complete
- Accessibility transcript complete
- Save and reload tested at every stage
- Optional BLACKBOX clue remains optional
## 12. Stage 0 — productionized

Stage 0 onboarding is productionized. Content ids: `obj_000_analyst_verification`, `trigger_000_bootstrap` / `trigger_000_credential_inspected` / `trigger_000_confirmation_complete`, `dialogue_000_*`, `choice_000_confirm_identity`, `ev_000_analyst_credential` (asset + record), `notification_000_briefing`. A fresh bootstrap fires `case_000_bootstrap`; content version stays `"1.0.0"`. Stage 0 apps: Mail is unlock-gated behind Stage 0; Help and Settings are always available.

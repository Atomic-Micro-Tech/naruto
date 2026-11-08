# Arena 1 authoritative runtime

`source/` vendors the existing JavaScript reconstruction from `browser-game/dist/`
and the result-ranking specification from `research/party-outcomes.mjs`.
The original hashes are recorded in `source/provenance.json`. The ignored
`browser-game/` directory is not needed to build or run this server.

`source/online.js` provides the online adapter: Party roster/settings,
legal decision menus, server-timed roulette stops, CPU steps, public/private
projections, surrender and result ranking. It returns a private checkpoint;
only the allowlisted DTO in `internal/MatchProjection.go` is sent to clients.

From `Naruto-Online/client`, run `npm ci` then `npm run build:rules` after editing
the sources. Commit the regenerated `Rules.js` with the source change. Go embeds
this bundle and evaluates it using an isolated Goja VM for each decision, with
a context deadline. Node is a build dependency, not a running game service.
This is a source-level rewrite, not a PS1 emulator.

Integration corrections to the vendored code:

- Party source bonuses award 4 skill points; the online adapter supplies the
  four starting character loadouts and the room's target chakra, including zero.
- Teleport cards used from inventory now consume and return the held card.
- CPU upgrades no longer offer an undefined target level when the default
  next level is legal.
- Original individual Party ranking handles tied chakra and surrender.
- The shared RNG state and its draw count survive checkpoint serialization.

## CPU policy and fidelity

`local-party-v1` is an explicitly named local policy. It reuses the recovered
purchase/upgrade, chance/discard, route, combat-card, combat-technique and
roulette decisions where their inputs are present. It skips optional pre-roll
cards/jutsu/scrolls, uses relationship value 0 for relationship-dependent
branches, and picks the first legal target for an interrupted card/scroll menu.
These are online integration adaptations, **not certified original PS1 AI**.

The inherited unknown-route/technique fallbacks keep their unresolved notes.
The checkpoint and each CPU job retain policy notes and unresolved traces.
An unhandled engine error pauses the match and persists its diagnostic trace;
it is not silently replaced with a fabricated game result.

Original AI reconstruction gaps remain documented in [AI_RULE.md](../../../../AI_RULE.md).
Complete frame timing,
camera, battle choreography, unlocked menu loadouts and a full match comparison
against original PS1 state are not covered by this integration.

## Persistence

Room and match locks serialize commands, CPU steps and reclaim operations.
Commands, state/RNG hashes, version/event sequence, results and an outbox event
commit in the same PostgreSQL transaction. Full archival snapshots are saved
on start, every 20 versions, and completion/pause. The current checkpoint is
written on every decision.

CPU decisions are computed and recorded atomically under the match lock;
there is no externally pending job to race a reclaim. Each persisted state is
a decision boundary. `participantKind` remains `human`; only the controller and
its fencing epoch change. Restarting the API reloads the persisted checkpoint.

The logical roulette clock is 60 Hz. Clients receive decision snapshots, not
60 updates per second. The presentation layer interpolates the visible wheel
and animates movement; transport/visual timing is an online adaptation.

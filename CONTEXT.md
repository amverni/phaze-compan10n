# Phase 10 Scoreboard

This context defines the shared language for recording and comparing Phase 10 games, rounds, phase progress, and winners. It exists to keep game setup, scoring, and outcome discussions precise.

## Language

### Core gameplay

**Game**:
A full play session that runs through an ordered Phase Set until a Game Winner is determined.
_Avoid_: Match

**Active Game**:
A game currently in progress and still accepting new rounds.
_Avoid_: Open game, live game

**Completed Game**:
A game whose winner has been finalized and whose competitive result is closed.
_Avoid_: Archived game, old game

**Player**:
A person participating in a game.
_Avoid_: User, participant

**Active Player**:
A player currently participating in an active game; this may differ from everyone ever added to that game.
_Avoid_: Current player, enabled player

**Dealer**:
The player assigned to deal for a specific round, rotating by active-player order each round.
_Avoid_: Host, starter

### Progress and outcomes

**Phase**:
A required card objective that must be satisfied to progress through the game.
_Avoid_: Level, challenge

**Current Phase**:
The phase number a player is attempting in their next round.
_Avoid_: Stage, tier

**Phase Set**:
The ordered list of phases used by a game.
_Avoid_: Preset, playlist

**Phases Card**:
A shareable reference card for a Phase Set that lists its phases in order.
_Aliases_: Phase Card
_Avoid_: Phase Set Card, phasecard

**Round**:
One scoring cycle in which each active player records a score and phase outcome.
_Avoid_: Hand, turn cycle

**Round Winner**:
The player who completed their phase in that round and went out first.
_Avoid_: Round leader

**Game Winner**:
The player who first completes the final phase; ties are resolved by the selected Tiebreaker.
_Avoid_: Champion

**Tiebreaker**:
The rule used to resolve winner comparisons when multiple players are otherwise tied.
_Avoid_: Secondary score, fallback rule

**Score Entry Complete**:
A player's round score entry has enough Round Result and Tiebreaker information to be counted as entered for that round. For Points Tiebreakers, this includes a valid Points Card Count for the player's Round Result.
_Avoid_: Completed, done

**Points Card Count**:
The total number of remaining cards represented by the point-entry counters for a Points Tiebreaker.
_Avoid_: Score, points total

**Points Tiebreaker**:
A tiebreaker that compares players by a recorded point total, where the selected rule determines whether higher or lower points win.
_Avoid_: Score tiebreaker

**Count Tiebreaker**:
A tiebreaker that compares players by a counted gameplay event, such as wild cards or skip cards.
_Avoid_: Non-points tiebreaker

**Fewest Wilds**:
A tiebreaker that compares players by the number of wild cards used, where fewer is better.
_Avoid_: Low points (for this rule)

### Round status vocabulary

**Completed**:
The player met the phase objective for that round. Displayed in the score-entry UI as the past-tense label **Passed** for grammatical consistency with the other Round Result options (Failed, Skipped, Sat Out).
_Avoid_: Cleared. ("Passed" is permitted only as the UI label for `phaseStatus = "completed"` in the Add Round dialog.)

**Failed**:
The player did not meet the phase objective for that round.
_Avoid_: Lost phase

**Round Skip**:
The player skips the full round, may take a Round Skip Penalty, and advances to the next phase.
_Avoid_: Skip (ambiguous)

**Sit Out**:
The player skips the full round and retries the same phase in the next round.
_Avoid_: Skip (ambiguous)

**Turn Skip**:
The player misses a turn within a round without skipping the entire round.
_Avoid_: Skip (ambiguous)

**Skip Card**:
A card that causes another player to take a Turn Skip. The compact label **Skip** is permitted where the surrounding score-entry controls make the card meaning unambiguous.
_Avoid_: Round Skip, Sit Out

**Round Skip Penalty**:
Points added to a player's Round Score when they take a Round Skip. Stored on `gameSettings.roundSkipPenalty` (per-game) with an app-wide default in `appSettings.gameDefaults.roundSkipPenalty`. Default: 100 points.
_Avoid_: Auto-fail points

**Sit Out Penalty**:
Points added to a player's Round Score when they Sit Out a round. Stored on `gameSettings.sitOutPenalty` (per-game) with an app-wide default in `appSettings.gameDefaults.sitOutPenalty`. Default: 50 points.
_Avoid_: Sit-out cost

### Catalog and preferences

**Saved Phase**:
A reusable phase definition kept for future games.
_Avoid_: Permanent phase

**Temporary Phase**:
A phase definition scoped to one game session.
_Avoid_: Draft phase

**Saved Phase Set**:
A reusable phase-set definition kept for future games.
_Avoid_: Permanent phase set

**Temporary Phase Set**:
A phase-set definition scoped to one game session.
_Avoid_: Draft phase set

**Favorite**:
A user-pinned Player, Phase, or Phase Set prioritized for quick selection.
_Avoid_: Bookmark

## Flagged ambiguities

- **"Skip" is overloaded.**  
  **Resolution:** Use **Skip Card** for the card that causes a Turn Skip, **Turn Skip** for the missed turn, **Round Skip** for full-round skips that advance phase, and **Sit Out** for full-round skips that do not advance phase. The compact label **Skip** is acceptable only when surrounding card-entry controls make **Skip Card** unambiguous.

- **"Complete" is overloaded.**
  **Resolution:** Use **Completed** only for the phase outcome. Use **Score Entry Complete** for whether a player's round score entry is ready to save.

## Example dialogue

**Developer:** "If Maya takes a Round Skip this round, does she move to the next phase?"  
**Domain expert:** "Yes, a Round Skip advances phase, and she may take a Round Skip Penalty."  
**Developer:** "If she instead chooses Sit Out?"  
**Domain expert:** "Then she retries the same Current Phase next round."  
**Developer:** "And if two players finish the final phase together?"  
**Domain expert:** "Use the configured Tiebreaker; for Fewest Wilds, compare wild-card counts."  
**Developer:** "In a Points Tiebreaker, does the quick button labeled Skip mean a Round Skip?"  
**Domain expert:** "No, that compact label means Skip Card in that score-entry context."

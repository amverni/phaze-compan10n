import { Check, Plus, X } from "lucide-react";
import { useState } from "react";
import type { GenericScoreboardView } from "../../types";
import { PlayerAvatar } from "../PlayerAvatar/PlayerAvatar";
import { Button, DealerMarker } from "../ui";
import { GenericAddRoundDialog } from "./GenericAddRoundDialog";
import { GenericPassFailRoundDialog } from "./GenericPassFailRoundDialog";
import { PassFailOutcome } from "./PassFailOutcome";

const cellClasses = "border-r border-b border-text-secondary/20 bg-app-background px-3 py-3";

export function GenericScoreboard({ view }: { view: GenericScoreboardView }) {
  const [addOpen, setAddOpen] = useState(false);
  const [expandedRound, setExpandedRound] = useState<number | null>(null);
  const metric =
    view.game.settings.mode === "points"
      ? "Points"
      : view.game.settings.mode === "singleRoundWinner"
        ? "Wins"
        : "Passes";

  return (
    <>
      <section
        aria-label="Scoreboard"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: Native scroll regions need focus for keyboard scrolling.
        tabIndex={0}
        className="glass relative min-h-0 overflow-auto rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-secondary"
      >
        <table className="w-full border-separate border-spacing-0 text-center">
          <caption className="sr-only">
            {metric === "Wins" ? "Rounds Won" : metric} scoreboard
          </caption>
          <thead>
            <tr>
              <th
                scope="col"
                className={[cellClasses, "sticky top-0 left-0 z-30 text-xs"].join(" ")}
              >
                Round
              </th>
              {view.players.map((player) => (
                <th
                  key={player.id}
                  scope="col"
                  className={[cellClasses, "sticky top-0 z-20 min-w-28"].join(" ")}
                >
                  <span className="inline-flex flex-col items-center gap-2">
                    <PlayerAvatar player={player} />
                    <span className="max-w-40 truncate text-sm" title={player.name}>
                      {player.name}
                    </span>
                    <span className="whitespace-nowrap text-lg font-semibold tabular-nums">
                      <span className="sr-only">Total {metric}: </span>
                      {"totalPoints" in player
                        ? player.totalPoints
                        : "totalWins" in player
                          ? player.totalWins
                          : player.totalPasses}
                    </span>
                    {"totalTiebreaker" in player && player.totalTiebreaker !== undefined && (
                      <span className="whitespace-nowrap text-sm font-normal text-text-secondary tabular-nums">
                        <span className="sr-only">Total Tiebreaker: </span>
                        {player.totalTiebreaker}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {view.rounds.length === 0 && (
              <tr>
                <td
                  colSpan={view.players.length + 1}
                  className="px-4 py-8 text-sm text-text-secondary"
                >
                  No rounds yet.
                </td>
              </tr>
            )}
            {view.rounds.map((round) => (
              <tr key={round.roundNumber}>
                <th scope="row" className={[cellClasses, "sticky left-0 z-10 text-sm"].join(" ")}>
                  <Button
                    type="button"
                    aria-label={`${expandedRound === round.roundNumber ? "Collapse" : "Expand"} Round ${round.roundNumber}`}
                    aria-expanded={expandedRound === round.roundNumber}
                    onClick={() =>
                      setExpandedRound(
                        expandedRound === round.roundNumber ? null : round.roundNumber,
                      )
                    }
                    className="size-11 data-focus:outline-text-secondary!"
                  >
                    {round.roundNumber}
                  </Button>
                </th>
                {round.scores.map((score, index) => (
                  <td
                    key={score.playerId}
                    aria-label={`${view.players[index].name}, Round ${round.roundNumber}: ${"points" in score ? `${score.points} Points${score.tiebreaker !== undefined ? `, ${score.tiebreaker} Tiebreaker` : ""}` : "passed" in score ? (score.passed ? "Passed" : "Failed") : score.won ? "Won" : "Lost"}${round.dealerId === score.playerId ? ", Dealer" : ""}`}
                    className={[cellClasses, "whitespace-nowrap tabular-nums"].join(" ")}
                  >
                    <div
                      className={["relative", view.game.settings.dealer ? "px-6" : ""].join(" ")}
                    >
                      {round.dealerId === score.playerId && (
                        <DealerMarker className="absolute top-1/2 left-0 -translate-y-1/2" />
                      )}
                      {"passed" in score ? (
                        <PassFailOutcome passed={score.passed} />
                      ) : "points" in score ? (
                        <>
                          <span>{score.points}</span>
                          {score.tiebreaker !== undefined && (
                            <span className="block text-sm text-text-secondary">
                              {score.tiebreaker}
                            </span>
                          )}
                        </>
                      ) : score.won ? (
                        <Check className="mx-auto size-5 text-pt-green-500" aria-hidden />
                      ) : (
                        <X className="mx-auto size-5 text-pt-red-500" aria-hidden />
                      )}
                    </div>
                    {expandedRound === round.roundNumber && (
                      <div className="pt-2 text-sm text-text-secondary">
                        <span className="sr-only">Accumulated {metric}: </span>
                        {"totalPoints" in score
                          ? score.totalPoints
                          : "totalWins" in score
                            ? score.totalWins
                            : score.totalPasses}
                        {"totalTiebreaker" in score && score.totalTiebreaker !== undefined && (
                          <div className="text-xs">
                            <span className="sr-only">Accumulated Tiebreaker: </span>
                            {score.totalTiebreaker}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {view.game.status === "active" && (
              <tr>
                <td
                  colSpan={view.game.settings.dealer ? 1 : view.players.length + 1}
                  className={[
                    "border-t border-dashed border-text-secondary/50 text-left",
                    view.game.settings.dealer ? "sticky left-0 z-10 bg-app-background" : "",
                  ].join(" ")}
                >
                  <Button
                    type="button"
                    aria-label="Add Round"
                    onClick={() => setAddOpen(true)}
                    className={[
                      "my-3 min-h-11 gap-2 text-sm data-focus:outline-text-secondary!",
                      view.game.settings.dealer ? "mx-auto size-11" : "sticky left-3 ml-3 px-4",
                    ].join(" ")}
                  >
                    <Plus className="size-4" aria-hidden />
                    {!view.game.settings.dealer && "Add Round"}
                  </Button>
                </td>
                {view.game.settings.dealer &&
                  view.players.map((player) => (
                    <td
                      key={player.id}
                      aria-label={`${player.name}, upcoming Round${view.upcomingDealerId === player.id ? ": Dealer" : ""}`}
                      className="border-t border-dashed border-text-secondary/50 px-3 py-3"
                    >
                      {view.upcomingDealerId === player.id && (
                        <DealerMarker className="opacity-60" />
                      )}
                    </td>
                  ))}
              </tr>
            )}
          </tbody>
        </table>
      </section>
      {view.game.status === "active" &&
        (view.game.settings.mode === "passFail" ? (
          <GenericPassFailRoundDialog
            open={addOpen}
            onClose={setAddOpen}
            gameId={view.game.id}
            players={view.players}
          />
        ) : (
          <GenericAddRoundDialog
            open={addOpen}
            onClose={setAddOpen}
            gameId={view.game.id}
            players={view.players}
            mode={view.game.settings.mode}
            tiebreakerEnabled={
              view.game.settings.mode === "points" && view.game.settings.tiebreaker !== null
            }
          />
        ))}
    </>
  );
}

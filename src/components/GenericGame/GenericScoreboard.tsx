import { Plus } from "lucide-react";
import { useState } from "react";
import type { GenericScoreboardView } from "../../types";
import { PlayerAvatar } from "../PlayerAvatar/PlayerAvatar";
import { Button, DealerMarker } from "../ui";
import { GenericAddRoundDialog } from "./GenericAddRoundDialog";

const cellClasses = "border-r border-b border-text-secondary/20 bg-app-background px-3 py-3";

export function GenericScoreboard({ view }: { view: GenericScoreboardView }) {
  const [addOpen, setAddOpen] = useState(false);
  const [expandedRound, setExpandedRound] = useState<number | null>(null);

  return (
    <>
      <section
        aria-label="Scoreboard"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: Native scroll regions need focus for keyboard scrolling.
        tabIndex={0}
        className="glass relative min-h-0 overflow-auto rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-secondary"
      >
        <table className="w-full border-separate border-spacing-0 text-center">
          <caption className="sr-only">Points scoreboard</caption>
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
                      <span className="sr-only">Total Points: </span>
                      {player.totalPoints}
                    </span>
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
                    aria-label={`${view.players[index].name}, Round ${round.roundNumber}: ${score.points} Points${round.dealerId === score.playerId ? ", Dealer" : ""}`}
                    className={[cellClasses, "whitespace-nowrap tabular-nums"].join(" ")}
                  >
                    <div
                      className={["relative", view.game.settings.dealer ? "px-6" : ""].join(" ")}
                    >
                      {round.dealerId === score.playerId && (
                        <DealerMarker className="absolute top-1/2 left-0 -translate-y-1/2" />
                      )}
                      <span>{score.points}</span>
                    </div>
                    {expandedRound === round.roundNumber && (
                      <div className="pt-2 text-sm text-text-secondary">
                        <span className="sr-only">Accumulated Points: </span>
                        {score.totalPoints}
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
      {view.game.status === "active" && (
        <GenericAddRoundDialog
          open={addOpen}
          onClose={setAddOpen}
          gameId={view.game.id}
          players={view.players}
        />
      )}
    </>
  );
}

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Player } from "../../types";
import { StandingsRow } from "./StandingsRow";
import type { StandingsDisplayRow } from "./standingsDialogView";

describe("StandingsRow", () => {
  it("shows Phase and Tiebreaker values without a dot separator", () => {
    const markup = renderToStaticMarkup(
      <StandingsRow
        row={makeStandingsRow({
          phaseNumber: 10,
          tiebreakerText: "1234 pts",
        })}
      />,
    );

    expect(markup).toContain(">Ph 10</span>");
    expect(markup).not.toContain("•");
    expect(markup).toContain(">1234 pts</span>");
    expect(markup).not.toContain(">-</span>");
  });

  it("keeps the Finished indicator alongside the Phase and Tiebreaker", () => {
    const markup = renderToStaticMarkup(
      <StandingsRow
        row={makeStandingsRow({
          phaseNumber: 10,
          isFinished: true,
          tiebreakerText: "3 wins",
        })}
      />,
    );

    expect(markup).toContain(">Ph 10");
    expect(markup).toContain('aria-label="Finished"');
    expect(markup).toContain(">3 wins</span>");
  });
});

function makeStandingsRow(overrides: Partial<StandingsDisplayRow> = {}): StandingsDisplayRow {
  return {
    player: makePlayer(),
    place: 1,
    showPlace: true,
    phaseNumber: 3,
    isFinished: false,
    tiebreakerText: "12 pts",
    ...overrides,
  };
}

function makePlayer(): Player {
  return {
    id: "player-1",
    name: "Amy",
    color: "Jam",
    createdAt: 0,
    isFavorite: 0,
  };
}

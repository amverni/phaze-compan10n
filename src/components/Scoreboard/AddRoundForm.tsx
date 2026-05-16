import { useForm } from "@tanstack/react-form";
import { useId, useState } from "react";
import { useAddRound } from "../../data/hooks/useRounds";
import type { ArrayAtLeastOne, PhaseStatus, Player, RoundScore } from "../../types";

interface AddRoundFormProps {
  gameId: string;
  players: Player[];
  onSubmitted: () => void;
  onCancel: () => void;
}

const STATUS_OPTIONS: PhaseStatus[] = ["failed", "completed", "skipped", "satOut"];

interface PerPlayerEntry {
  playerId: string;
  score: number;
  phaseStatus: PhaseStatus;
}

interface FormValues {
  scores: PerPlayerEntry[];
  roundWinnerId: string;
}

/**
 * Placeholder score-entry form. Intentionally unstyled — the polished
 * score-entry UX is a follow-up; this form's only job is to capture the
 * data we need to call `useAddRound`.
 */
export function AddRoundForm({ gameId, players, onSubmitted, onCancel }: AddRoundFormProps) {
  const addRound = useAddRound(gameId);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const errorId = useId();

  const form = useForm({
    defaultValues: {
      scores: players.map((p) => ({
        playerId: p.id,
        score: 0,
        phaseStatus: "failed" as PhaseStatus,
      })),
      roundWinnerId: "",
    } satisfies FormValues,
    onSubmit: async ({ value }) => {
      const completedIds = value.scores
        .filter((s) => s.phaseStatus === "completed")
        .map((s) => s.playerId);
      if (!value.roundWinnerId || !completedIds.includes(value.roundWinnerId)) {
        throw new Error("Round winner must be a player who completed their phase.");
      }
      const scores = value.scores.map((s) => ({
        playerId: s.playerId,
        score: Number(s.score),
        phaseStatus: s.phaseStatus,
      })) as ArrayAtLeastOne<Omit<RoundScore, "currentPhase">>;

      await addRound.mutateAsync({
        scores,
        roundWinnerId: value.roundWinnerId,
      });
      onSubmitted();
    },
  });

  return (
    <form
      className="flex flex-col gap-3 p-4 text-sm text-text-primary"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setSubmitError(null);
        form.handleSubmit().catch((err: unknown) => {
          setSubmitError(err instanceof Error ? err.message : "Unable to save round");
        });
      }}
    >
      <p className="text-text-secondary text-xs">
        Placeholder form — fields will be replaced with a designed score-entry flow later.
      </p>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="text-left">Player</th>
            <th className="text-left">Score</th>
            <th className="text-left">Phase status</th>
            <th className="text-left">Winner?</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player, idx) => (
            <tr key={player.id}>
              <td className="pr-2 py-1">{player.name}</td>
              <td className="pr-2 py-1">
                <form.Field name={`scores[${idx}].score`}>
                  {(field) => (
                    <input
                      type="number"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(Number(e.target.value))}
                      onBlur={field.handleBlur}
                      className="w-20 border border-current px-1"
                    />
                  )}
                </form.Field>
              </td>
              <td className="pr-2 py-1">
                <form.Field name={`scores[${idx}].phaseStatus`}>
                  {(field) => (
                    <select
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value as PhaseStatus)}
                      onBlur={field.handleBlur}
                      className="border border-current px-1"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  )}
                </form.Field>
              </td>
              <td className="pr-2 py-1">
                <form.Field name="roundWinnerId">
                  {(field) => (
                    <input
                      type="radio"
                      name="roundWinnerId"
                      value={player.id}
                      checked={field.state.value === player.id}
                      onChange={() => field.handleChange(player.id)}
                    />
                  )}
                </form.Field>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {submitError && (
        <p id={errorId} role="alert" className="text-red-700 dark:text-red-300">
          {submitError}
        </p>
      )}

      <div className="flex gap-2">
        <button type="submit" className="border border-current px-3 py-1">
          Save round
        </button>
        <button type="button" onClick={onCancel} className="border border-current px-3 py-1">
          Cancel
        </button>
      </div>
    </form>
  );
}

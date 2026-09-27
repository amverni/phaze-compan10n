import { DialogTitle } from "@headlessui/react";
import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useAddGenericRound } from "../../data/hooks/useGenericGames";
import type { GameId, PlayerIdentity } from "../../types";
import { PlayerAvatar } from "../PlayerAvatar/PlayerAvatar";
import { Button, Dialog, DialogScrollArea, InlineError } from "../ui";
import { PassFailOutcome } from "./PassFailOutcome";

interface GenericPassFailRoundDialogProps {
  open: boolean;
  onClose: (open: boolean) => void;
  gameId: GameId;
  players: PlayerIdentity[];
}

export function GenericPassFailRoundDialog({
  open,
  onClose,
  gameId,
  players,
}: GenericPassFailRoundDialogProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const addRound = useAddGenericRound();
  const form = useForm({
    defaultValues: { scores: players.map((player) => ({ playerId: player.id, passed: false })) },
    onSubmit: async ({ value }) => {
      await addRound.mutateAsync({ gameId, mode: "passFail", scores: value.scores });
      form.reset();
      onClose(false);
    },
  });

  return (
    <Dialog open={open} onClose={onClose} dismissible={!addRound.isPending}>
      <form
        className="flex h-full min-h-0 flex-col px-4 pt-1 pb-3"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitError(null);
          form.handleSubmit().catch((error: unknown) => {
            setSubmitError(error instanceof Error ? error.message : "Unable to save Round.");
          });
        }}
      >
        <DialogTitle className="shrink-0 text-center text-lg font-semibold">Add Round</DialogTitle>
        <DialogScrollArea aria-label="Pass/Fail entries" className="px-6! pt-4! pb-6!">
          <fieldset aria-label="Players who passed" className="flex min-w-0 flex-col gap-4">
            {players.map((player, index) => (
              <form.Field key={player.id} name={`scores[${index}].passed`}>
                {(field) => (
                  <Button
                    type="button"
                    aria-label={player.name}
                    aria-pressed={field.state.value}
                    disabled={addRound.isPending}
                    onBlur={field.handleBlur}
                    onClick={() => {
                      setSubmitError(null);
                      field.handleChange(!field.state.value);
                    }}
                    className={[
                      "min-h-14 w-full gap-3 rounded-full px-4 py-3 text-left data-focus:outline-text-secondary!",
                      field.state.value ? "ring-2 ring-pt-green-500" : "",
                    ].join(" ")}
                  >
                    <PlayerAvatar player={player} size={20} />
                    <span className="min-w-0 flex-1 truncate font-medium" title={player.name}>
                      {player.name}
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1 text-sm">
                      <PassFailOutcome passed={field.state.value} />
                      {field.state.value ? "Passed" : "Failed"}
                    </span>
                  </Button>
                )}
              </form.Field>
            ))}
          </fieldset>
        </DialogScrollArea>
        <div className="shrink-0 pt-3">
          {submitError && <InlineError message={submitError} />}
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(submitting) => (
              <div className="flex items-center justify-between gap-3 px-2 pt-1 pb-2">
                <Button
                  type="button"
                  disabled={submitting}
                  onClick={() => onClose(false)}
                  className="min-h-11 px-4 text-sm data-focus:outline-text-secondary!"
                >
                  Close
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="min-h-11 gap-2 px-5 text-sm font-semibold data-focus:outline-text-secondary!"
                >
                  {submitting && (
                    <Loader2
                      className="size-4 animate-spin motion-reduce:animate-none"
                      aria-hidden
                    />
                  )}
                  Save
                </Button>
              </div>
            )}
          </form.Subscribe>
        </div>
      </form>
    </Dialog>
  );
}

import { DialogTitle, Tab, TabGroup, TabPanel } from "@headlessui/react";
import { useForm } from "@tanstack/react-form";
import { Check, Loader2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useAddGenericRound } from "../../data/hooks/useGenericGames";
import type { GameId, PlayerId, PlayerIdentity } from "../../types";
import { parseGenericPoints } from "../../utils/genericPoints";
import { PlayerAvatar } from "../PlayerAvatar/PlayerAvatar";
import { Button, Dialog, InlineError, SwipeableTabPanels, TabList, tabClasses } from "../ui";
import { PointsEntry } from "./PointsEntry";
import { WinnerEntry } from "./WinnerEntry";

interface GenericAddRoundDialogProps {
  open: boolean;
  onClose: (open: boolean) => void;
  gameId: GameId;
  players: PlayerIdentity[];
  mode: "points" | "singleRoundWinner";
}

function pointsError(value: string): string | undefined {
  try {
    parseGenericPoints(value);
    return undefined;
  } catch (error) {
    if (error instanceof Error) return error.message;
    throw error;
  }
}

export function GenericAddRoundDialog({
  open,
  onClose,
  gameId,
  players,
  mode,
}: GenericAddRoundDialogProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const tabListRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const addRound = useAddGenericRound();
  const form = useForm({
    defaultValues: {
      scores: players.map((player) => ({ playerId: player.id, points: "" })),
      winnerId: null as PlayerId | null,
    },
    onSubmit: async ({ value }) => {
      await addRound.mutateAsync(
        mode === "points"
          ? { gameId, scores: value.scores }
          : {
              gameId,
              mode,
              scores: players.map((player) => ({
                playerId: player.id,
                won: player.id === value.winnerId,
              })),
            },
      );
      form.reset();
      setSelectedIndex(0);
      onClose(false);
    },
  });

  useEffect(() => {
    if (!open) return;
    tabListRef.current
      ?.querySelectorAll<HTMLElement>('[role="tab"]')
      [selectedIndex]?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [open, selectedIndex]);

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
        {mode === "singleRoundWinner" ? (
          <form.Field name="winnerId">
            {(field) => (
              <WinnerEntry
                players={players}
                value={field.state.value}
                disabled={addRound.isPending}
                onChange={(value) => {
                  setSubmitError(null);
                  field.handleChange(value);
                }}
              />
            )}
          </form.Field>
        ) : (
          <TabGroup
            selectedIndex={selectedIndex}
            onChange={setSelectedIndex}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div ref={tabListRef} className="-mx-2 shrink-0 overflow-x-auto px-2 py-4">
              <form.Subscribe selector={(state) => state.values.scores}>
                {(scores) => (
                  <TabList className="w-max! min-w-full max-w-none!">
                    {players.map((player, index) => {
                      const complete = !pointsError(scores[index].points);
                      return (
                        <Tab
                          key={player.id}
                          aria-label={player.name}
                          title={player.name}
                          aria-describedby={`${id}-entry-${index}`}
                          disabled={addRound.isPending}
                          className={[
                            tabClasses,
                            "inline-flex min-h-10 min-w-24 items-center justify-center gap-2 px-3 data-focus:outline-text-secondary!",
                          ].join(" ")}
                        >
                          <PlayerAvatar player={player} size={14} />
                          <span className="max-w-40 truncate">{player.name}</span>
                          <span className="inline-flex size-4 shrink-0" aria-hidden>
                            {complete && <Check className="size-4 text-pt-green-500" aria-hidden />}
                          </span>
                          <span id={`${id}-entry-${index}`} className="sr-only">
                            {complete ? "Score entry complete" : "Score entry incomplete"}
                          </span>
                        </Tab>
                      );
                    })}
                  </TabList>
                )}
              </form.Subscribe>
            </div>
            <SwipeableTabPanels
              selectedIndex={selectedIndex}
              onChange={setSelectedIndex}
              className="dialog-scroll -mx-2 min-h-0 flex-1 overflow-y-auto!"
            >
              {players.map((player, index) => (
                <TabPanel key={player.id} className="px-2">
                  <form.Field
                    name={`scores[${index}].points`}
                    validators={{ onChange: ({ value }) => pointsError(value) }}
                  >
                    {(field) => (
                      <PointsEntry
                        name={player.name}
                        value={field.state.value}
                        error={field.state.value ? pointsError(field.state.value) : undefined}
                        disabled={addRound.isPending}
                        onChange={(value) => {
                          setSubmitError(null);
                          field.handleChange(value);
                        }}
                      />
                    )}
                  </form.Field>
                </TabPanel>
              ))}
            </SwipeableTabPanels>
          </TabGroup>
        )}
        <div className="shrink-0 pt-3">
          {submitError && <InlineError message={submitError} />}
          <form.Subscribe
            selector={(state) => ({
              complete:
                mode === "points"
                  ? state.values.scores.filter((score) => !pointsError(score.points)).length
                  : Number(state.values.winnerId !== null),
              submitting: state.isSubmitting,
            })}
          >
            {({ complete, submitting }) => (
              <div className="flex items-center justify-between gap-3 px-2 pt-1 pb-2">
                <Button
                  type="button"
                  disabled={submitting}
                  onClick={() => onClose(false)}
                  className="min-h-11 px-4 text-sm data-focus:outline-text-secondary!"
                >
                  Close
                </Button>
                <output aria-live="polite" className="text-sm text-text-secondary">
                  {complete}/{mode === "points" ? players.length : 1}{" "}
                  {mode === "points" ? "entered" : "winner selected"}
                </output>
                <Button
                  type="submit"
                  disabled={complete !== (mode === "points" ? players.length : 1) || submitting}
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

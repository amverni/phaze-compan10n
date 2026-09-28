import { Tab, TabGroup, TabPanel } from "@headlessui/react";
import { useForm } from "@tanstack/react-form";
import { Check } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { GameId, PlayerId, PlayerIdentity } from "../../types";
import { parseGenericPoints } from "../../utils/genericPoints";
import { PlayerAvatar } from "../PlayerAvatar/PlayerAvatar";
import { SwipeableTabPanels, TabList, tabClasses } from "../ui";
import {
  GenericRoundDialog,
  GenericRoundDialogActions,
  useGenericRoundDialog,
} from "./GenericRoundDialog";
import { PointsEntry } from "./PointsEntry";
import { WinnerEntry } from "./WinnerEntry";

interface GenericAddRoundDialogProps {
  open: boolean;
  onClose: (open: boolean) => void;
  gameId: GameId;
  players: PlayerIdentity[];
  mode: "points" | "singleRoundWinner";
  tiebreakerEnabled: boolean;
}

function pointsError(
  value: string,
  metric: "Points" | "Tiebreaker" = "Points",
): string | undefined {
  try {
    parseGenericPoints(value, metric);
    return undefined;
  } catch (error) {
    if (error instanceof Error) return error.message;
    throw error;
  }
}

function entryError(
  score: { points: string; tiebreaker: string },
  tiebreakerEnabled: boolean,
): string | undefined {
  return (
    pointsError(score.points) ||
    (tiebreakerEnabled ? pointsError(score.tiebreaker, "Tiebreaker") : undefined)
  );
}

export function GenericAddRoundDialog({
  open,
  onClose,
  gameId,
  players,
  mode,
  tiebreakerEnabled,
}: GenericAddRoundDialogProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const tabListRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const roundDialog = useGenericRoundDialog(onClose);
  const form = useForm({
    defaultValues: {
      scores: players.map((player) => ({ playerId: player.id, points: "", tiebreaker: "" })),
      winnerId: null as PlayerId | null,
    },
    onSubmit: async ({ value }) => {
      await roundDialog.saveRound(
        mode === "points"
          ? {
              gameId,
              mode: "points",
              scores: value.scores.map(({ playerId, points, tiebreaker }) => ({
                playerId,
                points,
                ...(tiebreakerEnabled ? { tiebreaker } : {}),
              })),
            }
          : {
              gameId,
              mode,
              scores: players.map((player) => ({
                playerId: player.id,
                won: player.id === value.winnerId,
              })),
            },
        () => {
          form.reset();
          setSelectedIndex(0);
        },
      );
    },
  });

  useEffect(() => {
    if (!open) return;
    tabListRef.current
      ?.querySelectorAll<HTMLElement>('[role="tab"]')
      [selectedIndex]?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [open, selectedIndex]);

  return (
    <GenericRoundDialog
      open={open}
      onClose={onClose}
      isPending={roundDialog.isPending}
      onSubmit={() => roundDialog.handleSubmit(form.handleSubmit)}
      submitError={roundDialog.submitError}
      actions={
        <form.Subscribe
          selector={(state) => ({
            complete:
              mode === "points"
                ? state.values.scores.filter((score) => !entryError(score, tiebreakerEnabled))
                    .length
                : Number(state.values.winnerId !== null),
            submitting: state.isSubmitting,
          })}
        >
          {({ complete, submitting }) => (
            <GenericRoundDialogActions
              onClose={onClose}
              submitting={submitting}
              canSave={complete === (mode === "points" ? players.length : 1)}
            >
              <output aria-live="polite" className="text-sm text-text-secondary">
                {complete}/{mode === "points" ? players.length : 1}{" "}
                {mode === "points" ? "entered" : "winner selected"}
              </output>
            </GenericRoundDialogActions>
          )}
        </form.Subscribe>
      }
    >
      {mode === "singleRoundWinner" ? (
        <form.Field name="winnerId">
          {(field) => (
            <WinnerEntry
              players={players}
              value={field.state.value}
              disabled={roundDialog.isPending}
              onChange={(value) => {
                roundDialog.clearSubmitError();
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
                    const complete = !entryError(scores[index], tiebreakerEnabled);
                    return (
                      <Tab
                        key={player.id}
                        aria-label={player.name}
                        title={player.name}
                        aria-describedby={`${id}-entry-${index}`}
                        disabled={roundDialog.isPending}
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
                  name={`scores[${index}]`}
                  validators={{
                    onChange: ({ value }) => entryError(value, tiebreakerEnabled),
                  }}
                >
                  {(field) => (
                    <PointsEntry
                      name={player.name}
                      points={{
                        value: field.state.value.points,
                        error: field.state.value.points
                          ? pointsError(field.state.value.points)
                          : undefined,
                        onChange: (points) => {
                          roundDialog.clearSubmitError();
                          field.handleChange({ ...field.state.value, points });
                        },
                      }}
                      tiebreaker={
                        tiebreakerEnabled
                          ? {
                              value: field.state.value.tiebreaker,
                              error: field.state.value.tiebreaker
                                ? pointsError(field.state.value.tiebreaker, "Tiebreaker")
                                : undefined,
                              onChange: (tiebreaker) => {
                                roundDialog.clearSubmitError();
                                field.handleChange({ ...field.state.value, tiebreaker });
                              },
                            }
                          : undefined
                      }
                      disabled={roundDialog.isPending}
                    />
                  )}
                </form.Field>
              </TabPanel>
            ))}
          </SwipeableTabPanels>
        </TabGroup>
      )}
    </GenericRoundDialog>
  );
}

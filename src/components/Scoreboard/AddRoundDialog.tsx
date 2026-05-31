import { Tab, TabGroup, TabPanel } from "@headlessui/react";
import { Check, ChevronRight, Loader2, Minus, Redo, Trophy, X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useAddRound } from "../../data/hooks/useRounds";
import type { ArrayAtLeastOne, Game, Player, RoundScore } from "../../types";
import { PlayerAvatar } from "../PlayerAvatar/PlayerAvatar";
import {
  Button,
  Dialog,
  List,
  Listbox,
  ListboxButton,
  ListboxLabel,
  ListboxOption,
  ListboxOptions,
  SettingListRow,
  SwipeableTabPanels,
  TabList,
  Toast,
  type ToastHandle,
} from "../ui";
import { AddRoundProgressPopover } from "./AddRoundProgressPopover";
import { isDraftComplete, toRoundScores } from "./addRoundDraft";
import { RoundResultSection } from "./RoundResultSection";
import { TiebreakerEntrySection } from "./TiebreakerEntrySection";
import type { UseAddRoundDraft } from "./useAddRoundDraft";

interface AddRoundDialogProps {
  open: boolean;
  onClose: (open: boolean) => void;
  game: Game;
  players: Player[];
  draft: UseAddRoundDraft;
}

const NO_WINNER_VALUE = "__none__";
type WinnerSelectValue = typeof NO_WINNER_VALUE | string;
const EMPTY_TAB_SCROLL_FADE = { left: false, right: false };
const PLAYER_TAB_NAME_LIMIT = 30;

function getPlayerTabName(name: string) {
  return name.length > PLAYER_TAB_NAME_LIMIT ? `${name.slice(0, PLAYER_TAB_NAME_LIMIT)}…` : name;
}

export function AddRoundDialog({ open, onClose, game, players, draft }: AddRoundDialogProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [tabScroller, setTabScroller] = useState<HTMLDivElement | null>(null);
  const [tabScrollFade, setTabScrollFade] = useState(EMPTY_TAB_SCROLL_FADE);
  const addRound = useAddRound(game.id);
  const toastRef = useRef<ToastHandle>(null);
  const tabListRef = useRef<HTMLDivElement>(null);
  const setTabListRef = useCallback((node: HTMLDivElement | null) => {
    tabListRef.current = node;
    setTabScroller(node);
  }, []);

  // Keep the selected player visible in the horizontal tab strip.
  useEffect(() => {
    const list = tabListRef.current;
    if (!list) return;
    const tabs = list.querySelectorAll<HTMLElement>('[role="tab"]');
    const target = tabs[selectedIndex];
    target?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [selectedIndex]);

  useLayoutEffect(() => {
    if (!open || !tabScroller) {
      setTabScrollFade(EMPTY_TAB_SCROLL_FADE);
      return;
    }

    let frame = 0;

    const updateFades = () => {
      const maxScrollLeft = tabScroller.scrollWidth - tabScroller.clientWidth;
      const next = {
        left: tabScroller.scrollLeft > 1,
        right: tabScroller.scrollLeft < maxScrollLeft - 1,
      };

      setTabScrollFade((previous) =>
        previous.left === next.left && previous.right === next.right ? previous : next,
      );
    };

    const scheduleUpdate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateFades);
    };

    updateFades();
    scheduleUpdate();
    tabScroller.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(scheduleUpdate);
      resizeObserver.observe(tabScroller);
      if (tabScroller.firstElementChild instanceof HTMLElement) {
        resizeObserver.observe(tabScroller.firstElementChild);
      }
    }

    return () => {
      cancelAnimationFrame(frame);
      tabScroller.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      resizeObserver?.disconnect();
    };
  }, [open, tabScroller]);

  const hasWinner = draft.draft.roundWinnerId !== null;
  const canSave = isDraftComplete(draft.draft) && !addRound.isPending;
  const showTiebreakerEntry = game.settings.tiebreaker !== "roundsWon";
  const playerTabColumnCount = Math.max(players.length, 1);

  const handleSave = () => {
    if (!canSave) return;
    let scores: ArrayAtLeastOne<Omit<RoundScore, "currentPhase">>;
    try {
      scores = toRoundScores(draft.draft, game.settings.tiebreaker);
    } catch {
      toastRef.current?.show("Round draft is incomplete — fix highlighted players.");
      return;
    }
    const winnerId = draft.draft.roundWinnerId;
    if (!winnerId) return;
    addRound.mutate(
      { scores, roundWinnerId: winnerId },
      {
        onSuccess: () => {
          draft.reset();
          onClose(false);
        },
        onError: () => {
          toastRef.current?.show("Couldn't save round — try again.");
        },
      },
    );
  };

  const handleWinnerSelect = (next: WinnerSelectValue) => {
    if (next === NO_WINNER_VALUE) {
      draft.clearRoundWinner();
      return;
    }
    draft.setRoundWinner(next);
  };

  const winnerValue: WinnerSelectValue = draft.draft.roundWinnerId ?? NO_WINNER_VALUE;
  const winnerPlayer = players.find((p) => p.id === draft.draft.roundWinnerId);

  return (
    <Dialog open={open} onClose={onClose}>
      <div className="flex h-full min-h-0 flex-col gap-3 px-4 pt-2 pb-3 text-text-primary">
        <TabGroup
          selectedIndex={selectedIndex}
          onChange={setSelectedIndex}
          className="flex min-h-0 flex-1 flex-col gap-3"
        >
          {/* Player tabs — horizontal scroll on overflow */}
          <div className="relative -mx-3 -my-2">
            <div ref={setTabListRef} data-add-round-tab-scroll className="overflow-x-auto py-5">
              <div className="inline-block min-w-full px-3">
                <TabList
                  setSelectedIndex={setSelectedIndex}
                  className={["grid!", "w-full max-w-none"].join(" ")}
                  style={{
                    gridTemplateColumns: `repeat(${playerTabColumnCount}, minmax(max-content, 1fr))`,
                  }}
                >
                  {players.map((player) => {
                    const playerDraft = draft.draft.players.find((p) => p.playerId === player.id);
                    const isWinner = draft.draft.roundWinnerId === player.id;
                    const playerTabName = getPlayerTabName(player.name);
                    return (
                      <Tab
                        key={player.id}
                        aria-label={player.name}
                        title={player.name}
                        className={[
                          "relative z-10 inline-flex w-full min-w-12 cursor-pointer items-center gap-2 overflow-hidden",
                          "rounded-full px-3 py-1.5 text-sm font-semibold outline-none",
                          "opacity-60 hover:brightness-110 data-focus:outline-2",
                          "data-focus:outline-white/60 data-selected:opacity-100",
                        ].join(" ")}
                      >
                        <PlayerAvatar player={player} size={12} />
                        <span className="min-w-0 flex-1 text-center whitespace-nowrap">
                          {playerTabName}
                        </span>
                        <span
                          aria-hidden
                          className="inline-flex h-4 w-4 shrink-0 items-center justify-center"
                        >
                          {isWinner ? (
                            <Trophy className="size-3.5 text-yellow-500" aria-hidden />
                          ) : playerDraft?.result === "completed" ? (
                            <Check className="size-3.5 text-pt-green-500" aria-hidden />
                          ) : playerDraft?.result === "failed" ? (
                            <X className="size-3.5 text-pt-red-500" aria-hidden />
                          ) : playerDraft?.result === "skipped" ? (
                            <Redo className="size-3.5 text-pt-yellow-500" aria-hidden />
                          ) : playerDraft?.result === "satOut" ? (
                            <Minus className="size-3.5 text-pt-blue-500" aria-hidden />
                          ) : null}
                        </span>
                      </Tab>
                    );
                  })}
                </TabList>
              </div>
            </div>
            <span
              data-tab-scroll-fade="left"
              aria-hidden
              className={[
                "pointer-events-none absolute inset-y-0 left-3 z-20 w-2.5 bg-linear-to-r from-white to-transparent",
                "transition-opacity duration-150 dark:from-neutral-900",
                tabScrollFade.left ? "opacity-100" : "opacity-0",
              ].join(" ")}
            />
            <span
              data-tab-scroll-fade="right"
              aria-hidden
              className={[
                "pointer-events-none absolute inset-y-0 right-3 z-20 w-2.5 bg-linear-to-l from-white to-transparent",
                "transition-opacity duration-150 dark:from-neutral-900",
                tabScrollFade.right ? "opacity-100" : "opacity-0",
              ].join(" ")}
            />
          </div>

          {/* Round Winner select (shared across all tabs) */}
          <List allowOverflow className="z-30">
            <Listbox
              key="round-winner"
              value={winnerValue}
              onChange={handleWinnerSelect}
              className="w-full min-w-0"
            >
              <SettingListRow
                label={
                  <ListboxLabel className="flex flex-row gap-2">
                    <Trophy className="size-4 shrink-0 text-yellow-500" aria-hidden />
                    Round Winner
                  </ListboxLabel>
                }
              >
                <ListboxButton variant="plain" className="min-h-10 max-w-full min-w-0">
                  {winnerPlayer ? (
                    <>
                      <PlayerAvatar player={winnerPlayer} size={14} />
                      <span className="min-w-0 truncate text-right">{winnerPlayer.name}</span>
                    </>
                  ) : (
                    <span className="min-w-0 truncate text-right text-text-secondary">
                      Choose winner
                    </span>
                  )}
                </ListboxButton>
                <ListboxOptions
                  align="right"
                  anchor={{ to: "bottom end", gap: "0.25rem", padding: "1rem" }}
                  transformOrigin="top-right"
                  className="max-w-[min(20rem,calc(100vw-2rem))]"
                >
                  <ListboxOption value={NO_WINNER_VALUE}>Choose winner</ListboxOption>
                  {players.map((player) => (
                    <ListboxOption key={player.id} value={player.id}>
                      <PlayerAvatar player={player} size={14} />
                      <span className="min-w-0 truncate">{player.name}</span>
                    </ListboxOption>
                  ))}
                </ListboxOptions>
              </SettingListRow>
            </Listbox>
          </List>

          {/* Body */}
          <div className="relative flex min-h-0 flex-1">
            <SwipeableTabPanels
              selectedIndex={selectedIndex}
              onChange={setSelectedIndex}
              className="-mx-3 -my-3 flex min-h-0 flex-1 flex-col overflow-y-auto py-3"
            >
              {players.map((player) => {
                const playerDraft = draft.draft.players.find((p) => p.playerId === player.id);
                if (!playerDraft) return null;
                const isWinner = draft.draft.roundWinnerId === player.id;

                return (
                  <TabPanel key={player.id} className="flex flex-col px-3">
                    <List rowVariant="content">
                      <RoundResultSection
                        key="round-result"
                        value={playerDraft.result}
                        onChange={(next) => draft.setResult(player.id, next)}
                        expanded={playerDraft.expandedSecondary}
                        onToggleExpand={(next) => draft.setExpandedSecondary(player.id, next)}
                      />

                      {showTiebreakerEntry && (
                        <TiebreakerEntrySection
                          key="tiebreaker-entry"
                          tiebreaker={game.settings.tiebreaker}
                          value={playerDraft.score}
                          onChange={(next) => draft.setScore(player.id, next)}
                          onQuickIncrement={(button) => draft.incrementQuick(player.id, button)}
                          quickCounts={playerDraft.quickCounts}
                          result={playerDraft.result}
                        />
                      )}

                      <button
                        key="won-round"
                        type="button"
                        onClick={() => draft.setRoundWinner(player.id)}
                        aria-pressed={isWinner}
                        className={[
                          "flex w-full cursor-pointer items-center justify-between gap-2 rounded-full px-3 py-2 text-sm font-semibold",
                          "transition-[filter,transform,background-color] duration-150 ease-out",
                          "active:scale-[0.98]",
                          isWinner
                            ? "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300"
                            : "hover:bg-black/5 dark:hover:bg-white/5",
                        ].join(" ")}
                      >
                        <span className="inline-flex items-center gap-2">
                          <Trophy
                            className={[
                              "size-4",
                              isWinner ? "text-yellow-500" : "text-text-secondary",
                            ].join(" ")}
                            aria-hidden
                          />
                          {isWinner ? "Round Winner" : "Won Round"}
                        </span>
                        <ChevronRight
                          className={[
                            "size-4",
                            isWinner ? "opacity-0" : "text-text-secondary",
                          ].join(" ")}
                          aria-hidden
                        />
                      </button>
                    </List>
                  </TabPanel>
                );
              })}
            </SwipeableTabPanels>
          </div>
        </TabGroup>

        {/* Bottom action bar */}
        <div className="flex shrink-0 items-center gap-3 pt-1">
          <Button
            type="button"
            aria-label="Cancel"
            onClick={() => onClose(false)}
            disabled={addRound.isPending}
            className="glass relative inline-flex size-10 cursor-pointer items-center justify-center rounded-full hover:brightness-110 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
          >
            <X className="size-4" aria-hidden />
          </Button>

          <AddRoundProgressPopover
            players={players}
            playerDrafts={draft.draft.players}
            hasRoundWinner={hasWinner}
          />

          <Button
            type="button"
            aria-label="Save round"
            onClick={handleSave}
            disabled={!canSave}
            className="glass relative inline-flex size-10 cursor-pointer items-center justify-center rounded-full hover:brightness-110 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
          >
            {addRound.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Check className="size-4 text-pt-green-500" aria-hidden />
            )}
          </Button>
        </div>

        <Toast ref={toastRef} />
      </div>
    </Dialog>
  );
}

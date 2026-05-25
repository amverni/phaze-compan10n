import { Tab, TabGroup, TabPanel, TabPanels } from "@headlessui/react";
import { Check, ChevronRight, Loader2, Trophy, X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useAddRound } from "../../data/hooks/useRounds";
import type { ArrayAtLeastOne, Game, Player, RoundScore } from "../../types";
import { PlayerAvatar } from "../PlayerAvatar/PlayerAvatar";
import {
  Dialog,
  List,
  Listbox,
  ListboxButton,
  ListboxLabel,
  ListboxOption,
  ListboxOptions,
  SettingListRow,
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

  // Keep selected tab visible when chevrons advance past the visible window
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

  const completedPlayerIds = new Set(
    draft.draft.players.filter((p) => p.result !== null).map((p) => p.playerId),
  );
  const hasWinner = draft.draft.roundWinnerId !== null;
  const canSave = isDraftComplete(draft.draft) && !addRound.isPending;

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
            <div
              ref={setTabListRef}
              data-add-round-tab-scroll
              className="overflow-x-auto px-3 py-5"
            >
              <TabList setSelectedIndex={setSelectedIndex} className="w-max min-w-full max-w-none">
                {players.map((player) => {
                  const playerDraft = draft.draft.players.find((p) => p.playerId === player.id);
                  const isComplete =
                    playerDraft?.result !== null && playerDraft?.result !== undefined;
                  const isWinner = draft.draft.roundWinnerId === player.id;
                  return (
                    <Tab
                      key={player.id}
                      className={[
                        "relative z-10 inline-flex min-w-12 max-w-[24ch] flex-[1_0_96px] cursor-pointer items-center gap-2 overflow-hidden",
                        "rounded-full px-3 py-1.5 text-sm font-semibold outline-none",
                        "opacity-60 hover:brightness-110 data-focus:outline-2",
                        "data-focus:outline-white/60 data-selected:opacity-100",
                      ].join(" ")}
                    >
                      <PlayerAvatar player={player} size={12} />
                      <span className="min-w-0 flex-1 truncate text-center">{player.name}</span>
                      <span
                        aria-hidden
                        className="inline-flex h-4 w-4 shrink-0 items-center justify-center"
                      >
                        {isWinner ? (
                          <Trophy className="size-3.5 text-yellow-500" aria-hidden />
                        ) : isComplete ? (
                          <Check className="size-3.5 text-pt-green-500" aria-hidden />
                        ) : null}
                      </span>
                    </Tab>
                  );
                })}
              </TabList>
            </div>
            <span
              data-tab-scroll-fade="left"
              aria-hidden
              className={[
                "pointer-events-none absolute inset-y-0 left-0 z-20 w-2.5 bg-linear-to-r from-white to-transparent",
                "transition-opacity duration-150 dark:from-neutral-900",
                tabScrollFade.left ? "opacity-100" : "opacity-0",
              ].join(" ")}
            />
            <span
              data-tab-scroll-fade="right"
              aria-hidden
              className={[
                "pointer-events-none absolute inset-y-0 right-0 z-20 w-2.5 bg-linear-to-l from-white to-transparent",
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
              <SettingListRow label={<ListboxLabel>Round Winner</ListboxLabel>}>
                <ListboxButton variant="plain" className="min-h-10 max-w-full min-w-0">
                  {winnerPlayer ? (
                    <>
                      <Trophy className="size-4 shrink-0 text-yellow-500" aria-hidden />
                      <span className="min-w-0 truncate text-right">{winnerPlayer.name}</span>
                    </>
                  ) : (
                    <>
                      <Trophy
                        className="size-4 shrink-0 text-text-secondary opacity-60"
                        aria-hidden
                      />
                      <span className="min-w-0 truncate text-right text-text-secondary">
                        Choose winner
                      </span>
                    </>
                  )}
                </ListboxButton>
                <ListboxOptions
                  align="right"
                  transformOrigin="top-right"
                  className="max-w-[min(20rem,calc(100vw-2rem))]"
                >
                  <ListboxOption value={NO_WINNER_VALUE}>No round winner yet</ListboxOption>
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

          {/* Body with prev/next chevrons flanking in the gutter */}
          <div className="relative flex min-h-0 flex-1">
            <div className="pointer-events-none absolute inset-y-0 -left-2 z-10 flex items-center">
              <div className="pointer-events-auto">
                <TabList.PrevButton
                  aria-label="Previous player"
                  selectedIndex={selectedIndex}
                  tabCount={players.length}
                  setSelectedIndex={setSelectedIndex}
                />
              </div>
            </div>
            <div className="pointer-events-none absolute inset-y-0 -right-2 z-10 flex items-center">
              <div className="pointer-events-auto">
                <TabList.NextButton
                  aria-label="Next player"
                  selectedIndex={selectedIndex}
                  tabCount={players.length}
                  setSelectedIndex={setSelectedIndex}
                />
              </div>
            </div>

            <TabPanels className="-my-3 flex min-h-0 flex-1 flex-col overflow-y-auto px-9 py-3">
              {players.map((player) => {
                const playerDraft = draft.draft.players.find((p) => p.playerId === player.id);
                if (!playerDraft) return null;
                const isWinner = draft.draft.roundWinnerId === player.id;

                return (
                  <TabPanel key={player.id} className="flex flex-col">
                    <div className="glass flex flex-col gap-4 rounded-2xl p-4">
                      <RoundResultSection
                        value={playerDraft.result}
                        onChange={(next) => draft.setResult(player.id, next)}
                        expanded={playerDraft.expandedSecondary}
                        onToggleExpand={(next) => draft.setExpandedSecondary(player.id, next)}
                      />

                      <div
                        aria-hidden
                        className="border-t border-dashed border-black/15 dark:border-white/15"
                      />

                      <TiebreakerEntrySection
                        tiebreaker={game.settings.tiebreaker}
                        value={playerDraft.score}
                        onChange={(next) => draft.setScore(player.id, next)}
                        onQuickIncrement={(button) => draft.incrementQuick(player.id, button)}
                        quickCounts={playerDraft.quickCounts}
                        result={playerDraft.result}
                      />

                      <div
                        aria-hidden
                        className="border-t border-dashed border-black/15 dark:border-white/15"
                      />

                      <button
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
                    </div>
                  </TabPanel>
                );
              })}
            </TabPanels>
          </div>
        </TabGroup>

        {/* Bottom action bar */}
        <div className="flex shrink-0 items-center gap-3 pt-1">
          <button
            type="button"
            aria-label="Cancel"
            onClick={() => onClose(false)}
            disabled={addRound.isPending}
            className="glass relative inline-flex size-10 cursor-pointer items-center justify-center rounded-full hover:brightness-110 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
          >
            <X className="size-4" aria-hidden />
          </button>

          <AddRoundProgressPopover
            players={players}
            completedPlayerIds={completedPlayerIds}
            hasRoundWinner={hasWinner}
          />

          <button
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
          </button>
        </div>

        <Toast ref={toastRef} />
      </div>
    </Dialog>
  );
}

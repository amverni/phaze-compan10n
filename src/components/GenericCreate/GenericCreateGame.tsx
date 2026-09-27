import { Label, Radio, RadioGroup, Tab, TabGroup, TabPanel } from "@headlessui/react";
import { useForm } from "@tanstack/react-form";
import { Link, useNavigate } from "@tanstack/react-router";
import { Play, Settings, Users, X } from "lucide-react";
import { useState } from "react";
import { useCreateGenericGame } from "../../data/hooks/useGenericGames";
import type { GenericPointsSettings, Player } from "../../types";
import { PlayerSelectionProvider } from "../Create/PlayerSelectionContext";
import { Players } from "../Create/Players";
import { ScorekeeperShell } from "../ScorekeeperShell/ScorekeeperShell";
import {
  Button,
  InlineError,
  List,
  ScrollFade,
  SettingListRow,
  SwipeableTabPanels,
  TabList,
  tabClasses,
} from "../ui";

const tabs = [
  { label: "Players", icon: Users },
  { label: "Settings", icon: Settings },
];
const directions = [
  { value: "high", label: "High wins" },
  { value: "low", label: "Low wins" },
] as const;
const directionClasses = [
  "relative cursor-pointer rounded-full px-3 py-2 text-sm outline-none",
  "data-checked:bg-text-secondary/15 data-checked:font-semibold",
  "data-focus:outline-2 data-focus:outline-text-secondary",
].join(" ");

export function GenericCreateGame() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createGame = useCreateGenericGame();
  const navigate = useNavigate();
  const defaultValues: {
    players: Player[];
    pointsDirection: GenericPointsSettings["pointsDirection"];
  } = {
    players: [],
    pointsDirection: "high",
  };
  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const game = await createGame.mutateAsync({
        players: value.players.map((player) => player.id),
        settings: {
          mode: "points",
          pointsDirection: value.pointsDirection,
          tiebreaker: null,
          dealer: false,
        },
      });
      await navigate({ to: "/game/$gameId", params: { gameId: game.id } });
    },
  });

  return (
    <form
      className="h-full"
      aria-label="Create Game"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setSubmitError(null);
        form.handleSubmit().catch((error: unknown) => {
          setSubmitError(error instanceof Error ? error.message : "Unable to start Game.");
        });
      }}
    >
      <ScorekeeperShell
        mainContent={
          <TabGroup
            selectedIndex={selectedIndex}
            onChange={setSelectedIndex}
            className="flex h-full min-h-0 flex-col"
          >
            <div className="content-container w-full shrink-0 pt-2 pb-3">
              <TabList>
                {tabs.map(({ label, icon: Icon }) => (
                  <Tab
                    key={label}
                    className={[tabClasses, "data-focus:outline-text-secondary!"].join(" ")}
                  >
                    <span className="inline-flex items-center justify-center gap-1.5">
                      <Icon className="size-4" aria-hidden />
                      {label}
                    </span>
                  </Tab>
                ))}
              </TabList>
            </div>
            {submitError && (
              <div className="content-container w-full pb-2">
                <InlineError message={submitError} />
              </div>
            )}
            <SwipeableTabPanels
              selectedIndex={selectedIndex}
              onChange={setSelectedIndex}
              className="mx-auto w-full max-w-lg min-h-0 flex-1"
            >
              <TabPanel className="h-full px-4">
                <ScrollFade className="h-full -mx-6 px-6 pb-4">
                  <form.Field
                    name="players"
                    validators={{
                      onChange: ({ value }) =>
                        value.length === 0 ? "Select at least one Player." : undefined,
                    }}
                  >
                    {(field) => (
                      <PlayerSelectionProvider
                        value={{
                          players: field.state.value,
                          addPlayer: (player) =>
                            field.handleChange((players) =>
                              players.some((selected) => selected.id === player.id)
                                ? players
                                : [...players, player],
                            ),
                          removePlayer: (id) =>
                            field.handleChange((players) =>
                              players.filter((player) => player.id !== id),
                            ),
                          reorderPlayers: field.handleChange,
                        }}
                      >
                        <Players />
                        {field.state.meta.errors.length > 0 && (
                          <InlineError message={field.state.meta.errors.join(", ")} />
                        )}
                      </PlayerSelectionProvider>
                    )}
                  </form.Field>
                </ScrollFade>
              </TabPanel>
              <TabPanel className="h-full px-4">
                <ScrollFade className="h-full -mx-6 px-6 py-4">
                  <List rowVariant="content">
                    <SettingListRow key="mode" label="Scoring Mode">
                      <span>Points</span>
                    </SettingListRow>
                    <form.Field key="direction" name="pointsDirection">
                      {(field) => (
                        <RadioGroup
                          value={field.state.value}
                          onChange={field.handleChange}
                          onBlur={field.handleBlur}
                          className="w-full"
                        >
                          <SettingListRow label={<Label>Points Direction</Label>}>
                            <div className="glass relative flex shrink-0 rounded-full p-1">
                              {directions.map(({ value, label }) => (
                                <Radio key={value} value={value} className={directionClasses}>
                                  {label}
                                </Radio>
                              ))}
                            </div>
                          </SettingListRow>
                        </RadioGroup>
                      )}
                    </form.Field>
                  </List>
                </ScrollFade>
              </TabPanel>
            </SwipeableTabPanels>
          </TabGroup>
        }
        footerContent={
          <div className="content-container flex h-full justify-between">
            <Button as={Link} to="/" aria-label="Cancel" className="page-shell-footer-button p-0">
              <X className="size-8" aria-hidden />
            </Button>
            <form.Subscribe
              selector={(state) => [
                state.values.players.length > 0 && state.canSubmit,
                state.isSubmitting,
              ]}
            >
              {([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  aria-label="Start"
                  className="page-shell-footer-button p-0"
                  disabled={!canSubmit || isSubmitting}
                >
                  <Play className="size-8" aria-hidden />
                </Button>
              )}
            </form.Subscribe>
          </div>
        }
      />
    </form>
  );
}

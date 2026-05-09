import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { appSettingsOptions } from "../../data/hooks/useSettings";
import { CardBackground } from "../CardBackground/CardBackground";
import { Logo } from "../Logo/Logo";
import { Button, List } from "../ui";
import { DefaultPhaseSetSetting } from "./DefaultPhaseSetSetting";
import { DefaultTiebreakerSetting } from "./DefaultTiebreakerSetting";
import { ResetSettingsButton } from "./ResetSettingsButton";

export function Settings() {
  const { data: settings, isLoading } = useQuery(appSettingsOptions());

  return (
    <CardBackground
      headerContent={
        <div className="relative flex h-full items-center">
          <div className="absolute inset-0 flex items-center justify-center pt-6">
            <Logo height={100} width="100%" />
          </div>
        </div>
      }
      mainContent={
        <div className="content-container h-full py-4">
          <div className="flex items-center justify-end pb-2">
            <ResetSettingsButton disabled={isLoading} />
          </div>
          <List allowOverflow isLoading={isLoading} shimmerRows={2}>
            {settings
              ? [
                  <DefaultTiebreakerSetting
                    key="default-tiebreaker"
                    value={settings.gameDefaults.tiebreaker}
                  />,
                  <DefaultPhaseSetSetting
                    key="default-phase-set"
                    value={settings.gameDefaults.phaseSetId}
                  />,
                ]
              : null}
          </List>
        </div>
      }
      footerContent={
        <div className="content-container flex h-full">
          <Button
            onClick={() => window.history.back()}
            className="size-14 p-0"
            aria-label="Go back"
          >
            <ArrowLeft className="size-8" />
          </Button>
        </div>
      }
    />
  );
}

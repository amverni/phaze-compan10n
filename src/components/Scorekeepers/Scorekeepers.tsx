import { Link } from "@tanstack/react-router";
import { Logo } from "../Logo/Logo";
import { ScorekeeperLogo } from "../Logo/ScorekeeperLogo";
import { Button } from "../ui";

const choiceClasses = ["w-full overflow-hidden rounded-2xl! px-4 py-6"].join(" ");

export function Scorekeepers() {
  return (
    <main
      className={[
        "page-shell flex min-h-0 flex-col overflow-x-clip",
        "pt-(--safe-area-inset-top) pb-(--safe-area-inset-bottom)",
      ].join(" ")}
    >
      <h1 className="sr-only">Scorekeepers</h1>
      <div className="page-shell-main min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
        <nav
          aria-label="Scorekeepers"
          className="content-container flex w-full flex-col gap-6 px-6 py-6"
        >
          <Button as={Link} to="/scorekeeper" aria-label="Scorekeeper" className={choiceClasses}>
            <ScorekeeperLogo height={80} />
          </Button>
          <Button
            as={Link}
            to="/phaseCompan10n"
            aria-label="Phase Compan10n"
            className={choiceClasses}
          >
            <Logo height={120} width="100%" fitToContainer />
          </Button>
        </nav>
      </div>
    </main>
  );
}

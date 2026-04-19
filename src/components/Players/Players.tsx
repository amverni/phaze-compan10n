import { ArrowLeft } from "lucide-react";
import { useRef, useState } from "react";
import { CardBackground } from "../CardBackground/CardBackground";
import { Logo } from "../Logo/Logo";
import { Button } from "../ui";
import { PlayerListRow } from "./PlayerListRow";
import { PlayersSearch } from "./PlayersSearch";

export function Players() {
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

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
        <PlayersSearch
          inputRef={inputRef}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          renderRow={(player) => <PlayerListRow player={player} />}
        />
      }
      footerContent={
        <div className="flex h-full items-center justify-center px-4">
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

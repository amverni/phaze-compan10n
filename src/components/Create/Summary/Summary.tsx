import { Play, X } from "lucide-react";
import { CardBackground } from "../../CardBackground/CardBackground";
import { Logo } from "../../Logo/Logo";
import { Button } from "../../ui/Button/Button";

export function Summary() {
  return (
    <CardBackground
      headerContent={
        <div className="flex h-full items-center justify-center pt-6">
          <Logo height={100} width="100%" />
        </div>
      }
      footerContent={
        <div className="flex h-full items-center justify-between px-6">
          {/* Cancel — back to home */}
          <Button as="link" to="/" aria-label="Cancel" icon={X} />

          {/* Start game */}
          <Button aria-label="Start" icon={Play} />
        </div>
      }
    />
  );
}

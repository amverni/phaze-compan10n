import * as Popover from "@radix-ui/react-popover";
import type { ReactElement, ReactNode, RefObject } from "react";
import { popoverPanelClasses } from "./Popover";

interface ControlledPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dismissible: boolean;
  label: string;
  trigger: ReactElement;
  initialFocus: RefObject<HTMLElement | null>;
  restoreFocus: boolean;
  afterClose: () => void;
  children: ReactNode;
}

// Headless UI's uncontrolled Popover cannot veto dismissal while an action is pending.
export function ControlledPopover({
  open,
  onOpenChange,
  dismissible,
  label,
  trigger,
  initialFocus,
  restoreFocus,
  afterClose,
  children,
}: ControlledPopoverProps) {
  return (
    <Popover.Root open={open} onOpenChange={onOpenChange} modal>
      <Popover.Trigger asChild>{trigger}</Popover.Trigger>
      <Popover.Portal>
        {/* Shell controls opt into pointer events, bypassing modal body styles. */}
        <div className="pointer-events-auto fixed inset-0 z-50" aria-hidden="true" />
      </Popover.Portal>
      <Popover.Portal>
        <Popover.Content
          aria-label={label}
          side="top"
          align="end"
          sideOffset={8}
          collisionPadding={16}
          className={[
            popoverPanelClasses,
            "z-50 w-44 max-w-[calc(100vw-var(--safe-area-inset-left)-var(--safe-area-inset-right)-2rem)]",
            "max-h-(--radix-popover-content-available-height) overflow-y-auto text-text-primary",
          ].join(" ")}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            initialFocus.current?.focus();
          }}
          onCloseAutoFocus={(event) => {
            if (!restoreFocus) event.preventDefault();
            afterClose();
          }}
          onEscapeKeyDown={(event) => {
            if (!dismissible) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (!dismissible) event.preventDefault();
          }}
        >
          {children}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

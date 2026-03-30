import {
  DialogPanel,
  type DialogProps,
  Dialog as HeadlessDialog,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import type { ElementType } from "react";
import "./Dialog.css";

const panelClasses = "glass dialog-glass relative w-[85vw] max-w-lg overflow-hidden rounded-2xl";

/**
 * A frosted-glass dialog that wraps Headless UI's `Dialog`.
 *
 * Accepts the same props as `@headlessui/react`'s `Dialog` and layers on
 * the app's glass styling with a slide-up transition.
 *
 * Usage:
 * ```tsx
 * <Dialog open={open} onClose={setOpen}>
 *   <p>Your content here</p>
 * </Dialog>
 * ```
 */
export function Dialog<TTag extends ElementType = "div">(props: DialogProps<TTag>) {
  const { children, open, className, ...rest } = props as DialogProps<"div">;

  const mergedPanelClasses = [panelClasses, className].filter(Boolean).join(" ");

  return (
    <Transition show={open}>
      <HeadlessDialog {...(rest as DialogProps<"div">)} className="relative z-50">
        {/* Dim overlay */}
        <TransitionChild
          enter="dialog-backdrop-enter"
          enterFrom="dialog-backdrop-closed"
          enterTo="dialog-backdrop-open"
          leave="dialog-backdrop-leave"
          leaveFrom="dialog-backdrop-open"
          leaveTo="dialog-backdrop-closed"
        >
          <div className="fixed inset-0 bg-black/40" />
        </TransitionChild>

        {/* Centering wrapper — above the backdrop */}
        <div className="fixed inset-0 z-10 flex items-center justify-center">
          {/* Glass panel — slides up */}
          <TransitionChild
            enter="dialog-panel-enter"
            enterFrom="dialog-panel-closed"
            enterTo="dialog-panel-open"
            leave="dialog-panel-leave"
            leaveFrom="dialog-panel-open"
            leaveTo="dialog-panel-closed"
          >
            <DialogPanel className={mergedPanelClasses}>{children}</DialogPanel>
          </TransitionChild>
        </div>
      </HeadlessDialog>
    </Transition>
  );
}

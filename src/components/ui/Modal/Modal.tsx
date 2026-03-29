import { Dialog, DialogPanel, Transition, TransitionChild } from "@headlessui/react";
import type { ReactNode } from "react";
import "./Modal.css";

export interface ModalProps {
  open: boolean;
  onClose: (value: boolean) => void;
  children: ReactNode;
  /** Extra classes applied to the glass panel. */
  className?: string;
}

/**
 * Full-screen modal that slides up from the bottom with a glass panel.
 *
 * Usage:
 * ```tsx
 * <Modal open={open} onClose={setOpen}>
 *   <p>Your content here</p>
 * </Modal>
 * ```
 */
export function Modal({ open, onClose, children, className }: ModalProps) {
  return (
    <Transition show={open}>
      <Dialog onClose={onClose} className="relative z-50">
        {/* Dim overlay */}
        <TransitionChild
          enter="modal-backdrop-enter"
          enterFrom="modal-backdrop-closed"
          enterTo="modal-backdrop-open"
          leave="modal-backdrop-leave"
          leaveFrom="modal-backdrop-open"
          leaveTo="modal-backdrop-closed"
        >
          <div className="fixed inset-0 bg-black/40" />
        </TransitionChild>

        {/* Centering wrapper — above the backdrop */}
        <div className="fixed inset-0 z-10 flex items-center justify-center">
          {/* Glass panel — slides up */}
          <TransitionChild
            enter="modal-panel-enter"
            enterFrom="modal-panel-closed"
            enterTo="modal-panel-open"
            leave="modal-panel-leave"
            leaveFrom="modal-panel-open"
            leaveTo="modal-panel-closed"
          >
            <DialogPanel
              className={["glass modal-glass relative w-[85vw] max-w-lg rounded-2xl p-6", className]
                .filter(Boolean)
                .join(" ")}
            >
              {children}
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}

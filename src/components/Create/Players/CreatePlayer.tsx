import { Field, Fieldset, Label, Legend } from "@headlessui/react";
import { useForm } from "@tanstack/react-form";
import { ArrowLeft } from "lucide-react";
import { useRef, useState } from "react";
import { playersApi } from "../../../data/api/players";
import { getRandomColorName } from "../../../data/constants/colors";
import { useCreatePlayer } from "../../../data/hooks/usePlayers";
import type { Player } from "../../../types";
import { Button } from "../../ui/Button/Button";
import { Checkbox } from "../../ui/Checkbox/Checkbox";
import { ColorPicker } from "../../ui/ColorPicker/ColorPicker";
import { List } from "../../ui/List/List";
import { Toast, type ToastHandle } from "../../ui/Toast/Toast";

export interface CreatePlayerProps {
  /** Pre-filled player name (e.g. from the search box). */
  defaultName?: string;
  /** Called when the user navigates back to the previous view. */
  onBack: () => void;
  /** Called after a player is successfully created. */
  onCreated?: (player: Player) => void;
}

export function CreatePlayer({ defaultName, onBack, onCreated }: CreatePlayerProps) {
  const createPlayer = useCreatePlayer();
  const [nameError, setNameError] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const toastRef = useRef<ToastHandle>(null);

  /** Trigger a shake animation on the name input. */
  function shakeNameInput() {
    const el = nameInputRef.current;
    if (!el) return;
    el.classList.remove("shake");
    // Force reflow so re-adding the class restarts the animation
    void el.offsetWidth;
    el.classList.add("shake");
  }

  const form = useForm({
    defaultValues: {
      name: defaultName ?? "",
      color: getRandomColorName(),
      isFavorite: 0 as 0 | 1,
    },
    onSubmit: async ({ value }) => {
      const data = {
        name: value.name.trim(),
        color: value.color,
        wins: 0,
        isFavorite: value.isFavorite,
      };

      const errors = await playersApi.validate(data);
      if (errors) {
        if (errors.name) {
          toastRef.current?.show(errors.name);
          setNameError(true);
          shakeNameInput();
        }
        return;
      }

      const player = await createPlayer.mutateAsync(data);
      onCreated?.(player);
      onBack();
    },
  });

  return (
    <div className="relative flex h-full flex-col">
      <Toast ref={toastRef} />

      {/* Header */}
      <div className="flex items-center gap-2 p-3 pb-0">
        <Button onClick={onBack} className="h-9 w-9 shrink-0 p-0" aria-label="Back to search">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-base font-medium text-text-secondary">New Player</h2>
      </div>

      {/* Form */}
      <form
        className="flex flex-1 flex-col overflow-y-auto p-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Fieldset disabled={isSubmitting} className="flex flex-1 flex-col gap-4">
              <Legend className="sr-only">New Player</Legend>

              {/* Name */}
              <form.Field
                name="name"
                validators={{
                  onChange: ({ value }) => (!value.trim() ? "Name is required" : undefined),
                }}
              >
                {(field) => {
                  const hasError = field.state.meta.errors.length > 0 || nameError;
                  return (
                    <Field className="flex flex-col gap-1">
                      <Label className="text-sm font-medium text-text-secondary">Name</Label>
                      <input
                        ref={nameInputRef}
                        type="text"
                        value={field.state.value}
                        onChange={(e) => {
                          setNameError(false);
                          field.handleChange(e.target.value);
                        }}
                        onBlur={field.handleBlur}
                        placeholder="Player name"
                        aria-invalid={hasError}
                        className={`glass rounded-xl bg-transparent px-3 py-2 text-sm outline-none placeholder:text-text-secondary/50 transition-colors${
                          hasError ? " glass-error" : ""
                        }`}
                      />
                    </Field>
                  );
                }}
              </form.Field>

              {/* Color */}
              <form.Field name="color">
                {(field) => (
                  <Field>
                    <ColorPicker value={field.state.value} onChange={field.handleChange} />
                  </Field>
                )}
              </form.Field>

              {/* Options */}
              <List>
                <form.Field name="isFavorite">
                  {(field) => (
                    <Field className="flex w-full items-center justify-between">
                      <Label className="cursor-pointer text-sm text-text-secondary">Favorite</Label>
                      <Checkbox
                        checked={field.state.value === 1}
                        onChange={(checked: boolean) => field.handleChange(checked ? 1 : 0)}
                      />
                    </Field>
                  )}
                </form.Field>
              </List>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Actions */}
              <div className="flex gap-2">
                <form.Subscribe
                  selector={(state) => [
                    state.canSubmit && !!state.values.name.trim() && !nameError,
                    state.isSubmitting,
                  ]}
                >
                  {([canSubmit, isSubmitting]) => (
                    <Button
                      type="submit"
                      disabled={!canSubmit}
                      className="w-full px-4 py-2 text-sm"
                    >
                      {isSubmitting ? "Saving…" : "Save"}
                    </Button>
                  )}
                </form.Subscribe>
              </div>
            </Fieldset>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}

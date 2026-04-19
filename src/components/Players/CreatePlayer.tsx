import { Field, Fieldset, Label, Legend } from "@headlessui/react";
import { useForm } from "@tanstack/react-form";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { playersApi } from "../../data/api/players";
import { getRandomColorName } from "../../data/constants/colors";
import { useCreatePlayer, useDeletePlayer, useUpdatePlayer } from "../../data/hooks/usePlayers";
import type { Player } from "../../types";
import { Button } from "../ui/Button/Button";
import { Checkbox } from "../ui/Checkbox/Checkbox";
import { ColorPicker } from "../ui/ColorPicker/ColorPicker";
import { List } from "../ui/List/List";
import { Toast, type ToastHandle } from "../ui/Toast/Toast";

export interface CreatePlayerProps {
  /** Pre-filled player name (e.g. from the search box). */
  defaultName?: string;
  /** Existing player to edit. When provided, the form operates in edit mode. */
  player?: Player;
  /** Called when the user navigates back to the previous view. */
  onBack: () => void;
  /** Called after a player is successfully created. */
  onCreated?: (player: Player) => void;
  /** Called after a player is successfully deleted (edit mode only). */
  onDeleted?: () => void;
}

export function CreatePlayer({
  defaultName,
  player,
  onBack,
  onCreated,
  onDeleted,
}: CreatePlayerProps) {
  const isEditing = !!player;
  const createPlayer = useCreatePlayer();
  const updatePlayer = useUpdatePlayer();
  const deletePlayer = useDeletePlayer();
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
      name: player?.name ?? defaultName ?? "",
      color: player?.color ?? getRandomColorName(),
      isFavorite: (player?.isFavorite ?? 0) as 0 | 1,
    },
    onSubmit: async ({ value }) => {
      const data = {
        name: value.name.trim(),
        color: value.color,
        wins: player?.wins ?? 0,
        isFavorite: value.isFavorite,
      };

      const errors = await playersApi.validate(data, player?.id);
      if (errors) {
        if (errors.name) {
          toastRef.current?.show(errors.name);
          setNameError(true);
          shakeNameInput();
        }
        return;
      }

      if (isEditing) {
        const updated = await updatePlayer.mutateAsync({ id: player.id, updates: data });
        onCreated?.(updated);
      } else {
        const created = await createPlayer.mutateAsync(data);
        onCreated?.(created);
      }
      onBack();
    },
  });

  async function handleDelete() {
    if (!player) return;
    await deletePlayer.mutateAsync(player.id);
    onDeleted?.();
    onBack();
  }

  return (
    <div className="relative flex h-full flex-col">
      <Toast ref={toastRef} />

      {/* Header */}
      <div className="flex items-center gap-2 p-3 pb-0">
        <Button onClick={onBack} className="h-9 w-9 shrink-0 p-0" aria-label="Back to search">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-base font-medium text-text-secondary">
          {isEditing ? "Edit Player" : "New Player"}
        </h2>
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
              <Legend className="sr-only">{isEditing ? "Edit Player" : "New Player"}</Legend>

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
                        style={
                          hasError
                            ? ({ "--_g-border": "rgba(248, 113, 113, 0.6)" } as React.CSSProperties)
                            : undefined
                        }
                        className="glass rounded-xl bg-transparent px-3 py-2 text-sm outline-none placeholder:text-text-secondary/50 transition-colors"
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
                {isEditing && (
                  <Button
                    type="button"
                    onClick={handleDelete}
                    className="toast-glass px-4 py-2 text-sm text-white"
                    style={
                      {
                        "--_g-bg": "rgba(185, 40, 40, 0.55)",
                        "--_g-border": "rgba(255, 100, 100, 0.4)",
                      } as React.CSSProperties
                    }
                    aria-label="Delete player"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
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

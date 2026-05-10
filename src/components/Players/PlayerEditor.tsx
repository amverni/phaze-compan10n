import { Field, Fieldset, Label, Legend } from "@headlessui/react";
import { useForm } from "@tanstack/react-form";
import { ArrowLeft, Trash } from "lucide-react";
import { useId, useState } from "react";
import { playersApi } from "../../data/api/players";
import { getRandomColorName } from "../../data/constants/colors";
import { useCreatePlayer, useDeletePlayer, useUpdatePlayer } from "../../data/hooks/usePlayers";
import type { Player } from "../../types";
import { Button } from "../ui/Button/Button";
import { ColorPicker } from "../ui/ColorPicker/ColorPicker";
import { Input } from "../ui/Input/Input";
import { List } from "../ui/List/List";
import { Switch } from "../ui/Switch/Switch";

export interface PlayerEditorProps {
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

export function PlayerEditor({
  defaultName,
  player,
  onBack,
  onCreated,
  onDeleted,
}: PlayerEditorProps) {
  const isEditing = !!player;
  const createPlayer = useCreatePlayer();
  const updatePlayer = useUpdatePlayer();
  const deletePlayer = useDeletePlayer();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const nameErrorId = useId();
  const submitErrorId = useId();

  const form = useForm({
    defaultValues: {
      name: player?.name ?? defaultName ?? "",
      color: player?.color ?? getRandomColorName(),
      isFavorite: (player?.isFavorite ?? 0),
    },
    validators: {
      onSubmitAsync: async ({ value }) => {
        const errors = await playersApi.validate(
          {
            name: value.name.trim(),
            color: value.color,
            wins: player?.wins ?? 0,
            isFavorite: value.isFavorite,
          },
          player?.id,
        );

        if (errors?.name) {
          return { fields: { name: errors.name } };
        }
        return undefined;
      },
    },
    onSubmit: async ({ value }) => {
      const data = {
        name: value.name.trim(),
        color: value.color,
        wins: player?.wins ?? 0,
        isFavorite: value.isFavorite,
      };

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
    if (!window.confirm(`Delete ${player.name}?`)) return;
    await deletePlayer.mutateAsync(player.id);
    onDeleted?.();
    onBack();
  }

  return (
    <div className="relative flex h-full flex-col">
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
          setSubmitError(null);
          form.handleSubmit().catch((error: unknown) => {
            setSubmitError(error instanceof Error ? error.message : "Unable to save player");
          });
        }}
      >
        <Fieldset className="flex flex-1 flex-col gap-4">
          <Legend className="sr-only">{isEditing ? "Edit Player" : "New Player"}</Legend>

          {/* Name */}
          <form.Field
            name="name"
            validators={{
              onChange: ({ value }) => (!value.trim() ? "Name is required" : undefined),
            }}
          >
            {(field) => {
              const nameError = field.state.meta.errors[0];
              const hasError = nameError !== undefined;
              return (
                <Field className="flex flex-col gap-1">
                  <Label className="text-sm font-medium text-text-secondary">Name</Label>
                  <Input
                    type="text"
                    autoFocus
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Player name"
                    invalid={hasError}
                    aria-invalid={hasError}
                    aria-describedby={hasError ? nameErrorId : undefined}
                    className={[
                      "glass rounded-xl px-3 py-2 transition-colors",
                      hasError ? "glass-error" : "",
                    ].join(" ")}
                  />
                  {hasError && (
                    <p
                      id={nameErrorId}
                      className="text-sm text-red-700 dark:text-red-300"
                      role="alert"
                    >
                      {String(nameError)}
                    </p>
                  )}
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
            <form.Field key="favorite" name="isFavorite">
              {(field) => (
                <Field className="flex w-full items-center justify-between">
                  <Label className="cursor-pointer text-sm text-text-secondary">Favorite</Label>
                  <Switch
                    checked={field.state.value === 1}
                    onChange={(checked: boolean) => field.handleChange(checked ? 1 : 0)}
                    className="data-checked:bg-amber-400!"
                  />
                </Field>
              )}
            </form.Field>
          </List>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {submitError && (
              <p
                id={submitErrorId}
                className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300"
                role="alert"
              >
                {submitError}
              </p>
            )}
            <div className="flex gap-2">
              {isEditing && (
                <Button
                  type="button"
                  onClick={handleDelete}
                  className="glass-danger px-4 py-2 text-sm text-white"
                  aria-label="Delete player"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              )}
              <form.Subscribe
                selector={(state) => [
                  state.canSubmit && !!state.values.name.trim(),
                  state.isSubmitting,
                ]}
              >
                {([canSubmit, isSubmitting]) => (
                  <Button
                    type="submit"
                    disabled={!canSubmit || isSubmitting}
                    className="w-full px-4 py-2 text-sm active:scale-102!"
                    aria-describedby={submitError ? submitErrorId : undefined}
                  >
                    {isSubmitting ? "Saving..." : "Save"}
                  </Button>
                )}
              </form.Subscribe>
            </div>
          </div>
        </Fieldset>
      </form>
    </div>
  );
}

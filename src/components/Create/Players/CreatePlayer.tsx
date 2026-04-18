import { Field, Fieldset, Label, Legend } from "@headlessui/react";
import { useForm } from "@tanstack/react-form";
import { ArrowLeft } from "lucide-react";
import { getRandomColorName } from "../../../data/constants/colors";
import { useCreatePlayer } from "../../../data/hooks/usePlayers";
import { Button } from "../../ui/Button/Button";
import { Checkbox } from "../../ui/Checkbox/Checkbox";
import { ColorPicker } from "../../ui/ColorPicker/ColorPicker";
import { List } from "../../ui/List/List";
import { useAddPlayer } from "../CreateGameContext";

export interface CreatePlayerProps {
  /** Pre-filled player name (e.g. from the search box). */
  defaultName?: string;
  /** Called when the user navigates back to the previous view. */
  onBack: () => void;
}

export function CreatePlayer({ defaultName, onBack }: CreatePlayerProps) {
  const addPlayer = useAddPlayer();
  const createPlayer = useCreatePlayer();

  const form = useForm({
    defaultValues: {
      name: defaultName ?? "",
      color: getRandomColorName(),
      isFavorite: 0 as 0 | 1,
    },
    onSubmit: async ({ value }) => {
      const player = await createPlayer.mutateAsync({
        name: value.name.trim(),
        color: value.color,
        wins: 0,
        isFavorite: value.isFavorite,
      });
      addPlayer(player);
      onBack();
    },
  });

  return (
    <div className="flex h-full flex-col">
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
                  onSubmit: ({ value }) => (!value.trim() ? "Name is required" : undefined),
                }}
              >
                {(field) => (
                  <Field className="flex flex-col gap-1">
                    <Label className="text-sm font-medium text-text-secondary">Name</Label>
                    <input
                      type="text"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Player name"
                      className="glass rounded-xl bg-transparent px-3 py-2 text-sm outline-none placeholder:text-text-secondary/50"
                    />
                  </Field>
                )}
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
                <Button type="button" onClick={onBack} className="flex-1 px-4 py-2 text-sm">
                  Discard
                </Button>
                <form.Subscribe
                  selector={(state) => [
                    state.canSubmit && !!state.values.name.trim(),
                    state.isSubmitting,
                  ]}
                >
                  {([canSubmit, isSubmitting]) => (
                    <Button
                      type="submit"
                      disabled={!canSubmit}
                      className="flex-1 px-4 py-2 text-sm"
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

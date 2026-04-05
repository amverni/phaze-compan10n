import { useForm } from "@tanstack/react-form";
import { ArrowLeft, Star } from "lucide-react";
import { useCreatePlayer } from "../../../data/hooks/usePlayers";
import { Button } from "../../ui/Button/Button";
import { ColorPicker } from "../../ui/ColorPicker/ColorPicker";
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
      color: "#ef4444",
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
        <h2 className="text-sm font-medium text-text-secondary">New Player</h2>
      </div>

      {/* Form */}
      <form
        className="flex flex-1 flex-col gap-4 overflow-y-auto p-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        {/* Name */}
        <form.Field
          name="name"
          validators={{
            onSubmit: ({ value }) => (!value.trim() ? "Name is required" : undefined),
          }}
        >
          {(field) => (
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-text-secondary">Name</span>
              <input
                type="text"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="Player name"
                className="glass rounded-xl bg-transparent px-3 py-2 text-sm outline-none placeholder:text-text-secondary/50"
              />
              {field.state.meta.errors.length > 0 && (
                <span className="text-xs text-red-400">{field.state.meta.errors.join(", ")}</span>
              )}
            </label>
          )}
        </form.Field>

        {/* Color */}
        <form.Field name="color">
          {(field) => (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-text-secondary">Color</span>
              <ColorPicker value={field.state.value} onChange={field.handleChange} />
            </div>
          )}
        </form.Field>

        {/* Favorite toggle */}
        <form.Field name="isFavorite">
          {(field) => (
            <button
              type="button"
              className="flex items-center gap-2 self-start rounded-xl px-1 py-1"
              onClick={() => field.handleChange(field.state.value === 1 ? 0 : 1)}
            >
              <Star
                className={`h-5 w-5 transition-colors ${
                  field.state.value === 1
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-text-secondary"
                }`}
              />
              <span className="text-sm text-text-secondary">Favorite</span>
            </button>
          )}
        </form.Field>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="flex gap-2">
          <Button type="button" onClick={onBack} className="flex-1 px-4 py-2 text-sm">
            Discard
          </Button>
          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <Button type="submit" disabled={!canSubmit} className="flex-1 px-4 py-2 text-sm">
                {isSubmitting ? "Saving…" : "Save"}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </form>
    </div>
  );
}

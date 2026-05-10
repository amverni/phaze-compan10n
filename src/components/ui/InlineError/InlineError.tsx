import { Button } from "../Button/Button";

interface InlineErrorProps {
  message: string;
  onRetry?: () => void;
}

export function InlineError({ message, onRetry }: InlineErrorProps) {
  return (
    <div
      className="rounded-2xl bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300"
      role="alert"
    >
      <p>{message}</p>
      {onRetry && (
        <Button type="button" className="mt-3 px-3 py-2" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

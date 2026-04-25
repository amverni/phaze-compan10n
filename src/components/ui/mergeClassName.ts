/**
 * Merge a base className with the className from a Headless UI component's props.
 *
 * Headless UI's generic polymorphic props don't expose `className` as a known
 * property at the type level, so we accept the full props object and read
 * `className` via property access. This avoids type assertions while supporting
 * both static strings and Headless UI's render-prop className functions.
 */
export function mergeClassName(
  base: string,
  props: Record<string, unknown>,
): string | ((...args: unknown[]) => string) {
  const incoming = props.className;
  if (typeof incoming === "function") {
    return (...args: unknown[]) => [base, incoming(...args)].filter(Boolean).join(" ");
  }
  return [base, incoming].filter(Boolean).join(" ");
}

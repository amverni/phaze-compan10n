import { TabList as HeadlessTabList, type TabListProps } from "@headlessui/react";
import { Children, type ElementType, isValidElement, type ReactNode } from "react";
import "./TabList.css";

const baseClasses = "glass glass-tabs relative flex w-full max-w-md items-center rounded-full p-1";

/**
 * A frosted-glass tab bar that wraps Headless UI's `TabList`.
 *
 * Accepts the same props as `@headlessui/react`'s `TabList` and layers on
 * the app's glass styling. Place `<Tab>` children inside just like you
 * would with the Headless UI component.
 *
 * Automatically renders a sliding glass indicator that tracks the selected
 * tab. The tab count is derived from `React.Children.count`.
 *
 * Must be placed inside a `<TabGroup>`.
 */
export function TabList<TTag extends ElementType = "div">(props: TabListProps<TTag>) {
  const { children, ...rest } = props as TabListProps<"div"> & {
    children?: ReactNode | ((bag: { selectedIndex: number }) => ReactNode);
  };

  const incomingClassName = (rest as Record<string, unknown>).className;
  const merged =
    typeof incomingClassName === "function"
      ? (...args: unknown[]) =>
          [baseClasses, (incomingClassName as (...a: unknown[]) => string)(...args)]
            .filter(Boolean)
            .join(" ")
      : [baseClasses, incomingClassName].filter(Boolean).join(" ");

  return (
    <HeadlessTabList {...rest} className={merged}>
      {({ selectedIndex }: { selectedIndex: number }) => {
        const resolved = typeof children === "function" ? children({ selectedIndex }) : children;
        const tabCount = Children.toArray(resolved).filter(isValidElement).length;

        return (
          <>
            {tabCount > 0 && (
              <div
                className="glass glass-tab-indicator absolute top-1 bottom-1 rounded-full transition-all duration-300 ease-in-out"
                style={{
                  width: `calc(${100 / tabCount}% - 8px)`,
                  left: `calc(${(selectedIndex * 100) / tabCount}% + 4px)`,
                }}
                aria-hidden
              />
            )}
            {resolved}
          </>
        );
      }}
    </HeadlessTabList>
  );
}

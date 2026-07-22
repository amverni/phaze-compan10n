import { interactiveClasses } from "./sharedClasses";

export const tabClasses = [
  "relative z-10 flex-1 rounded-full py-2 text-sm font-semibold",
  "opacity-60 hover:brightness-110 data-selected:opacity-100",
  interactiveClasses,
].join(" ");

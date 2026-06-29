const SCROLL_TOLERANCE_PX = 1;

export function isAddRoundBodyScrollable({
  scrollHeight,
  clientHeight,
}: {
  scrollHeight: number;
  clientHeight: number;
}): boolean {
  return scrollHeight - clientHeight >= SCROLL_TOLERANCE_PX;
}

export function shouldHideWonRoundButton({
  activePanelContentHeight,
  scrollViewportHeight,
  hiddenWonRoundButtonHeight = 0,
  wonRoundButtonHidden,
}: {
  activePanelContentHeight: number;
  scrollViewportHeight: number;
  hiddenWonRoundButtonHeight?: number;
  wonRoundButtonHidden: boolean;
}): boolean {
  return isAddRoundBodyScrollable({
    scrollHeight:
      activePanelContentHeight + (wonRoundButtonHidden ? hiddenWonRoundButtonHeight : 0),
    clientHeight: scrollViewportHeight,
  });
}

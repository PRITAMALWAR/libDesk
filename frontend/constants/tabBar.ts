/**
 * Keep in sync with `FloatingTabBar` visual layout.
 * Use `scrollPaddingBottom()` for list/scroll content that sits under the floating tabs.
 */
export const FLOATING_TAB_BAR_INNER_HEIGHT = 56;
export const FLOATING_TAB_BAR_BOTTOM_MARGIN = 6; // gap above home indicator / screen edge
export const FLOATING_TAB_BAR_TOP_BUFFER = 12; // breathing room above the bar for scroll content

export function scrollPaddingBottom(insetBottom = 0): number {
  const safe = Math.max(insetBottom, 12);
  return safe + FLOATING_TAB_BAR_BOTTOM_MARGIN + FLOATING_TAB_BAR_INNER_HEIGHT + FLOATING_TAB_BAR_TOP_BUFFER;
}

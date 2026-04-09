import { useMemo } from "react";
import { Platform, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type FloatingTabBarMetrics = {
  height: number;
  sideInset: number;
  bottomInset: number;
  borderRadius: number;
};

/** Narrow web viewports — keep tab chrome short so content gets the fold. */
export function isMobileWeb(width: number): boolean {
  return Platform.OS === "web" && width <= 768;
}

export type TabListingChrome = {
  mobileWeb: boolean;
  headerPaddingTop: number;
  headerPaddingBottom: number;
  avatarSize: number;
  headerUserIconSize: number;
  titleFontSize: number;
  searchBarPaddingY: number;
  searchSectionMarginBottom: number;
  tabsSectionMarginBottom: number;
  filterIndicatorMarginBottom: number;
  segmentedTabPaddingY: number;
};

export function getTabListingChrome(width: number, safeAreaTop: number): TabListingChrome {
  const mobileWeb = isMobileWeb(width);
  return {
    mobileWeb,
    headerPaddingTop: mobileWeb ? Math.max(6, safeAreaTop + 4) : Math.max(12, safeAreaTop + 8),
    headerPaddingBottom: mobileWeb ? 8 : 16,
    avatarSize: mobileWeb ? 40 : 48,
    headerUserIconSize: mobileWeb ? 22 : 24,
    titleFontSize: mobileWeb ? 20 : 24,
    searchBarPaddingY: mobileWeb ? 10 : 16,
    searchSectionMarginBottom: mobileWeb ? 8 : 16,
    tabsSectionMarginBottom: mobileWeb ? 8 : 16,
    filterIndicatorMarginBottom: mobileWeb ? 6 : 12,
    segmentedTabPaddingY: mobileWeb ? 8 : 10,
  };
}

export function getScreenHorizontalPadding(width: number) {
  if (width <= 360) return 14;
  if (width <= 430) return 16;
  if (width <= 768) return 20;
  return 24;
}

export function getFloatingTabBarMetrics(
  width: number,
  safeAreaBottomInset: number,
): FloatingTabBarMetrics {
  const compact = width <= 390;
  const height = compact ? 78 : 84;
  const sideInset = compact ? 12 : 20;
  const borderRadius = compact ? 30 : 35;
  const baseBottomInset = compact ? 10 : 12;
  const bottomInset = Math.max(baseBottomInset, safeAreaBottomInset + 8);

  return {
    height,
    sideInset,
    bottomInset,
    borderRadius,
  };
}

export function getTabContentBottomPadding(
  metrics: FloatingTabBarMetrics,
  opts?: { webCompact?: boolean },
) {
  const tail = opts?.webCompact ? 12 : 24;
  return metrics.height + metrics.bottomInset + tail;
}

export function getTwoColumnCardWidth(width: number) {
  const gutter = getScreenHorizontalPadding(width);
  const interCardGap = width <= 390 ? 10 : 12;
  return (width - gutter * 2 - interCardGap) / 2;
}

/** Tab screens (floating tab bar), stack screens, or stack screens with a fixed bottom nav bar. */
export function useResponsivePadding(
  variant: "tab" | "stack" | "stackBottomNav",
) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const horizontalPad = useMemo(
    () => getScreenHorizontalPadding(width),
    [width],
  );
  const tabMetrics = useMemo(
    () => getFloatingTabBarMetrics(width, insets.bottom),
    [width, insets.bottom],
  );
  const listingChrome = useMemo(
    () => getTabListingChrome(width, insets.top),
    [width, insets.top],
  );
  const headerPaddingTop =
    variant === "tab" ? listingChrome.headerPaddingTop : Math.max(12, insets.top + 8);
  const headerPaddingBottom = variant === "tab" ? listingChrome.headerPaddingBottom : 8;
  const scrollBottomPadding = useMemo(() => {
    if (variant === "tab") {
      return getTabContentBottomPadding(tabMetrics, {
        webCompact: listingChrome.mobileWeb,
      });
    }
    if (variant === "stackBottomNav") {
      return Math.max(insets.bottom + 100, 120);
    }
    return Math.max(insets.bottom + 24, 32);
  }, [variant, tabMetrics, insets.bottom, listingChrome.mobileWeb]);

  return {
    width,
    horizontalPad,
    headerPaddingTop,
    headerPaddingBottom,
    scrollBottomPadding,
    insets,
    tabMetrics,
    listingChrome,
  };
}

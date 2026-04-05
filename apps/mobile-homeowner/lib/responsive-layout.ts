export type FloatingTabBarMetrics = {
  height: number;
  sideInset: number;
  bottomInset: number;
  borderRadius: number;
};

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
  const height = compact ? 72 : 80;
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

export function getTabContentBottomPadding(metrics: FloatingTabBarMetrics) {
  return metrics.height + metrics.bottomInset + 24;
}

export function getTwoColumnCardWidth(width: number) {
  const gutter = getScreenHorizontalPadding(width);
  const interCardGap = width <= 390 ? 10 : 12;
  return (width - gutter * 2 - interCardGap) / 2;
}

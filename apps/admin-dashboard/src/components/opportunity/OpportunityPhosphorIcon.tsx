'use client';

import type { IconProps } from '@phosphor-icons/react';
import {
  Armchair,
  Buildings,
  CalendarBlank,
  Car,
  Clock,
  Coins,
  Crane,
  CurrencyNgn,
  Drop,
  Factory,
  Handshake,
  HardHat,
  HouseLine,
  Key,
  Lightning,
  Lock,
  MapPinArea,
  MapTrifold,
  Mountains,
  OfficeChair,
  Phone,
  Receipt,
  RoadHorizon,
  Ruler,
  Scales,
  Scroll,
  Shield,
  Storefront,
  Vault,
  Warehouse,
  WifiHigh,
} from '@phosphor-icons/react';

const ICON_MAP = {
  Armchair,
  Buildings,
  CalendarBlank,
  Car,
  Clock,
  Coins,
  Crane,
  CurrencyNgn,
  Drop,
  Factory,
  Handshake,
  HardHat,
  HouseLine,
  Key,
  Lightning,
  Lock,
  MapPinArea,
  MapTrifold,
  Mountains,
  OfficeChair,
  Phone,
  Receipt,
  RoadHorizon,
  Ruler,
  Scales,
  Scroll,
  Shield,
  Storefront,
  Vault,
  Warehouse,
  WifiHigh,
} as const;

export type OpportunityPhosphorIconName = keyof typeof ICON_MAP;

type Props = IconProps & {
  name: OpportunityPhosphorIconName | string;
};

export function OpportunityPhosphorIcon({ name, ...props }: Props) {
  const Icon = ICON_MAP[name as OpportunityPhosphorIconName] ?? HouseLine;
  return <Icon {...props} />;
}

import { Text, View } from 'react-native';
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
  Receipt,
  RoadHorizon,
  Ruler,
  Scales,
  Scroll,
  SealCheck,
  Shield,
  Storefront,
  Vault,
  Warehouse,
  WifiHigh,
} from 'phosphor-react-native';
import {
  buildOpportunityDisplayData,
  formatOpportunityCheckValue,
  getOpportunityProfile,
  splitCommaList,
  type BuildOpportunityCategoryKey,
  type OpportunityEntity,
} from '@buildmyhouse/shared-types';

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

type IconName = keyof typeof ICON_MAP;

function OpportunityIcon({ name, size = 13 }: { name: string; size?: number }) {
  const Icon = ICON_MAP[name as IconName] ?? HouseLine;
  return <Icon size={size} color="#374151" weight="bold" />;
}

export type OpportunityDetailData = Record<string, unknown> & {
  opportunityCategory?: string | null;
};

type Props = {
  entity: OpportunityEntity;
  data: OpportunityDetailData;
};

export function OpportunityDetailSections({ entity, data }: Props) {
  const category = (data.opportunityCategory || 'residential') as BuildOpportunityCategoryKey;
  const profile = getOpportunityProfile(entity, category);
  const displayData = buildOpportunityDisplayData(entity, data);
  const verificationDocs = splitCommaList(data[profile.verificationDocField]);
  const extraDocs = profile.verificationExtraField
    ? splitCommaList(data[profile.verificationExtraField])
    : [];
  const pills = [...verificationDocs, ...extraDocs];

  return (
    <>
      <View className="bg-gray-50 rounded-2xl p-3 mb-3 border border-gray-200">
        <Text className="text-black mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
          Opportunity Snapshot
        </Text>
        <Text className="text-gray-600 text-xs mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
          {profile.snapshotIntro}
        </Text>
        {profile.snapshotRows.map((row) => (
          <Text
            key={row.fieldKey}
            className="text-gray-700 text-sm mb-1"
            style={{ fontFamily: row.fieldKey === 'agencyFeePercent' ? 'Poppins_600SemiBold' : 'Poppins_400Regular' }}
          >
            {row.label}: {formatOpportunityCheckValue(row, displayData)}
          </Text>
        ))}
      </View>

      <View className="bg-gray-50 rounded-2xl p-3 mb-3 border border-gray-200">
        <Text className="text-black mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
          {profile.checksTitle}
        </Text>
        {profile.checkRows.map((row) => (
          <View key={row.fieldKey} className="flex-row items-start mb-2">
            <View className="w-6 h-6 rounded-full bg-gray-100 items-center justify-center mr-2 mt-0.5">
              <OpportunityIcon name={row.icon} />
            </View>
            <Text className="text-gray-700 text-sm flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
              {row.label}: {formatOpportunityCheckValue(row, displayData)}
            </Text>
          </View>
        ))}
      </View>

      {pills.length > 0 ? (
        <View className="mb-4">
          <Text className="text-black mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            {profile.verificationTitle}
          </Text>
          <View className="flex-row flex-wrap">
            {pills.map((doc) => (
              <View key={doc} className="bg-black rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center">
                <SealCheck size={12} color="#FFFFFF" weight="bold" />
                <Text className="text-white text-xs ml-1" style={{ fontFamily: 'Poppins_500Medium' }}>
                  {doc}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </>
  );
}

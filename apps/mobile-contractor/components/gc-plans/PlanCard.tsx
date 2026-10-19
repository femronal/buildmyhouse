import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Image } from 'expo-image';
import { MoreHorizontal } from 'lucide-react-native';
import { getPlanStatus, planStatusLabel, planTypeLine, showsPlanSpecs, specLine, type PlanListStatus } from './plan-status';

const CARD_BG = '#1E3A5F';
const PAGE_LINE = '#1E40AF66';

export function PlanCard({
  design,
  imageUrl,
  onEdit,
  onDelete,
}: {
  design: any;
  imageUrl?: string | null;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const status = getPlanStatus(design);
  const specs = showsPlanSpecs(design) ? specLine(design) : '';
  const initial = String(design.projectTypeTag || design.planType || 'P').trim().charAt(0).toUpperCase();

  return (
    <TouchableOpacity
      onPress={onEdit}
      activeOpacity={0.85}
      className="rounded-2xl p-3 mb-3"
      style={{ backgroundColor: CARD_BG, borderWidth: 1, borderColor: PAGE_LINE }}
    >
      <View className="flex-row">
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={{ width: 80, height: 80, borderRadius: 12, backgroundColor: '#0A1628' }}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={150}
          />
        ) : (
          <View style={{ width: 80, height: 80, borderRadius: 12, backgroundColor: '#0A1628' }} className="items-center justify-center">
            <Text className="text-blue-300 text-lg" style={{ fontFamily: 'Poppins_600SemiBold' }}>{initial}</Text>
          </View>
        )}
        <View className="flex-1 ml-3 min-w-0">
          <View className="flex-row items-start">
            <Text className="flex-1 text-white" numberOfLines={1} style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 16 }}>
              {design.name}
            </Text>
            <StatusPill status={status} />
          </View>
          {planTypeLine(design) ? (
            <Text className="text-blue-200/70 mt-1" numberOfLines={1} style={{ fontFamily: 'Poppins_400Regular', fontSize: 13 }}>
              {planTypeLine(design)}
            </Text>
          ) : null}
          <Text className="text-white mt-1" style={{ fontFamily: 'Poppins_700Bold', fontSize: 15 }}>
            ₦{Number(design.estimatedCost || 0).toLocaleString()}
          </Text>
        </View>
      </View>
      {status === 'rejected' && design.adminReviewReason ? (
        <Text className="text-red-300 mt-3" numberOfLines={2} style={{ fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 18 }}>
          {design.adminReviewReason}
        </Text>
      ) : null}
      {specs ? (
        <Text className="text-blue-100/70 mt-2" style={{ fontFamily: 'Poppins_400Regular', fontSize: 13 }}>{specs}</Text>
      ) : null}
      {design.description ? (
        <Text className="text-blue-100/60 mt-1" numberOfLines={1} style={{ fontFamily: 'Poppins_400Regular', fontSize: 13 }}>
          {design.description}
        </Text>
      ) : null}
      <View className="flex-row items-center justify-between mt-3">
        <TouchableOpacity onPress={onEdit}>
          <Text className="text-blue-300" style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14 }}>
            {status === 'rejected' ? 'Edit and resubmit' : 'Edit'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setMenuOpen(true)}
          accessibilityLabel="More actions"
          className="w-8 h-8 items-center justify-center"
        >
          <MoreHorizontal size={18} color="#93C5FD" strokeWidth={2} />
        </TouchableOpacity>
      </View>
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setMenuOpen(false)} className="flex-1 bg-black/50 justify-end">
          <TouchableOpacity activeOpacity={1} className="bg-[#1E3A5F] rounded-t-3xl px-6 pt-5 pb-8 border-t border-blue-900">
            <TouchableOpacity
              onPress={() => {
                setMenuOpen(false);
                onDelete();
              }}
              className="py-3"
            >
              <Text className="text-red-400" style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 16 }}>Delete plan</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMenuOpen(false)} className="py-3">
              <Text className="text-blue-200" style={{ fontFamily: 'Poppins_500Medium', fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </TouchableOpacity>
  );
}

export function DraftPlanRow({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="rounded-2xl p-4 mb-3"
      style={{ backgroundColor: CARD_BG, borderWidth: 1, borderColor: PAGE_LINE }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-3">
          <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 16 }}>
            Unfinished plan, tap to continue
          </Text>
        </View>
        <StatusPill status="draft" />
      </View>
    </TouchableOpacity>
  );
}

function StatusPill({ status }: { status: PlanListStatus }) {
  const styles: Record<PlanListStatus, { color: string; backgroundColor: string; borderColor: string }> = {
    live: { color: '#FFFFFF', backgroundColor: '#16A34A', borderColor: '#16A34A' },
    pending: { color: '#FDE68A', backgroundColor: '#78350F66', borderColor: '#F59E0B66' },
    rejected: { color: '#FECACA', backgroundColor: '#7F1D1D66', borderColor: '#EF444466' },
    hidden: { color: '#93C5FD', backgroundColor: '#0A1628', borderColor: '#1E40AF66' },
    draft: { color: '#BFDBFE', backgroundColor: '#0A1628', borderColor: '#60A5FA' },
  };
  const tone = styles[status];
  return (
    <View className="rounded-full px-2 py-1" style={{ backgroundColor: tone.backgroundColor, borderWidth: 1, borderColor: tone.borderColor }}>
      <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 11, color: tone.color }}>{planStatusLabel(status)}</Text>
    </View>
  );
}

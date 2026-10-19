import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Image } from 'expo-image';
import { MoreHorizontal } from 'lucide-react-native';
import { getPlanStatus, planStatusLabel, planTypeLine, showsPlanSpecs, specLine, type PlanListStatus } from './plan-status';

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
      className="bg-white rounded-2xl p-3 mb-3"
      style={{ borderWidth: 1, borderColor: '#E5E5E5' }}
    >
      <View className="flex-row">
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={{ width: 80, height: 80, borderRadius: 12, backgroundColor: '#F5F5F5' }}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={150}
          />
        ) : (
          <View style={{ width: 80, height: 80, borderRadius: 12, backgroundColor: '#F5F5F5' }} className="items-center justify-center">
            <Text className="text-gray-500 text-lg" style={{ fontFamily: 'Poppins_600SemiBold' }}>{initial}</Text>
          </View>
        )}
        <View className="flex-1 ml-3">
          <View className="flex-row items-start">
            <Text className="flex-1 text-black" numberOfLines={1} style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 16 }}>
              {design.name}
            </Text>
            <StatusPill status={status} />
          </View>
          {planTypeLine(design) ? (
            <Text className="text-gray-500 mt-1" numberOfLines={1} style={{ fontFamily: 'Poppins_400Regular', fontSize: 13 }}>
              {planTypeLine(design)}
            </Text>
          ) : null}
          <Text className="text-black mt-1" style={{ fontFamily: 'Poppins_700Bold', fontSize: 15 }}>
            ₦{Number(design.estimatedCost || 0).toLocaleString()}
          </Text>
        </View>
      </View>
      {status === 'rejected' && design.adminReviewReason ? (
        <Text className="text-red-700 mt-3" numberOfLines={2} style={{ fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 18 }}>
          {design.adminReviewReason}
        </Text>
      ) : null}
      {specs ? (
        <Text className="text-gray-500 mt-2" style={{ fontFamily: 'Poppins_400Regular', fontSize: 13 }}>{specs}</Text>
      ) : null}
      {design.description ? (
        <Text className="text-gray-500 mt-1" numberOfLines={1} style={{ fontFamily: 'Poppins_400Regular', fontSize: 13 }}>
          {design.description}
        </Text>
      ) : null}
      <View className="flex-row items-center justify-between mt-3">
        <TouchableOpacity onPress={onEdit}>
          <Text className="text-black" style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14 }}>
            {status === 'rejected' ? 'Edit and resubmit' : 'Edit'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setMenuOpen(true)}
          accessibilityLabel="More actions"
          className="w-8 h-8 items-center justify-center"
        >
          <MoreHorizontal size={18} color="#111111" strokeWidth={2} />
        </TouchableOpacity>
      </View>
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setMenuOpen(false)} className="flex-1 bg-black/40 justify-end">
          <TouchableOpacity activeOpacity={1} className="bg-white rounded-t-3xl px-6 pt-5 pb-8">
            <TouchableOpacity
              onPress={() => {
                setMenuOpen(false);
                onDelete();
              }}
              className="py-3"
            >
              <Text className="text-red-600" style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 16 }}>Delete plan</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMenuOpen(false)} className="py-3">
              <Text className="text-gray-600" style={{ fontFamily: 'Poppins_500Medium', fontSize: 16 }}>Cancel</Text>
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
      className="bg-white rounded-2xl p-4 mb-3"
      style={{ borderWidth: 1, borderColor: '#E5E5E5' }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-3">
          <Text className="text-black" style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 16 }}>
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
    live: { color: '#166534', backgroundColor: '#DCFCE7', borderColor: '#DCFCE7' },
    pending: { color: '#374151', backgroundColor: '#F3F4F6', borderColor: '#F3F4F6' },
    rejected: { color: '#B91C1C', backgroundColor: '#FEE2E2', borderColor: '#FEE2E2' },
    hidden: { color: '#6B7280', backgroundColor: '#F5F5F5', borderColor: '#F5F5F5' },
    draft: { color: '#111111', backgroundColor: '#FFFFFF', borderColor: '#111111' },
  };
  const tone = styles[status];
  return (
    <View className="rounded-full px-2 py-1" style={{ backgroundColor: tone.backgroundColor, borderWidth: 1, borderColor: tone.borderColor }}>
      <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 11, color: tone.color }}>{planStatusLabel(status)}</Text>
    </View>
  );
}

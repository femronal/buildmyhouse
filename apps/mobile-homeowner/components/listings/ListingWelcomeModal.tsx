import { Modal, Pressable, Text, View } from 'react-native';
import LogoText from '@/components/LogoText';
import { listingManagePath, type ListingWelcomeKind } from '@/lib/listing-welcome';

type Props = {
  visible: boolean;
  kind: ListingWelcomeKind | null;
  onContinue: (path: string) => void;
  onStay: () => void;
};

export default function ListingWelcomeModal({ visible, kind, onContinue, onStay }: Props) {
  const detail =
    kind === 'vendor'
      ? 'Add a storefront photo, a logo, and any other pictures of the business. Your account can still start and follow projects in this app.'
      : 'Add a profile picture and a logo for the practice. Your account can still start and follow projects in this app.';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onStay}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.62)', justifyContent: 'center', padding: 24 }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 24 }}>
          <LogoText size="sm" />
          <Text
            style={{
              fontFamily: 'Poppins_700Bold',
              fontSize: 28,
              lineHeight: 34,
              color: '#171717',
              marginTop: 20,
            }}
          >
            Manage your listings in the owner app.
          </Text>
          <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 15, lineHeight: 22, color: '#525252', marginTop: 12 }}>
            {detail}
          </Text>
          <Pressable
            onPress={() => kind && onContinue(listingManagePath(kind))}
            accessibilityRole="button"
            style={{
              marginTop: 24,
              minHeight: 48,
              borderRadius: 999,
              backgroundColor: '#171717',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 20,
            }}
          >
            <Text style={{ fontFamily: 'Poppins_600SemiBold', color: '#fff', fontSize: 15 }}>Continue</Text>
          </Pressable>
          <Pressable
            onPress={onStay}
            accessibilityRole="button"
            style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 8 }}
          >
            <Text style={{ fontFamily: 'Poppins_600SemiBold', color: '#171717', fontSize: 14 }}>Stay on home</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

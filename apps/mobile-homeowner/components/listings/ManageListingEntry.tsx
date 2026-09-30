import { Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { LANDING_BORDER, LANDING_INK } from '@/lib/home-landing-content';
import {
  listingManagePath,
  listingWelcomeHandled,
  ownerHomeWithListingWelcome,
  type ListingWelcomeKind,
} from '@/lib/listing-welcome';
import { requireAuthToContinue } from '@/lib/require-auth-to-continue';

export default function ManageListingEntry({ kind }: { kind: ListingWelcomeKind }) {
  const router = useRouter();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();

  const open = () => {
    const destination = listingWelcomeHandled(kind)
      ? listingManagePath(kind)
      : ownerHomeWithListingWelcome(kind);
    void (async () => {
      const canContinue = await requireAuthToContinue({
        router,
        currentUser,
        userLoading,
        destinationPath: destination,
        promptTitle: 'Sign in to manage',
        promptMessage:
          'Create a free homeowner account. You will land in the BuildMyHouse app, then open your listing from there.',
      });
      if (!canContinue) return;
      router.push(destination as any);
    })();
  };

  return (
    <Pressable
      onPress={open}
      accessibilityRole="button"
      style={{
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 8,
        marginRight: 8,
        marginBottom: 8,
        minHeight: 44,
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: LANDING_BORDER,
      }}
    >
      <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: LANDING_INK }}>Manage listing</Text>
    </Pressable>
  );
}

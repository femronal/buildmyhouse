import { useEffect, useState } from 'react';
import { Linking, Modal, Platform, Pressable, Share, Text, View } from 'react-native';
import { Share2 } from 'lucide-react-native';
import { api } from '@/lib/api';

type Mine = { code: string; shareUrl: string; clientsJoinedCount: number };

export function InviteClientSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [mine, setMine] = useState<Mine | null>(null);
  const [copied, setCopied] = useState(false);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setCopied(false);
    void api.get('/referrals/me').then(setMine).catch(() => setMine(null));
  }, [visible]);

  const markSeen = async () => {
    if (seen) return;
    setSeen(true);
    try {
      await api.post('/referrals/me/invite-prompt-seen', {});
    } catch {
      // The sheet still closes if the acknowledgement cannot be saved.
    }
  };

  const acknowledge = async () => {
    await markSeen();
    onClose();
  };

  const shareUrl = mine?.shareUrl || '';
  const message = `Hi, I now manage my jobs on BuildMyHouse. You can follow the work on your property, see photos of each stage and approve it here: ${shareUrl}`;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={acknowledge}>
      <Pressable
        onPress={acknowledge}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: Platform.OS === 'web' ? 'center' : 'flex-end', padding: 16 }}
      >
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={{ backgroundColor: '#fff', borderRadius: 20, padding: 20, maxWidth: 420, width: '100%', alignSelf: 'center' }}
        >
          <View style={{ alignItems: 'center', marginBottom: 12 }}>
            <Share2 size={28} color="#111" />
          </View>
          <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 22, textAlign: 'center', color: '#111' }}>
            Invite your client to BuildMyHouse
          </Text>
          <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 15, textAlign: 'center', color: '#525252', marginTop: 8, lineHeight: 22 }}>
            Send your client one link. They can follow the work, see photos of each stage and approve it from anywhere, even from abroad.
          </Text>
          <Text selectable style={{ fontFamily: 'Poppins_500Medium', fontSize: 13, marginTop: 16, color: '#111' }}>
            {shareUrl || 'Preparing your link…'}
          </Text>
          <Pressable
            onPress={() => {
              if (shareUrl) void Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`);
              void acknowledge();
            }}
            style={{ backgroundColor: '#22c55e', borderRadius: 12, paddingVertical: 14, marginTop: 16 }}
          >
            <Text style={{ fontFamily: 'Poppins_600SemiBold', color: '#fff', textAlign: 'center' }}>Share on WhatsApp</Text>
          </Pressable>
          <Pressable
            onPress={async () => {
              if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
                await navigator.clipboard.writeText(shareUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              } else {
                await Share.share({ message });
              }
              void markSeen();
              setTimeout(onClose, Platform.OS === 'web' ? 2000 : 0);
            }}
            style={{ borderWidth: 1, borderColor: '#111', borderRadius: 12, paddingVertical: 14, marginTop: 10 }}
          >
            <Text style={{ fontFamily: 'Poppins_600SemiBold', color: '#111', textAlign: 'center' }}>
              {copied ? 'Link copied' : 'Copy link'}
            </Text>
          </Pressable>
          <Pressable onPress={acknowledge} style={{ paddingVertical: 12 }}>
            <Text style={{ fontFamily: 'Poppins_500Medium', color: '#525252', textAlign: 'center' }}>Maybe later</Text>
          </Pressable>
          {mine && mine.clientsJoinedCount > 0 ? (
            <Text style={{ fontFamily: 'Poppins_400Regular', color: '#737373', textAlign: 'center', fontSize: 13 }}>
              Clients who joined: {mine.clientsJoinedCount}
            </Text>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

import { useMemo, useState } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { usePathname } from 'expo-router';
import { MessageCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getFloatingTabBarMetrics } from '@/lib/responsive-layout';

const WHATSAPP_URL = 'https://wa.me/2348105475652';

export default function WhatsAppFloatingChat() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [isOpen, setIsOpen] = useState(false);

  const shouldHide = /(^|\/)chat(\/|$)/.test(pathname ?? '');

  const tabRoutes = useMemo(
    () => new Set(['/home', '/explore', '/rent', '/finance']),
    [],
  );
  const isTabScreen = tabRoutes.has(pathname ?? '');
  const tabMetrics = useMemo(
    () => getFloatingTabBarMetrics(width, insets.bottom),
    [width, insets.bottom],
  );
  const floatingBottom = isTabScreen
    ? tabMetrics.height + tabMetrics.bottomInset + 14
    : Math.max(insets.bottom + 20, 24);
  const modalWidth = Math.min(280, Math.max(232, width - 24));

  if (shouldHide) {
    return null;
  }

  const handleOpenChat = async () => {
    try {
      await Linking.openURL(WHATSAPP_URL);
    } catch {
      // no-op: if WhatsApp/browser cannot open, keep widget usable.
    }
  };

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {isOpen ? (
        <View
          style={[
            styles.modalCard,
            { bottom: floatingBottom + 52 + 12, width: modalWidth },
          ]}
        >
          <Text style={styles.modalText}>
            Need help? Chat with Ayomide (real human support) on WhatsApp.
          </Text>
          <View style={styles.actionsRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setIsOpen(false)}
              style={[styles.buttonBase, styles.closeButton]}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={handleOpenChat}
              style={[styles.buttonBase, styles.chatButton]}
            >
              <Text style={styles.chatButtonText}>Chat on WhatsApp</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <Pressable
        accessibilityLabel="Open WhatsApp support chat"
        accessibilityRole="button"
        onHoverIn={Platform.OS === 'web' ? () => setIsOpen(true) : undefined}
        onPress={() => setIsOpen((prev) => !prev)}
        style={[styles.dotButton, { bottom: floatingBottom }]}
      >
        <MessageCircle color="#04150A" size={14} strokeWidth={2.4} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  dotButton: {
    position: 'absolute',
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#39FF88',
    borderWidth: 1,
    borderColor: '#A8FFD0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#39FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 14,
    elevation: 10,
    zIndex: 1000,
  },
  modalCard: {
    position: 'absolute',
    right: 16,
    backgroundColor: '#0E0F12',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1A1D24',
    padding: 12,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  modalText: {
    color: '#F4F7FA',
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  buttonBase: {
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  closeButton: {
    backgroundColor: '#1C1F27',
  },
  closeButtonText: {
    color: '#D6DBE5',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
  },
  chatButton: {
    backgroundColor: '#39FF88',
    flex: 1,
    alignItems: 'center',
  },
  chatButtonText: {
    color: '#03120A',
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
  },
});

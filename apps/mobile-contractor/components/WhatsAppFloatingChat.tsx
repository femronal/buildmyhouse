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
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getFloatingTabBarMetrics } from '@/lib/responsive-layout';

const WHATSAPP_URL = 'https://wa.me/2347030282417';

export default function WhatsAppFloatingChat() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [isOpen, setIsOpen] = useState(false);
  const currentPath = pathname ?? '';

  const shouldHide =
    /(^|\/)chat(\/|$)/.test(currentPath) ||
    /(^|\/)dashboard(\/|$)/.test(currentPath) ||
    /(^|\/)gc-project-detail(\/|$)/.test(currentPath) ||
    /(^|\/)stage-detail(\/|$)/.test(currentPath);

  const tabRoutes = useMemo(() => new Set(['/home', '/finance']), []);
  const isTabScreen = tabRoutes.has(pathname ?? '');
  const hasGcBottomNav =
    /^\/contractor\/gc-(dashboard|requests|notifications|plans|earnings|profile)(\/|$)/.test(
      currentPath,
    );
  const tabMetrics = useMemo(
    () => getFloatingTabBarMetrics(width, insets.bottom),
    [width, insets.bottom],
  );
  const floatingBottom = hasGcBottomNav
    ? Math.max(insets.bottom + 106, 110)
    : isTabScreen
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
        <Svg width={28} height={28} viewBox="0 0 50 50">
          <Path
            fill="#1FB400"
            fillRule="nonzero"
            d="M25,2c-12.682,0 -23,10.318 -23,23c0,3.96 1.023,7.854 2.963,11.29l-2.926,10.44c-0.096,0.343 -0.003,0.711 0.245,0.966c0.191,0.197 0.451,0.304 0.718,0.304c0.08,0 0.161,-0.01 0.24,-0.029l10.896,-2.699c3.327,1.786 7.074,2.728 10.864,2.728c12.682,0 23,-10.318 23,-23c0,-12.682 -10.318,-23 -23,-23zM36.57,33.116c-0.492,1.362 -2.852,2.605 -3.986,2.772c-1.018,0.149 -2.306,0.213 -3.72,-0.231c-0.857,-0.27 -1.957,-0.628 -3.366,-1.229c-5.923,-2.526 -9.791,-8.415 -10.087,-8.804c-0.295,-0.389 -2.411,-3.161 -2.411,-6.03c0,-2.869 1.525,-4.28 2.067,-4.864c0.542,-0.584 1.181,-0.73 1.575,-0.73c0.394,0 0.787,0.005 1.132,0.021c0.363,0.018 0.85,-0.137 1.329,1.001c0.492,1.168 1.673,4.037 1.819,4.33c0.148,0.292 0.246,0.633 0.05,1.022c-0.196,0.389 -0.294,0.632 -0.59,0.973c-0.296,0.341 -0.62,0.76 -0.886,1.022c-0.296,0.291 -0.603,0.606 -0.259,1.19c0.344,0.584 1.529,2.493 3.285,4.039c2.255,1.986 4.158,2.602 4.748,2.894c0.59,0.292 0.935,0.243 1.279,-0.146c0.344,-0.39 1.476,-1.703 1.869,-2.286c0.393,-0.583 0.787,-0.487 1.329,-0.292c0.542,0.194 3.445,1.604 4.035,1.896c0.59,0.292 0.984,0.438 1.132,0.681c0.148,0.242 0.148,1.41 -0.344,2.771z"
          />
        </Svg>
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
    backgroundColor: '#050805',
    borderWidth: 1,
    borderColor: '#1FB400',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
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

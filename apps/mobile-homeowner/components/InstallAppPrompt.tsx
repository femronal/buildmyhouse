import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Download, X } from 'lucide-react-native';

const DISMISS_STORAGE_KEY = 'bmh:installPromptDismissed:v1';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

function isRunningStandalone(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  const navStandalone = typeof navigator !== 'undefined' && (navigator as any).standalone === true;
  const mediaStandalone = window.matchMedia?.('(display-mode: standalone)')?.matches;
  return Boolean(navStandalone || mediaStandalone);
}

export default function InstallAppPrompt() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [hidden, setHidden] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);

  const isWeb = Platform.OS === 'web';
  const isMobileViewport = width <= 768;
  const userAgent = isWeb && typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
  const isIosSafari = /iphone|ipad|ipod/.test(userAgent) && /safari/.test(userAgent) && !/crios|fxios/.test(userAgent);
  const isAndroid = /android/.test(userAgent);
  const shouldRender = isWeb && isMobileViewport && !isRunningStandalone() && !hidden;

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const dismissed = window.localStorage.getItem(DISMISS_STORAGE_KEY);
    if (dismissed === '1') setHidden(true);
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const handler = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const helperText = useMemo(() => {
    if (isIosSafari) {
      return 'On iPhone Safari: tap Share, choose "Add to Home Screen", then tap Add.';
    }
    if (isAndroid) {
      return installEvent
        ? 'Tap install below to add BuildMyHouse to your home screen.'
        : 'Open browser menu, then tap "Install app" or "Add to Home screen".';
    }
    return 'Use your browser menu to add BuildMyHouse to your home screen.';
  }, [installEvent, isAndroid, isIosSafari]);

  if (!shouldRender) return null;

  const handleDismiss = () => {
    setHidden(true);
    setExpanded(false);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.localStorage.setItem(DISMISS_STORAGE_KEY, '1');
    }
  };

  const handleInstall = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  };

  const topOffset = insets.top + 8;

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <View style={[styles.banner, { top: topOffset }]}>
        <View style={styles.bannerLeft}>
          <Download size={15} color="#FFFFFF" strokeWidth={2.2} />
          <Text style={styles.bannerTitle}>Install BuildMyHouse App</Text>
        </View>
        <View style={styles.bannerActions}>
          <Pressable onPress={() => setExpanded((prev) => !prev)} style={styles.linkButton}>
            <Text style={styles.linkButtonText}>{expanded ? 'Hide' : 'How'}</Text>
          </Pressable>
          <Pressable onPress={handleDismiss} style={styles.iconButton}>
            <X size={16} color="#FFFFFF" strokeWidth={2.2} />
          </Pressable>
        </View>
      </View>

      {expanded ? (
        <View style={[styles.panel, { top: topOffset + 52 }]}>
          <Text style={styles.panelHeading}>Install on your phone</Text>
          <Text style={styles.panelBody}>{helperText}</Text>
          {installEvent ? (
            <Pressable onPress={handleInstall} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Install now</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: 12,
    right: 12,
    minHeight: 42,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#0A0A0A',
    borderWidth: 1,
    borderColor: '#1F2937',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1200,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  bannerTitle: {
    marginLeft: 8,
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
  },
  bannerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  linkButtonText: {
    color: '#93C5FD',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
  },
  iconButton: {
    marginLeft: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panel: {
    position: 'absolute',
    left: 12,
    right: 12,
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1F2937',
    zIndex: 1200,
  },
  panelHeading: {
    color: '#F9FAFB',
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    marginBottom: 4,
  },
  panelBody: {
    color: '#D1D5DB',
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    lineHeight: 18,
  },
  primaryButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
  },
});

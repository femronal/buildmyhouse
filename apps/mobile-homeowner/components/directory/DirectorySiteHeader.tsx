import { createElement, useEffect, useState } from 'react';
import { Image, Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { Asset } from 'expo-asset';
import { Link } from 'expo-router';
import LogoText from '@/components/LogoText';
import WebLandmark from '@/components/seo/WebLandmark';

const LogoPng = require('@/assets/images/logo.png');

/**
 * `logo.png` is the official dove + wordmark on a square canvas.
 * The ink is centered, so a cover crop shows that lockup on light backgrounds.
 */
const LOGO_INK = { width: 798, height: 348 };
const LOCKUP_WIDTH = 176;

const NAV = [
  { key: 'vendors' as const, label: 'Vendors', href: '/vendors' },
  { key: 'professionals' as const, label: 'Professionals', href: '/professionals' },
];

function lockupUri(): string | undefined {
  if (typeof LogoPng === 'string') return LogoPng;
  if (LogoPng && typeof LogoPng === 'object') {
    if (typeof LogoPng.uri === 'string') return LogoPng.uri;
    if (typeof LogoPng.default === 'string') return LogoPng.default;
  }
  try {
    const asset = Asset.fromModule(LogoPng);
    return asset.uri || asset.localUri || undefined;
  } catch {
    return undefined;
  }
}

function BrandLockup() {
  const [uri, setUri] = useState<string | undefined>(() => lockupUri());
  const height = Math.round(LOCKUP_WIDTH * (LOGO_INK.height / LOGO_INK.width));

  useEffect(() => {
    if (uri) return;
    let cancelled = false;
    const asset = Asset.fromModule(LogoPng);
    asset
      .downloadAsync()
      .then(() => {
        if (!cancelled) setUri(asset.localUri || asset.uri || undefined);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [uri]);

  if (!uri) {
    return <LogoText variant="black" size="sm" />;
  }

  if (Platform.OS === 'web') {
    return createElement('img', {
      src: uri,
      alt: '',
      width: LOCKUP_WIDTH,
      height,
      style: {
        width: LOCKUP_WIDTH,
        height,
        objectFit: 'cover',
        objectPosition: 'center',
        display: 'block',
      },
    });
  }

  return (
    <Image
      source={{ uri }}
      accessible={false}
      resizeMode="cover"
      style={{ width: LOCKUP_WIDTH, height }}
    />
  );
}

export default function DirectorySiteHeader({
  current,
}: {
  current: 'vendors' | 'professionals';
}) {
  const { width } = useWindowDimensions();
  const showNav = width >= 768;

  return (
    <WebLandmark tag="header" className="bg-white border-b border-slate-100">
      <View className="max-w-[1120px] w-full self-center px-4 md:px-6 py-2 flex-row items-center justify-between">
        <View className="flex-row items-center gap-6 flex-1 min-w-0">
          <Link href={'/' as any} asChild>
            <Pressable accessibilityRole="link" accessibilityLabel="BuildMyHouse home">
              <BrandLockup />
            </Pressable>
          </Link>
          {showNav ? (
            <WebLandmark tag="nav" aria-label="Directory" className="flex-row items-center gap-5">
              {NAV.map((item) => {
                const active = item.key === current;
                return (
                  <Link key={item.key} href={item.href as any} asChild>
                    <Pressable accessibilityRole="link" accessibilityState={{ selected: active }}>
                      <Text
                        className={active ? 'text-sm text-black' : 'text-sm text-slate-500'}
                        style={{ fontFamily: active ? 'Poppins_600SemiBold' : 'Poppins_500Medium' }}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  </Link>
                );
              })}
            </WebLandmark>
          ) : null}
        </View>
        <View className="flex-row items-center gap-4">
          <Link href={'/email-login' as any} asChild>
            <Pressable className="hidden md:flex" accessibilityRole="link">
              <Text className="text-sm text-slate-500" style={{ fontFamily: 'Poppins_500Medium' }}>
                Log in
              </Text>
            </Pressable>
          </Link>
          <Link href={'/email-login' as any} asChild>
            <Pressable
              className="md:hidden bg-black px-4 py-2 rounded-lg"
              accessibilityRole="link"
              accessibilityLabel="Login"
            >
              <Text className="text-sm text-white" style={{ fontFamily: 'Poppins_500Medium' }}>
                Login
              </Text>
            </Pressable>
          </Link>
          <Link href={'/book-repair' as any} asChild>
            <Pressable className="hidden md:flex bg-black px-4 py-2 rounded-lg" accessibilityRole="link">
              <Text className="text-sm text-white" style={{ fontFamily: 'Poppins_500Medium' }}>
                Start a Project
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </WebLandmark>
  );
}

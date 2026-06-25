import { useMemo, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, MagnifyingGlass } from 'phosphor-react-native';
import type { LandingServiceLink } from '@buildmyhouse/shared-types';
import { filterServicePageLinks } from '@/lib/service-page-search';
import { buildWhatsAppServiceRequestUrl } from '@/lib/whatsapp-support';
import { LANDING_BORDER, LANDING_INK, LANDING_MUTED } from '@/lib/home-landing-content';

type LandingServiceSearchBarProps = {
  links: LandingServiceLink[];
  placeholder: string;
  variant?: 'hero' | 'default';
};

export default function LandingServiceSearchBar({
  links,
  placeholder,
  variant = 'hero',
}: LandingServiceSearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const trimmedQuery = query.trim();
  const results = useMemo(
    () => filterServicePageLinks(trimmedQuery, links),
    [trimmedQuery, links],
  );
  const showPanel = isFocused && trimmedQuery.length > 0;
  const hasResults = results.length > 0;

  const goToService = (href: string) => {
    setQuery('');
    setIsFocused(false);
    router.push(href as any);
  };

  const openWhatsApp = async () => {
    try {
      await Linking.openURL(buildWhatsAppServiceRequestUrl(trimmedQuery));
    } catch {
      // Keep the panel usable if the browser or WhatsApp app cannot open.
    }
  };

  const handleSubmit = () => {
    if (!trimmedQuery) return;
    if (hasResults) {
      goToService(results[0].href);
      return;
    }
    void openWhatsApp();
  };

  const isHero = variant === 'hero';

  return (
    <View className="relative w-full" style={{ zIndex: 20 }}>
      <View
        className={
          isHero
            ? 'flex-row items-center w-full bg-white rounded-xl border border-slate-200 px-2 bmh-hero-search-bar'
            : 'rounded-[22px] border bg-white px-4 py-2 flex-row items-center'
        }
        style={isHero ? undefined : { borderColor: LANDING_BORDER }}
      >
        {isHero ? (
          <View className="pl-2 pr-1">
            <MagnifyingGlass size={20} color="#94a3b8" weight="regular" />
          </View>
        ) : null}
        <TextInput
          value={query}
          onChangeText={setQuery}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            if (Platform.OS === 'web') {
              window.setTimeout(() => setIsFocused(false), 120);
              return;
            }
            setIsFocused(false);
          }}
          onSubmitEditing={handleSubmit}
          placeholder={placeholder}
          placeholderTextColor={isHero ? '#94a3b8' : '#9CA3AF'}
          cursorColor="#000000"
          selectionColor="#e2e8f0"
          underlineColorAndroid="transparent"
          returnKeyType="search"
          accessibilityLabel="Search service pages"
          className={
            isHero
              ? 'flex-1 py-3.5 px-2 text-sm text-black bmh-hero-search-input'
              : 'flex-1 text-base py-2'
          }
          style={{
            fontFamily: isHero ? 'Poppins_500Medium' : 'Poppins_400Regular',
            color: LANDING_INK,
            outlineStyle: 'none',
          } as any}
        />
        <Pressable
          onPress={handleSubmit}
          className={
            isHero
              ? 'bg-black p-2 rounded-lg m-1 bmh-glass-btn bmh-glass-btn-dark'
              : 'w-10 h-10 rounded-full items-center justify-center bg-black'
          }
          accessibilityRole="button"
          accessibilityLabel={hasResults || !trimmedQuery ? 'Search services' : 'Request service on WhatsApp'}
        >
          {isHero ? (
            <ArrowRight size={18} color="#fff" weight="bold" />
          ) : (
            <MagnifyingGlass size={18} color="#FFFFFF" weight="bold" />
          )}
        </Pressable>
      </View>

      {showPanel ? (
        <View
          className="absolute left-0 right-0 top-full mt-2 rounded-xl border bg-white overflow-hidden bmh-service-search-panel"
          style={{
            borderColor: LANDING_BORDER,
            maxHeight: 320,
            shadowColor: '#0f172a',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.12,
            shadowRadius: 24,
            elevation: 12,
          }}
        >
          {hasResults ? (
            <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
              {results.map((result) => (
                <Pressable
                  key={result.href}
                  onPress={() => goToService(result.href)}
                  {...(Platform.OS === 'web'
                    ? ({ onMouseDown: (event: any) => event.preventDefault() } as any)
                    : {})}
                  className="px-4 py-3 border-b border-slate-100"
                  accessibilityRole="button"
                >
                  <Text className="text-sm text-black" style={{ fontFamily: 'Poppins_500Medium' }}>
                    {result.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <View className="px-4 py-4">
              <Text className="text-sm text-slate-600 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
                Not listed yet — chat on WhatsApp and we&apos;ll help you request it.
              </Text>
              <Pressable
                onPress={() => void openWhatsApp()}
                {...(Platform.OS === 'web'
                  ? ({ onMouseDown: (event: any) => event.preventDefault() } as any)
                  : {})}
                className="self-start px-4 py-2 rounded-lg bg-[#1FB400]"
                accessibilityRole="button"
              >
                <Text className="text-sm text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Chat on WhatsApp
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      ) : null}

      {!isHero && trimmedQuery.length === 0 ? (
        <Text className="text-xs mt-2" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
          Search plumbing, electrical, painting, renovation, and other service pages.
        </Text>
      ) : null}
    </View>
  );
}

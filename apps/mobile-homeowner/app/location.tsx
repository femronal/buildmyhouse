import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ArrowRight, Crosshair, MapPin } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { geocodeAddress, type AddressDetails } from '@/services/addressService';
import { GOOGLE_MAPS_CONFIG } from '@/config/maps';

const LAGOS_COORDS = { lat: 6.5244, lon: 3.3792 };

type SelectedLocation = {
  /** e.g. "Surulere, Lagos" */
  label: string;
  area: string;
  latitude: number;
  longitude: number;
  formattedAddress: string;
};

type IpLocation = { city: string; region: string; countryCode: string; lat: number; lon: number };

async function lookupIpLocation(): Promise<IpLocation | null> {
  try {
    const res = await fetch('https://ipapi.co/json/', { headers: { Accept: 'application/json' } });
    if (res.ok) {
      const d = await res.json();
      if (d && d.latitude != null) {
        return {
          city: d.city || '',
          region: d.region || '',
          countryCode: d.country_code || d.country || '',
          lat: Number(d.latitude),
          lon: Number(d.longitude),
        };
      }
    }
  } catch {
    // fall through to backup provider
  }
  try {
    const res = await fetch('https://ipwho.is/', { headers: { Accept: 'application/json' } });
    if (res.ok) {
      const d = await res.json();
      if (d && d.success !== false && d.latitude != null) {
        return {
          city: d.city || '',
          region: d.region || '',
          countryCode: d.country_code || '',
          lat: Number(d.latitude),
          lon: Number(d.longitude),
        };
      }
    }
  } catch {
    // both providers failed
  }
  return null;
}

/** Pulsing white dot next to the location headline. */
function PulseDot() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      className="w-4 h-4 rounded-full bg-white/80"
      style={{
        opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.55] }),
        transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] }) }],
      }}
    />
  );
}

export default function LocationScreen() {
  const router = useRouter();
  useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const [area, setArea] = useState('');
  const [selected, setSelected] = useState<SelectedLocation | null>(null);
  const [busy, setBusy] = useState<'ip' | 'search' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mapsApiKey = GOOGLE_MAPS_CONFIG.apiKey?.trim() ?? '';
  const hasMapsApiKey =
    mapsApiKey.length > 0 &&
    mapsApiKey !== 'YOUR_API_KEY_HERE' &&
    mapsApiKey !== 'your_google_maps_api_key_here' &&
    !mapsApiKey.toLowerCase().includes('demo');

  const headline = selected ? selected.label : 'Lagos, Nigeria';
  const coords = selected
    ? { lat: selected.latitude, lon: selected.longitude }
    : { lat: LAGOS_COORDS.lat, lon: LAGOS_COORDS.lon };

  const coordLabel = useMemo(() => {
    const latDir = coords.lat >= 0 ? 'N' : 'S';
    const lonDir = coords.lon >= 0 ? 'E' : 'W';
    return {
      lat: `${Math.abs(coords.lat).toFixed(4)}° ${latDir}`,
      lon: `${Math.abs(coords.lon).toFixed(4)}° ${lonDir}`,
    };
  }, [coords.lat, coords.lon]);

  // Slide-in animation whenever the headline changes
  const slideIn = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    slideIn.setValue(0);
    Animated.timing(slideIn, { toValue: 1, duration: 450, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
  }, [headline, slideIn]);

  const geocodeWithOpenStreetMap = async (query: string): Promise<AddressDetails | null> => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&q=${encodeURIComponent(query)}`,
      { headers: { Accept: 'application/json' } },
    );
    if (!response.ok) return null;
    const results = await response.json();
    const first = Array.isArray(results) ? results[0] : null;
    if (!first) return null;
    const addr = first.address || {};
    return {
      formattedAddress: first.display_name || query,
      street: '',
      city: addr.city || addr.town || addr.suburb || addr.county || '',
      state: addr.state || '',
      zipCode: addr.postcode || '',
      country: addr.country || '',
      latitude: Number(first.lat),
      longitude: Number(first.lon),
    };
  };

  const isInLagos = (details: AddressDetails) => {
    const haystack = `${details.state} ${details.formattedAddress}`.toLowerCase();
    const country = details.country.toLowerCase();
    return haystack.includes('lagos') && (country.includes('nigeria') || country === 'ng' || country === '');
  };

  const toTitleCase = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const handleUseCurrentLocation = async () => {
    setBusy('ip');
    setErrorMessage(null);
    try {
      const ip = await lookupIpLocation();
      if (!ip) {
        setErrorMessage('We could not detect your location. Please type your area below instead.');
        return;
      }
      const inLagos = ip.countryCode.toUpperCase().startsWith('NG') && ip.region.toLowerCase().includes('lagos');
      if (!inLagos) {
        setSelected(null);
        setErrorMessage(
          `You appear to be outside Lagos (${[ip.city, ip.region].filter(Boolean).join(', ') || 'unknown location'}). BuildMyHouse only operates in Lagos, Nigeria for now — type your Lagos project area below instead.`,
        );
        return;
      }
      const areaName = toTitleCase(ip.city || 'Lagos');
      setSelected({
        label: areaName.toLowerCase() === 'lagos' ? 'Lagos, Nigeria' : `${areaName}, Lagos`,
        area: areaName,
        latitude: ip.lat,
        longitude: ip.lon,
        formattedAddress: `${areaName}, Lagos, Nigeria`,
      });
      setArea(areaName);
    } finally {
      setBusy(null);
    }
  };

  const handleConfirmArea = async () => {
    const cleaned = area.trim();
    if (!cleaned) return;
    setBusy('search');
    setErrorMessage(null);
    try {
      const query = `${cleaned}, Lagos, Nigeria`;
      let details: AddressDetails | null = null;
      try {
        details = hasMapsApiKey ? await geocodeAddress(query) : await geocodeWithOpenStreetMap(query);
      } catch {
        details = await geocodeWithOpenStreetMap(query);
      }
      if (!details || !isInLagos(details)) {
        setSelected(null);
        setErrorMessage('We could not find that area in Lagos. Try a major area like Surulere, Lekki, Agege, or Yaba.');
        return;
      }
      const areaName = toTitleCase(cleaned);
      setSelected({
        label: `${areaName}, Lagos`,
        area: areaName,
        latitude: details.latitude,
        longitude: details.longitude,
        formattedAddress: `${areaName}, Lagos, Nigeria`,
      });
    } finally {
      setBusy(null);
    }
  };

  const handleContinue = () => {
    if (!selected) return;
    router.push({
      pathname: '/choose-project-type',
      params: {
        address: selected.formattedAddress,
        street: '',
        city: selected.area,
        state: 'Lagos',
        zipCode: '',
        country: 'Nigeria',
        latitude: selected.latitude,
        longitude: selected.longitude,
      },
    });
  };

  return (
    <View className="flex-1 bg-black">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: Math.max(20, insets.top + 10),
          paddingBottom: Math.max(28, insets.bottom + 16),
        }}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.push('/(tabs)/home'))}
          className="w-10 h-10 rounded-full border border-white/15 items-center justify-center mb-5"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={20} color="#ffffff" weight="regular" />
        </TouchableOpacity>

        {/* Location card */}
        <View className="border border-white/10 rounded-3xl bg-black overflow-hidden p-6">
          <View className="flex-row items-center justify-between mb-8">
            <Text
              className="text-white/45 text-xs uppercase"
              style={{ fontFamily: 'Poppins_500Medium', letterSpacing: 4 }}
            >
              Project Location
            </Text>
            <View className="flex-row items-center gap-3">
              <View className="w-8 h-1 rounded-full bg-white/95" />
              <View className="w-2 h-2 rounded-full bg-white/25" />
            </View>
          </View>

          {/* Animated headline */}
          <Animated.View
            style={{
              opacity: slideIn,
              transform: [{ translateY: slideIn.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
            }}
          >
            <View className="flex-row items-center gap-3.5">
              <PulseDot />
              <Text
                className="text-white text-[26px] leading-tight tracking-tight flex-1"
                style={{ fontFamily: 'Poppins_600SemiBold' }}
                numberOfLines={1}
              >
                {headline}
              </Text>
            </View>

            <View className="mt-5 h-px w-full bg-white/15" />

            <View className="mt-4 flex-row flex-wrap gap-x-8 gap-y-1">
              {[coordLabel.lat, coordLabel.lon, 'UTC+1'].map((item) => (
                <Text
                  key={item}
                  className="text-white/40 text-xs uppercase"
                  style={{ fontFamily: 'Poppins_500Medium', letterSpacing: 2 }}
                >
                  {item}
                </Text>
              ))}
            </View>
          </Animated.View>

          {/* form */}
          <View className="mt-6 gap-3">
            <Pressable
              onPress={handleUseCurrentLocation}
              disabled={busy !== null}
              className="h-12 rounded-xl bg-white flex-row items-center justify-center gap-2"
              accessibilityRole="button"
            >
              {busy === 'ip' ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Crosshair size={18} color="#000000" weight="bold" />
              )}
              <Text className="text-sm text-black" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Use my current location
              </Text>
            </Pressable>

            <View className="flex-row items-center gap-3">
              <View className="flex-1 h-px bg-white/10" />
              <Text
                className="text-white/35 text-[11px] uppercase"
                style={{ fontFamily: 'Poppins_500Medium', letterSpacing: 2 }}
              >
                or type your area
              </Text>
              <View className="flex-1 h-px bg-white/10" />
            </View>

            <View className="flex-row items-center gap-2">
              <View className="flex-1 flex-row items-center h-12 rounded-xl border border-white/15 bg-white/5 px-3.5">
                <MapPin size={18} color="rgba(255,255,255,0.45)" weight="regular" />
                <TextInput
                  value={area}
                  onChangeText={(value) => {
                    setArea(value);
                    setErrorMessage(null);
                  }}
                  onSubmitEditing={handleConfirmArea}
                  placeholder="Area — e.g. Surulere"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  className="flex-1 ml-2.5 text-sm text-white"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                />
              </View>
              <View className="h-12 px-4 rounded-xl border border-white/15 bg-white/5 items-center justify-center">
                <Text className="text-sm text-white/65" style={{ fontFamily: 'Poppins_500Medium' }}>
                  Lagos
                </Text>
              </View>
            </View>

            <Pressable
              onPress={handleConfirmArea}
              disabled={!area.trim() || busy !== null}
              className={`h-12 rounded-xl border flex-row items-center justify-center gap-2 ${
                area.trim() && busy === null ? 'border-white/25 bg-white/10' : 'border-white/10 bg-white/5'
              }`}
              accessibilityRole="button"
            >
              {busy === 'search' ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text
                  className={`text-sm ${area.trim() ? 'text-white' : 'text-white/35'}`}
                  style={{ fontFamily: 'Poppins_600SemiBold' }}
                >
                  Confirm area
                </Text>
              )}
            </Pressable>

            {errorMessage ? (
              <View className="rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5">
                <Text className="text-white/80 text-xs leading-5" style={{ fontFamily: 'Poppins_500Medium' }}>
                  {errorMessage}
                </Text>
              </View>
            ) : (
              <Text className="text-white/35 text-[11px] leading-4" style={{ fontFamily: 'Poppins_400Regular' }}>
                Just your area and Lagos — no street address needed yet.
              </Text>
            )}
          </View>
        </View>

        {/* Continue */}
        <Pressable
          onPress={handleContinue}
          disabled={!selected}
          className={`mt-5 h-14 rounded-xl flex-row items-center justify-center gap-2 ${
            selected ? 'bg-white' : 'bg-white/10 border border-white/10'
          }`}
          accessibilityRole="button"
        >
          <Text
            className={`text-base ${selected ? 'text-black' : 'text-white/35'}`}
            style={{ fontFamily: 'Poppins_600SemiBold' }}
          >
            Continue
          </Text>
          <ArrowRight size={20} color={selected ? '#000000' : 'rgba(255,255,255,0.35)'} weight="bold" />
        </Pressable>
      </ScrollView>
    </View>
  );
}

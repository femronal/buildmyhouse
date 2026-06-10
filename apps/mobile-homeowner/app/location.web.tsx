import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
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

/* ---------------------------------- globe ---------------------------------- */

function latLonToXYZ(latDeg: number, lonDeg: number) {
  const lat = (latDeg * Math.PI) / 180;
  const lon = (lonDeg * Math.PI) / 180;
  return {
    x: Math.cos(lat) * Math.cos(lon),
    y: Math.sin(lat),
    z: Math.cos(lat) * Math.sin(lon),
  };
}

function rotY(p: { x: number; y: number; z: number }, a: number) {
  return {
    x: p.x * Math.cos(a) + p.z * Math.sin(a),
    y: p.y,
    z: -p.x * Math.sin(a) + p.z * Math.cos(a),
  };
}

/** Dotted wireframe globe on canvas — white on black, marker tracks the selected location. */
function GlobeCanvas({ markerLat, markerLon }: { markerLat: number; markerLon: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const target = useRef({ lat: markerLat, lon: markerLon });

  useEffect(() => {
    target.current = { lat: markerLat, lon: markerLon };
  }, [markerLat, markerLon]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let disposed = false;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const pts: { x: number; y: number; z: number; size: number; alpha: number }[] = [];
    const DOT_STEP = 5.5;
    for (let lat = -82; lat <= 82; lat += DOT_STEP) {
      for (let lon = -180; lon <= 180; lon += DOT_STEP) {
        const p = latLonToXYZ(lat, lon);
        pts.push({ ...p, size: 0.9 + Math.random() * 0.55, alpha: 0.4 + Math.random() * 0.26 });
      }
    }

    let angle = -1.28;
    let tick = 0;

    const drawMeridians = (cx: number, cy: number, R: number) => {
      for (let m = 0; m < 8; m++) {
        const lonDeg = (m / 8) * 180 - 90;
        ctx.beginPath();
        let first = true;
        for (let s = 0; s <= 80; s++) {
          const latDeg = (s / 80) * 180 - 90;
          const rp = rotY(latLonToXYZ(latDeg, lonDeg), angle);
          if (rp.z < 0) {
            first = true;
            continue;
          }
          const sx = cx + rp.x * R;
          const sy = cy - rp.y * R;
          if (first) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
          first = false;
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    };

    const drawParallels = (cx: number, cy: number, R: number) => {
      [-60, -30, 0, 30, 60].forEach((latDeg) => {
        ctx.beginPath();
        let first = true;
        for (let s = 0; s <= 120; s++) {
          const lonDeg = (s / 120) * 360 - 180;
          const rp = rotY(latLonToXYZ(latDeg, lonDeg), angle);
          if (rp.z < 0) {
            first = true;
            continue;
          }
          const sx = cx + rp.x * R;
          const sy = cy - rp.y * R;
          if (first) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
          first = false;
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    };

    const draw = () => {
      if (disposed) return;
      const rect = canvas.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;
      ctx.clearRect(0, 0, W, H);

      angle += 0.0018;
      tick += 0.016;

      const cx = W * 0.62;
      const cy = H * 0.44;
      const R = Math.min(W, H) * 0.48;

      const glow = ctx.createRadialGradient(cx, cy, R * 0.55, cx, cy, R * 1.25);
      glow.addColorStop(0, 'rgba(255,255,255,0.04)');
      glow.addColorStop(0.5, 'rgba(255,255,255,0.02)');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.25, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      drawMeridians(cx, cy, R);
      drawParallels(cx, cy, R);

      const projected = pts
        .map((pt) => {
          const rp = rotY(pt, angle);
          return { ...pt, rx: rp.x, ry: rp.y, rz: rp.z };
        })
        .sort((a, b) => a.rz - b.rz);

      projected.forEach((pt) => {
        const sx = cx + pt.rx * R;
        const sy = cy - pt.ry * R;
        if (pt.rz < 0) {
          const depthBack = Math.max(0, 1 + pt.rz);
          ctx.beginPath();
          ctx.arc(sx, sy, pt.size * 0.55, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${depthBack * 0.03})`;
          ctx.fill();
          return;
        }
        const depth = (pt.rz + 1) / 2;
        const twinkle = 0.82 + 0.18 * Math.sin(tick + sx * 0.01 + sy * 0.008);
        ctx.beginPath();
        ctx.arc(sx, sy, pt.size * Math.max(0.72, depth), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${pt.alpha * depth * twinkle})`;
        ctx.fill();
      });

      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      const markerRot = rotY(latLonToXYZ(target.current.lat, target.current.lon), angle);
      if (markerRot.z > 0) {
        const sx = cx + markerRot.x * R;
        const sy = cy - markerRot.y * R;

        // expanding pulse rings
        for (let i = 0; i < 2; i++) {
          const phase = ((tick / 2.4 + i * 0.5) % 1 + 1) % 1;
          const ringR = 6 + phase * 22;
          ctx.beginPath();
          ctx.arc(sx, sy, ringR, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255,255,255,${0.5 * (1 - phase)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(sx, sy, 4.2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 16;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      raf = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return createElement('canvas', {
    ref: canvasRef,
    style: { position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' },
  });
}

/* ------------------------------- ip lookup -------------------------------- */

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

/* --------------------------------- screen --------------------------------- */

export default function LocationScreenWeb() {
  const router = useRouter();
  useLocalSearchParams();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isDesktop = width >= 1024;

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
        contentContainerStyle={{ paddingBottom: 40, minHeight: '100%' }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          className="w-full max-w-5xl self-center px-5 md:px-8"
          style={{ paddingTop: Math.max(20, insets.top + 10) }}
        >
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.push('/(tabs)/home'))}
            className="w-10 h-10 rounded-full border border-white/15 items-center justify-center mb-5"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={20} color="#ffffff" weight="regular" />
          </TouchableOpacity>

          {/* Globe card */}
          <View className="bmh-globe-slidein relative w-full border border-white/10 rounded-3xl overflow-hidden bg-black">
            <View
              className="relative w-full"
              style={{ minHeight: isDesktop ? 560 : 660 }}
            >
              <GlobeCanvas markerLat={coords.lat} markerLon={coords.lon} />

              {/* readability overlay */}
              <View
                pointerEvents="none"
                className="absolute inset-0 z-[1]"
                style={{
                  // @ts-expect-error web-only gradient
                  backgroundImage:
                    'linear-gradient(to right, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.12) 40%, rgba(0,0,0,0.03) 100%)',
                }}
              />

              {/* top labels */}
              <View className="absolute top-7 left-7 md:top-9 md:left-9 z-10">
                <Text
                  className="text-white/45 text-xs uppercase"
                  style={{ fontFamily: 'Poppins_500Medium', letterSpacing: 4 }}
                >
                  Project Location
                </Text>
              </View>
              <View className="absolute top-7 right-7 md:top-9 md:right-9 z-10 flex-row items-center gap-3">
                <View className="w-8 h-1 rounded-full bg-white/95" />
                <View className="w-2 h-2 rounded-full bg-white/25" />
              </View>

              {/* bottom: animated headline + form */}
              <View className="absolute left-0 right-0 bottom-0 z-10 p-7 md:p-9">
                <View className="w-full max-w-[460px]">
                  <View key={headline} className="bmh-globe-slidein">
                    <View className="flex-row items-center gap-3.5">
                      <View
                        className="bmh-globe-pulse-dot w-4 h-4 rounded-full bg-white/80"
                        style={{
                          // @ts-expect-error web-only shadow
                          boxShadow: '0 0 18px rgba(255,255,255,0.35)',
                        }}
                      />
                      <Text
                        className="text-white text-[26px] md:text-[32px] leading-tight tracking-tight"
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
                  </View>

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
                      <Text className="text-white/35 text-[11px] uppercase" style={{ fontFamily: 'Poppins_500Medium', letterSpacing: 2 }}>
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
                          style={{ fontFamily: 'Poppins_400Regular', outlineStyle: 'none' } as any}
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
                        area.trim() && busy === null ? 'border-white/25 bg-white/10' : 'border-white/10 bg-white/[0.03]'
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
              </View>
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
        </View>
      </ScrollView>
    </View>
  );
}

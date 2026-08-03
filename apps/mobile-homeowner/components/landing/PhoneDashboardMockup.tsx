import { Text, View, useWindowDimensions } from 'react-native';
import { BatteryFull, CellSignalFull, WifiHigh } from 'phosphor-react-native';
import ProjectMonitoringDemoPhone, {
  DEMO_DESIGN_HEIGHT,
  DEMO_DESIGN_WIDTH,
} from '@/components/demo/ProjectMonitoringDemoPhone';

/** Intrinsic desktop phone proportions (bezel + screen). */
const DESKTOP_PHONE_WIDTH = 340;
const DESKTOP_PHONE_HEIGHT = 740;
const PHONE_ASPECT = DESKTOP_PHONE_HEIGHT / DESKTOP_PHONE_WIDTH;

/** Safe defaults when window metrics are 0 during SSR / first paint. */
const FALLBACK_WIDTH = 390;
const FALLBACK_HEIGHT = 844;

function phoneMetrics(rawWidth: number, rawHeight: number) {
  const width = rawWidth > 0 ? rawWidth : FALLBACK_WIDTH;
  const height = rawHeight > 0 ? rawHeight : FALLBACK_HEIGHT;
  const isDesktop = width >= 1024;
  const isMobile = width < 768;

  if (isDesktop) {
    return {
      isDesktop,
      isMobile,
      phoneWidth: DESKTOP_PHONE_WIDTH,
      phoneHeight: DESKTOP_PHONE_HEIGHT,
      innerHeight: DEMO_DESIGN_HEIGHT,
      contentScale: 1,
      bezel: 8,
      radiusOuter: 55,
      radiusInner: 48,
      statusH: 56,
      islandW: 110,
      islandH: 30,
      timeSize: 14,
      iconSignal: 16,
      iconWifi: 16,
      iconBattery: 20,
      homeBarW: 120,
      captionMt: 16,
      captionSize: 12,
    };
  }

  // Size primarily by width so the phone fills the mobile hero.
  // Clamp height so the full device + caption still fits one viewport.
  // Never allow a 0 clamp from unset window height (that collapsed the demo to a dot).
  const widthTarget = Math.round(
    Math.min(isMobile ? 300 : 320, Math.max(isMobile ? 250 : 260, width * (isMobile ? 0.82 : 0.72))),
  );
  const maxHeight = Math.max(
    isMobile ? 420 : 480,
    Math.round(height * (isMobile ? 0.68 : 0.64)),
  );
  let phoneWidth = widthTarget;
  let phoneHeight = Math.round(phoneWidth * PHONE_ASPECT);
  if (phoneHeight > maxHeight) {
    phoneHeight = maxHeight;
    phoneWidth = Math.round(phoneHeight / PHONE_ASPECT);
  }
  // Absolute floors so the frame can never collapse on a bad metric pass.
  phoneWidth = Math.max(phoneWidth, isMobile ? 240 : 260);
  phoneHeight = Math.max(phoneHeight, Math.round(phoneWidth * PHONE_ASPECT));

  const statusH = isMobile ? 44 : 50;
  const homeReserve = isMobile ? 14 : 18;
  const bezel = isMobile ? 5 : 6;
  const contentWidth = phoneWidth - bezel * 2;
  const innerHeight = Math.max(240, phoneHeight - statusH - homeReserve);
  const contentScale = Math.min(1, Math.max(0.55, contentWidth / DEMO_DESIGN_WIDTH));

  return {
    isDesktop,
    isMobile,
    phoneWidth,
    phoneHeight,
    innerHeight,
    contentScale,
    bezel,
    radiusOuter: isMobile ? 38 : 46,
    radiusInner: isMobile ? 34 : 40,
    statusH,
    islandW: isMobile ? 78 : 96,
    islandH: isMobile ? 22 : 26,
    timeSize: isMobile ? 11 : 13,
    iconSignal: isMobile ? 12 : 14,
    iconWifi: isMobile ? 12 : 14,
    iconBattery: isMobile ? 15 : 18,
    homeBarW: isMobile ? 80 : 104,
    captionMt: isMobile ? 10 : 14,
    captionSize: isMobile ? 11 : 12,
  };
}

export default function PhoneDashboardMockup() {
  const { width, height } = useWindowDimensions();
  const m = phoneMetrics(width, height);

  return (
    <View
      style={{
        width: '100%',
        maxWidth: m.phoneWidth,
        minWidth: m.phoneWidth,
        alignSelf: m.isDesktop ? 'flex-end' : 'center',
      }}
    >
      <View
        style={{
          width: m.phoneWidth,
          backgroundColor: '#000',
          borderRadius: m.radiusOuter,
          padding: m.bezel,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.1)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: m.isMobile ? 14 : 25 },
          shadowOpacity: 0.35,
          shadowRadius: m.isMobile ? 28 : 50,
          elevation: m.isMobile ? 10 : 16,
        }}
      >
        <View
          style={{
            width: m.phoneWidth - m.bezel * 2,
            backgroundColor: '#fff',
            borderRadius: m.radiusInner,
            overflow: 'hidden',
            position: 'relative',
            height: m.phoneHeight,
          }}
        >
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: m.statusH,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: m.isMobile ? 16 : 28,
              zIndex: 20,
            }}
          >
            <Text
              style={{
                fontFamily: 'Poppins_500Medium',
                fontSize: m.timeSize,
                color: '#000',
                marginTop: 2,
              }}
            >
              9:41
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: m.isMobile ? 4 : 8, marginTop: 2 }}>
              <CellSignalFull size={m.iconSignal} color="#000" weight="fill" />
              <WifiHigh size={m.iconWifi} color="#000" weight="fill" />
              <BatteryFull size={m.iconBattery} color="#000" weight="fill" />
            </View>
          </View>

          <View
            style={{
              position: 'absolute',
              top: m.isMobile ? 8 : 12,
              left: '50%',
              width: m.islandW,
              height: m.islandH,
              marginLeft: -m.islandW / 2,
              backgroundColor: '#000',
              borderRadius: 999,
              zIndex: 20,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-end',
              paddingHorizontal: m.isMobile ? 8 : 12,
            }}
          >
            <View
              style={{
                width: m.isMobile ? 7 : 10,
                height: m.isMobile ? 7 : 10,
                borderRadius: 999,
                backgroundColor: '#1a1a1a',
              }}
            />
          </View>

          <View style={{ paddingTop: m.statusH, width: '100%', height: m.phoneHeight - m.statusH }}>
            <ProjectMonitoringDemoPhone
              initialRoute={{ name: 'dashboard' }}
              homeRoute={{ name: 'dashboard' }}
              autoplay={m.isDesktop}
              innerHeight={m.innerHeight}
              contentScale={m.contentScale}
            />
          </View>

          <View
            style={{
              position: 'absolute',
              bottom: m.isMobile ? 6 : 8,
              left: '50%',
              width: m.homeBarW,
              height: m.isMobile ? 4 : 5,
              marginLeft: -m.homeBarW / 2,
              backgroundColor: '#000',
              borderRadius: 999,
              zIndex: 20,
            }}
          />
        </View>
      </View>

      <Text
        style={{
          fontFamily: 'Poppins_500Medium',
          fontSize: m.captionSize,
          color: '#64748b',
          textAlign: 'center',
          marginTop: m.captionMt,
          paddingHorizontal: 8,
          lineHeight: m.captionSize + 6,
          width: '100%',
        }}
      >
        Tap around — this is project tracking on BuildMyHouse.
      </Text>
    </View>
  );
}

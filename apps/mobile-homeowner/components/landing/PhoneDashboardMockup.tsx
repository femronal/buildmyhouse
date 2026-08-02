import { Text, View, useWindowDimensions } from 'react-native';
import { BatteryFull, CellSignalFull, WifiHigh } from 'phosphor-react-native';
import ProjectMonitoringDemoPhone from '@/components/demo/ProjectMonitoringDemoPhone';

/** Intrinsic desktop phone proportions (bezel + screen). */
const DESKTOP_PHONE_WIDTH = 340;
const DESKTOP_PHONE_HEIGHT = 740;
const DESKTOP_INNER_HEIGHT = 620;

function phoneMetrics(width: number, height: number) {
  const isDesktop = width >= 1024;
  const isMobile = width < 768;

  if (isDesktop) {
    return {
      isDesktop,
      isMobile,
      phoneWidth: DESKTOP_PHONE_WIDTH,
      phoneHeight: DESKTOP_PHONE_HEIGHT,
      innerHeight: DESKTOP_INNER_HEIGHT,
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

  // Fit the full phone chrome inside one viewport on thinner screens.
  // Leave room for the caption under the device.
  const maxByViewport = height * (isMobile ? 0.46 : 0.55);
  const maxByWidth = width * (isMobile ? 1.35 : 1.5);
  const phoneHeight = Math.round(
    Math.min(isMobile ? 400 : 560, Math.max(isMobile ? 280 : 420, Math.min(maxByViewport, maxByWidth))),
  );
  const phoneWidth = Math.round(phoneHeight * (DESKTOP_PHONE_WIDTH / DESKTOP_PHONE_HEIGHT));
  const statusH = isMobile ? 40 : 48;
  const homeReserve = isMobile ? 14 : 18;
  const bezel = isMobile ? 4 : 6;
  const innerHeight = Math.max(200, phoneHeight - statusH - homeReserve);

  return {
    isDesktop,
    isMobile,
    phoneWidth,
    phoneHeight,
    innerHeight,
    bezel,
    radiusOuter: isMobile ? 34 : 44,
    radiusInner: isMobile ? 30 : 38,
    statusH,
    islandW: isMobile ? 72 : 92,
    islandH: isMobile ? 20 : 26,
    timeSize: isMobile ? 11 : 13,
    iconSignal: isMobile ? 12 : 14,
    iconWifi: isMobile ? 12 : 14,
    iconBattery: isMobile ? 14 : 18,
    homeBarW: isMobile ? 72 : 100,
    captionMt: isMobile ? 10 : 14,
    captionSize: isMobile ? 11 : 12,
  };
}

export default function PhoneDashboardMockup() {
  const { width, height } = useWindowDimensions();
  const m = phoneMetrics(width, height);

  return (
    <View style={{ width: '100%', maxWidth: m.phoneWidth, alignSelf: m.isDesktop ? 'flex-end' : 'center' }}>
      <View
        style={{
          backgroundColor: '#000',
          borderRadius: m.radiusOuter,
          padding: m.bezel,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.1)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: m.isMobile ? 12 : 25 },
          shadowOpacity: 0.35,
          shadowRadius: m.isMobile ? 24 : 50,
          elevation: m.isMobile ? 10 : 16,
        }}
      >
        <View
          style={{
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

          <View style={{ paddingTop: m.statusH, flex: 1, height: m.phoneHeight }}>
            <ProjectMonitoringDemoPhone
              initialRoute={{ name: 'dashboard' }}
              homeRoute={{ name: 'dashboard' }}
              autoplay={m.isDesktop}
              innerHeight={m.innerHeight}
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
        }}
      >
        Tap around — this is project tracking on BuildMyHouse.
      </Text>
    </View>
  );
}

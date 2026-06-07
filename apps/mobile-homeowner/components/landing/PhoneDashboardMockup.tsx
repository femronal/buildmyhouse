import { Text, View } from 'react-native';
import { BatteryFull, Signal, Wifi } from 'lucide-react-native';
import ProjectMonitoringDemoPhone from '@/components/demo/ProjectMonitoringDemoPhone';

const PHONE_INNER_HEIGHT = 620;

export default function PhoneDashboardMockup() {
  return (
    <View className="w-full max-w-[340px] self-center lg:self-end">
      <View
        className="bg-[#1a1a1a] rounded-[55px] p-2 shadow-2xl border border-slate-800/50"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 25 },
          shadowOpacity: 0.35,
          shadowRadius: 50,
          elevation: 16,
        }}
      >
        <View className="bg-white rounded-[48px] overflow-hidden relative" style={{ height: 740 }}>
          <View className="absolute top-0 left-0 right-0 h-14 flex-row justify-between items-center px-7 z-20">
            <Text className="text-sm text-black mt-1" style={{ fontFamily: 'Poppins_500Medium' }}>
              9:41
            </Text>
            <View className="flex-row items-center gap-2 mt-1">
              <Signal size={16} color="#000" />
              <Wifi size={16} color="#000" />
              <BatteryFull size={20} color="#000" />
            </View>
          </View>

          <View className="absolute top-3 left-1/2 w-[110px] h-[30px] bg-black rounded-full z-20 flex-row items-center justify-end px-3 -ml-[55px]">
            <View className="w-2.5 h-2.5 rounded-full bg-[#1a1a1a]" />
          </View>

          <View className="pt-14 flex-1" style={{ height: 740 }}>
            <ProjectMonitoringDemoPhone
              initialRoute={{ name: 'dashboard' }}
              homeRoute={{ name: 'dashboard' }}
              autoplay
              innerHeight={PHONE_INNER_HEIGHT}
            />
          </View>

          <View className="absolute bottom-2 left-1/2 w-[120px] h-[5px] bg-slate-900 rounded-full -ml-[60px] z-20" />
        </View>
      </View>

      <Text
        className="text-xs text-slate-500 text-center mt-4 px-2 leading-5"
        style={{ fontFamily: 'Poppins_500Medium' }}
      >
        Tap around — this is project tracking on BuildMyHouse.
      </Text>
    </View>
  );
}

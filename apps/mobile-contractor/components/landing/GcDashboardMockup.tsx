import { Text, View } from 'react-native';
import { ArrowUpRight, Camera, ClipboardList, HardHat, Wallet } from 'lucide-react-native';
import { GC_BG, GC_PRIMARY, GC_SURFACE } from '@/lib/gc-landing-content';

export default function GcDashboardMockup() {
  return (
    <View className="w-full max-w-[340px] self-center lg:self-end">
      <View
        className="rounded-[55px] p-2 border border-blue-900/40"
        style={{
          backgroundColor: '#050b14',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 25 },
          shadowOpacity: 0.45,
          shadowRadius: 50,
          elevation: 16,
        }}
      >
        <View className="rounded-[48px] overflow-hidden relative" style={{ height: 720, backgroundColor: GC_BG }}>
          <View className="absolute top-0 left-0 right-0 h-14 flex-row justify-between items-center px-7 z-20">
            <Text className="text-sm text-white mt-1" style={{ fontFamily: 'Poppins_500Medium' }}>
              9:41
            </Text>
            <View className="flex-row items-center gap-1 mt-1">
              <View className="w-4 h-2.5 rounded-sm border border-white/40" />
            </View>
          </View>

          <View className="absolute top-3 left-1/2 w-[110px] h-[30px] rounded-full z-20 flex-row items-center justify-end px-3 -ml-[55px]" style={{ backgroundColor: '#000' }}>
            <View className="w-2.5 h-2.5 rounded-full bg-[#1a1a1a]" />
          </View>

          <View className="pt-16 px-5 pb-8 gap-5">
            <View className="flex-row items-center gap-3">
              <View className="w-11 h-11 rounded-2xl items-center justify-center" style={{ backgroundColor: GC_SURFACE }}>
                <HardHat size={22} color={GC_PRIMARY} strokeWidth={2} />
              </View>
              <View className="flex-1">
                <Text className="text-white text-lg" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  GC Dashboard
                </Text>
                <Text className="text-xs text-gray-400" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Verified · Lagos
                </Text>
              </View>
              <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(34,197,94,0.15)' }}>
                <Text className="text-[10px] text-green-400" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Active
                </Text>
              </View>
            </View>

            <View className="flex-row gap-3">
              {[
                { icon: ClipboardList, label: 'Requests', value: '3' },
                { icon: Camera, label: 'Evidence due', value: '2' },
                { icon: Wallet, label: 'This month', value: '₦1.2M' },
              ].map(({ icon: Icon, label, value }) => (
                <View
                  key={label}
                  className="flex-1 rounded-2xl p-3 border border-blue-900/50"
                  style={{ backgroundColor: GC_SURFACE }}
                >
                  <Icon size={16} color={GC_PRIMARY} strokeWidth={2} />
                  <Text className="text-white text-lg mt-3" style={{ fontFamily: 'Poppins_700Bold' }}>
                    {value}
                  </Text>
                  <Text className="text-[10px] text-gray-400 mt-1" style={{ fontFamily: 'Poppins_500Medium' }}>
                    {label}
                  </Text>
                </View>
              ))}
            </View>

            <View className="rounded-2xl p-4 border border-blue-900/50" style={{ backgroundColor: GC_SURFACE }}>
              <Text className="text-xs text-blue-300 mb-3 uppercase tracking-widest" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Active project
              </Text>
              <Text className="text-white text-base mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Kitchen renovation · Lekki
              </Text>
              <Text className="text-xs text-gray-400 mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
                Stage 3 of 5 · Tiling in progress
              </Text>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Camera size={14} color={GC_PRIMARY} strokeWidth={2} />
                  <Text className="text-xs text-gray-300" style={{ fontFamily: 'Poppins_500Medium' }}>
                    Upload stage evidence
                  </Text>
                </View>
                <ArrowUpRight size={16} color="#fff" strokeWidth={2} />
              </View>
            </View>

            <View className="rounded-2xl p-4 border border-blue-900/30" style={{ backgroundColor: 'rgba(30,58,95,0.55)' }}>
              <Text className="text-xs text-gray-400 mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
                New request
              </Text>
              <Text className="text-white text-sm mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Roof leak repair · Victoria Island
              </Text>
              <Text className="text-xs text-gray-500" style={{ fontFamily: 'Poppins_400Regular' }}>
                Photos attached · Urgent · Scoped brief ready
              </Text>
            </View>
          </View>

          <View className="absolute bottom-2 left-1/2 w-[120px] h-[5px] bg-white/30 rounded-full -ml-[60px] z-20" />
        </View>
      </View>

      <Text className="text-xs text-gray-500 text-center mt-4 px-2 leading-5" style={{ fontFamily: 'Poppins_500Medium' }}>
        Your contractor command center — requests, evidence, and milestone pay in one app.
      </Text>
    </View>
  );
}

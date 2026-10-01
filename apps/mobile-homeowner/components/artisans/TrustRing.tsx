import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export function TrustRing({ score, size = 56 }: { score: number; size?: number }) {
  const stroke = Math.max(3, Math.round(size / 14));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference - (clamped / 100) * circumference;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel={`Trust profile ${clamped} percent`}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#E5E5E5" strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#171717"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text style={{ position: 'absolute', fontFamily: 'Poppins_700Bold', fontSize: size >= 72 ? 16 : 11, color: '#171717' }}>
        {clamped}%
      </Text>
    </View>
  );
}

import { Image, ImageStyle, Platform, View, type ViewStyle } from "react-native";
import LogoIcon from "@/assets/images/BMHlogo.svg";

const LogoPng = require("@/assets/images/logo.png");

type LogoSize = "sm" | "md" | "lg" | "xl" | "xxl";

const sizeMap: Record<Exclude<LogoSize, "xl">, { width: number; height: number }> = {
  sm: { width: 120, height: 36 },
  md: { width: 180, height: 54 },
  lg: { width: 500, height: 100 },
  xxl: { width: 700, height: 200 },
};

// xl: responsive header logo, max 200px wide
const XL_ASPECT_RATIO = 4; // 4:1 ratio

type LogoProps = {
  size?: LogoSize;
  style?: ViewStyle;
};

export default function Logo({ size = "md", style }: LogoProps) {
  // react-native-svg-transformer doesn't work on web; use PNG fallback
  const isWeb = Platform.OS === "web";

  if (isWeb) {
    const imageStyle = style as ImageStyle | undefined;
    if (size === "xl") {
      return (
        <Image
          source={LogoPng}
          style={[
            { width: "100%", maxWidth: 200, aspectRatio: XL_ASPECT_RATIO },
            imageStyle,
          ]}
          resizeMode="contain"
        />
      );
    }
    const { width, height } = sizeMap[size];
    return (
      <Image
        source={LogoPng}
        style={[{ width, height }, imageStyle]}
        resizeMode="contain"
      />
    );
  }

  // Native: use SVG for crisp scaling
  if (size === "xl") {
    return (
      <View
        style={[
          { width: "100%", maxWidth: 200, aspectRatio: XL_ASPECT_RATIO },
          style,
        ]}
      >
        <LogoIcon width="100%" height="100%" />
      </View>
    );
  }
  const { width, height } = sizeMap[size];
  return (
    <View style={[{ width, height }, style]}>
      <LogoIcon width={width} height={height} />
    </View>
  );
}

import { Image, ImageStyle, Platform, View, useWindowDimensions, type ViewStyle } from "react-native";
import LogoIcon from "@/assets/images/BMHlogo.svg";

const LogoPng = require("@/assets/images/logo.png");

type LogoSize = "sm" | "md" | "lg" | "xl" | "xxl";

const sizeMap: Record<Exclude<LogoSize, "xl">, { width: number; height: number }> = {
  sm: { width: 120, height: 36 },
  md: { width: 180, height: 54 },
  lg: { width: 220, height: 66 },
  xxl: { width: 360, height: 102 },
};

// xl: responsive header logo, max 200px wide
const XL_ASPECT_RATIO = 4; // 4:1 ratio

type LogoProps = {
  size?: LogoSize;
  style?: ViewStyle;
};

export default function Logo({ size = "md", style }: LogoProps) {
  const { width: viewportWidth } = useWindowDimensions();
  // react-native-svg-transformer doesn't work on web; use PNG fallback
  const isWeb = Platform.OS === "web";

  const getResponsiveSize = () => {
    if (size === "xl") return null;
    const base = sizeMap[size];
    if (size === "sm" || size === "md") return base;

    const widthCap = size === "lg"
      ? Math.max(140, Math.min(base.width, Math.floor(viewportWidth * 0.48)))
      : Math.max(220, Math.min(base.width, Math.floor(viewportWidth * 0.82)));
    const scale = widthCap / base.width;
    return {
      width: widthCap,
      height: Math.round(base.height * scale),
    };
  };

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
    const responsiveSize = getResponsiveSize();
    if (!responsiveSize) return null;
    const { width, height } = responsiveSize;
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
  const responsiveSize = getResponsiveSize();
  if (!responsiveSize) return null;
  const { width, height } = responsiveSize;
  return (
    <View style={[{ width, height }, style]}>
      <LogoIcon width={width} height={height} />
    </View>
  );
}

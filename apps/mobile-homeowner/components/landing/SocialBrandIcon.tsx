import { LinkedinLogo, XLogo, type Icon } from 'phosphor-react-native';
import Svg, { Path } from 'react-native-svg';
import { siInstagram, siMedium, siYoutube } from 'simple-icons';

const SIMPLE_ICON_BRANDS = {
  instagram: siInstagram,
  youtube: siYoutube,
  medium: siMedium,
} as const;

const PHOSPHOR_ICON_BRANDS = {
  x: XLogo,
  linkedin: LinkedinLogo,
} as const;

export type SocialBrandId = keyof typeof SIMPLE_ICON_BRANDS | keyof typeof PHOSPHOR_ICON_BRANDS;

type SocialBrandIconProps = {
  brand: SocialBrandId;
  size?: number;
  color?: string;
};

function SimpleIconGlyph({
  path,
  size,
  color,
}: {
  path: string;
  size: number;
  color: string;
}) {
  return (
    <Svg accessible={false} viewBox="0 0 24 24" width={size} height={size}>
      <Path d={path} fill={color} />
    </Svg>
  );
}

export default function SocialBrandIcon({
  brand,
  size = 22,
  color = '#000000',
}: SocialBrandIconProps) {
  if (brand in SIMPLE_ICON_BRANDS) {
    const icon = SIMPLE_ICON_BRANDS[brand as keyof typeof SIMPLE_ICON_BRANDS];
    return <SimpleIconGlyph path={icon.path} size={size} color={color} />;
  }

  const Icon = PHOSPHOR_ICON_BRANDS[brand as keyof typeof PHOSPHOR_ICON_BRANDS] as Icon;
  return <Icon size={size} color={color} weight="fill" />;
}

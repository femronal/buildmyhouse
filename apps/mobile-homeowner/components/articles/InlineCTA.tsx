import { Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { trackWebEvent } from '@/lib/analytics';
import { cardShadowStyle } from '@/lib/card-styles';

type Props = {
  title: string;
  description: string;
  buttonText: string;
  href: string;
  slug?: string;
};

export default function InlineCTA({ title, description, buttonText, href, slug }: Props) {
  const router = useRouter();

  return (
    <View
      style={cardShadowStyle}
      className="bg-slate-900 rounded-2xl p-5 mb-8 border border-slate-800 max-w-[680px] self-center w-full"
    >
      <Text className="text-white text-lg mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
        {title}
      </Text>
      <Text className="text-white/85 text-[15px] leading-6 mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
        {description}
      </Text>
      <TouchableOpacity
        onPress={() => {
          trackWebEvent('seo_article_inline_cta', {
            article_slug: slug,
            cta_title: title,
            cta_href: href,
          });
          router.push(href as any);
        }}
        className="bg-blue-600 rounded-full py-3.5 px-5"
      >
        <Text className="text-white text-center text-[15px]" style={{ fontFamily: 'Poppins_700Bold' }}>
          {buttonText}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

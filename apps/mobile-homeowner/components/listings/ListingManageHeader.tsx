import { View } from 'react-native';
import { SeoContentBackButton } from '@/components/seo/SeoContentLayout';
import { SeoHeading } from '@/components/seo/SeoHeading';
import OwnerAppHomeButton from './OwnerAppHomeButton';

export default function ListingManageHeader({
  title,
  fallbackHref,
}: {
  title?: string;
  fallbackHref: string;
}) {
  return (
    <View style={{ marginBottom: 8 }}>
      <SeoContentBackButton
        fallbackHref={fallbackHref}
        className="w-11 h-11 bg-gray-100 rounded-full items-center justify-center mb-3"
      />
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          {title ? (
            <SeoHeading
              level={1}
              className="text-3xl leading-tight text-black md:text-5xl md:leading-[1.08]"
              style={{ fontFamily: 'Poppins_700Bold', marginTop: 0, marginBottom: 0 }}
            >
              {title}
            </SeoHeading>
          ) : null}
        </View>
        <OwnerAppHomeButton />
      </View>
    </View>
  );
}

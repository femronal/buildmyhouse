import { View } from 'react-native';
import InternalLinksBlock, { type InternalLinkItem } from '@/components/seo/InternalLinksBlock';

export type RelatedLinkSection = {
  title: string;
  links: InternalLinkItem[];
};

type Props = {
  sections: RelatedLinkSection[];
};

export default function RelatedLinkSections({ sections }: Props) {
  return (
    <View className="mb-2">
      {sections
        .filter((section) => section.links.length > 0)
        .map((section) => (
          <InternalLinksBlock key={section.title} title={section.title} links={section.links} />
        ))}
    </View>
  );
}


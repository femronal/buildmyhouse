import { View } from 'react-native';
import StageEvidenceGallery from '@/components/seo/StageEvidenceGallery';
import type { ProofOfProcessDemoContent } from '@/components/seo/proof-of-process-types';

type Props = {
  content: ProofOfProcessDemoContent;
};

export default function ProofOfProcessDemoSection({ content }: Props) {
  return (
    <View className="mb-4">
      <StageEvidenceGallery items={content.stageEvidenceGallery} />
    </View>
  );
}


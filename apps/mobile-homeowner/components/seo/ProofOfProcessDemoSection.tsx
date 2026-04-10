import { View } from 'react-native';
import StageEvidenceGallery from '@/components/seo/StageEvidenceGallery';
import ContractorVerificationSummary from '@/components/seo/ContractorVerificationSummary';
import MilestonePaymentBreakdown from '@/components/seo/MilestonePaymentBreakdown';
import DocumentationSampleBlock from '@/components/seo/DocumentationSampleBlock';
import ChatUpdateTimelineDemo from '@/components/seo/ChatUpdateTimelineDemo';
import type { ProofOfProcessDemoContent } from '@/components/seo/proof-of-process-types';

type Props = {
  content: ProofOfProcessDemoContent;
};

export default function ProofOfProcessDemoSection({ content }: Props) {
  return (
    <View className="mb-4">
      <StageEvidenceGallery items={content.stageEvidenceGallery} />
      <ContractorVerificationSummary data={content.contractorVerification} />
      <MilestonePaymentBreakdown items={content.milestonePaymentBreakdown} />
      <DocumentationSampleBlock items={content.documentationSamples} />
      <ChatUpdateTimelineDemo items={content.chatTimeline} />
    </View>
  );
}


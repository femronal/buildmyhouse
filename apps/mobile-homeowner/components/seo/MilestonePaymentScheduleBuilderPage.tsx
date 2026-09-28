import MilestoneCalculator from '@/components/seo/MilestoneCalculator';
import ToolPage from '@/components/tools/tool-page/ToolPage';

export default function MilestonePaymentScheduleBuilderPage() {
  return <ToolPage slug="milestone-payment-schedule" toolSlot={<MilestoneCalculator />} />;
}

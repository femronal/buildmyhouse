import RenovationBudgetCalculator from '@/components/seo/RenovationBudgetCalculator';
import ToolPage from '@/components/tools/tool-page/ToolPage';

export default function RenovationBudgetPlannerPage() {
  return <ToolPage slug="renovation-budget-planner" toolSlot={<RenovationBudgetCalculator />} />;
}

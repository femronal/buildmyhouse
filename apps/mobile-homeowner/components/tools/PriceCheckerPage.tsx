import { PriceCheckerWorkspace } from '@/components/tools/price-checker/PriceCheckerWorkspace';
import ToolPage from '@/components/tools/tool-page/ToolPage';

/**
 * Live Price Checker. The search and report flow is unchanged.
 * The page around it explains the tool and links the rest of the suite.
 */
export default function PriceCheckerPage() {
  return <ToolPage slug="price-checker" toolSlot={<PriceCheckerWorkspace embedded />} />;
}

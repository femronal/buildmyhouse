import LeadMagnetDownloadPage from '@/components/seo/LeadMagnetDownloadPage';
import { lagosPermitStarterChecklistDownloadPageContent as content } from '@/lib/lagos-permit-starter-checklist-download-content';

export default function LagosPermitStarterChecklistDownloadRoute() {
  return <LeadMagnetDownloadPage content={content} />;
}

import LeadMagnetDownloadPage from '@/components/seo/LeadMagnetDownloadPage';
import { remoteRenovationScopeWorksheetDownloadPageContent as content } from '@/lib/remote-renovation-scope-worksheet-download-content';

export default function RemoteRenovationScopeWorksheetDownloadRoute() {
  return <LeadMagnetDownloadPage content={content} />;
}

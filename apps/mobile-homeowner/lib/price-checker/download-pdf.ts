/**
 * Shared Price Checker PDF download helper.
 * Uses authenticated fetch + blob on web so every attempt includes JWT / session headers.
 */
import { Linking, Platform } from 'react-native';
import { priceCheckerApi } from '@/lib/price-checker/api';

export async function downloadPriceCheckerPdf(reportId: string, token: string | null): Promise<void> {
  if (!reportId) throw new Error('Missing report id');

  if (Platform.OS !== 'web') {
    await Linking.openURL(priceCheckerApi.pdfUrl(reportId, token));
    return;
  }

  const blob = await priceCheckerApi.downloadPdfBlob(reportId, token);
  const objectUrl = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = `BuildMyHouse-Price-Report-${reportId.slice(0, 8)}.pdf`;
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    // Revoke after the browser has started the download.
    setTimeout(() => URL.revokeObjectURL(objectUrl), 2_000);
  }
}

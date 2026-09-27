import { pdfNaira, type BudgetResult } from '@/lib/renovationBudget';
import { renovationBudgetConfig as config, type FinishId, type LocationId, type PropertyTypeId, type SizeId } from '@/lib/renovationBudget.config';

export type EstimateExportInput = {
  propertyType: PropertyTypeId;
  location: LocationId;
  sizeBand: SizeId;
  finishLevel: FinishId;
  contingency: number;
  result: BudgetResult;
  highCost: string[];
  reminders: readonly string[];
  logoUri?: string;
};

const TOOL_URL = config.toolUrl;

function fileStamp(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

async function toDataUrl(uri: string) {
  const response = await fetch(uri);
  const blob = await response.blob();
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
  const image = new Image();
  image.src = source;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  canvas.getContext('2d')?.drawImage(image, 0, 0, 128, 128);
  return canvas.toDataURL('image/png');
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

async function deliverFile(file: File) {
  const canShare = typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });
  if (canShare) {
    await navigator.share({ files: [file], title: file.name });
    return 'native' as const;
  }
  downloadBlob(file, file.name);
  return 'download' as const;
}

type JsPdfDoc = {
  internal: { pageSize: { getWidth: () => number; getHeight: () => number } };
  setFont: (family: string, style: string) => void;
  setFontSize: (size: number) => void;
  setTextColor: (r: number, g: number, b: number) => void;
  text: (text: string | string[], x: number, y: number, options?: { align?: string }) => void;
  setDrawColor: (r: number, g: number, b: number) => void;
  setLineWidth: (width: number) => void;
  line: (x1: number, y1: number, x2: number, y2: number) => void;
  addImage: (data: string, format: string, x: number, y: number, w: number, h: number) => void;
  addPage: () => void;
  splitTextToSize: (text: string, width: number) => string[];
  getNumberOfPages: () => number;
  setPage: (page: number) => void;
  output: (type: 'blob') => Blob;
};

declare global {
  interface Window {
    jspdf?: { jsPDF: new (options: { unit: string; format: string }) => JsPdfDoc };
    htmlToImage?: { toPng: (node: HTMLElement, options?: { pixelRatio?: number; cacheBust?: boolean; backgroundColor?: string }) => Promise<string> };
  }
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const found = document.querySelector(`script[data-bmh-src="${src}"]`);
    if (found instanceof HTMLScriptElement && found.dataset.loaded === '1') {
      resolve();
      return;
    }
    if (found) {
      found.addEventListener('load', () => resolve(), { once: true });
      found.addEventListener('error', () => reject(new Error('Could not load the export tool.')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.dataset.bmhSrc = src;
    script.onload = () => {
      script.dataset.loaded = '1';
      resolve();
    };
    script.onerror = () => reject(new Error('Could not load the export tool.'));
    document.body.appendChild(script);
  });
}

export async function downloadEstimatePdf(input: EstimateExportInput) {
  await loadScript('/vendor/jspdf.umd.min.js');
  const JsPDF = window.jspdf?.jsPDF;
  if (!JsPDF) throw new Error('PDF tool did not load.');
  const doc = new JsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  let y = 16;
  let logo: string | null = null;
  if (input.logoUri) {
    try {
      logo = await toDataUrl(input.logoUri);
    } catch {
      logo = null;
    }
  }

  const paintHeader = () => {
    if (logo) {
      try {
        doc.addImage(logo, 'PNG', margin, 10, 10, 10);
      } catch {
        logo = null;
      }
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('BuildMyHouse', logo ? margin + 13 : margin, 16);
    doc.setFontSize(16);
    doc.text('Renovation budget estimate', margin, 28);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), margin, 34);
    doc.setDrawColor(22, 163, 74);
    doc.setLineWidth(0.6);
    doc.line(margin, 38, pageWidth - margin, 38);
    y = 46;
  };

  const ensure = (height: number) => {
    if (y + height < pageHeight - 18) return;
    doc.addPage();
    paintHeader();
  };

  const write = (text: string, size = 11, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(0, 0, 0);
    const lines = doc.splitTextToSize(text, pageWidth - margin * 2);
    ensure(lines.length * (size * 0.45) + 2);
    doc.text(lines, margin, y);
    y += lines.length * (size * 0.45) + 2;
  };

  paintHeader();
  write(`${input.propertyType} in ${input.location}`, 12, true);
  write(`${input.sizeBand} · ${input.finishLevel}`);
  write(`Total: ${pdfNaira(input.result.total)}`, 12, true);
  write(`For the work: ${pdfNaira(input.result.subtotal)}`);
  write(`Kept aside for surprises: ${pdfNaira(input.result.contingencyAmount)} (${input.contingency}%)`);
  y += 2;
  input.result.rows.forEach((row, index) => {
    write(`${index + 1}. ${row.space}`, 12, true);
    write(`${row.workType} · ${pdfNaira(row.estimate)}`);
  });
  if (input.highCost.length) {
    y += 2;
    write('Areas that can push the cost up', 12, true);
    input.highCost.forEach((item) => write(`• ${item}`, 10));
  }
  y += 2;
  write('Important reminders', 12, true);
  input.reminders.forEach((item) => write(`• ${item}`, 10));

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text('This is a rough planning guide, not a final contractor quote.', margin, pageHeight - 10);
    doc.text(TOOL_URL, margin, pageHeight - 6);
    doc.text(`${page} / ${pages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
  }

  const filename = `buildmyhouse-renovation-budget-${fileStamp()}.pdf`;
  const blob = doc.output('blob');
  await deliverFile(new File([blob], filename, { type: 'application/pdf' }));
}

export async function captureEstimateImage(node: HTMLElement, pixelRatio?: number) {
  await loadScript('/vendor/html-to-image.js');
  const toPng = window.htmlToImage?.toPng;
  if (!toPng) throw new Error('Image tool did not load.');
  if (document.fonts?.ready) await document.fonts.ready;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const ratio = pixelRatio ?? (memory && memory <= 2 ? 1 : 2);
  const previous = node.getAttribute('style');
  node.style.position = 'fixed';
  node.style.left = '0px';
  node.style.top = '0px';
  node.style.zIndex = '1';
  node.style.opacity = '1';
  node.style.backgroundColor = '#ffffff';
  let dataUrl = '';
  try {
    dataUrl = await toPng(node, { pixelRatio: ratio, cacheBust: true, backgroundColor: '#ffffff' });
  } finally {
    if (previous === null) node.removeAttribute('style');
    else node.setAttribute('style', previous);
  }
  const response = await fetch(dataUrl);
  return await response.blob();
}

export async function saveEstimateImage(node: HTMLElement) {
  const blob = await captureEstimateImage(node);
  const filename = `buildmyhouse-renovation-budget-${fileStamp()}.png`;
  await deliverFile(new File([blob], filename, { type: 'image/png' }));
}

export async function shareEstimateOnWhatsApp(text: string, image?: File | null) {
  if (image && typeof navigator.canShare === 'function' && navigator.canShare({ files: [image] })) {
    await navigator.share({ files: [image], text });
    return 'native' as const;
  }
  window.location.href = `https://wa.me/?text=${encodeURIComponent(text)}`;
  return 'wa_link' as const;
}

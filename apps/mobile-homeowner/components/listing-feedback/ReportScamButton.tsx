import { useEffect, useRef, useState } from 'react';
import { useGlobalSearchParams, useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { LANDING_BORDER, LANDING_INK, LANDING_MUTED } from '@/lib/home-landing-content';
import { listingPublicPath, scamReportSubmitBlock, type ListingKind } from '@/lib/listing-feedback';
import { requireAuthToContinue } from '@/lib/require-auth-to-continue';
import { friendlyUploadError } from '@/lib/upload-rules';
import { useCurrentUser } from '@/hooks/useCurrentUser';

async function uploadEvidence(asset: { uri: string; name?: string | null; mimeType?: string | null }) {
  const name = asset.name || 'evidence';
  const isPdf = (asset.mimeType || name).toLowerCase().includes('pdf');
  const formData = new FormData();
  if (Platform.OS === 'web') {
    const response = await fetch(asset.uri);
    const blob = await response.blob();
    formData.append('file', blob, name);
  } else {
    formData.append('file', { uri: asset.uri, name, type: asset.mimeType || (isPdf ? 'application/pdf' : 'image/jpeg') } as any);
  }
  const uploadRes = await api.post(isPdf ? '/upload/document' : '/upload/image', formData);
  const url = String(uploadRes?.url || '').trim();
  if (!url) throw new Error('Upload succeeded but no file URL was returned.');
  return url;
}

function wantsReportForm(report: string | string[] | undefined) {
  const value = Array.isArray(report) ? report[0] : report;
  if (value === '1') return true;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return new URLSearchParams(window.location.search).get('report') === '1';
  }
  return false;
}

function scrollReportIntoView(node: View | null) {
  const fromRef = node as unknown as { scrollIntoView?: (options: ScrollIntoViewOptions) => void } | null;
  if (typeof fromRef?.scrollIntoView === 'function') {
    fromRef.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  if (typeof document !== 'undefined') {
    document.getElementById('report-scam')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

export default function ReportScamButton({ kind, slug }: { kind: ListingKind; slug: string }) {
  const router = useRouter();
  const params = useGlobalSearchParams<{ report?: string | string[] }>();
  const anchorRef = useRef<View>(null);
  const openedFromReturn = useRef(false);
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [whatHappened, setWhatHappened] = useState('');
  const [amount, setAmount] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const path = listingPublicPath(kind, slug);
  const block = scamReportSubmitBlock({ consent, whatHappened, phone });
  const returnToReport = wantsReportForm(params.report);

  useEffect(() => {
    if (currentUser?.phone && !phone) setPhone(currentUser.phone);
  }, [currentUser?.phone, phone]);

  useEffect(() => {
    if (!returnToReport || userLoading || !currentUser || openedFromReturn.current) return;
    openedFromReturn.current = true;
    setOpen(true);
  }, [returnToReport, userLoading, currentUser]);

  useEffect(() => {
    if (!open || !returnToReport) return;
    const timer = setTimeout(() => scrollReportIntoView(anchorRef.current), 450);
    return () => clearTimeout(timer);
  }, [open, returnToReport]);

  const save = useMutation({
    mutationFn: () =>
      api.post(`/listing-feedback/${kind}/${encodeURIComponent(slug)}/scam-reports`, {
        whatHappened: whatHappened.trim(),
        amountNaira: amount.trim() ? Number(amount.replace(/[^\d]/g, '')) : undefined,
        incidentDate: incidentDate.trim() || undefined,
        evidenceUrls,
        contactConsent: true,
        contactPhone: phone.trim(),
      }),
    onSuccess: (result: { message?: string }) => {
      setNote(result?.message || 'Thanks. BMH will look into this privately and may contact you.');
      setError('');
      setOpen(false);
    },
    onError: (err: Error) => setError(err.message),
  });

  const openForm = async () => {
    const allowed = await requireAuthToContinue({
      router,
      currentUser,
      userLoading,
      destinationPath: `${path}?report=1`,
      promptTitle: 'Sign in to report',
      promptMessage: 'Sign in so BMH can contact you about this private report.',
    });
    if (!allowed) return;
    setOpen(true);
    setNote('');
  };

  const addFile = async () => {
    if (evidenceUrls.length >= 10) return;
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (picked.canceled || !picked.assets?.length) return;
      const asset = picked.assets[0];
      const url = await uploadEvidence(asset);
      setEvidenceUrls((current) => [...current, url].slice(0, 10));
      setError('');
    } catch (err) {
      setError(friendlyUploadError(err));
    }
  };

  return (
    <View
      ref={anchorRef}
      nativeID="report-scam"
      style={{ marginTop: 22, marginBottom: 88, ...(Platform.OS === 'web' ? ({ scrollMarginTop: 88 } as object) : {}) }}
    >
      <Pressable onPress={open ? () => setOpen(false) : openForm} accessibilityRole="button">
        <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 14, color: LANDING_INK, textDecorationLine: 'underline' }}>
          Report this contractor if he scammed you
        </Text>
      </Pressable>
      {note ? <Text style={{ fontFamily: 'Poppins_500Medium', color: LANDING_INK, marginTop: 10 }}>{note}</Text> : null}
      {open ? (
        <View style={{ marginTop: 12 }}>
          <Text style={{ fontFamily: 'Poppins_500Medium', color: LANDING_INK, marginBottom: 6 }}>What happened</Text>
          <Text style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED, marginBottom: 6 }}>At least 50 characters.</Text>
          <TextInput
            value={whatHappened}
            onChangeText={setWhatHappened}
            multiline
            maxLength={5000}
            style={{ borderWidth: 1, borderColor: LANDING_BORDER, borderRadius: 10, padding: 10, minHeight: 100, fontFamily: 'Poppins_400Regular' }}
          />
          <Text style={{ fontFamily: 'Poppins_500Medium', color: LANDING_INK, marginTop: 10, marginBottom: 6 }}>Amount lost in naira</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="number-pad"
            placeholder="Optional"
            style={{ borderWidth: 1, borderColor: LANDING_BORDER, borderRadius: 10, padding: 10, fontFamily: 'Poppins_400Regular' }}
          />
          <Text style={{ fontFamily: 'Poppins_500Medium', color: LANDING_INK, marginTop: 10, marginBottom: 6 }}>Date it happened</Text>
          <TextInput
            value={incidentDate}
            onChangeText={setIncidentDate}
            placeholder="YYYY-MM-DD, optional"
            style={{ borderWidth: 1, borderColor: LANDING_BORDER, borderRadius: 10, padding: 10, fontFamily: 'Poppins_400Regular' }}
          />
          <Pressable onPress={addFile} style={{ marginTop: 12 }}>
            <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK, textDecorationLine: 'underline' }}>Add a photo or PDF</Text>
          </Pressable>
          <Text style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED, marginTop: 4 }}>{evidenceUrls.length} file{evidenceUrls.length === 1 ? '' : 's'} added</Text>
          <Text style={{ fontFamily: 'Poppins_500Medium', color: LANDING_INK, marginTop: 10, marginBottom: 6 }}>Phone number</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            style={{ borderWidth: 1, borderColor: LANDING_BORDER, borderRadius: 10, padding: 10, fontFamily: 'Poppins_400Regular' }}
          />
          <Pressable onPress={() => setConsent((value) => !value)} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 12 }}>
            <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK }}>{consent ? '[x]' : '[ ]'}</Text>
            <Text style={{ flex: 1, fontFamily: 'Poppins_400Regular', color: LANDING_INK, lineHeight: 20 }}>BMH can contact me about this report</Text>
          </Pressable>
          <Text style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED, marginTop: 8, lineHeight: 20 }}>
            Your report is private. BMH investigates before anything is shown.
          </Text>
          {block && (whatHappened.trim().length > 0 || error) ? (
            <Text style={{ fontFamily: 'Poppins_500Medium', color: LANDING_INK, marginTop: 8, lineHeight: 20 }}>{block}</Text>
          ) : null}
          {error && error !== block ? <Text style={{ color: '#B91C1C', marginTop: 8 }}>{error}</Text> : null}
          <Pressable
            onPress={() => {
              if (block) {
                setError(block);
                return;
              }
              setError('');
              save.mutate();
            }}
            disabled={save.isPending}
            style={{ marginTop: 12, alignSelf: 'flex-start', opacity: save.isPending ? 0.45 : 1 }}
          >
            <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK, textDecorationLine: 'underline' }}>
              {save.isPending ? 'Sending...' : 'Send private report'}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

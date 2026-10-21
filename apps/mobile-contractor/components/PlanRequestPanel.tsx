import { useEffect, useState } from 'react';
import { Image, Pressable, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { api } from '@/lib/api';
import { uploadFile } from '@/utils/fileUpload';
import { REQUEST_STEP_COPY } from '@/lib/request-step-copy';

export function PlanRequestPanel({
  request,
  onChanged,
  onAccept,
  onDecline,
}: {
  request: any;
  onChanged: () => void;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const step = request?.project?.planRequestStep;
  const [date, setDate] = useState('');
  const [fee, setFee] = useState('');
  const [quoteTotal, setQuoteTotal] = useState('');
  const [quoteFileUrl, setQuoteFileUrl] = useState('');
  const [quoteNotice, setQuoteNotice] = useState('');
  const [lumpSum, setLumpSum] = useState(true);
  const [stages, setStages] = useState<Array<{ name: string; doneWhen: string; amount: string; duration: string }>>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const number = step?.step || 1;
  const waiting = step?.state === 'waiting_other_side';
  const late = step?.state === 'late';

  const loadQuoteDraft = (notes?: string | null) => {
    try {
      const parsed = JSON.parse(String(notes || ''));
      if (parsed?.kind !== 'plan_quote_draft' && parsed?.kind !== 'plan_quote') return;
      if (parsed.signedTotal) setQuoteTotal(String(parsed.signedTotal));
      if (parsed.quoteFileUrl) setQuoteFileUrl(String(parsed.quoteFileUrl));
      const homeownerNote = String(parsed.homeownerNote || '').trim();
      const notice = String(parsed.notice || '').trim();
      setQuoteNotice([homeownerNote, notice].filter(Boolean).join('\n\n'));
      setLumpSum(parsed.lumpSum !== false);
      if (Array.isArray(parsed.stages)) {
        setStages(parsed.stages.map((stage: any) => ({
          name: String(stage?.name || ''),
          doneWhen: String(stage?.doneWhen || ''),
          amount: String(stage?.amount ?? ''),
          duration: String(stage?.duration || 'As agreed'),
        })));
      }
    } catch {
      return;
    }
  };

  useEffect(() => {
    loadQuoteDraft(request?.gcNotes);
  }, [request?.id, request?.gcNotes]);

  const send = async (body: Record<string, unknown>) => {
    setBusy(true);
    setError('');
    try {
      await api.patch(`/contractors/requests/${request.id}/step`, body);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update this step');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="bg-[#1E3A5F] rounded-2xl p-5 mb-4 border border-blue-900">
      <Text className="text-white text-lg mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
        Step {number} of 6{late ? ' · Late' : waiting ? ' · Waiting for homeowner' : ''}
      </Text>
      {REQUEST_STEP_COPY.steps.map((line, index) => {
        const n = index + 1;
        const done = number > n || step?.state === 'done';
        const current = number === n;
        return (
          <Text key={line} className={current ? 'text-white' : 'text-gray-400'} style={{ fontFamily: current ? 'Poppins_600SemiBold' : 'Poppins_400Regular', marginBottom: 6 }}>
            {done ? '✓ ' : current ? '• ' : '○ '}{line}
          </Text>
        );
      })}
      {request?.bmhCheckNote && (request?.bmhCheckResult === 'too_high' || request?.bmhCheckResult === 'too_low') ? (
        <Text className="text-amber-300 mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>
          BuildMyHouse asked for the quote to be looked at again: {request.bmhCheckNote}
        </Text>
      ) : null}
      <Text className="text-gray-200 mt-3" style={{ fontFamily: 'Poppins_400Regular' }}>
        {REQUEST_STEP_COPY.steps[number - 1]}
      </Text>
      {number === 1 && !waiting ? (
        <View className="mt-3">
          <TextInput value={date} onChangeText={setDate} placeholder="Inspection date (YYYY-MM-DD)" placeholderTextColor="#9CA3AF" className="bg-[#0A1628] text-white rounded-xl px-3 py-3 mb-2 border border-blue-900" />
          <TextInput value={fee} onChangeText={setFee} placeholder="Inspection fee" placeholderTextColor="#9CA3AF" keyboardType="numeric" className="bg-[#0A1628] text-white rounded-xl px-3 py-3 mb-2 border border-blue-900" />
          <Pressable disabled={busy} onPress={() => send({ action: 'contacted', inspectionDate: date, inspectionFee: Number(fee) })} className="bg-blue-600 rounded-full py-3 items-center">
            <Text className="text-white" style={{ fontFamily: 'Poppins_700Bold' }}>I've contacted the homeowner</Text>
          </Pressable>
        </View>
      ) : null}
      {number === 3 && step?.actor === 'gc' ? (
        <View className="mt-3">
          <Pressable
            onPress={async () => {
              const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsMultipleSelection: true, selectionLimit: 4 });
              if (picked.canceled) return;
              const urls: string[] = [];
              for (const asset of picked.assets || []) {
                urls.push(await uploadFile(asset.uri, 'image', { fileName: asset.fileName, mimeType: asset.mimeType }));
              }
              setPhotos(urls);
            }}
            className="border border-blue-400 rounded-full py-3 items-center mb-2"
          >
            <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>{photos.length ? `${photos.length} photos` : 'Add site photos'}</Text>
          </Pressable>
          <View className="flex-row mb-2">
            {photos.slice(0, 2).map((url) => <Image key={url} source={{ uri: url }} style={{ width: 64, height: 64, borderRadius: 8, marginRight: 8 }} />)}
          </View>
          <Pressable disabled={busy || photos.length < 2} onPress={() => send({ action: 'inspection_done', photoUrls: photos })} className="bg-blue-600 rounded-full py-3 items-center">
            <Text className="text-white" style={{ fontFamily: 'Poppins_700Bold' }}>Inspection done, add photos</Text>
          </Pressable>
        </View>
      ) : null}
      {number === 4 && step?.actor === 'gc' ? (
        <View className="mt-3">
          <Text className="text-gray-300 mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
            Enter the total on the quote the homeowner already signed, then upload that file.
          </Text>
          <TextInput
            value={quoteTotal}
            onChangeText={setQuoteTotal}
            placeholder="Signed quote total (₦)"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            className="bg-[#0A1628] text-white rounded-xl px-3 py-3 mb-2 border border-blue-900"
          />
          <Pressable
            disabled={busy}
            onPress={async () => {
              const total = Number(quoteTotal.replace(/[^0-9.]/g, ''));
              if (!Number.isFinite(total) || total <= 0) {
                setError('Enter the signed quote total.');
                return;
              }
              const picked = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, type: ['application/pdf', 'image/*'] });
              if (picked.canceled) return;
              const file = picked.assets?.[0];
              if (!file) return;
              setBusy(true);
              setError('');
              try {
                const url = await uploadFile(file.uri, 'document', { fileName: file.name, mimeType: file.mimeType });
                setQuoteFileUrl(url);
                const updated: any = await api.patch(`/contractors/requests/${request.id}/step`, {
                  action: 'prepare_quote',
                  quoteFileUrl: url,
                  quoteTotal: total,
                });
                loadQuoteDraft(updated?.gcNotes);
                onChanged();
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Could not read this quote');
              } finally {
                setBusy(false);
              }
            }}
            className="border border-blue-400 rounded-full py-3 items-center mb-3"
          >
            <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              {quoteFileUrl ? 'Replace signed quote' : 'Upload signed quote'}
            </Text>
          </Pressable>
          {quoteNotice ? (
            <Text className="text-amber-200 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>{quoteNotice}</Text>
          ) : null}
          {stages.map((stage, index) => (
            <View key={`${stage.name}-${index}`} className="bg-[#0A1628] rounded-xl p-3 mb-2 border border-blue-900">
              <TextInput
                value={stage.name}
                onChangeText={(value) => setStages((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, name: value } : item))}
                placeholder="Stage name"
                placeholderTextColor="#9CA3AF"
                className="text-white mb-2"
              />
              <TextInput
                value={stage.amount}
                onChangeText={(value) => setStages((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, amount: value } : item))}
                placeholder="Amount (₦)"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                className="text-white mb-2"
              />
              <TextInput
                value={stage.doneWhen}
                onChangeText={(value) => setStages((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, doneWhen: value } : item))}
                placeholder="Done when the homeowner can see…"
                placeholderTextColor="#9CA3AF"
                multiline
                className="text-white"
              />
              {stages.length > 2 ? (
                <Pressable onPress={() => setStages((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="mt-2">
                  <Text className="text-red-300" style={{ fontFamily: 'Poppins_600SemiBold' }}>Remove stage</Text>
                </Pressable>
              ) : null}
            </View>
          ))}
          {stages.length > 0 ? (
            <Pressable
              onPress={() => setStages((current) => [...current, { name: '', doneWhen: '', amount: '', duration: 'As agreed' }])}
              className="mb-3"
            >
              <Text className="text-blue-300" style={{ fontFamily: 'Poppins_600SemiBold' }}>Add stage</Text>
            </Pressable>
          ) : null}
          {stages.length > 0 ? (
            <Text className="text-gray-300 mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
              Stages total ₦{stages.reduce((sum, stage) => sum + (Number(String(stage.amount).replace(/[^0-9.]/g, '')) || 0), 0).toLocaleString('en-NG')} · Signed quote ₦{(Number(quoteTotal.replace(/[^0-9.]/g, '')) || 0).toLocaleString('en-NG')}. Monitoring, coordination, and contingency are shown to the homeowner separately.
            </Text>
          ) : null}
          {stages.length > 0 ? (
            <Pressable
              disabled={busy}
              onPress={() => send({
                action: 'quote_uploaded',
                quoteTotal: Number(quoteTotal.replace(/[^0-9.]/g, '')),
                quoteFileUrl,
                lumpSum,
                stages: stages.map((stage) => ({
                  name: stage.name,
                  doneWhen: stage.doneWhen,
                  amount: Number(String(stage.amount).replace(/[^0-9.]/g, '')),
                  duration: stage.duration || 'As agreed',
                })),
              })}
              className="bg-blue-600 rounded-full py-3 items-center"
            >
              <Text className="text-white" style={{ fontFamily: 'Poppins_700Bold' }}>Send scope to homeowner</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {number === 5 ? (
        <View className="mt-3 bg-[#0A1628] rounded-full py-3 items-center">
          <Text className="text-gray-300" style={{ fontFamily: 'Poppins_600SemiBold' }}>Waiting for BuildMyHouse check</Text>
        </View>
      ) : null}
      {number === 6 && step?.actor === 'gc' ? (
        <Pressable disabled={busy || request?.bmhCheckResult !== 'fair'} onPress={onAccept} className="bg-blue-600 rounded-full py-3 items-center mt-3">
          <Text className="text-white" style={{ fontFamily: 'Poppins_700Bold' }}>Accept job</Text>
        </Pressable>
      ) : null}
      {waiting ? <Text className="text-gray-300 mt-3" style={{ fontFamily: 'Poppins_400Regular' }}>{REQUEST_STEP_COPY.waitingHomeowner}</Text> : null}
      {error ? <Text className="text-red-300 mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>{error}</Text> : null}
      {number < 6 ? (
        <Pressable onPress={onDecline} className="mt-4 items-center">
          <Text className="text-gray-300" style={{ fontFamily: 'Poppins_600SemiBold' }}>Decline</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

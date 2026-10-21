import { useState } from 'react';
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
  const [materials, setMaterials] = useState('');
  const [labour, setLabour] = useState('');
  const [stages, setStages] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const number = step?.step || 1;
  const waiting = step?.state === 'waiting_other_side';
  const late = step?.state === 'late';

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
          <TextInput value={materials} onChangeText={setMaterials} placeholder="Materials" placeholderTextColor="#9CA3AF" className="bg-[#0A1628] text-white rounded-xl px-3 py-3 mb-2 border border-blue-900" />
          <TextInput value={labour} onChangeText={setLabour} placeholder="Labour" placeholderTextColor="#9CA3AF" className="bg-[#0A1628] text-white rounded-xl px-3 py-3 mb-2 border border-blue-900" />
          <TextInput value={stages} onChangeText={setStages} placeholder="Stages" placeholderTextColor="#9CA3AF" className="bg-[#0A1628] text-white rounded-xl px-3 py-3 mb-2 border border-blue-900" />
          <Pressable
            disabled={busy}
            onPress={async () => {
              const picked = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
              if (picked.canceled) return;
              const file = picked.assets?.[0];
              const url = file ? await uploadFile(file.uri, 'document', { fileName: file.name, mimeType: file.mimeType }) : '';
              await send({
                action: 'quote_uploaded',
                materials,
                labour,
                stages,
                quoteFileUrl: url,
                estimatedBudget: Number(request?.project?.design?.estimatedCost || request?.project?.budget || 0),
              });
            }}
            className="bg-blue-600 rounded-full py-3 items-center"
          >
            <Text className="text-white" style={{ fontFamily: 'Poppins_700Bold' }}>Upload quote</Text>
          </Pressable>
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

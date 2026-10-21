import { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { projectService } from '@/services/projectService';
import { api } from '@/lib/api';
import { getBackendAssetUrl } from '@/lib/image';
import { REQUEST_STATUS_COPY } from '@/lib/request-status-copy';

function formatWhen(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  return date.toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

function quoteParts(notes?: string | null) {
  try {
    const parsed = JSON.parse(String(notes || ''));
    if (parsed?.kind === 'plan_quote') return parsed;
  } catch {
    return null;
  }
  return null;
}

export default function RequestStatusScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ projectId?: string }>();
  const projectId = String(params.projectId || '');
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const projectQuery = useQuery({
    queryKey: ['projects', projectId, 'plan-request'],
    queryFn: () => projectService.getProject(projectId),
    enabled: !!projectId,
  });
  const project = projectQuery.data as any;
  const request = useMemo(
    () => (project?.projectRequests || []).find((item: any) => !item.stageId) || null,
    [project],
  );
  const step = project?.planRequestStep;
  const contractor = request?.contractor;
  const profile = contractor?.contractorProfile;
  const name = profile?.name || contractor?.fullName || 'Your contractor';
  const firstName = String(name).split(' ')[0];
  const cover = getBackendAssetUrl(project?.design?.images?.[0]?.thumbnailUrl || project?.design?.images?.[0]?.url || '');
  const location = [profile?.lgaLabel, profile?.stateLabel].filter(Boolean).join(', ')
    || profile?.location
    || [project?.city, project?.state].filter(Boolean).join(', ');
  const quote = quoteParts(request?.gcNotes);
  const copy = REQUEST_STATUS_COPY.steps[(step?.step || 1) - 1];
  const declined = step?.state === 'declined';
  const afterInspection = !!step?.inspectionAlreadyHappened;

  const act = async (action: string, extra?: Record<string, unknown>) => {
    if (!request?.id) return;
    setBusy(true);
    try {
      await api.patch(`/contractors/requests/${request.id}/step`, { action, ...extra });
      await queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'plan-request'] });
    } finally {
      setBusy(false);
    }
  };

  if (!projectId || projectQuery.isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator color="#111" />
      </View>
    );
  }

  if (!project?.designId) {
    router.replace(`/house-summary?projectId=${projectId}` as any);
    return null;
  }

  const statusLine = declined
    ? `${firstName} can't take this project`
    : step?.state === 'late'
      ? REQUEST_STATUS_COPY.late
      : step?.actor === 'homeowner'
        ? `Your turn: ${copy?.title}`
        : `${firstName} is on ${copy?.title?.toLowerCase()}`;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
      <Pressable onPress={() => router.back()} style={{ marginBottom: 12 }}>
        <Text style={{ fontFamily: 'Poppins_600SemiBold' }}>Back</Text>
      </Pressable>
      {cover ? (
        <Image source={{ uri: cover }} style={{ width: '100%', height: 180, borderRadius: 16, backgroundColor: '#F3F4F6' }} />
      ) : null}
      <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 26, marginTop: 16 }}>{project?.design?.name || project?.name}</Text>
      {location ? <Text style={{ fontFamily: 'Poppins_400Regular', color: '#374151', marginTop: 4 }}>{location}</Text> : null}
      <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 18, marginTop: 12 }}>
        Estimated price ₦{Number(project?.design?.estimatedCost || project?.budget || 0).toLocaleString('en-NG')}
      </Text>
      <Text style={{ fontFamily: 'Poppins_400Regular', color: '#6B7280', marginTop: 4 }}>{REQUEST_STATUS_COPY.estimateNote}</Text>

      <View style={{ marginTop: 16, borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 16, padding: 14 }}>
        <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 18 }}>{name}</Text>
        <Text style={{ fontFamily: 'Poppins_600SemiBold', color: profile?.verified ? '#16a34a' : '#6B7280', marginTop: 4 }}>
          {profile?.verified ? 'Verified' : 'Unverified'}
        </Text>
      </View>

      <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 22, marginTop: 20 }}>{statusLine}</Text>
      {request?.bmhCheckNote && (request?.bmhCheckResult === 'too_high' || request?.bmhCheckResult === 'too_low') ? (
        <Text style={{ fontFamily: 'Poppins_400Regular', marginTop: 8 }}>
          BuildMyHouse asked for the quote to be looked at again: {request.bmhCheckNote}
        </Text>
      ) : null}

      <View style={{ marginTop: 16 }}>
        {REQUEST_STATUS_COPY.steps.map((item, index) => {
          const number = index + 1;
          const current = step?.step === number;
          const done = (step?.step || 1) > number || step?.state === 'done';
          const late = current && step?.state === 'late';
          const date = number === 1 ? formatWhen(request?.sentAt) : number === 2 ? formatWhen(request?.contactedAt) : number === 3 ? formatWhen(request?.inspectedAt) : number === 4 ? formatWhen(request?.quoteGeneratedAt) : number === 5 ? formatWhen(request?.bmhCheckAt) : formatWhen(request?.respondedAt);
          return (
            <View key={item.title} style={{ flexDirection: 'row', marginBottom: 14 }}>
              <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: done || current ? (late ? '#f59e0b' : '#22c55e') : '#E5E5E5', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                <Text style={{ color: done || current ? '#fff' : '#6B7280', fontSize: 12 }}>{done ? '✓' : ''}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: current ? 'Poppins_700Bold' : 'Poppins_500Medium', fontSize: 16 }}>{item.title}</Text>
                {date ? <Text style={{ fontFamily: 'Poppins_400Regular', color: '#6B7280' }}>{date}</Text> : null}
              </View>
            </View>
          );
        })}
      </View>

      {!declined ? (
        <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 16, lineHeight: 24 }}>
          {step?.step === 2 ? REQUEST_STATUS_COPY.steps[1].confirm : copy?.now || copy?.detail}
        </Text>
      ) : (
        <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 16, lineHeight: 24 }}>
          {afterInspection ? REQUEST_STATUS_COPY.declinedAfter : REQUEST_STATUS_COPY.declinedBefore}
        </Text>
      )}

      {step?.step === 2 && step?.actor === 'homeowner' && !declined ? (
        <View style={{ flexDirection: 'row', marginTop: 12 }}>
          <Pressable disabled={busy} onPress={() => act('confirm_contact')} style={{ backgroundColor: '#111', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 12, marginRight: 8 }}>
            <Text style={{ color: '#fff', fontFamily: 'Poppins_600SemiBold' }}>Yes</Text>
          </Pressable>
          <Pressable disabled={busy} onPress={() => act('dispute')} style={{ borderWidth: 1, borderColor: '#111', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 12 }}>
            <Text style={{ fontFamily: 'Poppins_600SemiBold' }}>No</Text>
          </Pressable>
        </View>
      ) : null}
      {step?.step === 3 && step?.actor === 'homeowner' && !declined ? (
        <View style={{ flexDirection: 'row', marginTop: 12 }}>
          <Pressable disabled={busy} onPress={() => act('confirm_inspection')} style={{ backgroundColor: '#111', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 12, marginRight: 8 }}>
            <Text style={{ color: '#fff', fontFamily: 'Poppins_600SemiBold' }}>Yes, they came</Text>
          </Pressable>
          <Pressable disabled={busy} onPress={() => act('dispute')} style={{ borderWidth: 1, borderColor: '#111', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 12 }}>
            <Text style={{ fontFamily: 'Poppins_600SemiBold' }}>No</Text>
          </Pressable>
        </View>
      ) : null}
      {quote && step?.step === 4 ? (
        <View style={{ marginTop: 12, borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 16, padding: 14 }}>
          {Array.isArray(quote.stages) ? (
            <>
              <Text style={{ fontFamily: 'Poppins_600SemiBold', marginBottom: 8 }}>
                Based on BuildMyHouse's policies and systems, this is the project's new scope after inspection.
              </Text>
              {quote.stages.map((stage: any) => (
                <View key={`${stage.name}-${stage.amount}`} style={{ marginBottom: 10 }}>
                  <Text style={{ fontFamily: 'Poppins_600SemiBold' }}>{stage.name}</Text>
                  <Text style={{ fontFamily: 'Poppins_400Regular' }}>₦{Number(stage.amount || 0).toLocaleString('en-NG')}</Text>
                  {stage.doneWhen ? <Text style={{ fontFamily: 'Poppins_400Regular', color: '#374151' }}>Done when: {stage.doneWhen}</Text> : null}
                </View>
              ))}
              <Text style={{ fontFamily: 'Poppins_600SemiBold', marginTop: 4 }}>Contractor's quote</Text>
              <Text style={{ fontFamily: 'Poppins_400Regular', marginBottom: 8 }}>₦{Number(quote.contractorAmount || quote.signedTotal || 0).toLocaleString('en-NG')}</Text>
              <Text style={{ fontFamily: 'Poppins_400Regular', color: '#374151' }}>
                Monitoring ₦{Number(quote.monitoringFee || 0).toLocaleString('en-NG')} · Coordination ₦{Number(quote.coordinationFee || 0).toLocaleString('en-NG')} · Contingency ₦{Number(quote.contingencyFee || 0).toLocaleString('en-NG')}
              </Text>
              <Text style={{ fontFamily: 'Poppins_600SemiBold', marginTop: 8 }}>
                Total to fund ₦{Number(quote.totalPayable || 0).toLocaleString('en-NG')}
              </Text>
              {quote.quoteFileUrl ? (
                <Pressable onPress={() => Linking.openURL(getBackendAssetUrl(quote.quoteFileUrl))} style={{ marginTop: 12 }}>
                  <Text style={{ fontFamily: 'Poppins_600SemiBold' }}>Open the signed quote</Text>
                </Pressable>
              ) : null}
            </>
          ) : (
            <>
              <Text style={{ fontFamily: 'Poppins_600SemiBold' }}>Materials</Text>
              <Text style={{ fontFamily: 'Poppins_400Regular', marginBottom: 8 }}>{quote.materials}</Text>
              <Text style={{ fontFamily: 'Poppins_600SemiBold' }}>Labour</Text>
              <Text style={{ fontFamily: 'Poppins_400Regular', marginBottom: 8 }}>{quote.labour}</Text>
              <Text style={{ fontFamily: 'Poppins_600SemiBold' }}>Stages</Text>
              <Text style={{ fontFamily: 'Poppins_400Regular' }}>{quote.stages}</Text>
            </>
          )}
          {step?.actor === 'homeowner' ? (
            <View style={{ marginTop: 12 }}>
              <Pressable disabled={busy} onPress={() => act('accept_quote')} style={{ backgroundColor: '#22c55e', borderRadius: 999, paddingVertical: 12, alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Poppins_700Bold' }}>Accept this scope</Text>
              </Pressable>
              {Array.isArray(quote.stages) ? (
                <Pressable
                  disabled={busy}
                  onPress={() => act('revise_quote', { note: 'This is not the quote I signed.' })}
                  style={{ marginTop: 8, borderWidth: 1, borderColor: '#111', borderRadius: 999, paddingVertical: 12, alignItems: 'center' }}
                >
                  <Text style={{ fontFamily: 'Poppins_600SemiBold' }}>This is not the quote I signed</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}
      {project?.status === 'pending_payment' ? (
        <Pressable onPress={() => router.push('/pending-projects' as any)} style={{ marginTop: 16, backgroundColor: '#111', borderRadius: 999, paddingVertical: 14, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontFamily: 'Poppins_700Bold' }}>Fund project</Text>
        </Pressable>
      ) : null}

      <Text style={{ fontFamily: 'Poppins_500Medium', marginTop: 20, lineHeight: 22 }}>{REQUEST_STATUS_COPY.safety}</Text>

      <Pressable
        onPress={() => router.push(`/chat?projectId=${projectId}&contractorId=${contractor?.id || ''}` as any)}
        style={{ marginTop: 16, borderWidth: 1, borderColor: '#111', borderRadius: 999, paddingVertical: 12, alignItems: 'center' }}
      >
        <Text style={{ fontFamily: 'Poppins_600SemiBold' }}>Message contractor</Text>
      </Pressable>
      <Pressable onPress={() => Linking.openURL(REQUEST_STATUS_COPY.whatsappHelp)} style={{ marginTop: 8, paddingVertical: 12, alignItems: 'center' }}>
        <Text style={{ fontFamily: 'Poppins_600SemiBold' }}>WhatsApp help</Text>
      </Pressable>
      {declined ? (
        <Pressable onPress={() => router.push('/property-projects-nigeria' as any)} style={{ marginTop: 8, backgroundColor: '#111', borderRadius: 999, paddingVertical: 12, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontFamily: 'Poppins_600SemiBold' }}>Find another contractor</Text>
        </Pressable>
      ) : null}
      {declined && afterInspection ? (
        <Pressable
          onPress={() => Linking.openURL(`${REQUEST_STATUS_COPY.whatsappHelp}?text=${encodeURIComponent(`I need another contractor for ${project?.design?.name || project?.name}`)}`)}
          style={{ marginTop: 8, paddingVertical: 12, alignItems: 'center' }}
        >
          <Text style={{ fontFamily: 'Poppins_600SemiBold' }}>Get another verified contractor</Text>
        </Pressable>
      ) : null}

      <Pressable onPress={() => setSummaryOpen((open) => !open)} style={{ marginTop: 20 }}>
        <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 18 }}>Project summary</Text>
      </Pressable>
      {summaryOpen ? (
        <View style={{ marginTop: 8 }}>
          {project?.aiAnalysis?.homeownerProjectDescription ? <Text style={{ fontFamily: 'Poppins_400Regular', marginBottom: 8 }}>{project.aiAnalysis.homeownerProjectDescription}</Text> : null}
          {project?.aiAnalysis?.successCriteria ? <Text style={{ fontFamily: 'Poppins_400Regular' }}>{project.aiAnalysis.successCriteria}</Text> : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

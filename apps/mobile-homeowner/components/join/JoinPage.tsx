import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DirectorySiteHeader from '@/components/directory/DirectorySiteHeader';
import {
  effectiveSteps,
  firstIncompleteStep,
  guardHref,
  hasOther,
  isAnswered,
  labeledAnswers,
  nextStep,
  normalizeWhatsApp,
  previousHref,
  progressFor,
  proofsForAnswers,
  regulatorFor,
  stepHref,
  type JoinPathId,
  type JoinStep,
} from '@/lib/join/flow';
import { WHAT_CARDS } from '@/lib/join/catalog';
import { DIAL_CODES } from '@/lib/start-project/flow';
import { JOIN_GREEN, LANDING_BORDER, LANDING_INK, LANDING_MUTED } from '@/lib/join/theme';
import { clearJoinDraft, clearJoinPii, rememberJoinRetry, updateJoinDraft, useJoinDraft } from '@/lib/join/store';
import { joinWhatsAppUrl, messageForJoin, saveJoinRequest, trackJoin } from '@/lib/join/save';

const PATHS = new Set(['repairs', 'cleaning', 'builders', 'professional', 'materials']);

export default function JoinPage() {
  const params = useLocalSearchParams<{ path?: string; step?: string; from?: string }>();
  const router = useRouter();
  const draft = useJoinDraft();
  const pathId = (PATHS.has(String(params.path)) ? params.path : draft.path) as JoinPathId | '';
  const stepId = String(params.step || (pathId ? 'first' : 'what'));
  const fromReview = params.from === 'review';
  const steps = pathId ? effectiveSteps(pathId, draft.answers) : [];
  const current = stepId === 'what' || !pathId
    ? null
    : steps.find((item) => item.id === (stepId === 'first' ? steps[0]?.id : stepId)) || null;

  useEffect(() => {
    if (!pathId || stepId === 'what' || stepId === 'sent') return;
    const redirect = guardHref(pathId, stepId === 'first' ? steps[0]?.id : stepId, draft.answers);
    if (redirect) router.replace(redirect as never);
  }, [pathId, stepId, draft.answers, router, steps]);

  const go = (href: string) => router.push(href as never);

  const choose = (id: string) => {
    if (!pathId || !current) {
      updateJoinDraft({ path: id, answers: {} });
      trackJoin('join_choice', { path: id, step: 'what', value: id });
      go(`/join/${id}`);
      return;
    }
    const nextAnswers = { ...draft.answers, [current.id]: id };
    if (current.id === 'state') nextAnswers.area = '';
    updateJoinDraft({ answers: nextAnswers });
    trackJoin('join_choice', { path: pathId, step: current.id, value: id });
    const following = fromReview ? stepHref(pathId, 'review') : stepHref(pathId, nextStep(pathId, current.id, nextAnswers)?.id);
    go(following);
  };

  if (stepId === 'sent' && pathId) {
    return <Sent pathId={pathId} />;
  }

  if (!current) {
    return (
      <View className="bmh-join-screen" style={{ flex: 1, backgroundColor: '#fff' }}>
        <DirectorySiteHeader />
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <Text accessibilityRole="header" style={title}>Join BuildMyHouse</Text>
          <Text style={helper}>Tell us what you do in a few taps. You don't need any documents to start. A BuildMyHouse agent will reply on WhatsApp.</Text>
          <Text style={question}>What do you do?</Text>
          <Text style={helper}>Pick the one that fits you best. It takes about two minutes.</Text>
          {draft.path ? (
            <View style={card}>
              <Text style={cardTitle}>Carry on where you stopped</Text>
              <Text style={helper}>We saved your answers on this phone.</Text>
              <Pressable accessibilityRole="button" onPress={() => go(stepHref(draft.path as JoinPathId, firstIncompleteStep(draft.path as JoinPathId, draft.answers, draft)?.id))} style={blackButton}>
                <Text style={blackLabel}>Carry on</Text>
              </Pressable>
              <Pressable accessibilityRole="link" onPress={() => { clearJoinDraft(); }} style={{ minHeight: 44, justifyContent: 'center' }}>
                <Text>Start again</Text>
              </Pressable>
            </View>
          ) : null}
          <View style={grid}>
            {WHAT_CARDS.map((item) => (
              <Pressable key={item.id} accessibilityRole="radio" accessibilityLabel={`${item.title}. ${item.description}`} onPress={() => choose(item.id)} style={option}>
                <Text style={cardTitle}>{item.title}</Text>
                <Text style={helper}>{item.description}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  const progress = progressFor(pathId, current.id, draft.answers);
  return (
    <View className="bmh-join-screen" style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ padding: 16, borderBottomWidth: 1, borderColor: LANDING_BORDER }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => go(previousHref(pathId, current.id, draft.answers))} style={{ minHeight: 44, justifyContent: 'center' }}>
          <Text>Back</Text>
        </Pressable>
        <Text style={{ color: LANDING_MUTED }}>{progress.label}{current.optional ? ' · Optional' : ''}</Text>
        <View style={{ height: 4, backgroundColor: '#E5E7EB', marginTop: 8 }}>
          <View style={{ width: `${Math.round(progress.fraction * 100)}%`, height: 4, backgroundColor: JOIN_GREEN }} />
        </View>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <Text accessibilityRole="header" style={question}>{current.question}</Text>
        {current.helper ? <Text style={helper}>{current.helper}</Text> : null}
        {current.kind === 'proof' ? <ProofStep step={current} pathId={pathId} onPick={choose} /> : null}
        {current.kind === 'photos' ? <PhotosStep onPick={choose} /> : null}
        {current.kind === 'contact' ? <ContactStep pathId={pathId} fromReview={fromReview} /> : null}
        {current.kind === 'note' ? <NoteStep pathId={pathId} fromReview={fromReview} /> : null}
        {current.kind === 'area' && draft.answers.state !== 'lagos' ? <TownStep pathId={pathId} fromReview={fromReview} /> : null}
        {(current.kind === 'single' || current.kind === 'multi' || (current.kind === 'area' && draft.answers.state === 'lagos')) && current.options ? (
          <ChoiceStep step={current} pathId={pathId} fromReview={fromReview} onSingle={choose} />
        ) : null}
        {current.kind === 'review' ? <ReviewStep pathId={pathId} /> : null}
        {current.proofKey ? <Text style={helper}>{regulatorFor(pathId, draft.answers)?.full || ''}</Text> : null}
        <Text style={{ display: 'none' }}>{String(proofsForAnswers(pathId, draft.answers).length)}{String(hasOther(draft.answers))}{String(isAnswered(current, draft.answers, draft))}</Text>
      </ScrollView>
    </View>
  );
}

function ChoiceStep({ step, pathId, fromReview, onSingle }: { step: JoinStep; pathId: JoinPathId; fromReview: boolean; onSingle: (id: string) => void }) {
  const draft = useJoinDraft();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const selected = draft.answers[step.id];
  const options = (step.options || []).filter((option) => option.title.toLowerCase().includes(query.trim().toLowerCase()));
  const toggle = (id: string) => {
    const current = Array.isArray(selected) ? selected : [];
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    updateJoinDraft({ answers: { ...draft.answers, [step.id]: next } });
  };
  return (
    <View>
      {step.searchable ? <TextInput accessibilityLabel="Search" value={query} onChangeText={setQuery} placeholder="Search" style={input} /> : null}
      <View style={grid}>
        {options.map((option) => {
          const on = Array.isArray(selected) ? selected.includes(option.id) : selected === option.id;
          return (
            <Pressable key={option.id} accessibilityRole={step.multi ? 'checkbox' : 'radio'} accessibilityState={{ selected: on }} accessibilityLabel={`${option.title}. ${option.description}`} onPress={() => (step.multi ? toggle(option.id) : onSingle(option.id))} style={[optionCard, on && { borderColor: LANDING_INK }]}>
              <Text style={cardTitle}>{option.title}</Text>
              <Text style={helper}>{option.description}</Text>
            </Pressable>
          );
        })}
      </View>
      {step.multi ? (
        <View className="bmh-join-sticky" style={{ padding: 16 }}>
          <Pressable accessibilityRole="button" onPress={() => router.push((fromReview ? stepHref(pathId, 'review') : stepHref(pathId, nextStep(pathId, step.id, draft.answers)?.id)) as never)} style={blackButton}>
            <Text style={blackLabel}>Continue</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function ProofStep({ step, pathId, onPick }: { step: JoinStep; pathId: JoinPathId; onPick: (id: string) => void }) {
  const cards = [
    { id: 'added', title: 'Add it', description: "You'll send a photo of it on WhatsApp." },
    { id: 'not_have', title: "I don't have this", description: 'No problem. You can add it later.' },
  ];
  if (step.allowNotApplicable) cards.push({ id: 'not_applicable', title: "Doesn't apply to my work", description: step.proofKey === 'address' ? "I work from my customers' homes or sites." : 'For example, you work for someone else or on your own.' });
  return (
    <View>
      {cards.map((cardItem) => (
        <Pressable key={cardItem.id} accessibilityRole="radio" onPress={() => { trackJoin('join_proof_answer', { path: pathId, proof: step.proofKey || '', answer: cardItem.id }); onPick(cardItem.id); }} style={[optionCard, { minHeight: 72, marginBottom: 12 }]}>
          <Text style={cardTitle}>{cardItem.title}</Text>
          <Text style={helper}>{cardItem.description}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function PhotosStep({ onPick }: { onPick: (id: string) => void }) {
  return (
    <View>
      <Text style={helper}>Good photos: daylight, the whole job in the frame, before and after if you have it.</Text>
      <Pressable accessibilityRole="radio" onPress={() => onPick('will_send')} style={[optionCard, { minHeight: 72, marginBottom: 12 }]}>
        <Text style={cardTitle}>I'll send photos on WhatsApp</Text>
      </Pressable>
      <Pressable accessibilityRole="radio" onPress={() => onPick('skip')} style={[optionCard, { minHeight: 72 }]}>
        <Text style={cardTitle}>Skip for now</Text>
      </Pressable>
    </View>
  );
}

function ContactStep({ pathId, fromReview }: { pathId: JoinPathId; fromReview: boolean }) {
  const draft = useJoinDraft();
  const router = useRouter();
  const [error, setError] = useState('');
  const submit = () => {
    if (draft.name.trim().length < 2) return setError('Please enter your name (at least 2 letters).');
    const number = normalizeWhatsApp(draft.dialCode, draft.whatsapp);
    if (!draft.whatsapp.trim()) return setError('Enter your WhatsApp number.');
    if (!number) return setError("That number doesn't look right. For Nigeria, try 0803 123 4567 or +234 803 123 4567.");
    updateJoinDraft({ whatsapp: number });
    router.push((fromReview ? stepHref(pathId, 'review') : stepHref(pathId, nextStep(pathId, 'contact', draft.answers)?.id)) as never);
  };
  return (
    <View>
      <Text>Your name (Required)</Text>
      <TextInput accessibilityLabel="Your name" autoComplete="name" value={draft.name} onChangeText={(name) => updateJoinDraft({ name })} placeholder="Ada Okafor" style={input} />
      <Text>WhatsApp number (Required)</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {DIAL_CODES.map((item) => (
          <Pressable key={item.code} onPress={() => updateJoinDraft({ dialCode: item.code })} style={[optionCard, { padding: 8, minHeight: 44 }, draft.dialCode === item.code && { borderColor: '#000' }]}>
            <Text>{item.code} {item.label}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput accessibilityLabel="WhatsApp number" inputMode="tel" autoComplete="tel" value={draft.whatsapp} onChangeText={(whatsapp) => updateJoinDraft({ whatsapp })} placeholder="0803 123 4567" style={input} onSubmitEditing={submit} />
      <Text style={helper}>We only use this to message you about joining BuildMyHouse.</Text>
      {error ? <Text accessibilityLiveRegion="polite" style={{ color: '#991B1B' }}>{error}</Text> : null}
      <Pressable accessibilityRole="button" onPress={submit} style={blackButton}><Text style={blackLabel}>Continue</Text></Pressable>
    </View>
  );
}

function NoteStep({ pathId, fromReview }: { pathId: JoinPathId; fromReview: boolean }) {
  const draft = useJoinDraft();
  const router = useRouter();
  const value = String(draft.answers['trade-other'] || '');
  return (
    <View>
      <Text>One line about what you do (Required)</Text>
      <TextInput accessibilityLabel="One line about what you do" value={value} maxLength={80} onChangeText={(text) => updateJoinDraft({ answers: { ...draft.answers, 'trade-other': text } })} placeholder="Write a few words" style={input} />
      {value.trim().length > 0 && value.trim().length < 3 ? <Text style={{ color: '#991B1B' }}>Please write a few words so we know what you do.</Text> : null}
      <Pressable accessibilityRole="button" onPress={() => router.push((fromReview ? stepHref(pathId, 'review') : stepHref(pathId, nextStep(pathId, 'trade-other', { ...draft.answers, 'trade-other': value })?.id)) as never)} style={blackButton}>
        <Text style={blackLabel}>Continue</Text>
      </Pressable>
    </View>
  );
}

function TownStep({ pathId, fromReview }: { pathId: JoinPathId; fromReview: boolean }) {
  const draft = useJoinDraft();
  const router = useRouter();
  const value = String(draft.answers.area || '');
  return (
    <View>
      <Text>Town or city (Required)</Text>
      <TextInput accessibilityLabel="Town or city" value={value} onChangeText={(area) => updateJoinDraft({ answers: { ...draft.answers, area } })} style={input} />
      <Pressable accessibilityRole="button" onPress={() => router.push((fromReview ? stepHref(pathId, 'review') : stepHref(pathId, nextStep(pathId, 'area', draft.answers)?.id)) as never)} style={blackButton}>
        <Text style={blackLabel}>Continue</Text>
      </Pressable>
    </View>
  );
}

function ReviewStep({ pathId }: { pathId: JoinPathId }) {
  const draft = useJoinDraft();
  const router = useRouter();
  const rows = useMemo(() => labeledAnswers(pathId, draft.answers).labels, [pathId, draft.answers]);
  const send = async () => {
    trackJoin('join_review_view', { path: pathId });
    const popup = typeof window !== 'undefined' ? window.open('', '_blank') : null;
    const saved = await saveJoinRequest({
      pathId,
      answers: draft.answers,
      name: draft.name,
      whatsapp: draft.whatsapp,
      utm: draft.utm,
      referrer: draft.referrer,
    });
    const text = messageForJoin(pathId, draft.answers, draft.name, saved.reference);
    const url = joinWhatsAppUrl(text);
    rememberJoinRetry(url);
    updateJoinDraft({ reference: saved.reference, checklist: saved.checklist, saveFailed: !saved.saved });
    clearJoinPii();
    trackJoin('join_send_whatsapp', { path: pathId, saved: saved.saved });
    if (popup) popup.location.href = url;
    else if (typeof window !== 'undefined') window.open(url, '_blank');
    router.push(stepHref(pathId, 'sent') as never);
  };
  return (
    <View>
      {rows.map((row) => (
        <View key={row.id + row.label} style={[optionCard, { marginBottom: 8 }]}>
          <Text style={helper}>{row.label}</Text>
          <Text style={cardTitle}>{row.value}</Text>
          <Pressable accessibilityRole="link" accessibilityLabel="Change" onPress={() => router.push(`${stepHref(pathId, row.id === 'what' ? undefined : row.id)}?from=review` as never)} style={{ minHeight: 44, justifyContent: 'center' }}>
            <Text>Change</Text>
          </Pressable>
        </View>
      ))}
      <Text style={helper}>By tapping Send, you agree to the BuildMyHouse contractor terms and you confirm what you've told us is true. Joining is free.</Text>
      <Pressable accessibilityRole="button" onPress={() => void send()} style={blackButton}><Text style={blackLabel}>Send to WhatsApp</Text></Pressable>
    </View>
  );
}

function Sent({ pathId }: { pathId: JoinPathId }) {
  const draft = useJoinDraft();
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: '#fff', padding: 20 }}>
      <DirectorySiteHeader />
      <Text accessibilityRole="header" style={title}>You're on the list. Not yet verified.</Text>
      <Text style={helper}>Press send in WhatsApp if it didn't open. A BuildMyHouse agent will reply to say what happens next.</Text>
      <Text style={helper}>Verified is a badge BuildMyHouse gives later, after we've checked things. You don't need it to be on the list.</Text>
      {draft.saveFailed ? <Text style={helper}>We couldn't save this on our side, but your WhatsApp message has everything we need.</Text> : null}
      {draft.reference ? <Text>Reference {draft.reference}</Text> : null}
      <Text style={question}>Complete your profile</Text>
      <Text style={helper}>Adding proof helps homeowners trust you faster.</Text>
      {draft.checklist.map((item) => (
        <Pressable key={item.key} onPress={() => { if (typeof window !== 'undefined') window.open(joinWhatsAppUrl(`Hello BuildMyHouse, I'd like to add: ${item.label}. Ref ${draft.reference || ''}`), '_blank'); }} style={[optionCard, { marginBottom: 8, minHeight: 44 }]}>
          <Text>{item.label}</Text>
        </Pressable>
      ))}
      <Pressable accessibilityRole="button" onPress={() => { clearJoinDraft(); router.replace('/' as never); }} style={[blackButton, { backgroundColor: '#fff', borderWidth: 1 }]}>
        <Text>Back to BuildMyHouse</Text>
      </Pressable>
    </View>
  );
}

const title = { fontFamily: 'Poppins_700Bold', fontSize: 32, color: LANDING_INK, marginBottom: 8 };
const question = { fontFamily: 'Poppins_700Bold', fontSize: 28, color: LANDING_INK, marginTop: 12, marginBottom: 8 };
const helper = { fontFamily: 'Poppins_400Regular', color: LANDING_MUTED, marginBottom: 8, lineHeight: 22 };
const cardTitle = { fontFamily: 'Poppins_600SemiBold', color: LANDING_INK, marginBottom: 4 };
const card = { borderWidth: 1, borderColor: LANDING_BORDER, borderRadius: 16, padding: 16, marginBottom: 16 };
const option = { width: '48%' as const, minHeight: 96, borderWidth: 1, borderColor: LANDING_BORDER, borderRadius: 16, padding: 14, marginBottom: 12 };
const optionCard = { borderWidth: 1, borderColor: LANDING_BORDER, borderRadius: 16, padding: 14, minHeight: 72 };
const grid = { flexDirection: 'row' as const, flexWrap: 'wrap' as const, justifyContent: 'space-between' as const };
const input = { borderWidth: 1, borderColor: LANDING_BORDER, borderRadius: 12, minHeight: 48, paddingHorizontal: 12, marginVertical: 8 };
const blackButton = { backgroundColor: '#000', borderRadius: 999, minHeight: 56, alignItems: 'center' as const, justifyContent: 'center' as const, marginTop: 12 };
const blackLabel = { color: '#fff', fontFamily: 'Poppins_600SemiBold' };

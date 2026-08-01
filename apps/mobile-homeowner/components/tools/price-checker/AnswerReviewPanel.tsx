import { Pressable, Text, View } from 'react-native';
import { UnderstandingRow, LOCATION_QUESTION_ID } from '@/lib/price-checker/state';
import { pc } from './theme';

type Props = {
  rows: UnderstandingRow[];
  onEdit: (questionId: string) => void;
  onGenerate: () => void;
  onContinueEditing: () => void;
  generating?: boolean;
  errorMessage?: string | null;
  cancelNotice?: string | null;
  unknownNotes?: string[];
};

export function AnswerReviewPanel({
  rows,
  onEdit,
  onGenerate,
  onContinueEditing,
  generating,
  errorMessage,
  cancelNotice,
  unknownNotes = [],
}: Props) {
  const unknowns = rows.filter((r) => r.state === 'unknown');
  const notes =
    unknownNotes.length > 0
      ? unknownNotes
      : unknowns.length > 0
        ? ['This search can continue, but prices may be wider where details are marked “Not sure yet”.']
        : [];
  return (
    <View>
      <Text className="mb-2 text-2xl text-white" style={{ fontFamily: 'Poppins_500Medium' }}>
        Check your answers
      </Text>
      <Text className="mb-5 text-sm leading-relaxed text-slate-400" style={{ fontFamily: 'Poppins_400Regular' }}>
        We will use these details to compare matching products. Correct anything that does not look right before
        research begins.
      </Text>

      {cancelNotice ? (
        <View className="mb-4 rounded-xl border px-4 py-3" style={{ borderColor: pc.amber, backgroundColor: 'rgba(180,83,9,0.12)' }}>
          <Text className="text-sm text-amber-100" style={{ fontFamily: 'Poppins_400Regular' }}>
            {cancelNotice}
          </Text>
        </View>
      ) : null}

      {notes.map((note) => (
        <View
          key={note}
          className="mb-3 rounded-xl border px-4 py-3"
          style={{ borderColor: pc.greenBorder, backgroundColor: 'rgba(5,150,105,0.1)' }}
        >
          <Text className="text-sm text-emerald-100" style={{ fontFamily: 'Poppins_400Regular' }}>
            {note}
          </Text>
        </View>
      ))}

      <View className="mb-6 gap-3">
        {rows.map((row) => (
          <View key={row.key} className="flex-row items-center justify-between gap-3 border-b border-white/5 pb-3">
            <View className="flex-1">
              <Text className="text-xs uppercase text-slate-500" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {row.label}
              </Text>
              <Text className="text-sm text-white" style={{ fontFamily: 'Poppins_500Medium' }}>
                {row.value ?? (row.state === 'needed' ? 'Still needed' : '—')}
              </Text>
            </View>
            <Pressable
              onPress={() => onEdit(row.key === LOCATION_QUESTION_ID ? LOCATION_QUESTION_ID : row.key)}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${row.label}`}
              className="min-h-[44px] min-w-[44px] items-center justify-center px-2"
            >
              <Text className="text-sm" style={{ fontFamily: 'Poppins_600SemiBold', color: '#6ee7b7' }}>
                Edit
              </Text>
            </Pressable>
          </View>
        ))}
      </View>

      {errorMessage ? (
        <Text className="mb-3 text-sm text-red-300" style={{ fontFamily: 'Poppins_400Regular' }} accessibilityLiveRegion="polite">
          {errorMessage}
        </Text>
      ) : null}

      <Pressable
        onPress={onGenerate}
        disabled={generating}
        accessibilityRole="button"
        accessibilityLabel="Generate price report"
        className="mb-3 min-h-[48px] items-center justify-center rounded-2xl"
        style={{ backgroundColor: pc.green, opacity: generating ? 0.6 : 1 }}
      >
        <Text className="text-base text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
          {generating ? 'Starting…' : 'Generate price report'}
        </Text>
      </Pressable>
      <Pressable
        onPress={onContinueEditing}
        accessibilityRole="button"
        accessibilityLabel="Continue editing"
        className="min-h-[44px] items-center justify-center"
      >
        <Text className="text-sm text-slate-400" style={{ fontFamily: 'Poppins_500Medium' }}>
          Continue editing
        </Text>
      </Pressable>
    </View>
  );
}

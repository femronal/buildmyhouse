import { useEffect, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import { RESEARCH_STAGES, ResearchStageCode } from '@/lib/price-checker/types';
import { pc, prefersReducedMotion } from './theme';

type QuestionProps = {
  mode: 'questions';
  answered: number;
  total: number;
  compact?: boolean;
};

type ResearchProps = {
  mode: 'research';
  currentStage: ResearchStageCode | null;
  compact?: boolean;
};

type Props = QuestionProps | ResearchProps;

/** Real progress only — completed / current / remaining. No decorative equaliser. */
export function QuestionProgressBars(props: Props) {
  const reduce = prefersReducedMotion();
  const [pulse, setPulse] = useState(0);
  const visible = useRef(true);
  const compact = Boolean(props.compact);

  useEffect(() => {
    if (reduce || Platform.OS !== 'web') return;
    const onVis = () => {
      visible.current = typeof document === 'undefined' || document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', onVis);
    const id = setInterval(() => {
      if (visible.current) setPulse((p) => (p + 1) % 4);
    }, 400);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [reduce]);

  const shell = {
    marginBottom: compact ? 12 : 24,
    flexDirection: 'row' as const,
    alignItems: 'flex-end' as const,
    justifyContent: 'center' as const,
    gap: compact ? 4 : 6,
    alignSelf: 'center' as const,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: compact ? 10 : 16,
    paddingVertical: compact ? 6 : 8,
    backgroundColor: pc.charcoalDeep,
    height: compact ? 34 : 44,
  };

  if (props.mode === 'questions') {
    const bars = Math.max(props.total, 1);
    return (
      <View
        style={shell}
        accessibilityLabel={`Question progress: ${props.answered} of about ${props.total} answered`}
      >
        {Array.from({ length: bars }).map((_, i) => {
          const filled = i < props.answered;
          const current = i === props.answered;
          const height = filled ? (compact ? 20 : 28) : current ? (compact ? 14 : 18) + pulse * 2 : compact ? 8 : 12;
          return (
            <View
              key={i}
              style={{
                width: compact ? 6 : 8,
                height,
                borderRadius: 999,
                backgroundColor: filled ? pc.green : current ? pc.green : 'rgba(255,255,255,0.08)',
                opacity: current && !reduce ? 0.7 + pulse * 0.1 : 1,
              }}
            />
          );
        })}
      </View>
    );
  }

  const stageIndex = props.currentStage
    ? RESEARCH_STAGES.findIndex((s) => s.code === props.currentStage)
    : -1;
  return (
    <View
      style={shell}
      accessibilityLabel={
        props.currentStage
          ? `Research stage: ${RESEARCH_STAGES.find((s) => s.code === props.currentStage)?.label ?? 'in progress'}`
          : 'Research not started'
      }
    >
      {RESEARCH_STAGES.map((stage, i) => {
        const filled = stageIndex >= 0 && i < stageIndex;
        const current = i === stageIndex;
        const height = filled ? (compact ? 18 : 26) : current ? (compact ? 12 : 16) + pulse * 2 : compact ? 7 : 10;
        return (
          <View
            key={stage.code}
            style={{
              width: compact ? 5 : 6,
              height,
              borderRadius: 999,
              backgroundColor: filled || current ? pc.green : 'rgba(255,255,255,0.08)',
            }}
          />
        );
      })}
    </View>
  );
}

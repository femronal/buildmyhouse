import { useEffect, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import { RESEARCH_STAGES, ResearchStageCode } from '@/lib/price-checker/types';
import { pc, prefersReducedMotion } from './theme';

type QuestionProps = {
  mode: 'questions';
  answered: number;
  total: number;
};

type ResearchProps = {
  mode: 'research';
  currentStage: ResearchStageCode | null;
};

type Props = QuestionProps | ResearchProps;

/** Real progress only — completed / current / remaining. No decorative equaliser. */
export function QuestionProgressBars(props: Props) {
  const reduce = prefersReducedMotion();
  const [pulse, setPulse] = useState(0);
  const visible = useRef(true);

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

  if (props.mode === 'questions') {
    const bars = Math.max(props.total, 1);
    return (
      <View
        className="mb-6 flex-row items-end justify-center gap-1.5 self-center rounded-xl border border-white/5 px-4 py-2"
        style={{ backgroundColor: pc.charcoalDeep, height: 44 }}
        accessibilityLabel={`Question progress: ${props.answered} of about ${props.total} answered`}
      >
        {Array.from({ length: bars }).map((_, i) => {
          const filled = i < props.answered;
          const current = i === props.answered;
          const height = filled ? 28 : current ? 18 + pulse * 3 : 12;
          return (
            <View
              key={i}
              style={{
                width: 8,
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
      className="mb-6 flex-row items-end justify-center gap-1 self-center rounded-xl border border-white/5 px-3 py-2"
      style={{ backgroundColor: pc.charcoalDeep, height: 44 }}
      accessibilityLabel={
        props.currentStage
          ? `Research stage: ${RESEARCH_STAGES.find((s) => s.code === props.currentStage)?.label ?? 'in progress'}`
          : 'Research not started'
      }
    >
      {RESEARCH_STAGES.map((stage, i) => {
        const filled = stageIndex >= 0 && i < stageIndex;
        const current = i === stageIndex;
        const height = filled ? 26 : current ? 16 + pulse * 3 : 10;
        return (
          <View
            key={stage.code}
            style={{
              width: 6,
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

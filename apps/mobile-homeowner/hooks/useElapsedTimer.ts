/**
 * Isolated elapsed timer — only this component re-renders every second.
 * Starts when `running` becomes true; pauses when false; resets when
 * `resetKey` changes. Never invents an ETA.
 */
import { useEffect, useRef, useState } from 'react';

export function formatElapsed(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

export function useElapsedTimer(running: boolean, resetKey: string | null, seededSeconds = 0) {
  const [elapsed, setElapsed] = useState(seededSeconds);
  const startedAt = useRef<number | null>(null);
  const accumulated = useRef(seededSeconds);

  useEffect(() => {
    accumulated.current = seededSeconds;
    startedAt.current = running ? Date.now() - seededSeconds * 1000 : null;
    setElapsed(seededSeconds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  useEffect(() => {
    if (!running) {
      if (startedAt.current !== null) {
        accumulated.current = Math.floor((Date.now() - startedAt.current) / 1000);
        startedAt.current = null;
        setElapsed(accumulated.current);
      }
      return;
    }
    if (startedAt.current === null) {
      startedAt.current = Date.now() - accumulated.current * 1000;
    }
    const tick = () => {
      if (startedAt.current === null) return;
      setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [running]);

  return elapsed;
}

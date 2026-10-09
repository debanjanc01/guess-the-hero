import { useEffect, useState } from 'react';

export function viewportMetrics(height, baseline, focused, top = 0, wasOpen = false) {
  return {
    height: Math.max(1, height),
    top: Math.max(0, top),
    keyboardOpen: (focused || wasOpen) && baseline - height > 120,
  };
}

// VisualViewport reflects the actual space above iOS/Android keyboards, including
// Safari's viewport pan. CSS dvh alone does not handle every keyboard resize mode.
export default function useGameViewport(active) {
  const [viewport, setViewport] = useState(() => viewportMetrics(window.innerHeight, window.innerHeight, false));
  useEffect(() => {
    if (!active) return;
    const visual = window.visualViewport;
    let baseline = visual?.height ?? window.innerHeight;
    let frame = 0;
    let keyboardWasOpen = false;
    const measure = () => {
      const height = visual?.height ?? window.innerHeight;
      baseline = Math.max(baseline, height);
      const focused = document.activeElement?.id === 'hero-guess';
      const measured = viewportMetrics(height, baseline, focused, visual?.offsetTop ?? 0, keyboardWasOpen);
      // A Guess/Skip button can take focus before the native keyboard finishes
      // closing. Keep the compact layout until the visible height recovers.
      keyboardWasOpen = measured.keyboardOpen;
      setViewport(measured);
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    measure();
    visual?.addEventListener('resize', schedule);
    visual?.addEventListener('scroll', schedule);
    window.addEventListener('resize', schedule);
    document.addEventListener('focusin', schedule);
    document.addEventListener('focusout', schedule);
    return () => {
      cancelAnimationFrame(frame);
      visual?.removeEventListener('resize', schedule);
      visual?.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('focusin', schedule);
      document.removeEventListener('focusout', schedule);
    };
  }, [active]);
  return viewport;
}

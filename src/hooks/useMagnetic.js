import { useRef, useEffect } from 'react';
import { useSpring, useMotionValue } from 'framer-motion';

export const useMagnetic = (strength = 0.28) => {
  const ref = useRef(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { damping: 18, stiffness: 180, mass: 0.08 });
  const y = useSpring(rawY, { damping: 18, stiffness: 180, mass: 0.08 });

  useEffect(() => {
    const onMove = (e) => {
      if (!ref.current) return;
      const { left, top, width, height } = ref.current.getBoundingClientRect();
      const cx = left + width / 2;
      const cy = top + height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const inRange =
        e.clientX >= left - 60 && e.clientX <= left + width + 60 &&
        e.clientY >= top - 60  && e.clientY <= top + height + 60;

      if (inRange) {
        const clamp = 18;
        rawX.set(Math.max(-clamp, Math.min(clamp, dx * strength)));
        rawY.set(Math.max(-clamp, Math.min(clamp, dy * strength)));
      } else {
        rawX.set(0);
        rawY.set(0);
      }
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, [rawX, rawY, strength]);

  return { ref, x, y };
};

// A tiny spring animator in the style of Apple's fluid interfaces.
// Two designer-friendly parameters: `damping` (1 = no bounce, <1 = bounce) and `response` (seconds).
// It always starts from the current value and velocity, so any animation can be interrupted.

export function animateSpring({ from, to, velocity = 0, damping = 1, response = 0.35, onUpdate, onComplete }) {
  const omega = (2 * Math.PI) / response;
  const k = omega * omega;
  const c = 2 * damping * omega;
  let x = from;
  let v = velocity;
  let last = performance.now();
  let frame = 0;
  let stopped = false;

  function tick(now) {
    if (stopped) return;
    const dt = Math.min(0.064, (now - last) / 1000);
    last = now;
    const steps = Math.max(1, Math.ceil(dt / 0.004));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      const a = -k * (x - to) - c * v;
      v += a * h;
      x += v * h;
    }
    if (Math.abs(v) < 2 && Math.abs(x - to) < 0.5) {
      onUpdate(to, 0);
      onComplete?.();
      return;
    }
    onUpdate(x, v);
    frame = requestAnimationFrame(tick);
  }
  frame = requestAnimationFrame(tick);
  return { stop: () => { stopped = true; cancelAnimationFrame(frame); } };
}

/** Where a flick would come to rest (Apple's projection, deceleration 0.998). velocity in px/s. */
export const project = (velocity, rate = 0.998) => ((velocity / 1000) * rate) / (1 - rate);

/** Soft resistance past an edge: the further you pull, the less it follows. */
export const rubberband = (overshoot, dimension, c = 0.55) =>
  (overshoot * dimension * c) / (dimension + c * Math.abs(overshoot));

export const prefersReducedMotion = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

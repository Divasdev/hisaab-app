// A tiny "data changed" signal. Every write calls notifyChange(); every screen that shows data
// listens and reloads quietly. When the real API is connected, writes keep calling notifyChange().
const bus = new EventTarget();
export const notifyChange = () => bus.dispatchEvent(new Event('change'));
export function onChange(fn) {
  bus.addEventListener('change', fn);
  return () => bus.removeEventListener('change', fn);
}

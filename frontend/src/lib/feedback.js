// A short vibration on meaningful moments only (saved, paid). Android supports it; iOS ignores it.
export function tick(ms = 10) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* not supported */
  }
}

/** Copy text; falls back to a hidden textarea on older browsers. */
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    el.remove();
    return ok;
  }
}

/** Native share sheet on phones; returns false when it isn't available so the caller can copy instead. */
export async function shareOrFalse(data) {
  if (!navigator.share) return false;
  try {
    await navigator.share(data);
    return true;
  } catch (e) {
    return e?.name === 'AbortError';
  }
}

// Joins class names and skips falsy values: cn('a', isOn && 'b') -> 'a b'
export const cn = (...parts) => parts.filter(Boolean).join(' ');

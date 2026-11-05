// Expense categories. The category is guessed from the description so the user rarely has to pick one
// (recognition over recall); they can still change it.
export const CATEGORIES = [
  { id: 'food', label: 'Food', icon: 'food', tone: 'tone-1', words: ['maggi', 'chai', 'tea', 'coffee', 'dinner', 'lunch', 'breakfast', 'swiggy', 'zomato', 'canteen', 'mess', 'pizza', 'biryani', 'samosa', 'snack', 'food', 'restaurant', 'cafe', 'dosa', 'thali', 'shack'] },
  { id: 'groceries', label: 'Groceries', icon: 'basket', tone: 'tone-2', words: ['blinkit', 'zepto', 'bigbasket', 'instamart', 'grocer', 'milk', 'vegetable', 'sabzi', 'fruit', 'atta', 'rice', 'dmart'] },
  { id: 'rent', label: 'Rent', icon: 'home', tone: 'tone-0', words: ['rent', 'deposit', 'pg ', 'lease', 'brokerage'] },
  { id: 'bills', label: 'Bills', icon: 'zap', tone: 'tone-5', words: ['wifi', 'wi-fi', 'internet', 'broadband', 'electric', 'bescom', 'power', 'water', 'gas', 'cylinder', 'recharge', 'bill', 'dth', 'netflix', 'spotify'] },
  { id: 'travel', label: 'Travel', icon: 'car', tone: 'tone-6', words: ['cab', 'uber', 'ola', 'rapido', 'auto', 'fuel', 'petrol', 'diesel', 'train', 'flight', 'bus', 'metro', 'scooter', 'bike', 'toll', 'parking', 'airport', 'irctc'] },
  { id: 'stay', label: 'Stay', icon: 'bed', tone: 'tone-4', words: ['hotel', 'villa', 'stay', 'hostel', 'airbnb', 'homestay', 'resort', 'oyo', 'room booking'] },
  { id: 'household', label: 'Household', icon: 'sparkle', tone: 'tone-3', words: ['maid', 'cook', 'clean', 'laundry', 'detergent', 'supplies', 'bucket', 'repair', 'plumber', 'printer', 'paper', 'stationery'] },
  { id: 'fun', label: 'Fun', icon: 'ticket', tone: 'tone-7', words: ['movie', 'party', 'game', 'drinks', 'club', 'concert', 'pass', 'dandiya', 'bowling', 'trek', 'parasail', 'ticket'] },
  { id: 'other', label: 'Other', icon: 'receipt', tone: 'tone-n', words: [] },
];

export const categoryById = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];

export function guessCategory(description) {
  const text = ` ${description.toLowerCase()} `;
  return CATEGORIES.find((c) => c.words.some((w) => text.includes(w)))?.id || 'other';
}

export const GROUP_KINDS = [
  { id: 'hostel', label: 'Hostel room', icon: 'bed', tone: 'tone-0' },
  { id: 'flat', label: 'Flat', icon: 'building', tone: 'tone-2' },
  { id: 'trip', label: 'Trip', icon: 'plane', tone: 'tone-1' },
  { id: 'other', label: 'Other', icon: 'burst', tone: 'tone-4' },
];
export const kindById = (id) => GROUP_KINDS.find((k) => k.id === id) || GROUP_KINDS[3];

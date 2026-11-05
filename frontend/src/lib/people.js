// People inside one group, by MEMBER id. Your own member shows as "You" / "you".
// group must include my_member_id, members and past_members (see api/queries.js).
export function peopleOf(group) {
  const meId = group?.my_member_id;
  const map = new Map([...(group?.members || []), ...(group?.past_members || [])].map((p) => [p.id, p]));
  const full = (id) => map.get(id)?.name || 'Former member';
  return {
    meId,
    get: (id) => map.get(id) || { id, name: 'Former member', joined: true },
    name: (id, lower = false) => (id === meId ? (lower ? 'you' : 'You') : full(id)),
    first: (id, lower = false) => (id === meId ? (lower ? 'you' : 'You') : full(id).split(' ')[0]),
  };
}

/** "Kabir", "Aman and Riya", "Aman, Riya and 2 more" */
export function listNames(people, max = 2) {
  const names = people.map((p) => p.name.split(' ')[0]);
  if (names.length <= 1) return names[0] || '';
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  if (names.length <= max + 1) return `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
  return `${names.slice(0, max).join(', ')} and ${names.length - max} more`;
}

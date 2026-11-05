import { gql } from '../../api';
import { GROUP_ACTIVITY } from '../../api/queries';
import { useApi } from '../../hooks/useApi';
import { ActivityItem } from '../../components/ActivityItem';
import { ListSkeleton } from '../../components/ui/Skeleton';

export function ActivityTab({ groupId, meId }) {
  // Asked for only when this tab is opened.
  const activity = useApi(() => gql(GROUP_ACTIVITY, { id: Number(groupId) }), [groupId]);
  // The tab line above is the first rule, so the list draws only the rules between and under its rows.
  if (!activity.data) return <ListSkeleton rows={6} className="-mt-px" />;
  return (
    <ul className="divide-y divide-line border-b border-line">
      {activity.data.group.activity.map((a) => (
        <ActivityItem key={a.id} item={a} meId={meId} />
      ))}
    </ul>
  );
}

import { gql } from '../../api';
import { GROUP_ACTIVITY } from '../../api/queries';
import { useApi } from '../../hooks/useApi';
import { ActivityItem } from '../../components/ActivityItem';
import { List } from '../../components/ui/Card';
import { ListSkeleton } from '../../components/ui/Skeleton';

export function ActivityTab({ groupId, meId }) {
  // Asked for only when this tab is opened.
  const activity = useApi(() => gql(GROUP_ACTIVITY, { id: Number(groupId) }), [groupId]);
  if (!activity.data) return <ListSkeleton rows={6} className="mt-4" />;
  return (
    <List className="mt-4">
      {activity.data.group.activity.map((a) => (
        <ActivityItem key={a.id} item={a} meId={meId} />
      ))}
    </List>
  );
}

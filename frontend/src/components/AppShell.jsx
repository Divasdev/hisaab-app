import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { gql } from '../api';
import { SIDEBAR_GROUPS } from '../api/queries';
import { useApi } from '../hooks/useApi';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/cn';
import { Icon } from './Icon';
import { Avatar } from './ui/Avatar';
import { Button } from './ui/Button';
import { Wordmark } from './ui/Brand';
import { BalanceInline } from './ui/Money';
import { Skeleton } from './ui/Skeleton';

/** Logged-in layout. Phones: one column. Laptops (lg): groups sidebar on the left, screen on the right. */
export function AppShell() {
  const { pathname } = useLocation();
  // The sidebar only exists on laptops, so phones don't load data they never show.
  const wide = useMediaQuery('(min-width: 1024px)');
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <div className="lg:grid lg:grid-cols-[300px_minmax(0,1fr)]">
      <a
        href="#main"
        className="sr-only z-70 rounded-lg bg-accent px-4 py-2 font-semibold text-accent-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      {wide && <Sidebar />}
      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  );
}

const navItem = ({ isActive }) =>
  cn('flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-[16px] hover:bg-sunken', isActive ? 'font-semibold text-ink' : 'text-ink-2 hover:text-ink');

/** Laptop only: the groups down the left, like an index on the first page of a notebook. */
function Sidebar() {
  const { user } = useAuth();
  const groups = useApi(() => gql(SIDEBAR_GROUPS), []);
  return (
    <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface-2 lg:flex">
      <div className="px-6 pt-6 pb-6">
        <Link to="/" className="inline-flex rounded-md pt-1">
          <Wordmark className="text-[26px]" />
        </Link>
      </div>
      <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 pb-4">
        <NavLink to="/" end className={navItem}>
          <span className="pt-0.5">Overview</span>
        </NavLink>
        <div className="flex items-center justify-between px-3 pt-7 pb-2">
          <span className="pt-0.5 text-[14px] font-semibold text-ink-2">Groups</span>
          <Button variant="secondary" size="sm" to="/groups/new" icon={<Icon name="plus" size={14} />} className="-mr-1 h-9 px-3 text-[14px]">
            New group
          </Button>
        </div>
        <ul className="space-y-0.5">
          {!groups.data &&
            [0, 1, 2].map((i) => (
              <li key={i} className="flex items-center gap-3 px-3 py-3">
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-3 w-14" />
              </li>
            ))}
          {groups.data?.groups.map((g) => {
            const spent = g.total_spent_paise > 0;
            const settled = !g.my_balance_paise && spent;
            return (
              <li key={g.id}>
                <NavLink to={`/groups/${g.id}`} className={navItem}>
                  <span className={cn('min-w-0 flex-1 truncate pt-0.5', settled && 'struck')}>{g.name}</span>
                  {(g.my_balance_paise || spent) && <BalanceInline paise={g.my_balance_paise} className="pt-0.5" />}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-line p-3">
        <NavLink to="/account" className={navItem}>
          <Avatar user={user} size="sm" me />
          <span className="min-w-0 flex-1 pt-0.5">
            <span className="block truncate text-[15px] leading-5 font-semibold text-ink">{user?.name}</span>
            <span className="block truncate text-[13px] leading-5 font-normal text-ink-2">Account and settings</span>
          </span>
        </NavLink>
      </div>
    </aside>
  );
}

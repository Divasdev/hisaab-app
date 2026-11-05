import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { gql } from '../api';
import { SIDEBAR_GROUPS } from '../api/queries';
import { useApi } from '../hooks/useApi';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/cn';
import { kindById } from '../lib/categories';
import { Icon } from './Icon';
import { Avatar } from './ui/Avatar';
import { Wordmark } from './ui/Brand';
import { BalanceInline } from './ui/Money';
import { Skeleton } from './ui/Skeleton';
import { Tile } from './ui/Tile';

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
        className="sr-only z-70 rounded-xl bg-accent px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
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
  cn(
    'flex items-center gap-3 rounded-xl px-2.5 py-2 text-[15px] transition-[background-color,color,box-shadow] duration-150',
    isActive ? 'bg-surface font-semibold text-ink shadow-lift ring-1 ring-line' : 'text-ink-2 hover:bg-sunken hover:text-ink',
  );

function Sidebar() {
  const { user } = useAuth();
  const groups = useApi(() => gql(SIDEBAR_GROUPS), []);
  return (
    <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface-2/70 lg:flex">
      <div className="px-5 pt-5 pb-5">
        <Link to="/" className="inline-flex rounded-xl">
          <Wordmark />
        </Link>
      </div>
      <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 pb-4">
        <NavLink to="/" end className={navItem}>
          <span className="grid size-8 place-items-center rounded-[10px] bg-sunken text-ink-2">
            <Icon name="wallet" size={17} />
          </span>
          Overview
        </NavLink>
        <div className="flex items-center justify-between px-2.5 pt-6 pb-2">
          <span className="text-[13px] font-semibold text-ink-3">Groups</span>
          <Link to="/groups/new" aria-label="New group" title="New group" className="grid size-7 place-items-center rounded-lg text-ink-2 hover:bg-sunken hover:text-ink">
            <Icon name="plus" size={17} />
          </Link>
        </div>
        <ul className="space-y-0.5">
          {!groups.data &&
            [0, 1, 2].map((i) => (
              <li key={i} className="flex items-center gap-3 px-2.5 py-2">
                <Skeleton className="size-8 rounded-[10px]" />
                <Skeleton className="h-3.5 flex-1" />
              </li>
            ))}
          {groups.data?.groups.map((g) => {
            const kind = kindById(g.kind);
            return (
              <li key={g.id}>
                <NavLink to={`/groups/${g.id}`} className={navItem}>
                  <Tile icon={kind.icon} tone={kind.tone} size="xs" className="size-8 rounded-[10px]" />
                  <span className="min-w-0 flex-1 truncate">{g.name}</span>
                  <BalanceInline paise={g.my_balance_paise} />
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-line p-3">
        <NavLink to="/account" className={navItem}>
          <Avatar user={user} size="sm" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-semibold text-ink">{user?.name}</span>
            <span className="block truncate text-[12.5px] font-normal text-ink-3">Account and settings</span>
          </span>
        </NavLink>
      </div>
    </aside>
  );
}

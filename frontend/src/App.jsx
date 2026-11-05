import { Navigate, Route, Routes } from 'react-router';
import { Analytics } from '@vercel/analytics/react';
import { GuestOnly, RequireAuth } from './context/AuthContext';
import { AppShell } from './components/AppShell';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import WelcomePage from './pages/WelcomePage';
import HomePage from './pages/HomePage';
import NewGroupPage from './pages/NewGroupPage';
import GroupPage from './pages/group/GroupPage';
import ExpenseFormPage from './pages/ExpenseFormPage';
import ExpenseDetailPage from './pages/ExpenseDetailPage';
import SettleUpPage from './pages/SettleUpPage';
import MembersPage from './pages/MembersPage';
import JoinPage from './pages/JoinPage';
import AccountPage from './pages/AccountPage';
import DesignPage from './pages/DesignPage';
import NotFoundPage from './pages/NotFoundPage';

// Frontend URLs never start with /api, so they can't clash with the backend later.
export default function App() {
  return (
    <>
      <Routes>
        <Route element={<GuestOnly />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/join/:token" element={<JoinPage />} />
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path="/groups" element={<Navigate to="/" replace />} />
            <Route path="/groups/new" element={<NewGroupPage />} />
            <Route path="/groups/:groupId" element={<GroupPage />} />
            <Route path="/groups/:groupId/add" element={<ExpenseFormPage />} />
            <Route path="/groups/:groupId/expenses/:expenseId" element={<ExpenseDetailPage />} />
            <Route path="/groups/:groupId/expenses/:expenseId/edit" element={<ExpenseFormPage />} />
            <Route path="/groups/:groupId/settle" element={<SettleUpPage />} />
            <Route path="/groups/:groupId/members" element={<MembersPage />} />
            <Route path="/account" element={<AccountPage />} />
          </Route>
        </Route>

        <Route path="/design" element={<DesignPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Analytics />
    </>
  );
}

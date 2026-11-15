import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import { DocumentTitle } from '../components/layout/DocumentTitle.tsx';
import { AuthGuard } from '../features/auth/components/AuthGuard.tsx';
import { PublicGuard } from '../features/auth/components/PublicGuard.tsx';
import { LoginPage } from '../features/auth/pages/LoginPage.tsx';

// Every page except login loads on demand, so the first paint ships less JS (calendar pulls framer-motion, presence pulls socket.io).
const CalendarPage = lazy(() => import('../features/calendar/pages/CalendarPage.tsx').then(m => ({ default: m.CalendarPage })));
const PresenceProvider = lazy(() => import('../features/chat/context/presence.tsx').then(m => ({ default: m.PresenceProvider })));
const RegisterPage = lazy(() => import('../features/auth/pages/RegisterPage.tsx').then(m => ({ default: m.RegisterPage })));
const OnboardingPage = lazy(() => import('../features/auth/pages/OnboardingPage.tsx').then(m => ({ default: m.OnboardingPage })));
const LegalPage = lazy(() => import('../features/legal/pages/LegalPage.tsx').then(m => ({ default: m.LegalPage })));
const FriendsPage = lazy(() => import('../features/friends/pages/FriendsPage.tsx').then(m => ({ default: m.FriendsPage })));
const SettingsPage = lazy(() => import('../features/profile/pages/SettingsPage.tsx').then(m => ({ default: m.SettingsPage })));
const ProfilePage = lazy(() => import('../features/profile/pages/ProfilePage.tsx').then(m => ({ default: m.ProfilePage })));
const NewMeetupPage = lazy(() => import('../features/meetup/pages/NewMeetupPage.tsx').then(m => ({ default: m.NewMeetupPage })));
const ProposeMeetupPage = lazy(() => import('../features/meetup/pages/ProposeMeetupPage.tsx').then(m => ({ default: m.ProposeMeetupPage })));
const SavedDraftsPage = lazy(() => import('../features/meetup/pages/SavedDraftsPage.tsx').then(m => ({ default: m.SavedDraftsPage })));
const PricingPage = lazy(() => import('../features/pricing/pages/PricingPage.tsx').then(m => ({ default: m.PricingPage })));
const DiaryPage = lazy(() => import('../features/diary/pages/DiaryPage.tsx').then(m => ({ default: m.DiaryPage })));
const MemoryPage = lazy(() => import('../features/memory/pages/MemoryPage.tsx').then(m => ({ default: m.MemoryPage })));
const ChatPage = lazy(() => import('../features/chat/pages/ChatPage.tsx').then(m => ({ default: m.ChatPage })));
const AnalyticsPage = lazy(() => import('../features/analytics/pages/AnalyticsPage.tsx'));
const ActivityPage = lazy(() => import('../features/activity/pages/ActivityPage.tsx'));
const AdminLayout = lazy(() => import('../features/admin/pages/AdminLayout.tsx').then(m => ({ default: m.AdminLayout })));
const AdminDashboard = lazy(() => import('../features/admin/pages/AdminDashboard.tsx').then(m => ({ default: m.AdminDashboard })));
const AdminUsers = lazy(() => import('../features/admin/pages/AdminUsers.tsx').then(m => ({ default: m.AdminUsers })));
const AdminAdmins = lazy(() => import('../features/admin/pages/AdminAdmins.tsx').then(m => ({ default: m.AdminAdmins })));
const AdminContent = lazy(() => import('../features/admin/pages/AdminContent.tsx').then(m => ({ default: m.AdminContent })));
const AdminReports = lazy(() => import('../features/admin/pages/AdminReports.tsx').then(m => ({ default: m.AdminReports })));
const AdminAnnouncements = lazy(() => import('../features/admin/pages/AdminAnnouncements.tsx').then(m => ({ default: m.AdminAnnouncements })));
const AdminAudit = lazy(() => import('../features/admin/pages/AdminAudit.tsx').then(m => ({ default: m.AdminAudit })));
const AdminSettings = lazy(() => import('../features/admin/pages/AdminSettings.tsx').then(m => ({ default: m.AdminSettings })));
const AdminFeedback = lazy(() => import('../features/admin/pages/AdminFeedback.tsx').then(m => ({ default: m.AdminFeedback })));

// Root layout — animated per-page document title sits above every route.
function RootLayout() {
  return (
    <>
      <DocumentTitle />
      <Suspense fallback={null}>
        <Outlet />
      </Suspense>
    </>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
  // Public — authenticated users bounced away from auth pages
  { path: '/login',        element: <PublicGuard><LoginPage /></PublicGuard> },
  { path: '/register',     element: <PublicGuard><RegisterPage /></PublicGuard> },
  { path: '/onboarding',   element: <OnboardingPage /> },
  { path: '/pricing',      element: <PricingPage /> },
  { path: '/privacy',      element: <LegalPage doc="privacy" /> },
  { path: '/terms',        element: <LegalPage doc="terms" /> },
  { path: '/sso-callback', element: <AuthenticateWithRedirectCallback /> },
  { path: '/',             element: <Navigate to="/login" replace /> },

  // Protected — single AuthGuard wraps all, persists across child route changes
  {
    element: <AuthGuard><PresenceProvider><Outlet /></PresenceProvider></AuthGuard>,
    children: [
      { path: '/friends',            element: <FriendsPage /> },
      { path: '/settings',           element: <SettingsPage /> },
      { path: '/diary',              element: <DiaryPage /> },
      { path: '/memory',             element: <MemoryPage /> },
      { path: '/chat',              element: <ChatPage /> },
      { path: '/communities',       element: <Navigate to="/" replace /> },
      { path: '/communities/:slug', element: <Navigate to="/" replace /> },
      { path: '/analytics',         element: <AnalyticsPage /> },
      { path: '/activity',          element: <ActivityPage /> },
      {
        path: '/admin',
        element: <AdminLayout />,
        children: [
          { index: true,        element: <AdminDashboard /> },
          { path: 'users',      element: <AdminUsers /> },
          { path: 'admins',     element: <AdminAdmins /> },
          { path: 'content',    element: <AdminContent /> },
          { path: 'reports',       element: <AdminReports /> },
          { path: 'announcements', element: <AdminAnnouncements /> },
          { path: 'feedback',      element: <AdminFeedback /> },
          { path: 'audit',         element: <AdminAudit /> },
          { path: 'settings',      element: <AdminSettings /> },
        ],
      },
      { path: '/meetups/new',        element: <NewMeetupPage /> },
      { path: '/meetups/propose',    element: <ProposeMeetupPage /> },
      { path: '/meetups/propose/saved', element: <SavedDraftsPage /> },
      { path: '/:username',          element: <ProfilePage /> },
      { path: '/:username/calendar', element: <CalendarPage /> },
    ],
  },
    ],
  },
]);

import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import { AuthGuard } from '../features/auth/components/AuthGuard.tsx';
import { PublicGuard } from '../features/auth/components/PublicGuard.tsx';
import { LoginPage } from '../features/auth/pages/LoginPage.tsx';
import { RegisterPage } from '../features/auth/pages/RegisterPage.tsx';
import { OnboardingPage } from '../features/auth/pages/OnboardingPage.tsx';
import { CalendarPage } from '../features/calendar/pages/CalendarPage.tsx';
import { FriendsPage } from '../features/friends/pages/FriendsPage.tsx';
import { SettingsPage } from '../features/profile/pages/SettingsPage.tsx';
import { ProfilePage } from '../features/profile/pages/ProfilePage.tsx';
import { NewMeetupPage } from '../features/meetup/pages/NewMeetupPage.tsx';
import { ProposeMeetupPage } from '../features/meetup/pages/ProposeMeetupPage.tsx';
import { SavedDraftsPage } from '../features/meetup/pages/SavedDraftsPage.tsx';
import { PricingPage } from '../features/pricing/pages/PricingPage.tsx';
import { DiaryPage } from '../features/diary/pages/DiaryPage.tsx';
import { MemoryPage } from '../features/memory/pages/MemoryPage.tsx';
import { ChatPage } from '../features/chat/pages/ChatPage.tsx';
import { CommunitiesPage } from '../features/communities/pages/CommunitiesPage.tsx';
import { CommunityPage } from '../features/communities/pages/CommunityPage.tsx';
import AnalyticsPage from '../features/analytics/pages/AnalyticsPage.tsx';
import ActivityPage from '../features/activity/pages/ActivityPage.tsx';

export const router = createBrowserRouter([
  // Public — authenticated users bounced away from auth pages
  { path: '/login',        element: <PublicGuard><LoginPage /></PublicGuard> },
  { path: '/register',     element: <PublicGuard><RegisterPage /></PublicGuard> },
  { path: '/onboarding',   element: <OnboardingPage /> },
  { path: '/pricing',      element: <PricingPage /> },
  { path: '/sso-callback', element: <AuthenticateWithRedirectCallback /> },
  { path: '/',             element: <Navigate to="/login" replace /> },

  // Protected — single AuthGuard wraps all, persists across child route changes
  {
    element: <AuthGuard><Outlet /></AuthGuard>,
    children: [
      { path: '/friends',            element: <FriendsPage /> },
      { path: '/settings',           element: <SettingsPage /> },
      { path: '/diary',              element: <DiaryPage /> },
      { path: '/memory',             element: <MemoryPage /> },
      { path: '/chat',              element: <ChatPage /> },
      { path: '/communities',       element: <CommunitiesPage /> },
      { path: '/communities/:slug', element: <CommunityPage /> },
      { path: '/analytics',         element: <AnalyticsPage /> },
      { path: '/activity',          element: <ActivityPage /> },
      { path: '/meetups/new',        element: <NewMeetupPage /> },
      { path: '/meetups/propose',    element: <ProposeMeetupPage /> },
      { path: '/meetups/saved',      element: <SavedDraftsPage /> },
      { path: '/:username',          element: <ProfilePage /> },
      { path: '/:username/calendar', element: <CalendarPage /> },
    ],
  },
]);

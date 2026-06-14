import { createBrowserRouter } from 'react-router-dom';
import { CalendarPage } from '../features/calendar/pages/CalendarPage.tsx';
import { FriendsPage } from '../features/friends/pages/FriendsPage.tsx';
import { SettingsPage } from '../features/profile/pages/SettingsPage.tsx';
import { NewMeetupPage } from '../features/meetup/pages/NewMeetupPage.tsx';
import { ProposeMeetupPage } from '../features/meetup/pages/ProposeMeetupPage.tsx';
import { SavedDraftsPage } from '../features/meetup/pages/SavedDraftsPage.tsx';

export const router = createBrowserRouter([
  { path: '/',                    element: <CalendarPage /> },
  { path: '/friends',             element: <FriendsPage /> },
  { path: '/settings',            element: <SettingsPage /> },
  { path: '/meetups/new',         element: <NewMeetupPage /> },
  { path: '/meetups/propose',     element: <ProposeMeetupPage /> },
  { path: '/meetups/saved',       element: <SavedDraftsPage /> },
  { path: '/:username/calendar',  element: <CalendarPage /> },
  { path: '/:username',           element: <CalendarPage /> },
]);

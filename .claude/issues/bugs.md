# Friendiary — Bug & Issue Tracker

> **Source:** Client feedback (voice transcript)
> **Date:** June 16, 2026
> **Priority Legend:** 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low

---

## 1. Profile & Settings Sync

### 1.1 🔴 Profile data not synced on Settings page
- **Location:** Settings → Profile section
- **Issue:** Profile image, display name, and username show old dummy/placeholder data instead of the actual logged-in user's info.
- **Expected:** Profile section should pull and display the authenticated user's real avatar, display name, and username.

---

## 2. Friends Section

### 2.1 🔴 Cannot visit friend's profile
- **Location:** Calendar page → Friends section
- **Issue:** Clicking on a friend does NOT redirect to that friend's profile page. User cannot view friend details.
- **Expected:** Clicking a friend should navigate to `/profile/:friendId` (or equivalent) showing their details.

### 2.2 🟠 "Discover More Friends" option is disabled
- **Location:** Friends section → Discover more
- **Issue:** The "Discover More" button/link is disabled and non-functional.
- **Expected:** Should open a discovery/search page to find and add new friends.

### 2.3 🟠 Cannot visit other users' profiles from Friends section
- **Location:** Friends section (general)
- **Issue:** No profile navigation available for any user listed in the friends section.
- **Expected:** Every user card/row should be clickable and navigate to that user's profile.

### 2.4 🔴 Footer logout not working on Friends section
- **Location:** Friends section → Footer → Logout
- **Issue:** Logout option in the footer does not function on the Friends page.
- **Expected:** Logout should work consistently across all pages.

### 2.5 🟠 "Add Friend" option not working
- **Location:** Friends section → Add Friend
- **Issue:** The add friend button/action does nothing.
- **Expected:** Should trigger a friend request flow or add the user directly.

### 2.6 🟡 Removed friends not going to Archive
- **Location:** Friends section → Remove friend
- **Issue:** When a friend is removed from the list, they do NOT appear in "Archived and Past Meetups" section.
- **Expected:** Removed friends should move to an archive/history section for reference.

---

## 3. Invites

### 3.1 🟠 Invite count shows dummy number
- **Location:** Invites section
- **Issue:** Showing a hardcoded dummy number (e.g., "7") instead of the actual count of registered/shared invites.
- **Expected:** Display the real count of invites the user has sent or received.

---

## 4. Pricing / Premium Flow

### 4.1 🔴 Premium CTAs don't redirect anywhere
- **Location:** Various pages → "Start Pro", "Go Premium", star icon buttons
- **Issue:** Clicking any premium/upgrade CTA does nothing — no page redirect, no modal, no action.
- **Expected:** Create a **dummy subscription flow**:
  1. Redirect to a pricing/checkout page
  2. Show plan details
  3. Collect dummy form data: first name, last name, address, debit card number
  4. All data is dummy/test — no real payment processing
  5. On "Subscribe" submit → mark user as subscribed
  6. All premium/subscriber-only features should then unlock and display properly
  7. User should visually see they are now a "Premium" subscriber

---

## 5. Chat Section

### 5.1 🔴 Cannot send messages — unexpected error
- **Location:** Chat section
- **Issue:** When user types a message and clicks send (or taps the send button), an "unexpected error" is displayed. Messages cannot be sent.
- **Expected:** Messages should send successfully with proper error handling and user-friendly error messages if something fails.

### 5.2 🟠 Poor error UX in chat
- **Issue:** Error boundaries and element error states are visually broken — elements overflow or display incorrectly in the browser.
- **Expected:** Provide graceful error states with clear messaging and proper layout containment.

---

## 6. Charts & Analytics

### 6.1 🟡 Charts have excessive left/right padding
- **Location:** Analytics/Stats page → Graphs and charts
- **Issue:** Charts have too much whitespace/padding on left and right sides, making them look small and underutilized.
- **Expected:** Charts should use the full available width. Remove or reduce side padding/margins so data visualizations are clear and readable.

### 6.2 🟡 Same spacing issue on Activity page
- **Location:** Activity page
- **Issue:** Same excessive left/right spacing problem as the analytics charts.
- **Expected:** Full-width utilization with minimal side padding.

---

## 7. Community Page

### 7.1 🟠 Community page not responsive
- **Location:** Community page
- **Issue:** Page layout breaks on different screen sizes. Elements overflow, overlap, or don't adapt.
- **Expected:** Fully responsive layout across mobile, tablet, and desktop. *(Client will attach reference screenshots)*

---

## 8. Notifications

### 8.1 🟠 Notifications not working
- **Location:** Notification system (bell icon / notification page)
- **Issue:** Notifications are not displaying or triggering properly.
- **Expected:** Notifications should appear for relevant events (friend requests, meetup invites, messages, etc.).

---

## 9. Settings — Account Section

### 9.1 🔴 Change Password should be disabled for Google Auth users
- **Location:** Settings → Account → Change Password (Current password, New password, Confirm password)
- **Issue:** The change password form is shown to ALL users, including those who signed in via Google OAuth.
- **Expected:**
  - **Google Auth users:** Hide or disable the change password section. Optionally show a message like "You signed in with Google — password management is handled by your Google account."
  - **Email/Password users:** Show the change password form as normal.

### 9.2 🟡 Hide Two-Factor Authentication (2FA)
- **Location:** Settings → Account → Two-Factor Authentication
- **Action:** **Hide/remove this entire section for now.** The app is in beta phase. This feature will be added later if clients request it.

### 9.3 🟡 Remove "Connected Accounts" section
- **Location:** Settings → Account → Connected Accounts
- **Action:** **Remove this section entirely.**
- **Note:** If a user connected via Google, show a simple indicator (e.g., "Connected via Google") with a disconnect button — but remove the full "Connected Accounts" UI block.

### 9.4 🟠 Add "Delete Account" feature
- **Location:** Settings → Account
- **Requirements:**
  1. Add a **Delete Account** button (styled as destructive/red)
  2. On click → show a form asking **why** the user is deleting their account
     - Provide predefined reasons (radio buttons or dropdown):
       - "I don't find it useful"
       - "I have privacy concerns"
       - "Too many bugs"
       - "I found a better alternative"
       - "Other"
     - If "Other" is selected → show a text input for custom reason
  3. Store the reason in the database (for analytics)
  4. After deletion → show a confirmation message:
     > "Your account has been deleted. If you wish to recover your account, please contact our support team."
  5. Account should be soft-deleted (recoverable via support)

---

## 10. Calendar — Preferences

### 10.1 🔴 Calendar preferences not applying
- **Location:** Settings → Calendar section
- **Issue:** Changing preferences (week start day, default view, time format, etc.) does NOT reflect on the actual Calendar page.
- **Specific settings that don't work:**
  - Week starts on: Monday / Sunday → not applied
  - Default view: Week / Month / Day → not applied
  - Time format: 12-hour / 24-hour → not applied
- **Expected:** All calendar preference changes should immediately (or on next visit) reflect on the Calendar page.

---

## 11. Calendar — UI & Interaction

### 11.1 🟠 Plus button not centered
- **Location:** Calendar page → "+" (add event) button
- **Issue:** The plus icon is not properly centered in its container.
- **Expected:** Visually centered both horizontally and vertically.

### 11.2 🟠 "Free" day marker not visible
- **Location:** Calendar page → Mark day as Busy/Free
- **Issue:** The "Free" button/indicator is not properly visible. Only "Busy" is clear.
- **Expected:** On hover over a day, show a clear background indicator for both **Busy** (e.g., red/orange tint) and **Free** (e.g., green tint) with readable text on every page.

### 11.3 🟡 Meetup button misaligned when event exists
- **Location:** Calendar page → Day with a scheduled meetup
- **Issue:** When a meetup is set on a specific day, the action button shifts/drops to the bottom of the cell incorrectly.
- **Expected:** Button should remain properly positioned within the day cell regardless of content.

### 11.4 🟠 Clicking a meetup should show details
- **Location:** Calendar page → Click on a meetup event
- **Issue:** Clicking on a meetup in the calendar does not show meetup details.
- **Expected:** On click → show meetup details: title, date/time, location, attendees, description (modal or detail panel).

---

## 12. Meetup — Location

### 12.1 🔴 Enable location selection for meetups
- **Location:** Meetup creation/editing → Location tab
- **Issue:** Location tab is non-functional. User cannot select a location.
- **Expected:**
  1. Clicking the Location tab opens the user's current location on a map
  2. User can search for or pin a location on the map
  3. Selected location is saved with the meetup

### 12.2 🔴 Same location feature needed for Proposed Meetups
- **Location:** Proposed Meetup flow → Location
- **Expected:** Same map-based location selection as regular meetups — user can add a map and select/pin a location.

---

## 13. Proposed Meetup

### 13.1 🟠 Dummy profiles showing in proposed meetup
- **Location:** Proposed Meetup → Attendee/friend selection
- **Issue:** Some options show dummy/placeholder profiles that don't represent real users.
- **Expected:** Only show the authenticated user's actual friends list. Remove all dummy/placeholder profile data.

---

## 14. Paper Domain / Card Design

### 14.1 🟡 Card design needs polish
- **Location:** Pages using "paper domain" style cards
- **Issue:** Images within cards are too large. Buttons are oversized. Profile images are too big. Overall card layout looks unprofessional.
- **Expected:**
  - Reduce image sizes to appropriate proportions
  - Scale down buttons to standard sizing
  - Reduce profile image dimensions
  - Make the card layout look clean and professional
  - *(Client will attach reference screenshots)*

---

## Summary — Quick Reference

| #    | Section              | Issue                                      | Priority |
| ---- | -------------------- | ------------------------------------------ | -------- |
| 1.1  | Profile/Settings     | Dummy data instead of real user info       | 🔴       |
| 2.1  | Friends              | Can't visit friend profile                 | 🔴       |
| 2.2  | Friends              | Discover more disabled                     | 🟠       |
| 2.3  | Friends              | Can't visit any user profile               | 🟠       |
| 2.4  | Friends              | Footer logout broken                       | 🔴       |
| 2.5  | Friends              | Add friend not working                     | 🟠       |
| 2.6  | Friends              | Removed friends not archived               | 🟡       |
| 3.1  | Invites              | Dummy invite count                         | 🟠       |
| 4.1  | Pricing              | Premium CTAs dead — build dummy flow       | 🔴       |
| 5.1  | Chat                 | Can't send messages                        | 🔴       |
| 5.2  | Chat                 | Poor error UX                              | 🟠       |
| 6.1  | Charts               | Excessive side padding                     | 🟡       |
| 6.2  | Activity             | Same spacing issue                         | 🟡       |
| 7.1  | Community            | Not responsive                             | 🟠       |
| 8.1  | Notifications        | Not working                                | 🟠       |
| 9.1  | Settings/Account     | Change password visible for Google users   | 🔴       |
| 9.2  | Settings/Account     | Hide 2FA section                           | 🟡       |
| 9.3  | Settings/Account     | Remove connected accounts                  | 🟡       |
| 9.4  | Settings/Account     | Add delete account feature                 | 🟠       |
| 10.1 | Calendar Prefs       | Preferences not applying                   | 🔴       |
| 11.1 | Calendar UI          | Plus button not centered                   | 🟠       |
| 11.2 | Calendar UI          | Free marker not visible                    | 🟠       |
| 11.3 | Calendar UI          | Meetup button misaligned                   | 🟡       |
| 11.4 | Calendar UI          | Meetup click shows no details              | 🟠       |
| 12.1 | Meetup Location      | Location selection disabled                | 🔴       |
| 12.2 | Proposed Meetup      | Location selection needed                  | 🔴       |
| 13.1 | Proposed Meetup      | Dummy profiles showing                     | 🟠       |
| 14.1 | Card Design          | Oversized elements, unprofessional layout  | 🟡       |

---

> **Total Issues:** 28
> **Critical (🔴):** 10 | **High (🟠):** 11 | **Medium (🟡):** 7

---

## Notes for Claude Code

- Start with 🔴 Critical bugs first — these are user-facing blockers.
- The premium/subscription flow (4.1) is dummy only — no real payment integration needed. Use local state or a DB flag.
- Location features (12.1, 12.2) will need a map component (e.g., Leaflet, Google Maps, or Mapbox).
- All dummy/placeholder data throughout the app should be replaced with real user data from the auth context and database.
- Client will provide reference screenshots for community page (7.1) and card design (14.1) issues.
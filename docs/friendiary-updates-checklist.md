# Friendiary Updates — Checklist

Source: "Chin Friendiary website Updates.docx" (received 2026-10-11).
Order: small tasks first, then big ones.

Size: XS = minutes · S = under 2 hours · M = half day to 1 day · L = 2+ days

## Part A — Feature requests

### Small tasks (done first)

- [x] **#4 Friends: green online dot always shows** (XS)
  Dot was hardcoded green. Now uses real presence: green = online, grey = offline.
  File: `Frontend/src/features/friends/components/FriendCard.tsx`
- [x] **#9 Banner size hint always shows** (XS)
  Hint now shows only when there is no cover yet, or when the picked image has an error.
  File: `Frontend/src/features/profile/pages/SettingsPage.tsx`
- [x] **#5 Remove Analytics from navbar, put it in Settings** (S)
  Removed from desktop navbar and mobile "More" menu. Added "Analytics" link in the Settings sidebar. The `/analytics` page still works.
  Files: `Navbar.tsx`, `SettingsSidebar.tsx`
- [x] **#7 Rename "Shoutbox" to "Message Wall"** (S)
  Changed all text users can see (headings, labels, empty states, error messages). Code names and API paths stay the same — users never see them.
  Files: `Shoutbox.tsx`, `FloatingShoutbox.tsx`, `CalendarSidebar.tsx`, `shoutbox.service.ts`
  Question for Chin: the private one-to-one feature is still called "Shoutout". Rename it too?
- [x] **#8 More custom cursor icons** (S)
  Added 6 new: Butterfly 🦋, Rainbow 🌈, Kitty 🐱, Teddy 🧸, Cherry 🍒, Moon 🌙. Total 11.
  Files: `Frontend/src/lib/preferences.ts`, `Frontend/src/index.css`
- [ ] **#10 Stay signed in forever on all devices** (S)
  Auth is Clerk. Change session lifetime in the Clerk dashboard (Sessions settings). Mostly not code.
- [x] **#11 Manage logged-in devices in Settings** (S–M)
  New "Logged-in Devices" card in Settings → Account. Shows device, browser, city, last active. "Sign out" per device + "Sign out all other devices". Uses Clerk sessions.
  Files: `Frontend/src/features/profile/components/ActiveSessions.tsx`, `SettingsPage.tsx`

### Big tasks (need answers from Chin first)

- [x] **#1 Poll — everyone can see who voted for which option** (M)
  Each time slot now shows the avatars + names of people who voted for it. Below the slots: "Not voted yet: ..." list.
  File: `Frontend/src/features/meetup/components/ProposalCard.tsx`
- [x] **#2 Search in Memories** (S)
  Search box on the Memories page. Finds by event name, location, date, or friend name.
  File: `Frontend/src/features/memory/pages/MemoryPage.tsx`
- [ ] **#2b Search in Friends and Home** (M) — not asked yet in round 2.
- [x] **#6 Like, dislike, comment on diary posts** (M–L)
  Bar under each post: 👍 count, 👎 count, comments. A person can like OR dislike, not both. Click again to remove. Comment author or post author can delete a comment. Only people who can see the post can react or comment.
  New API: `POST /posts/:id/react`, `POST /posts/:id/comments`, `DELETE /posts/:id/comments/:commentId`
  Files: `posts.service.ts`, `post.schema.ts`, `PostInteractions.tsx`, `PostCard.tsx`
- [x] **#3a Meetup creator manages who can upload memory photos** (M)
  In the memory album, the creator sees a "Who can add" button: "Everyone in the meetup" or "Only people I pick". Creator can always add. Others see "Not allowed" / "View only". Backend also blocks it.
  New API: `PATCH /memory/:meetupId/uploaders`
  Files: `memory.service.ts`, `meetup.schema.ts`, `MemoryPage.tsx`
- [ ] **#3b Memories on/off at meetup creation + archive / unarchive** (L)
  Not done yet. Ask: what happens when memories are off? Is archive only for the owner, or for everyone?

## Found while working

- [ ] **Change Password form in Settings does nothing.** It only shows "saved" — it never calls Clerk. Users think the password changed, but it did not. Fix with Clerk `user.updatePassword()`.

## Part B — Legal pack (Privacy Policy, Terms, Sign-up consent)

Get it checked by a lawyer before publishing (Singapore PDPA).

- [ ] **Privacy permissions** — make sure strangers and logged-out visitors cannot see profiles, memories, calendars or the Message Wall. (Old spec said `/:username` is public. Must check every endpoint.)
- [ ] **Registration** — unchecked agree box, 13+ age check, links to policies, save which policy version was accepted and when (new User fields).
- [ ] **Account deletion** — confirm it exists in Settings. Decide what happens to photos, messages and backups.
- [ ] **Safety controls** — confirm block / report / unfriend. Fill "[Reporting method]".
- [ ] **Hosting and database** — answer: DB provider, server country, backups.
- [ ] **Chat confidentiality** — answer: who can read stored chats, can admins see them.
- [ ] **Security** — answer: passwords (Clerk), HTTPS, DB access rules.
- [ ] **Cookies and third parties** — list: Clerk, Vercel, email provider, any analytics.
- [ ] **Policy pages** — add Privacy Policy and Terms pages to the site, fill all `[Insert ...]` placeholders.

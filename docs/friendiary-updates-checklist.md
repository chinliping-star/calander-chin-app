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
- [x] **#2b Search in Friends and Home** (M)
  Friends page: "Search your friends by name…" box filters your friend list (by name, username, tag).
  Home (calendar page): "Search events or friends…" box searches all your meetups. Click a result → calendar jumps to that day and opens it.
  Files: `FriendsPage.tsx`, `HomeSearch.tsx`, `CalendarGrid.tsx`
- [x] **#6 Like, dislike, comment on diary posts** (M–L)
  Bar under each post: 👍 count, 👎 count, comments. A person can like OR dislike, not both. Click again to remove. Comment author or post author can delete a comment. Only people who can see the post can react or comment.
  New API: `POST /posts/:id/react`, `POST /posts/:id/comments`, `DELETE /posts/:id/comments/:commentId`
  Files: `posts.service.ts`, `post.schema.ts`, `PostInteractions.tsx`, `PostCard.tsx`
- [x] **#3a Meetup creator manages who can upload memory photos** (M)
  In the memory album, the creator sees a "Who can add" button: "Everyone in the meetup" or "Only people I pick". Creator can always add. Others see "Not allowed" / "View only". Backend also blocks it.
  New API: `PATCH /memory/:meetupId/uploaders`
  Files: `memory.service.ts`, `meetup.schema.ts`, `MemoryPage.tsx`
- [x] **#3b Memory photos setting at meetup creation** (M)
  Chin's answer: "memories off" = album still shows, but only the creator can add photos.
  New Meetup and Propose Meetup forms have "Who can add memory photos?": **Everyone invited** / **Only me**. The creator can change it later in the album ("Who can add").
- [x] **#3c Archive / unarchive memories** (M)
  Chin's answer: archive is personal — it hides the memory only for the person who archived it.
  Archive button on each memory card. "Memories" and "Archived" tabs on the Memories page. Unarchive any time. Nobody can see who else archived a memory (the list is never sent to the app).
  New API: `PATCH /memory/:meetupId/archive`

## Found while working

- [x] **Change Password form in Settings did nothing.** Now really changes the password in Clerk. Needs current password, min 15 characters (same as sign-up). Signs out other devices. Shows Clerk's error if the current password is wrong.
- [x] **Privacy leak: `GET /api/users/:username` gave anyone (no login) the full user record** — email, phone, first/last name, country, clerk_id, admin flag, privacy settings. Now returns only public card fields: username, display name, avatar, banner, bio, theme, interests.

## Part B — Legal pack (Privacy Policy, Terms, Sign-up consent)

Get it checked by a lawyer before publishing (Singapore PDPA).

- [~] **Privacy permissions** — audit done.
  - [x] Fixed: public profile endpoint leaked email/phone (see "Found while working").
  - [x] OK: calendar, memories, Message Wall, chat, friends — all need login.
  - [ ] **Needs decision:** by default, strangers and logged-out visitors CAN see a user's meetups (title, date) on their profile, unless the user turns on "Private account". The policy says calendars are friends-only. Either make friends-only the default, or change the policy text.
  - [ ] **Needs decision:** diary posts set to "Public" are visible to anyone. Policy should say "unless you choose Public".
- [x] **Registration** — sign-up page has the required box (13+ and Terms, with links) and an optional promo box. Both start unchecked. Google and email sign-up are both blocked until the box is ticked. Onboarding asks again if consent is missing (e.g. Google sign-in that skipped sign-up). Backend refuses to create a profile without it and saves `consent` (policy version, promo opt-in, server time) on the user.
  Policy version lives in `Frontend/src/features/legal/consent.ts` — bump it when the policy changes.
- [ ] **Account deletion** — exists in Settings, but it is a **soft delete only**: account is hidden and banned in Clerk, but email, phone, posts, photos and messages stay in the database forever. The policy promises "delete or anonymise". **Needs decision:** e.g. keep 30 days for recovery, then a job wipes personal data and photos.
- [x] **Safety controls** — block, report and unfriend all exist. "[Reporting method]" filled: "the Report button on posts and profiles".
- [x] **Hosting and database** — filled in Privacy Policy section 9: Hostinger (domain), Vercel (website), Railway (server), MongoDB Atlas (database), Cloudinary (photos), Clerk (sign-in), Stripe (payments). Still fill "[database region]" (Atlas → cluster → region).
- [ ] **Chat confidentiality** — answer: who can read stored chats, can admins see them.
- [ ] **Security** — answer: passwords (Clerk), HTTPS, DB access rules.
- [x] **Cookies and third parties** — filled: only Clerk's essential sign-in cookies; no analytics or ad tracking found in the code. No email provider yet (support tickets are saved in the database).
- [~] **Policy pages** — `/privacy` and `/terms` pages added (public, no login). Text is Chin's draft. "Message Board" renamed to "Message Wall". Unfilled `[placeholders]` show in yellow.
  - [ ] **Replace DUMMY values** in `Frontend/src/features/legal/content/policies.ts` with Chin's real details:
    - "Friendiary (owner name to be confirmed)" → owner / business legal name
    - privacy@friendiary.com, support@friendiary.com → real emails (or create these mailboxes in Hostinger)
    - "The Friendiary Owner" → Data Protection Officer name or role
    - "11 October 2026" → real effective date
    - Account deletion paragraph → real timing, once decided
  - [ ] Lawyer review — Chin's side, not ours.

## Part C — Updates of 13/10/2026

Source: Chin's "13/10/2026 updates" doc. Item 8 (Android app) skipped on request.

- [x] **#1 Interests: edit + notes** (S)
  Own profile → Interests tab → "Edit interests". Add/remove (presets or your own, max 30) and write a note per interest (max 300 chars). Visitors see the notes.
  Saved as `users.interest_notes`. Files: `InterestsPanel.tsx`, `profile/interests.ts`
- [x] **#2 Calendar: pick a colour per event** (S)
  Open a meetup on the calendar → "Colour on my calendar" (10 colours + default). Personal: only changes how it looks on *your* calendar.
  New API: `PATCH /meetups/:id/color`. Stored in `meetups.event_colors` (never sent as-is; `GET /meetups` returns `my_color`).
- [x] **#3 Theme effects + adopt from a profile** (M)
  Settings → Appearance → Theme effects: Snowfall, Christmas, Rain, Sunny, Autumn leaves, Fireworks, Fireflies, Thunder, Dragon. Saved as `users.scene_effect`.
  Visiting someone's profile shows *their* effect, plus a "Use this theme" pop-up.
  "Pikachu thunder" is built as **Thunder ⚡** (yellow electric bolts) — Pikachu is a Pokémon trademark, so no Pikachu character/name.
- [x] **#4 Effect sounds** (S)
  Sound on/off + volume under Theme effects. Sounds are generated in the browser (no audio files). Off by default, saved per device.
- [x] **#5 Interactive dragon** (M)
  Dragon peeks out from behind the page, eyes follow the mouse; mouse comes close → it hides and pops up somewhere else.
- [x] **#6 Admin panel** (S — most of it already existed: analytics, users, block/suspend, content, reports, CSV export, audit log)
  Added: **Good user** badge (set in Moderate), Users filter "Good users" / "Premium", coins column, give/take coins, dashboard coin numbers and "Most active users (30 days)".
  New API: `POST /admin/users/:id/coins`, `GET /admin/top-users`
- [x] **#7 Coins** (M)
  Earn: new friend +20 (both people, once per pair), diary post +5, post with a picture +10, memory photo +10. Posts/photos earn max 10 times a day each.
  Spend: 500 coins = 30 days Premium (stacks). Balance chip in the navbar; Settings → Subscription → Coins.
  New API: `GET /coins/me`, `POST /coins/redeem`. Ledger collection `cointransactions`.
  - [ ] **Needs decision:** coin amounts and the 500-coin price are placeholders — Chin to confirm.
  - [ ] **Needs decision:** "earn by sharing" — no share button exists yet to reward. What counts as sharing?
  - Note: while `ALL_FEATURES_FREE` is on, Premium bought with coins changes nothing visible.

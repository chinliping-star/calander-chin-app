# HelloXXX — Social Calendar App

## What This Is

Cute personal social calendar platform. Think Friendster + personal blog + meetup planning. Users get their own shareable calendar page at `/:username`. Friends propose meetups, owner accepts/declines, events appear on both calendars. NOT corporate — cute, colorful, personal.

---

## Tech Stack

### Frontend
| Layer | Tool | Version |
|-------|------|---------|
| Framework | React | 19 |
| Build tool | Vite | 8 |
| Language | TypeScript | 6 |
| Styling | Tailwind CSS | v4 |
| Icons | Lucide React | latest |
| Routing | React Router | v7 |
| Global state | Zustand | latest |
| Server state | TanStack Query | v5 |

### Backend
| Layer | Tool | Notes |
|-------|------|-------|
| Runtime | Node.js | v20+ |
| Framework | Express | REST API |
| Language | TypeScript | shared types possible |
| Database | MongoDB | via Mongoose ODM |
| Auth | JWT + bcrypt | access + refresh tokens |
| File storage | Cloudinary | profile photos, memory photos (V4) |

---

## Project Structure

```
f:\newcalander\
├── Frontend/           # React app (Vite)
│   └── src/
│       ├── features/
│       │   ├── auth/           # login, register, session
│       │   ├── calendar/       # month view, day cells, event display
│       │   ├── meetup/         # propose form, accept/decline, detail popup
│       │   ├── profile/        # banner, display name, public/own view
│       │   ├── friends/        # friend list, requests, search
│       │   └── memory/         # V4: photo upload per meetup, album view
│       ├── components/         # shared UI — Button, Modal, Avatar, Badge, Input
│       ├── hooks/              # useAuth, useCalendar, useFriends
│       ├── lib/
│       │   ├── api.ts          # axios instance with JWT interceptor
│       │   └── utils.ts        # date helpers, cn(), etc
│       ├── router/             # route definitions
│       └── types/              # global TypeScript interfaces
│
└── Backend/            # Express API
    └── src/
        ├── routes/             # authRouter, calendarRouter, meetupRouter, etc
        ├── controllers/        # handler functions per route
        ├── models/             # Mongoose schemas
        ├── middleware/         # auth JWT verify, error handler
        ├── services/           # business logic (meetup accept flow, etc)
        └── lib/
            ├── db.ts           # MongoDB connect
            └── cloudinary.ts   # Cloudinary config
```

Each feature folder follows: `components/`, `hooks/`, `api/`, `types.ts`

---

## Routes (Frontend)

| Path | View |
|------|------|
| `/` | Landing / login |
| `/register` | Create account |
| `/:username` | Public profile + calendar (shareable) |
| `/:username/calendar` | Own calendar (auth required) |
| `/friends` | Friend list + requests |
| `/settings` | Profile, theme, password |
| `/memory` | Memory album (V4, premium) |

## API Endpoints (Backend)

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
DELETE /api/auth/logout

GET    /api/users/:username          # public profile
PATCH  /api/users/me                 # update own profile

GET    /api/calendar/:username       # get month calendar data
PATCH  /api/calendar/day             # mark day available/blocked

POST   /api/meetups                  # propose meetup
GET    /api/meetups                  # own meetup list
PATCH  /api/meetups/:id/accept
PATCH  /api/meetups/:id/decline

GET    /api/friends                  # friend list
POST   /api/friends/request/:userId
PATCH  /api/friends/accept/:userId
DELETE /api/friends/:userId

POST   /api/memory/:meetupId/photo   # V4 premium
GET    /api/memory                   # V4 album
```

---

## MongoDB Collections (Mongoose)

```js
// User
{
  username: String (unique, lowercase),
  email: String (unique),
  password: String (hashed bcrypt),
  display_name: String,
  banner_url: String,
  avatar_url: String,
  theme: String (default: 'pastel-pink'),
  is_premium: Boolean,
  created_at: Date
}

// Friendship
{
  requester_id: ObjectId → User,
  recipient_id: ObjectId → User,
  status: enum ['pending', 'accepted'],
  created_at: Date
}

// CalendarDay
{
  user_id: ObjectId → User,
  date: String (YYYY-MM-DD),
  status: enum ['available', 'blocked'],
  stickers: [String]   // V3
}

// Meetup
{
  proposer_id: ObjectId → User,
  owner_id: ObjectId → User,
  date: String (YYYY-MM-DD),
  time: String,
  title: String,
  description: String,
  participants: [ObjectId → User],
  status: enum ['pending', 'accepted', 'declined'],
  is_private: Boolean,
  memory_photo_url: String,   // V4 premium
  created_at: Date
}
```

---

## Auth Flow

1. Register → bcrypt hash password → store User → return JWT pair
2. Login → verify password → return `accessToken` (15min) + `refreshToken` (7d, httpOnly cookie)
3. Frontend axios interceptor: on 401 → auto-call `/api/auth/refresh` → retry original request
4. Logout → clear httpOnly cookie server-side

---

## Feature Roadmap

### V1 — Core (Build First)
- [ ] Auth (register, login, logout, JWT refresh)
- [ ] Profile page (own + public view)
- [ ] Calendar month view with day states
- [ ] Mark days available/blocked
- [ ] Propose meetup (form popup)
- [ ] Accept / decline meetup
- [ ] Friend system (add, request, accept)
- [ ] Meetup appears on both calendars when accepted

### V2 — Themes
- [ ] Theme picker in settings
- [ ] Customizable calendar colors, fonts
- [ ] Persistent in `user.theme`

### V3 — Stickers
- [ ] Sticker pack (preset SVGs/emojis)
- [ ] Place stickers on calendar days
- [ ] Stored in `CalendarDay.stickers[]`

### V4 — Memory (Premium)
- [ ] Upload 1 photo per past meetup
- [ ] Memory book/album tab on profile
- [ ] Stored in Cloudinary, URL in `Meetup.memory_photo_url`

### V5 — Premium
- [ ] Paywall (subscription or lifetime)
- [ ] Gates V4 memory features

---

## Conventions

- Feature-based folder structure, not layer-based
- No barrel `index.ts` unless feature has 3+ exports
- `cn()` from `lib/utils.ts` for conditional Tailwind classes
- All API calls go through `features/*/api/` files via `lib/api.ts` axios instance — never fetch directly in components
- Server state via TanStack Query (`useQuery`, `useMutation`)
- Global state (auth user, theme) via Zustand
- Backend: controller calls service, service calls model — no DB queries in controllers

---

## Calendar Day State Colors

| State | Color | Behavior |
|-------|-------|----------|
| Available | White / light | Friends can click to propose meetup |
| Blocked | Grey | Not available, no interaction |
| Planned/Accepted | Pink | Meetup confirmed |
| Pending | Purple | Meetup proposed, awaiting decision |

---

## Environment Variables

### Frontend (`Frontend/.env.local`)
```env
VITE_API_URL=http://localhost:3000/api
```

### Backend (`Backend/.env`)
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/helloxxx
JWT_SECRET=
JWT_REFRESH_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLIENT_URL=http://localhost:5173
```

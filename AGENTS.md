# AGENTS.md — Timeboxing Notes

## Project Overview

A **Timeboxing Notes** Progressive Web App — a note-taking app with visual time-blocking. Users create notes, then drag them onto a daily hourly schedule. Built with React 19, TypeScript, Supabase, and Tailwind CSS v4.

**Package manager:** Bun (`bun install`, `bun run dev`)  
**Default branch:** `develop`

---

## Tech Stack

| Layer            | Technology                                  |
| ---------------- | ------------------------------------------- |
| Framework        | React 19                                    |
| Language         | TypeScript 5.9 (strict mode)                |
| Build            | Vite 7.3 (`@vitejs/plugin-react`)           |
| Styling          | Tailwind CSS v4.1 (`@tailwindcss/vite`)     |
| UI primitives    | React Aria Components (accessible)          |
| Routing          | React Router v7 (`react-router-dom`)        |
| Rich text editor | Tiptap 3.19 (`@tiptap/react`, starter-kit)  |
| Drag & drop      | @dnd-kit (core 6.3, sortable 10, modifiers) |
| Backend/Auth     | Supabase (PostgreSQL + Auth + RLS)          |
| State/Data       | TanStack React Query v5                     |
| Validation       | Zod v4                                      |
| PWA              | vite-plugin-pwa + Workbox                   |
| Testing          | Vitest 4 + happy-dom + Testing Library      |
| E2E              | Playwright                                  |
| Linting          | ESLint 9 (flat config)                      |

---

## Scripts

```bash
bun run dev        # Start Vite dev server
bun run build      # tsc -b && vite build
bun run lint       # ESLint
bun run preview    # Preview production build
bun run test       # Vitest (unit tests)
bun run test:ui    # Vitest with UI
```

---

## Folder Structure

```
src/
├── main.tsx                   # Entry — wraps App with providers
├── App.tsx                    # BrowserRouter + route definitions
├── index.css                  # Global styles (Tailwind)
├── App.css
│
├── components/                # Shared/feature components
│   ├── Auth/
│   │   ├── AuthScreen.tsx
│   │   ├── schemas.ts         # Zod validation schemas
│   │   └── __tests__/
│   │       └── AuthPage.test.tsx
│   ├── Dashboard/
│   │   └── Dashboard.tsx
│   ├── Landing/
│   │   └── LandingScreen.tsx
│   ├── NoteDetails/
│   │   ├── NoteDetailsContent.tsx
│   │   └── NoteDetailsScreen.tsx
│   ├── ErrorBoundary.tsx
│   ├── LoadingSkeleton.tsx
│   ├── LogoutButton.tsx
│   ├── NoteEditor.tsx
│   ├── ProtectedRoute.tsx
│   ├── RichTextEditor.tsx     # Tiptap editor component
│   ├── Sidebar.tsx            # Hierarchical date tree nav
│   ├── ThemeToggle.tsx
│   ├── TimeBlockSchedule.tsx  # Hourly grid with drag-drop
│   └── TimeboxCard.tsx
│
├── contexts/
│   ├── AuthContext.tsx         # Supabase auth state (user, loading)
│   └── ThemeContext.tsx        # Dark/light mode + localStorage
│
├── hooks/
│   ├── useNotes.ts            # TanStack Query hooks for notes CRUD
│   └── useTimeboxes.ts        # TanStack Query hooks for timeboxes CRUD
│
├── lib/
│   └── supabase.ts            # Supabase client + TS types (Note, Timebox)
│
├── pages/                     # Route-level page components (thin wrappers)
│   ├── AuthPage.tsx
│   ├── DashboardPage.tsx
│   ├── LandingPage.tsx
│   └── NoteDetailsPage.tsx
│
└── test/
    └── setup.ts               # Vitest setup (jest-dom matchers)

e2e/
└── auth.spec.ts               # Playwright E2E tests
```

---

## Routes

| Path               | Component       | Auth required |
| ------------------ | --------------- | ------------- |
| `/`                | LandingPage     | No            |
| `/auth`            | AuthPage        | No            |
| `/dashboard`       | DashboardPage   | Yes           |
| `/dashboard/:date` | DashboardPage   | Yes           |
| `/notes/:id`       | NoteDetailsPage | Yes           |
| `*`                | NotFoundPage    | No            |

---

## Provider Hierarchy (main.tsx)

```
StrictMode
  └── ErrorBoundary
       └── QueryClientProvider (staleTime: 5min, retry: 3)
            └── AuthProvider (Supabase session)
                 └── ThemeProvider (dark/light)
                      └── App (Router)
```

---

## Database Schema (Supabase / PostgreSQL)

### `notes`

| Column     | Type                   | Notes                         |
| ---------- | ---------------------- | ----------------------------- |
| id         | UUID (PK)              | auto-generated                |
| user_id    | UUID (FK → auth.users) | CASCADE delete                |
| title      | TEXT                   | default ''                    |
| content    | TEXT                   | default '' (HTML from Tiptap) |
| created_at | TIMESTAMPTZ            | auto                          |
| updated_at | TIMESTAMPTZ            | auto (trigger)                |

### `timeboxes`

| Column     | Type                   | Notes          |
| ---------- | ---------------------- | -------------- |
| id         | UUID (PK)              | auto-generated |
| user_id    | UUID (FK → auth.users) | CASCADE delete |
| note_id    | UUID (FK → notes)      | CASCADE delete |
| start_time | TIME                   |                |
| end_time   | TIME                   |                |
| date       | DATE                   |                |
| created_at | TIMESTAMPTZ            | auto           |
| updated_at | TIMESTAMPTZ            | auto (trigger) |

**RLS:** Enabled on both tables. Each user can only CRUD their own rows.  
**Indexes:** user_id, created_at (notes), date, note_id (timeboxes).

---

## TypeScript Types (src/lib/supabase.ts)

```ts
interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface Timebox {
  id: string;
  user_id: string;
  note_id: string;
  start_time: string;
  end_time: string;
  date: string;
}

interface TimeboxWithNote extends Timebox {
  note: Note;
}
```

---

## Path Alias

`@/` → `./src/` (configured in both tsconfig.app.json and vite.config.ts)

---

## Environment Variables

Required in `.env.local`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## Testing

- **Unit tests:** Vitest + happy-dom + @testing-library/react
  - Config in `vite.config.ts` → `test` block
  - Setup file: `src/test/setup.ts` (imports jest-dom matchers)
  - Pattern: `src/**/*.test.{ts,tsx}`
- **E2E tests:** Playwright (`e2e/` folder)
  - Config: `playwright.config.ts`

---

## Key Patterns

1. **Data fetching:** All Supabase queries go through TanStack Query hooks in `src/hooks/`. Mutations invalidate relevant query keys.
2. **Auth:** `useAuth()` hook provides `{ user, loading }`. `ProtectedRoute` redirects to `/auth` if not logged in.
3. **Theme:** `ThemeContext` toggles `dark` class on `<html>` and persists to localStorage.
4. **Rich text:** Tiptap editor in `RichTextEditor.tsx` with starter-kit (bold, italic, lists, headings, code blocks). Content stored as HTML string.
5. **Drag & drop:** `@dnd-kit` in `TimeBlockSchedule.tsx` for dragging notes onto hourly slots.
6. **Auto-save:** Note editor debounces saves to Supabase.
7. **PWA:** Service worker auto-updates, Supabase API cached with NetworkFirst strategy.

---

## Conventions

- Functional components only (no classes)
- Named exports preferred
- Pages are thin wrappers around feature components in `components/`
- Tailwind utility classes for styling (no CSS modules)
- Strict TypeScript — no `any`, no unused locals/params
- Zod for form validation schemas

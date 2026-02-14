# Timeboxing Notes MVP - Setup Guide

## Quick Start

### 1. Setup Environment

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local and add your Supabase credentials:
# - VITE_SUPABASE_URL=your-project-url
# - VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Create Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com) and create a new project
2. In the SQL Editor, run the contents of `supabase-schema.sql`
3. Get your credentials from Project Settings → API

### 3. Install Dependencies

```bash
bun install
# or
npm install
```

### 4. Run Development Server

```bash
bun run dev
# or
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173)

## Features Implemented

### ✅ Core Infrastructure

- React 19 + TypeScript + Vite
- Tailwind CSS v4 with dark/light theme
- React Router v6 with protected routes
- Error boundaries for error handling
- PWA support with offline functionality

### ✅ Authentication

- Email/password authentication via Supabase
- Protected routes with automatic redirects
- Persistent sessions
- Logout functionality

### ✅ Pages

- **Landing Page**: Features, video placeholder, CTA sections
- **Auth Page**: Sign up/login forms with validation
- **Dashboard**: Two-column layout with sidebar navigation and schedule view
- **Note Details**: Rich text editor with auto-save

### ✅ Timeboxing Features

- Hierarchical date navigation (Year → Month → Date)
- Visual hourly schedule (6 AM - 10 PM)
- Drag-and-drop time blocks
- Create notes for any future date
- Quick navigation: Today, Tomorrow, Next Week

### ✅ Rich Text Editing

- Tiptap editor with formatting toolbar
- Bold, italic, strike-through
- Headings (H1, H2, H3)
- Lists (bulleted, numbered)
- Blockquotes and code blocks
- Auto-save with debouncing

### ✅ Theme System

- Dark and light modes
- Automatic system preference detection
- Manual toggle button
- Persistent preference via localStorage

## Project Structure

```
src/
├── components/
│   ├── ErrorBoundary.tsx       # Error handling wrapper
│   ├── LoadingSkeleton.tsx     # Loading UI components
│   ├── LogoutButton.tsx        # Logout functionality
│   ├── ProtectedRoute.tsx      # Auth route guard
│   ├── RichTextEditor.tsx      # Tiptap editor
│   ├── Sidebar.tsx             # Date tree navigation
│   ├── ThemeToggle.tsx         # Dark/light mode toggle
│   ├── TimeBlockSchedule.tsx   # Daily schedule grid
│   └── TimeboxCard.tsx         # Draggable time block
├── contexts/
│   ├── AuthContext.tsx         # Auth state management
│   └── ThemeContext.tsx        # Theme management
├── lib/
│   └── supabase.ts            # Supabase client + types
├── pages/
│   ├── AuthPage.tsx           # Login/signup
│   ├── DashboardPage.tsx      # Main app view
│   ├── LandingPage.tsx        # Marketing page
│   └── NoteDetailsPage.tsx    # Note editor
├── App.tsx                     # Router configuration
├── main.tsx                    # App entry with providers
└── index.css                   # Global styles
```

## Database Schema

### `notes` Table

- `id` (uuid, PK)
- `user_id` (uuid, FK → auth.users)
- `title` (text)
- `content` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### `timeboxes` Table

- `id` (uuid, PK)
- `user_id` (uuid, FK → auth.users)
- `note_id` (uuid, FK → notes)
- `start_time` (time)
- `end_time` (time)
- `date` (date)
- `created_at` (timestamp)
- `updated_at` (timestamp)

Row Level Security (RLS) ensures users can only access their own data.

## Available Commands

```bash
# Development
bun run dev          # Start dev server
bun run build        # Build for production
bun run preview      # Preview production build
bun run lint         # Run ESLint
bun run test         # Run tests
bun run test:ui      # Run tests with UI
```

## Deployment

The app is ready to deploy to any static hosting platform:

1. **Vercel** (Recommended)
   - Connect your GitHub repo
   - Add environment variables
   - Deploy

2. **Netlify**
   - Connect repo
   - Build command: `bun run build`
   - Publish directory: `dist`
   - Add environment variables

3. **Cloudflare Pages**
   - Similar setup to Netlify

### Environment Variables (Production)

Make sure to set these in your hosting platform:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Next Steps

### Potential Enhancements

- Week/month view for schedule
- Resize handles for time blocks
- Note templates
- Tags and categories
- Search functionality
- Export notes (PDF, Markdown)
- Calendar integration
- Notifications/reminders
- Collaborative notes (share with others)
- Mobile app (React Native)
- Payment integration (Stripe/LemonSqueezy)

### Performance Optimizations

- Code splitting with React.lazy()
- Virtual scrolling for large date ranges
- Image optimization
- Lazy load Tiptap extensions

## Troubleshooting

### Build Errors

```bash
# Clear cache and rebuild
rm -rf node_modules dist .parcel-cache
bun install
bun run build
```

### Supabase Connection Issues

- Verify environment variables are set correctly
- Check Supabase project is active
- Ensure database schema is applied
- Check RLS policies are enabled

### PWA Not Installing

- Must be served over HTTPS (or localhost)
- Build production version first
- Check manifest.json is generated
- Verify service worker is registered

## Support

For issues:

1. Check error messages in browser console
2. Review this setup guide
3. Check Supabase logs in dashboard
4. Open an issue on GitHub

## License

MIT

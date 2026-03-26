# Prayer Times — Prayer Tracker

## What This Is

A browser-based Islamic prayer companion that combines accurate daily prayer times with a classroom accountability tool. Students log in, mark their five daily prayers as done (with late detection), and build streaks. Teachers add students by email/username, monitor their class on a daily grid, and drill into any student's record — all without backend changes beyond Firestore.

## Core Value

A student can mark today's prayers done in under 10 seconds, and a teacher can see at a glance which students are falling behind — every day.

## Requirements

### Validated

*(Existing features — already shipped)*

- ✓ Daily prayer times (Fajr, Dhuhr, Asr, Maghrib, Isha) fetched by GPS/coordinates — existing
- ✓ Location detection: auto GPS, city search with autocomplete, manual coordinates — existing
- ✓ Prayer window highlighting: current, next, and passed prayers — existing
- ✓ Quranic quote of the day with reflection toggle — existing
- ✓ User authentication: email/password registration + login via Firebase Auth — existing
- ✓ User account info display (username, email, join date, view count) — existing
- ✓ Responsive design (mobile + desktop) — existing

### Active

*(Building toward these — Milestone 1: Prayer Tracker)*

**Roles**
- [ ] User selects role (Teacher or Student) at registration — stored in Firestore
- [ ] Role determines which UI they see after login

**Student — Prayer Log**
- [ ] Student sees a "My Log" tab alongside "Today's Times"
- [ ] My Log shows today's 5 prayers as checkboxes (Fajr, Dhuhr, Asr, Maghrib, Isha)
- [ ] Checking a prayer records timestamp in Firestore
- [ ] If prayer is marked after its window has passed, it is stored as `late` in Firestore
- [ ] My Log shows student's current prayer streak (consecutive days all 5 prayers completed)

**Teacher — Dashboard**
- [ ] Teacher can add students by email or username
- [ ] Teacher sees a class overview grid: rows = students, columns = 5 prayers for today
  - Each cell: ✓ (on time), ⚠️ (late), ✗ (not done)
- [ ] Teacher can click any student row to see that student's detail view (today's log)
- [ ] Each teacher's student list is private — teachers only see their own students

### Out of Scope

- Teacher sending messages or notes to students — read-only in v1
- Admin role — no central administration needed yet
- Multiple classes/groups per teacher — flat student list per teacher is sufficient for v1
- Custom date range filtering on dashboard — daily view only for v1
- Student history scroll-back — streak shown but no calendar/history view in v1
- Notifications or prayer reminders — out of scope; focus is on logging
- Student seeing other students' data — private logs only

## Context

**Brownfield — extending existing app:**
- Stack: vanilla HTML/CSS/JS, Firebase Auth + Firestore (v10.7 SDK via CDN)
- Firebase config is currently placeholder (`"your-api-key"`) — must be replaced with real config before tracker features work
- Firestore is already initialized via `window.firebaseDb` in `index.html`
- Prayer window timing is already calculated in `highlightCurrentPrayer()` — can be reused for late detection
- No build step, no bundler — all changes are in `index.html`, `script.js`, `styles.css`
- Deployed on GitHub Pages (custom domain via `CNAME`)

**Known issues to address** (from `.planning/codebase/CONCERNS.md`):
- Firebase config placeholder must be filled before any auth/Firestore works
- `loginCount` field is never incremented — may fix opportunistically
- Account modal action buttons (change password, export, delete) have no handlers — out of scope for this milestone

## Constraints

- **Tech Stack**: Vanilla JS only — no React, Vue, or other frameworks. Keep CDN-only approach.
- **Storage**: Firestore only — no additional backend services
- **Compatibility**: Must work in Chrome, Firefox, Safari, Edge (same as existing app)
- **Privacy**: Location data must never be stored — prayer log records only prayer name, timestamp, and on-time/late status

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Role selection at registration (not profile update) | Simplest UX — teacher vs student drives entire app flow | — Pending |
| Late detection based on existing prayer window logic | Reuse `highlightCurrentPrayer()` time calculations | — Pending |
| Teacher adds students by email/username (manual) | Avoids class-code complexity for v1 | — Pending |
| No teacher messaging in v1 | Keeps scope focused; read-only dashboard is enough to validate | — Pending |
| Firestore data model: per-user prayer logs | Each student's log is a Firestore sub-collection under their UID | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-26 after initialization*

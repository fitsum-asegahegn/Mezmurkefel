# ዜማና ስነ ጥበባት ክፍል — Hymnody & Arts Department (PWA)

Offline-first tool for the ዜማና ስነ ጥበባት ክፍል, on the same pattern as the
other three department apps — shaped around what *this* department does:
teaching and tracking hymn/chant study, keeping the instruments and
ceremonial vestments in order, running performances (Christmas program,
art nights, theater, painting exhibitions), and their own ዕቅድ. Its own
visual identity (deep indigo/gold, evoking chant and performance) rather
than reusing the other three themes.

Works fully on-device via IndexedDB, no backend required. Supabase is
**optional** — connect it if several phones need to share one set of
records; skip it and it runs entirely offline/local.

## Deploy
1. Push this folder to a GitHub Pages repo (e.g. `tools/zemana-sinetibebat/`),
   same pattern as the other tools.
2. Open the URL on a phone → "Add to Home Screen" / "Install app".
3. First load must happen **online once** so the service worker can cache
   the app shell and CDN libraries (Excel, PowerPoint, Supabase client).
   After that it works fully offline.

## Optional: connect Supabase (for multiple phones)
1. Create a free project at supabase.com.
2. **SQL Editor** → paste and run `supabase-schema.sql` — creates
   `members`, `attendance`, `inventory`, `programs`, `contributions`,
   `plan_items`, `user_roles`, and `profiles` + RLS (any signed-in
   member can read/write; delete and the report generator are
   admin-only).
3. **Authentication → Providers**: confirm Email is on.
4. **Project Settings → API**: copy the Project URL and anon public key
   into `config.js` before deploying.
5. Everyone who signs up starts as `member`. In the Supabase dashboard,
   edit their `user_roles` row to `admin` if they should be able to
   delete records or run the report generator.
6. Don't want the cloud at all? Leave `config.js` blank — the app boots
   straight to the dashboard, no sign-in screen at all.
7. **When Supabase is connected**, a full-screen sign-in/sign-up screen
   shows before anything else — sign in, or explicitly tap "Skip —
   offline only", before the dashboard appears.

## Modules
- **አባላት (Members)** — roster by section (መዝሙር/ከበሮ/ስዕል/ትወና/ጽሑፍ), phone,
  join date, status, and a robe-eligibility flag (item 14's "ለክብር ልብስ
  ብቁ" standard).
- **ጥናት ክትትል (Attendance)** — pick a date, tick who showed up to hymn
  study, save. This is item 13's explicit "መዝሙር ጥናት ላይ ስም መቆጣጠር." The
  dashboard and this tab both flag any active member with **3+
  consecutive absences**; each flagged member gets a tap-to-call button
  (their own phone, not a parent's — this department's members are
  typically older youth/adults) plus a "ተከታትያለሁ ✓" button to log who
  followed up and why. Clears automatically once the member is marked
  present again; the reason stays in their permanent history either way.
- **ቁሳቁስ (Instruments & Vestments)** — item 6's inventory, seeded
  automatically with the plan's own baseline counts (ገና 30, ከበሮ 2, ልብሰ
  ስብሐት 50), plus condition tracking and a last-washed date (item 5).
- **ፕሮግራሞች (Programs)** — one log for the Christmas program, art
  nights, theater, painting exhibitions, peer-school exchanges, and
  holiday greetings (items 1, 3, 4, 17, 22, 24, 25, 26): type, date,
  description, budget, participant count, notes.
- **መዋጮ (Contributions)** — monthly collection, with a "handed to ንብረት
  ክፍል?" flag (item 19 — this department hands collected money straight
  to Property, rather than banking it themselves).
- **ዕቅድ (Plan)** — all 26 of the department's 2019 ዓ/ም plan items
  (numbers 9 and 16 are missing in the *source document itself* — kept
  as-is rather than renumbered, to stay faithful to the original),
  seeded automatically, using the same Ethiopian-calendar due-date
  engine as the other apps. Import/Export Excel, mark-done history, and
  reset-to-original all work the same way.
  - **🖨 Generate report** (print/PDF) and **📊 Generate PowerPoint** —
    both admin-only when Supabase is connected. Both only count records
    **dated inside the selected 3/6/12-month window**. The PowerPoint
    version builds a bar chart (members/programs/follow-ups needed/
    inventory needing attention) and two doughnut charts (plan status,
    attendance), then a per-plan-item completion table.

## Two attendance types, and a black theme
- **አቴንዳስ now has a type switch**: ጥናት ክትትል (hymn study, item 13) and
  ክፍል ስብሰባ (department meeting, item 18) are now tracked separately —
  same checklist UI, same follow-up mechanism, but kept apart so a
  meeting absence doesn't get mixed into hymn-study stats or vice
  versa. Dashboard, the admin reports, and local reminders all still
  reflect ጥናት ክትትል specifically, matching how they worked before this
  change.
- **New 📋 History section** on the Attendance tab, under the current
  type: every past date, expandable to show exactly who was present and
  who was absent that day — "on which day who was absent and present,"
  as requested. Works for both types.
- **Theme switched to true black** (`#0B0B0D`) with gold/violet/emerald/
  coral accents for text and status colors, replacing the earlier deep
  indigo. The PowerPoint report's color scheme was updated to match.
  Run `supabase-schema.sql` again if you want the type column synced to
  Supabase — safe to re-run, existing attendance rows default to
  `'study'` so nothing already recorded changes meaning.

## A few spelling variants this plan exposed
Real documents use more than one spelling for the same Ethiopian month,
and this plan's "timing" column has its own hyphen-range style. The
date engine (`ethiopian-calendar.js`) now additionally recognizes:
- ነሐሴ written as **ነሀሴ** (ሀ/ሐ letter variant)
- ሚያዝያ written as **ሚያዚያ** or **መያዝያ**
- ranges written as **"መስከረም-ታህሳስ"** (no leading "ከ", unlike "ከመስከረም
  እስከ ነሐሴ")
- "ዓመቱን ሙሉ" (whole year) written as **"አመቱን ሙሉ"** (አ/ዓ letter variant)

These fixes were backported to the other three department apps too,
since they share the same engine — no regressions in any of their
plans (re-verified against all of them).

## Files
Same structure as the other department apps: `index.html`, `config.js`,
`i18n.js`, `ethiopian-calendar.js` (shared engine, now with the fixes
above), `db.js` (shared, unchanged), `plan-seed.js` (this department's
26-item plan + the seeded inventory baseline), `auth.js` (optional
Supabase layer + sign-in gate), `app.js` (all module logic),
`manifest.json` + `sw.js` (bump the `CACHE` version string on every
redeploy), `supabase-schema.sql`, `icon-192.png` / `icon-512.png`.


## Local reminders
Settings → 🔔 Local reminders lets a device opt in to a once-a-day
on-device notification summarizing anything that needs attention
(follow-ups needed, items/inventory needing attention, upcoming
programs/events, plan items coming due) — plus a "Check now" button to
check immediately rather than waiting. This uses the browser's
Notification API directly; it is **not** server push. There's no
backend to wake the app when it's closed, so this only fires while the
app is open on that device (same limitation as the HR app's version of
this feature, and for the same reason: no server, zero-cost static
site).


## Offline-only is a deploy-time choice, not a sign-in bypass
"Skip — offline only" no longer appears on the sign-in screen. Someone
without an account can no longer tap past sign-in to get in — offline
mode has no role restriction (admin-equivalent access, by design, since
there's no shared team to check against when nobody's signed in), so
letting anyone skip would have meant anyone without an account could get
full access. A person who **has** signed up still gets offline access
automatically the next time they open the app without a connection —
their session is remembered on that device, no button needed. True
"nobody needs an account" offline mode is still available, but only as
a deploy-time choice: leave `config.js` blank and the app never shows a
sign-in screen at all.


## Admin-approval sign-up workflow
New sign-ups no longer get in automatically. The flow now:
1. Someone signs up → they land on a **"waiting for admin approval"**
   screen (with a "Check again" button and a sign-out button) instead of
   the app. Behind the scenes their `user_roles` row is created with
   `status = 'pending'`.
2. An admin opens **Settings → 👤 Users**, sees them listed as Pending,
   and taps **✅ Approve as member** or **👑 Approve as admin** (or
   **🚫 Reject**). This sets their role and status in one action.
3. The waiting person taps **🔄 Check again** (or just reopens the app)
   and they're in, with whatever role the admin assigned.

Admins can also revisit anyone later from the same Users list — promote
a member to admin, demote an admin back to member, or revoke an
already-approved person's access entirely.

**This is enforced at the database level, not just in the app's UI** —
the Supabase RLS policies now require `status = 'approved'` to read or
write any of the shared data tables, so a pending or rejected account
can't get in by skipping the screen either (e.g. via direct API calls).

**Run the updated `supabase-schema.sql` again** to pick this up — every
statement is safe to re-run, and existing already-approved accounts
stay approved (the new `status` column defaults to `'approved'` for
rows that already exist; only brand-new sign-ups start `'pending'`).
The very first admin still has to be set from the SQL editor, same as
before — nobody has admin rights yet for the in-app Users screen to
work with until that one bootstrap step:
```sql
update user_roles set role = 'admin', status = 'approved' where user_id = '...';
```
After that, that admin can approve everyone else from inside the app.

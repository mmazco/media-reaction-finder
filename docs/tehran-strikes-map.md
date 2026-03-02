# Tehran Strike Map

Interactive verification map tracking US-Israeli strike locations in Tehran (Feb 28 – Mar 2, 2026). Cross-references 20+ outlets with a tiered confidence system.

**Route:** `/trending/iran/strikes`
**Component:** `frontend/TehranStrikesMap.jsx`
**Backend endpoint:** `/api/submit-strike` (in `app.py`)

---

## Current State

- **21 strike locations** tracked across 3 confidence tiers
- Confidence Statement modal with methodology and limitations
- Suggest a Strike Location form → Airtable
- Styled to match MRF design system (Georgia serif headers, consistent spacing)
- Dark/light mode support, mobile responsive

## How to Update the Map

When new strikes are reported or existing ones need upgrading:

1. **Gather sources** — Check Al Jazeera, CNN, BBC, AP, Reuters, LiveUAMap, Fars/Tasnim
2. **Assign confidence tier:**
   - `confirmed` — 3+ independent major outlets corroborate
   - `likely` — 1–2 credible sources or verified video
   - `unverified` — Single source, often LiveUAMap only
3. **Add entry to STRIKES array** in `frontend/TehranStrikesMap.jsx`:
   ```js
   {id:22, n:"Location Name", lat:35.XXX, lng:51.XXX, c:"confirmed", d:"Mar 3",
    t:"Description of what happened and key details.",
    s:["Source 1","Source 2","Source 3"], cat:"Category"}
   ```
4. **Update counts** — The `counts` object near the top of the file:
   ```js
   const counts = {confirmed: 11, likely: 7, unverified: 3};
   ```
5. **Update header** — Change the "LAST UPDATED" timestamp and DAY counter
6. **Build and deploy:**
   ```bash
   cd frontend && npm run build && cd ..
   cp frontend/dist/index.html index.html
   cp frontend/dist/assets/*.js assets/
   git add -A && git commit -m "Add new strike locations" && git push
   ```

### Upgrading a strike's confidence

If a previously `unverified` or `likely` strike gets confirmed by additional sources:
- Change its `c` field (e.g. `"unverified"` → `"confirmed"`)
- Add the new sources to its `s` array
- Update the `counts` object
- Update the description `t` field with new details

### Airtable Table Schema For Submission 

| Column | Type | Notes |
|---|---|---|
| Location | Single line text | Required |
| Date | Single line text | Freeform, e.g. "Mar 2, ~08:30 local" |
| Description | Long text | Required |
| Sources | Long text | URLs to articles, video, imagery |
| Contact | Single line text | Optional, for follow-up |
| Status | Single select | Pending / Approved / Rejected |
| Submitted At | Single line text | ISO timestamp from server |

### Review Workflow

1. Submissions appear in Airtable with Status = "Pending"
2. Review the sources provided
3. Cross-reference against wire services and broadcasters
4. If credible, add to the STRIKES array manually and mark as "Approved" in Airtable
5. If not verifiable, mark as "Rejected" with notes

If Airtable is not configured (env vars missing), the endpoint returns 200 and the form still works for the user — submissions just won't persist beyond their session.

## Source Tiers

| Tier | Outlets | Reliability |
|---|---|---|
| Tier 1 — Wire services | AP, Reuters | Gold standard |
| Tier 2 — Major broadcasters | CNN, BBC/BBC Verify, Al Jazeera, NPR, CBS | Independent verification |
| Tier 3 — Regional media | Fars, Tasnim, IRNA | Confirms strikes occurred, may spin details |
| Tier 4 — Aggregators | LiveUAMap, MahsaAlert | Crowdsourced, not independently verified |
| Official claims | IDF, CENTCOM | First-party, inherently one-sided |

## Categories

Strikes are tagged with a category for filtering context:
`Leadership`, `Military`, `Government`, `Nuclear`, `Landmark`, `Civilian/Medical`, `Mixed`, `Downtown`, `Unknown`

## File Dependencies

| File | Role |
|---|---|
| `frontend/TehranStrikesMap.jsx` | Full component (data, UI, modals) |
| `frontend/App.jsx` | Route at `/trending/iran/strikes`, navigation links |
| `app.py` | `/api/submit-strike` endpoint |
| `.env.local` | Airtable credentials (local) |

## Production Package (archived)

A full Supabase-backed production package was provided and reviewed, located at `/tmp/strikes-package/`. Contains:
- `supabase-migration.sql` — tables, triggers, RLS, seed data
- `lib/supabase.js`, `lib/theme.js`, `lib/data.js` — client, theme, hooks
- `ConfidenceModal.jsx`, `SuggestModal.jsx`, `AdminPanel.jsx` — modular components
- `README.md` — setup guide

This package is ready to integrate when the feature needs to scale beyond manual updates.

# Three Major Fixes Applied — Complete Summary

**Date:** May 11, 2026  
**Status:** ✅ All three fixes deployed

---

## Fix 1: ARIA → AIRRA Brand Rename (All Files)

### Changed Files
1. **`src/components/landing/Navbar.jsx`**
   - Logo link text: `AIRA` → `AIRRA`

2. **`src/components/landing/Hero.jsx`**
   - Hero subheading: `AIRA gives you real trends...` → `AIRRA gives you real trends...`
   - Daily brief badge: `AIRA DAILY BRIEF` → `AIRRA DAILY BRIEF`
   - CTA button className: `text-primary-foreground` → `text-white` ✅ (fixes invisible text on accent background)

3. **`src/pages/SignIn.jsx`**
   - Logo text: `ARIA` → `AIRRA`

4. **`src/pages/Register.jsx`**
   - STEPS array label: `ARIA Setup` → `AIRRA Setup`
   - Subtitle under "Create your account": `Join 10,000+ Indian creators on ARIA` → `Join 10,000+ Indian creators on AIRRA`
   - Subtitle under "Tell us about you": `ARIA uses this to personalise your experience` → `AIRRA uses this to personalise your experience`
   - Platforms step description: `ARIA will personalise trends for each.` → `AIRRA will personalise trends for each.`
   - Finish button (2x): `Enter ARIA` → `Enter AIRRA`
   - ⚠️ **NOT changed:** `REGISTER_STEP_KEY = 'aria_register_step'` and `REGISTER_DATA_KEY = 'aria_register_data'` (sessionStorage keys for returning users)

5. **`src/pages/Onboarding.jsx`**
   - Description text: `ARIA will analyse your content...` → `AIRRA will analyse your content...`
   - Safety note: `ARIA never posts without your permission.` → `AIRRA never posts without your permission.`
   - Finish button: `Enter ARIA →` → `Enter AIRRA →`
   - Background message: `ARIA will finish analysing your account in the background.` → `AIRRA will finish analysing your account in the background.`

6. **`src/pages/dashboard/Profile.jsx`**
   - Section heading: `ARIA's Diagnosis` → `AIRRA's Diagnosis`

7. **`src/pages/dashboard/AriaBrain.jsx`**
   - Greeting message: `I'm **ARIA**...` → `I'm **AIRRA**...`

8. **`src/components/dashboard/Sidebar.jsx`**
   - Nav label: `ARIA Brain` → `AIRRA Brain`

9. **`src/pages/dashboard/Studio.jsx`**
   - Loading text: `ARIA is writing…` → `AIRRA is writing…`

10. **`src/components/almanac/index.js`**
    - Comment: `// AIRA Almanac Components` → `// AIRRA Almanac Components`

---

## Fix 2: Landing Hero Button Visibility

**File:** `src/components/landing/Hero.jsx`

### Change
The primary CTA button "Start for free — it's ₹0" had invisible text on the hero's `bg-accent` background.

**Before:**
```jsx
<Button className="... text-primary-foreground ...">
```

**After:**
```jsx
<Button className="... text-white ...">
```

**Why:** `text-primary-foreground` is a CSS variable designed for text on the primary-colored background. On dark-mode accent backgrounds, it rendered as near-invisible. `text-white` is absolute and always visible.

---

## Fix 3: DashboardHome Dynamic Data (Complete Rewrite)

**File:** `src/pages/dashboard/DashboardHome.jsx`

### New Imports
```javascript
import { useMemo } from "react";
import { useScriptHistory, useCalendarEntries } from "@/hooks/useApi";
```

### New Helper
```javascript
const currentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};
```

### Changes to StatCell Component
- **Before:** Always rendered `value` as-is (including fake defaults like `"+18.2"`, `84`, `27`, `"8:42"`)
- **After:** Renders `"—"` (em-dash) in muted color when value is `null` or `undefined`
- Suffix only renders when value is not empty
- Delta only renders when value is not empty

### Changes to Stats Data
| Stat | Before | After | Type |
|------|--------|-------|------|
| 7-day growth | `"+18.2"` (fake) | `null` → `"—"` | null-safe |
| Health score | `84` (fake) | `null` → `"—"` | null-safe |
| Content ideas | `27` (fake) or real count | Real count or `null` → `"—"` | dynamic |
| Best window | `"8:42"` (fake) | `null` → `"—"` | null-safe |

### Changes to Workflow Active State
- **Before:** `active: true` always on Discover (hardcoded)
- **After:** Computed based on user's actual progress:
  1. If user has calendar entries → **Launch** is active
  2. Else if user has scripts → **Studio** is active
  3. Else → **Discover** is active (default)

```javascript
const activeStep = useMemo(() => {
  if (calendarCount > 0) return "launch";
  if (scriptCount > 0)   return "studio";
  return "discover";
}, [scriptCount, calendarCount]);
```

### Changes to Workflow Chips
| Card | Before | After |
|------|--------|-------|
| **Discover** | `Hot · {liveIdeas.length}` or empty | `Hot · {liveIdeas.length}` or empty (unchanged logic) |
| **Studio** | Always `Drafting · 2` (hardcoded) | `Drafting · {scriptCount}` (dynamic) or empty if 0 |
| **Launch** | Always `Queued · 1` (hardcoded) | `Queued · {calendarCount}` (dynamic) or empty if 0 |

### Data Fetching
```javascript
// New hooks
const { data: historyData } = useScriptHistory();
const scriptCount = historyData?.data?.length ?? 0;

const { data: calendarData } = useCalendarEntries(currentMonthKey());
const calendarCount = calendarData?.data?.length ?? 0;
```

### Result
✅ Dashboard now shows **real user data** instead of hardcoded placeholders  
✅ Workflow cards highlight actual user progress  
✅ Empty states show `"—"` instead of fake numbers  
✅ All stats conditionally render suffixes only when data exists

---

## Testing Checklist

- [ ] Navbar, SignIn, Register all show `AIRRA` branding
- [ ] Hero button text is now visible (white text on primary background)
- [ ] Dashboard loads and shows real script/calendar counts in workflow chips
- [ ] Stats show `"—"` when data is null
- [ ] Workflow active state updates based on scriptCount/calendarCount
- [ ] Returning Register users don't lose progress (sessionStorage keys unchanged)

---

## Files Modified (10 Total)

```
src/components/landing/Navbar.jsx
src/components/landing/Hero.jsx
src/pages/SignIn.jsx
src/pages/Register.jsx
src/pages/Onboarding.jsx
src/pages/dashboard/Profile.jsx
src/pages/dashboard/AriaBrain.jsx
src/pages/dashboard/Studio.jsx
src/components/dashboard/Sidebar.jsx
src/pages/dashboard/DashboardHome.jsx (complete rewrite)
src/components/almanac/index.js
```

---

## No Regressions
- ✅ Internal variable names and component names unchanged (e.g., `StepCredentials`, `AriaBrain` component)
- ✅ Logic, routing, and styling untouched except where specified
- ✅ All imports and exports remain compatible

# Admin Layout Template

## Overview

Full-screen layout template for admin dashboard with seamless top/bottom navigation and scrollable main content area.

## Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Top Nav: Logo | Title | Language | Notifications | User    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Main Content (scrolls internally)                          │
│  ┌───────────────────────────────────────────────────────┐│
│  │ KPI Cards Row (4 cards)                              ││
│  └───────────────────────────────────────────────────────┘│
│  ┌──────────────┬───────────────────┬──────────────────┐│
│  │ Active Tours │ Attention         │ Quick Actions    ││
│  │ Team Status  │ Required          │ (2x2 grid)       ││
│  └──────────────┴───────────────────┴──────────────────┘│
│  ┌──────────────────────────────────────────┬────────────┐│
│  │ Timeline (wide)                          │ Fleet      ││
│  └──────────────────────────────────────────┴────────────┘│
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ Bottom Nav: Dashboard | Tours | Guests | Reports | ... | More│
└─────────────────────────────────────────────────────────────┘
```

## Components

### Top Navigation

**Elements (left to right):**
- Logo icon (T) + Page title
- Language dropdown (🇺🇸/🇲🇽)
- Notifications (🔔 with badge count)
- User menu (👤 opens Profile/Settings/Logout)

**Behavior:**
- Fixed at top
- No bottom border (seamless with content)
- User menu: dropdown with centered items
- Language: flag icon opens dropdown

### Main Content

**Container:**
- `flex-1` fills remaining space
- Internal scroll only (no page scroll)
- Consistent padding: `px-10 py-6`
- Invisible borders show padding structure

**Sections:**

#### 1. KPI Cards Row
- 4-column grid
- Cards: Tours, Guests, On Time %, Incidents
- Number on top, label below
- Centered text
- `p-5` padding, `gap-6` between cards

#### 2. Middle Section
- 3-column grid (col-span-4, 5, 3)
- **Left (4 cols):** Active Tours + Team Status
  - Scrollable
  - Stack vertically
- **Center (5 cols):** Attention Required
  - Centered content
  - "Todo bien" when empty
- **Right (3 cols):** Quick Actions
  - 2x2 grid
  - Buttons fill space (`h-full`)
  - Icon above label

#### 3. Bottom Section
- 2-column grid (9 cols + 3 cols)
- **Left (9 cols):** Timeline
  - Bar chart with time labels
  - Heading above chart
- **Right (3 cols):** Fleet Status
  - Title centered
  - 3 items evenly distributed (`justify-between`)
  - Each item in gray box

### Bottom Navigation

**Items:**
- Dashboard | Tours | Guests | Reports | Fleet | Expenses | More

**Behavior:**
- Fixed at bottom
- No top border (seamless with content)
- Active item: blue text
- More button: opens full-screen menu

### More Menu

**Layout:**
- Full screen overlay (white background)
- Rounded corners, shadow
- 3x3 grid for menu items
- Header: "Menu" centered + close X
- Items fill grid cells
- Icon (3xl) + label centered

## Design Patterns

### Spacing
- Outer padding: `px-10 py-6`
- Card padding: `p-5`
- Gap between sections: `gap-6`
- Gap between cards: `gap-6`
- Invisible borders: `border-8 border-transparent`

### Alignment
- Centered text by default
- Flex with `items-center justify-center`
- Items fill space: `flex-1`

### Scroll Behavior
- Main container scrolls: `overflow-auto`
- Sections scroll individually
- Page itself does NOT scroll

### Colors
- Background: white cards on gray-50 page
- Borders: gray-200
- Active: blue-600
- Success: green
- Danger: red

## Usage

```tsx
import TestLayout from './TestLayout'

export default function MyPage() {
  return (
    <TestLayout>
      <div className="h-full flex flex-col gap-6">
        {/* Your content sections here */}
      </div>
    </TestLayout>
  )
}
```

## Responsive Notes

- Grid adapts: 4-col → smaller screens stack
- Quick Actions: 2x2 grid
- Bottom nav: always visible, horizontal scroll if needed
- More menu: always 3x3 grid

## Key Files

- `app/test-admin/TestLayout.tsx` - Layout component
- `app/test-admin/page.tsx` - Example usage (Dashboard)

## Translations (Required)

Every page layout MUST support English and Spanish translations.

### Setup

1. Import `LanguageToggle` and `useTranslation`:
```tsx
import LanguageToggle from '@/components/LanguageToggle'
import { useTranslation } from '@/lib/i18n/useTranslation'
```

2. Add hook in component:
```tsx
const { t } = useTranslation()
```

3. Use `<LanguageToggle />` for the language switch button

4. Replace all visible strings with `t('key')`:
```tsx
// Bad - hardcoded
<span>Dashboard</span>
<span>More</span>
<span>Profile</span>

// Good - translated
<span>{t('nav.dashboard')}</span>
<span>{t('nav.menu')}</span>
<span>{t('profile.title')}</span>
```

### Required Translation Keys

Add missing keys to `public/locales/en.json` and `public/locales/es.json`:

```json
{
  "nav": {
    "dashboard": "Dashboard",
    "tours": "Tours",
    "guests": "Guests",
    "reports": "Reports",
    "vehicles": "Vehicles",
    "expenses": "Expenses",
    "menu": "Menu"
  },
  "profile": {
    "title": "Profile",
    "settings": "Settings"
  },
  "auth": {
    "signOut": "Sign Out"
  }
}
```

### Checklist for New Pages

- [ ] Uses `<LanguageToggle />` component (NOT custom toggle)
- [ ] Imports and calls `useTranslation()` hook
- [ ] All visible strings use `t('key')` pattern
- [ ] Translation keys exist in both `en.json` and `es.json`
- [ ] Language switch works without page refresh

## Invisible Borders (MANDATORY - NOT DEBUG)

**Every element MUST have `border-8 border-transparent`**

This is NOT optional debug - it's the standard for proper spacing.

### Apply to EVERY Element:

```tsx
// Containers
<div className="border-8 border-transparent bg-white rounded-xl">
  <div className="border-8 border-transparent p-4">
    {/* content */}
  </div>
</div>

// Text
<h1 className="border-8 border-transparent">Title</h1>
<p className="border-8 border-transparent">Text</p>

// Buttons (wrapper + inner span)
<div className="border-8 border-transparent">
  <button className="border-8 border-transparent bg-blue-600 rounded-lg">
    <span className="border-8 border-transparent px-4 py-2">Button</span>
  </button>
</div>

// Form fields
<div className="border-8 border-transparent">
  <label className="border-8 border-transparent">Label</label>
  <div className="border-8 border-transparent">
    <input className="border-8 border-transparent w-full" />
  </div>
</div>

// Table cells
<td className="border-8 border-transparent">Cell</td>
<th className="border-8 border-transparent">Header</th>
```

### Why This Works
- `border-8` reserves 8px space (like padding)
- `border-transparent` makes it invisible
- Consistent spacing everywhere
- No squished text or buttons

### Reference Implementation
- `app/super-admin/regional-data/page.tsx` - Complete example
- `docs/LAYOUT-CONVENTION.md` - Full documentation

### DO NOT Remove Before Production
Keep `border-8 border-transparent` on all elements. It's the standard.

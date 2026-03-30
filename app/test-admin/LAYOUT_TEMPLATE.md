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

## Invisible Borders (Debug)

Use `border-8 border-transparent` to visualize padding areas:
- Top nav inner area
- Main content container
- Each section/card wrapper
- Remove before production: delete border classes

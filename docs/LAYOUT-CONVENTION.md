# Layout Convention - Invisible Borders Pattern

## Rule
**Every element on every page must have `border-8 border-transparent`**

This creates consistent padding and prevents the "squished cheap app" look.

## How to Apply

### Containers
```tsx
<div className="border-8 border-transparent bg-white rounded-xl">
  <div className="border-8 border-transparent p-4">
    {/* content */}
  </div>
</div>
```

### Text Elements
```tsx
<h1 className="border-8 border-transparent">Title</h1>
<p className="border-8 border-transparent">Text content</p>
```

### Buttons
```tsx
<div className="border-8 border-transparent">
  <button className="border-8 border-transparent bg-blue-600 rounded-lg">
    <span className="border-8 border-transparent px-4 py-2">Button Text</span>
  </button>
</div>
```

### Form Fields
```tsx
<div className="border-8 border-transparent">
  <label className="border-8 border-transparent">Label</label>
  <div className="border-8 border-transparent">
    <input className="border-8 border-transparent w-full" />
  </div>
</div>
```

### Tables
```tsx
<table className="border-8 border-transparent">
  <thead>
    <tr>
      <th className="border-8 border-transparent">Header</th>
    </tr>
  </thead>
  <tbody>
    <tr className="border-8 border-transparent">
      <td className="border-8 border-transparent">Cell</td>
    </tr>
  </tbody>
</table>
```

### Modals
```tsx
<div className="border-8 border-transparent bg-white rounded-xl">
  <div className="border-8 border-transparent p-4 border-b border-gray-100">
    <h2 className="border-8 border-transparent">Modal Title</h2>
  </div>
  <div className="border-8 border-transparent p-4">
    {/* modal content */}
  </div>
</div>
```

## Why This Works
- `border-8` reserves 8px of space (like padding)
- `border-transparent` makes it invisible but keeps the space
- Every element has it, so spacing is consistent
- No more squished text or buttons

## Files Using This Pattern
- `app/super-admin/regional-data/page.tsx` - Reference implementation
- `app/super-admin/layout.tsx` - Navigation layout

## When Creating New Pages
1. Copy the pattern from `regional-data/page.tsx`
2. Apply `border-8 border-transparent` to EVERY element
3. No exceptions

# Design System Implementation Guide

## Overview
This guide helps developers maintain consistency with the new professional amber-themed design system.

## Color System

### Primary Colors
```css
/* Amber Theme */
--primary: 38 92% 50%;           /* #F59E0B - Main brand color */
--primary-foreground: 0 0% 100%; /* White text on primary */

/* Usage */
bg-amber-600  /* Primary buttons, active states */
bg-amber-50   /* Light backgrounds, hover states */
text-amber-600 /* Primary text, icons */
```

### Status Colors
```css
/* Success */
bg-green-100 text-green-700  /* Present, approved */

/* Warning */
bg-amber-100 text-amber-700  /* Late, pending */

/* Danger */
bg-red-100 text-red-700      /* Absent, rejected */

/* Neutral */
bg-gray-100 text-gray-700    /* Awaiting, neutral */
```

### Neutral Colors
```css
bg-gray-50    /* Page background */
bg-white      /* Cards, surfaces */
bg-gray-100   /* Hover states, disabled */
border-gray-200 /* Borders */
text-gray-900  /* Primary text */
text-gray-600  /* Secondary text */
text-gray-400  /* Tertiary text, icons */
```

## Component Patterns

### Buttons
```tsx
/* Primary Button */
<button className="px-6 py-2.5 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-colors shadow-sm">
  Action
</button>

/* Secondary Button */
<button className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors">
  Secondary
</button>

/* Danger Button */
<button className="px-6 py-2.5 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 transition-colors border border-red-200">
  Delete
</button>
```

### Cards
```tsx
/* Standard Card */
<div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
  {/* Content */}
</div>

/* Highlighted Card */
<div className="bg-amber-50 rounded-lg border border-amber-200 p-6 shadow-sm">
  {/* Content */}
</div>
```

### Status Badges
```tsx
/* Present */
<span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
  Present
</span>

/* Late */
<span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
  Late
</span>

/* Absent */
<span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
  Absent
</span>
```

### Form Inputs
```tsx
<input 
  type="text"
  placeholder="Enter text..."
  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
/>
```

### Icons
```tsx
/* Primary Icon */
<Icon className="w-5 h-5 text-amber-600" />

/* Secondary Icon */
<Icon className="w-5 h-5 text-gray-400" />

/* Success Icon */
<Icon className="w-5 h-5 text-green-600" />

/* Danger Icon */
<Icon className="w-5 h-5 text-red-600" />
```

## Layout Patterns

### Page Layout
```tsx
<DashboardLayout title="Page Title">
  <div className="space-y-8">
    {/* Sections with consistent spacing */}
  </div>
</DashboardLayout>
```

### Section Header
```tsx
<div>
  <h2 className="text-2xl font-bold text-gray-900 mb-4">Section Title</h2>
  <p className="text-sm text-gray-600 mb-6">Optional description</p>
  {/* Content */}
</div>
```

### Grid Layout
```tsx
/* 3-column on desktop, 1-column on mobile */
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {/* Cards */}
</div>

/* 2-column on desktop, 1-column on mobile */
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* Cards */}
</div>
```

### Responsive Spacing
```tsx
/* Padding */
px-4 sm:px-6 lg:px-8  /* Horizontal padding */
py-4 sm:py-6 lg:py-8  /* Vertical padding */

/* Gaps */
gap-4 sm:gap-6 lg:gap-8  /* Space between items */

/* Text sizes */
text-sm sm:text-base lg:text-lg  /* Responsive text */
```

## Common Patterns

### Loading State
```tsx
<div className="flex items-center justify-center py-16">
  <div className="w-8 h-8 border-2 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
</div>
```

### Empty State
```tsx
<div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg border border-gray-200">
  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
    <Icon className="w-8 h-8 text-gray-400" />
  </div>
  <p className="text-lg font-semibold text-gray-900 mb-1">No Data</p>
  <p className="text-sm text-gray-600">Description of empty state</p>
</div>
```

### Filter Buttons
```tsx
<div className="flex gap-2 overflow-x-auto pb-2">
  <button 
    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
      isActive 
        ? "bg-amber-600 text-white shadow-sm" 
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`}
  >
    Filter Label
  </button>
</div>
```

### Table Header
```tsx
<thead>
  <tr className="border-b border-gray-200 bg-gray-50">
    <th className="text-left text-xs font-semibold text-gray-700 uppercase tracking-wide px-6 py-4">
      Column Header
    </th>
  </tr>
</thead>
```

## Accessibility Guidelines

### Color Contrast
- Text on amber: Use white or amber-900
- Text on gray: Use gray-900 or gray-700
- Ensure WCAG AA compliance (4.5:1 for normal text)

### Focus States
```tsx
focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500
```

### Semantic HTML
- Use `<button>` for clickable elements
- Use `<a>` for navigation
- Use proper heading hierarchy (h1, h2, h3)
- Use `<label>` for form inputs

### ARIA Labels
```tsx
<button aria-label="Close menu">
  <X className="w-5 h-5" />
</button>
```

## Responsive Breakpoints

```css
xs: 375px   /* Mobile */
sm: 640px   /* Small mobile */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

## Common Mistakes to Avoid

❌ **Don't use orange colors**
- ❌ `bg-orange-600`, `text-orange-500`
- ✅ Use `bg-amber-600`, `text-amber-600`

❌ **Don't use inconsistent spacing**
- ❌ Random padding values
- ✅ Use consistent spacing scale: 4, 6, 8, 12, 16, 24, 32

❌ **Don't forget hover states**
- ❌ Buttons without hover effects
- ✅ Add `hover:bg-amber-700 transition-colors`

❌ **Don't ignore mobile responsiveness**
- ❌ Desktop-only layouts
- ✅ Use responsive classes: `md:`, `lg:`, `sm:`

❌ **Don't mix color systems**
- ❌ Using both old and new colors
- ✅ Stick to the amber theme consistently

## Testing Checklist

- [ ] All buttons use amber-600 for primary actions
- [ ] All cards have consistent shadows and borders
- [ ] All status badges use correct colors
- [ ] Responsive layout works on mobile/tablet/desktop
- [ ] Focus states are visible
- [ ] Hover states are smooth
- [ ] Loading states show spinner
- [ ] Empty states are informative
- [ ] Forms have proper validation styling
- [ ] Tables are responsive

## Resources

- Tailwind CSS: https://tailwindcss.com
- Color Reference: https://tailwindcss.com/docs/customizing-colors
- Responsive Design: https://tailwindcss.com/docs/responsive-design
- Accessibility: https://www.w3.org/WAI/WCAG21/quickref/

## Questions?

Refer to the UI_UX_REDESIGN_SUMMARY.md for more details on the redesign.

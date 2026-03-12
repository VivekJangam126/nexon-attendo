# Quick Reference - UI/UX Changes

## 🎨 Color Changes

### Old → New
```
Orange (#F68B3C)  →  Amber (#F59E0B)
bg-orange-600     →  bg-amber-600
text-orange-600   →  text-amber-600
bg-orange-50      →  bg-amber-50
```

## 📱 Layout Changes

### Mobile Scroll Issue - FIXED ✓
- **Before**: Pages didn't scroll on mobile (fixed positioning)
- **After**: Proper scrolling with `position: relative` and `overflow: auto`

### Desktop Layout - IMPROVED ✓
- **Before**: Mobile-centered card layout
- **After**: Full desktop layout with sidebar + navbar

## 📄 Pages Updated

| Page | Changes |
|------|---------|
| Dashboard | Theme update, improved cards |
| Attendance History | Converted to DashboardLayout, new design |
| Leave Management | Converted to DashboardLayout, new design |
| Profile | Converted to DashboardLayout, new design |
| Admin Dashboard | Theme update, improved layout |
| Admin Employees | Complete redesign, better table |

## 🎯 Key Components

### Buttons
```tsx
// Primary (Amber)
bg-amber-600 hover:bg-amber-700

// Secondary (Gray)
bg-gray-100 hover:bg-gray-200

// Danger (Red)
bg-red-50 hover:bg-red-100
```

### Status Badges
```tsx
Present  → bg-green-100 text-green-700
Late     → bg-amber-100 text-amber-700
Absent   → bg-red-100 text-red-700
Awaiting → bg-gray-100 text-gray-700
```

### Cards
```tsx
bg-white rounded-lg border border-gray-200 p-6 shadow-sm
```

## 📐 Spacing Standards

```
Padding:  4, 6, 8, 12, 16, 24, 32px
Gaps:     4, 6, 8, 12, 16, 24px
Radius:   6, 8px (rounded-lg)
Shadows:  shadow-sm, shadow-md
```

## ✅ Checklist for New Pages

- [ ] Use DashboardLayout wrapper
- [ ] Replace orange with amber colors
- [ ] Use consistent card styling
- [ ] Add proper spacing (space-y-8)
- [ ] Test mobile responsiveness
- [ ] Add hover states to buttons
- [ ] Use proper status colors
- [ ] Test scrolling on mobile

## 🔄 Migration Template

```tsx
// OLD
import MobileContainer from "@/components/MobileContainer";
import BottomNavigation from "@/components/BottomNavigation";

export default function Page() {
  return (
    <MobileContainer>
      <div className="pb-20">
        {/* Content */}
        <BottomNavigation />
      </div>
    </MobileContainer>
  );
}

// NEW
import DashboardLayout from "@/components/DashboardLayout";

export default function Page() {
  return (
    <DashboardLayout title="Page Title">
      <div className="space-y-8">
        {/* Content */}
      </div>
    </DashboardLayout>
  );
}
```

## 🎨 Color Palette Quick Reference

```
Primary:     amber-600 (#F59E0B)
Light:       amber-50 (#FFFBEB)
Dark:        amber-700 (#D97706)

Success:     green-600 (#16A34A)
Warning:     amber-600 (#F59E0B)
Danger:      red-600 (#DC2626)

Background: gray-50 (#F9FAFB)
Surface:    white (#FFFFFF)
Border:     gray-200 (#E5E7EB)

Text Dark:  gray-900 (#111827)
Text Mid:   gray-600 (#4B5563)
Text Light: gray-400 (#9CA3AF)
```

## 🚀 Performance Tips

- Use `transition-colors` for smooth color changes
- Use `shadow-sm` for subtle depth
- Use `rounded-lg` for consistent corners
- Use responsive classes: `md:`, `lg:`, `sm:`
- Avoid inline styles, use Tailwind classes

## 📚 Files to Reference

1. **index.css** - Color variables
2. **DashboardLayout.tsx** - Main layout component
3. **Navbar.tsx** - Header styling
4. **Sidebar.tsx** - Navigation styling
5. **DashboardCard.tsx** - Card component
6. **DashboardScreen.tsx** - Example page

## ⚠️ Common Issues

| Issue | Solution |
|-------|----------|
| Orange colors showing | Replace with amber-* classes |
| Mobile not scrolling | Use DashboardLayout |
| Inconsistent spacing | Use space-y-* utilities |
| Buttons look wrong | Check hover states |
| Colors not updating | Clear cache, rebuild |

## 🔗 Related Documents

- `UI_UX_REDESIGN_SUMMARY.md` - Detailed changes
- `DESIGN_SYSTEM_GUIDE.md` - Implementation guide
- `tailwind.config.ts` - Tailwind configuration

## 📞 Support

For questions about the design system, refer to:
1. DESIGN_SYSTEM_GUIDE.md
2. UI_UX_REDESIGN_SUMMARY.md
3. Existing component examples

# Responsive Design Guide

## Breakpoints

```css
/* Mobile: < 640px */
/* Tablet: 640px - 1023px */
/* Desktop: 1024px - 1535px */
/* Wide: >= 1536px */
```

## Components

### 1. MobileNav
Mobile-friendly navigation với hamburger menu và slide-out sidebar.

```tsx
import { MobileNav } from '@/components/console/MobileNav';

<MobileNav user={user} />
```

### 2. ResponsiveLayout
Layout wrapper với responsive padding và mobile navigation.

```tsx
import { ResponsiveLayout } from '@/components/console/ResponsiveLayout';

<ResponsiveLayout user={user}>
  {children}
</ResponsiveLayout>
```

### 3. ResponsiveTable
Tự động chuyển từ table sang card view trên mobile.

```tsx
import { ResponsiveTable } from '@/components/ui/ResponsiveTable';

<ResponsiveTable
  columns={[
    { key: 'name', label: 'Name', mobileLabel: 'Tên' },
    { key: 'status', label: 'Status', hideOnMobile: true },
    { 
      key: 'actions', 
      label: 'Actions',
      render: (value, row) => <Button>Edit</Button>
    }
  ]}
  data={games}
  keyField="_id"
/>
```

### 4. ResponsiveGrid
Grid layout tự động điều chỉnh số cột theo màn hình.

```tsx
import { ResponsiveGrid } from '@/components/ui/ResponsiveGrid';

<ResponsiveGrid 
  cols={{ mobile: 1, tablet: 2, desktop: 3 }}
  gap="md"
>
  {items.map(item => <Card key={item.id} {...item} />)}
</ResponsiveGrid>
```

## Hooks

### useBreakpoint
Hook để detect breakpoint hiện tại.

```tsx
import { useBreakpoint } from '@/hooks/useBreakpoint';

function MyComponent() {
  const { isMobile, isTablet, isDesktop, width } = useBreakpoint();
  
  return (
    <div>
      {isMobile && <MobileView />}
      {isDesktop && <DesktopView />}
    </div>
  );
}
```

### useMediaQuery
Hook để check media query.

```tsx
import { useMediaQuery } from '@/hooks/useBreakpoint';

function MyComponent() {
  const isSmallScreen = useMediaQuery('(max-width: 640px)');
  
  return isSmallScreen ? <MobileView /> : <DesktopView />;
}
```

## CSS Utilities

### Container
```html
<div class="responsive-container">
  <!-- Auto padding: 1rem mobile, 1.5rem tablet, 2rem desktop -->
</div>
```

### Text Sizes
```html
<h1 class="text-responsive-3xl">Heading</h1>
<p class="text-responsive-base">Body text</p>
```

### Spacing
```html
<div class="space-responsive-lg">
  <!-- Auto margin-bottom: 1.5rem mobile, 2rem tablet, 3rem desktop -->
</div>
```

### Grid
```html
<div class="grid-responsive grid-responsive-3">
  <!-- 1 col mobile, 2 cols tablet, 3 cols desktop -->
</div>
```

### Visibility
```html
<div class="mobile-only">Only on mobile</div>
<div class="tablet-up">Tablet and up</div>
<div class="desktop-up">Desktop and up</div>
```

### Cards
```html
<div class="card-responsive">
  <!-- Auto padding: 1rem mobile, 1.5rem tablet, 2rem desktop -->
</div>
```

### Buttons
```html
<button class="btn-responsive">
  <!-- Auto sizing for mobile touch targets -->
</button>
```

## Tailwind Classes

### Responsive Padding
```html
<div class="px-4 sm:px-6 lg:px-8">
  <!-- 1rem mobile, 1.5rem tablet, 2rem desktop -->
</div>
```

### Responsive Grid
```html
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
  <!-- Responsive columns and gaps -->
</div>
```

### Responsive Text
```html
<h1 class="text-xl sm:text-2xl lg:text-3xl">
  <!-- Responsive font sizes -->
</h1>
```

### Responsive Display
```html
<div class="hidden lg:block">Desktop only</div>
<div class="block lg:hidden">Mobile/Tablet only</div>
```

## Best Practices

### 1. Mobile-First Approach
Thiết kế cho mobile trước, sau đó scale up cho desktop.

```css
/* Mobile first */
.element {
  padding: 1rem;
}

/* Then tablet */
@media (min-width: 640px) {
  .element {
    padding: 1.5rem;
  }
}

/* Then desktop */
@media (min-width: 1024px) {
  .element {
    padding: 2rem;
  }
}
```

### 2. Touch Targets
Đảm bảo buttons/links có kích thước tối thiểu 44x44px trên mobile.

```css
@media (max-width: 639px) {
  button, a {
    min-height: 44px;
    min-width: 44px;
  }
}
```

### 3. Readable Text
Font size tối thiểu 16px trên mobile để tránh zoom.

```css
body {
  font-size: 16px;
}
```

### 4. Prevent Horizontal Scroll
```css
body {
  overflow-x: hidden;
}
```

### 5. Safe Area Insets
Hỗ trợ notched devices (iPhone X+).

```css
.header {
  padding-top: max(1rem, env(safe-area-inset-top));
}
```

### 6. Responsive Images
```html
<img 
  src="image.jpg"
  srcset="image-small.jpg 640w, image-large.jpg 1024w"
  sizes="(max-width: 640px) 100vw, 50vw"
  alt="Description"
/>
```

### 7. Viewport Meta Tag
Đảm bảo có trong `<head>`:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5">
```

## Testing

### Breakpoints to Test
- 375px (iPhone SE)
- 390px (iPhone 12/13/14)
- 428px (iPhone 14 Pro Max)
- 768px (iPad)
- 1024px (iPad Pro)
- 1280px (Desktop)
- 1920px (Large Desktop)

### Tools
- Chrome DevTools Device Mode
- Firefox Responsive Design Mode
- Real devices testing
- BrowserStack for cross-device testing

## Common Patterns

### Responsive Navigation
```tsx
// Mobile: Hamburger menu
// Desktop: Horizontal nav
{isMobile ? <MobileNav /> : <DesktopNav />}
```

### Responsive Layout
```tsx
// Mobile: Stack
// Desktop: Sidebar + Content
<div className="flex flex-col lg:flex-row">
  <aside className="w-full lg:w-64">Sidebar</aside>
  <main className="flex-1">Content</main>
</div>
```

### Responsive Cards
```tsx
// Mobile: Full width
// Tablet: 2 columns
// Desktop: 3 columns
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id} />)}
</div>
```

### Responsive Modal
```tsx
// Mobile: Full screen
// Desktop: Centered with max-width
<div className="fixed inset-0 lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:max-w-2xl">
  Modal content
</div>
```
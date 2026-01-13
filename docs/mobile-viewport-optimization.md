# Mobile Viewport Optimization for Game Screen

## Overview
Implemented comprehensive mobile viewport optimizations to handle address bar and navigation bar issues on mobile devices (Safari iOS and Chrome Android). The solution provides multiple levels of optimization from basic CSS fixes to full PWA implementation.

## 🎯 Solutions Implemented

### 1. CSS Viewport Units (Level 1 - Basic)
**Files:** `src/styles/design-tokens.css`, `src/styles/mobile-game.css`

- **svh (Small Viewport Height)**: Replaces `100vh` with `100svh` for better mobile support
- **Dynamic viewport calculation**: Automatically adjusts when mobile UI shows/hides
- **Safe area insets**: Handles notched devices (iPhone X+) with `env(safe-area-inset-*)`

```css
.game-container {
  height: 100vh; /* Fallback */
  height: 100svh; /* Excludes mobile UI */
}
```

### 2. Fullscreen API with iOS Fallback (Level 2 - Advanced)
**Files:** `src/hooks/useFullscreen.ts`, `src/app/play/[gameId]/GamePlayer.tsx`

- **Standard Fullscreen API**: For desktop and Android devices
- **iOS viewport fullscreen**: Custom implementation for iOS (position: fixed + 100vw/100vh)
- **Safari UI hiding**: Meta viewport manipulation for iOS Safari
- **Escape key support**: Exit fullscreen with Esc key

```typescript
const { isFullscreen, toggleFullscreen } = useFullscreen({
  onEnter: () => console.log('Entered fullscreen'),
  onExit: () => console.log('Exited fullscreen'),
});
```

### 3. Address Bar Auto-Hide (Level 3 - Safari Trick)
**Files:** `src/hooks/useHideAddressBar.ts`

- **Scroll trick**: Automatically scrolls 1px to hide Safari address bar
- **Body height manipulation**: Sets `min-height: 100.1vh` temporarily
- **Orientation change handling**: Re-applies on device rotation

```typescript
useHideAddressBar(); // Auto-hides address bar on mobile Safari
```

### 4. PWA Implementation (Level 4 - Best Experience)
**Files:** `public/manifest.json`, `src/components/PWAInstallPrompt.tsx`, `src/app/layout.tsx`

- **Standalone mode**: Removes all browser UI when installed
- **Install prompt**: Smart prompt after 30 seconds of usage
- **iOS instructions**: Guides iOS users to "Add to Home Screen"
- **Landscape orientation**: Optimized for game playing

```json
{
  "display": "standalone",
  "orientation": "landscape",
  "theme_color": "#4F46E5"
}
```

## 🔧 Key Components

### Custom Hooks

1. **useFullscreen**: Handles fullscreen with iOS fallback
2. **useHideAddressBar**: Safari address bar auto-hide
3. **useViewportHeight**: Accurate viewport height calculation

### UI Components

1. **PWAInstallPrompt**: Smart install prompt for PWA
2. **OrientationLock**: Landscape/portrait orientation hints
3. **GamePlayer**: Updated with all mobile optimizations

### CSS Optimizations

1. **Mobile-first viewport units**: svh, lvh, dvh support
2. **Touch optimizations**: Prevent zoom, improve touch targets
3. **Responsive breakpoints**: Mobile, tablet, desktop specific styles
4. **Safe area handling**: Notched device support

## 📱 Mobile-Specific Features

### Device Detection
- **iOS detection**: Special handling for Safari limitations
- **Device type**: Mobile/tablet/desktop responsive behavior
- **Orientation detection**: Portrait/landscape optimization

### Touch Interactions
- **Prevent double-tap zoom**: `touch-action: manipulation`
- **Floating action buttons**: Mobile-optimized fullscreen button
- **Gesture-friendly**: Large touch targets (44px minimum)

### Performance Optimizations
- **Hardware acceleration**: `transform3d` for smooth animations
- **Reduced motion**: Respects user's motion preferences
- **Efficient rendering**: Minimal reflows and repaints

## 🎮 Game-Specific Enhancements

### Fullscreen Gaming
- **Immersive mode**: Hides all browser UI
- **Toolbar toggle**: Show/hide controls in fullscreen
- **Quick exit**: Multiple ways to exit fullscreen

### Orientation Management
- **Landscape preference**: Games optimized for landscape
- **Rotation hints**: Visual cues for optimal orientation
- **Orientation lock**: API-based orientation locking when supported

### Loading & Error States
- **Mobile-optimized loading**: Device-specific messages
- **Error recovery**: Retry mechanism with user feedback
- **Progressive enhancement**: Works without JavaScript

## 🚀 Implementation Results

### Before vs After
- **Before**: Address bar covers game content, poor mobile UX
- **After**: Full viewport usage, native app-like experience

### Browser Support
- ✅ **iOS Safari**: Viewport fullscreen + address bar hiding
- ✅ **Chrome Android**: Standard Fullscreen API
- ✅ **Desktop browsers**: Standard Fullscreen API
- ✅ **PWA mode**: Complete browser UI removal

### Performance Impact
- **Minimal overhead**: Hooks use efficient event listeners
- **CSS-first approach**: Hardware-accelerated animations
- **Progressive enhancement**: Graceful degradation

## 📋 Usage Guide

### For Developers
1. Import hooks in game components
2. Use CSS classes for responsive behavior
3. Test on actual mobile devices
4. Consider PWA installation flow

### For Users
1. **Mobile web**: Automatic optimizations applied
2. **PWA install**: Best experience with no browser UI
3. **Fullscreen button**: Manual fullscreen toggle
4. **Orientation hints**: Follow on-screen guidance

## 🔮 Future Enhancements

### Potential Improvements
- **Screen Wake Lock**: Keep screen on during gameplay
- **Gamepad API**: Controller support for mobile gaming
- **WebXR integration**: AR/VR game support
- **Performance monitoring**: Real-time FPS tracking

### Browser API Evolution
- **New viewport units**: dvh, lvh adoption
- **Fullscreen improvements**: Better iOS support
- **PWA capabilities**: Enhanced mobile features

## 📚 References

- [CSS Viewport Units](https://developer.mozilla.org/en-US/docs/Web/CSS/length#viewport-percentage_lengths)
- [Fullscreen API](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API)
- [PWA Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [iOS Safari Viewport](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)
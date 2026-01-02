# GameHub Testing Checklist - Printable Version

## Device Testing Matrix

### Required Test Devices (Minimum 4)
- [ ] **Android Phone**: Samsung (OneUI) / Xiaomi (MIUI)
- [ ] **iPhone**: iOS Safari
- [ ] **Tablet**: iPad (Safari) or Android tablet
- [ ] **Laptop/PC**: Windows Chrome

### Browser Matrix
- [ ] **Android**: Chrome + Samsung Internet
- [ ] **iOS**: Safari (required)
- [ ] **Desktop**: Chrome + Edge (minimum)

### Screen/Breakpoint Testing
- [ ] **Mobile**: 360×800 (portrait), 800×360 (landscape)
- [ ] **Tablet**: 768×1024 (portrait), 1024×768 (landscape)
- [ ] **Desktop**: 1366×768 + 1920×1080

---

## Quick Test (15-20 minutes) - Gate Check

### 1. First Load (Cold Start)
- [ ] Network: 4G/5G (not internal wifi)
- [ ] Page loads in < 5 seconds
- [ ] No broken layout, text overflow, or hidden buttons

### 2. Login Flow
- [ ] Login successful
- [ ] Correct page redirect
- [ ] Session persists after page refresh

### 3. Game Access
- [ ] Hub opens game correctly (iframe/webview)
- [ ] Game loads successfully
- [ ] Exit game returns to hub without errors

### 4. Breakpoint Check
- [ ] Mobile (360×800) - layout intact
- [ ] Tablet (768×1024) - layout intact
- [ ] Desktop (1366×768) - layout intact

**Gate Decision**: If multiple items fail above, return for optimization before full testing.

---

## Full Testing Checklist (1-2 days)

### A. Layout & Responsive Design

#### Header & Navigation
- [ ] Header doesn't cover content
- [ ] Menu doesn't overflow
- [ ] Navigation works on all screen sizes

#### Content Layout
- [ ] Game cards/lists don't break layout
- [ ] Font is readable (not too large/small)
- [ ] No horizontal scrolling
- [ ] Important buttons not hidden by notch/home bar (iPhone)

#### Game Preview
- [ ] Manual load button works
- [ ] Game loads only when requested
- [ ] Preview shows game content only (no web content)
- [ ] Sandbox restrictions working properly

### B. Interaction & UX

#### Touch/Click Response
- [ ] Single tap/click works (no double-tap required)
- [ ] Loading states show during data fetch
- [ ] Clear error states when API fails
- [ ] Browser back/forward doesn't freeze app

#### Performance Indicators
- [ ] Loading spinners/skeletons present
- [ ] Smooth transitions between pages
- [ ] No UI blocking during operations

### C. Critical User Flows

#### Authentication Flow
- [ ] Login → Console access
- [ ] Logout → Redirect to login
- [ ] Session timeout handling

#### Game Management Flow
- [ ] My Games → Create → Upload → See game in list
- [ ] Game Library → Open detail view
- [ ] Game preview → Manual load → Test game

#### Role-Based Dashboards
- [ ] Dev: Can see own games, upload, edit
- [ ] QC: Can see uploaded games, review interface
- [ ] CTO/CEO: Can see approved games, approval interface
- [ ] Admin: Can see all games, publish interface

---

## Performance Testing

### Chrome DevTools Measurements
**Setup**: F12 → Network tab → Disable cache → Throttle to "Fast 3G"

#### Key Metrics to Record
- [ ] **TTFB (Time to First Byte)**: _____ ms
- [ ] **LCP (Largest Contentful Paint)**: _____ ms
- [ ] **Total Download Size**: _____ MB
- [ ] **Number of Requests**: _____

#### Performance Targets
- [ ] TTFB < 800ms
- [ ] LCP < 3-4s on Slow 4G
- [ ] No single request > 3s without reason
- [ ] Total page size < 2MB initial load

#### Slow Request Analysis
**Sort Network by Time - Record slowest requests:**
1. _____ (_____ ms) - Type: API/Asset
2. _____ (_____ ms) - Type: API/Asset
3. _____ (_____ ms) - Type: API/Asset

---

## Bug Report Template

**Device Info:**
- Device: _____
- Browser: _____
- Screen Size: _____
- OS Version: _____

**Steps to Reproduce:**
1. _____
2. _____
3. _____

**Expected Result:**
_____

**Actual Result:**
_____

**Screenshot/Video:**
[ ] Attached

**Severity:**
- [ ] Critical (blocks main functionality)
- [ ] Major (affects user experience)
- [ ] Minor (cosmetic/edge case)

---

## Release Gate Criteria

### Must Pass Before Release
- [ ] All 4 device types tested successfully
- [ ] All critical flows work on primary browsers
- [ ] Performance targets met on 3G/4G networks
- [ ] No critical or major bugs remaining
- [ ] Manual game loading works consistently
- [ ] Sandbox security restrictions verified

### Sign-off
- [ ] **Tester**: _____ Date: _____
- [ ] **QC Lead**: _____ Date: _____
- [ ] **Tech Lead**: _____ Date: _____

---

*Print this checklist and tick each item during testing. Attach bug reports and performance screenshots as needed.*
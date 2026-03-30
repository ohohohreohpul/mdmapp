# Mydemy App — PRD

## Original Problem Statement
"Adjust UI of this mobile app to be modern/beautiful UX/UI that great iOS App Store Applications should look like (e.g. Glassmorphism). Turn this repo to iOS app too — so we can deploy it via Emergent. That means the presets are adapted from PWA to apps."

## User Choices
- Clean Light Mode glassmorphism (like iOS Settings/Health app)
- No gradient backgrounds
- Keep Mydemy Pink (#ef5ea8) as brand color
- Smooth animations with some rich/expressive iOS-style effects
- All main screens updated
- Convert to iOS app (EAS build setup)

## Architecture
- **Frontend**: React Native / Expo SDK 54 (expo-router)
- **Backend**: FastAPI + MongoDB (Python)
- **Platform**: iOS + Android + Web (PWA fallback)
- **Build**: EAS (Expo Application Services)

## Design System Implemented (2026)
- **iOS Clean Clarity** design language
- Background: #F2F2F7 (iOS system background)
- Surface/Cards: #FFFFFF with soft shadows (opacity 0.07, radius 12)
- Primary: #ef5ea8 (Mydemy Pink)
- Border radius: 20-24px on cards, 9999px for pills
- Typography: iOS-native scale (34/28/22/17/15/13px)
- Glassmorphism: expo-blur BlurView on tab bar (iOS native), rgba fallback on web

## What's Been Implemented

### UI Redesign (Completed 2026-03-30)
- **constants/theme.ts** — Complete iOS design system rewrite: iOS color palette, SHADOWS, RADIUS, TYPOGRAPHY, SPACING tokens
- **app/(tabs)/_layout.tsx** — Frosted glass floating tab bar using BlurView (iOS) with pink active pill indicator
- **app/(tabs)/home.tsx** — Premium home: refined pink header, glass today card with pink shadow, iOS-style section headers, better course/article cards
- **app/(tabs)/explore.tsx** — Clean search bar, iOS-style course grid cards with soft shadows
- **app/(tabs)/learning.tsx** — White course cards with rounded corners and progress tracking
- **app/(tabs)/profile.tsx** — Pink header with glass stats container, iOS-style menu list
- **app/(tabs)/jobs.tsx** — Glass hero card, feature list with rounded icons
- **app/auth.tsx** — Clean minimal iOS-style auth with pink CTA button
- **app/course-detail.tsx** — Updated card styles with iOS treatment

### iOS App Configuration (Completed 2026-03-30)
- **app.json** — Updated: name="Mydemy", slug="mydemy", bundleIdentifier="co.mydemy.app", userInterfaceStyle="light", scheme="mydemy"
- **eas.json** — Created EAS build profiles: development, preview (iOS simulator), production

### Bug Fixes (Completed 2026-03-30)
- Fixed `Easing.cubic` not available in react-native-web → replaced with `Easing.poly(3)` in splash.tsx and PWAInstallPrompt.tsx
- Added default export to ComingSoonModal.tsx to prevent Expo Router route warnings

## Core Requirements (Static)
- Thai language UI for learning platform
- Learning features: daily check-in + XP streaks, course progress, career paths
- Authentication: login/register flow
- Tab navigation: Home, Explore, Jobs, Learning, Profile

## Prioritized Backlog

### P0 (Critical — next session)
- Backend API 502 errors need investigation (seen in test logs)
- EAS project ID setup for actual App Store deployment (requires Apple Developer account)

### P1 (High Priority)
- Add spring-scale press animations (0.97) to all interactive elements for true iOS feel
- Add haptic feedback on button presses (expo-haptics)
- App icon and splash screen update to match new design

### P2 (Enhancement)
- Dark mode support (currently forced light)
- iPad-specific layout optimizations
- Push notifications setup
- App Store metadata (screenshots, description)

## Next Tasks
1. Set up EAS project with `eas init` and Apple Developer account credentials
2. Run `eas build --platform ios --profile preview` for first simulator build
3. Fix backend API 502 errors
4. Add haptic feedback and spring animations for final iOS polish

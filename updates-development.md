# GigHubify Development Plan for New Features

## Overview
This document outlines the implementation plan for new features requested in the client-updates.md file. The features are prioritized based on potential impact, development complexity, and logical dependencies.

## Phase 1: Core Features (2-3 weeks)

### 1. Trending Gigs Feature
**Priority: High**

#### Technical Implementation:
- Create a new collection in Firebase: `gigMetrics` to track:
  - Clicks (when users visit a gig page)
  - Saves/bookmarks
  - Orders in last 24h
  - Reviews
  - Refunds

```typescript
interface GigMetrics {
  gigId: string;
  clicks: number;
  clicksLast24h: number;
  saves: number;
  savesLast24h: number;
  ordersLast24h: number;
  reviewsCount: number;
  refundsCount: number;
  trendingScore: number;
  lastCalculated: Timestamp;
}
```

- Create a Cloud Function that runs every 6 hours to:
  - Update the metrics for each gig
  - Calculate trending score using: `(Clicks + Saves + Orders in Last 24h) * 1.5 + (Reviews * 3) - (Refunds * 2)`
  - Store the top trending gigs in a separate `trendingGigs` collection

#### UI Implementation:
- Add a new "Hot Right Now" or "Trending Edits" section on the homepage
- Create a horizontal scrollable card layout for 6-10 trending gigs
- Design a "Trending" badge component for gig cards
- Add optional filter toggle between "Today" and "This Week"

#### Files to Modify:
- `src/pages/Index.tsx` - Add trending section below hero
- `src/components/TrendingGigs.tsx` - Create new component
- `src/components/ServiceCard.tsx` - Add optional trending badge
- `src/lib/services/trending.service.ts` - Create service for trending data

### 2. Fresh Picks - New Talented Editors
**Priority: High**

#### Technical Implementation:
- Create a Firebase collection `freshPicks` to store:
  - Currently displayed gigs
  - Last rotation timestamp
  - Gig display history

```typescript
interface FreshPicksConfig {
  currentGigs: string[]; // Array of gigIds
  lastRotation: Timestamp;
  recentlyShownGigs: string[]; // To avoid repeats
}
```

- Create a Cloud Function to:
  - Run every hour
  - Select 6 random gigs from editors who:
    - Joined in last 30 days OR
    - Have 0-5 completed orders
  - Ensure gigs aren't repeated until all eligible gigs have been shown
  - Update the `freshPicks` collection

#### UI Implementation:
- Create "Fresh Picks" section on homepage with:
  - Clear section title and description
  - 6 gig cards in a responsive grid/carousel
  - Countdown timer to next rotation

#### Files to Modify:
- `src/pages/Index.tsx` - Add fresh picks section
- `src/components/FreshPicks.tsx` - Create new component
- `src/components/CountdownTimer.tsx` - Create reusable timer
- `src/lib/services/freshPicks.service.ts` - Service to fetch data

## Phase 2: Enhanced Filtering and Discoverability (1-2 weeks)

### 3. $5 Starter Gigs
**Priority: Medium**

#### Technical Implementation:
- Add a new field to the Service model:
  - `isStarterGig: boolean`
- Update service creation/edit forms to allow marking gigs as starter gigs
- Create indexes in Firebase for efficient querying

#### UI Implementation:
- Add "$5 Starter" filter in Explore page
- Create a "$5 Starter Gigs" section on homepage
- Design a "$5 Starter" badge for gig cards

#### Files to Modify:
- `src/lib/models/service.model.ts` - Update model
- `src/pages/CreateService.tsx` - Add starter gig option
- `src/pages/EditService.tsx` - Add starter gig option
- `src/pages/Explore.tsx` - Add filter
- `src/components/ServiceCard.tsx` - Add starter badge

### 4. Editor Vibe Tags
**Priority: Medium**

#### Technical Implementation:
- Create predefined list of vibe tags:
  - Cinematic, Meme, Reels, Vlog, Tutorial, Corporate, etc.
- Add `vibes: string[]` to Service model
- Update service creation forms

#### UI Implementation:
- Add multi-select for vibes in service creation/edit
- Add vibe filtering in Explore page
- Display vibe tags on service cards

#### Files to Modify:
- `src/lib/models/service.model.ts` - Add vibes field
- `src/pages/CreateService.tsx` - Add vibe selector
- `src/pages/EditService.tsx` - Add vibe selector
- `src/pages/Explore.tsx` - Add vibe filters

### 5. Express Delivery Gigs
**Priority: Medium**

#### Technical Implementation:
- Flag gigs with delivery time ≤ 24 hours as "Express Delivery"
- Add index for fast querying

#### UI Implementation:
- Add "Express Delivery" filter in Explore page
- Create "Express Delivery" badge for service cards
- Add dedicated section on homepage

#### Files to Modify:
- `src/pages/Explore.tsx` - Add filter
- `src/components/ServiceCard.tsx` - Add express badge
- `src/pages/Index.tsx` - Add express section

## Phase 3: Monetization and Engagement Features (2-3 weeks)

### 6. Free + Paid Gigs System
**Priority: High**

#### Technical Implementation:
- Add to User model:
  - `availableGigSlots: number` (default: 3)
  - `maxGigSlots: number` (default: 3)
  - `hasUnlockedExtraSlots: boolean` (default: false)
- Integrate payment gateway (Stripe) for slot purchase

#### UI Implementation:
- Create upgrade prompt after 3rd gig creation
- Design upgrade page with benefits
- Add slot indicator in seller dashboard

#### Files to Modify:
- `src/lib/models/user.model.ts` - Update model
- `src/pages/CreateService.tsx` - Add slot check
- `src/pages/UpgradeAccount.tsx` - Create new page
- `src/lib/services/payment.service.ts` - Add payment method

### 7. Editor XP & Badge System
**Priority: Medium**

#### Technical Implementation:
- Add to User model:
  - `xpPoints: number`
  - `level: string` (Beginner, Trusted, Pro)
  - `badges: Badge[]`
- Create Cloud Functions to award XP for:
  - On-time delivery: +10 XP
  - 5-star review: +20 XP
  - Fast replies: +5 XP

```typescript
interface Badge {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  unlockedAt: Timestamp;
}
```

#### UI Implementation:
- Design badges for each level
- Create XP progress bar in user profile
- Add level badges to service cards and profiles

#### Files to Modify:
- `src/lib/models/user.model.ts` - Add XP fields
- `src/components/ProfileBadge.tsx` - Create new component
- `src/pages/SellerDashboard.tsx` - Add XP progress
- `src/components/ServiceCard.tsx` - Show seller level

### 8. Lower Client Fees
**Priority: Medium**

#### Technical Implementation:
- Update payment processing to charge 2-5% fee instead of higher rates
- Add fee transparency in checkout process

#### UI Implementation:
- Add "Lowest fees in the industry" badge near checkout
- Create comparison table with competitors
- Add fee breakdown in order summary

#### Files to Modify:
- `src/lib/services/payment.service.ts` - Update fee calculation
- `src/pages/Checkout.tsx` - Update fee display
- `src/components/OrderSummary.tsx` - Add fee breakdown

## Phase 4: Analytics and Communication (2-3 weeks)

### 9. Creator Analytics Dashboard
**Priority: Medium**

#### Technical Implementation:
- Track metrics per gig:
  - Views, clicks, saves
  - Conversion rate
  - Revenue over time
- Create data visualization components

#### UI Implementation:
- Design analytics dashboard with charts
- Add filtering by date range
- Create exportable reports

#### Files to Modify:
- `src/pages/SellerDashboard.tsx` - Add analytics section
- `src/components/Analytics/` - Create analytics components
- `src/lib/services/analytics.service.ts` - Create service

### 10. Before/After Previews
**Priority: Low**

#### Technical Implementation:
- Add support for "before/after" media pairs in Service model
- Create specialized media uploader

#### UI Implementation:
- Add before/after slider in service detail
- Allow split-screen view for videos
- Add before/after upload in service creation

#### Files to Modify:
- `src/lib/models/service.model.ts` - Add before/after
- `src/components/BeforeAfterSlider.tsx` - Create component
- `src/pages/ServiceDetail.tsx` - Add before/after section

### 11. Chat System
**Priority: High**

#### Technical Implementation:
- Use Firebase Realtime Database for chat functionality
- Create message model and services

```typescript
interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  attachments?: string[];
  timestamp: Timestamp;
  read: boolean;
}
```

#### UI Implementation:
- Create chat interface
- Add notifications for new messages
- Support file attachments and previews

#### Files to Modify:
- `src/pages/Messages.tsx` - Create messages page
- `src/components/Chat/` - Create chat components
- `src/lib/services/messaging.service.ts` - Create service

## Implementation Timeline

### Month 1
- Week 1-2: Trending Gigs Feature + Fresh Picks
- Week 3-4: Free + Paid Gigs System + Chat System

### Month 2
- Week 1-2: Enhanced Filtering (Starter Gigs, Vibe Tags, Express)
- Week 3-4: Editor XP System + Lower Client Fees

### Month 3
- Week 1-2: Creator Analytics Dashboard
- Week 3-4: Before/After Previews + Final Refinements

## Technical Considerations

- **Performance:** Use Firebase indexes for efficient querying
- **Scalability:** Implement Cloud Functions for background processing
- **Security:** Validate all user inputs and enforce access rules
- **Testing:** Create unit tests for all critical components
- **Mobile Responsiveness:** Ensure all new UI elements work on mobile

## Next Steps

1. Get approval for this development plan
2. Prioritize features for initial release
3. Set up Firebase collections and indexes
4. Begin implementation of Phase 1 features 
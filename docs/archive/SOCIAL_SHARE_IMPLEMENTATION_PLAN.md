# 🔗 Social Media Share Buttons - Implementation Plan

## Overview
Add respectful, gold-themed social media share buttons to help families spread the word about memorial services and encourage attendance/participation.

---

## 📍 Implementation Locations

### **Location 1: Memorial Page** ✅
**Placement:** Below the video player / stream display  
**Context:** Main public-facing memorial page (`/[fullSlug]`)  
**Purpose:** Allow visitors to share the memorial with friends and family

**Component:** `MemorialStreamDisplay.svelte`
- Add share buttons section after stream player
- Conditional: Only show if memorial is public
- Position: Centered, below video container

### **Location 2: Schedule Paid Confirmation Page** ✅
**Placement:** In the success/receipt page after payment  
**Context:** Schedule page (`/schedule/[memorialId]`) - "paid" status view  
**Purpose:** Encourage immediate sharing after booking confirmation

**Component:** `ScheduleReceipt.svelte` or paid confirmation section
- Add to receipt/confirmation UI
- Show alongside "View Memorial" button
- Include message: "Share this memorial to invite family and friends"

### **Location 3: Memorial Owner Profile** ✅
**Placement:** Next to "View Slideshow" and "View Memorial" buttons  
**Context:** Owner profile page (`/profile`) - memorial card/list  
**Purpose:** Give owners easy access to share their memorial

**Component:** Profile memorial card component
- Add as action buttons in memorial card
- Show in button group with existing actions
- Compact icon-only view for space efficiency

---

## 🎨 Design Specifications

### **Visual Style**
- **Color Theme:** Gold/bronze (#D5BA7F) - matching site brand
- **Hover State:** Slightly darker gold (#C5AA6F)
- **Icon Style:** Respectful, minimal line icons (Lucide icons)
- **Size:** Medium (24x24px icons)
- **Spacing:** Adequate gap between buttons (0.75rem)

### **Layout Options**

#### **Full Display (Memorial Page & Schedule Paid)**
```
┌─────────────────────────────────────────────┐
│  Share This Memorial                         │
│  [📘 Facebook] [🐦 Twitter] [📧 Email]      │
│  [📋 Copy Link]                              │
└─────────────────────────────────────────────┘
```

#### **Compact Display (Profile)**
```
[👁️ View] [🎞️ Slideshow] [🔗 Share ▼]
                         ↓
                   [📘] [🐦] [📧] [📋]
```

---

## 📱 Social Media Platforms

### **Platform Selection**
1. **Facebook** - Most common for family sharing
2. **Twitter (X)** - Quick announcements
3. **Email** - Personal invitations
4. **Copy Link** - Universal sharing (WhatsApp, text, etc.)

### **Optional Future Platforms**
- WhatsApp (direct link)
- LinkedIn (for professional memorials)
- SMS/Text (mobile only)

---

## 🛠️ Technical Implementation

### **Component Structure**

#### **New Component: `SocialShareButtons.svelte`**
```typescript
interface Props {
  memorialName: string;
  memorialUrl: string;
  variant?: 'full' | 'compact' | 'icon-only';
  theme?: 'memorial' | 'default';
  showLabel?: boolean;
}
```

**Features:**
- Responsive design (stack on mobile)
- Copy-to-clipboard functionality
- Toast/notification on successful copy
- Accessible labels and ARIA attributes
- Click tracking for analytics (optional)

### **Share URL Construction**

#### **Facebook**
```javascript
https://www.facebook.com/sharer/sharer.php?u={memorialUrl}
```

#### **Twitter/X**
```javascript
https://twitter.com/intent/tweet?url={memorialUrl}&text={encodedText}
```
- Text: "Honoring the life of {lovedOneName} | Join us in celebrating their memory"

#### **Email**
```javascript
mailto:?subject={encodedSubject}&body={encodedBody}
```
- Subject: "Memorial Service for {lovedOneName}"
- Body: "You're invited to view the memorial for {lovedOneName}:\n{memorialUrl}"

#### **Copy Link**
```javascript
navigator.clipboard.writeText(memorialUrl)
```
- Shows success toast/notification
- Fallback for older browsers

---

## 📄 Files to Create/Modify

### **New Files**
1. `frontend/src/lib/components/SocialShareButtons.svelte`
   - Main share buttons component
   - Props for customization
   - All share logic contained

2. `frontend/src/lib/utils/shareHelpers.ts` (optional)
   - Helper functions for constructing share URLs
   - Copy-to-clipboard utility
   - Analytics tracking hooks

### **Files to Modify**

#### **1. Memorial Page**
- **File:** `frontend/src/lib/components/MemorialStreamDisplay.svelte`
- **Change:** Add `<SocialShareButtons>` after stream player
- **Condition:** Only if `memorial.isPublic === true`

#### **2. Schedule Paid Page**
- **File:** `frontend/src/routes/schedule/[memorialId]/_components/ScheduleReceipt.svelte`
- **Change:** Add share buttons section in receipt/success view
- **Context:** "Share this memorial" section with CTA

#### **3. Profile Page**
- **File:** `frontend/src/routes/profile/+page.svelte` (or memorial card component)
- **Change:** Add share dropdown/buttons to memorial actions
- **Variant:** Compact or dropdown menu style

---

## 🎯 User Experience Flow

### **Memorial Page Visitor**
1. Views memorial and livestream
2. Sees share buttons below video
3. Clicks Facebook → Opens share dialog
4. Posts to Facebook with memorial link
5. Friends see post → Visit memorial

### **Memorial Owner (After Booking)**
1. Completes service booking
2. Sees success receipt page
3. Prompted: "Share this memorial to invite attendees"
4. Clicks Email → Sends to family list
5. Recipients get invitation email

### **Memorial Owner (From Profile)**
1. Views their memorials in profile
2. Clicks share icon dropdown
3. Copies link to share via WhatsApp
4. Sends to family group chat

---

## 🔐 Privacy Considerations

### **Respect for Privacy**
- ✅ Only show share buttons if `memorial.isPublic === true`
- ✅ Don't expose private memorial URLs
- ✅ Allow memorial owner to control shareability
- ✅ Respectful messaging (no "promote" language)

### **Content Shared**
- Memorial URL (public link)
- Loved one's name
- Generic text: "Memorial Service" (not "funeral")
- NO personal details, dates, locations in share text

---

## 📊 Success Metrics

### **What to Track** (Optional Analytics)
- Share button click rate
- Most popular platform (Facebook vs Twitter vs Email)
- Profile vs Memorial page shares
- Conversion: Shares → Memorial page visits

### **Privacy-Respecting Analytics**
- No tracking of individual users
- Aggregate data only
- Opt-out available
- No third-party analytics on share URLs

---

## 🚀 Implementation Steps

### **Phase 1: Create Component** ✅
1. Build `SocialShareButtons.svelte` component
2. Add Lucide icons (Facebook, Twitter, Mail, Link)
3. Implement share URL logic
4. Add copy-to-clipboard with toast notification
5. Style with gold theme (#D5BA7F)
6. Test all share links

### **Phase 2: Memorial Page Integration** ✅
1. Import component into `MemorialStreamDisplay.svelte`
2. Position below video player
3. Pass memorial name and URL as props
4. Add conditional rendering (public only)
5. Test responsive layout

### **Phase 3: Schedule Paid Page** ✅
1. Locate paid confirmation section
2. Add share buttons with CTA message
3. Style to match receipt design
4. Test after successful payment flow

### **Phase 4: Profile Page** ✅
1. Locate memorial card/list in profile
2. Add compact share button/dropdown
3. Position next to existing action buttons
4. Test interaction and dropdown behavior

### **Phase 5: Testing & Polish** ✅
1. Test all share platforms (Facebook, Twitter, Email, Copy)
2. Verify URLs are correct and public
3. Test on mobile and desktop
4. Check accessibility (keyboard navigation, screen readers)
5. Add hover states and animations

---

## 🎨 Component API Design

### **Props Interface**
```typescript
interface SocialShareButtonsProps {
  // Required
  memorialName: string;
  memorialUrl: string;
  
  // Optional styling
  variant?: 'full' | 'compact' | 'icons-only';
  theme?: 'memorial' | 'light' | 'dark';
  showLabel?: boolean;
  
  // Optional behavior
  onShare?: (platform: string) => void;
  className?: string;
  
  // Privacy
  isPublic?: boolean; // Hide component if false
}
```

### **Usage Examples**

#### **Memorial Page (Full)**
```svelte
<SocialShareButtons
  memorialName={memorial.lovedOneName}
  memorialUrl="https://tributestream.com/{fullSlug}"
  variant="full"
  theme="memorial"
  showLabel={true}
  isPublic={memorial.isPublic}
/>
```

#### **Profile Page (Compact)**
```svelte
<SocialShareButtons
  memorialName={memorial.lovedOneName}
  memorialUrl="https://tributestream.com/{memorial.fullSlug}"
  variant="icons-only"
  theme="light"
  showLabel={false}
/>
```

#### **Schedule Receipt (Full with CTA)**
```svelte
<div class="share-section">
  <h3>Share This Memorial</h3>
  <p>Invite family and friends to view the memorial</p>
  <SocialShareButtons
    memorialName={memorial.lovedOneName}
    memorialUrl="https://tributestream.com/{memorial.fullSlug}"
    variant="full"
  />
</div>
```

---

## 🎭 Messaging Guidelines

### **Do's ✅**
- "Share this memorial"
- "Invite family and friends"
- "Spread the word"
- "Let others know"

### **Don'ts ❌**
- "Promote this memorial" (too commercial)
- "Get more views" (insensitive)
- "Go viral" (inappropriate)
- "Market this service" (wrong tone)

---

## 🔄 Future Enhancements

### **Phase 2 Features** (Post-MVP)
- QR code generation for print materials
- Embeddable widgets for funeral home websites
- Custom share images (Open Graph)
- Memorial service reminders (calendar integration)
- Guest book sharing prompt

### **Analytics Dashboard**
- Share count by platform
- Memorial reach metrics
- Referral sources
- Attendance correlation

---

## 📋 Checklist

### **Before Implementation**
- [ ] Review design with stakeholders
- [ ] Confirm social media platform selection
- [ ] Verify memorial URL structure
- [ ] Check privacy/GDPR compliance
- [ ] Design share button icons/colors

### **During Implementation**
- [ ] Create `SocialShareButtons.svelte` component
- [ ] Implement share URL logic for each platform
- [ ] Add copy-to-clipboard with notification
- [ ] Style with gold theme
- [ ] Make responsive (mobile/desktop)
- [ ] Add to Memorial page below video
- [ ] Add to Schedule paid/receipt page
- [ ] Add to Profile memorial cards
- [ ] Test all share links
- [ ] Test accessibility

### **After Implementation**
- [ ] QA testing on all platforms
- [ ] Mobile testing (iOS/Android)
- [ ] Browser compatibility check
- [ ] User acceptance testing
- [ ] Monitor analytics (optional)
- [ ] Gather user feedback

---

## 🎯 Expected Outcomes

### **Business Impact**
- Increased memorial visibility
- More service attendees (live and virtual)
- Enhanced family engagement
- Organic growth through referrals
- Professional image for funeral homes

### **User Benefits**
- Easy invitation distribution
- One-click sharing
- Multiple platform options
- Privacy-respecting
- Professional memorial presentation

---

## 📞 Support & Maintenance

### **User Support**
- FAQ: "How do I share my memorial?"
- Troubleshooting guide for share issues
- Privacy settings documentation

### **Technical Maintenance**
- Monitor share link functionality
- Update social media APIs if changed
- Track and fix broken share links
- Update privacy policies as needed

---

**Status:** 📝 Planning Complete - Ready for Implementation  
**Next Step:** Create `SocialShareButtons.svelte` component  
**Estimated Time:** 3-4 hours for full implementation  
**Priority:** Medium (Quality of Life feature)

---

**Last Updated:** 2025-11-12  
**Document Version:** 1.0  
**Author:** Development Team

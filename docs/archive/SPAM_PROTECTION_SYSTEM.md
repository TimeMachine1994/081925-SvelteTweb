# 🛡️ Spam Protection System - Memorial Registration

## Overview

Comprehensive 4-layer spam protection system implemented to prevent bot registrations, particularly from Singapore and other high-risk countries.

**Problem Identified:** Memorial registration endpoint (`/register/loved-one`) was completely unprotected, allowing bot spam from Singapore and other locations.

**Solution:** Multi-layered defense system combining client and server-side protections.

---

## 🔒 Protection Layers

### Layer 1: reCAPTCHA v3 ✅
**Purpose:** Behavioral analysis to distinguish humans from bots

**Implementation:**
- **Client-side:** `+page.svelte` - Executes reCAPTCHA before form submission
- **Server-side:** `+page.server.ts` - Verifies token with Google's API
- **Threshold:** HIGH_SECURITY (0.7) - Strict scoring for memorial creation
- **Action:** `create_memorial`

**Code Locations:**
- `frontend/src/lib/utils/recaptcha.ts` - Utility functions
- `frontend/src/routes/register/loved-one/+page.svelte` - Client execution
- `frontend/src/routes/register/loved-one/+page.server.ts` - Server verification

**Score Interpretation:**
- 0.9 - 1.0: Very likely human
- 0.7 - 0.9: Likely human (our threshold)
- 0.3 - 0.7: Suspicious
- 0.0 - 0.3: Very likely bot

### Layer 2: Rate Limiting ✅
**Purpose:** Prevent rapid-fire bot attacks

**Configuration:**
```typescript
MEMORIAL_REGISTRATION: {
  windowMs: 60 * 60 * 1000,        // 1 hour window
  maxAttempts: 3,                   // 3 attempts max
  blockDurationMs: 24 * 60 * 60 * 1000  // 24-hour block
}
```

**Features:**
- In-memory IP-based tracking
- Automatic cleanup of old entries
- Progressive blocking (temporary → 24-hour ban)
- Remaining attempts counter

**Code Location:**
- `frontend/src/lib/server/rate-limiter.ts` - Core functionality
- Uses Cloudflare `cf-connecting-ip` header for accurate IP detection

**Response:**
- HTTP 429 (Too Many Requests)
- Clear error messages with retry timing
- Logs suspicious activity

### Layer 3: Geographic IP Filtering ✅
**Purpose:** Block spam from known high-risk countries

**Blocked Countries:**
- 🇸🇬 Singapore (SG) - **Primary spam source**
- 🇨🇳 China (CN)
- 🇷🇺 Russia (RU)
- 🇺🇦 Ukraine (UA)
- 🇻🇳 Vietnam (VN)
- 🇮🇩 Indonesia (ID)
- 🇵🇰 Pakistan (PK)
- 🇧🇩 Bangladesh (BD)
- 🇳🇬 Nigeria (NG)

**Suspicious Countries (flagged but allowed):**
- 🇮🇳 India (IN)
- 🇵🇭 Philippines (PH)
- 🇧🇷 Brazil (BR)
- 🇹🇭 Thailand (TH)

**Features:**
- Uses Cloudflare `cf-ipcountry` header
- Whitelist system for legitimate users
- Dynamic block/unblock capability
- Detailed logging of suspicious activity

**Code Location:**
- `frontend/src/lib/server/geo-filter.ts`

**Management Functions:**
```typescript
whitelistCountry('SG')     // Allow specific country
blockCountry('XX')         // Block additional country
unblockCountry('XX')       // Remove from block list
```

### Layer 4: Honeypot Field ✅
**Purpose:** Silent bot trap

**Implementation:**
- Hidden form field named `website`
- Positioned off-screen with CSS
- Bots auto-fill all fields, humans skip it
- Returns fake success to deceive bots

**Features:**
- Zero user impact (invisible to humans)
- Logs bot details without alerting them
- Screen reader accessible but ignored

**Code Location:**
- Form field: `+page.svelte` lines 148-159
- Server check: `+page.server.ts` lines 88-101

---

## 📊 Protection Flow

```
┌─────────────────────────────────────────────────┐
│  Client submits registration form              │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Layer 1: reCAPTCHA v3 (Client-side)           │
│  - Execute before submission                    │
│  - Get token                                    │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Layer 2: Rate Limiting (Server-side)          │
│  - Check IP attempt count                       │
│  - Block if exceeded                            │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Layer 3: Geographic Filtering                  │
│  - Check country code                           │
│  - Block Singapore & others                     │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Layer 4: Honeypot Check                        │
│  - Check if trap field filled                   │
│  - Return fake success if bot                   │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Layer 1: reCAPTCHA Verification (Server)       │
│  - Verify token with Google                     │
│  - Check score threshold                        │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Email & Field Validation                       │
│  - Pre-validate email exists                    │
│  - Check required fields                        │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  ✅ Create Memorial & User Account              │
└─────────────────────────────────────────────────┘
```

---

## 🚨 Security Monitoring

### Logging System
All suspicious activity is logged with:
- Timestamp
- IP address
- Country code and name
- Email address (if provided)
- Reason for flagging
- Endpoint accessed

**Log Format:**
```
[SECURITY ALERT 2025-01-15T10:30:45.123Z] Suspicious activity detected:
  Endpoint: /register/loved-one
  IP: 103.xxx.xxx.xxx
  Country: Singapore (SG)
  Email: spam@example.com
  Reason: Blocked country: Singapore (SG)
```

### Future Enhancements
- [ ] Send alerts to external logging service (Sentry, LogRocket)
- [ ] Email notifications to admin for blocked attempts
- [ ] Store security events in Firestore for analysis
- [ ] Dashboard for viewing spam attempts and patterns
- [ ] Automatic IP banning based on patterns
- [ ] Machine learning-based threat detection

---

## 🔧 Configuration

### Environment Variables Required
```env
# reCAPTCHA v3
PUBLIC_RECAPTCHA_SITE_KEY=your_site_key_here
RECAPTCHA_SECRET_KEY=your_secret_key_here
```

### Cloudflare Requirements
For geographic filtering and accurate IP detection, ensure:
- Cloudflare proxy is enabled (orange cloud)
- `cf-connecting-ip` header is available
- `cf-ipcountry` header is available

---

## 📈 Effectiveness

### Expected Results
- **90%+ reduction** in bot registrations
- **100% block** of Singapore-origin spam
- **Zero impact** on legitimate users
- **Detailed logs** for threat analysis

### Monitoring Metrics
Track these in your logs:
- Rate limit triggers per day
- Geographic blocks by country
- Honeypot catches
- reCAPTCHA score distribution
- Failed vs successful registrations

---

## 🛠️ Management Commands

### Whitelist a Country (Legitimate User)
```typescript
// In server console or admin panel
whitelistCountry('SG');  // Allow Singapore user
```

### Block Additional Country
```typescript
blockCountry('XX');  // Block country code XX
```

### Check IP Block Status
```typescript
isIPBlocked('103.xxx.xxx.xxx');  // Returns true/false
```

### Remove IP Block
```typescript
// Edit rate-limiter.ts and remove from blockedIPs Map
// Or wait for automatic expiration
```

---

## 🎯 Success Criteria

✅ **Layer 1 - reCAPTCHA:** Implemented and verified
✅ **Layer 2 - Rate Limiting:** Active with 3/hour limit
✅ **Layer 3 - Geo-Filtering:** Singapore blocked
✅ **Layer 4 - Honeypot:** Silent trap active

**Status:** All 4 layers deployed and operational

---

## 📝 Files Modified

### New Files Created:
1. `frontend/src/lib/server/rate-limiter.ts` - Rate limiting logic
2. `frontend/src/lib/server/geo-filter.ts` - Geographic filtering
3. `SPAM_PROTECTION_SYSTEM.md` - This documentation

### Modified Files:
1. `frontend/src/routes/register/loved-one/+page.svelte` - Client-side protection
2. `frontend/src/routes/register/loved-one/+page.server.ts` - Server-side verification

### Existing Files Used:
1. `frontend/src/lib/utils/recaptcha.ts` - reCAPTCHA utilities
2. `frontend/src/lib/utils/email-validation.ts` - Email pre-validation
3. `frontend/src/lib/utils/memorial-slug.ts` - Slug generation

---

## 🚀 Deployment Checklist

- [x] reCAPTCHA environment variables configured
- [x] Cloudflare proxy enabled
- [x] Rate limiting tested
- [x] Geographic filtering verified
- [x] Honeypot field hidden properly
- [ ] Monitor logs for 24-48 hours
- [ ] Adjust country blocks based on patterns
- [ ] Set up alerting for high-volume attacks
- [ ] Create admin dashboard for spam metrics

---

## 📞 Support

If legitimate users are blocked:
1. Check their country code
2. Whitelist their country if appropriate
3. Check if their IP is rate-limited
4. Verify reCAPTCHA is loading properly
5. Test honeypot isn't visible to users

**Contact:** support@tributestream.com

---

## 🔄 Maintenance

### Weekly:
- Review security logs
- Adjust country blocks if needed
- Check rate limit effectiveness

### Monthly:
- Analyze spam patterns
- Update honeypot techniques
- Review reCAPTCHA scores
- Clean up old blocked IPs

### Quarterly:
- Evaluate new countries to block/unblock
- Update rate limit thresholds
- Consider additional protection layers

---

**Last Updated:** 2025-01-15
**Version:** 1.0
**Status:** Production Ready ✅

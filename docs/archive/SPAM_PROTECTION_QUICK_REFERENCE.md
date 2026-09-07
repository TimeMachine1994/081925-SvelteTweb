# 🛡️ Spam Protection - Quick Reference Guide

## 🚨 Emergency: Legitimate User Blocked

### If user from Singapore (or other blocked country) needs access:

**Option 1: Whitelist their country temporarily**
```typescript
// Add to +page.server.ts at top of action
import { whitelistCountry } from '$lib/server/geo-filter';

// In a safe place (e.g., admin endpoint):
whitelistCountry('SG'); // Allows Singapore
```

**Option 2: Give them direct registration link**
Direct them to contact support with proof of legitimacy.

---

## 📊 Check Current Protection Status

### View Blocked Countries
Look in: `frontend/src/lib/server/geo-filter.ts`
```typescript
const BLOCKED_COUNTRIES = new Set([
  'SG', // Singapore
  'CN', // China
  'RU', // Russia
  // ... etc
]);
```

### Check Rate Limits
Look in: `frontend/src/lib/server/rate-limiter.ts`
```typescript
MEMORIAL_REGISTRATION: {
  windowMs: 60 * 60 * 1000,        // 1 hour
  maxAttempts: 3,                   // 3 attempts
  blockDurationMs: 24 * 60 * 60 * 1000  // 24 hours
}
```

---

## 🔧 Common Adjustments

### 1. Too Strict - Blocking Legitimate Users

**Increase rate limit:**
```typescript
// In rate-limiter.ts
MEMORIAL_REGISTRATION: {
  maxAttempts: 5,  // Changed from 3 to 5
  // ... rest
}
```

**Lower reCAPTCHA threshold:**
```typescript
// In recaptcha.ts
RECAPTCHA_THRESHOLDS = {
  HIGH_SECURITY: 0.5,  // Changed from 0.7
}
```

**Remove country from block list:**
```typescript
// In geo-filter.ts, remove from BLOCKED_COUNTRIES
unblockCountry('XX');
```

### 2. Too Lenient - Still Getting Spam

**Decrease rate limit:**
```typescript
MEMORIAL_REGISTRATION: {
  maxAttempts: 2,  // More strict
  windowMs: 2 * 60 * 60 * 1000,  // 2 hours instead of 1
}
```

**Increase reCAPTCHA threshold:**
```typescript
RECAPTCHA_THRESHOLDS = {
  HIGH_SECURITY: 0.8,  // Higher threshold
}
```

**Add more countries to block list:**
```typescript
blockCountry('XX');  // In geo-filter.ts
```

---

## 📝 View Security Logs

Check your console output for:
```
🛡️ - Protection layer triggered
✅ - Check passed
❌ - Verification failed
⚠️ - Warning/suspicious activity
🚫 - Blocked/rejected
🌍 - Geographic information
📍 - IP address logged
🍯 - Honeypot triggered
```

### Security Alert Format:
```
[SECURITY ALERT 2025-01-15T10:30:45.123Z] Suspicious activity detected:
  Endpoint: /register/loved-one
  IP: xxx.xxx.xxx.xxx
  Country: Singapore (SG)
  Email: example@email.com
  Reason: Blocked country
```

---

## 🎯 Testing the System

### Test reCAPTCHA:
1. Open developer console
2. Submit form
3. Look for: `"🤖 Executing reCAPTCHA verification..."`
4. Should see: `"✅ reCAPTCHA verified. Score: X.X"`

### Test Rate Limiting:
1. Submit 4 registrations from same IP
2. 4th attempt should be blocked with 429 error
3. Message: "Too many registration attempts..."

### Test Geographic Blocking:
1. Use VPN to Singapore
2. Submit registration
3. Should be blocked with 403 error
4. Message: "Registration from your location is currently not available..."

### Test Honeypot:
1. Inspect page source
2. Fill the `website` field (off-screen)
3. Submit form
4. Should return fake success
5. Check logs for: `"🚫 BOT DETECTED! Honeypot field filled"`

---

## 🔐 Environment Variables

Ensure these are set:
```env
PUBLIC_RECAPTCHA_SITE_KEY=6Le...your_key
RECAPTCHA_SECRET_KEY=6Le...your_secret
```

**Test reCAPTCHA keys work:**
- Visit: https://www.google.com/recaptcha/admin
- Check site key is active
- Verify domain is authorized

---

## 📊 Monitoring Checklist

### Daily (First Week):
- [ ] Check logs for blocked attempts
- [ ] Verify legitimate users can register
- [ ] Monitor spam reduction
- [ ] Check for false positives

### Weekly:
- [ ] Review country block effectiveness
- [ ] Check rate limit triggers
- [ ] Analyze reCAPTCHA scores
- [ ] Adjust thresholds if needed

### Monthly:
- [ ] Evaluate new spam patterns
- [ ] Update country lists
- [ ] Review honeypot effectiveness
- [ ] Consider additional protections

---

## 🆘 Troubleshooting

### "Security verification failed"
**Cause:** reCAPTCHA not loading or failing
**Fix:** 
- Check environment variables
- Verify domain in reCAPTCHA admin
- Check browser console for errors

### "Too many registration attempts"
**Cause:** Rate limit triggered
**Fix:**
- Wait for block to expire
- Increase `maxAttempts` in rate-limiter.ts
- Whitelist specific IP (not recommended)

### "Registration from your location not available"
**Cause:** Country is blocked
**Fix:**
- Whitelist country temporarily
- Have user contact support
- Use VPN for testing only

### Honeypot catching real users
**Cause:** Field visible or auto-filled by browser
**Fix:**
- Verify CSS hiding is working
- Check if browser extensions filling forms
- Adjust honeypot field name/attributes

---

## 📞 Quick Actions

### Allow Specific Country:
```typescript
whitelistCountry('SG');
```

### Block New Country:
```typescript
blockCountry('XX');
```

### Check IP Status:
```typescript
isIPBlocked('103.xxx.xxx.xxx');
```

### View Blocked Time:
```typescript
getBlockedTimeRemaining('103.xxx.xxx.xxx');
```

---

## 🎓 Understanding Protection Layers

**Layer 1: reCAPTCHA** = Behavioral analysis (mouse movements, clicks)
**Layer 2: Rate Limiting** = Stops rapid attacks
**Layer 3: Geo-Filtering** = Blocks high-risk countries
**Layer 4: Honeypot** = Silent bot trap

**All must pass for registration to succeed.**

---

## 📄 Full Documentation
See: `SPAM_PROTECTION_SYSTEM.md` for complete technical details.

---

**Emergency Contact:** support@tributestream.com
**Last Updated:** 2025-01-15

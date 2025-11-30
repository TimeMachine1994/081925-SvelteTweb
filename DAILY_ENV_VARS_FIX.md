# Daily.co Environment Variables Fix 🔧

**Issue:** Switcher throwing 500 error because environment variables are not set on Vercel.

---

## ✅ Solution: Add Environment Variables to Vercel

### 1. **Go to Vercel Dashboard**
```
https://vercel.com/dashboard
→ Select your project
→ Settings tab
→ Environment Variables section
```

### 2. **Add These Two Variables**

| Variable Name | Example Value | Required For |
|--------------|---------------|--------------|
| `PRIVATE_DAILY_API_KEY` | `abc123...` | All environments |
| `PRIVATE_DAILY_DOMAIN` | `xyz.daily.co` | All environments |

**Important:** Use the `PRIVATE_` prefix! SvelteKit requires this for server-side variables.

### 3. **Get Your Daily.co Credentials**

**Get API Key:**
1. Go to https://dashboard.daily.co/developers
2. Copy your **API Key**
3. Paste it as the value for `PRIVATE_DAILY_API_KEY`

**Get Domain:**
1. Check your Daily.co dashboard URL
2. Your domain looks like: `your-subdomain.daily.co`
3. Paste it as the value for `PRIVATE_DAILY_DOMAIN`

### 4. **Select Environments**

For each variable, check:
- ✅ Production
- ✅ Preview
- ✅ Development

This ensures the variables work in all deployments.

### 5. **Redeploy**

After adding variables, trigger a redeploy:

**Option A: Via Git**
```bash
git commit --allow-empty -m "Trigger redeploy with Daily.co env vars"
git push
```

**Option B: Via Vercel Dashboard**
1. Go to **Deployments** tab
2. Find latest deployment
3. Click **⋯** menu → **Redeploy**

---

## 🧪 Verify It's Working

After redeployment, check the logs:

### ✅ Success Logs (What you want to see):
```
✅ [SWITCHER MODULE] Daily.co configuration loaded successfully!
   Domain: your-domain.daily.co
   API Key: CONFIGURED (first 15 chars: abc123...)
```

### ❌ Error Logs (What you're seeing now):
```
❌❌❌ [SWITCHER] Daily.co is NOT CONFIGURED!
   PRIVATE_DAILY_API_KEY: ❌ MISSING
   PRIVATE_DAILY_DOMAIN: ❌ MISSING
⚠️ THROWING 500 ERROR NOW...
```

---

## 🏠 Local Development

If you want to test locally, update your `frontend/.env` file:

```bash
# frontend/.env
PRIVATE_DAILY_API_KEY=your_daily_api_key_here
PRIVATE_DAILY_DOMAIN=your-domain.daily.co
```

Then restart your dev server:
```bash
npm run dev
```

---

## 📝 What Changed

**Before (Wrong):**
```
DAILY_API_KEY=...
DAILY_DOMAIN=...
```

**After (Correct):**
```
PRIVATE_DAILY_API_KEY=...
PRIVATE_DAILY_DOMAIN=...
```

**Why?** SvelteKit requires the `PRIVATE_` prefix for any environment variables that should only be available on the server-side (not exposed to the browser).

---

## 🎬 Test the Switcher

After adding the environment variables and redeploying:

1. Go to admin memorial page: `/admin/services/memorials/[id]`
2. Click **"Create Livestream & Launch Switcher"**
3. Switcher should open (not 500 error!)
4. You should see:
   - Daily.co room created
   - 4 QR codes for phone sources
   - Video switcher interface

---

## ❓ Troubleshooting

### Still getting 500 error?

**Check 1: Variables are set correctly**
- Go to Vercel → Settings → Environment Variables
- Confirm both `PRIVATE_DAILY_API_KEY` and `PRIVATE_DAILY_DOMAIN` exist
- Confirm they're enabled for Production, Preview, and Development

**Check 2: Redeployment completed**
- Go to Vercel → Deployments
- Confirm latest deployment shows "Ready"
- Click on deployment to see build logs

**Check 3: API Key is valid**
- Go to https://dashboard.daily.co/developers
- Confirm your API key is active
- Try regenerating a new API key if needed

**Check 4: Domain is correct**
- Your domain should look like: `subdomain.daily.co`
- Don't include `https://` or trailing slashes
- Example: ✅ `abc123.daily.co` ❌ `https://abc123.daily.co/`

### Check Vercel Logs

To see detailed error logs:
1. Go to Vercel → Your Project
2. Click on latest deployment
3. Click **"Functions"** tab
4. Find the switcher function
5. Click to view logs
6. Look for `❌ [SWITCHER]` error messages

---

## 🎯 Expected Flow After Fix

1. ✅ Click "Create Livestream & Launch Switcher"
2. ✅ Stream created in database
3. ✅ Switcher page loads (no 500 error)
4. ✅ Daily.co room created automatically
5. ✅ QR codes displayed for 4 phone sources
6. ✅ Admin can start switching between cameras

---

**Status:** Ready to deploy once environment variables are added! 🚀

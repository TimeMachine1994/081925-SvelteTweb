# 🚀 Production Deployment Checklist - Mux Integration

## ✅ **PRE-DEPLOYMENT CHECKLIST**

### **1. Environment Variables (CRITICAL)**
Make sure these are set in your production environment:

```env
# Mux API Credentials (REQUIRED)
MUX_TOKEN_ID=your_production_mux_token_id
MUX_TOKEN_SECRET=your_production_mux_token_secret
MUX_WEBHOOK_SECRET=your_production_webhook_secret

# Existing variables (keep these)
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
# ... other existing env vars
```

### **2. Mux Webhook Configuration**
Configure webhook in Mux Dashboard:
- **URL**: `https://your-production-domain.com/api/webhooks/mux`
- **Events**: 
  - `video.live_stream.active`
  - `video.live_stream.idle` 
  - `video.asset.ready`
- **Secret**: Use the same value as `MUX_WEBHOOK_SECRET`

### **3. Build Verification**
✅ **Build completed successfully** (confirmed)
✅ **All TypeScript errors resolved**
✅ **Debug endpoints removed**
✅ **Production logging cleaned up**

---

## 🎯 **DEPLOYMENT PLATFORMS**

### **Vercel Deployment:**
```bash
# Set environment variables in Vercel dashboard
vercel env add MUX_TOKEN_ID
vercel env add MUX_TOKEN_SECRET  
vercel env add MUX_WEBHOOK_SECRET

# Deploy
vercel --prod
```

### **Netlify Deployment:**
```bash
# Set in Netlify dashboard: Site settings > Environment variables
# Then deploy normally
```

### **Other Platforms:**
Ensure environment variables are set in your platform's configuration.

---

## 🧪 **POST-DEPLOYMENT TESTING**

### **1. Test Browser Streaming**
1. Create a test memorial
2. Create a test stream
3. Try "Stream from Browser" 
4. **Expected**: Should connect to Mux successfully
5. **Expected**: Stream should bridge to Cloudflare RTMP

### **2. Check Logs**
Monitor for these success messages:
```
✅ [MUX_BRIDGE] Bridge started successfully
✅ [BROWSER_STREAM] Successfully connected to Mux WebRTC
```

### **3. Verify Recording**
- Stream should appear in Cloudflare Stream dashboard
- Recording should be available after stream ends

---

## 🚨 **TROUBLESHOOTING**

### **If Streaming Fails:**

#### **Error: "Mux integration not configured"**
- ✅ Check environment variables are set in production
- ✅ Restart/redeploy application
- ✅ Verify variable names are exact: `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`

#### **Error: "Bridge start failed: 500"**
- ✅ Check Mux API credentials are valid
- ✅ Verify Mux account has sufficient credits
- ✅ Check production logs for detailed error

#### **Error: "Stream not found"**
- ✅ Ensure stream exists in database
- ✅ Check user permissions
- ✅ Verify stream has `cloudflareInputId`

---

## 📊 **MONITORING**

### **Key Metrics to Watch:**
- **Stream Success Rate**: Should be >95%
- **Mux API Response Time**: Should be <2s
- **Recording Success Rate**: Should be >99%

### **Log Monitoring:**
Watch for these patterns:
- `🌉 [BRIDGE_START]` - Bridge requests
- `✅ [MUX_BRIDGE]` - Successful bridges
- `❌ [MUX_BRIDGE]` - Failed bridges (investigate)

---

## 💰 **COST MONITORING**

### **Expected Mux Costs:**
- **Live Streaming**: ~$0.005/minute input
- **Storage**: ~$0.0021/GB/month
- **Typical 2-hour memorial**: ~$0.60

### **Cost Alerts:**
Set up billing alerts in Mux dashboard for unexpected usage.

---

## 🎉 **SUCCESS CRITERIA**

### **Deployment Successful When:**
- ✅ Browser streaming works without errors
- ✅ Streams automatically record via Mux bridge
- ✅ Memorial pages show streams correctly
- ✅ No console errors related to Mux
- ✅ Webhook events are received (check Mux dashboard)

---

## 🔄 **ROLLBACK PLAN**

### **If Issues Occur:**
1. **Immediate**: Disable Mux feature flag if implemented
2. **Alternative**: Revert to previous deployment
3. **Debug**: Check logs and fix issues
4. **Redeploy**: Once issues resolved

---

## 📞 **SUPPORT CONTACTS**

### **If You Need Help:**
- **Mux Support**: support@mux.com
- **Documentation**: https://docs.mux.com/
- **Status Page**: https://status.mux.com/

---

**🚀 You're ready for production! The Mux integration will provide enterprise-grade guaranteed recording for all memorial streams.**

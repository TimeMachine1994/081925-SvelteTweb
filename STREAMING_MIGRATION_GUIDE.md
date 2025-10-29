# Streaming Methods Migration Guide

**Version:** 2.0  
**Date:** October 29, 2025  
**Breaking Changes:** None (fully backward compatible)

---

## 🎯 Overview

This guide helps migrate from the old single-method streaming system to the new multi-method streaming architecture.

**Good News:** Migration is **100% optional** - existing streams continue working without any changes!

---

## 🔄 What Changed?

### **Before (Single Method)**
```typescript
Stream {
  rtmpUrl: string
  streamKey: string
  // Only RTMP streaming supported
}
```

### **After (Three Methods)**
```typescript
Stream {
  streamingMethod?: 'obs' | 'phone-to-obs' | 'phone-to-mux'
  methodConfigured?: boolean
  
  // OBS Method (same as before)
  rtmpUrl?: string
  streamKey?: string
  
  // Phone to OBS Method
  phoneSourceStreamId?: string
  phoneSourcePlaybackUrl?: string
  phoneSourceWhipUrl?: string
  
  // Phone to MUX Method
  muxStreamId?: string
  muxStreamKey?: string
  muxPlaybackId?: string
  restreamingEnabled?: boolean
}
```

---

## ✅ Backward Compatibility

### **Existing Streams Automatically Work**

The system detects legacy streams using this logic:

```typescript
// Legacy stream detection
const isLegacyStream = 
  !stream.methodConfigured && 
  stream.rtmpUrl && 
  stream.streamKey;

// Legacy streams automatically treated as OBS method
const effectiveStreamingMethod = 
  stream.streamingMethod || (isLegacyStream ? 'obs' : undefined);
```

**Result:** Old streams display OBS credentials UI without requiring any updates.

---

## 📊 Migration Scenarios

### **Scenario 1: Do Nothing (Recommended)**

**Best for:** Existing deployments with active streams

**Action Required:** None

**What Happens:**
- Existing streams continue working
- Users see OBS credentials as before
- New streams get method selection
- Old and new streams coexist peacefully

**Pros:**
- ✅ Zero risk
- ✅ No downtime
- ✅ No user impact

**Cons:**
- ⚠️ Existing streams don't get new features
- ⚠️ Database inconsistency (some streams have method, some don't)

---

### **Scenario 2: Explicit Migration Script**

**Best for:** Clean data model, want consistent database

**Action Required:** Run migration script

```javascript
// scripts/migrate-streaming-methods.js
import { adminDb } from '$lib/server/firebase';

async function migrateStreams() {
  console.log('🔄 Starting stream migration...');
  
  const streams = await adminDb.collection('streams').get();
  let migrated = 0;
  let skipped = 0;
  
  for (const doc of streams.docs) {
    const stream = doc.data();
    
    // Skip if already migrated
    if (stream.methodConfigured) {
      skipped++;
      continue;
    }
    
    // Migrate if has RTMP credentials
    if (stream.rtmpUrl && stream.streamKey) {
      await doc.ref.update({
        streamingMethod: 'obs',
        methodConfigured: true,
        updatedAt: new Date().toISOString()
      });
      
      console.log(`✅ Migrated stream ${doc.id} to OBS method`);
      migrated++;
    } else {
      console.log(`⚠️  Stream ${doc.id} has no credentials, skipping`);
      skipped++;
    }
  }
  
  console.log(`\n📊 Migration complete:`);
  console.log(`   Migrated: ${migrated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${streams.size}`);
}

migrateStreams()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
```

**Run Migration:**
```bash
cd scripts
node migrate-streaming-methods.js
```

**Pros:**
- ✅ Clean, consistent database
- ✅ All streams have explicit method
- ✅ Easier future maintenance

**Cons:**
- ⚠️ Requires database write access
- ⚠️ Should test on staging first
- ⚠️ Takes time for large datasets

---

### **Scenario 3: Gradual Migration**

**Best for:** Risk-averse deployments, prefer organic transition

**Action Required:** Let users migrate naturally

**What Happens:**
1. Deploy new code
2. Existing streams work as-is (legacy mode)
3. Users create new streams → get method selection
4. Users can manually recreate old streams with new methods if desired
5. Over time, more streams use new system

**Timeline:** Months to years for complete migration

**Pros:**
- ✅ Zero risk
- ✅ Users choose when to adopt
- ✅ Natural transition

**Cons:**
- ⚠️ Long migration period
- ⚠️ Mixed system for extended time

---

## 🔧 Migration Steps (Scenario 2)

### **Step 1: Backup Database**

```bash
# Export Firestore data
firebase firestore:export gs://your-bucket/backups/streams-backup-$(date +%Y%m%d)

# Or use Firestore console to create backup
```

### **Step 2: Test on Staging**

```bash
# Deploy to staging environment
npm run deploy:staging

# Run migration script on staging
node scripts/migrate-streaming-methods.js --env=staging

# Verify streams still work
# Check stream manager UI
# Test OBS streaming
```

### **Step 3: Run on Production**

```bash
# Deploy to production
npm run deploy:production

# Wait for deployment to complete and verify

# Run migration script
node scripts/migrate-streaming-methods.js --env=production

# Monitor for errors
```

### **Step 4: Verify Migration**

```bash
# Check stream counts
# Query Firestore console:
# streams where methodConfigured == true

# Test sample streams:
# - View in UI
# - Copy credentials
# - Test streaming
```

---

## 📝 Migration Checklist

### **Pre-Migration**
- [ ] Review all affected streams
- [ ] Backup Firestore database
- [ ] Test migration script on staging
- [ ] Verify backward compatibility
- [ ] Plan rollback strategy
- [ ] Schedule maintenance window (if needed)

### **Migration**
- [ ] Deploy new code to production
- [ ] Verify deployment successful
- [ ] Run migration script
- [ ] Monitor logs for errors
- [ ] Check sample streams manually

### **Post-Migration**
- [ ] Verify all streams accessible
- [ ] Test streaming functionality
- [ ] Check analytics/metrics
- [ ] Update documentation
- [ ] Notify users of new features
- [ ] Monitor support tickets

---

## 🚨 Rollback Plan

### **If Migration Fails:**

**Option 1: Revert Migration (Preferred)**
```javascript
// scripts/revert-streaming-migration.js
async function revertMigration() {
  const streams = await adminDb.collection('streams')
    .where('streamingMethod', '==', 'obs')
    .where('methodConfigured', '==', true)
    .get();
  
  for (const doc of streams.docs) {
    await doc.ref.update({
      streamingMethod: null,
      methodConfigured: null
    });
  }
}
```

**Option 2: Restore from Backup**
```bash
# Restore Firestore from backup
firebase firestore:import gs://your-bucket/backups/streams-backup-20251029
```

**Option 3: Redeploy Previous Version**
```bash
# Redeploy last known good version
git checkout <previous-commit>
npm run deploy:production
```

---

## 🔍 Verification Queries

### **Check Migration Status**

```javascript
// Firestore console or admin script
const total = await adminDb.collection('streams').count().get();
const migrated = await adminDb.collection('streams')
  .where('methodConfigured', '==', true)
  .count().get();
const legacy = total.data().count - migrated.data().count;

console.log(`Total streams: ${total.data().count}`);
console.log(`Migrated: ${migrated.data().count}`);
console.log(`Legacy: ${legacy}`);
console.log(`Migration: ${(migrated.data().count / total.data().count * 100).toFixed(1)}%`);
```

### **Find Streams Needing Migration**

```javascript
const needsMigration = await adminDb.collection('streams')
  .where('methodConfigured', '==', false)
  .get();

console.log('Streams needing migration:', needsMigration.size);
needsMigration.forEach(doc => {
  const stream = doc.data();
  console.log(`- ${doc.id}: ${stream.title}`);
});
```

---

## 💡 Best Practices

### **1. Test Thoroughly**
- Always test on staging first
- Manually verify sample streams
- Check edge cases (scheduled, live, completed streams)

### **2. Communicate Changes**
- Notify users before deployment
- Update help documentation
- Provide training materials

### **3. Monitor After Migration**
- Watch error logs
- Check support tickets
- Monitor user feedback

### **4. Document Everything**
- Record migration date
- Note any issues encountered
- Update runbooks

---

## 📚 FAQs

### **Q: Do I have to migrate existing streams?**
**A:** No. Existing streams work automatically without migration.

### **Q: What happens if I don't migrate?**
**A:** Nothing bad. Old streams work normally. New streams get method selection.

### **Q: Can I migrate just some streams?**
**A:** Yes. You can selectively migrate using custom query filters.

### **Q: What if migration fails midway?**
**A:** The migration script is idempotent. You can safely re-run it. Already migrated streams are skipped.

### **Q: Will this break my OBS setup?**
**A:** No. RTMP URLs and stream keys remain unchanged.

### **Q: Do I need to update my frontend code?**
**A:** No. The new components include backward compatibility logic.

### **Q: How do I know if migration was successful?**
**A:** Check Firestore console or use verification queries to count migrated streams.

### **Q: Can I revert the migration?**
**A:** Yes. See the Rollback Plan section above.

---

## 🎯 Recommended Approach

**For Most Deployments:**

1. **Deploy new code** (backward compatible)
2. **Don't run migration script** (let it happen naturally)
3. **Monitor for issues**
4. **Enjoy new features** for new streams
5. **Old streams keep working** indefinitely

**Advantages:**
- Zero risk
- No downtime
- No user impact
- Gradual adoption

**Only migrate explicitly if:**
- You need database consistency
- You have analytics requiring method field
- You want to deprecate legacy mode eventually

---

## ✅ Migration Complete Verification

After migration (if you chose to migrate), verify:

- [ ] All streams have `methodConfigured: true`
- [ ] All streams have valid `streamingMethod` value
- [ ] Stream manager UI shows correct method UI
- [ ] Copy buttons work
- [ ] Streaming still functions
- [ ] Recordings still work
- [ ] No console errors
- [ ] No user complaints

---

## 📞 Support

If you encounter issues during migration:

1. Check error logs
2. Review verification queries
3. Test individual streams
4. Consult this guide
5. Contact development team

**Emergency Rollback:** Follow Rollback Plan section above.

---

**Migration = Optional. Backward Compatibility = Guaranteed.**

The new system enhances without disrupting! 🎉

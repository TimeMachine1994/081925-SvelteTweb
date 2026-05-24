#!/usr/bin/env node

/**
 * 🔄 Migration Script: Invitations to Predictable IDs
 * 
 * This script migrates existing invitations from random IDs to predictable IDs
 * Format: {email}_{memorialId}
 * 
 * Features:
 * - Batch processing for large datasets
 * - Comprehensive error handling
 * - Progress tracking and statistics
 * - Dry run mode for testing
 * - Rollback capability
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '../service-account-key.json');

if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ Service account key not found at:', serviceAccountPath);
    console.error('Please ensure you have a valid service account key file');
    process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: serviceAccount.project_id + '.appspot.com'
});

const db = admin.firestore();

// Configuration
const CONFIG = {
    BATCH_SIZE: 500, // Firestore batch limit
    DRY_RUN: process.argv.includes('--dry-run'),
    VERBOSE: process.argv.includes('--verbose'),
    ROLLBACK: process.argv.includes('--rollback')
};

// Statistics tracking
const stats = {
    totalInvitations: 0,
    migrated: 0,
    skipped: 0,
    failed: 0,
    duplicates: 0,
    errors: []
};

/**
 * 📊 Log progress with emoji indicators
 */
function logProgress(message, type = 'info') {
    const emojis = {
        info: '📊',
        success: '✅',
        warning: '⚠️',
        error: '❌',
        processing: '⚙️',
        skip: '⏭️'
    };
    
    console.log(`${emojis[type] || '📝'} ${message}`);
}

/**
 * 🔍 Check if an invitation already exists with the new ID format
 */
async function checkExistingInvitation(email, memorialId) {
    const newId = `${email}_${memorialId}`;
    const doc = await db.collection('invitations').doc(newId).get();
    return doc.exists;
}

/**
 * 🔄 Process a single batch of invitations
 */
async function processBatch(invitations, batchNumber) {
    logProgress(`Processing batch ${batchNumber} (${invitations.length} invitations)...`, 'processing');
    
    const batch = db.batch();
    const processedInvitations = [];
    
    for (const doc of invitations) {
        const data = doc.data();
        const oldId = doc.id;
        
        // Validate required fields
        if (!data.inviteeEmail || !data.memorialId) {
            logProgress(`Skipping invitation ${oldId} - missing required fields`, 'warning');
            stats.skipped++;
            stats.errors.push({
                id: oldId,
                reason: 'Missing inviteeEmail or memorialId',
                data: data
            });
            continue;
        }
        
        const newId = `${data.inviteeEmail}_${data.memorialId}`;
        
        // Check if already using new format
        if (oldId === newId) {
            if (CONFIG.VERBOSE) {
                logProgress(`Invitation ${oldId} already using new format`, 'skip');
            }
            stats.skipped++;
            continue;
        }
        
        // Check for existing invitation with new ID
        const exists = await checkExistingInvitation(data.inviteeEmail, data.memorialId);
        if (exists) {
            logProgress(`Duplicate found: ${newId} already exists`, 'warning');
            stats.duplicates++;
            
            // In non-dry-run mode, we'll delete the old duplicate
            if (!CONFIG.DRY_RUN) {
                batch.delete(doc.ref);
            }
            continue;
        }
        
        // Prepare migration
        processedInvitations.push({
            oldId,
            newId,
            data: {
                ...data,
                migratedAt: admin.firestore.Timestamp.now(),
                migratedFrom: oldId
            }
        });
        
        if (!CONFIG.DRY_RUN) {
            // Create new document with predictable ID
            const newRef = db.collection('invitations').doc(newId);
            batch.set(newRef, {
                ...data,
                migratedAt: admin.firestore.Timestamp.now(),
                migratedFrom: oldId
            });
            
            // Delete old document
            batch.delete(doc.ref);
        }
    }
    
    // Commit batch if not in dry run mode
    if (!CONFIG.DRY_RUN && processedInvitations.length > 0) {
        try {
            await batch.commit();
            logProgress(`Batch ${batchNumber} committed: ${processedInvitations.length} invitations migrated`, 'success');
            stats.migrated += processedInvitations.length;
            
            // Store migration log for potential rollback
            await storeMigrationLog(processedInvitations, batchNumber);
        } catch (error) {
            logProgress(`Batch ${batchNumber} failed: ${error.message}`, 'error');
            stats.failed += processedInvitations.length;
            stats.errors.push({
                batch: batchNumber,
                error: error.message,
                invitations: processedInvitations.map(i => i.oldId)
            });
        }
    } else if (CONFIG.DRY_RUN) {
        logProgress(`[DRY RUN] Would migrate ${processedInvitations.length} invitations in batch ${batchNumber}`, 'info');
        stats.migrated += processedInvitations.length;
        
        if (CONFIG.VERBOSE) {
            processedInvitations.forEach(inv => {
                console.log(`  📝 ${inv.oldId} → ${inv.newId}`);
            });
        }
    }
    
    return processedInvitations;
}

/**
 * 💾 Store migration log for rollback capability
 */
async function storeMigrationLog(migrations, batchNumber) {
    if (CONFIG.DRY_RUN) return;
    
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        batchNumber,
        migrations: migrations.map(m => ({
            oldId: m.oldId,
            newId: m.newId
        }))
    };
    
    // Store in Firestore
    await db.collection('_migrationLogs').add({
        type: 'invitation_id_migration',
        ...logEntry
    });
    
    // Also store locally for safety
    const logDir = path.join(__dirname, 'migration-logs');
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
    
    const logFile = path.join(logDir, `invitation-migration-${timestamp.replace(/[:.]/g, '-')}.json`);
    fs.writeFileSync(logFile, JSON.stringify(logEntry, null, 2));
}

/**
 * ↩️ Rollback migration (if needed)
 */
async function rollbackMigration() {
    logProgress('Starting rollback process...', 'warning');
    
    const logs = await db.collection('_migrationLogs')
        .where('type', '==', 'invitation_id_migration')
        .orderBy('timestamp', 'desc')
        .limit(100)
        .get();
    
    if (logs.empty) {
        logProgress('No migration logs found to rollback', 'warning');
        return;
    }
    
    let rolledBack = 0;
    
    for (const logDoc of logs.docs) {
        const data = logDoc.data();
        const batch = db.batch();
        
        for (const migration of data.migrations) {
            const newDoc = await db.collection('invitations').doc(migration.newId).get();
            
            if (newDoc.exists) {
                const invitationData = newDoc.data();
                delete invitationData.migratedAt;
                delete invitationData.migratedFrom;
                
                // Restore old document
                const oldRef = db.collection('invitations').doc(migration.oldId);
                batch.set(oldRef, invitationData);
                
                // Delete new document
                batch.delete(newDoc.ref);
                rolledBack++;
            }
        }
        
        if (rolledBack > 0) {
            await batch.commit();
            logProgress(`Rolled back ${rolledBack} invitations`, 'success');
        }
    }
    
    logProgress('Rollback complete', 'success');
}

/**
 * 🚀 Main migration function
 */
async function migrateInvitations() {
    console.log('');
    console.log('=========================================');
    console.log('🔄 INVITATION ID MIGRATION SCRIPT');
    console.log('=========================================');
    console.log('');
    
    if (CONFIG.DRY_RUN) {
        console.log('🧪 Running in DRY RUN mode - no changes will be made');
    }
    
    if (CONFIG.ROLLBACK) {
        await rollbackMigration();
        return;
    }
    
    logProgress('Starting invitation migration...', 'info');
    
    try {
        // Count total invitations
        const countSnapshot = await db.collection('invitations').count().get();
        stats.totalInvitations = countSnapshot.data().count;
        logProgress(`Found ${stats.totalInvitations} total invitations`, 'info');
        
        if (stats.totalInvitations === 0) {
            logProgress('No invitations to migrate', 'info');
            return;
        }
        
        // Process in batches
        let lastDoc = null;
        let batchNumber = 0;
        
        while (true) {
            batchNumber++;
            
            let query = db.collection('invitations')
                .orderBy('__name__')
                .limit(CONFIG.BATCH_SIZE);
            
            if (lastDoc) {
                query = query.startAfter(lastDoc);
            }
            
            const snapshot = await query.get();
            
            if (snapshot.empty) {
                break;
            }
            
            await processBatch(snapshot.docs, batchNumber);
            
            lastDoc = snapshot.docs[snapshot.docs.length - 1];
            
            // Progress update
            const processed = stats.migrated + stats.skipped + stats.failed + stats.duplicates;
            const percentage = Math.round((processed / stats.totalInvitations) * 100);
            logProgress(`Progress: ${processed}/${stats.totalInvitations} (${percentage}%)`, 'info');
        }
        
        // Print summary
        console.log('');
        console.log('=========================================');
        console.log('📊 MIGRATION SUMMARY');
        console.log('=========================================');
        console.log(`📁 Total invitations:    ${stats.totalInvitations}`);
        console.log(`✅ Successfully migrated: ${stats.migrated}`);
        console.log(`⏭️  Skipped:              ${stats.skipped}`);
        console.log(`⚠️  Duplicates removed:   ${stats.duplicates}`);
        console.log(`❌ Failed:               ${stats.failed}`);
        
        if (stats.errors.length > 0 && CONFIG.VERBOSE) {
            console.log('');
            console.log('🚨 ERRORS ENCOUNTERED:');
            stats.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${JSON.stringify(error, null, 2)}`);
            });
        }
        
        if (CONFIG.DRY_RUN) {
            console.log('');
            console.log('🧪 This was a DRY RUN - no actual changes were made');
            console.log('   Run without --dry-run flag to perform actual migration');
        }
        
    } catch (error) {
        logProgress(`Migration failed: ${error.message}`, 'error');
        console.error(error);
        process.exit(1);
    }
}

/**
 * 🎯 Entry point
 */
async function main() {
    // Show help if requested
    if (process.argv.includes('--help')) {
        console.log('Usage: node migrate-invitations.js [options]');
        console.log('');
        console.log('Options:');
        console.log('  --dry-run    Simulate migration without making changes');
        console.log('  --verbose    Show detailed progress information');
        console.log('  --rollback   Rollback the last migration');
        console.log('  --help       Show this help message');
        console.log('');
        console.log('Example:');
        console.log('  node migrate-invitations.js --dry-run --verbose');
        process.exit(0);
    }
    
    await migrateInvitations();
    
    console.log('');
    logProgress('Migration script completed', 'success');
    process.exit(0);
}

// Run the script
main().catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
});
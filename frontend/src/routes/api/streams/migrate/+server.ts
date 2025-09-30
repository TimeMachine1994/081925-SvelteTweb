import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb, FieldValue } from '$lib/server/firebase';
import type { MigrationAssessment, MigrationResult } from '$lib/types/stream';

const STREAMS_COLLECTION = 'streams';

/**
 * GET /api/streams/migrate
 * Assess existing data for migration
 */
export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user?.isAdmin && locals.user?.role !== 'admin') {
    return json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    console.log('📊 [MIGRATION] Starting assessment...');

    const assessment: MigrationAssessment = {
      legacyStreams: 0,
      memorialArchives: 0,
      mvpTwoStreams: 0,
      livestreamSessions: 0,
      conflicts: []
    };

    // Count legacy streams (memorial.livestream field)
    const memorialsSnapshot = await adminDb.collection('memorials').get();
    let legacyCount = 0;
    let archiveCount = 0;

    for (const doc of memorialsSnapshot.docs) {
      const data = doc.data();
      
      // Count legacy livestream field
      if (data.livestream && data.livestream.uid) {
        legacyCount++;
      }
      
      // Count archive entries
      if (data.livestreamArchive && Array.isArray(data.livestreamArchive)) {
        archiveCount += data.livestreamArchive.length;
      }
    }

    assessment.legacyStreams = legacyCount;
    assessment.memorialArchives = archiveCount;

    // Count MVP Two streams
    const mvpTwoSnapshot = await adminDb.collection('mvp_two_streams').get();
    assessment.mvpTwoStreams = mvpTwoSnapshot.size;

    // Count livestream sessions (if collection exists)
    try {
      const sessionsSnapshot = await adminDb.collection('livestream_sessions').get();
      assessment.livestreamSessions = sessionsSnapshot.size;
    } catch (error) {
      // Collection might not exist
      assessment.livestreamSessions = 0;
    }

    // Check for conflicts (streams already in new collection)
    const existingStreamsSnapshot = await adminDb.collection(STREAMS_COLLECTION).get();
    if (existingStreamsSnapshot.size > 0) {
      assessment.conflicts.push({
        type: 'existing_streams',
        details: `${existingStreamsSnapshot.size} streams already exist in unified collection`
      });
    }

    console.log('✅ [MIGRATION] Assessment completed:', assessment);

    return json(assessment);

  } catch (error) {
    console.error('❌ [MIGRATION] Assessment error:', error);
    return json({ error: 'Failed to assess migration' }, { status: 500 });
  }
};

/**
 * POST /api/streams/migrate
 * Execute migration from old systems
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user?.isAdmin && locals.user?.role !== 'admin') {
    return json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const { dryRun = true, migrateFrom = [] } = await request.json();
    
    console.log('🚀 [MIGRATION] Starting migration:', { dryRun, migrateFrom });

    const result: MigrationResult = {
      migrated: 0,
      skipped: 0,
      errors: []
    };

    // Migrate MVP Two streams
    if (migrateFrom.includes('mvp_two')) {
      const mvpResult = await migrateMVPTwoStreams(dryRun);
      result.migrated += mvpResult.migrated;
      result.skipped += mvpResult.skipped;
      result.errors.push(...mvpResult.errors);
    }

    // Migrate memorial archives
    if (migrateFrom.includes('memorial_archives')) {
      const archiveResult = await migrateMemorialArchives(dryRun);
      result.migrated += archiveResult.migrated;
      result.skipped += archiveResult.skipped;
      result.errors.push(...archiveResult.errors);
    }

    // Migrate legacy livestreams
    if (migrateFrom.includes('legacy')) {
      const legacyResult = await migrateLegacyLivestreams(dryRun);
      result.migrated += legacyResult.migrated;
      result.skipped += legacyResult.skipped;
      result.errors.push(...legacyResult.errors);
    }

    console.log('✅ [MIGRATION] Completed:', result);

    return json({
      ...result,
      dryRun,
      message: dryRun ? 'Dry run completed - no changes made' : 'Migration completed'
    });

  } catch (error) {
    console.error('❌ [MIGRATION] Error:', error);
    return json({ error: 'Migration failed' }, { status: 500 });
  }
};

/**
 * Migrate MVP Two streams to unified collection
 */
async function migrateMVPTwoStreams(dryRun: boolean): Promise<MigrationResult> {
  const result: MigrationResult = { migrated: 0, skipped: 0, errors: [] };

  try {
    const snapshot = await adminDb.collection('mvp_two_streams').get();
    
    for (const doc of snapshot.docs) {
      try {
        const data = doc.data();
        
        // Check if already migrated
        const existingDoc = await adminDb.collection(STREAMS_COLLECTION).doc(doc.id).get();
        if (existingDoc.exists) {
          result.skipped++;
          continue;
        }

        // Transform MVP Two data to unified format
        const streamData = {
          // Identity
          title: data.title || 'Untitled Stream',
          description: data.description || '',
          
          // Memorial Association
          memorialId: data.memorialId || null,
          memorialName: data.memorialName || null,
          
          // Stream Configuration
          cloudflareId: data.cloudflareId || data.cloudflareStreamId || null,
          streamKey: data.streamKey || null,
          streamUrl: data.streamUrl || null,
          playbackUrl: data.playbackUrl || null,
          
          // Status & Lifecycle
          status: mapMVPTwoStatus(data.status),
          scheduledStartTime: data.scheduledStartTime || null,
          actualStartTime: data.actualStartTime || null,
          endTime: data.endTime || null,
          
          // Recording Management
          recordingReady: data.recordingReady || false,
          recordingUrl: data.recordingUrl || null,
          recordingDuration: data.recordingDuration || null,
          
          // Visibility & Access
          isVisible: data.isVisible !== false,
          isPublic: data.isPublic !== false,
          
          // Permissions
          createdBy: data.createdBy,
          allowedUsers: data.allowedUsers || [],
          
          // Metadata
          displayOrder: data.displayOrder || 0,
          viewerCount: data.viewerCount || 0,
          createdAt: data.createdAt || new Date(),
          updatedAt: data.updatedAt || new Date()
        };

        if (!dryRun) {
          await adminDb.collection(STREAMS_COLLECTION).doc(doc.id).set(streamData);
        }

        result.migrated++;
        console.log('✅ [MIGRATION] Migrated MVP Two stream:', doc.id);

      } catch (error) {
        result.errors.push({
          id: doc.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

  } catch (error) {
    console.error('❌ [MIGRATION] MVP Two migration error:', error);
  }

  return result;
}

/**
 * Migrate memorial archive entries to unified collection
 */
async function migrateMemorialArchives(dryRun: boolean): Promise<MigrationResult> {
  const result: MigrationResult = { migrated: 0, skipped: 0, errors: [] };

  try {
    const memorialsSnapshot = await adminDb.collection('memorials').get();
    
    for (const memorialDoc of memorialsSnapshot.docs) {
      const memorial = memorialDoc.data();
      
      if (!memorial.livestreamArchive || !Array.isArray(memorial.livestreamArchive)) {
        continue;
      }

      for (const archive of memorial.livestreamArchive) {
        try {
          const streamId = archive.id || `archive_${memorialDoc.id}_${Date.now()}`;
          
          // Check if already migrated
          const existingDoc = await adminDb.collection(STREAMS_COLLECTION).doc(streamId).get();
          if (existingDoc.exists) {
            result.skipped++;
            continue;
          }

          // Transform archive entry to unified format
          const streamData = {
            // Identity
            title: archive.title || 'Memorial Service',
            description: archive.description || '',
            
            // Memorial Association
            memorialId: memorialDoc.id,
            memorialName: memorial.lovedOneName,
            
            // Stream Configuration
            cloudflareId: archive.cloudflareId,
            streamKey: null,
            streamUrl: null,
            playbackUrl: archive.playbackUrl,
            
            // Status & Lifecycle
            status: 'completed' as const,
            scheduledStartTime: null,
            actualStartTime: archive.startedAt,
            endTime: archive.endedAt || null,
            
            // Recording Management
            recordingReady: archive.recordingReady || false,
            recordingUrl: archive.playbackUrl,
            recordingDuration: archive.duration || null,
            
            // Visibility & Access
            isVisible: archive.isVisible !== false,
            isPublic: memorial.isPublic !== false,
            
            // Permissions
            createdBy: archive.startedBy,
            allowedUsers: [],
            
            // Metadata
            displayOrder: 0,
            viewerCount: archive.viewerCount || 0,
            createdAt: archive.createdAt || archive.startedAt,
            updatedAt: archive.updatedAt || new Date()
          };

          if (!dryRun) {
            await adminDb.collection(STREAMS_COLLECTION).doc(streamId).set(streamData);
          }

          result.migrated++;
          console.log('✅ [MIGRATION] Migrated archive entry:', streamId);

        } catch (error) {
          result.errors.push({
            id: `${memorialDoc.id}_archive`,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

  } catch (error) {
    console.error('❌ [MIGRATION] Archive migration error:', error);
  }

  return result;
}

/**
 * Migrate legacy livestream data to unified collection
 */
async function migrateLegacyLivestreams(dryRun: boolean): Promise<MigrationResult> {
  const result: MigrationResult = { migrated: 0, skipped: 0, errors: [] };

  try {
    const memorialsSnapshot = await adminDb.collection('memorials').get();
    
    for (const memorialDoc of memorialsSnapshot.docs) {
      const memorial = memorialDoc.data();
      
      if (!memorial.livestream || !memorial.livestream.uid) {
        continue;
      }

      try {
        const streamId = `legacy_${memorialDoc.id}`;
        
        // Check if already migrated
        const existingDoc = await adminDb.collection(STREAMS_COLLECTION).doc(streamId).get();
        if (existingDoc.exists) {
          result.skipped++;
          continue;
        }

        // Transform legacy data to unified format
        const streamData = {
          // Identity
          title: memorial.livestream.name || `${memorial.lovedOneName} Memorial Service`,
          description: 'Migrated from legacy livestream',
          
          // Memorial Association
          memorialId: memorialDoc.id,
          memorialName: memorial.lovedOneName,
          
          // Stream Configuration
          cloudflareId: memorial.livestream.uid,
          streamKey: memorial.livestream.streamKey,
          streamUrl: memorial.livestream.rtmpsUrl,
          playbackUrl: `https://cloudflarestream.com/${memorial.livestream.uid}/iframe`,
          
          // Status & Lifecycle
          status: 'completed' as const,
          scheduledStartTime: null,
          actualStartTime: memorial.createdAt,
          endTime: null,
          
          // Recording Management
          recordingReady: false, // Legacy streams need recording check
          recordingUrl: null,
          recordingDuration: null,
          
          // Visibility & Access
          isVisible: true,
          isPublic: memorial.isPublic !== false,
          
          // Permissions
          createdBy: memorial.ownerUid,
          allowedUsers: [],
          
          // Metadata
          displayOrder: 0,
          viewerCount: 0,
          createdAt: memorial.createdAt,
          updatedAt: new Date()
        };

        if (!dryRun) {
          await adminDb.collection(STREAMS_COLLECTION).doc(streamId).set(streamData);
        }

        result.migrated++;
        console.log('✅ [MIGRATION] Migrated legacy stream:', streamId);

      } catch (error) {
        result.errors.push({
          id: memorialDoc.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

  } catch (error) {
    console.error('❌ [MIGRATION] Legacy migration error:', error);
  }

  return result;
}

/**
 * Map MVP Two status to unified status
 */
function mapMVPTwoStatus(status: string): 'scheduled' | 'ready' | 'live' | 'completed' | 'error' {
  switch (status) {
    case 'scheduled':
      return 'scheduled';
    case 'ready':
      return 'ready';
    case 'live':
      return 'live';
    case 'completed':
    case 'ended':
      return 'completed';
    case 'error':
    case 'failed':
      return 'error';
    default:
      return 'ready';
  }
}

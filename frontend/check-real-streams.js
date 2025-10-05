// Check for real streams in the database
import { adminDb } from './src/lib/server/firebase.js';

async function checkStreams() {
    try {
        console.log('🔍 Checking for streams in database...');
        
        const streamsSnapshot = await adminDb
            .collection('streams')
            .limit(5)
            .get();
        
        if (streamsSnapshot.empty) {
            console.log('📭 No streams found in database');
            return;
        }
        
        console.log(`📊 Found ${streamsSnapshot.size} streams:`);
        console.log('');
        
        const streamIds = [];
        
        streamsSnapshot.forEach(doc => {
            const data = doc.data();
            streamIds.push(doc.id);
            
            console.log(`Stream ID: ${doc.id}`);
            console.log(`  Title: ${data.title || 'N/A'}`);
            console.log(`  Status: ${data.status || 'N/A'}`);
            console.log(`  Memorial ID: ${data.memorialId || 'N/A'}`);
            console.log(`  Cloudflare Input ID: ${data.cloudflareInputId || 'N/A'}`);
            console.log(`  Created: ${data.createdAt || 'N/A'}`);
            console.log('');
        });
        
        console.log('🧪 To test with these real streams, run:');
        console.log(`curl -X POST "http://localhost:5173/api/streams/check-live-status" \\`);
        console.log(`  -H "Content-Type: application/json" \\`);
        console.log(`  -d '{"streamIds": ${JSON.stringify(streamIds)}}' | jq .`);
        
    } catch (error) {
        console.error('❌ Error checking streams:', error);
    }
}

checkStreams();

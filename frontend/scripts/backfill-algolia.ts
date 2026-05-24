import { getAdminDb } from '../src/lib/server/firebase';
import { algoliasearch } from 'algoliasearch';
import * as dotenv from 'dotenv';
import type { Memorial } from '../src/lib/types/memorial';

dotenv.config({ path: './.env' });

const INDEX_NAME = 'memorials';

async function backfillAlgolia() {
    console.log('🚀 Starting Algolia backfill process...');

    try {
        // 1. Initialize clients
        const db = getAdminDb();
        const algoliaClient = algoliasearch(process.env.PUBLIC_ALGOLIA_APP_ID!, process.env.ALGOLIA_ADMIN_KEY!);
        const index = algoliaClient.initIndex(INDEX_NAME);

        // 2. Fetch all memorials from Firestore
        console.log('🔥 Fetching all memorials from Firestore...');
        const memorialsSnapshot = await db.collection('memorials').get();
        
        if (memorialsSnapshot.empty) {
            console.log('✅ No memorials found in Firestore. Exiting.');
            return;
        }
        console.log(`✅ Found ${memorialsSnapshot.size} memorials to index.`);

        // 3. Transform documents into Algolia records
        const records = memorialsSnapshot.docs.map(doc => {
            const memorial = doc.data() as Memorial;
            return {
                objectID: doc.id,
                lovedOneName: memorial.lovedOneName,
                slug: memorial.slug,
                fullSlug: memorial.fullSlug,
                createdAt: memorial.createdAt,
                // Add any other fields you want to be searchable
            };
        });

        // 4. Upload records to Algolia
        console.log('🔎 Uploading records to Algolia...');
        const { objectIDs } = await index.saveObjects(records);
        console.log(`✅ Successfully indexed ${objectIDs.length} records in Algolia.`);

    } catch (error) {
        console.error('❌ Error during Algolia backfill:', error);
        process.exit(1);
    }

    console.log('🎉 Algolia backfill process completed successfully!');
}

backfillAlgolia();
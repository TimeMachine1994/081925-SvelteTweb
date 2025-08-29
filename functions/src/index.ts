import { onDocumentCreated, onDocumentUpdated, onDocumentDeleted } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import algoliasearch from 'algoliasearch';
import { defineString } from 'firebase-functions/params';

admin.initializeApp();

// Define Algolia configuration parameters
const algoliaAppId = defineString('ALGOLIA_APP_ID');
const algoliaApiKey = defineString('ALGOLIA_API_KEY');
const algoliaIndexName = defineString('ALGOLIA_INDEX_NAME', { default: 'memorials' });


// Initialize Algolia client
const client = algoliasearch(algoliaAppId.value(), algoliaApiKey.value());
const index = client.initIndex(algoliaIndexName.value());

export const onMemorialCreated = onDocumentCreated('memorials/{memorialId}', (event) => {
    const snap = event.data;
    if (!snap) {
        console.log("No data associated with the event");
        return;
    }
    const data = snap.data();
    const objectID = snap.id;

    return index.saveObject({ ...data, objectID });
});

export const onMemorialUpdated = onDocumentUpdated('memorials/{memorialId}', (event) => {
    const snap = event.data;
    if (!snap) {
        console.log("No data associated with the event");
        return;
    }
    const data = snap.after.data();
    const objectID = snap.after.id;

    return index.saveObject({ ...data, objectID });
});

export const onMemorialDeleted = onDocumentDeleted('memorials/{memorialId}', (event) => {
    const snap = event.data;
    if (!snap) {
        console.log("No data associated with the event");
        return;
    }
    const objectID = snap.id;

    return index.deleteObject(objectID);
});
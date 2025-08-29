"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onMemorialDeleted = exports.onMemorialUpdated = exports.onMemorialCreated = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const algoliasearch_1 = require("algoliasearch");
const params_1 = require("firebase-functions/params");
admin.initializeApp();
// Define Algolia configuration parameters
const algoliaAppId = (0, params_1.defineString)('ALGOLIA_APP_ID');
const algoliaApiKey = (0, params_1.defineString)('ALGOLIA_API_KEY');
const algoliaIndexName = (0, params_1.defineString)('ALGOLIA_INDEX_NAME', { default: 'memorials' });
// Initialize Algolia client
const client = (0, algoliasearch_1.default)(algoliaAppId.value(), algoliaApiKey.value());
const index = client.initIndex(algoliaIndexName.value());
exports.onMemorialCreated = (0, firestore_1.onDocumentCreated)('memorials/{memorialId}', (event) => {
    const snap = event.data;
    if (!snap) {
        console.log("No data associated with the event");
        return;
    }
    const data = snap.data();
    const objectID = snap.id;
    return index.saveObject(Object.assign(Object.assign({}, data), { objectID }));
});
exports.onMemorialUpdated = (0, firestore_1.onDocumentUpdated)('memorials/{memorialId}', (event) => {
    const snap = event.data;
    if (!snap) {
        console.log("No data associated with the event");
        return;
    }
    const data = snap.after.data();
    const objectID = snap.after.id;
    return index.saveObject(Object.assign(Object.assign({}, data), { objectID }));
});
exports.onMemorialDeleted = (0, firestore_1.onDocumentDeleted)('memorials/{memorialId}', (event) => {
    const snap = event.data;
    if (!snap) {
        console.log("No data associated with the event");
        return;
    }
    const objectID = snap.id;
    return index.deleteObject(objectID);
});
//# sourceMappingURL=index.js.map
# Admin Cross-Collection Links

Interactive linking between related Firestore records in the admin area. Clicking
a reference field (e.g. `memorialId`, `ownerUid`, `creatorEmail`) navigates to the
related document — either a dedicated admin page or the generic Database browser.

## Key files

- `src/lib/admin/relationships.ts` — the reference registry + resolvers (client-safe).
- `src/lib/components/admin/RecordLink.svelte` — renders any field value as a link when resolvable.
- `src/lib/server/adminDatabase.ts` — `findDocumentByField` for email/field lookups.
- `src/routes/api/admin/database/+server.ts` — `GET ?collection=&field=&value=` support.
- `src/routes/admin/system/database/+page.svelte` — clickable references, in-pane nav, back stack, deep links.

## How resolution works

1. **Native Firestore references** — serialized as `{ __type: 'reference', path: 'collection/docId' }`
   are always resolvable via `resolveNativeReference`.
2. **Convention foreign keys** — string fields named in `FIELD_REFERENCES`
   (e.g. `memorialId` -> `memorials`) resolve via `resolveReference`.
3. `resolveAnyReference(key, value)` tries native first, then conventional.

A reference resolves to either:

- a **dedicated route** (`COLLECTION_ROUTES`) when one exists (`memorials`, `users`, `blog`), or
- a **DB browser deep link** (`databaseDeepLink`) for everything else (`streams`, etc.).

## Add a new linkable reference

1. Add the field to `FIELD_REFERENCES` in `relationships.ts`:

   ```ts
   invoiceId: { collection: 'invoices', by: 'id' }
   ```

2. If the target collection has a dedicated admin page, add it to `COLLECTION_ROUTES`:

   ```ts
   invoices: (id) => `/admin/services/invoices/${id}`
   ```

3. For `by: 'email'` (or other field) lookups, ensure the field is in `QUERYABLE_FIELDS`
   in `adminDatabase.ts` so the API can resolve it.

The target collection must be allowlisted in `DATABASE_COLLECTIONS` for DB-browser
navigation to work.

## Tests

`src/lib/admin/relationships.test.ts` covers resolver and href/deep-link behaviour:

```
npx vitest run src/lib/admin/relationships.test.ts
```

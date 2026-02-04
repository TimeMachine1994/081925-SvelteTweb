const fs = require('fs');

const data = JSON.parse(fs.readFileSync('TimelineCreator/pdfs/A. Records Paradise Palms Chiropractic-response.json', 'utf-8'));

const allEntities = [];

// Extract entities from each chunk result
for (const chunk of data.chunkResults) {
  if (chunk.result?.document?.entities) {
    for (const entity of chunk.result.document.entities) {
      allEntities.push({
        type: entity.type,
        text: entity.mentionText,
        confidence: entity.confidence,
        page: entity.pageAnchor?.pageRefs?.[0]?.page
      });
    }
  }
}

// Group by type
const byType = {};
for (const e of allEntities) {
  if (!byType[e.type]) byType[e.type] = [];
  byType[e.type].push(e);
}

console.log('\n=== EXTRACTED ENTITIES BY TYPE ===\n');
for (const [type, entities] of Object.entries(byType)) {
  console.log(`\n--- ${type} (${entities.length} found) ---`);
  for (const e of entities.slice(0, 10)) { // Show first 10 of each type
    console.log(`  "${e.text}" (page ${e.page}, ${(e.confidence * 100).toFixed(1)}% confidence)`);
  }
  if (entities.length > 10) {
    console.log(`  ... and ${entities.length - 10} more`);
  }
}

// Save full entities to JSON
fs.writeFileSync('TimelineCreator/pdfs/extracted-entities.json', JSON.stringify(allEntities, null, 2));
console.log('\n\nFull entities saved to: TimelineCreator/pdfs/extracted-entities.json');

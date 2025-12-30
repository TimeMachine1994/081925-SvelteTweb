import { createHash } from 'crypto';
import { readFile, stat, access } from 'fs/promises';
import { db } from './db';
import { fileSnapshot } from './db/schema';
import { eq, and } from 'drizzle-orm';
import type { RootJourney } from '$lib/types/journey';
import { extractFileReferencesFromJourney } from './journey-parser';

export interface FileStatus {
	path: string;
	status: 'synced' | 'modified' | 'deleted';
	lastModified?: number;
	snapshotModified?: number;
}

/**
 * Compute SHA-256 hash of file content
 */
async function computeFileHash(filePath: string): Promise<string> {
	const content = await readFile(filePath, 'utf-8');
	return createHash('sha256').update(content).digest('hex');
}

/**
 * Check if file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
	try {
		await access(filePath);
		return true;
	} catch {
		return false;
	}
}

/**
 * Resolve @/ prefixed path to absolute path
 */
function resolveFilePath(relativePath: string, projectPath: string): string {
	let cleanPath = relativePath;
	if (cleanPath.startsWith('@/')) cleanPath = cleanPath.slice(2);
	if (cleanPath.startsWith('/')) cleanPath = cleanPath.slice(1);
	return `${projectPath}/src/${cleanPath}`;
}

/**
 * Find POTJs that reference a specific file
 */
function findPOTJsReferencingFile(journey: RootJourney, filePath: string): string[] {
	const potjIds: string[] = [];
	const allPOTJs = [
		...journey.sections.beginning.items,
		...journey.sections.middle.items,
		...journey.sections.end.items
	];

	for (const potj of allPOTJs) {
		if (
			potj.fileRef === filePath ||
			potj.dependencies?.includes(filePath) ||
			potj.codeReference?.file === filePath
		) {
			potjIds.push(potj.id);
		}
	}

	return potjIds;
}

/**
 * Create snapshots for all files referenced in a journey
 */
export async function createJourneySnapshots(
	journey: RootJourney,
	projectPath: string
): Promise<number> {
	const fileRefs = extractFileReferencesFromJourney(journey);
	let snapshotCount = 0;

	for (const relativePath of fileRefs) {
		const absolutePath = resolveFilePath(relativePath, projectPath);

		if (await fileExists(absolutePath)) {
			try {
				const stats = await stat(absolutePath);
				const hash = await computeFileHash(absolutePath);

				// Find which POTJ(s) reference this file
				const potjIds = findPOTJsReferencingFile(journey, relativePath);

				for (const potjId of potjIds) {
					const snapshotId = `${journey.id}-${potjId}-${relativePath.replace(/\//g, '_')}`;

					await db
						.insert(fileSnapshot)
						.values({
							id: snapshotId,
							filePath: absolutePath,
							relativePath,
							lastModified: Math.floor(stats.mtimeMs),
							contentHash: hash,
							fileSize: stats.size,
							journeyId: journey.id,
							potjId,
							snapshotAt: new Date(),
							currentStatus: 'synced'
						})
						.onConflictDoUpdate({
							target: fileSnapshot.id,
							set: {
								lastModified: Math.floor(stats.mtimeMs),
								contentHash: hash,
								fileSize: stats.size,
								snapshotAt: new Date(),
								currentStatus: 'synced',
								detectedAt: null
							}
						});

					snapshotCount++;
				}
			} catch (err) {
				console.error(`[FileSnapshot] Error creating snapshot for ${relativePath}:`, err);
			}
		}
	}

	console.log(`[FileSnapshot] Created ${snapshotCount} snapshots for journey ${journey.id}`);
	return snapshotCount;
}

/**
 * Check current status of files for a POTJ
 */
export async function checkPOTJFileStatus(
	journeyId: string,
	potjId: string,
	projectPath: string
): Promise<FileStatus[]> {
	const snapshots = await db
		.select()
		.from(fileSnapshot)
		.where(and(eq(fileSnapshot.journeyId, journeyId), eq(fileSnapshot.potjId, potjId)));

	const results: FileStatus[] = [];

	for (const snapshot of snapshots) {
		if (!(await fileExists(snapshot.filePath))) {
			results.push({
				path: snapshot.relativePath,
				status: 'deleted'
			});
			continue;
		}

		const stats = await stat(snapshot.filePath);

		// Quick check: if mtime unchanged, assume file unchanged
		if (Math.floor(stats.mtimeMs) === snapshot.lastModified) {
			results.push({
				path: snapshot.relativePath,
				status: 'synced',
				lastModified: Math.floor(stats.mtimeMs),
				snapshotModified: snapshot.lastModified
			});
			continue;
		}

		// mtime changed - verify with hash
		const currentHash = await computeFileHash(snapshot.filePath);

		if (currentHash !== snapshot.contentHash) {
			results.push({
				path: snapshot.relativePath,
				status: 'modified',
				lastModified: Math.floor(stats.mtimeMs),
				snapshotModified: snapshot.lastModified
			});
		} else {
			// Hash same, just touched
			results.push({
				path: snapshot.relativePath,
				status: 'synced',
				lastModified: Math.floor(stats.mtimeMs),
				snapshotModified: snapshot.lastModified
			});
		}
	}

	return results;
}

/**
 * Get aggregated status for all POTJs in a journey
 */
export async function getJourneyReconciliationStatus(
	journeyId: string,
	projectPath: string
): Promise<Map<string, 'synced' | 'modified' | 'deleted'>> {
	const snapshots = await db
		.select()
		.from(fileSnapshot)
		.where(eq(fileSnapshot.journeyId, journeyId));

	const potjStatus = new Map<string, 'synced' | 'modified' | 'deleted'>();

	// Group by POTJ
	const byPOTJ = new Map<string, typeof snapshots>();
	for (const s of snapshots) {
		if (!s.potjId) continue;
		if (!byPOTJ.has(s.potjId)) byPOTJ.set(s.potjId, []);
		byPOTJ.get(s.potjId)!.push(s);
	}

	for (const [potjId, potjSnapshots] of byPOTJ) {
		let worstStatus: 'synced' | 'modified' | 'deleted' = 'synced';

		for (const snapshot of potjSnapshots) {
			if (!(await fileExists(snapshot.filePath))) {
				worstStatus = 'deleted';
				break;
			}

			const stats = await stat(snapshot.filePath);
			if (Math.floor(stats.mtimeMs) !== snapshot.lastModified) {
				try {
					const currentHash = await computeFileHash(snapshot.filePath);
					if (currentHash !== snapshot.contentHash) {
						worstStatus = 'modified';
					}
				} catch {
					worstStatus = 'modified';
				}
			}
		}

		potjStatus.set(potjId, worstStatus);
	}

	return potjStatus;
}

/**
 * Clear all snapshots for a journey (for re-generation)
 */
export async function clearJourneySnapshots(journeyId: string): Promise<void> {
	await db.delete(fileSnapshot).where(eq(fileSnapshot.journeyId, journeyId));
	console.log(`[FileSnapshot] Cleared snapshots for journey ${journeyId}`);
}

/**
 * Get all file paths being tracked for a journey
 */
export async function getTrackedFilePaths(journeyId: string): Promise<string[]> {
	const snapshots = await db
		.select({ filePath: fileSnapshot.filePath })
		.from(fileSnapshot)
		.where(eq(fileSnapshot.journeyId, journeyId));

	return [...new Set(snapshots.map((s) => s.filePath))];
}

/**
 * Update snapshot status when file change is detected
 */
export async function markFileChanged(
	filePath: string,
	status: 'modified' | 'deleted'
): Promise<void> {
	await db
		.update(fileSnapshot)
		.set({
			currentStatus: status,
			detectedAt: new Date()
		})
		.where(eq(fileSnapshot.filePath, filePath));
}

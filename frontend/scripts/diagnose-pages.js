#!/usr/bin/env node

/**
 * Diagnostic script to check page loading issues
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🔍 Diagnosing page loading issues...\n');

// Check if key files exist
const filesToCheck = [
	'src/routes/hls/[streamId]/+page.svelte',
	'src/routes/whep/[streamId]/+page.svelte',
	'src/routes/test-stream/+page.svelte',
	'src/lib/components/StreamCard.svelte',
	'package.json',
	'vite.config.js',
	'svelte.config.js'
];

console.log('📁 Checking file existence:');
filesToCheck.forEach(file => {
	const fullPath = join(projectRoot, file);
	const exists = existsSync(fullPath);
	console.log(`${exists ? '✅' : '❌'} ${file}`);
});

console.log('\n📦 Checking package.json dependencies:');
try {
	const packageJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'));
	
	const criticalDeps = [
		'@sveltejs/kit',
		'svelte',
		'vite',
		'hls.js'
	];
	
	criticalDeps.forEach(dep => {
		const version = packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep];
		console.log(`${version ? '✅' : '❌'} ${dep}: ${version || 'NOT FOUND'}`);
	});
} catch (error) {
	console.log('❌ Error reading package.json:', error.message);
}

console.log('\n🔧 Checking SvelteKit configuration:');
try {
	if (existsSync(join(projectRoot, 'svelte.config.js'))) {
		console.log('✅ svelte.config.js exists');
	} else {
		console.log('❌ svelte.config.js missing');
	}
	
	if (existsSync(join(projectRoot, 'vite.config.js')) || existsSync(join(projectRoot, 'vite.config.ts'))) {
		console.log('✅ vite.config exists');
	} else {
		console.log('❌ vite.config missing');
	}
} catch (error) {
	console.log('❌ Error checking config files:', error.message);
}

console.log('\n🎯 Checking route structure:');
const routesToCheck = [
	'src/routes/+layout.svelte',
	'src/routes/+page.svelte',
	'src/routes/hls/[streamId]/+page.svelte',
	'src/routes/whep/[streamId]/+page.svelte',
	'src/routes/test-stream/+page.svelte'
];

routesToCheck.forEach(route => {
	const fullPath = join(projectRoot, route);
	const exists = existsSync(fullPath);
	console.log(`${exists ? '✅' : '❌'} ${route}`);
	
	if (exists) {
		try {
			const content = readFileSync(fullPath, 'utf8');
			const hasScript = content.includes('<script');
			const hasStyle = content.includes('<style');
			const hasImports = content.includes('import');
			
			console.log(`    📝 Has script: ${hasScript ? '✅' : '❌'}`);
			console.log(`    🎨 Has style: ${hasStyle ? '✅' : '❌'}`);
			console.log(`    📦 Has imports: ${hasImports ? '✅' : '❌'}`);
			
			// Check for potential issues
			if (content.includes('$effect(')) {
				console.log('    ⚠️  Uses $effect (potential timeout cause)');
			}
			if (content.includes('bind:this')) {
				console.log('    ✅ Uses element binding');
			}
		} catch (error) {
			console.log(`    ❌ Error reading file: ${error.message}`);
		}
	}
	console.log('');
});

console.log('🧪 Suggested fixes:');
console.log('1. Run: npm install (ensure all dependencies are installed)');
console.log('2. Run: npm run check (check for TypeScript/Svelte errors)');
console.log('3. Check browser console for JavaScript errors');
console.log('4. Try: rm -rf node_modules && npm install (clean install)');
console.log('5. Check if port 5176 is accessible: http://localhost:5176');

console.log('\n🔍 To run tests:');
console.log('- Unit tests: npm run test:unit');
console.log('- E2E tests: npm run test:e2e');
console.log('- Check syntax: npm run check');

console.log('\n✅ Diagnosis complete!');

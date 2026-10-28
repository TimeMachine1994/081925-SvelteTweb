import { describe, it, expect } from 'vitest';
import {
	sanitizeFilenamePart,
	buildRecordingFilename,
	buildMp4DownloadUrl,
	mp4DisplayState,
	needsMp4StatusCheck
} from './recording-download';

describe('sanitizeFilenamePart', () => {
	it('strips characters that are illegal in filenames and hyphenates whitespace', () => {
		expect(sanitizeFilenamePart('  John "Jack" O/Brien: Service?  ')).toBe('John-Jack-OBrien-Service');
	});

	it('keeps unicode letters', () => {
		expect(sanitizeFilenamePart('José Müller')).toBe('José-Müller');
	});

	it('returns an empty string for empty/nullish input', () => {
		expect(sanitizeFilenamePart('')).toBe('');
		expect(sanitizeFilenamePart(null)).toBe('');
		expect(sanitizeFilenamePart(undefined)).toBe('');
		expect(sanitizeFilenamePart(' *?<> ')).toBe('');
	});
});

describe('buildRecordingFilename', () => {
	it('combines memorial name, stream title and session number', () => {
		expect(
			buildRecordingFilename({ memorialName: 'Jane Doe', streamTitle: 'Funeral Service', sessionNumber: 2 })
		).toBe('Jane-Doe-Funeral-Service-session-2.mp4');
	});

	it('omits missing parts', () => {
		expect(buildRecordingFilename({ memorialName: 'Jane Doe', sessionNumber: 1 })).toBe(
			'Jane-Doe-session-1.mp4'
		);
	});

	it('falls back to "recording" when no usable name is available', () => {
		expect(buildRecordingFilename({ memorialName: '', streamTitle: '???', sessionNumber: 3 })).toBe(
			'recording-session-3.mp4'
		);
	});
});

describe('buildMp4DownloadUrl', () => {
	it('builds a Mux static rendition URL with an encoded download filename', () => {
		expect(buildMp4DownloadUrl('abc123', 'A & B #1.mp4')).toBe(
			'https://stream.mux.com/abc123/high.mp4?download=A%20%26%20B%20%231.mp4'
		);
	});
});

describe('mp4DisplayState', () => {
	it('passes through final statuses', () => {
		expect(mp4DisplayState('ready', true)).toBe('ready');
		expect(mp4DisplayState('errored', true)).toBe('errored');
		expect(mp4DisplayState('ready', false)).toBe('ready');
	});

	it('treats missing/preparing status with an asset as preparing', () => {
		expect(mp4DisplayState(undefined, true)).toBe('preparing');
		expect(mp4DisplayState(null, true)).toBe('preparing');
		expect(mp4DisplayState('preparing', true)).toBe('preparing');
	});

	it('is unknown without an asset ID or after a failed check', () => {
		expect(mp4DisplayState(undefined, false)).toBe('unknown');
		expect(mp4DisplayState('preparing', false)).toBe('unknown');
		expect(mp4DisplayState('unknown', true)).toBe('unknown');
	});
});

describe('needsMp4StatusCheck', () => {
	it('checks non-final statuses only when an asset ID exists', () => {
		expect(needsMp4StatusCheck(undefined, true)).toBe(true);
		expect(needsMp4StatusCheck('preparing', true)).toBe(true);
		expect(needsMp4StatusCheck('ready', true)).toBe(false);
		expect(needsMp4StatusCheck('errored', true)).toBe(false);
		expect(needsMp4StatusCheck(undefined, false)).toBe(false);
	});
});

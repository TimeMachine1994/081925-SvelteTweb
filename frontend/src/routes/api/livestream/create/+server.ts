import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN } from '$env/static/private';
import { db } from '$lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export const POST: RequestHandler = async ({ request, locals }) => {
    console.log('Received request to create livestream 🎥');

    if (!locals.user || !locals.user.admin) {
        console.error('Permission denied: User is not an admin 🚫');
        throw error(403, 'Permission denied');
    }

    const { memorialId, name } = await request.json();
    console.log(`Request details: memorialId=${memorialId}, name=${name} 📝`);

    if (!memorialId || !name) {
        console.error('Missing memorialId or name in request body 😟');
        throw error(400, 'Missing memorialId or name');
    }

    try {
        console.log('Sending request to Cloudflare API... ☁️');
        const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/live_inputs`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                meta: { name },
                recording: {
                    mode: 'automatic'
                }
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Cloudflare API error: ${response.status} ${response.statusText} - ${errorBody} ❌`);
            throw error(response.status, `Cloudflare API error: ${errorBody}`);
        }

        const data = await response.json();
        console.log('Cloudflare API response received successfully ✅:', data);

        const livestreamData = {
            uid: data.result.uid,
            rtmpsUrl: data.result.rtmps.url,
            streamKey: data.result.rtmps.streamKey,
            name
        };

        console.log('Updating memorial document in Firestore... 🔥');
        const memorialRef = doc(db, 'memorials', memorialId);
        await updateDoc(memorialRef, {
            livestream: livestreamData
        });
        console.log('Firestore document updated successfully 👍');

        return json(livestreamData);
    } catch (err) {
        console.error('An unexpected error occurred:', err);
        throw error(500, 'An unexpected error occurred.');
    }
};
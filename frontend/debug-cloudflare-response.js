// Debug script to check Cloudflare API response format
import { env } from '$env/dynamic/private';

const cloudflareInputId = 'fae3429262b8c1f2325136e04ed7f490'; // test11111 stream
const cloudflareUrl = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/stream/live_inputs/${cloudflareInputId}`;

console.log('🔍 Checking Cloudflare API response for:', cloudflareInputId);
console.log('URL:', cloudflareUrl);

try {
    const response = await fetch(cloudflareUrl, {
        headers: {
            'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        console.log('❌ API Error:', response.status, response.statusText);
        process.exit(1);
    }

    const data = await response.json();
    console.log('📡 Full Cloudflare Response:');
    console.log(JSON.stringify(data, null, 2));

    if (data.result) {
        console.log('\n🔍 Live Input Status Analysis:');
        console.log('- result.status:', data.result.status);
        console.log('- result.status?.current:', data.result.status?.current);
        console.log('- result.status?.current?.connected:', data.result.status?.current?.connected);
        console.log('- result.meta:', data.result.meta);
    }

} catch (error) {
    console.error('❌ Error:', error);
}

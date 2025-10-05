# Live/Not Live Status Demo

## StreamCard Component Status Indicators

The StreamCard component now shows different visual indicators based on stream status:

### 🔴 LIVE Status (`status: 'live'`)
- **Icon**: Animated Radio icon with pulsing effect
- **Color**: Red (`text-red-600`)
- **Animation**: Pulse + ping effect
- **Badge**: Red "LIVE" badge
- **Trigger**: When OBS connects and starts streaming to Cloudflare

### ⚫ NOT LIVE Status (`status: 'ready'`)
- **Icon**: Circle icon (static)
- **Color**: Gray (`text-gray-400`)
- **Animation**: None
- **Badge**: Green "Ready" badge
- **Trigger**: Stream is created and ready for OBS connection

### 📅 SCHEDULED Status (`status: 'scheduled'`)
- **Icon**: None (just title)
- **Badge**: Blue "Scheduled" badge
- **Trigger**: Stream has a future scheduledStartTime

### ✅ COMPLETED Status (`status: 'completed'`)
- **Icon**: None (just title)
- **Badge**: Gray "Completed" badge
- **Trigger**: Stream has ended and been archived

## How Status Changes Work

1. **Stream Creation**: Status starts as `ready` → Shows Circle icon
2. **OBS Connection**: Cloudflare webhook detects connection → Status changes to `live` → Shows animated Radio icon
3. **OBS Disconnection**: Webhook detects disconnection → Status changes back to `ready` → Shows Circle icon
4. **Stream End**: Manual or automatic → Status changes to `completed` → No icon

## Visual Indicators

```
Ready Stream:    [⚫] Stream Title                    [Ready]
Live Stream:     [🔴] Stream Title (pulsing)         [LIVE]
Scheduled:       Stream Title                        [Scheduled]
Completed:       Stream Title                        [Completed]
```

The status updates happen automatically through:
- Cloudflare webhook notifications
- 5-second polling in the streams page
- Real-time UI updates via Svelte reactivity

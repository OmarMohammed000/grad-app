# Mobile API Connection Setup Guide

## Problem
When testing on mobile (Expo Go), `localhost` refers to the mobile device itself, not your computer. This causes API requests to fail.

## Solution

### Step 1: Find Your Computer's IP Address

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your active network (WiFi or Ethernet).
Example: `192.168.1.100`

**Mac/Linux:**
```bash
ifconfig | grep "inet "
```

### Step 2: Update Frontend Environment Variables

Edit `frontend/.env`:
```properties
EXPO_PUBLIC_API_URL=http://192.168.1.100:4000
EXPO_PUBLIC_API_TIMEOUT=15000
```
Replace `192.168.1.100` with YOUR computer's IP address.

### Step 3: Ensure Backend Listens on All Interfaces

The backend is already configured to listen on `0.0.0.0`, which allows connections from any network interface.

Check `backend/index.js`:
```javascript
app.listen(PORT, '0.0.0.0', () => {
  // ...
});
```

### Step 4: Start Backend Server

```bash
cd backend
npm start
```

You should see:
```
🚀 Server is running on port 4000
📍 Local: http://localhost:4000
📍 Network: http://192.168.1.100:4000 (use this from mobile)
✅ Listening on all network interfaces (0.0.0.0)
```

### Step 5: Restart Expo

```bash
cd frontend
npx expo start
```

### Step 6: Test on Mobile

1. Make sure your **mobile device and computer are on the SAME WiFi network**
2. Open the app in Expo Go
3. Try to register or login
4. Check the console for network logs

## Troubleshooting

### Firewall Issues
If connection still fails, check Windows Firewall:
1. Open "Windows Defender Firewall"
2. Click "Allow an app through firewall"
3. Make sure Node.js is allowed for Private networks

### Network Logs
The app now shows detailed logs:
- 🚀 API Request: Shows the request being made
- ✅ API Response: Shows successful responses
- ❌ API Error: Shows errors with details
- ⏱️ Timeout: Shows if request timed out
- 🌐 Network Error: Shows connection issues

### Testing Backend Accessibility

From your mobile browser, try accessing:
```
http://192.168.1.100:4000/health
```

If this works, the backend is accessible. If not:
- Check if backend is running
- Verify you're on the same WiFi
- Check firewall settings
- Verify the IP address is correct

## For Web Testing

When testing on web (localhost:19006), you can use:
```properties
EXPO_PUBLIC_API_URL=http://localhost:4000
```

## Using Different Environments

Create multiple .env files:
- `.env.development` - for local testing
- `.env.production` - for production

Or use Expo's environment variables with different commands.

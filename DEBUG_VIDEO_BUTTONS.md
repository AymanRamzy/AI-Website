# 🔧 Debug Video Call Buttons

## The buttons are visible but not working. Let's debug!

### Step 1: Open Browser Console
1. Press **F12** (or right-click → Inspect)
2. Click **"Console"** tab
3. Keep it open while testing

### Step 2: Go to Video Calls Tab
1. Login: `frontendtest@modex.com` / `TestPass123!`
2. Navigate to your team
3. Click **"Video Calls"** tab
4. Wait 3-5 seconds

### Step 3: Check Console Messages
**Look for these messages:**
- ✅ `"Jitsi script loaded"` - Good! Script loaded successfully
- ❌ `Failed to load Jitsi script` - Bad! Network issue
- ⏳ No message at all - Script might still be loading

### Step 4: Click "Start Group Call"
**What should happen in console:**
- ✅ `"Button clicked!"` - Button works!
- ✅ `"Start Group Call clicked"` - Handler is called
- ✅ `"Container: <div>..."` - Container exists
- ✅ `"JitsiMeetExternalAPI available: true"` - API loaded
- ✅ `"Creating Jitsi meeting: modex-team-..."` - Meeting starting
- ✅ `"Jitsi call started successfully"` - Success!

**Possible errors:**
- ❌ `"Jitsi container not ready"` - DOM issue
- ❌ `"Jitsi API not loaded"` - Script failed to load
- ❌ `Error starting call: ...` - Jitsi initialization failed

---

## Common Issues & Solutions

### Issue 1: No "Button clicked!" message
**Problem:** Button onClick not working
**Solutions:**
1. Check if browser console has ANY JavaScript errors
2. Refresh the page completely (Ctrl+Shift+R)
3. Try a different browser (Chrome/Firefox)

### Issue 2: "JitsiMeetExternalAPI available: false"
**Problem:** Jitsi script didn't load
**Solutions:**
1. Check internet connection
2. Check if meet.jit.si is accessible (visit https://meet.jit.si)
3. Check browser console for network errors
4. Try disabling browser extensions (ad blockers, etc.)
5. Wait 10 seconds and try again

### Issue 3: "Jitsi container not ready"
**Problem:** React ref not attached to DOM
**Solutions:**
1. Refresh the page
2. Try clicking "Members" tab, then back to "Video Calls"
3. Report this error (it's a React issue)

### Issue 4: Error message with Jitsi initialization
**Problem:** Jitsi API failed to create meeting
**Solutions:**
1. Check browser permissions for camera/mic
2. Check if camera is being used by another app
3. Try incognito/private browsing mode
4. Clear browser cache and reload

---

## Quick Debug Checklist

Run through these and report back what you see:

1. [ ] Open browser console (F12)
2. [ ] Navigate to Video Calls tab
3. [ ] Do you see "Jitsi script loaded"? (Yes/No)
4. [ ] Click "Start Group Call" button
5. [ ] Do you see "Button clicked!"? (Yes/No)
6. [ ] Do you see "JitsiMeetExternalAPI available: true"? (Yes/No)
7. [ ] Any error messages? (Copy them here)

---

## What to Report

Please check console and tell me:
1. **What messages appear when you load Video Calls tab?**
2. **What messages appear when you click the button?**
3. **Any RED error messages?**
4. **Does an alert popup appear?** (If yes, what does it say?)

---

## Alternative: Manual Jitsi Test

If buttons still don't work, test Jitsi directly:
1. Go to: https://meet.jit.si/modex-test-room-123
2. Does the video interface load?
3. Can you see yourself?

If YES → Our code has an issue
If NO → Your browser/network has an issue with Jitsi

---

## Emergency Fallback

If nothing works, I can:
1. Create a simple "Open Jitsi in New Tab" button
2. Use a different video service (Daily.co, Whereby)
3. Add more detailed error messages

**Please run the debug checklist above and share the console output!**

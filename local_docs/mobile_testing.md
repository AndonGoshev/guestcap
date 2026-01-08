# Mobile Testing Instructions

## Option 1: Public Tunnel (Recommended)
*Works on all devices (iOS & Android) without browser configuration.*

1. **Start Server:**
   ```bash
   npx next dev -H 0.0.0.0
   ```
2. **Start Tunnel** (New Terminal):
   ```bash
   npx localtunnel --port 3000
   ```
   *Copy the `https://...` URL it gives you.*

3. **Configure App:**
   - Go to **Host Dashboard** on PC.
   - Click the URL text under the QR code.
   - Paste the new `https://...` URL.

4. **On Phone:**
   - Scan QR Code.
   - **Tunnel Password:** If asked, the password is your **Public IP**.
     - Open [loca.lt/mytunnelpassword](https://loca.lt/mytunnelpassword) on your PC.
     - Copy the IP address shown (e.g. `62.73.100.221`).
     - Paste it into the "Tunnel Password" field on your phone and submit.

---

## Option 2: Local Network
*Faster, but requires Chrome configuration on Android. Does NOT work on Safari.*

1. **Start Server:**
   ```bash
   npx next dev -H 0.0.0.0
   ```
2. **Find Local IP:**
   - Run `ipconfig` (Windows) or `ifconfig` (Mac/Linux).
   - Look for `IPv4 Address` (e.g., `192.168.1.X`).

3. **Configure App:**
   - Go to **Host Dashboard**.
   - Click URL text -> Enter `http://192.168.1.X:3000`.

4. **On Phone (Android/Chrome):**
   - Go to `chrome://flags`
   - Search "Insecure origins treated as secure"
   - Enable and add: `http://192.168.1.X:3000`
   - Relaunch Chrome & Scan.

# 🔔 Discord Selfbot — Keyword Notifier

Monitors a Discord server for specific keywords and sends you instant alerts in your private channel.

---

## ⚙️ Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Create your `.env` file
```bash
cp .env.example .env
```

Then fill in the values:

```env
TOKEN=your_new_discord_user_token
MONITOR_SERVER_ID=the_server_you_want_to_watch
NOTIFY_CHANNEL_ID=your_private_channel_id
```

---

## 🔑 How to Get Your IDs

### User Token
1. Open Discord in your **browser**
2. Press `F12` → **Network** tab
3. Filter requests by `api`
4. Click any channel or send a message
5. Find a request → **Headers** → look for `Authorization`
6. That value is your token

### Server / Channel IDs
1. In Discord, go to **Settings → Advanced → Enable Developer Mode**
2. Right-click any **server** → "Copy Server ID"
3. Right-click any **channel** → "Copy Channel ID"

---

## 📝 Adding / Editing Keywords

Open `src/keywords.js` and update the array:

```js
const KEYWORDS = [
  "website development",
  "engineer",
  "your custom keyword here",
];
```

---

## 🚀 Run the Bot

```bash
node index.js
```

---

## 📁 Project Structure

```
discord-selfbot/
├── index.js                # Entry point
├── src/
│   ├── keywords.js         # Your keyword list
│   ├── messageHandler.js   # Scans messages for keywords
│   └── notifier.js         # Formats notification messages
├── .env                    # Your secrets (never commit this)
├── .env.example            # Template
└── package.json
```

---

## 🔔 Sample Notification

```
🔔 Keyword Alert!
━━━━━━━━━━━━━━━━━━━━
📌 Keywords matched: `engineer`, `web development`
🏠 Server: Some Cool Server
💬 Channel: #general
👤 Sent by: someuser#1234 (ID: `987654321`)
🕐 Time: Jan 15, 2025, 3:42 PM
📝 Message:
> Looking for a web development engineer to join our team...
🔗 Jump to message
```

---

> ⚠️ **Reminder:** Using selfbots violates Discord's ToS. Use a throwaway account for practice only.

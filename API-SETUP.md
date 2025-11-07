# 🔑 API Credentials Required

## ⚠️ Important: Get Your FREE API Credentials

The JDoodle API requires authentication. The demo credentials are no longer valid.

### 📋 Steps to Get FREE Credentials:

1. **Visit JDoodle API Page**
   👉 https://www.jdoodle.com/compiler-api

2. **Sign Up / Login**
   - Create a free account or login
   - It's completely FREE!

3. **Subscribe to FREE Plan**
   - Click "Subscribe" or "Get API Credentials"
   - Choose the **FREE** plan (200 credits/day)
   - That's enough for development and testing!

4. **Copy Your Credentials**
   - You'll receive:
     - Client ID (looks like: `abc123def456...`)
     - Client Secret (looks like: `xyz789abc123...`)

5. **Create `.env` File**
   ```bash
   # In your project root (D:\Mini Project)
   # Create a file named: .env
   ```

6. **Paste Your Credentials**
   ```env
   JDOODLE_CLIENT_ID=your_actual_client_id
   JDOODLE_CLIENT_SECRET=your_actual_client_secret
   ```

7. **Restart the Server**
   ```bash
   npm run server
   ```

### 📝 Example .env File:

```env
JDOODLE_CLIENT_ID=3b25f89f876a58a2d0b6b32d82d8db7e
JDOODLE_CLIENT_SECRET=dd8e1137c4df35d7b06e96e5d50c1f85e61e0aaf9e497e6df47c6c6f0fc55d89
```

### 🎯 What You Get:

✅ **FREE Plan Includes:**
- 200 API calls per day
- All programming languages
- No credit card required
- Perfect for learning and testing

### 💡 Demo Mode (Current):

Right now, the app runs in **DEMO MODE** which:
- ✅ Shows you your code
- ✅ Demonstrates the UI
- ❌ Doesn't actually compile
- ⚠️ Shows instructions to add API key

### ⏱️ Time Required: 2 Minutes

Getting your API credentials takes less than 2 minutes!

### 🔒 Security Note:

The `.env` file is already in `.gitignore`, so your credentials won't be committed to Git.

---

**After adding credentials, restart the server and try compiling again!** 🚀

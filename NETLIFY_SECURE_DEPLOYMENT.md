# 🚀 Food Logger - Secure Netlify Deployment

## 🎉 What This Is

**The PROPER way to deploy with AI!**

### What's Different:
- ✅ **API key hidden on server** (not in browser code!)
- ✅ **Netlify Functions** handle API calls securely
- ✅ **FREE Google Gemini** model
- ✅ **Production-ready** and secure
- ✅ **Safe to share publicly** - your key is protected!

### How It Works:
1. User uploads photo/enters text
2. Frontend calls Netlify Function
3. Function calls OpenRouter with YOUR key (hidden!)
4. Result sent back to user
5. **Your API key never leaves Netlify's servers!**

---

## 📋 SETUP STEPS

### STEP 1: Get Your OpenRouter API Key

1. **Go to:** https://openrouter.ai/keys

2. **If you haven't already:**
   - Delete/revoke your old exposed key
   - Generate a NEW key
   - Copy it somewhere safe

3. **Set spending limits:**
   - Go to https://openrouter.ai/settings/limits
   - Daily limit: $5
   - Monthly limit: $20

---

### STEP 2: Build Locally (Optional but Recommended)

Test it works before deploying:

```powershell
# Extract the zip
# Open PowerShell in folder
# Install dependencies
npm install

# Start locally (optional test)
npm start

# Build for production
npm run build
```

---

### STEP 3: Deploy to Netlify

#### Option A: GitHub (Recommended for Updates)

1. **Create GitHub repository:**
   - Go to https://github.com/new
   - Name it: `food-logger-ai`
   - Make it Public or Private
   - Click "Create repository"

2. **Push your code:**
   ```bash
   # In your project folder
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR-USERNAME/food-logger-ai.git
   git branch -M main
   git push -u origin main
   ```

3. **Connect to Netlify:**
   - Go to https://app.netlify.com/
   - Click "Add new site" → "Import an existing project"
   - Choose "GitHub"
   - Select your repository
   - Build settings are auto-detected!
   - Click "Deploy site"

#### Option B: Drag & Drop (Quick but No Updates)

1. **Go to:** https://app.netlify.com/
2. **Drag** your entire project folder (not just build folder!)
3. Netlify will build it for you
4. Wait for deployment

---

### STEP 4: Add Environment Variable (CRITICAL!)

**This is where you securely store your API key!**

1. **In Netlify, go to your site**

2. **Click "Site configuration"** (or "Site settings")

3. **Click "Environment variables"** (left menu)

4. **Click "Add a variable"** or "Add environment variable"

5. **Add this variable:**
   - **Key:** `OPENROUTER_API_KEY`
   - **Value:** `sk-or-v1-YOUR_NEW_KEY_HERE` (your actual key!)
   - **Scopes:** All (or Production)

6. **Click "Create variable"** or "Save"

7. **IMPORTANT: Redeploy!**
   - Go to "Deploys"
   - Click "Trigger deploy" → "Clear cache and deploy site"

---

### STEP 5: Test Your App!

1. **Visit your Netlify URL**
   - Something like: `https://your-app-name.netlify.app`

2. **Try manual entry:**
   - Type: "grilled chicken with rice"
   - Click "Analyze with AI"
   - Should work! ✅

3. **Try photo upload:**
   - Upload a food photo
   - Should analyze it! ✅

4. **Check security:**
   - Press F12 (DevTools)
   - Go to "Network" tab
   - Add a meal
   - Look at the request - NO API KEY visible! ✅

---

## 🔐 SECURITY BENEFITS

### Why This is Better Than tiiny.host:

**tiiny.host (static):**
- ❌ API key in browser code
- ❌ Anyone can steal your key
- ❌ Not safe to share publicly

**Netlify (with Functions):**
- ✅ API key on server only
- ✅ No one can steal your key
- ✅ Safe to share publicly
- ✅ Production-ready

### How It's Secure:

1. **Frontend code:** NO API key anywhere
2. **Netlify Function:** Has the key (server-side)
3. **Environment variable:** Stored securely on Netlify
4. **Browser:** Never sees the key

---

## 💰 COSTS

### Gemini Flash 1.5 8B (FREE!):
- $0.00 per request
- No limits for reasonable personal use
- Perfect for this app!

### Netlify:
- **Free tier includes:**
  - 100 GB bandwidth/month
  - 300 build minutes/month
  - Serverless functions
  - More than enough!

### Total Cost:
**$0/month for personal use!** 🎉

---

## 🎯 PROJECT STRUCTURE

```
food-logger-netlify/
├── netlify/
│   └── functions/
│       └── analyze-food.js    ← Secure API proxy
├── public/
│   └── index.html
├── src/
│   ├── App.js                 ← Calls Netlify Function (secure!)
│   ├── index.js
│   └── index.css
├── netlify.toml               ← Netlify config
├── package.json
└── ... (other config files)
```

---

## 🔧 CUSTOMIZATION

### Change AI Model

Edit `netlify/functions/analyze-food.js`:

```javascript
// Line 25-ish:
const selectedModel = model || 'google/gemini-flash-1.5-8b';

// Change to:
const selectedModel = model || 'google/gemini-flash-1.5'; // Higher quality
// Or:
const selectedModel = model || 'meta-llama/llama-3.2-11b-vision-instruct:free';
```

Then redeploy!

### Change Daily Goals

Edit `src/App.js`:

```javascript
const dailyGoals = {
  calories: 2000,  // Your target
  protein: 150,
  carbs: 250,
  fats: 65
};
```

---

## 🆘 TROUBLESHOOTING

### "Failed to analyze food"

**Check:**
1. Did you add `OPENROUTER_API_KEY` environment variable?
2. Is the key correct?
3. Did you redeploy after adding the variable?

**Fix:**
- Netlify Dashboard → Site configuration → Environment variables
- Verify `OPENROUTER_API_KEY` exists
- Trigger a redeploy

### "API key not configured"

**Means:** The function can't find your environment variable

**Fix:**
1. Add the environment variable (see Step 4)
2. Make sure it's named exactly: `OPENROUTER_API_KEY`
3. Redeploy the site

### "Function not found"

**Means:** Netlify Functions didn't deploy

**Fix:**
- Check `netlify.toml` exists in root
- Check `netlify/functions/` folder exists
- Redeploy with "Clear cache"

### Photos don't work

**Check:**
- Model supports vision (Gemini does!)
- Image size < 5MB
- Format is JPG, PNG, or WEBP

---

## 📱 FEATURES

### What Works:
- ✅ Real AI photo analysis (Gemini)
- ✅ Real AI text analysis
- ✅ Accurate nutrition estimates
- ✅ Secure (API key hidden)
- ✅ FREE (Gemini + Netlify free tiers)
- ✅ Data saves in browser
- ✅ Progress tracking
- ✅ Safe to share publicly!

---

## 🔄 UPDATING YOUR APP

### After making changes:

**If using GitHub:**
```bash
git add .
git commit -m "Update description"
git push
```
Netlify auto-deploys! ✅

**If using drag & drop:**
1. Make changes locally
2. `npm run build`
3. Drag entire folder to Netlify again

---

## 🎓 WHAT YOU'VE LEARNED

### Concepts:
- **Serverless functions** (Netlify Functions)
- **Environment variables** (secure config)
- **API proxy pattern** (hide keys)
- **Full-stack deployment**

### Skills:
- Deploying React apps
- Setting up backend functions
- Securing API keys properly
- Using AI APIs responsibly

---

## ✅ DEPLOYMENT CHECKLIST

Before sharing your app:

- [ ] Deployed to Netlify
- [ ] Added `OPENROUTER_API_KEY` environment variable
- [ ] Redeployed after adding variable
- [ ] Tested photo analysis
- [ ] Tested text analysis
- [ ] Verified API key not in browser code (F12 → Sources)
- [ ] Set spending limits on OpenRouter
- [ ] App works correctly

---

## 🎯 NEXT STEPS

### Now:
✅ Deploy to Netlify
✅ Add environment variable
✅ Test AI analysis
✅ Share with friends! (it's secure now!)

### Future Improvements:
- Add user authentication
- Cloud database storage
- Weekly/monthly reports
- Meal planning features
- Social sharing
- Export data as CSV

---

## 📊 COMPARISON

| Feature | tiiny.host | Netlify |
|---------|-----------|---------|
| API Key Security | ❌ Exposed | ✅ Hidden |
| Serverless Functions | ❌ No | ✅ Yes |
| Environment Variables | ❌ No | ✅ Yes |
| Auto-deploy from Git | ❌ No | ✅ Yes |
| Safe to Share | ❌ No | ✅ Yes |
| Cost | $0-$5/mo | $0/mo |
| **Recommended for** | Testing | **Production** |

---

## 🎉 SUCCESS!

You now have:
- ✅ **Secure AI-powered app**
- ✅ **Hidden API keys**
- ✅ **FREE hosting and AI**
- ✅ **Production-ready**
- ✅ **Safe to share**

**This is the RIGHT way to deploy AI apps!** 🚀

Share your Netlify URL with confidence - your API key is safe! 🔐

---

## 💡 PRO TIPS

1. **Monitor Usage:**
   - Check OpenRouter dashboard weekly
   - Watch for unusual activity

2. **Custom Domain:**
   - Netlify Settings → Domain management
   - Add your own domain (optional)

3. **Preview Deployments:**
   - Every Git push creates a preview
   - Test before going live

4. **Environment per Branch:**
   - Different keys for dev/production
   - Advanced but powerful!

---

**You're all set!** Deploy with confidence! 🚀🔐

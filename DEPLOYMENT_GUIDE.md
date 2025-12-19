# 🚀 Deployment Guide for Smart Study Planner on Render

This is a **beginner-friendly** step-by-step guide to deploy your Smart Study Planner application on Render using MongoDB Atlas.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Set Up MongoDB Atlas](#step-1-set-up-mongodb-atlas)
3. [Step 2: Prepare Your Code](#step-2-prepare-your-code)
4. [Step 3: Deploy on Render](#step-3-deploy-on-render)
5. [Step 4: Configure Environment Variables](#step-4-configure-environment-variables)
6. [Step 5: Build and Deploy](#step-5-build-and-deploy)
7. [Troubleshooting](#troubleshooting)
8. [Testing Your Deployment](#testing-your-deployment)

---

## ✅ Prerequisites

Before you start, make sure you have:

- ✅ A GitHub account
- ✅ Your code pushed to a GitHub repository
- ✅ A Render account (free tier works!) - Sign up at [render.com](https://render.com)
- ✅ MongoDB Atlas credentials (we'll set this up in Step 1)

---

## 📝 Step 1: Set Up MongoDB Atlas

MongoDB Atlas is a cloud database service. We'll use it to store your application data.

### 1.1 Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click **"Try Free"** or **"Sign In"**
3. Create a free account (it's free forever for small projects!)

### 1.2 Create a Cluster

1. After logging in, click **"Build a Database"**
2. Choose **"FREE"** (M0) tier
3. Select a cloud provider and region (choose closest to you)
4. Click **"Create"** (this takes 3-5 minutes)

### 1.3 Create Database User

1. Go to **"Database Access"** in the left sidebar
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Username: `testmailnanded21_db_user`
5. Password: `ImzzsHViEaAmG7AM` (or create your own secure password)
6. Set user privileges to **"Atlas admin"** or **"Read and write to any database"**
7. Click **"Add User"**

### 1.4 Configure Network Access

1. Go to **"Network Access"** in the left sidebar
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (for Render deployment)
   - This adds `0.0.0.0/0` to allowed IPs
4. Click **"Confirm"**

### 1.5 Get Your Connection String

1. Go to **"Database"** in the left sidebar
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Copy the connection string (it looks like this):
   ```
   mongodb+srv://testmailnanded21_db_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. **Important:** Replace `<password>` with your actual password: `ImzzsHViEaAmG7AM`
6. Add the database name at the end: `?retryWrites=true&w=majority` → `?retryWrites=true&w=majority&appName=study_planner`
7. Your final connection string should look like:
   ```
   mongodb+srv://testmailnanded21_db_user:ImzzsHViEaAmG7AM@cluster0.xxxxx.mongodb.net/study_planner?retryWrites=true&w=majority
   ```
8. **Save this connection string** - you'll need it in Step 4!

---

## 🔧 Step 2: Prepare Your Code

### 2.1 Build Your React App Locally (Optional but Recommended)

Before deploying, test that your app builds correctly:

**On Windows:**
```bash
npm install
npm run build
```

**On Mac/Linux:**
```bash
npm install
npm run build
```

If the build succeeds, you'll see a `build` folder created. This is what will be deployed.

### 2.2 Push to GitHub

Make sure all your code is pushed to GitHub:

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

---

## 🌐 Step 3: Deploy on Render

### 3.1 Create a New Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** button
3. Select **"Web Service"**

### 3.2 Connect Your Repository

1. Click **"Connect account"** if you haven't connected GitHub
2. Authorize Render to access your repositories
3. Find and select your **"smart-study-planner"** repository
4. Click **"Connect"**

### 3.3 Configure Your Service

Fill in the following settings:

- **Name:** `smart-study-planner` (or any name you like)
- **Region:** Choose closest to you (e.g., `Oregon (US West)`)
- **Branch:** `main` (or your main branch name)
- **Root Directory:** Leave empty (or `.` if required)
- **Runtime:** `Python 3`
- **Build Command:** 
  ```bash
  npm install && npm run build && pip install -r requirements.txt
  ```
- **Start Command:**
  ```bash
  gunicorn app:app
  ```

### 3.4 Choose Plan

- Select **"Free"** plan (perfect for getting started!)
- Click **"Create Web Service"**

---

## 🔐 Step 4: Configure Environment Variables

After creating the service, you need to add environment variables:

1. In your Render service dashboard, go to **"Environment"** tab
2. Click **"Add Environment Variable"** for each variable below:

### Required Environment Variables:

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `SECRET_KEY` | `your-very-secret-key-change-this-12345` | A random secret string (generate a long random string) |
| `FLASK_DEBUG` | `False` | Set to False for production |
| `MONGODB_URI` | `mongodb+srv://testmailnanded21_db_user:ImzzsHViEaAmG7AM@cluster0.xxxxx.mongodb.net/study_planner?retryWrites=true&w=majority` | Your MongoDB Atlas connection string (from Step 1.5) |
| `ALLOWED_ORIGINS` | `https://your-app-name.onrender.com` | Your Render app URL (you'll get this after first deploy) |
| `PORT` | (Leave empty) | Render sets this automatically |

**Important Notes:**
- Replace `your-very-secret-key-change-this-12345` with a long random string
- Replace `cluster0.xxxxx.mongodb.net` with your actual MongoDB cluster URL
- For `ALLOWED_ORIGINS`, use your Render app URL (e.g., `https://smart-study-planner.onrender.com`)

### How to Generate a Secret Key:

You can use this Python command:
```python
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Or use an online generator: [randomkeygen.com](https://randomkeygen.com/)

---

## 🚀 Step 5: Build and Deploy

### 5.1 First Deployment

1. After adding all environment variables, Render will automatically start building
2. You can watch the build logs in real-time
3. The first deployment takes 5-10 minutes

### 5.2 Update ALLOWED_ORIGINS

1. After the first deployment completes, you'll get a URL like: `https://smart-study-planner.onrender.com`
2. Go back to **Environment** tab
3. Update `ALLOWED_ORIGINS` to your actual Render URL:
   ```
   https://smart-study-planner.onrender.com
   ```
4. Click **"Save Changes"** - this will trigger a new deployment

### 5.3 Verify Deployment

1. Once deployment is complete, click on your app URL
2. You should see your Smart Study Planner app!
3. Try registering a new account to test

---

## 🐛 Troubleshooting

### Issue: Build Fails

**Problem:** Build command fails with errors

**Solutions:**
- Check build logs for specific error messages
- Make sure `package.json` and `requirements.txt` are in the root directory
- Verify Node.js and Python dependencies are correct
- Try building locally first: `npm run build`

### Issue: App Shows "Application Error"

**Problem:** App deploys but shows error page

**Solutions:**
1. Check **Logs** tab in Render dashboard
2. Common issues:
   - Missing environment variables
   - Wrong MongoDB connection string
   - Port configuration issue
3. Verify all environment variables are set correctly

### Issue: MongoDB Connection Fails

**Problem:** Can't connect to MongoDB Atlas

**Solutions:**
1. Verify MongoDB Atlas network access allows `0.0.0.0/0`
2. Check username and password in connection string
3. Make sure password doesn't have special characters that need URL encoding
4. Verify database name is correct: `study_planner`

### Issue: CORS Errors

**Problem:** Frontend can't connect to backend API

**Solutions:**
1. Make sure `ALLOWED_ORIGINS` matches your Render URL exactly
2. Include `https://` in the URL
3. No trailing slash: `https://app.onrender.com` (not `https://app.onrender.com/`)

### Issue: React App Not Loading

**Problem:** Blank page or 404 errors

**Solutions:**
1. Verify `build` folder was created during build
2. Check that `app.py` has `static_folder='build'`
3. Make sure build completed successfully

---

## ✅ Testing Your Deployment

After deployment, test these features:

1. **Health Check:**
   - Visit: `https://your-app.onrender.com/api/health`
   - Should return JSON with status "healthy"

2. **User Registration:**
   - Go to your app URL
   - Click "Register"
   - Create a test account
   - Should redirect to dashboard

3. **Create Study Plan:**
   - Click "Create Plan"
   - Fill in the form
   - Submit and verify plan is generated

4. **Dashboard:**
   - Check that stats load correctly
   - Verify plans are saved

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Flask Deployment Guide](https://flask.palletsprojects.com/en/latest/deploying/)

---

## 🎉 Congratulations!

Your Smart Study Planner is now live on Render! 

**Your app URL:** `https://your-app-name.onrender.com`

Share it with friends and start planning your studies! 📚✨

---

## 🔄 Updating Your App

To update your app after making changes:

1. Push changes to GitHub:
   ```bash
   git add .
   git commit -m "Update app"
   git push origin main
   ```

2. Render will automatically detect changes and redeploy
3. Watch the build logs to ensure successful deployment

---

## 💡 Pro Tips

1. **Monitor Logs:** Always check logs if something isn't working
2. **Environment Variables:** Never commit `.env` files to GitHub
3. **Database Backups:** Consider setting up MongoDB Atlas backups for production
4. **Custom Domain:** You can add a custom domain in Render settings
5. **Auto-Deploy:** Render auto-deploys on every push to main branch

---

**Need Help?** Check the troubleshooting section or Render's support documentation.

Happy Deploying! 🚀


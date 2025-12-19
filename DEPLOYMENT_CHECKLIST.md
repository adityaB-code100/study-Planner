# ✅ Deployment Checklist

Use this checklist to ensure your Smart Study Planner is ready for deployment on Render.

## Pre-Deployment

### Code Preparation
- [ ] All code committed and pushed to GitHub
- [ ] `requirements.txt` includes all dependencies (pymongo, bcrypt, gunicorn, python-dotenv)
- [ ] `package.json` has build script configured
- [ ] `.gitignore` includes `.env` file
- [ ] No hardcoded secrets or API URLs in code
- [ ] React app builds successfully locally (`npm run build`)

### MongoDB Atlas Setup
- [ ] MongoDB Atlas account created
- [ ] Free cluster created and running
- [ ] Database user created:
  - Username: `testmailnanded21_db_user`
  - Password: `ImzzsHViEaAmG7AM`
- [ ] Network access configured:
  - IP Address: `0.0.0.0/0` (Allow from anywhere)
- [ ] Connection string copied and tested
- [ ] Database name: `study_planner`

### Render Setup
- [ ] Render account created
- [ ] GitHub account connected to Render
- [ ] Repository connected to Render

## Deployment Configuration

### Render Service Settings
- [ ] Service name set
- [ ] Region selected
- [ ] Branch: `main` (or your main branch)
- [ ] Runtime: `Python 3`
- [ ] Build Command: `npm install && npm run build && pip install -r requirements.txt`
- [ ] Start Command: `gunicorn app:app`
- [ ] Plan: Free (or paid if preferred)

### Environment Variables
- [ ] `SECRET_KEY` - Random secure string (32+ characters)
- [ ] `FLASK_DEBUG` - Set to `False`
- [ ] `MONGODB_URI` - Complete MongoDB Atlas connection string
- [ ] `ALLOWED_ORIGINS` - Your Render app URL (update after first deploy)
- [ ] `PORT` - Leave empty (Render sets automatically)

## Post-Deployment

### First Deployment
- [ ] Build completes successfully
- [ ] Service starts without errors
- [ ] App URL obtained (e.g., `https://app.onrender.com`)

### Configuration Updates
- [ ] `ALLOWED_ORIGINS` updated with actual Render URL
- [ ] Service redeployed after updating `ALLOWED_ORIGINS`

### Testing
- [ ] Health check endpoint works: `/api/health`
- [ ] Homepage loads correctly
- [ ] User registration works
- [ ] User login works
- [ ] Study plan creation works
- [ ] Dashboard loads with data
- [ ] No CORS errors in browser console
- [ ] MongoDB connection successful (check logs)

### Final Verification
- [ ] All features working as expected
- [ ] No errors in Render logs
- [ ] App accessible from different devices
- [ ] Database storing data correctly

## Troubleshooting

If something doesn't work:

1. **Check Render Logs**
   - Go to "Logs" tab in Render dashboard
   - Look for error messages
   - Check MongoDB connection errors

2. **Verify Environment Variables**
   - All required variables are set
   - No typos in variable names
   - Values are correct (especially MongoDB URI)

3. **Test MongoDB Connection**
   - Verify connection string format
   - Check network access settings
   - Verify username/password

4. **Check Build Process**
   - Verify `build` folder was created
   - Check for npm/pip install errors
   - Ensure all dependencies installed

5. **CORS Issues**
   - Verify `ALLOWED_ORIGINS` matches your Render URL exactly
   - Include `https://` protocol
   - No trailing slash

## Success Criteria

✅ Your app is successfully deployed when:
- App loads without errors
- Users can register and login
- Study plans can be created
- Data persists in MongoDB
- No console errors
- All API endpoints respond correctly

---

**Need help?** Refer to [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.


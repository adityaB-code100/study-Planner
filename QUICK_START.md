# ⚡ Quick Start Guide

## For Local Development

### 1. Install Dependencies

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
pip install -r requirements.txt
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
SECRET_KEY=dev-secret-key-change-in-production
FLASK_DEBUG=True
MONGODB_URI=mongodb://localhost:27017
ALLOWED_ORIGINS=http://localhost:3000
PORT=5000
```

### 3. Build Frontend (Optional for Dev)

For development, you can run React dev server:
```bash
npm start
```

For production build:
```bash
npm run build
```

### 4. Run Backend

```bash
python app.py
```

---

## For Production Deployment on Render

### MongoDB Atlas Connection String Format

```
mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/DATABASE?retryWrites=true&w=majority
```

**Your credentials:**
- Username: `testmailnanded21_db_user`
- Password: `ImzzsHViEaAmG7AM`
- Database: `study_planner`

**Example:**
```
mongodb+srv://testmailnanded21_db_user:ImzzsHViEaAmG7AM@cluster0.xxxxx.mongodb.net/study_planner?retryWrites=true&w=majority
```

### Required Environment Variables on Render

| Variable | Value |
|----------|-------|
| `SECRET_KEY` | Random secure string |
| `FLASK_DEBUG` | `False` |
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `ALLOWED_ORIGINS` | Your Render app URL (e.g., `https://app.onrender.com`) |
| `PORT` | (Leave empty - Render sets this) |

### Build Command (Render)
```bash
npm install && npm run build && pip install -r requirements.txt
```

### Start Command (Render)
```bash
gunicorn app:app
```

---

## 📚 Full Documentation

- **Complete Deployment Guide:** [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Environment Variables:** [ENV_VARIABLES_TEMPLATE.txt](./ENV_VARIABLES_TEMPLATE.txt)

---

## ✅ Checklist Before Deploying

- [ ] Code pushed to GitHub
- [ ] MongoDB Atlas cluster created
- [ ] Database user created
- [ ] Network access configured (0.0.0.0/0)
- [ ] Connection string copied
- [ ] Render account created
- [ ] Web service created on Render
- [ ] All environment variables set
- [ ] Build command configured
- [ ] Start command configured

---

**Need help?** Check [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions!


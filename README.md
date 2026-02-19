# BP Tracker 🩺

A full-stack Blood Pressure tracking app — React + Spring Boot + MySQL.

## Project Structure
```
bp-tracker/
├── frontend/     → React app (Nginx)
├── backend/      → Spring Boot API
└── database/     → MySQL schema
```

---

## 🚀 Deploy on Railway

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/bp-tracker.git
git push -u origin main
```

### 2. Go to railway.app → New Project

### 3. Add MySQL Database
- Add Service → Database → MySQL
- Note the MYSQL_URL, MYSQL_USER, MYSQL_PASSWORD from Variables tab

### 4. Deploy Backend
- Add Service → GitHub Repo → set Root Directory: `/backend`
- Add these Variables:

| Variable | Value |
|---|---|
| DATABASE_URL | jdbc:mysql://YOUR_MYSQL_HOST:PORT/railway?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true |
| DATABASE_USERNAME | (from MySQL service MYSQL_USER) |
| DATABASE_PASSWORD | (from MySQL service MYSQL_PASSWORD) |
| JWT_SECRET | any-long-random-secret-string |

- After deploy, copy your backend URL e.g. `https://backend-xyz.railway.app`

### 5. Deploy Frontend
- Add Service → GitHub Repo → set Root Directory: `/frontend`
- Add these Variables:

| Variable | Value |
|---|---|
| REACT_APP_API_URL | https://your-backend-url.railway.app/api |

- After deploy, copy your frontend URL

### 6. Add Frontend URL to Backend (for CORS)
- Go to Backend service → Variables → add:

| Variable | Value |
|---|---|
| FRONTEND_URL | https://your-frontend-url.railway.app |

### ✅ Done! Your app is live!

---

## Run Locally

```bash
# Backend
cd backend
mvn spring-boot:run

# Frontend (new terminal)
cd frontend
npm install
npm start
```

# 👤 FixZone ERP - User Credentials

## 📋 Default Users

### 1️⃣ **Admin (المدير)**
- **Email:** `admin@fixzone.com`
- **Password:** `admin1234` (8 characters)
- **Phone:** `01111111111`
- **Role:** Admin
- **Permissions:** Full access to all features

### 2️⃣ **User (المستخدم)**
- **Email:** `user@fixzone.com`
- **Password:** `user1234` (8 characters)
- **Phone:** `01222222222`
- **Role:** User
- **Permissions:** Standard user access

### 3️⃣ **Technician (الفني)**
- **Email:** `technician@fixzone.com`
- **Password:** `tech1234` (8 characters)
- **Phone:** `01333333333`
- **Role:** Technician
- **Permissions:** Repair and service management

---

## 🔧 How to Create/Update Users

Run the following script to create or update users:

```bash
cd backend
node create-users.js
```

This script will:
- Create users if they don't exist
- Update passwords if users already exist
- Display all credentials after completion

---

## 🔒 Security Notes

⚠️ **Important:**
- These are default credentials for development/testing
- **Change passwords in production!**
- Use strong, unique passwords for production
- Never commit `.env` files or credentials to Git

---

## 🚀 Login

Access the login page at:
- **Local:** http://localhost:3000/login
- **Production:** https://yourdomain.com/login

Use any of the credentials above to login.

---

**Last Updated:** $(date +%Y-%m-%d)


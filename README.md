# Fix Zone ERP Prototype

## Overview
A prototype ERP system for Fix Zone maintenance center, covering core repair workflow, CRM, inventory, and simple reporting. Built with Node.js, MySQL, and a Bootstrap-based frontend.

## Tech Stack
- **Frontend:** HTML, CSS, JavaScript, Bootstrap
- **Backend:** Node.js (Express)
- **Database:** MySQL (FZ or FZ System)

## Project Structure
```
FixZone-Prototype/
  ├── backend/
  │   ├── app.js
  │   ├── routes/
  │   ├── controllers/
  │   ├── models/
  │   └── db.js
  ├── frontend/
  │   ├── index.html
  │   ├── css/
  │   ├── js/
  │   └── pages/
  └── README.md
```

## Setup Instructions

### 1. Prerequisites
- Node.js (v16+ recommended)
- npm
- MySQL (XAMPP or similar, database: FZ or FZ System)

### 2. Backend Setup
```
cd backend
npm install
```
- Configure `db.js` with your MySQL credentials and database name.
- Start the backend server:
```
npm start
```

### 3. Frontend Setup
- Open `frontend/index.html` in your browser, or use a simple HTTP server (e.g., `npx serve frontend`).

### 4. Database Setup
- Import the provided SQL schema into your MySQL server:
  - Use phpMyAdmin or:
    ```
    mysql -u root -p < fixzone_erp_full_schema.sql
    ```
  - Make sure the database name matches your config (FZ or FZ System).

## Connecting to MySQL
- Edit `backend/db.js`:
  ```js
  const mysql = require('mysql2');
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'FZ' // or 'FZ System'
  });
  module.exports = pool.promise();
  ```

## Example API Endpoints
- **Customers:** `GET /api/customers`, `POST /api/customers`, `GET /api/customers/:id`
- **Devices:** `GET /api/devices`, `POST /api/devices`, `GET /api/devices/:id`
- **Repair Requests:** `GET /api/repairs`, `POST /api/repairs`, `PATCH /api/repairs/:id/status`
- **Technicians:** `GET /api/technicians`, `POST /api/technicians`
- **Inventory:** `GET /api/inventory`, `POST /api/inventory`, `PATCH /api/inventory/:id/move`
- **Vendors:** `GET /api/vendors`, `POST /api/vendors`
- **Reports:** `GET /api/reports/summary`, `GET /api/reports/inventory`

---

For more details, see the backend and frontend folders. 
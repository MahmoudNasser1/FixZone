# Fix Zone ERP – Prototype Version: Basic Features

This document outlines the essential features and modules included in the prototype version of the Fix Zone ERP system. The prototype focuses on the core repair workflow, basic CRM, inventory, and simple reporting. User authentication, advanced notifications, integrations, and financial modules are excluded.

---

## Included Modules & Features

### 1. Dashboard (Basic)
- Display counts of:
  - Devices received
  - Devices under repair
  - Devices delivered
- Simple alerts for:
  - Overdue devices
  - Low stock items

### 2. Repair Requests / Tickets
- Register a new repair request with:
  - Device type, model, serial number, problem description, accessories
  - Link to customer, branch, and technician
- Track repair status:
  - Received
  - Under Inspection
  - Awaiting Approval
  - Under Repair
  - Ready for Delivery
  - Delivered
  - Rejected / Waiting for Parts
- Status change log for each request
- Simple inspection and delivery reports (text only)

### 3. Customers (CRM)
- Customer profile with:
  - Name, contact information
  - Device and repair history
  - Notes per customer

### 4. Technicians
- List of technicians
- Assign technician to each repair request

### 5. Inventory
- List inventory items:
  - Name, type, unit price, code, quantity
- Track inventory movements (in/out)
- Low stock alert

### 6. Vendors (Optional for prototype)
- List vendors
- Link vendors to inventory purchases

### 7. Simple Reports
- List of open and closed repair requests
- Inventory stock report

---

## Excluded from Prototype
- User login/authentication/roles
- Advanced notifications (WhatsApp, Email, SMS)
- Financials (invoices, expenses, salaries, commissions)
- Integrations (Google Sheets, Webhooks)
- Printing/QR/PDF
- Advanced analytics or dashboards
- Settings management

---

This prototype is intended to validate the core workflow and data structure. Additional features and modules can be added in later phases. 
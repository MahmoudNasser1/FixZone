# Fix Zone ERP System Overview Documentation

This document provides a high-level overview of the Fix Zone ERP system's architecture, key components, and their responsibilities. It aims to serve as a quick reference for understanding the project structure and the flow of operations.

## 1. Project Structure

The project is organized into several main directories, separating frontend, backend, and documentation concerns.

-   `c:\xampp\htdocs\FixZone\` (Root Directory)
    -   `backend\`
        -   `app.js`: The main entry point for the backend API routes. It exports an Express Router containing all API definitions.
        -   `db.js`: Handles the database connection (MySQL/MariaDB).
        -   `routes\`: Contains individual route files for different modules (e.g., `customers.js`, `repairs.js`). Each file defines API endpoints for a specific entity.
        -   `controllers\`: (To be implemented/used) Will contain the business logic for handling requests from routes and interacting with models.
        -   `models\`: (To be implemented/used) Will define the data structures and interact with the database (e.g., using an ORM or direct queries).
    -   `frontend\`
        -   `index.html`: The main entry point for the single-page application (SPA).
        -   `pages\`: Contains individual HTML files for different frontend views (e.g., `dashboard.html`, `customers.html`).
        -   `assets\`: Contains static assets like CSS, JavaScript files, images, etc.
    -   `node_modules\`: Contains all project dependencies.
    -   `server.js`: The main server launcher. It serves static frontend files and mounts the `backend/app.js` router under the `/api` endpoint.
    -   `TODO_FixZone_ERP.md`: A detailed task list for UI/UX design and backend development.
    -   `ui_design_prompt.md`: The original prompt detailing UI/UX requirements.
    -   `fixzone_erp_full_schema.sql`: The SQL database schema definition.
    -   `SYSTEM_OVERVIEW.md`: This documentation file.

## 2. Backend Architecture (Node.js + Express)

-   **Entry Point:** `server.js` is the primary server file. It sets up the Express application, serves static frontend files, and integrates the backend API.
-   **API Routing:** All API routes are defined within the `backend/routes` directory. `backend/app.js` aggregates these routes and exports them as a single Express Router.
-   **Database Connection:** `db.js` establishes and manages the connection to the MySQL/MariaDB database.
-   **Future Enhancements:** The `controllers` and `models` directories are placeholders for implementing a more structured MVC (Model-View-Controller) pattern, separating concerns for better maintainability and scalability.

## 3. Frontend Architecture (React.js + Tailwind - Planned)

-   Currently, the frontend consists of static HTML files. The plan is to transition to a React.js application with Tailwind CSS for a dynamic and responsive user interface.
-   `server.js` serves these static files, making them accessible via the web server.

## 4. Key Tasks and Responsibilities

-   **`server.js`**: Orchestrates the entire application. It handles incoming HTTP requests, directs static file serving, and forwards API requests to the backend router.
-   **`backend/app.js`**: Acts as the central hub for all backend API routes. It ensures that all API endpoints are properly defined and accessible under the `/api` prefix.
-   **`backend/routes/*.js`**: Defines specific API endpoints for different modules (e.g., `/api/customers`, `/api/repairs`). Each route file is responsible for handling requests related to its domain.
-   **`db.js`**: Manages the database connection, ensuring that the backend can interact with the MySQL/MariaDB database.

## 5. Next Steps (from TODO_FixZone_ERP.md)

After ensuring the server runs correctly, the immediate next steps involve implementing the core backend functionalities and corresponding frontend components, as detailed in `TODO_FixZone_ERP.md`. This includes:

-   Authentication and Authorization (Auth + Roles).
-   Dashboard module development.
-   Repair Requests module development.
-   CRM module development.
-   Inventory management.
-   Financial modules (Invoices, Payments, Expenses).

This documentation will be updated as the project evolves and new components or architectural decisions are made.

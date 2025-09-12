# Fix Zone ERP - System Overview (React Frontend)

This document provides a high-level technical overview of the **React-based frontend** for the Fix Zone ERP system. It details the architecture, key libraries, and core concepts to facilitate development and maintenance.

---

## 1. Core Technologies & Libraries

-   **Framework:** React.js (v18+)
-   **Build Tool:** Vite
-   **Routing:** React Router v6
-   **Styling:** Tailwind CSS
-   **UI Components:** shadcn/ui (a collection of reusable components built on Radix UI and Tailwind CSS)
-   **State Management:** Zustand (a small, fast, and scalable state-management solution)
-   **Icons:** Lucide React
-   **Utilities:** `clsx`, `tailwind-merge` for conditional class name management.

---

## 2. Project Structure (`frontend/react-app`)

```
/src
|-- /components         # Reusable components (Layout, Sidebar, etc.)
|   |-- /ui             # Core UI elements from shadcn/ui (Button, Card, Input)
|   |-- Dashboard.js
|   |-- Layout.js
|   |-- ProtectedRoute.js
|   |-- Sidebar.js
|   `-- ThemeProvider.js
|
|-- /pages              # Full-page components
|   `-- LoginPage.js
|
|-- /stores             # Global state management (Zustand)
|   `-- authStore.js
|
|-- App.css             # Global styles
|-- App.js              # Main application component, defines routing
|-- index.css           # Tailwind CSS base styles and directives
`-- main.jsx            # Application entry point
```

---

## 3. Key Concepts & Architecture

### a. UI System (shadcn/ui)

The UI is built on a foundation of reusable components from `shadcn/ui`. This is not a traditional component library but rather a collection of pre-built, customizable components that you own and can modify. Key components like `Button`, `Card`, `Input`, and `Label` are located in `src/components/ui`.

### b. Routing (React Router v6)

-   **File:** `src/App.js`
-   **Logic:** The application uses a nested routing structure.
    -   A standalone route for `/login` renders the `LoginPage`.
    -   A parent route `/` is protected by the `ProtectedRoute` component.
    -   All main application pages (Dashboard, Repairs, etc.) are nested inside the protected route, which renders them within the main `Layout` (which includes the `Sidebar`).

### c. Authentication Flow

1.  **State Management:** The `useAuthStore` (in `src/stores/authStore.js`) manages the user's authentication state (`isAuthenticated`, `user`, `token`) using Zustand.
2.  **Persistence:** The auth state is persisted in `localStorage` via `zustand/middleware`, keeping the user logged in across page reloads.
3.  **Login:** The `LoginPage` uses the `authStore` to perform a mock login, set the auth state, and redirect the user to the dashboard (`/`).
4.  **Protected Routes:** The `ProtectedRoute` component (`src/components/ProtectedRoute.js`) checks `isAuthenticated` from the store. If `false`, it redirects the user to `/login`.
5.  **Logout:** The `Sidebar` contains a logout button that calls the `logout` action from the `authStore`, clearing the state and redirecting the user to the login page (implicitly via the `ProtectedRoute`).

### d. Theming (Dark Mode & RTL)

-   **File:** `src/components/ThemeProvider.js`
-   **Logic:** A custom `ThemeProvider` context manages both the color theme (light/dark/system) and text direction (LTR/RTL).
-   **Persistence:** User preferences for theme and direction are stored in `localStorage`.
-   **Implementation:** The provider dynamically adds/removes the `dark` class and the `dir="rtl"` attribute to the root `<html>` element.
-   **Toggles:** The `Sidebar` contains buttons to toggle both theme and direction.

---

## 4. How to Run the Project

1.  Navigate to the frontend directory: `cd frontend/react-app`
2.  Install dependencies: `npm install`
3.  Run the development server: `npm run dev` (or `npm start` if configured)

The application will be available at `http://localhost:5173` (or another port if 5173 is busy).


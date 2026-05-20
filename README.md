# Ethara | Premium Project & Task Manager

Ethara is a state-of-the-art, premium project and task management application built using the ERN (Express, React, Node.js) stack and SQL database design. It features elegant glassmorphic dark-theme aesthetics, granular role-based access control (Admin/Member), fluid interactive Kanban boards, and aggregated workspace analytics.

---

## ⚡ Real-Time Live Demo Seeding
The application is pre-seeded with sample data to allow **immediate test-driving** of roles and dashboard statistics:

*   **Admin Account**: `admin@example.com` (Password: `password123`) — *Sarah Connor (Full Portfolio Management)*
*   **Member Account**: `member@example.com` (Password: `password123`) — *John Doe (Tasks Status boards updates)*

---

## ⚙️ Core Technical Architecture
- **Frontend**: React (Vite) + custom premium Vanilla CSS with modern styling variables. No bloated Tailwind classes. Zero-dependency custom router designed for React 19 compatibility.
- **Backend**: Node.js + Express REST APIs with modular router & controller subdivisions.
- **Database / ORM**: Sequelize ORM.
  - **Local Development**: Auto-initialized zero-setup **SQLite** file database (`backend/database.sqlite`).
  - **Production Deployment**: Auto-detects and transitions to **PostgreSQL** if a `DATABASE_URL` is supplied (perfect for Railway!).
- **Security & Authorization**: JWT token exchange + bcrypt password hashing. Granular RBAC middleware verifies membership roles prior to task and team adjustments.

---

## 🚀 Local Installation & Quick Start

1.  **Clone the Repository** and navigate to the project directory:
    ```bash
    cd ETHARA
    ```

2.  **Install All Dependencies** (in root, backend, and frontend concurrently):
    ```bash
    npm run install-all
    ```

3.  **Start Local Development Servers**:
    ```bash
    npm run dev
    ```
    This launches:
    *   **Backend Server**: [http://localhost:5000](http://localhost:5000) (Syncs SQLite and seeds data automatically)
    *   **Frontend client**: [http://localhost:5173](http://localhost:5173) (Launches React interface in browser)

---

## 🌐 How to Deploy on Railway (Single Container Method)

Ethara is configured for a **single-container deployment** which builds and bundles frontend assets directly into the backend, allowing a zero-cost, high-performance deployment:

1.  **Create a New Project on Railway**:
    *   Log in to [Railway.app](https://railway.app).
    *   Click **+ New Project** -> **Deploy from GitHub repo**.
    *   Select your repository.

2.  **Add Database (Optional)**:
    *   Click **+ Add** -> **Database** -> **Add PostgreSQL**.
    *   Railway will automatically spin up a PostgreSQL instance.

3.  **Configure Environment Variables**:
    In your Railway service variables, configure:
    *   `NODE_ENV` = `production`
    *   `JWT_SECRET` = `any-random-long-security-key`
    *   `DATABASE_URL` = `${{Postgres.DATABASE_URL}}` (If using Railway PostgreSQL database; otherwise, the app will continue to run SQLite seamlessly inside the container!)

4.  **Launch!**
    *   Railway will run the root `postinstall` script to set up backend and frontend, compile the static bundle using the root `build` script, and execute the `start` script to serve the live dashboard.

# ERP Purchase Order Management System

A sleek, modern, and high-performance **Enterprise Resource Planning (ERP)** Purchase Order system. This application was built to demonstrate full-stack capabilities, featuring a fast API backend, a PostgreSQL relational database, and a highly polished, responsive Vanilla JavaScript frontend.

## 🚀 Live Demo & Deployment
This project is fully configured for deployment on **Vercel** (`vercel.json` included).
*   **Backend Details:** Hosted via Vercel Serverless Functions using `@vercel/python`.
*   **Frontend Details:** Served statically by Vercel edge networks.
*   *Note: Ensure your environment variables are set in the Vercel dashboard prior to deployment.*

---

## 🛠 Tech Stack
### **Backend**
*   **Framework:** Python + FastAPI 
*   **ORM:** SQLAlchemy
*   **Database:** PostgreSQL (Designed for Neon DB or equivalent)
*   **Authentication:** JWT (JSON Web Tokens) with a verified Google OAuth flow integration.
*   **AI Integration:** OpenRouter API (Nvidia Nemotron 3 Super) to auto-generate professional product marketing descriptions.

### **Frontend**
*   **Framework:** HTML5, CSS3, Vanilla JavaScript (No heavy frameworks required)
*   **Styling:** Custom CSS Design System with Bootstrap 5 utility classes.
*   **UI/UX Details:** Features glassmorphism, advanced keyframe animations, staggered component loading, hover-elevate micro-interactions, and a fully responsive grid system.

---

## 📁 System Architecture
```text
project-root
├── backend/                  # FastAPI Application
│   ├── main.py               # Entrypoint & routing
│   ├── database.py           # SQLAlchemy configuration
│   ├── models.py             # Database schemas
│   ├── schemas.py            # Pydantic validation models
│   ├── routers/              # API Endpoints (Vendors, Products, POs)
│   └── auth/                 # OAuth & JWT Handling
├── frontend/                 # Static Assets
│   ├── css/                  # Centralized, modern design system
│   ├── js/                   # Dynamic form handling & API calls
│   └── *.html                # Login, Dashboard, Create PO interfaces
├── sql/                      # Optional raw schema queries
├── vercel.json               # Serverless deployment configuration
├── requirements.txt          # Python dependencies
└── README.md                 # Project documentation
```

---

## ⚙️ Local Development Setup

### 1. Database Configuration
We recommend using [Neon](https://neon.tech/) for a fast, serverless PostgreSQL instance, but any Postgres server will work.
1. Create a database.
2. Obtain your connection string.

### 2. Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL=postgresql://username:password@host/dbname?sslmode=require
JWT_SECRET=your_super_secret_jwt_key
OPENROUTER_API_KEY=your_openrouter_api_key
GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

### 3. Install Backend Dependencies
It is highly recommended to use a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Run the Backend Server
```bash
uvicorn backend.main:app --reload --port 8000
```
> The FastAPI backend will automatically construct your PostgreSQL tables on the first startup. 
> You can visit `http://localhost:8000/docs` to view the interactive Swagger API documentation.

### 5. Run the Frontend 
To avoid file-protocol CORS issues, serve the root directory locally:
```bash
python -m http.server 3000
```
> Open your browser and navigate to `http://localhost:3000/frontend/login.html`

---

## 💡 Key Features & Workflows

### **1. Secure Authentication**
*   The system supports **Google OAuth** for enterprise-grade security. 
*   A "Mock Developer Login" is available during local testing to bypass the OAuth check if you do not have a Client ID configured.

### **2. Purchase Order Creation**
*   **Dynamic Data Fetching:** Seamlessly pulls Vendor and Product catalogs from the PostgreSQL database.
*   **Real-time Calculations:** Line totals, a dynamic 5% tax application, and grand totals are calculated instantly in memory before server submission.
*   **AI Marketing Assistant:** Simply type a product name and let the integrated OpenRouter AI generate a compelling, professional-grade description for your inventory items.
*   **Responsive Tables:** Fully responsive layout that ensures the PO forms are usable on desktop and mobile environments.

### **3. Admin Dashboard**
*   View all submitted Purchase Orders in a stylized, modern data grid.
*   Observe exact timestamps, applied currency formatting (**Rs**), and order statuses.

---

*This project exemplifies a scalable, production-ready full-stack architecture built completely around modern UI paradigms and rigorous backend validation.*

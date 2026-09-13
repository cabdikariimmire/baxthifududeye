# baxth - AI Academic Research Assistant Platform

A full-stack MERN (MongoDB, Express.js, React, Node.js) platform designed for generating, editing, and managing academic research papers with precise A4 pagination, Arabic RTL typography (Amiri font), citations, and multi-format exports (PDF/DOCX).

## 🚀 Features

- **Academic Paper Generation**: Automated structural generation for academic papers with Arabic language support.
- **Strict A4 Pagination & Typography**: Accurate page-budget calculation, margins, headers, footers, and Amiri font rendering.
- **Export Capabilities**: Clean PDF and DOCX document export with preserved formatting and footnotes.
- **Admin & User Management**: Role-based access control, analytics dashboard, and system settings.
- **Authentication**: JWT-based authentication, cookie sessions, email verification, and password reset flows.

## 🛠 Tech Stack

- **Backend**: Node.js, Express.js, MongoDB (Mongoose), Nodemailer, Puppeteer, Docx
- **Frontend**: React, Vite, React Router, Lucide Icons, Modern CSS
- **AI Integration**: OpenRouter AI Provider

## 📁 Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/        # Environment and database configuration
│   │   ├── controllers/   # Request handlers
│   │   ├── middleware/    # Auth, validation, error handlers
│   │   ├── models/        # Mongoose database models
│   │   ├── routes/        # API endpoints
│   │   ├── services/      # AI, document, PDF/DOCX generators
│   │   └── utils/         # Helper functions
│   ├── tests/             # Unit and integration tests
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/    # Common UI components
│   │   ├── features/      # Feature modules (admin, auth, research, editor)
│   │   ├── pages/         # Page views
│   │   └── services/      # API client services
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## ⚙️ Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB (running locally or URI)

### Backend Setup

1. Navigate to `backend`:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```
4. Start the backend server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to `frontend`:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```

## 🔒 Security

All secrets, environment variables, and credentials must be configured locally in `.env` files and never committed to version control.

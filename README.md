# Healthcare Forms Simplified

A streamlined healthcare forms platform built with FastAPI and Google Firestore, designed for HIPAA-compliant form management.

## Architecture

- **Backend**: FastAPI + Google Firestore
- **Frontend**: React + TypeScript + SurveyJS
- **Authentication**: Firebase Auth
- **Database**: Google Cloud Firestore (NoSQL)

## Quick Start

### Backend Setup

```bash
cd backend-fastapi
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Add your Firebase credentials
# Place healthcare-forms-v2-credentials.json in backend-fastapi/

# Run the server
uvicorn main:app --reload
```

Backend will be available at: http://localhost:8000

### Frontend Setup

```bash
cd frontend
npm install --legacy-peer-deps
npm start
```

Frontend will be available at: http://localhost:3000

## Features

- 🏥 Healthcare-specific form builder
- 🔐 HIPAA-compliant data handling
- 📱 Mobile-responsive forms
- 🤖 AI-powered form generation
- 📊 Real-time form responses
- 🔒 Firebase authentication
- 📄 Multi-tenant architecture

## API Endpoints

- `POST /api/v1/auth/firebase-login/` - Authenticate with Firebase
- `GET /api/v1/forms/` - List forms
- `POST /api/v1/forms/` - Create form
- `GET /api/v1/responses/` - List form responses
- `POST /api/v1/responses/` - Submit form response

## Project Structure

```
├── backend-fastapi/
│   ├── main.py           # FastAPI application
│   ├── models/           # Pydantic models
│   ├── routers/          # API endpoints
│   └── services/         # Firebase/Firestore services
└── frontend/
    ├── src/
    │   ├── components/   # React components
    │   ├── contexts/     # Auth contexts
    │   ├── services/     # API services
    │   └── store/        # Redux store
    └── public/           # Static assets
```

## Environment Variables

### Backend
- `GOOGLE_APPLICATION_CREDENTIALS` - Path to Firebase service account

### Frontend
- `REACT_APP_API_URL` - Backend API URL (default: http://localhost:8000/api/v1)

## License

MIT
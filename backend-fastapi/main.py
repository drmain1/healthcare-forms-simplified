from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import forms, form_templates, form_responses, organizations, auth

app = FastAPI()

# CORS configuration
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://healthcare-forms-v2.web.app",
    "https://healthcare-forms-v2.firebaseapp.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(forms.router, prefix="/api/v1")
app.include_router(form_templates.router, prefix="/api/v1")
app.include_router(form_responses.router, prefix="/api/v1")
app.include_router(organizations.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")

@app.get("/health/")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

from typing import Optional
from fastapi import FastAPI, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from backend.database import get_db, Base, engine
from backend.seed_data import seed_admissions
from backend.services.kpi_service import (
    calculate_total_applications,
    calculate_applications_by_year
)

app = FastAPI(
    title="Agentic AI Institutional Decision Engine - API",
    description="Backend API for ICFAI Tech School Decision Engine",
    version="1.0.0",
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    # Initialize DB tables and seed data on app start
    Base.metadata.create_all(bind=engine)
    seed_admissions()

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "ICFAI Tech School Decision Engine Backend"}

@app.get("/api/kpis/admissions/total-applications")
def get_total_applications_kpi(
    academic_year: Optional[str] = Query(None, description="Academic year filter, e.g. '2025' or '2024'"),
    db: Session = Depends(get_db)
):
    """
    Returns Total Applications KPI for ICFAI Tech School B.Tech Admissions.
    Calculated as COUNT(DISTINCT Student_ID) from PostgreSQL database.
    """
    return calculate_total_applications(db=db, academic_year=academic_year)

@app.get("/api/kpis/admissions/applications-by-year")
def get_applications_by_year_kpi(db: Session = Depends(get_db)):
    """
    Returns yearly breakdown of unique applications for ICFAI Tech School B.Tech Admissions (2023, 2024, 2025).
    Calculated as COUNT(DISTINCT Student_ID) GROUP BY admission_year from PostgreSQL database.
    """
    return calculate_applications_by_year(db=db)

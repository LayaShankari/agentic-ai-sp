from typing import Optional
from fastapi import FastAPI, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from backend.database import get_db, Base, engine
from backend.seed_data import seed_admissions
from backend.attendance_api import router as attendance_router
from backend.academics_api import router as academics_router
from backend.auth_api import router as auth_router, seed_users
from backend.services.kpi_service import (
    calculate_total_applications,
    calculate_applications_by_year,
    calculate_total_seat_capacity,
    calculate_seats_by_branch,
    calculate_first_choice_allocation_rate,
    calculate_second_choice_allocation_rate,
    calculate_seat_utilization_rate,
    calculate_branch_demand_index,
    calculate_first_choice_allocations_by_department,
    calculate_second_choice_allocations_by_department,
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

app.include_router(auth_router)
app.include_router(attendance_router)
app.include_router(academics_router)

@app.on_event("startup")
def startup_event():
    # Initialize DB tables and seed data on app start
    Base.metadata.create_all(bind=engine)
    seed_admissions()
    seed_users()

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "ICFAI Tech School Decision Engine Backend"}

@app.get("/api/kpis/admissions/total-applications")
def get_total_applications_kpi(
    academic_year: Optional[str] = Query(None, description="Academic year filter, e.g. '2025' or '2024'"),
    department: Optional[str] = Query(None, description="Optional department preference filter"),
    db: Session = Depends(get_db)
):
    """
    Returns Total Applications KPI for ICFAI Tech School B.Tech Admissions.
    Calculated as COUNT(DISTINCT Student_ID) from PostgreSQL database.
    """
    return calculate_total_applications(db=db, academic_year=academic_year, department=department)

@app.get("/api/kpis/admissions/applications-by-year")
def get_applications_by_year_kpi(db: Session = Depends(get_db)):
    """
    Returns yearly breakdown of unique applications for ICFAI Tech School B.Tech Admissions (2023, 2024, 2025).
    Calculated as COUNT(DISTINCT Student_ID) GROUP BY admission_year from PostgreSQL database.
    """
    return calculate_applications_by_year(db=db)
@app.get("/api/kpis/admissions/seats-by-branch")
def get_seats_by_branch_kpi(db: Session = Depends(get_db)):
    """
    Returns number of filled seats for each allocated branch.
    """
    return calculate_seats_by_branch(db=db)


@app.get("/api/kpis/admissions/first-choice-by-department")
def get_first_choice_by_department(
    academic_year: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    return calculate_first_choice_allocations_by_department(db=db, academic_year=academic_year, department=department)


@app.get("/api/kpis/admissions/second-choice-by-department")
def get_second_choice_by_department(
    academic_year: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    return calculate_second_choice_allocations_by_department(db=db, academic_year=academic_year, department=department)


@app.get("/api/kpis/admissions/total-seat-capacity")
def get_total_seat_capacity_kpi(
    academic_year: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Returns Total Seat Capacity KPI for ICFAI Tech School B.Tech Admissions.
    """
    return calculate_total_seat_capacity(db=db, academic_year=academic_year, department=department)


@app.get("/api/kpis/admissions/first-choice-allocation-rate")
def get_first_choice_allocation_rate(
    academic_year: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    return calculate_first_choice_allocation_rate(db=db, academic_year=academic_year)


@app.get("/api/kpis/admissions/second-choice-allocation-rate")
def get_second_choice_allocation_rate(
    academic_year: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    return calculate_second_choice_allocation_rate(db=db, academic_year=academic_year)


@app.get("/api/kpis/admissions/seat-utilization-rate")
def get_seat_utilization_rate(
    academic_year: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    return calculate_seat_utilization_rate(db=db, academic_year=academic_year, department=department)


@app.get("/api/kpis/admissions/branch-demand-index")
def get_branch_demand_index(
    academic_year: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    return calculate_branch_demand_index(db=db, academic_year=academic_year)

@app.get("/api/kpis/admissions/seats-by-branch")
def get_seats_by_branch(db: Session = Depends(get_db)):
    """
    Returns the number of seats filled in each branch.
    """
    return calculate_seats_by_branch(db=db)

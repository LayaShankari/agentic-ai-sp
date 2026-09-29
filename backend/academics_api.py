from fastapi import APIRouter

from backend.services.academics_service import calculate_academics_dashboard


router = APIRouter(prefix="/api/kpis/academics", tags=["Academics"])


@router.get("/dashboard")
def get_academics_dashboard():
    return calculate_academics_dashboard()

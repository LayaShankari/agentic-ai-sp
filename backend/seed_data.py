import os
import pandas as pd
from backend.database import engine, Base, SessionLocal
from backend.models import Admission

EXCEL_FILE_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "SP DATASETS.xlsx")

def seed_admissions():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if not os.path.exists(EXCEL_FILE_PATH):
            print(f"[Seed] Dataset Excel file not found at {EXCEL_FILE_PATH}")
            return

        df = pd.read_excel(EXCEL_FILE_PATH, sheet_name="Admission")
        print(f"[Seed] Found {len(df)} rows in sheet 'Admission'")

        # Clear existing records to ensure clean sync
        db.query(Admission).delete()
        db.commit()

        count = 0
        for _, row in df.iterrows():
            student_id = str(row["Student_ID"]).strip()
            if not student_id or pd.isna(row["Student_ID"]):
                continue

            record = Admission(
                student_id=student_id,
                student_name=str(row.get("Student_Name", "")).strip(),
                gender=str(row.get("Gender", "")).strip() if pd.notna(row.get("Gender")) else None,
                dob=str(row.get("DOB", "")).strip() if pd.notna(row.get("DOB")) else None,
                program=str(row.get("Program", "B.Tech")).strip(),
                admission_year=str(row.get("Admission_Year", "")).strip(),
                first_choice_branch=str(row.get("First_Choice_Branch", "")).strip() if pd.notna(row.get("First_Choice_Branch")) else None,
                second_choice_branch=str(row.get("Second_Choice_Branch", "")).strip() if pd.notna(row.get("Second_Choice_Branch")) else None,
                allocated_branch=str(row.get("Allocated_Branch", "")).strip() if pd.notna(row.get("Allocated_Branch")) else None,
                seat_capacity=int(row["Seat_Capacity"]) if pd.notna(row.get("Seat_Capacity")) else None,
            )
            db.add(record)
            count += 1

        db.commit()
        print(f"[Seed] Successfully imported {count} Admissions records into database.")
    except Exception as e:
        db.rollback()
        print(f"[Seed] Error seeding admissions data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_admissions()

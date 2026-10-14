import os
import pandas as pd
from backend.database import engine, Base, SessionLocal
from backend.models import Admission
from backend.capacity_config import ECE_CAPACITY_BY_YEAR

EXCEL_FILE_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "SP DATASETS.xlsx")


def _capacity_groups_from_source(df):
    """Return only unambiguous, positive department/year capacities from the workbook."""
    groups = {}
    required = {"Admission_Year", "Allocated_Branch", "Seat_Capacity"}
    if not required.issubset(df.columns):
        return groups, ["Admission sheet is missing capacity columns"]

    conflict_labels = []
    allocated_rows = df[df["Allocated_Branch"].notna()]
    for (raw_year, raw_department), rows in allocated_rows.groupby(
        ["Admission_Year", "Allocated_Branch"], dropna=True
    ):
        year = str(raw_year).strip()
        department = str(raw_department).strip()
        if not year or not department:
            continue
        values = set()
        invalid_value = False
        for value in rows["Seat_Capacity"].dropna().tolist():
            try:
                capacity = int(value)
                if float(value) != capacity or capacity <= 0:
                    invalid_value = True
                else:
                    values.add(capacity)
            except (TypeError, ValueError, OverflowError):
                invalid_value = True
        key = (year, department)
        if department.upper() == "ECE" and year in ECE_CAPACITY_BY_YEAR:
            groups[key] = ECE_CAPACITY_BY_YEAR[year]
            continue
        if invalid_value or len(values) > 1:
            conflict_labels.append(f"{year} / {department}")
        elif len(values) == 1:
            groups[key] = values.pop()
        else:
            conflict_labels.append(f"{year} / {department} (capacity missing)")
    return groups, conflict_labels

def seed_admissions():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if not os.path.exists(EXCEL_FILE_PATH):
            print(f"[Seed] Dataset Excel file not found at {EXCEL_FILE_PATH}")
            return

        df = pd.read_excel(EXCEL_FILE_PATH, sheet_name="Admission")
        print(f"[Seed] Found {len(df)} rows in sheet 'Admission'")

        source_capacities, unresolved_capacities = _capacity_groups_from_source(df)

        # Insert only missing students. For existing students, only the seat
        # capacity field is synchronized from a resolved department/year source.
        existing_ids = {student_id for (student_id,) in db.query(Admission.student_id).all()}
        seen_source_ids = set()
        count = 0
        skipped_count = 0
        source_student_groups = {}
        for _, row in df.iterrows():
            raw_student_id = row.get("Student_ID")
            if pd.isna(raw_student_id):
                continue
            student_id = str(raw_student_id).strip()
            source_year = str(row.get("Admission_Year", "")).strip()
            raw_department = row.get("Allocated_Branch")
            source_department = str(raw_department).strip() if pd.notna(raw_department) else ""
            if source_department and (source_year, source_department) in source_capacities:
                source_student_groups.setdefault(student_id, (source_year, source_department))
            if not student_id or student_id in existing_ids or student_id in seen_source_ids:
                skipped_count += 1
                continue
            seen_source_ids.add(student_id)

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
                seat_capacity=source_capacities.get(
                    (source_year, source_department),
                    int(row["Seat_Capacity"]) if pd.notna(row.get("Seat_Capacity")) else None,
                ),
            )
            db.add(record)
            count += 1
            existing_ids.add(student_id)

        # Synchronize only the capacity field for existing rows whose department/
        # year capacity is resolved by the source or central project configuration.
        updated_capacity_count = 0
        for student_id, (year, department) in source_student_groups.items():
            record = db.query(Admission).filter(Admission.student_id == student_id).first()
            if not record or str(record.admission_year).strip() != year:
                continue
            if (record.allocated_branch or "").strip() != department:
                continue
            expected_capacity = source_capacities[(year, department)]
            if record.seat_capacity != expected_capacity:
                record.seat_capacity = expected_capacity
                updated_capacity_count += 1

        db.commit()
        print(
            f"[Seed] Added {count} Admissions records; synchronized {updated_capacity_count} capacities; "
            f"skipped {skipped_count} existing or duplicate IDs."
        )
        if unresolved_capacities:
            print("[Seed] Capacity remains unresolved; records were not synchronized for: " + ", ".join(sorted(set(unresolved_capacities))))
    except Exception as e:
        db.rollback()
        print(f"[Seed] Error seeding admissions data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_admissions()

import os
import tempfile
import unittest
from unittest.mock import patch

os.environ.setdefault("DATABASE_URL", "sqlite://")

import pandas as pd
from sqlalchemy import create_engine, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker

from backend.database import Base
from backend.models import Admission
from backend.services.kpi_service import calculate_seat_utilization_rate, calculate_total_applications, calculate_total_seat_capacity
from backend.capacity_config import ECE_CAPACITY_BY_YEAR
import backend.seed_data as seed_data


class SeatUtilizationTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(self.engine)
        self.session = sessionmaker(bind=self.engine)()

    def tearDown(self):
        self.session.close()
        self.engine.dispose()

    def add_student(self, student_id, year, department, capacity, *, allocated=True, first_choice=None, second_choice=None):
        self.session.add(Admission(
            student_id=student_id,
            student_name=student_id,
            program="B.Tech",
            admission_year=str(year),
            first_choice_branch=first_choice,
            second_choice_branch=second_choice,
            allocated_branch=department if allocated else None,
            seat_capacity=capacity,
        ))
        self.session.commit()

    def test_conflicting_non_ece_capacity_is_reported(self):
        self.add_student("S1", 2023, "CSE", 30)
        self.add_student("S2", 2023, "CSE", 35)

        result = calculate_seat_utilization_rate(self.session, "2023")

        self.assertFalse(result["available"])
        self.assertIsNone(result["value"])
        self.assertIsNone(result["total_capacity"])
        self.assertEqual(result["allocated_students"], 2)
        self.assertEqual(result["capacity_conflicts"], [{
            "academic_year": "2023",
            "department": "CSE",
            "values": [30, 35],
        }])

    def test_ece_fixed_capacity_applies_to_each_year_and_all_years(self):
        self.assertEqual(ECE_CAPACITY_BY_YEAR, {"2023": 25, "2024": 25, "2025": 25})
        for year in ("2023", "2024", "2025"):
            self.add_student(f"{year}-A", year, "ECE", 15, first_choice="ECE")
            self.add_student(f"{year}-B", year, "ECE", 25, second_choice="ECE")
            self.add_student(f"{year}-C", year, "CSE", 30)

        for year in ("2023", "2024", "2025"):
            result = calculate_seat_utilization_rate(self.session, year)
            self.assertTrue(result["available"])
            self.assertEqual(result["allocated_students"], 3)
            self.assertEqual(result["total_capacity"], 55)
            self.assertAlmostEqual(result["value"], 3 / 55 * 100)
            self.assertEqual(
                {row["department"]: row["capacity"] for row in result["capacity_by_department_year"]}["ECE"],
                25,
            )

        all_years = calculate_seat_utilization_rate(self.session, "All")
        total_capacity = calculate_total_seat_capacity(self.session, "All")
        self.assertEqual(all_years["allocated_students"], 9)
        self.assertEqual(all_years["total_capacity"], 165)
        self.assertAlmostEqual(all_years["value"], 9 / 165 * 100)
        self.assertEqual(total_capacity["value"], 165)

    def test_department_filter_keeps_applications_allocations_and_capacity_aligned(self):
        self.add_student("E1", 2023, "ECE", 15, first_choice="ECE")
        self.add_student("E2", 2023, "ECE", 25, second_choice="ECE")
        self.add_student("C1", 2023, "CSE", 30, first_choice="CSE")

        utilization = calculate_seat_utilization_rate(self.session, "2023", "ECE")
        capacity = calculate_total_seat_capacity(self.session, "2023", "ECE")
        applications = calculate_total_applications(self.session, "2023", "ECE")

        self.assertEqual(utilization["allocated_students"], 2)
        self.assertEqual(utilization["total_capacity"], 25)
        self.assertAlmostEqual(utilization["value"], 8)
        self.assertEqual(capacity["value"], 25)
        self.assertEqual(applications["value"], 2)

    def test_ece_capacity_filters_apply_consistently(self):
        self.add_student("A23", "2023", "ECE", 15)
        self.add_student("B23", "2023", "ECE", 25)
        self.add_student("A24", "2024", "ECE", 15)
        result = calculate_seat_utilization_rate(self.session, "2023")
        self.assertEqual(result["allocated_students"], 2)
        self.assertEqual(result["total_capacity"], 25)
        self.assertAlmostEqual(result["value"], 8)

    def test_unresolved_year_does_not_hide_independently_valid_year(self):
        self.add_student("S1", 2023, "ECE", 15)
        self.add_student("S2", 2023, "ECE", 25)
        self.add_student("S3", 2024, "CSE", 30)

        result = calculate_seat_utilization_rate(self.session, "2024")

        self.assertTrue(result["available"])
        self.assertEqual(result["allocated_students"], 1)
        self.assertEqual(result["total_capacity"], 30)
        self.assertAlmostEqual(result["value"], 100 / 30)

    def test_all_years_uses_each_year_department_capacity_once(self):
        for student_id in ("S1", "S2"):
            self.add_student(student_id, 2023, "CSE", 30)
        self.add_student("S3", 2024, "CSE", 40)
        result = calculate_seat_utilization_rate(self.session, "All")

        self.assertEqual(result["allocated_students"], 3)
        self.assertEqual(result["total_capacity"], 70)
        self.assertAlmostEqual(result["value"], 3 / 70 * 100)

    def test_capacity_and_application_totals_are_filtered_by_academic_year(self):
        for student_id in ("S1", "S2", "S3"):
            self.add_student(student_id, 2023, "CSE", 30)
        for student_id in ("S4", "S5"):
            self.add_student(student_id, 2024, "CSE", 40)

        all_years = calculate_seat_utilization_rate(self.session)
        year_2023 = calculate_seat_utilization_rate(self.session, "2023")
        applications_2023 = calculate_total_applications(self.session, "2023")
        applications_2024 = calculate_total_applications(self.session, "2024")

        self.assertEqual(all_years["allocated_students"], 5)
        self.assertEqual(all_years["total_capacity"], 70)
        self.assertAlmostEqual(all_years["value"], 5 / 70 * 100)
        self.assertEqual(year_2023["allocated_students"], 3)
        self.assertEqual(year_2023["total_capacity"], 30)
        self.assertAlmostEqual(year_2023["value"], 10)
        self.assertEqual(applications_2023["value"], 3)
        self.assertEqual(applications_2024["value"], 2)

    def test_unallocated_applications_are_not_counted_as_filled_seats(self):
        self.add_student("S1", 2023, "CSE", 30)
        self.add_student("S2", 2023, "CSE", 30)
        self.add_student("S3", 2023, "CSE", 30, allocated=False)

        result = calculate_seat_utilization_rate(self.session, "2023")

        self.assertEqual(result["allocated_students"], 2)
        self.assertEqual(result["total_capacity"], 30)
        self.assertAlmostEqual(result["value"], 2 / 30 * 100)

    def test_missing_capacity_makes_utilization_unavailable(self):
        self.add_student("S1", 2023, "CSE", None)

        result = calculate_seat_utilization_rate(self.session, "2023")

        self.assertFalse(result["available"])
        self.assertIsNone(result["value"])
        self.assertIsNone(result["total_capacity"])
        self.assertIn("2023 / CSE", result["missing_capacity_groups"])

    def test_over_capacity_is_reported_without_capping_percentage(self):
        self.add_student("S1", 2023, "CSE", 1)
        self.add_student("S2", 2023, "CSE", 1)

        result = calculate_seat_utilization_rate(self.session, "2023")

        self.assertTrue(result["over_capacity"])
        self.assertEqual(result["value"], 200)

    def test_primary_key_prevents_duplicate_student_rows(self):
        self.add_student("S1", 2023, "CSE", 30)
        self.session.add(Admission(
            student_id="S1",
            student_name="Duplicate",
            program="B.Tech",
            admission_year="2023",
            allocated_branch="CSE",
            seat_capacity=30,
        ))
        with self.assertRaises(IntegrityError):
            self.session.commit()
        self.session.rollback()

        count = self.session.query(func.count(func.distinct(Admission.student_id))).scalar()
        self.assertEqual(count, 1)


class AdmissionImportTests(unittest.TestCase):
    def test_seed_syncs_consistent_capacities_and_applies_fixed_ece_capacity(self):
        engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(engine)
        TestSession = sessionmaker(bind=engine)
        with TestSession() as session:
            session.add(Admission(
                student_id="EXISTING",
                student_name="Existing",
                program="B.Tech",
                admission_year="2023",
                allocated_branch="CSE",
                seat_capacity=29,
            ))
            session.add(Admission(
                student_id="ECE_EXISTING",
                student_name="ECE student",
                program="B.Tech",
                admission_year="2023",
                allocated_branch="ECE",
                seat_capacity=12,
            ))
            session.commit()

        source = pd.DataFrame([
            {"Student_ID": "EXISTING", "Student_Name": "Workbook copy", "Program": "B.Tech", "Admission_Year": "2023", "Allocated_Branch": "CSE", "Seat_Capacity": 30},
            {"Student_ID": "NEW", "Student_Name": "New student", "Program": "B.Tech", "Admission_Year": "2023", "Allocated_Branch": "CSE", "Seat_Capacity": 30},
            {"Student_ID": "NEW", "Student_Name": "Duplicate source row", "Program": "B.Tech", "Admission_Year": "2023", "Allocated_Branch": "CSE", "Seat_Capacity": 30},
            {"Student_ID": "ECE_EXISTING", "Student_Name": "ECE copy", "Program": "B.Tech", "Admission_Year": "2023", "Allocated_Branch": "ECE", "Seat_Capacity": 15},
            {"Student_ID": "ECE_NEW", "Student_Name": "ECE new", "Program": "B.Tech", "Admission_Year": "2023", "Allocated_Branch": "ECE", "Seat_Capacity": 25},
        ])
        with tempfile.NamedTemporaryFile() as dataset_file:
            with patch.object(seed_data, "engine", engine), \
                 patch.object(seed_data, "SessionLocal", TestSession), \
                 patch.object(seed_data, "EXCEL_FILE_PATH", dataset_file.name), \
                 patch.object(seed_data.pd, "read_excel", return_value=source):
                seed_data.seed_admissions()
                seed_data.seed_admissions()

        with TestSession() as session:
            rows = {row.student_id: row for row in session.query(Admission).all()}
            self.assertEqual(set(rows), {"EXISTING", "NEW", "ECE_EXISTING", "ECE_NEW"})
            self.assertEqual(rows["EXISTING"].seat_capacity, 30)
            self.assertEqual(rows["NEW"].seat_capacity, 30)
            self.assertEqual(rows["ECE_EXISTING"].seat_capacity, 25)
            self.assertEqual(rows["ECE_NEW"].seat_capacity, 25)
            self.assertEqual(session.query(func.count(Admission.student_id)).scalar(), 4)
        engine.dispose()


if __name__ == "__main__":
    unittest.main()

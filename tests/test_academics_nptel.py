import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import pandas as pd

from backend.services.academics_service import calculate_academics_dashboard


class AcademicsNptelTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.workbook = Path(self.temp_dir.name) / "academics.xlsx"
        academics = pd.DataFrame([
            {"Student_id": "S1", "Semester": 1, "Average_Marks": 65, "CGPA": 7.5, "Academic_Performance": "Good", "NPTEL_Participation": "Yes", "Internship_Participation": "No", "Placement_After_Internship": "No"},
            {"Student_id": "S1", "Semester": 2, "Average_Marks": 70, "CGPA": 8.1, "Academic_Performance": "Good", "NPTEL_Participation": "Yes", "Internship_Participation": "No", "Placement_After_Internship": "No"},
            {"Student_id": "S2", "Semester": 1, "Average_Marks": 55, "CGPA": 7.0, "Academic_Performance": "Average", "NPTEL_Participation": "No", "Internship_Participation": "No", "Placement_After_Internship": "No"},
            {"Student_id": "S3", "Semester": 1, "Average_Marks": 80, "CGPA": 9.0, "Academic_Performance": "Good", "NPTEL_Participation": "Yes", "Internship_Participation": "No", "Placement_After_Internship": "No"},
        ])
        admissions = pd.DataFrame([
            {"Student_ID": "S1", "Admission_Year": 2024, "Allocated_Branch": "CSE"},
            {"Student_ID": "S2", "Admission_Year": 2024, "Allocated_Branch": "CSE"},
            {"Student_ID": "S3", "Admission_Year": 2025, "Allocated_Branch": "ECE"},
        ])
        with pd.ExcelWriter(self.workbook) as writer:
            academics.to_excel(writer, sheet_name="Academics", index=False)
            admissions.to_excel(writer, sheet_name="Admission", index=False)

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_nptel_counts_unique_students_and_respects_academic_year(self):
        with patch("backend.services.academics_service.ACADEMICS_DATASET", self.workbook):
            all_years = calculate_academics_dashboard()
            year_2024 = calculate_academics_dashboard(academic_year="2024")

        self.assertEqual(all_years["nptel_participant_count"], 2)
        self.assertEqual(all_years["nptel_participation_percentage"], 66.67)
        self.assertEqual(
            all_years["nptel_by_department_year"],
            [
                {"academic_year": "2024", "department": "CSE", "student_count": 2, "participant_count": 1},
                {"academic_year": "2025", "department": "ECE", "student_count": 1, "participant_count": 1},
            ],
        )
        self.assertEqual(year_2024["nptel_participant_count"], 1)
        self.assertEqual(year_2024["nptel_by_department_year"], [
            {"academic_year": "2024", "department": "CSE", "student_count": 2, "participant_count": 1}
        ])
        self.assertEqual(year_2024["departments"], ["CSE", "ECE"])


if __name__ == "__main__":
    unittest.main()

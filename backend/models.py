from sqlalchemy import Column, String, Integer
from backend.database import Base

class Admission(Base):
    __tablename__ = "admissions"

    student_id = Column(String, primary_key=True, index=True)
    student_name = Column(String, nullable=False)
    gender = Column(String, nullable=True)
    dob = Column(String, nullable=True)
    program = Column(String, nullable=False, default="B.Tech")
    admission_year = Column(String, nullable=False, index=True)
    first_choice_branch = Column(String, nullable=True)
    second_choice_branch = Column(String, nullable=True)
    allocated_branch = Column(String, nullable=True)
    seat_capacity = Column(Integer, nullable=True)

    def to_dict(self):
        return {
            "student_id": self.student_id,
            "student_name": self.student_name,
            "gender": self.gender,
            "dob": self.dob,
            "program": self.program,
            "admission_year": self.admission_year,
            "first_choice_branch": self.first_choice_branch,
            "second_choice_branch": self.second_choice_branch,
            "allocated_branch": self.allocated_branch,
            "seat_capacity": self.seat_capacity,
        }

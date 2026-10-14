"""Central seat-capacity configuration for values that lack authoritative rows."""

import os


def _positive_capacity(variable: str, default: str) -> int:
    raw_value = os.getenv(variable, default).strip()
    try:
        capacity = int(raw_value)
    except ValueError as error:
        raise ValueError(f"{variable} must be a positive integer") from error
    if capacity <= 0:
        raise ValueError(f"{variable} must be a positive integer")
    return capacity


# The workbook records ECE capacities of both 15 and 25 with no effective dates.
# 25 is the explicit project default: it is already present in source records and
# accommodates the highest observed ECE allocation count (23). Institutions can
# set ECE_SEAT_CAPACITY once in the backend environment to replace this value.
ECE_SEAT_CAPACITY = _positive_capacity("ECE_SEAT_CAPACITY", "25")
ECE_CAPACITY_BY_YEAR = {year: ECE_SEAT_CAPACITY for year in ("2023", "2024", "2025")}

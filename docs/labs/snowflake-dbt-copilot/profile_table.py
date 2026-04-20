"""
profile_table.py

Lightweight data profiler for the OctoCAT Supply Snowflake + dbt + Copilot lab.

Students complete this stub in Exercise 4 using GitHub Copilot Agent mode.
The finished script reads a CSV file and prints, for each column:
    - total row count
    - null percentage
    - distinct value count

Intentionally has zero third-party dependencies — the standard library is
enough. Run with:

    python profile_table.py seeds/raw_sales.csv
"""

from __future__ import annotations

import sys
from pathlib import Path


def profile_table(csv_path: Path) -> None:
    """Print a simple profile (row count, null %, distinct count) per column.

    TODO (students): Implement this function with GitHub Copilot Agent mode.

    Requirements:
      1. Read the CSV at ``csv_path`` using only the standard library
         (csv module is fine — no pandas required).
      2. Print the total row count once at the top.
      3. For every column, print:
           - column name
           - null percentage (treat empty strings as null), formatted to 1 decimal
           - distinct non-null value count
      4. Exit with a non-zero status code if the file does not exist.

    Hint: ask Copilot something like
        "Implement profile_table so it prints row count, null %,
         and distinct counts per column for the CSV at csv_path."
    """
    raise NotImplementedError("Complete this function with GitHub Copilot Agent mode.")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python profile_table.py <path-to-csv>")
        sys.exit(2)
    profile_table(Path(sys.argv[1]))

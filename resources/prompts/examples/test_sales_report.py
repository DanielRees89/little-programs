#!/usr/bin/env python3
"""
Test script to verify the sales analysis Excel report generation works correctly.
This loads sample data and runs the report generator.
"""

import pandas as pd
import sys
import os

# Change to the examples directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Load the sample data
csv_file = 'sample_sales_data.csv'
if len(sys.argv) > 1:
    csv_file = sys.argv[1]

print(f"Loading data from: {csv_file}")
df = pd.read_csv(csv_file)
print(f"Loaded {len(df)} rows with columns: {df.columns.tolist()}")

# Now execute the report generator
# (In the actual chat system, df would already be loaded)
exec(open('sales_analysis_excel_report.py').read())

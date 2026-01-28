#!/bin/bash
# Install Python data science dependencies for Little Programs
# Run with: sudo ./install-python-deps.sh

set -e

echo "=========================================="
echo "Installing Python Data Science Dependencies"
echo "=========================================="
echo ""

# Check if running as root/sudo for system-wide install
if [ "$EUID" -ne 0 ]; then
    echo "Note: Running without sudo. Installing to user directory."
    PIP_ARGS="--user"
else
    echo "Running with elevated privileges. Installing system-wide."
    PIP_ARGS=""
fi

# Upgrade pip first
echo ""
echo ">>> Upgrading pip..."
python3 -m pip install --upgrade pip $PIP_ARGS

# Install requirements
echo ""
echo ">>> Installing data science packages..."
python3 -m pip install -r requirements.txt $PIP_ARGS

# Verify installation
echo ""
echo ">>> Verifying installation..."
python3 -c "
import pandas as pd
import numpy as np
import matplotlib
import seaborn as sns
import openpyxl
import xlsxwriter
import reportlab

print('All packages installed successfully!')
print(f'  - pandas: {pd.__version__}')
print(f'  - numpy: {np.__version__}')
print(f'  - matplotlib: {matplotlib.__version__}')
print(f'  - seaborn: {sns.__version__}')
print(f'  - openpyxl: {openpyxl.__version__}')
"

echo ""
echo "=========================================="
echo "Installation complete!"
echo "=========================================="

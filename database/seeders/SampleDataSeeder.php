<?php

namespace Database\Seeders;

use App\Models\DataFile;
use App\Models\Script;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class SampleDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create or get test user
        $user = User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => Hash::make('password'),
            ]
        );

        $this->command->info("User: test@example.com / password");

        // Create sample scripts
        $this->createSampleScripts($user);

        // Create sample CSV file
        $this->createSampleDataFile($user);
    }

    protected function createSampleScripts(User $user): void
    {
        $scripts = [
            [
                'name' => 'Basic Statistics',
                'description' => 'Calculate basic descriptive statistics for all numeric columns',
                'code' => <<<'PYTHON'
import pandas as pd
import numpy as np

print("=== Basic Statistics ===\n")
print(f"Dataset Shape: {df.shape[0]} rows, {df.shape[1]} columns\n")

print("--- Numeric Summary ---")
print(df.describe().round(2).to_string())

print("\n--- Missing Values ---")
missing = df.isnull().sum()
if missing.sum() > 0:
    print(missing[missing > 0].to_string())
else:
    print("No missing values found!")

print("\n--- Data Types ---")
print(df.dtypes.to_string())
PYTHON,
            ],
            [
                'name' => 'Column Distribution Chart',
                'description' => 'Create a histogram for numeric columns',
                'code' => <<<'PYTHON'
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Get numeric columns
numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()

if len(numeric_cols) == 0:
    print("No numeric columns found in the dataset!")
else:
    # Create subplots for each numeric column
    n_cols = min(len(numeric_cols), 3)
    n_rows = (len(numeric_cols) + n_cols - 1) // n_cols
    
    fig, axes = plt.subplots(n_rows, n_cols, figsize=(5*n_cols, 4*n_rows))
    axes = np.array(axes).flatten() if len(numeric_cols) > 1 else [axes]
    
    for i, col in enumerate(numeric_cols):
        sns.histplot(df[col].dropna(), ax=axes[i], kde=True, color='steelblue')
        axes[i].set_title(f'Distribution of {col}')
        axes[i].set_xlabel(col)
    
    # Hide unused subplots
    for j in range(len(numeric_cols), len(axes)):
        axes[j].set_visible(False)
    
    plt.tight_layout()
    plt.savefig('distributions.png', dpi=150, bbox_inches='tight')
    plt.close()
    
    print(f"Created histogram for {len(numeric_cols)} numeric columns")
    print("Chart saved: distributions.png")
PYTHON,
            ],
            [
                'name' => 'Top 10 Analysis',
                'description' => 'Show top 10 rows sorted by first numeric column',
                'code' => <<<'PYTHON'
import pandas as pd

# Find first numeric column
numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()

if len(numeric_cols) == 0:
    print("No numeric columns found. Showing first 10 rows:")
    print(df.head(10).to_string())
else:
    sort_col = numeric_cols[0]
    print(f"=== Top 10 by {sort_col} ===\n")
    top_10 = df.nlargest(10, sort_col)
    print(top_10.to_string())
    
    print(f"\n--- Summary ---")
    print(f"Max {sort_col}: {df[sort_col].max()}")
    print(f"Min {sort_col}: {df[sort_col].min()}")
    print(f"Mean {sort_col}: {df[sort_col].mean():.2f}")
PYTHON,
            ],
            [
                'name' => 'Export to Excel',
                'description' => 'Export data to a formatted Excel file',
                'code' => <<<'PYTHON'
import pandas as pd
from openpyxl.styles import Font, PatternFill, Alignment

# Create Excel writer
with pd.ExcelWriter('export.xlsx', engine='openpyxl') as writer:
    # Write main data
    df.to_excel(writer, sheet_name='Data', index=False)
    
    # Write summary statistics
    summary = df.describe()
    summary.to_excel(writer, sheet_name='Summary')
    
    # Get workbook and format headers
    wb = writer.book
    
    for sheet_name in wb.sheetnames:
        ws = wb[sheet_name]
        header_fill = PatternFill(start_color="1F2937", end_color="1F2937", fill_type="solid")
        header_font = Font(bold=True, color="FFFFFF")
        
        for cell in ws[1]:
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center")
        
        # Auto-adjust column widths
        for column in ws.columns:
            max_length = max(len(str(cell.value or "")) for cell in column)
            ws.column_dimensions[column[0].column_letter].width = min(max_length + 2, 50)

print("Excel file created with formatted headers")
print("Sheets: Data, Summary")
print("File saved: export.xlsx")
PYTHON,
            ],
        ];

        foreach ($scripts as $scriptData) {
            Script::updateOrCreate(
                ['user_id' => $user->id, 'name' => $scriptData['name']],
                [
                    'description' => $scriptData['description'],
                    'code' => $scriptData['code'],
                    'language' => 'python',
                ]
            );
        }

        $this->command->info("Created " . count($scripts) . " sample scripts");
    }

    protected function createSampleDataFile(User $user): void
    {
        // Create sample CSV content
        $csvContent = "id,name,category,price,quantity,date\n";
        $categories = ['Electronics', 'Clothing', 'Food', 'Books', 'Home'];
        $names = ['Widget', 'Gadget', 'Thing', 'Item', 'Product'];
        
        for ($i = 1; $i <= 100; $i++) {
            $name = $names[array_rand($names)] . ' ' . $i;
            $category = $categories[array_rand($categories)];
            $price = round(rand(100, 10000) / 100, 2);
            $quantity = rand(1, 100);
            $date = date('Y-m-d', strtotime("-" . rand(0, 365) . " days"));
            
            $csvContent .= "{$i},{$name},{$category},{$price},{$quantity},{$date}\n";
        }

        // Store the file
        $path = "user-files/{$user->id}/sample_sales_data.csv";
        Storage::disk('local')->put($path, $csvContent);

        // Create database record
        DataFile::updateOrCreate(
            ['user_id' => $user->id, 'name' => 'sample_sales_data.csv'],
            [
                'path' => $path,
                'size' => strlen($csvContent),
                'mime_type' => 'text/csv',
                'row_count' => 100,
                'column_count' => 6,
                'columns_metadata' => [
                    ['name' => 'id', 'type' => 'integer', 'sample_values' => ['1', '2', '3']],
                    ['name' => 'name', 'type' => 'string', 'sample_values' => ['Widget 1', 'Gadget 2', 'Thing 3']],
                    ['name' => 'category', 'type' => 'string', 'sample_values' => ['Electronics', 'Clothing', 'Food']],
                    ['name' => 'price', 'type' => 'float', 'sample_values' => ['19.99', '45.50', '12.00']],
                    ['name' => 'quantity', 'type' => 'integer', 'sample_values' => ['10', '25', '5']],
                    ['name' => 'date', 'type' => 'date', 'sample_values' => ['2024-01-15', '2024-02-20', '2024-03-10']],
                ],
            ]
        );

        $this->command->info("Created sample CSV file: sample_sales_data.csv");
    }
}

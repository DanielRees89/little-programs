"""
CHART/VISUALIZATION EXAMPLES
============================
This script shows how to create various chart types with proper styling.
Charts are saved as PNG files that the user can download.

IMPORTANT: Always use plt.close() after saving to prevent memory issues.
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from datetime import datetime

# ============================================
# BRAND COLOR CONFIGURATION
# ============================================
# Always define colors at the top for consistency
BRAND_PRIMARY = '#822F23'    # Main brand color
BRAND_SECONDARY = '#D67D63'  # Secondary color
BRAND_ACCENT = '#A1945F'     # Accent color
BRAND_LIGHT = '#F6EFDB'      # Light background
BRAND_DARK = '#1f2937'       # Dark text/elements

# Color palette for multiple series
COLORS = [BRAND_PRIMARY, BRAND_SECONDARY, BRAND_ACCENT, '#F1A19D', '#6B7280']

# ============================================
# MATPLOTLIB STYLE SETUP
# ============================================
plt.style.use('seaborn-v0_8-whitegrid')
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['font.size'] = 10
plt.rcParams['axes.titlesize'] = 14
plt.rcParams['axes.titleweight'] = 'bold'
plt.rcParams['axes.labelsize'] = 11
plt.rcParams['axes.spines.top'] = False
plt.rcParams['axes.spines.right'] = False

# ============================================
# PREPARE DATA (df is pre-loaded)
# ============================================
df['Day'] = pd.to_datetime(df['Day'])

daily = df.groupby('Day').agg({
    'Orders': 'sum',
    'Gross sales': 'sum',
    'Net sales': 'sum',
    'Gross profit': 'sum',
    'Discounts': 'sum'
}).reset_index()

daily['AOV'] = daily['Gross sales'] / daily['Orders']
daily['Discount_Rate'] = (abs(daily['Discounts']) / daily['Gross sales'] * 100)

print(f"Data ready: {len(daily)} days")

# ============================================
# CHART 1: LINE CHART - Time Series
# ============================================
fig, ax = plt.subplots(figsize=(12, 5))

# Plot with fill
ax.fill_between(daily['Day'], daily['Gross sales'], alpha=0.3, color=BRAND_SECONDARY)
ax.plot(daily['Day'], daily['Gross sales'], color=BRAND_PRIMARY, linewidth=2.5, marker='o', markersize=4)

# Formatting
ax.set_xlabel('Date', fontweight='bold')
ax.set_ylabel('Gross Sales ($)', fontweight='bold')
ax.set_title('Daily Gross Sales - November 2025', color=BRAND_PRIMARY, pad=15)
ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'${x/1000:.0f}K'))
ax.xaxis.set_major_formatter(mdates.DateFormatter('%b %d'))
ax.xaxis.set_major_locator(mdates.DayLocator(interval=3))
plt.xticks(rotation=45, ha='right')

# Add average line
avg_sales = daily['Gross sales'].mean()
ax.axhline(y=avg_sales, color=BRAND_ACCENT, linestyle='--', linewidth=2, alpha=0.7)
ax.text(daily['Day'].iloc[-1], avg_sales, f'  Avg: ${avg_sales/1000:.0f}K', 
        va='center', color=BRAND_ACCENT, fontweight='bold')

plt.tight_layout()
plt.savefig('chart_line_sales.png', dpi=150, bbox_inches='tight', facecolor='white')
plt.close()
print("✓ Saved: chart_line_sales.png")

# ============================================
# CHART 2: BAR CHART - With Highlighting
# ============================================
fig, ax = plt.subplots(figsize=(12, 5))

# Color bars differently for special periods (e.g., Black Friday)
bar_colors = [BRAND_PRIMARY if d.day >= 28 else BRAND_SECONDARY for d in daily['Day']]
bars = ax.bar(daily['Day'], daily['Orders'], color=bar_colors, edgecolor='white', linewidth=0.5)

# Annotate the peak
max_idx = daily['Orders'].idxmax()
max_day = daily.loc[max_idx, 'Day']
max_orders = daily.loc[max_idx, 'Orders']
ax.annotate(f'Peak: {max_orders:,}', xy=(max_day, max_orders), 
            xytext=(max_day - pd.Timedelta(days=3), max_orders * 0.85),
            fontsize=10, fontweight='bold', color=BRAND_PRIMARY,
            arrowprops=dict(arrowstyle='->', color=BRAND_PRIMARY, lw=2))

ax.set_xlabel('Date', fontweight='bold')
ax.set_ylabel('Orders', fontweight='bold')
ax.set_title('Daily Order Volume', color=BRAND_PRIMARY, pad=15)
ax.xaxis.set_major_formatter(mdates.DateFormatter('%b %d'))
ax.xaxis.set_major_locator(mdates.DayLocator(interval=3))
plt.xticks(rotation=45, ha='right')

plt.tight_layout()
plt.savefig('chart_bar_orders.png', dpi=150, bbox_inches='tight', facecolor='white')
plt.close()
print("✓ Saved: chart_bar_orders.png")

# ============================================
# CHART 3: DUAL AXIS CHART
# ============================================
fig, ax1 = plt.subplots(figsize=(12, 5))

# Primary axis - bars
bars = ax1.bar(daily['Day'], daily['Orders'], color=BRAND_SECONDARY, alpha=0.7, label='Orders')
ax1.set_xlabel('Date', fontweight='bold')
ax1.set_ylabel('Orders', color=BRAND_SECONDARY, fontweight='bold')
ax1.tick_params(axis='y', labelcolor=BRAND_SECONDARY)

# Secondary axis - line
ax2 = ax1.twinx()
ax2.plot(daily['Day'], daily['Gross sales']/1000, color=BRAND_PRIMARY, linewidth=2.5, 
         marker='o', markersize=4, label='Sales ($K)')
ax2.set_ylabel('Gross Sales ($K)', color=BRAND_PRIMARY, fontweight='bold')
ax2.tick_params(axis='y', labelcolor=BRAND_PRIMARY)

# Title and formatting
ax1.set_title('Orders vs Revenue', color=BRAND_PRIMARY, pad=15)
ax1.xaxis.set_major_formatter(mdates.DateFormatter('%b %d'))
ax1.xaxis.set_major_locator(mdates.DayLocator(interval=3))
plt.xticks(rotation=45, ha='right')

# Combined legend
lines1, labels1 = ax1.get_legend_handles_labels()
lines2, labels2 = ax2.get_legend_handles_labels()
ax1.legend(lines1 + lines2, labels1 + labels2, loc='upper left')

plt.tight_layout()
plt.savefig('chart_dual_axis.png', dpi=150, bbox_inches='tight', facecolor='white')
plt.close()
print("✓ Saved: chart_dual_axis.png")

# ============================================
# CHART 4: PIE CHART
# ============================================
# Example: Customer segment breakdown
customer_data = df.groupby('New or returning customer').agg({
    'Orders': 'sum',
    'Gross sales': 'sum'
}).reset_index()

fig, axes = plt.subplots(1, 2, figsize=(12, 5))

# Pie 1: Orders
axes[0].pie(customer_data['Orders'], 
            labels=customer_data['New or returning customer'],
            autopct='%1.1f%%', 
            colors=[BRAND_SECONDARY, BRAND_PRIMARY],
            explode=(0.02, 0.02),
            textprops={'fontsize': 11, 'fontweight': 'bold'})
axes[0].set_title('Orders by Customer Type', fontweight='bold', color=BRAND_PRIMARY)

# Pie 2: Revenue
axes[1].pie(customer_data['Gross sales'], 
            labels=customer_data['New or returning customer'],
            autopct='%1.1f%%', 
            colors=[BRAND_SECONDARY, BRAND_PRIMARY],
            explode=(0.02, 0.02),
            textprops={'fontsize': 11, 'fontweight': 'bold'})
axes[1].set_title('Revenue by Customer Type', fontweight='bold', color=BRAND_PRIMARY)

plt.tight_layout()
plt.savefig('chart_pie_customers.png', dpi=150, bbox_inches='tight', facecolor='white')
plt.close()
print("✓ Saved: chart_pie_customers.png")

# ============================================
# CHART 5: COMPARISON BAR CHART
# ============================================
# Compare periods
pre_bf = daily[daily['Day'] < '2025-11-28']
bf_period = daily[daily['Day'] >= '2025-11-28']

metrics = ['Avg Daily Orders', 'Avg Daily Sales ($K)', 'Avg AOV ($)']
pre_bf_vals = [pre_bf['Orders'].mean(), pre_bf['Gross sales'].mean()/1000, pre_bf['AOV'].mean()]
bf_vals = [bf_period['Orders'].mean(), bf_period['Gross sales'].mean()/1000, bf_period['AOV'].mean()]

fig, ax = plt.subplots(figsize=(10, 6))
x = np.arange(len(metrics))
width = 0.35

bars1 = ax.bar(x - width/2, pre_bf_vals, width, label='Pre-Black Friday', color=BRAND_ACCENT)
bars2 = ax.bar(x + width/2, bf_vals, width, label='Black Friday Weekend', color=BRAND_PRIMARY)

ax.set_ylabel('Value', fontweight='bold')
ax.set_title('Pre-Black Friday vs Black Friday Performance', color=BRAND_PRIMARY, pad=15)
ax.set_xticks(x)
ax.set_xticklabels(metrics)
ax.legend()

# Add value labels
def add_labels(bars):
    for bar in bars:
        height = bar.get_height()
        ax.annotate(f'{height:.0f}', xy=(bar.get_x() + bar.get_width()/2, height),
                    xytext=(0, 3), textcoords="offset points",
                    ha='center', fontsize=10, fontweight='bold')

add_labels(bars1)
add_labels(bars2)

plt.tight_layout()
plt.savefig('chart_comparison.png', dpi=150, bbox_inches='tight', facecolor='white')
plt.close()
print("✓ Saved: chart_comparison.png")

# ============================================
# CHART 6: HEATMAP (Day of Week Analysis)
# ============================================
daily['Day_Name'] = daily['Day'].dt.day_name()
daily['Week'] = daily['Day'].dt.isocalendar().week

# Pivot for heatmap
pivot = daily.pivot_table(values='Orders', index='Day_Name', columns='Week', aggfunc='sum')

# Reorder days
day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
pivot = pivot.reindex(day_order)

fig, ax = plt.subplots(figsize=(10, 6))
im = ax.imshow(pivot.values, cmap='YlOrRd', aspect='auto')

# Labels
ax.set_xticks(np.arange(len(pivot.columns)))
ax.set_yticks(np.arange(len(pivot.index)))
ax.set_xticklabels([f'Week {w}' for w in pivot.columns])
ax.set_yticklabels(pivot.index)

# Add values
for i in range(len(pivot.index)):
    for j in range(len(pivot.columns)):
        val = pivot.values[i, j]
        if not np.isnan(val):
            text_color = 'white' if val > pivot.values.max() * 0.6 else 'black'
            ax.text(j, i, f'{val:.0f}', ha='center', va='center', color=text_color, fontweight='bold')

ax.set_title('Orders by Day of Week & Week Number', color=BRAND_PRIMARY, pad=15)
plt.colorbar(im, label='Orders')

plt.tight_layout()
plt.savefig('chart_heatmap.png', dpi=150, bbox_inches='tight', facecolor='white')
plt.close()
print("✓ Saved: chart_heatmap.png")

print("\n" + "="*50)
print("✅ All 6 charts created successfully!")
print("="*50)

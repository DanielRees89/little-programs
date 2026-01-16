"""
COMPLETE PDF REPORT EXAMPLE
===========================
This script shows how to create a professional PDF report with:
- Charts/graphs embedded
- Tables with data
- Commentary and analysis
- Proper styling and branding

IMPORTANT: Everything must be done in ONE execution - charts are saved then embedded.
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
import io

# ============================================
# CONFIGURATION - Brand Colors
# ============================================
BRAND_PRIMARY = '#822F23'    # Dark burgundy
BRAND_SECONDARY = '#D67D63'  # Terracotta
BRAND_ACCENT = '#A1945F'     # Olive
BRAND_LIGHT = '#F6EFDB'      # Cream
BRAND_DARK = '#1f2937'       # Dark gray

# Convert hex to RGB tuple for reportlab
def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16)/255 for i in (0, 2, 4))

# ============================================
# STEP 1: PREPARE THE DATA
# ============================================
# df is pre-loaded - convert dates
df['Day'] = pd.to_datetime(df['Day'])

# Create aggregations needed for the report
daily = df.groupby('Day').agg({
    'Orders': 'sum',
    'Gross sales': 'sum',
    'Net sales': 'sum',
    'Gross profit': 'sum',
    'Discounts': 'sum',
    'Quantity ordered': 'sum'
}).reset_index()

daily['AOV'] = daily['Gross sales'] / daily['Orders']

# Calculate KPIs
total_orders = daily['Orders'].sum()
total_gross_sales = daily['Gross sales'].sum()
total_net_sales = daily['Net sales'].sum()
total_gross_profit = daily['Gross profit'].sum()
avg_aov = total_gross_sales / total_orders
gross_margin = (total_gross_profit / total_net_sales) * 100

print(f"Data prepared: {len(daily)} days, {total_orders:,} orders")

# ============================================
# STEP 2: CREATE ALL CHARTS (save to files)
# ============================================

# Set matplotlib style
plt.style.use('seaborn-v0_8-whitegrid')
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['font.size'] = 10

# --- CHART 1: Daily Sales Timeline ---
fig, ax = plt.subplots(figsize=(10, 4))
ax.fill_between(daily['Day'], daily['Gross sales'], alpha=0.3, color=BRAND_SECONDARY)
ax.plot(daily['Day'], daily['Gross sales'], color=BRAND_PRIMARY, linewidth=2)
ax.set_xlabel('Date')
ax.set_ylabel('Gross Sales ($)')
ax.set_title('Daily Gross Sales', fontweight='bold', color=BRAND_PRIMARY)
ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'${x/1000:.0f}K'))
plt.xticks(rotation=45)
plt.tight_layout()
plt.savefig('chart_daily_sales.png', dpi=150, bbox_inches='tight', facecolor='white')
plt.close()
print("Created: chart_daily_sales.png")

# --- CHART 2: Orders Bar Chart ---
fig, ax = plt.subplots(figsize=(10, 4))
colors_list = [BRAND_PRIMARY if d.day >= 25 else BRAND_SECONDARY for d in daily['Day']]
ax.bar(daily['Day'], daily['Orders'], color=colors_list, edgecolor='white', linewidth=0.5)
ax.set_xlabel('Date')
ax.set_ylabel('Orders')
ax.set_title('Daily Orders', fontweight='bold', color=BRAND_PRIMARY)
plt.xticks(rotation=45)
plt.tight_layout()
plt.savefig('chart_daily_orders.png', dpi=150, bbox_inches='tight', facecolor='white')
plt.close()
print("Created: chart_daily_orders.png")

# --- CHART 3: AOV Trend ---
fig, ax = plt.subplots(figsize=(10, 4))
ax.plot(daily['Day'], daily['AOV'], color=BRAND_PRIMARY, linewidth=2, marker='o', markersize=4)
ax.axhline(y=daily['AOV'].mean(), color=BRAND_ACCENT, linestyle='--', linewidth=2, label=f'Avg: ${daily["AOV"].mean():.2f}')
ax.set_xlabel('Date')
ax.set_ylabel('Average Order Value ($)')
ax.set_title('Average Order Value Trend', fontweight='bold', color=BRAND_PRIMARY)
ax.legend()
plt.xticks(rotation=45)
plt.tight_layout()
plt.savefig('chart_aov_trend.png', dpi=150, bbox_inches='tight', facecolor='white')
plt.close()
print("Created: chart_aov_trend.png")

# ============================================
# STEP 3: BUILD THE PDF
# ============================================

# Create document
doc = SimpleDocTemplate(
    "november_kpi_report.pdf",
    pagesize=letter,
    rightMargin=0.75*inch,
    leftMargin=0.75*inch,
    topMargin=0.75*inch,
    bottomMargin=0.75*inch
)

# Styles
styles = getSampleStyleSheet()

# Custom styles
title_style = ParagraphStyle(
    'CustomTitle',
    parent=styles['Heading1'],
    fontSize=24,
    textColor=colors.HexColor(BRAND_PRIMARY),
    spaceAfter=20,
    alignment=TA_CENTER
)

heading_style = ParagraphStyle(
    'CustomHeading',
    parent=styles['Heading2'],
    fontSize=14,
    textColor=colors.HexColor(BRAND_PRIMARY),
    spaceBefore=20,
    spaceAfter=10
)

body_style = ParagraphStyle(
    'CustomBody',
    parent=styles['Normal'],
    fontSize=10,
    textColor=colors.HexColor('#374151'),
    spaceAfter=12,
    leading=14
)

# Build content
elements = []

# --- Title Page ---
elements.append(Spacer(1, 2*inch))
elements.append(Paragraph("BUILT DIFFERENT", title_style))
elements.append(Paragraph("November 2025 KPI Report", ParagraphStyle(
    'Subtitle', parent=styles['Heading2'], fontSize=16, 
    textColor=colors.HexColor(BRAND_SECONDARY), alignment=TA_CENTER
)))
elements.append(Spacer(1, 0.5*inch))
elements.append(Paragraph(f"Generated: {datetime.now().strftime('%B %d, %Y')}", 
    ParagraphStyle('Date', parent=styles['Normal'], alignment=TA_CENTER, textColor=colors.gray)))
elements.append(PageBreak())

# --- Executive Summary ---
elements.append(Paragraph("Executive Summary", heading_style))
summary_text = f"""
November 2025 was a record-breaking month for Built Different. We processed <b>{total_orders:,} orders</b> 
generating <b>${total_gross_sales:,.2f}</b> in gross sales and <b>${total_gross_profit:,.2f}</b> in gross profit.

Our average order value of <b>${avg_aov:.2f}</b> and gross margin of <b>{gross_margin:.1f}%</b> demonstrate 
strong unit economics. The Black Friday period drove exceptional performance, with order volumes 
significantly exceeding daily averages.
"""
elements.append(Paragraph(summary_text, body_style))
elements.append(Spacer(1, 0.3*inch))

# --- KPI Table ---
elements.append(Paragraph("Key Performance Indicators", heading_style))

kpi_data = [
    ['Metric', 'Value'],
    ['Total Orders', f'{total_orders:,}'],
    ['Gross Sales', f'${total_gross_sales:,.2f}'],
    ['Net Sales', f'${total_net_sales:,.2f}'],
    ['Gross Profit', f'${total_gross_profit:,.2f}'],
    ['Gross Margin', f'{gross_margin:.1f}%'],
    ['Average Order Value', f'${avg_aov:.2f}'],
]

kpi_table = Table(kpi_data, colWidths=[3*inch, 2*inch])
kpi_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(BRAND_PRIMARY)),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 11),
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
    ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
    ('FONTSIZE', (0, 1), (-1, -1), 10),
    ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f9fafb')),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
    ('TOPPADDING', (0, 0), (-1, -1), 8),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
]))
elements.append(kpi_table)
elements.append(PageBreak())

# --- Charts Section ---
elements.append(Paragraph("Sales Performance", heading_style))
elements.append(Paragraph(
    "The chart below shows daily gross sales throughout November. Notice the significant spike "
    "during the Black Friday period (Nov 25-30), demonstrating strong promotional execution.",
    body_style
))
elements.append(Spacer(1, 0.2*inch))
elements.append(Image('chart_daily_sales.png', width=6.5*inch, height=2.6*inch))
elements.append(Spacer(1, 0.3*inch))

elements.append(Paragraph("Order Volume", heading_style))
elements.append(Paragraph(
    "Daily order counts show clear patterns with weekend peaks and a massive surge during "
    "Black Friday. The darker bars highlight the Black Friday promotional period.",
    body_style
))
elements.append(Spacer(1, 0.2*inch))
elements.append(Image('chart_daily_orders.png', width=6.5*inch, height=2.6*inch))
elements.append(PageBreak())

elements.append(Paragraph("Average Order Value", heading_style))
elements.append(Paragraph(
    "AOV remained relatively stable throughout the month, with slight increases during "
    "promotional periods as customers took advantage of bundle deals.",
    body_style
))
elements.append(Spacer(1, 0.2*inch))
elements.append(Image('chart_aov_trend.png', width=6.5*inch, height=2.6*inch))
elements.append(Spacer(1, 0.5*inch))

# --- Recommendations ---
elements.append(Paragraph("Key Takeaways & Recommendations", heading_style))
recommendations = """
<b>1. Black Friday Success:</b> The 5x surge in orders demonstrates strong brand demand. 
Consider extending promotional windows in future years.<br/><br/>

<b>2. Inventory Planning:</b> With order volumes reaching 2,000+ per day during peak periods, 
ensure fulfillment capacity is scaled accordingly for next year.<br/><br/>

<b>3. Margin Protection:</b> Despite heavy promotional activity, gross margins remained healthy 
at {:.1f}%, indicating effective discount strategy.
""".format(gross_margin)
elements.append(Paragraph(recommendations, body_style))

# Build the PDF
doc.build(elements)
print("\n✅ PDF Report saved: november_kpi_report.pdf")

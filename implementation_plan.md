# Trading Dashboard Implementation Plan

## Core Architecture
- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS with custom oklch color palette
- **Database**: MongoDB with Mongoose ODM
- **Animations**: GSAP for page transitions and KPI card entry
- **Charts**: Recharts for performance visualization

## Key Features
1. **Overview Dashboard**:
   - Dynamic KPI cards (Net Profit, Win Rate, Avg Profit/Loss)
   - Area charts for Profit/Loss trends
   - Step-after charts for Equity Curve
2. **Trade Management**:
   - Full CRUD operations for daily trading logs
   - Searchable and filterable history table
   - Form validation with React Hook Form + Zod
3. **Advanced Analytics**:
   - Win/Loss ratio pie charts
   - Trade volume bar charts
   - Psychology-focused insights
4. **Export & Reports**:
   - CSV export for Excel/Google Sheets compatibility
   - Filtered report generation
5. **UI/UX**:
   - Glassmorphism design system
   - Responsive sidebar and header
   - Dark/Light mode support (NextThemes)

## Directory Structure
- `/app`: Pages and API routes
- `/components`: UI units (layout, charts, forms)
- `/lib`: Database and utils
- `/models`: Mongoose schemas
- `/providers`: Context providers (Store, Theme)

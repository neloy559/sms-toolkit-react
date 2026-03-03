# SMS Toolkit React - Building Plan

Based on the requested change of plan, we are pivoting away from consolidating features and will instead implement the **6 original tools exactly as they were**, preserving their specific standalone functionalities while upgrading their underlying technology to React/Next.js. 

The dashboard layout and 3D hero aesthetic will remain, but the tool roster will mirror the classic suite.

## The 6 Core Tools to Migrate

### 1. iVAS Formatter
- **Functionality**: Process, sort, and export phone numbers by country code instantly. Generate routing parameters and API endpoint configurations for premium rate endpoints.
- **Path**: `/ivas-formatter`

### 2. SMS CDR Pro
- **Functionality**: Advanced analytics for SMS data. Filter by country, CLI, OTP length and visualize trends.
- **Path**: `/sms-cdr-pro`

### 3. Cookie Dashboard
- **Functionality**: Parse pipe-delimited cookie files, filter by ID series (e.g., 1000xxx, 6154xxx), and export to Excel.
- **Path**: `/cookie-dashboard`

### 4. Phone Formatter
- **Functionality**: Extract clean phone numbers from Excel/Txt files targeting a specific 'Number' column. We will ensure the smart column detection ("Test Number" support) is included here.
- **Path**: `/phone-formatter`

### 5. Phone Splitter
- **Functionality**: Detect country codes and split phone numbers into separate files by country. We will ensure the smart column detection is included here as well.
- **Path**: `/phone-splitter`

### 6. Phone OTP Splitter
- **Functionality**: Split `phone|OTP` combination files by country. Allow downloading individual country files or exporting all as a ZIP archive.
- **Path**: `/phone-otp-splitter`

## Implementation Steps

1. **Update Routing & Navigation**
   - We must update the dashboard UI and Sidebar (`src/components/layout/Sidebar.tsx`) to reflect 6 distinct tool routes instead of the consolidated ones.
   - We must update the Dashboard landing page (`src/app/page.tsx`) to display 6 cards corresponding to these exact tools.

2. **Component Migration**
   - We will extract and isolate the exact JavaScript logic from the original `SMS ToolKit by Neloy .html` for each of these 6 tools and map them 1:1 into Next.js React components.
   - The UI within each component will be upgraded to use Tailwind CSS (`glass-panel`, `btn-primary`, etc.) for consistency with the new app shell.

3. **Backend Integration (Optional Phase)**
   - All tools will be built to work locally on the client's browser (zero-backend dependency) exactly as they do in the original HTML file.
   - History logging (via Mongoose) can be hooked into these 6 separate tools.

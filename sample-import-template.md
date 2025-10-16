# Excel Import Template

## File Structure Requirements

Your Excel file should follow this exact structure:

### Excel Rows 8-9: Section Headers
- Row 8: Main section headers (can be merged cells)
- Row 9: Sub-section headers (can be merged cells)

### Excel Row 10: Helper Text
- Row 10: Helper text for each column (can be empty)

### Excel Row 11: Column Headers
- Row 11: **MUST** contain the exact column names as listed below

### Excel Row 12+: Data Rows
- Row 12 and beyond: Your actual data
- Empty rows (where first two columns are empty) will be skipped

## Required Column Headers

The following column headers must be present in Row 11 (case-insensitive):

### Section 1: Create CRM Pipeline Account and Opportunity
- New Account Legal Name
- Primary Contact Name
- Primary Contact Title
- Primary Contact Email Address
- Industry
- Entity Type
- Address
- City
- State
- Zip Code
- Product Service
- Est Oppty Value
- Opportunity Partner
- Tax Delivery Partner
- BD Sales Support
- Lead Source
- Lead Source Details
- LS Free Text
- Referring Employee

### Section 2: Workday Project & Contract
- Need Project In Workday
- Customer Collections Lead
- Project Delivery Lead
- Project Manager
- Asst Project Manager
- Project Billing Specialist
- Service Code
- Tax Year End
- Renewable Project
- Project Start Date
- Project End Date
- Tax Form
- Next Due Date
- Date of Death
- Contract Type
- Total Estimated Hours
- Estimated Realization Year 1
- Contract Rate Sheet
- Total Contract Amount
- Admin Fee Percent
- Admin Fee Included Excluded
- Onboarding Fee Percent
- Onboarding Fee Amount
- Suggested Workday Parent Name

### Section 3: FOR TAX ADMIN ONLY
- EL Signed
- Authorized 7216

### Section 4: FOR PE & TMS ONLY
- Connected To PE Or TMS
- Name Of Related PE Fund TMS Customer

### Section 5: Invoice Style & Delivery
- Invoice Type
- Consolidated Billing Customer Name
- Consolidated Billing Existing Schedule
- Additional Customer Contacts
- Additional Customer Contact Emails
- Invoice Recipient Names
- Invoice Recipient Emails

### Section 6: Engagement Letter
- Partner Signing EL
- Consulting Services Description

### Section 7: FOR PETE KLINGER ONLY
- Document Delivery
- Invoice Memo
- Bill To Contact

### Section 8: Revenue Forecast By Month
- October 2025
- November 2025
- December 2025
- January 2026
- February 2026
- March 2026
- April 2026
- May 2026
- June 2026
- July 2026
- August 2026
- September 2026

### Section 9: FOR ONBOARDING ONLY
- Account GUID
- Opportunity GUID
- Opportunity Name

## Example Excel Structure

```
Row 8: [Section Headers - can be merged]
Row 9: [Sub-section Headers - can be merged]  
Row 10: [Helper Text - can be empty]
Row 11: New Account Legal Name (Entity/Indiv) | Primary Contact Name | Primary Contact Title | ...
Row 12: ABC Corp | John Smith | Mr. | ...
Row 13: XYZ Inc | Mary Johnson | Ms. | ...
```

## Notes

- **File Format**: Supports both .xlsx and .xls files
- **Empty Rows**: Rows where the first two columns are empty will be automatically skipped
- **Data Validation**: The system will validate that required columns are present
- **Preview**: You'll see a preview of the imported data before confirming
- **Import Behavior**: Imported data will be added to existing rows (not replace them)

-- Updated CPIF Documents Table with ocId column
-- Drop existing table if it exists
DROP TABLE IF EXISTS CPIFDocuments;

-- Create the table with JSON columns and ocId
CREATE TABLE CPIFDocuments (
    -- Primary key and metadata
    id NVARCHAR(50) PRIMARY KEY,
    timestamp DATETIME2 NOT NULL,
    createdBy NVARCHAR(100) NOT NULL,
    wizardType NVARCHAR(100) NOT NULL,
    ocId NVARCHAR(50), -- Opportunity Container ID this wizard row belongs to
    status NVARCHAR(20) NOT NULL DEFAULT 'Draft',
    lastModified DATETIME2 NOT NULL,
    version INT NOT NULL DEFAULT 1,
    
    -- JSON columns for each wizard section
    accountInfo NVARCHAR(MAX),     -- Account & Opportunity info
    workdayInfo NVARCHAR(MAX),    -- Workday Project & Contract
    taxAdmin NVARCHAR(MAX),       -- Tax Admin
    peTms NVARCHAR(MAX),          -- PE & TMS
    invoice NVARCHAR(MAX),        -- Invoice
    engagement NVARCHAR(MAX),      -- Engagement
    peteKlinger NVARCHAR(MAX),     -- Pete Klinger
    revenueForecast NVARCHAR(MAX), -- Revenue Forecast
    onboarding NVARCHAR(MAX)      -- Onboarding
);

-- Create indexes for better performance
CREATE INDEX IX_CPIFDocuments_CreatedBy ON CPIFDocuments(createdBy);
CREATE INDEX IX_CPIFDocuments_Status ON CPIFDocuments(status);
CREATE INDEX IX_CPIFDocuments_WizardType ON CPIFDocuments(wizardType);
CREATE INDEX IX_CPIFDocuments_Timestamp ON CPIFDocuments(timestamp);
CREATE INDEX IX_CPIFDocuments_OCId ON CPIFDocuments(ocId); -- Index for OC-based queries

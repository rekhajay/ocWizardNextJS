-- Fix column name mismatch between database schema and code
-- This script updates the database schema to match the code

-- Rename workdayProjectContract to workdayInfo
EXEC sp_rename 'CPIFDocuments.workdayProjectContract', 'workdayInfo', 'COLUMN';

-- Also add the missing ocId column if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('CPIFDocuments') AND name = 'ocId')
BEGIN
    ALTER TABLE CPIFDocuments ADD ocId VARCHAR(50) NULL;
END

-- Create index for ocId if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('CPIFDocuments') AND name = 'IX_CPIFDocuments_ocId')
BEGIN
    CREATE INDEX IX_CPIFDocuments_ocId ON CPIFDocuments(ocId);
END

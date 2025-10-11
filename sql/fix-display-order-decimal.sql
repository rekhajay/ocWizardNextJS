-- Fix displayOrder column to support decimal values for proper ordering
-- First, let's check if the column exists and what type it is
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('CPIFDocuments') AND name = 'displayOrder')
BEGIN
    -- Change the column type to DECIMAL to support fractional values
    ALTER TABLE CPIFDocuments 
    ALTER COLUMN displayOrder DECIMAL(10,2) NOT NULL DEFAULT 0;
    
    PRINT 'displayOrder column updated to DECIMAL(10,2)';
END
ELSE
BEGIN
    -- If column doesn't exist, create it as DECIMAL
    ALTER TABLE CPIFDocuments 
    ADD displayOrder DECIMAL(10,2) NOT NULL DEFAULT 0;
    
    PRINT 'displayOrder column created as DECIMAL(10,2)';
END;

-- Update existing records to have sequential displayOrder using a CTE
WITH NumberedRows AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY timestamp) as newDisplayOrder
    FROM CPIFDocuments
    WHERE displayOrder = 0
)
UPDATE CPIFDocuments 
SET displayOrder = nr.newDisplayOrder
FROM CPIFDocuments c
INNER JOIN NumberedRows nr ON c.id = nr.id;

-- Create index for better performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_CPIFDocuments_displayOrder')
BEGIN
    CREATE INDEX IX_CPIFDocuments_displayOrder ON CPIFDocuments(displayOrder);
    PRINT 'Index created on displayOrder column';
END;



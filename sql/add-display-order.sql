-- Add displayOrder column to CPIFDocuments table
ALTER TABLE CPIFDocuments ADD displayOrder INT DEFAULT 0;

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
CREATE INDEX IX_CPIFDocuments_displayOrder ON CPIFDocuments(displayOrder);

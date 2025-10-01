-- Create CPIFDocuments table for Azure SQL Database
CREATE TABLE CPIFDocuments (
    id VARCHAR(50) PRIMARY KEY,
    timestamp DATETIME2 NOT NULL,
    createdBy VARCHAR(100) NOT NULL,
    wizardType VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    lastModified DATETIME2 NOT NULL,
    version INT NOT NULL,
    accountInfo NVARCHAR(MAX) NOT NULL,
    workdayProjectContract NVARCHAR(MAX) NOT NULL,
    taxAdmin NVARCHAR(MAX) NOT NULL,
    peTms NVARCHAR(MAX) NOT NULL,
    invoice NVARCHAR(MAX) NOT NULL,
    engagement NVARCHAR(MAX) NOT NULL,
    peteKlinger NVARCHAR(MAX) NOT NULL,
    revenueForecast NVARCHAR(MAX) NOT NULL,
    onboarding NVARCHAR(MAX) NOT NULL,
    createdAt DATETIME2 DEFAULT GETUTCDATE(),
    updatedAt DATETIME2 DEFAULT GETUTCDATE()
);

-- Create indexes for better performance
CREATE INDEX IX_CPIFDocuments_createdBy ON CPIFDocuments(createdBy);
CREATE INDEX IX_CPIFDocuments_status ON CPIFDocuments(status);
CREATE INDEX IX_CPIFDocuments_lastModified ON CPIFDocuments(lastModified);
CREATE INDEX IX_CPIFDocuments_wizardType ON CPIFDocuments(wizardType);

-- Create a trigger to automatically update the updatedAt field
CREATE TRIGGER TR_CPIFDocuments_Update
ON CPIFDocuments
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE CPIFDocuments 
    SET updatedAt = GETUTCDATE()
    FROM CPIFDocuments c
    INNER JOIN inserted i ON c.id = i.id;
END;

-- Idempotent SQL to drop and recreate CPIFDocuments table with new schema
-- This script handles all 9 sections with proper column types and constraints

-- Drop existing table if it exists
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CPIFDocuments]') AND type in (N'U'))
BEGIN
    DROP TABLE [dbo].[CPIFDocuments];
    PRINT 'Dropped existing CPIFDocuments table';
END

-- Create new table with updated schema
CREATE TABLE [dbo].[CPIFDocuments] (
    -- Core fields
    [id] NVARCHAR(255) NOT NULL PRIMARY KEY,
    [timestamp] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [createdBy] NVARCHAR(255) NOT NULL,
    [wizardType] NVARCHAR(255) NOT NULL,
    [ocId] NVARCHAR(255) NULL,
    [status] NVARCHAR(50) NOT NULL DEFAULT 'Draft',
    [lastModified] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [version] INT NOT NULL DEFAULT 1,
    [displayOrder] DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    -- Section 1: Create CRM Pipeline Account and Opportunity &/Or Workday Customer
    [newAccountLegalName] NVARCHAR(500) NULL,
    [primaryContactName] NVARCHAR(255) NULL,
    [primaryContactTitle] NVARCHAR(255) NULL,
    [primaryContactEmailAddress] NVARCHAR(255) NULL,
    [industry] NVARCHAR(255) NULL,
    [entityType] NVARCHAR(255) NULL,
    [address] NVARCHAR(500) NULL,
    [city] NVARCHAR(255) NULL,
    [state] NVARCHAR(100) NULL,
    [zipCode] NVARCHAR(20) NULL,
    [productService] NVARCHAR(255) NULL,
    [estOpptyValue] DECIMAL(15,2) NULL,
    [opportunityPartner] NVARCHAR(255) NULL,
    [taxDeliveryPartner] NVARCHAR(255) NULL,
    [bdSalesSupport] NVARCHAR(500) NULL,
    [leadSource] NVARCHAR(255) NULL,
    [leadSourceDetails] NVARCHAR(255) NULL,
    [lsFreeText] NVARCHAR(500) NULL,
    [referringEmployee] NVARCHAR(255) NULL,
    
    -- Section 2: Workday Project & Contract (Time Entry & Pricing)
    [needProjectInWorkday] BIT NULL,
    [customerCollectionsLead] NVARCHAR(255) NULL,
    [projectDeliveryLead] NVARCHAR(255) NULL,
    [projectManager] NVARCHAR(255) NULL,
    [asstProjectManager] NVARCHAR(255) NULL,
    [projectBillingSpecialist] NVARCHAR(255) NULL,
    [serviceCode] NVARCHAR(255) NULL,
    [taxYearEnd] NVARCHAR(20) NULL,
    [renewableProject] BIT NULL,
    [projectStartDate] DATE NULL,
    [projectEndDate] DATE NULL,
    [taxForm] NVARCHAR(255) NULL,
    [nextDueDate] DATE NULL,
    [dateOfDeath] DATE NULL,
    [contractType] NVARCHAR(255) NULL,
    [totalEstimatedHours] DECIMAL(10,2) NULL,
    [estimatedRealizationYear1] NVARCHAR(50) NULL,
    [contractRateSheet] NVARCHAR(255) NULL,
    [totalContractAmount] DECIMAL(15,2) NULL,
    [adminFeePercent] DECIMAL(5,2) NULL,
    [adminFeeIncludedExcluded] NVARCHAR(50) NULL,
    [onboardingFeePercent] DECIMAL(5,2) NULL,
    [onboardingFeeAmount] DECIMAL(15,2) NULL,
    [suggestedWorkdayParentName] NVARCHAR(255) NULL,
    
    -- Section 3: FOR TAX ADMIN ONLY
    [elSigned] BIT NULL,
    [authorized7216] BIT NULL,
    
    -- Section 4: FOR PE & TMS ONLY
    [connectedToPEOrTMS] NVARCHAR(255) NULL,
    [nameOfRelatedPEFundTMSCustomer] NVARCHAR(500) NULL,
    
    -- Section 5: Invoice Style & Delivery
    [invoiceType] NVARCHAR(255) NULL,
    [consolidatedBillingCustomerName] NVARCHAR(500) NULL,
    [consolidatedBillingExistingSchedule] NVARCHAR(500) NULL,
    [additionalCustomerContacts] NVARCHAR(500) NULL,
    [additionalCustomerContactEmails] NVARCHAR(500) NULL,
    [invoiceRecipientNames] NVARCHAR(500) NULL,
    [invoiceRecipientEmails] NVARCHAR(500) NULL,
    
    -- Section 6: Engagement Letter
    [partnerSigningEL] NVARCHAR(255) NULL,
    [consultingServicesDescription] NVARCHAR(500) NULL,
    
    -- Section 7: FOR PETE KLINGER ONLY
    [documentDelivery] NVARCHAR(255) NULL,
    [invoiceMemo] NVARCHAR(255) NULL,
    [billToContact] NVARCHAR(255) NULL,
    
    -- Section 8: Revenue Forecast By Month
    [october2025] DECIMAL(15,2) NULL,
    [november2025] DECIMAL(15,2) NULL,
    [december2025] DECIMAL(15,2) NULL,
    [january2026] DECIMAL(15,2) NULL,
    [february2026] DECIMAL(15,2) NULL,
    [march2026] DECIMAL(15,2) NULL,
    [april2026] DECIMAL(15,2) NULL,
    [may2026] DECIMAL(15,2) NULL,
    [june2026] DECIMAL(15,2) NULL,
    [july2026] DECIMAL(15,2) NULL,
    [august2026] DECIMAL(15,2) NULL,
    [september2026] DECIMAL(15,2) NULL,
    [balance] DECIMAL(15,2) NULL,
    
    -- Section 9: FOR ONBOARDING ONLY
    [accountGUID] NVARCHAR(255) NULL,
    [opportunityGUID] NVARCHAR(255) NULL,
    [opportunityName] NVARCHAR(255) NULL
);

-- Create indexes for performance
CREATE INDEX IX_CPIFDocuments_ocId ON CPIFDocuments(ocId);
CREATE INDEX IX_CPIFDocuments_displayOrder ON CPIFDocuments(displayOrder);
CREATE INDEX IX_CPIFDocuments_status ON CPIFDocuments(status);
CREATE INDEX IX_CPIFDocuments_createdBy ON CPIFDocuments(createdBy);

PRINT 'Successfully created CPIFDocuments table with new schema for all 9 sections';



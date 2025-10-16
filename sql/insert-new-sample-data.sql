-- Insert new sample CPIF data with individual columns for all 9 sections
-- This script inserts 3 sample rows with the new schema structure

-- Row 1: Howmz Management Holdings, LLC
INSERT INTO CPIFDocuments (
    -- Core fields
    id, timestamp, createdBy, wizardType, ocId, status, lastModified, version, displayOrder,
    
    -- Section 1: Create CRM Pipeline Account and Opportunity &/Or Workday Customer
    newAccountLegalName, primaryContactName, primaryContactTitle, primaryContactEmailAddress, industry, entityType, address, city, state, zipCode, productService, estOpptyValue, opportunityPartner, taxDeliveryPartner, bdSalesSupport, leadSource, leadSourceDetails, lsFreeText, referringEmployee,
    
    -- Section 2: Workday Project & Contract (Time Entry & Pricing)
    needProjectInWorkday, customerCollectionsLead, projectDeliveryLead, projectManager, asstProjectManager, projectBillingSpecialist, serviceCode, taxYearEnd, renewableProject, projectStartDate, projectEndDate, taxForm, nextDueDate, dateOfDeath, contractType, totalEstimatedHours, estimatedRealizationYear1, contractRateSheet, totalContractAmount, adminFeePercent, adminFeeIncludedExcluded, onboardingFeePercent, onboardingFeeAmount, suggestedWorkdayParentName,
    
    -- Section 3: FOR TAX ADMIN ONLY
    elSigned, authorized7216,
    
    -- Section 4: FOR PE & TMS ONLY
    connectedToPEOrTMS, nameOfRelatedPEFundTMSCustomer,
    
    -- Section 5: Invoice Style & Delivery
    invoiceType, consolidatedBillingCustomerName, consolidatedBillingExistingSchedule, additionalCustomerContacts, additionalCustomerContactEmails, invoiceRecipientNames, invoiceRecipientEmails,
    
    -- Section 6: Engagement Letter
    partnerSigningEL, consultingServicesDescription,
    
    -- Section 7: FOR PETE KLINGER ONLY
    documentDelivery, invoiceMemo, billToContact,
    
    -- Section 8: Revenue Forecast By Month
    october2025, november2025, december2025, january2026, february2026, march2026, april2026, may2026, june2026, july2026, august2026, september2026, balance,
    
    -- Section 9: FOR ONBOARDING ONLY
    accountGUID, opportunityGUID, opportunityName
) VALUES (
    -- Core fields
    'cpif-howmz-management-' + CAST(GETDATE() AS VARCHAR(20)),
    GETDATE(),
    'system-import',
    'New Client-Entity (Need a CUS#)',
    'OC-GOPI-1',
    'Draft',
    GETDATE(),
    1,
    1.0,
    
    -- Section 1: CRM Pipeline
    'Howmz Management Holdings, LLC',
    'Shant Assarian',
    'Mr.',
    's_assarian@hotmail.com',
    'Manufacturing',
    'Limited Liability Co. (LLC)',
    '3500 S Highway 40',
    'Herber City',
    'Utah',
    '84032',
    'Tax - Corporate',
    6000.00,
    'Todd Northrup',
    'Todd Northrup',
    '',
    'Referral',
    'Employee',
    '',
    'Adam Winnett',
    
    -- Section 2: Workday Project & Contract
    1, -- needProjectInWorkday
    'Joanna Le',
    'Todd Northrup',
    'Joanna Le',
    'Joanna Le',
    NULL,
    'Tax - Partnership/LLC Return',
    '12/31',
    1, -- renewableProject
    '2025-10-05',
    '2025-12-31',
    '1065 Partnership',
    '2025-10-15',
    NULL,
    'Fixed Fee',
    8.00,
    '90',
    'National (default)',
    6000.00,
    8.00,
    'Included',
    0.00,
    0.00,
    'Howmz',
    
    -- Section 3: Tax Admin
    0, -- elSigned
    0, -- authorized7216
    
    -- Section 4: PE & TMS
    'No',
    '',
    
    -- Section 5: Invoice Style & Delivery
    'Consolidated Billing',
    'Shant Assarian',
    '',
    'Shant Assarian',
    '',
    'Shant Assarian',
    '',
    
    -- Section 6: Engagement Letter
    'Todd Northrup',
    '',
    
    -- Section 7: Pete Klinger
    '',
    '',
    '',
    
    -- Section 8: Revenue Forecast
    6000.00, -- october2025
    0.00,    -- november2025
    0.00,    -- december2025
    0.00,    -- january2026
    0.00,    -- february2026
    0.00,    -- march2026
    0.00,    -- april2026
    0.00,    -- may2026
    0.00,    -- june2026
    0.00,    -- july2026
    0.00,    -- august2026
    0.00,    -- september2026
    0.00,    -- balance
    
    -- Section 9: Onboarding
    '',
    '',
    ''
);

-- Row 2: Howmz Holdings, LLC
INSERT INTO CPIFDocuments (
    -- Core fields
    id, timestamp, createdBy, wizardType, ocId, status, lastModified, version, displayOrder,
    
    -- Section 1: Create CRM Pipeline Account and Opportunity &/Or Workday Customer
    newAccountLegalName, primaryContactName, primaryContactTitle, primaryContactEmailAddress, industry, entityType, address, city, state, zipCode, productService, estOpptyValue, opportunityPartner, taxDeliveryPartner, bdSalesSupport, leadSource, leadSourceDetails, lsFreeText, referringEmployee,
    
    -- Section 2: Workday Project & Contract (Time Entry & Pricing)
    needProjectInWorkday, customerCollectionsLead, projectDeliveryLead, projectManager, asstProjectManager, projectBillingSpecialist, serviceCode, taxYearEnd, renewableProject, projectStartDate, projectEndDate, taxForm, nextDueDate, dateOfDeath, contractType, totalEstimatedHours, estimatedRealizationYear1, contractRateSheet, totalContractAmount, adminFeePercent, adminFeeIncludedExcluded, onboardingFeePercent, onboardingFeeAmount, suggestedWorkdayParentName,
    
    -- Section 3: FOR TAX ADMIN ONLY
    elSigned, authorized7216,
    
    -- Section 4: FOR PE & TMS ONLY
    connectedToPEOrTMS, nameOfRelatedPEFundTMSCustomer,
    
    -- Section 5: Invoice Style & Delivery
    invoiceType, consolidatedBillingCustomerName, consolidatedBillingExistingSchedule, additionalCustomerContacts, additionalCustomerContactEmails, invoiceRecipientNames, invoiceRecipientEmails,
    
    -- Section 6: Engagement Letter
    partnerSigningEL, consultingServicesDescription,
    
    -- Section 7: FOR PETE KLINGER ONLY
    documentDelivery, invoiceMemo, billToContact,
    
    -- Section 8: Revenue Forecast By Month
    october2025, november2025, december2025, january2026, february2026, march2026, april2026, may2026, june2026, july2026, august2026, september2026, balance,
    
    -- Section 9: FOR ONBOARDING ONLY
    accountGUID, opportunityGUID, opportunityName
) VALUES (
    -- Core fields
    'cpif-howmz-holdings-' + CAST(GETDATE() AS VARCHAR(20)),
    GETDATE(),
    'system-import',
    'New Client-Entity (Need a CUS#)',
    'OC-GOPI-1',
    'Draft',
    GETDATE(),
    1,
    2.0,
    
    -- Section 1: CRM Pipeline
    'Howmz Holdings, LLC',
    'Shant Assarian',
    'Mr.',
    's_assarian@hotmail.com',
    'Manufacturing',
    'Limited Liability Co. (LLC)',
    '3501 S Highway 40',
    'Herber City',
    'Utah',
    '84033',
    'Tax - Corporate',
    0.00,
    'Todd Northrup',
    'Todd Northrup',
    '',
    'Referral',
    'Employee',
    '',
    'Adam Winnett',
    
    -- Section 2: Workday Project & Contract
    1, -- needProjectInWorkday
    'Joanna Le',
    'Todd Northrup',
    'Joanna Le',
    'Joanna Le',
    NULL,
    'Tax - Partnership/LLC Return',
    '12/31',
    1, -- renewableProject
    '2025-10-05',
    '2025-12-31',
    '1065 Partnership',
    '2025-10-15',
    NULL,
    'Fixed Fee',
    8.00,
    '90',
    'National (default)',
    0.00,
    8.00,
    'Included',
    0.00,
    0.00,
    'Howmz',
    
    -- Section 3: Tax Admin
    0, -- elSigned
    0, -- authorized7216
    
    -- Section 4: PE & TMS
    'No',
    '',
    
    -- Section 5: Invoice Style & Delivery
    'Consolidated Billing',
    'Shant Assarian',
    '',
    'Shant Assarian',
    '',
    'Shant Assarian',
    '',
    
    -- Section 6: Engagement Letter
    'Todd Northrup',
    '',
    
    -- Section 7: Pete Klinger
    '',
    '',
    '',
    
    -- Section 8: Revenue Forecast
    0.00, -- october2025
    0.00, -- november2025
    0.00, -- december2025
    0.00, -- january2026
    0.00, -- february2026
    0.00, -- march2026
    0.00, -- april2026
    0.00, -- may2026
    0.00, -- june2026
    0.00, -- july2026
    0.00, -- august2026
    0.00, -- september2026
    0.00, -- balance
    
    -- Section 9: Onboarding
    '',
    '',
    ''
);

-- Row 3: Howmz IP Holdings, LLC
INSERT INTO CPIFDocuments (
    -- Core fields
    id, timestamp, createdBy, wizardType, ocId, status, lastModified, version, displayOrder,
    
    -- Section 1: Create CRM Pipeline Account and Opportunity &/Or Workday Customer
    newAccountLegalName, primaryContactName, primaryContactTitle, primaryContactEmailAddress, industry, entityType, address, city, state, zipCode, productService, estOpptyValue, opportunityPartner, taxDeliveryPartner, bdSalesSupport, leadSource, leadSourceDetails, lsFreeText, referringEmployee,
    
    -- Section 2: Workday Project & Contract (Time Entry & Pricing)
    needProjectInWorkday, customerCollectionsLead, projectDeliveryLead, projectManager, asstProjectManager, projectBillingSpecialist, serviceCode, taxYearEnd, renewableProject, projectStartDate, projectEndDate, taxForm, nextDueDate, dateOfDeath, contractType, totalEstimatedHours, estimatedRealizationYear1, contractRateSheet, totalContractAmount, adminFeePercent, adminFeeIncludedExcluded, onboardingFeePercent, onboardingFeeAmount, suggestedWorkdayParentName,
    
    -- Section 3: FOR TAX ADMIN ONLY
    elSigned, authorized7216,
    
    -- Section 4: FOR PE & TMS ONLY
    connectedToPEOrTMS, nameOfRelatedPEFundTMSCustomer,
    
    -- Section 5: Invoice Style & Delivery
    invoiceType, consolidatedBillingCustomerName, consolidatedBillingExistingSchedule, additionalCustomerContacts, additionalCustomerContactEmails, invoiceRecipientNames, invoiceRecipientEmails,
    
    -- Section 6: Engagement Letter
    partnerSigningEL, consultingServicesDescription,
    
    -- Section 7: FOR PETE KLINGER ONLY
    documentDelivery, invoiceMemo, billToContact,
    
    -- Section 8: Revenue Forecast By Month
    october2025, november2025, december2025, january2026, february2026, march2026, april2026, may2026, june2026, july2026, august2026, september2026, balance,
    
    -- Section 9: FOR ONBOARDING ONLY
    accountGUID, opportunityGUID, opportunityName
) VALUES (
    -- Core fields
    'cpif-howmz-ip-' + CAST(GETDATE() AS VARCHAR(20)),
    GETDATE(),
    'system-import',
    'New Client-Entity (Need a CUS#)',
    'OC-GOPI-1',
    'Draft',
    GETDATE(),
    1,
    3.0,
    
    -- Section 1: CRM Pipeline
    'Howmz IP Holdings, LLC',
    'Shant Assarian',
    'Mr.',
    's_assarian@hotmail.com',
    'Manufacturing',
    'Single-Member LLC (SMLLC)',
    '3502 S Highway 40',
    'Herber City',
    'Utah',
    '84034',
    'Tax - Corporate',
    0.00,
    'Todd Northrup',
    'Todd Northrup',
    '',
    'Referral',
    'Employee',
    '',
    'Adam Winnett',
    
    -- Section 2: Workday Project & Contract
    1, -- needProjectInWorkday
    'Joanna Le',
    'Todd Northrup',
    'Joanna Le',
    'Joanna Le',
    NULL,
    'Consulting Only',
    '12/31',
    1, -- renewableProject
    '2025-10-05',
    '2025-12-31',
    'Consulting Only',
    '2025-10-15',
    NULL,
    'Fixed Fee',
    8.00,
    '90',
    'National (default)',
    0.00,
    8.00,
    'Included',
    0.00,
    0.00,
    'Howmz',
    
    -- Section 3: Tax Admin
    0, -- elSigned
    0, -- authorized7216
    
    -- Section 4: PE & TMS
    'No',
    '',
    
    -- Section 5: Invoice Style & Delivery
    'Consolidated Billing',
    'Shant Assarian',
    '',
    'Shant Assarian',
    '',
    'Shant Assarian',
    '',
    
    -- Section 6: Engagement Letter
    'Todd Northrup',
    '',
    
    -- Section 7: Pete Klinger
    '',
    '',
    '',
    
    -- Section 8: Revenue Forecast
    0.00, -- october2025
    0.00, -- november2025
    0.00, -- december2025
    0.00, -- january2026
    0.00, -- february2026
    0.00, -- march2026
    0.00, -- april2026
    0.00, -- may2026
    0.00, -- june2026
    0.00, -- july2026
    0.00, -- august2026
    0.00, -- september2026
    0.00, -- balance
    
    -- Section 9: Onboarding
    '',
    '',
    ''
);

PRINT 'Successfully inserted 3 sample CPIF documents with new individual column schema for OC-GOPI-1';



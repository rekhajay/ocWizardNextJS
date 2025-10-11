-- Insert sample CPIF data from CSV
-- This script inserts 3 sample rows with proper displayOrder values

-- Row 1: Howmz Management Holdings, LLC
INSERT INTO CPIFDocuments (
    id, timestamp, createdBy, wizardType, ocId, status, lastModified, version, displayOrder,
    accountInfo, workdayInfo, taxAdmin, peTms, invoice, engagement, peteKlinger, revenueForecast, onboarding
) VALUES (
    'cpif-howmz-management-' + CAST(GETDATE() AS VARCHAR(20)),
    GETDATE(),
    'system-import', -- You may want to change this to an actual user ID
    'New Client-Entity (Need a CUS#)',
    'OC-GOPI-1',
    'Draft',
    GETDATE(),
    1,
    1.0,
    '{"legalName":"Howmz Management Holdings, LLC","primaryContact":"Shant Assarian","title":"Mr.","email":"s_assarian@hotmail.com","industry":"Manufacturing","entityType":"Limited Liability Co. (LLC)","address":"3500 S Highway 40","city":"Herber City","state":"Utah","zipCode":"84032","serviceType":"Tax - Corporate","estimatedRevenue":"6000","partner":"Todd Northrup","manager":"Todd Northrup","referralSource":"Referral","referralType":"Employee","referralContact":"Adam Winnett","hasEngagementLetter":"Yes","engagementLetterContact":"Joanna Le","engagementLetterManager":"Todd Northrup","engagementLetterPartner":"Joanna Le","engagementLetterReviewer":"Joanna Le","taxForm":"Tax - Partnership/LLC Return","taxYearEnd":"12/31","renewableProject":"Yes","projectStartDate":"10/5/2025","projectEndDate":"12/31/2025","serviceCode":"1065 Partnership","nextDueDate":"10/15/2025","contractType":"Fixed Fee","totalEstimatedHours":8,"estimatedRealizationYear1":"90","contractRateSheet":"National (default)","totalContractAmount":6000,"adminFeePercent":"0.08","adminFeeIncludedExcluded":"Included","onboardingFeePercent":"0","onboardingFeeAmount":0,"suggestedWorkdayParentName":"Howmz","lsFreeText":""}',
    '{"needProjectInWorkday":true,"customerCollectionsLead":null,"projectDeliveryLead":null,"projectManager":null,"asstProjectManager":null,"projectBillingSpecialist":null,"serviceCode":"1065 Partnership","taxYearEnd":"12/31","renewableProject":true,"projectStartDate":"10/5/2025","projectEndDate":"12/31/2025","taxForm":"1065 Partnership","nextDueDate":"10/15/2025","dateOfDeath":"","contractType":"Fixed Fee","totalEstimatedHours":8,"estimatedRealizationYear1":"90","contractRateSheet":"National (default)","totalContractAmount":6000,"adminFeePercent":"0.08","adminFeeIncludedExcluded":"Included","onboardingFeePercent":"0","onboardingFeeAmount":0,"suggestedWorkdayParentName":"Howmz"}',
    '{"elSigned":false,"authorized7216":false}',
    '{"nameOfRelatedPEFundTMSCustomer":""}',
    '{"invoiceType":"Consolidated Billing","consolidatedBillingCustomerName":"Shant Assarian","consolidatedBillingExistingSchedule":"","additionalCustomerContacts":"Shant Assarian","additionalCustomerContactEmails":"","invoiceRecipientNames":"Shant Assarian","invoiceRecipientEmails":""}',
    '{"partnerSigningEL":"Todd Northrup"}',
    '{"documentDelivery":"","invoiceMemo":"","billToContact":""}',
    '{"2025":6000,"2026":0,"2027":0,"2028":0,"2029":0,"2030":0}',
    '{"accountGUID":"","opportunityGUID":"","opportunityName":""}'
);

-- Row 2: Howmz Holdings, LLC
INSERT INTO CPIFDocuments (
    id, timestamp, createdBy, wizardType, ocId, status, lastModified, version, displayOrder,
    accountInfo, workdayInfo, taxAdmin, peTms, invoice, engagement, peteKlinger, revenueForecast, onboarding
) VALUES (
    'cpif-howmz-holdings-' + CAST(GETDATE() AS VARCHAR(20)),
    GETDATE(),
    'system-import',
    'New Client-Entity (Need a CUS#)',
    'OC-GOPI-1',
    'Draft',
    GETDATE(),
    1,
    2.0,
    '{"legalName":"Howmz Holdings, LLC","primaryContact":"Shant Assarian","title":"Mr.","email":"s_assarian@hotmail.com","industry":"Manufacturing","entityType":"Limited Liability Co. (LLC)","address":"3501 S Highway 40","city":"Herber City","state":"Utah","zipCode":"84033","serviceType":"Tax - Corporate","estimatedRevenue":"0","partner":"Todd Northrup","manager":"Todd Northrup","referralSource":"Referral","referralType":"Employee","referralContact":"Adam Winnett","hasEngagementLetter":"Yes","engagementLetterContact":"Joanna Le","engagementLetterManager":"Todd Northrup","engagementLetterPartner":"Joanna Le","engagementLetterReviewer":"Joanna Le","taxForm":"Tax - Partnership/LLC Return","taxYearEnd":"12/31","renewableProject":"Yes","projectStartDate":"10/5/2025","projectEndDate":"12/31/2025","serviceCode":"1065 Partnership","nextDueDate":"10/15/2025","contractType":"Fixed Fee","totalEstimatedHours":8,"estimatedRealizationYear1":"90","contractRateSheet":"National (default)","totalContractAmount":0,"adminFeePercent":"0.08","adminFeeIncludedExcluded":"Included","onboardingFeePercent":"0","onboardingFeeAmount":0,"suggestedWorkdayParentName":"Howmz","lsFreeText":""}',
    '{"needProjectInWorkday":true,"customerCollectionsLead":null,"projectDeliveryLead":null,"projectManager":null,"asstProjectManager":null,"projectBillingSpecialist":null,"serviceCode":"1065 Partnership","taxYearEnd":"12/31","renewableProject":true,"projectStartDate":"10/5/2025","projectEndDate":"12/31/2025","taxForm":"1065 Partnership","nextDueDate":"10/15/2025","dateOfDeath":"","contractType":"Fixed Fee","totalEstimatedHours":8,"estimatedRealizationYear1":"90","contractRateSheet":"National (default)","totalContractAmount":0,"adminFeePercent":"0.08","adminFeeIncludedExcluded":"Included","onboardingFeePercent":"0","onboardingFeeAmount":0,"suggestedWorkdayParentName":"Howmz"}',
    '{"elSigned":false,"authorized7216":false}',
    '{"nameOfRelatedPEFundTMSCustomer":""}',
    '{"invoiceType":"Consolidated Billing","consolidatedBillingCustomerName":"Shant Assarian","consolidatedBillingExistingSchedule":"","additionalCustomerContacts":"Shant Assarian","additionalCustomerContactEmails":"","invoiceRecipientNames":"Shant Assarian","invoiceRecipientEmails":""}',
    '{"partnerSigningEL":"Todd Northrup"}',
    '{"documentDelivery":"","invoiceMemo":"","billToContact":""}',
    '{"2025":0,"2026":0,"2027":0,"2028":0,"2029":0,"2030":0}',
    '{"accountGUID":"","opportunityGUID":"","opportunityName":""}'
);

-- Row 3: Howmz IP Holdings, LLC
INSERT INTO CPIFDocuments (
    id, timestamp, createdBy, wizardType, ocId, status, lastModified, version, displayOrder,
    accountInfo, workdayInfo, taxAdmin, peTms, invoice, engagement, peteKlinger, revenueForecast, onboarding
) VALUES (
    'cpif-howmz-ip-' + CAST(GETDATE() AS VARCHAR(20)),
    GETDATE(),
    'system-import',
    'New Client-Entity (Need a CUS#)',
    'OC-GOPI-1',
    'Draft',
    GETDATE(),
    1,
    3.0,
    '{"legalName":"Howmz IP Holdings, LLC","primaryContact":"Shant Assarian","title":"Mr.","email":"s_assarian@hotmail.com","industry":"Manufacturing","entityType":"Single-Member LLC (SMLLC)","address":"3502 S Highway 40","city":"Herber City","state":"Utah","zipCode":"84034","serviceType":"Tax - Corporate","estimatedRevenue":"0","partner":"Todd Northrup","manager":"Todd Northrup","referralSource":"Referral","referralType":"Employee","referralContact":"Adam Winnett","hasEngagementLetter":"Yes","engagementLetterContact":"Joanna Le","engagementLetterManager":"Todd Northrup","engagementLetterPartner":"Joanna Le","engagementLetterReviewer":"Joanna Le","taxForm":"Tax - Partnership/LLC Return","taxYearEnd":"12/31","renewableProject":"Yes","projectStartDate":"10/5/2025","projectEndDate":"12/31/2025","serviceCode":"Consulting Only","nextDueDate":"10/15/2025","contractType":"Fixed Fee","totalEstimatedHours":8,"estimatedRealizationYear1":"90","contractRateSheet":"National (default)","totalContractAmount":0,"adminFeePercent":"0.08","adminFeeIncludedExcluded":"Included","onboardingFeePercent":"0","onboardingFeeAmount":0,"suggestedWorkdayParentName":"Howmz","lsFreeText":""}',
    '{"needProjectInWorkday":true,"customerCollectionsLead":null,"projectDeliveryLead":null,"projectManager":null,"asstProjectManager":null,"projectBillingSpecialist":null,"serviceCode":"Consulting Only","taxYearEnd":"12/31","renewableProject":true,"projectStartDate":"10/5/2025","projectEndDate":"12/31/2025","taxForm":"Consulting Only","nextDueDate":"10/15/2025","dateOfDeath":"","contractType":"Fixed Fee","totalEstimatedHours":8,"estimatedRealizationYear1":"90","contractRateSheet":"National (default)","totalContractAmount":0,"adminFeePercent":"0.08","adminFeeIncludedExcluded":"Included","onboardingFeePercent":"0","onboardingFeeAmount":0,"suggestedWorkdayParentName":"Howmz"}',
    '{"elSigned":false,"authorized7216":false}',
    '{"nameOfRelatedPEFundTMSCustomer":""}',
    '{"invoiceType":"Consolidated Billing","consolidatedBillingCustomerName":"Shant Assarian","consolidatedBillingExistingSchedule":"","additionalCustomerContacts":"Shant Assarian","additionalCustomerContactEmails":"","invoiceRecipientNames":"Shant Assarian","invoiceRecipientEmails":""}',
    '{"partnerSigningEL":"Todd Northrup"}',
    '{"documentDelivery":"","invoiceMemo":"","billToContact":""}',
    '{"2025":0,"2026":0,"2027":0,"2028":0,"2029":0,"2030":0}',
    '{"accountGUID":"","opportunityGUID":"","opportunityName":""}'
);

PRINT 'Successfully inserted 3 sample CPIF documents with displayOrder 1.0, 2.0, 3.0';

// CPIF Database Schema and Types - Updated for Individual Columns
export interface Employee {
  id: string;
  displayName: string;
  email: string;
  jobTitle: string;
  department: string;
  manager?: string;
}

// Updated CPIFDocument interface to match new individual column schema
export interface CPIFDocument {
  // Core fields
  id: string;
  timestamp: string; // ISO string format
  createdBy: string; // Azure AD user ID
  wizardType: 'New Client-Entity (Need a CUS#)' | 'New Project (Have a CUS#)' | 'Use if Opportunity is in CRM' | 'New Container';
  ocId?: string; // Opportunity Container ID this wizard row belongs to
  status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected' | 'Completed';
  lastModified: string; // ISO string format
  version: number;
  displayOrder: number; // Custom display order for Excel-like flexibility
  
  // Section 1: Create CRM Pipeline Account and Opportunity &/Or Workday Customer
  newAccountLegalName?: string;
  primaryContactName?: string;
  primaryContactTitle?: string;
  primaryContactEmailAddress?: string;
  industry?: string;
  entityType?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  productService?: string;
  estOpptyValue?: number;
  opportunityPartner?: string;
  taxDeliveryPartner?: string;
  bdSalesSupport?: string;
  leadSource?: string;
  leadSourceDetails?: string;
  lsFreeText?: string;
  referringEmployee?: string;
  
  // Section 2: Workday Project & Contract (Time Entry & Pricing)
  needProjectInWorkday?: boolean;
  customerCollectionsLead?: string;
  projectDeliveryLead?: string;
  projectManager?: string;
  asstProjectManager?: string;
  projectBillingSpecialist?: string;
  serviceCode?: string;
  taxYearEnd?: string;
  renewableProject?: boolean;
  projectStartDate?: string; // ISO date string
  projectEndDate?: string; // ISO date string
  taxForm?: string;
  nextDueDate?: string; // ISO date string
  dateOfDeath?: string; // ISO date string
  contractType?: string;
  totalEstimatedHours?: number;
  estimatedRealizationYear1?: string;
  contractRateSheet?: string;
  totalContractAmount?: number;
  adminFeePercent?: number;
  adminFeeIncludedExcluded?: string;
  onboardingFeePercent?: number;
  onboardingFeeAmount?: number;
  suggestedWorkdayParentName?: string;
  
  // Section 3: FOR TAX ADMIN ONLY
  elSigned?: boolean;
  authorized7216?: boolean;
  
  // Section 4: FOR PE & TMS ONLY
  connectedToPEOrTMS?: string;
  nameOfRelatedPEFundTMSCustomer?: string;
  
  // Section 5: Invoice Style & Delivery
  invoiceType?: string;
  consolidatedBillingCustomerName?: string;
  consolidatedBillingExistingSchedule?: string;
  additionalCustomerContacts?: string;
  additionalCustomerContactEmails?: string;
  invoiceRecipientNames?: string;
  invoiceRecipientEmails?: string;
  
  // Section 6: Engagement Letter
  partnerSigningEL?: string;
  consultingServicesDescription?: string;
  
  // Section 7: FOR PETE KLINGER ONLY
  documentDelivery?: string;
  invoiceMemo?: string;
  billToContact?: string;
  
  // Section 8: Revenue Forecast By Month
  october2025?: number;
  november2025?: number;
  december2025?: number;
  january2026?: number;
  february2026?: number;
  march2026?: number;
  april2026?: number;
  may2026?: number;
  june2026?: number;
  july2026?: number;
  august2026?: number;
  september2026?: number;
  balance?: number;
  
  // Section 9: FOR ONBOARDING ONLY
  accountGUID?: string;
  opportunityGUID?: string;
  opportunityName?: string;
}

// Column configuration interface for the Excel Grid View
export interface ColumnConfig {
  key: string;
  label: string;
  width: number;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean' | 'email' | 'currency' | 'percentage';
  section: string;
  headerBgColor: string;
  cellBgColor: string;
  helperText: string;
  options?: string[];
}

// Section configuration for the Excel Grid View
export interface SectionConfig {
  name: string;
  identifier: string;
  color: string;
  columns: ColumnConfig[];
}
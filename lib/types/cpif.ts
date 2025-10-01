// CPIF Database Schema and Types
export interface Employee {
  id: string;
  displayName: string;
  email: string;
  jobTitle: string;
  department: string;
  manager?: string;
}

export interface AccountInfo {
  legalName: string;
  primaryContact: string;
  primaryContactTitle: string;
  primaryContactEmail: string;
  industry: string;
  entityType: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  productService: string;
  estOpptyValue: string;
  opportunityPartner?: Employee;
  taxDeliveryPartner?: Employee;
  bdSalesSupport: string;
  leadSource: string;
  leadSourceDetails: string;
  lsFreeText: string;
  referringEmployee?: Employee;
}

export interface WorkdayInfo {
  needProjectInWorkday: boolean;
  customerCollectionsLead?: Employee;
  projectDeliveryLead?: Employee;
  projectManager?: Employee;
  asstProjectManager?: Employee;
  projectBillingSpecialist?: Employee;
  serviceCode: string;
  taxYearEnd: string;
  renewableProject: boolean;
  projectStartDate: string;
  projectEndDate: string;
  taxForm: string;
  nextDueDate: string;
  dateOfDeath: string;
  contractType: string;
  totalEstimatedHours: number;
  estimatedRealizationYear1: string;
  contractRateSheet: string;
  totalContractAmount: number;
  adminFeePercent: string;
  adminFeeIncludedExcluded: 'Included' | 'Excluded';
  onboardingFeePercent: string;
  onboardingFeeAmount: number;
  suggestedWorkdayParentName: string;
}

export interface TaxAdminInfo {
  elSigned: boolean;
  authorized7216: boolean;
}

export interface PETMSInfo {
  connectedToPEOrTMS: string;
  nameOfRelatedPEFundTMSCustomer: string;
}

export interface InvoiceInfo {
  invoiceType: string;
  consolidatedBillingCustomerName: string;
  consolidatedBillingExistingSchedule: string;
  additionalCustomerContacts: string;
  additionalCustomerContactEmails: string;
  invoiceRecipientNames: string;
  invoiceRecipientEmails: string;
}

export interface EngagementInfo {
  partnerSigningEL: string;
  consultingServicesDescription: string;
}

export interface PeteKlingerInfo {
  documentDelivery: string;
  invoiceMemo: string;
  billToContact: string;
}

export interface RevenueForecast {
  [key: string]: number; // "0-0": 1000, "0-1": 2000, etc.
}

export interface OnboardingInfo {
  accountGUID: string;
  opportunityGUID: string;
  opportunityName: string;
}

export interface CPIFDocument {
  id: string;
  timestamp: Date;
  createdBy: string; // Azure AD user ID
  wizardType: 'New Client-Entity (Need a CUS#)' | 'New Project (Have a CUS#)' | 'Use if Opportunity is in CRM';
  ocId?: string; // Opportunity Container ID this wizard row belongs to
  
  // Form sections
  accountInfo: AccountInfo;
  workdayInfo: WorkdayInfo;
  taxAdmin: TaxAdminInfo;
  peTms: PETMSInfo;
  invoice: InvoiceInfo;
  engagement: EngagementInfo;
  peteKlinger: PeteKlingerInfo;
  revenueForecast: RevenueForecast;
  onboarding: OnboardingInfo;
  
  // Metadata
  status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected' | 'Completed';
  lastModified: Date;
  version: number;
}


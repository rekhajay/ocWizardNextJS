import React, { useState, useEffect } from 'react';
import { EmployeeService } from '@/lib/services/employeeService';
import { CPIFDocument, Employee } from '@/lib/types/cpif';

type WizardTab = 'New Client-Entity (Need a CUS#)' | 'Existing Client-Entity (Has a CUS#)' | 'New Client-Individual (Need a CUS#)' | 'Existing Client-Individual (Has a CUS#)';

type IndustryOption = 'Agriculture' | 'Architecture' | 'Arts & Entertainment' | 'Automotive' | 'Banking & Finance' | 'Construction' | 'Education' | 'Energy' | 'Food & Beverage' | 'Government' | 'Healthcare' | 'Hospitality' | 'Insurance' | 'Legal' | 'Manufacturing' | 'Media & Communications' | 'Non-Profit' | 'Real Estate' | 'Retail' | 'Technology' | 'Transportation' | 'Other';

type EntityTypeOption = 'C-Corporation' | 'S-Corporation' | 'Partnership' | 'LLC' | 'LLP' | 'Sole Proprietorship' | 'Trust' | 'Estate' | 'Individual' | 'Other';

type ProductServiceOption = 'Tax Preparation' | 'Tax Planning' | 'Bookkeeping' | 'Payroll' | 'Audit' | 'Consulting' | 'Other';

type LeadSourceOption = 'Referral' | 'Website' | 'Social Media' | 'Advertising' | 'Cold Call' | 'Trade Show' | 'Marketing & Sales Campaign' | 'Web Origin' | 'Referral';

interface WizardProps {
  open: boolean;
  onClose: () => void;
  ocId?: string; // Optional OC ID to track which OC this wizard is for
  onCPIFSaved?: (ocId: string) => void; // Callback when CPIF is saved
}

export default function Wizard({ open, onClose, ocId, onCPIFSaved }: WizardProps) {
  const [selectedTab, setSelectedTab] = useState<WizardTab | ''>('');
  const [currentStep, setCurrentStep] = useState<'tab-selection' | 'single-row'>('tab-selection');
  
  // Services
  const [employeeService] = useState(new EmployeeService());
  
  // Employee data
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  
  // Form state
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  // CRUD state
  const [savedCPIFs, setSavedCPIFs] = useState<CPIFDocument[]>([]);
  const [showCRUD, setShowCRUD] = useState(false);
  const [editingCPIF, setEditingCPIF] = useState<CPIFDocument | null>(null);
  const [selectedCPIFId, setSelectedCPIFId] = useState<string | null>(null);
  
  // Form fields
  const [newAccountLegalName, setNewAccountLegalName] = useState('');
  const [primaryContactName, setPrimaryContactName] = useState('');
  const [primaryContactTitle, setPrimaryContactTitle] = useState('');
  const [primaryContactEmail, setPrimaryContactEmail] = useState('');
  const [industry, setIndustry] = useState<IndustryOption | ''>('');
  const [entityType, setEntityType] = useState<EntityTypeOption | ''>('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [productService, setProductService] = useState<ProductServiceOption | ''>('');
  const [estOpptyValue, setEstOpptyValue] = useState('');
  const [opportunityPartner, setOpportunityPartner] = useState<Employee | null>(null);
  const [taxDeliveryPartner, setTaxDeliveryPartner] = useState<Employee | null>(null);
  const [bdSalesSupport, setBdSalesSupport] = useState('');
  const [leadSource, setLeadSource] = useState<LeadSourceOption | ''>('');
  const [leadSourceDetails, setLeadSourceDetails] = useState('');
  const [lsFreeText, setLsFreeText] = useState('');
  const [referringEmployee, setReferringEmployee] = useState<Employee | null>(null);

  // Workday fields
  const [needProjectInWorkday, setNeedProjectInWorkday] = useState('');
  const [customerCollectionsLead, setCustomerCollectionsLead] = useState<Employee | null>(null);
  const [projectDeliveryLead, setProjectDeliveryLead] = useState<Employee | null>(null);
  const [projectManager, setProjectManager] = useState<Employee | null>(null);
  const [asstProjectManager, setAsstProjectManager] = useState<Employee | null>(null);
  const [projectBillingSpecialist, setProjectBillingSpecialist] = useState<Employee | null>(null);
  const [serviceCode, setServiceCode] = useState('');
  const [taxYearEnd, setTaxYearEnd] = useState('');
  const [renewableProject, setRenewableProject] = useState('');
  const [projectStartDate, setProjectStartDate] = useState('');
  const [projectEndDate, setProjectEndDate] = useState('');
  const [taxForm, setTaxForm] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');
  const [dateOfDeath, setDateOfDeath] = useState('');
  const [contractType, setContractType] = useState('');
  const [totalEstimatedHours, setTotalEstimatedHours] = useState('');
  const [estimatedRealizationYear1, setEstimatedRealizationYear1] = useState('');
  const [contractRateSheet, setContractRateSheet] = useState('');
  const [totalContractAmount, setTotalContractAmount] = useState('');
  const [adminFeePercent, setAdminFeePercent] = useState('');
  const [adminFeeIncludedExcluded, setAdminFeeIncludedExcluded] = useState<'Included' | 'Excluded'>('Included');
  const [onboardingFeePercent, setOnboardingFeePercent] = useState('');
  const [onboardingFeeAmount, setOnboardingFeeAmount] = useState('');
  const [suggestedWorkdayParentName, setSuggestedWorkdayParentName] = useState('');

  // Tax Admin fields
  const [elSigned, setElSigned] = useState('');
  const [authorized7216, setAuthorized7216] = useState('');

  // PE & TMS fields
  const [connectedToPEOrTMS, setConnectedToPEOrTMS] = useState('');
  const [nameOfRelatedPEFundTMSCustomer, setNameOfRelatedPEFundTMSCustomer] = useState('');

  // Invoice fields
  const [invoiceType, setInvoiceType] = useState('');
  const [consolidatedBillingCustomerName, setConsolidatedBillingCustomerName] = useState('');
  const [consolidatedBillingExistingSchedule, setConsolidatedBillingExistingSchedule] = useState('');
  const [additionalCustomerContacts, setAdditionalCustomerContacts] = useState('');
  const [additionalCustomerContactEmails, setAdditionalCustomerContactEmails] = useState('');
  const [invoiceRecipientNames, setInvoiceRecipientNames] = useState('');
  const [invoiceRecipientEmails, setInvoiceRecipientEmails] = useState('');

  // Engagement fields
  const [partnerSigningEL, setPartnerSigningEL] = useState('');
  const [consultingServicesDescription, setConsultingServicesDescription] = useState('');

  // Pete Klinger fields
  const [documentDelivery, setDocumentDelivery] = useState('');
  const [invoiceMemo, setInvoiceMemo] = useState('');
  const [billToContact, setBillToContact] = useState('');

  // Revenue forecast
  const [revenueForecast, setRevenueForecast] = useState<Record<string, number>>({});

  // Onboarding fields
  const [accountGUID, setAccountGUID] = useState('');
  const [opportunityGUID, setOpportunityGUID] = useState('');
  const [opportunityName, setOpportunityName] = useState('');

  // Load employees on component mount
  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const employeeData = await employeeService.getEmployees();
      setEmployees(employeeData);
    } catch (error) {
      console.error('Failed to load employees:', error);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleTabSelection = (tab: WizardTab) => {
    setSelectedTab(tab);
    setCurrentStep('single-row');
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('saving');
    
    try {
      const cpifData: CPIFDocument = {
        id: `cpif-${Date.now()}`,
        timestamp: new Date(),
        createdBy: 'current-user-id', // In real app, get from auth context
        wizardType: selectedTab as WizardTab,
        accountInfo: {
          legalName: newAccountLegalName,
          primaryContact: primaryContactName,
          primaryContactTitle: primaryContactTitle,
          primaryContactEmail: primaryContactEmail,
          industry: industry as string,
          entityType: entityType as string,
          address,
          city,
          state,
          zipCode,
          productService: productService as string,
          estOpptyValue,
          opportunityPartner: opportunityPartner!,
          taxDeliveryPartner: taxDeliveryPartner!,
          bdSalesSupport,
          leadSource: leadSource as string,
          leadSourceDetails,
          lsFreeText,
          referringEmployee: referringEmployee || undefined
        },
        workdayInfo: {
          needProjectInWorkday: true,
          customerCollectionsLead: employees[0] || {} as Employee,
          projectDeliveryLead: employees[0] || {} as Employee,
          projectManager: employees[0] || {} as Employee,
          asstProjectManager: employees[0] || {} as Employee,
          projectBillingSpecialist: employees[0] || {} as Employee,
          serviceCode: 'TAX',
          taxYearEnd: '12/31',
          renewableProject: true,
          projectStartDate: new Date().toISOString().split('T')[0],
          projectEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          taxForm: '1040',
          nextDueDate: new Date().toISOString().split('T')[0],
          dateOfDeath: '',
          contractType: 'Standard',
          totalEstimatedHours: 100,
          estimatedRealizationYear1: new Date().getFullYear().toString(),
          contractRateSheet: 'Standard',
          totalContractAmount: parseFloat(estOpptyValue) || 0,
          adminFeePercent: '10',
          adminFeeIncludedExcluded: 'Included',
          onboardingFeePercent: '5',
          onboardingFeeAmount: 500,
          suggestedWorkdayParentName: newAccountLegalName
        },
        taxAdmin: {
          elSigned: false,
          authorized7216: false
        },
        peTms: {
          connectedToPEOrTMS: 'No',
          nameOfRelatedPEFundTMSCustomer: ''
        },
        invoice: {
          invoiceType: 'Standard',
          consolidatedBillingCustomerName: '',
          consolidatedBillingExistingSchedule: '',
          additionalCustomerContacts: '',
          additionalCustomerContactEmails: '',
          invoiceRecipientNames: primaryContactName,
          invoiceRecipientEmails: primaryContactEmail
        },
        engagement: {
          partnerSigningEL: opportunityPartner?.displayName || '',
          consultingServicesDescription: ''
        },
        peteKlinger: {
          documentDelivery: 'Email',
          invoiceMemo: '',
          billToContact: primaryContactName
        },
        revenueForecast: {
          '0-0': estOpptyValue,
          '0-1': '0',
          '0-2': '0'
        },
        onboarding: {
          accountGUID: `acc-${Date.now()}`,
          opportunityGUID: `opp-${Date.now()}`,
          opportunityName: newAccountLegalName
        },
        status: 'Draft',
        lastModified: new Date(),
        version: 1
      };

      // TODO: Implement your preferred data storage solution
      console.log('CPIF Data:', cpifData);
      setSaveStatus('saved');
      
      // Call the callback if provided
      if (onCPIFSaved && ocId) {
        onCPIFSaved(ocId);
      }
      
      // Reset form
      resetForm();
      
    } catch (error) {
      console.error('Failed to save CPIF:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setNewAccountLegalName('');
    setPrimaryContactName('');
    setPrimaryContactTitle('');
    setPrimaryContactEmail('');
    setIndustry('');
    setEntityType('');
    setAddress('');
    setCity('');
    setState('');
    setZipCode('');
    setProductService('');
    setEstOpptyValue('');
    setOpportunityPartner(null);
    setTaxDeliveryPartner(null);
    setBdSalesSupport('');
    setLeadSource('');
    setLeadSourceDetails('');
    setLsFreeText('');
    setReferringEmployee(null);
    setSelectedTab('');
    setCurrentStep('tab-selection');
    setSaveStatus('idle');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">CPIF Creation Wizard</h2>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {currentStep === 'tab-selection' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Select Wizard Type</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => handleTabSelection('New Client-Entity (Need a CUS#)')}
                  className="p-4 border rounded-lg hover:bg-gray-50 text-left"
                >
                  <h4 className="font-semibold">New Client-Entity (Need a CUS#)</h4>
                  <p className="text-sm text-gray-600">Create a new client entity that needs a Customer ID</p>
                </button>
                <button
                  onClick={() => handleTabSelection('Existing Client-Entity (Has a CUS#)')}
                  className="p-4 border rounded-lg hover:bg-gray-50 text-left"
                >
                  <h4 className="font-semibold">Existing Client-Entity (Has a CUS#)</h4>
                  <p className="text-sm text-gray-600">Add services to an existing client entity</p>
                </button>
                <button
                  onClick={() => handleTabSelection('New Client-Individual (Need a CUS#)')}
                  className="p-4 border rounded-lg hover:bg-gray-50 text-left"
                >
                  <h4 className="font-semibold">New Client-Individual (Need a CUS#)</h4>
                  <p className="text-sm text-gray-600">Create a new individual client</p>
                </button>
                <button
                  onClick={() => handleTabSelection('Existing Client-Individual (Has a CUS#)')}
                  className="p-4 border rounded-lg hover:bg-gray-50 text-left"
                >
                  <h4 className="font-semibold">Existing Client-Individual (Has a CUS#)</h4>
                  <p className="text-sm text-gray-600">Add services to an existing individual client</p>
                </button>
              </div>
            </div>
          )}

          {currentStep === 'single-row' && selectedTab && (
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="bg-white shadow-sm border-b p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-2xl font-bold">Container Creation Wizard - {selectedTab}</h1>
                    <p className="text-sm text-gray-600">Single Row View - Scroll horizontally to see all fields</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setCurrentStep('tab-selection')}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Back to Tab Selection
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving || !newAccountLegalName || !primaryContactName || !primaryContactEmail}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save CPIF'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Scrollable Form Container */}
              <div className="flex-1 overflow-auto">
                <div className="p-6">
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {/* Single Row Form - Horizontal Scroll */}
                    <div className="overflow-x-auto">
                      <div className="min-w-[2000px] p-6">
                        <div className="grid grid-cols-1 gap-8">

                          {/* Account Information Section */}
                          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                            <h2 className="text-xl font-bold text-red-600 mb-4">Create Account and Opportunity &/Or Workday Customer</h2>
                            <div className="grid grid-cols-4 gap-4">
                              <div>
                                <label className="block text-sm font-medium mb-1">New Account Legal Name *</label>
                                <input
                                  type="text"
                                  value={newAccountLegalName}
                                  onChange={(e) => setNewAccountLegalName(e.target.value)}
                                  className="w-full border rounded px-3 py-2"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Primary Contact Name *</label>
                                <input
                                  type="text"
                                  value={primaryContactName}
                                  onChange={(e) => setPrimaryContactName(e.target.value)}
                                  className="w-full border rounded px-3 py-2"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Primary Contact Title</label>
                                <input
                                  type="text"
                                  value={primaryContactTitle}
                                  onChange={(e) => setPrimaryContactTitle(e.target.value)}
                                  className="w-full border rounded px-3 py-2"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Primary Contact Email *</label>
                                <input
                                  type="email"
                                  value={primaryContactEmail}
                                  onChange={(e) => setPrimaryContactEmail(e.target.value)}
                                  className="w-full border rounded px-3 py-2"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">State</label>
                                <input
                                  type="text"
                                  value={state}
                                  onChange={(e) => setState(e.target.value)}
                                  className="w-full border rounded px-3 py-2"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Zip Code</label>
                                <input
                                  type="text"
                                  value={zipCode}
                                  onChange={(e) => setZipCode(e.target.value)}
                                  className="w-full border rounded px-3 py-2"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Product/Service</label>
                                <select
                                  value={productService}
                                  onChange={(e) => setProductService(e.target.value as ProductServiceOption)}
                                  className="w-full border rounded px-3 py-2"
                                >
                                  <option value="">Select</option>
                                  <option value="Tax Preparation">Tax Preparation</option>
                                  <option value="Tax Planning">Tax Planning</option>
                                  <option value="Bookkeeping">Bookkeeping</option>
                                  <option value="Payroll">Payroll</option>
                                  <option value="Audit">Audit</option>
                                  <option value="Consulting">Consulting</option>
                                  <option value="Other">Other</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Est. Oppty Value</label>
                                <input
                                  type="text"
                                  value={estOpptyValue}
                                  onChange={(e) => setEstOpptyValue(e.target.value)}
                                  className="w-full border rounded px-3 py-2"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Lead Source Details</label>
                                <input
                                  type="text"
                                  value={leadSourceDetails}
                                  onChange={(e) => setLeadSourceDetails(e.target.value)}
                                  className="w-full border rounded px-3 py-2"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">LS Free Text</label>
                                <input
                                  type="text"
                                  value={lsFreeText}
                                  onChange={(e) => setLsFreeText(e.target.value)}
                                  className="w-full border rounded px-3 py-2"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Referring Employee</label>
                                <select
                                  value={referringEmployee?.id || ''}
                                  onChange={(e) => {
                                    const employee = employees.find(emp => emp.id === e.target.value);
                                    setReferringEmployee(employee || null);
                                  }}
                                  className="w-full border rounded px-3 py-2"
                                >
                                  <option value="">Select Employee</option>
                                  {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>
                                      {emp.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* Workday Project & Contract Section */}
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                            <h2 className="text-xl font-bold text-red-600 mb-4">Workday Project & Contract (Time Entry & Pricing)</h2>
                            <div className="grid grid-cols-4 gap-4">
                              <div>
                                <label className="block text-sm font-medium mb-1">Need Project in Workday?</label>
                                <select
                                  value={needProjectInWorkday}
                                  onChange={(e) => setNeedProjectInWorkday(e.target.value)}
                                  className="w-full border rounded px-3 py-2"
                                >
                                  <option value="">Select</option>
                                  <option value="Yes">Yes</option>
                                  <option value="No">No</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Customer Collections Lead</label>
                                <select
                                  value={customerCollectionsLead?.id || ''}
                                  onChange={(e) => {
                                    const employee = employees.find(emp => emp.id === e.target.value);
                                    setCustomerCollectionsLead(employee || null);
                                  }}
                                  className="w-full border rounded px-3 py-2"
                                >
                                  <option value="">Select Employee</option>
                                  {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>
                                      {emp.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Project Delivery Lead</label>
                                <select
                                  value={projectDeliveryLead?.id || ''}
                                  onChange={(e) => {
                                    const employee = employees.find(emp => emp.id === e.target.value);
                                    setProjectDeliveryLead(employee || null);
                                  }}
                                  className="w-full border rounded px-3 py-2"
                                >
                                  <option value="">Select Employee</option>
                                  {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>
                                      {emp.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Project Manager</label>
                                <select
                                  value={projectManager?.id || ''}
                                  onChange={(e) => {
                                    const employee = employees.find(emp => emp.id === e.target.value);
                                    setProjectManager(employee || null);
                                  }}
                                  className="w-full border rounded px-3 py-2"
                                >
                                  <option value="">Select Employee</option>
                                  {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>
                                      {emp.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Renewable Project?</label>
                                <select
                                  value={renewableProject}
                                  onChange={(e) => setRenewableProject(e.target.value)}
                                  className="w-full border rounded px-3 py-2"
                                >
                                  <option value="">Select</option>
                                  <option value="Yes">Yes</option>
                                  <option value="No">No</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Project Start Date</label>
                                <input
                                  type="date"
                                  value={projectStartDate}
                                  onChange={(e) => setProjectStartDate(e.target.value)}
                                  className="w-full border rounded px-3 py-2"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Project End Date</label>
                                <input
                                  type="date"
                                  value={projectEndDate}
                                  onChange={(e) => setProjectEndDate(e.target.value)}
                                  className="w-full border rounded px-3 py-2"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Tax Form</label>
                                <input
                                  type="text"
                                  value={taxForm}
                                  onChange={(e) => setTaxForm(e.target.value)}
                                  className="w-full border rounded px-3 py-2"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Estimated Realization Year 1</label>
                                <input
                                  type="text"
                                  value={estimatedRealizationYear1}
                                  onChange={(e) => setEstimatedRealizationYear1(e.target.value)}
                                  className="w-full border rounded px-3 py-2"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Contract Rate Sheet</label>
                                <input
                                  type="text"
                                  value={contractRateSheet}
                                  onChange={(e) => setContractRateSheet(e.target.value)}
                                  className="w-full border rounded px-3 py-2"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Total Contract Amount</label>
                                <input
                                  type="text"
                                  value={totalContractAmount}
                                  onChange={(e) => setTotalContractAmount(e.target.value)}
                                  className="w-full border rounded px-3 py-2"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Admin Fee %</label>
                                <input
                                  type="text"
                                  value={adminFeePercent}
                                  onChange={(e) => setAdminFeePercent(e.target.value)}
                                  className="w-full border rounded px-3 py-2"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Onboarding Section */}
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                            <h2 className="text-xl font-bold text-red-600 mb-4">FOR ONBOARDING ONLY</h2>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium mb-1">Account GUID</label>
                                <input
                                  type="text"
                                  value={accountGUID}
                                  onChange={(e) => setAccountGUID(e.target.value)}
                                  className="w-full border rounded px-3 py-2"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Opportunity GUID</label>
                                <input
                                  type="text"
                                  value={opportunityGUID}
                                  onChange={(e) => setOpportunityGUID(e.target.value)}
                                  className="w-full border rounded px-3 py-2"
                                />
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
                        <option value="Arts & Entertainment">Arts & Entertainment</option>
                        <option value="Automotive">Automotive</option>
                        <option value="Banking & Finance">Banking & Finance</option>
                        <option value="Construction">Construction</option>
                        <option value="Education">Education</option>
                        <option value="Energy">Energy</option>
                        <option value="Food & Beverage">Food & Beverage</option>
                        <option value="Government">Government</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Hospitality">Hospitality</option>
                        <option value="Insurance">Insurance</option>
                        <option value="Legal">Legal</option>
                        <option value="Manufacturing">Manufacturing</option>
                        <option value="Media & Communications">Media & Communications</option>
                        <option value="Non-Profit">Non-Profit</option>
                        <option value="Real Estate">Real Estate</option>
                        <option value="Retail">Retail</option>
                        <option value="Technology">Technology</option>
                        <option value="Transportation">Transportation</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Entity Type</label>
                      <select
                        value={entityType}
                        onChange={(e) => setEntityType(e.target.value as EntityTypeOption)}
                        className="w-full border rounded px-3 py-2"
                      >
                        <option value="">Select Entity Type</option>
                        <option value="C-Corporation">C-Corporation</option>
                        <option value="S-Corporation">S-Corporation</option>
                        <option value="Partnership">Partnership</option>
                        <option value="LLC">LLC</option>
                        <option value="LLP">LLP</option>
                        <option value="Sole Proprietorship">Sole Proprietorship</option>
                        <option value="Trust">Trust</option>
                        <option value="Estate">Estate</option>
                        <option value="Individual">Individual</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h5 className="font-medium mb-2">Address</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Address</label>
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="w-full border rounded px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">City</label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full border rounded px-3 py-2"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-sm font-medium mb-1">State</label>
                          <input
                            type="text"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">ZIP</label>
                          <input
                            type="text"
                            value={zipCode}
                            onChange={(e) => setZipCode(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Service Information */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-4">Service Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Product/Service</label>
                      <select
                        value={productService}
                        onChange={(e) => setProductService(e.target.value as ProductServiceOption)}
                        className="w-full border rounded px-3 py-2"
                      >
                        <option value="">Select Service</option>
                        <option value="Tax Preparation">Tax Preparation</option>
                        <option value="Tax Planning">Tax Planning</option>
                        <option value="Bookkeeping">Bookkeeping</option>
                        <option value="Payroll">Payroll</option>
                        <option value="Audit">Audit</option>
                        <option value="Consulting">Consulting</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Estimated Opportunity Value</label>
                      <input
                        type="number"
                        value={estOpptyValue}
                        onChange={(e) => setEstOpptyValue(e.target.value)}
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                  </div>
                </div>

                {/* Team Assignment */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-4">Team Assignment</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Opportunity Partner</label>
                      <select
                        value={opportunityPartner?.id || ''}
                        onChange={(e) => {
                          const emp = employees.find(emp => emp.id === e.target.value);
                          setOpportunityPartner(emp || null);
                        }}
                        className="w-full border rounded px-3 py-2"
                        disabled={loadingEmployees}
                      >
                        <option value="">Select Partner</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>
                            {emp.displayName} ({emp.jobTitle})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Tax Delivery Partner</label>
                      <select
                        value={taxDeliveryPartner?.id || ''}
                        onChange={(e) => {
                          const emp = employees.find(emp => emp.id === e.target.value);
                          setTaxDeliveryPartner(emp || null);
                        }}
                        className="w-full border rounded px-3 py-2"
                        disabled={loadingEmployees}
                      >
                        <option value="">Select Partner</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>
                            {emp.displayName} ({emp.jobTitle})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Lead Source */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-4">Lead Source</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Lead Source</label>
                      <select
                        value={leadSource}
                        onChange={(e) => setLeadSource(e.target.value as LeadSourceOption)}
                        className="w-full border rounded px-3 py-2"
                      >
                        <option value="">Select Lead Source</option>
                        <option value="Referral">Referral</option>
                        <option value="Website">Website</option>
                        <option value="Social Media">Social Media</option>
                        <option value="Advertising">Advertising</option>
                        <option value="Cold Call">Cold Call</option>
                        <option value="Trade Show">Trade Show</option>
                        <option value="Marketing & Sales Campaign">Marketing & Sales Campaign</option>
                        <option value="Web Origin">Web Origin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Lead Source Details</label>
                      <input
                        type="text"
                        value={leadSourceDetails}
                        onChange={(e) => setLeadSourceDetails(e.target.value)}
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-1">Referring Employee</label>
                    <select
                      value={referringEmployee?.id || ''}
                      onChange={(e) => {
                        const emp = employees.find(emp => emp.id === e.target.value);
                        setReferringEmployee(emp || null);
                      }}
                      className="w-full border rounded px-3 py-2"
                      disabled={loadingEmployees}
                    >
                      <option value="">Select Referring Employee</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.displayName} ({emp.jobTitle})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Save Status */}
                {saveStatus === 'saving' && (
                  <div className="text-blue-600">Saving...</div>
                )}
                {saveStatus === 'saved' && (
                  <div className="text-green-600">CPIF saved successfully!</div>
                )}
                {saveStatus === 'error' && (
                  <div className="text-red-600">Error saving CPIF. Please try again.</div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 border rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving || !newAccountLegalName || !primaryContactName || !primaryContactEmail}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save CPIF'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

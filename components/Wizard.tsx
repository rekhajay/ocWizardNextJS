import React, { useState, useEffect } from 'react';
import { EmployeeService } from '@/lib/services/employeeService';
import { CPIFDocument, Employee } from '@/lib/types/cpif';

type WizardTab = 'New Client-Entity (Need a CUS#)' | 'New Project (Have a CUS#)' | 'Use if Opportunity is in CRM';

type IndustryOption = 'Agriculture' | 'Architecture' | 'Arts & Entertainment' | 'Automotive' | 'Banking & Finance' | 'Construction' | 'Education' | 'Energy' | 'Food & Beverage' | 'Government' | 'Healthcare' | 'Hospitality' | 'Insurance' | 'Legal' | 'Manufacturing' | 'Media & Communications' | 'Non-Profit' | 'Real Estate' | 'Retail' | 'Technology' | 'Transportation' | 'Other';

type EntityTypeOption = 'C-Corporation' | 'S-Corporation' | 'Partnership' | 'LLC' | 'LLP' | 'Sole Proprietorship' | 'Trust' | 'Estate' | 'Individual' | 'Other';

type ProductServiceOption = 'Tax Preparation' | 'Tax Planning' | 'Bookkeeping' | 'Payroll' | 'Audit' | 'Consulting' | 'Other';

type LeadSourceOption = 'Referral' | 'Website' | 'Social Media' | 'Advertising' | 'Cold Call' | 'Trade Show' | 'Marketing & Sales Campaign' | 'Web Origin' | 'Referral';

interface WizardProps {
  open: boolean;
  onClose: () => void;
  ocId?: string;
  onCPIFSaved?: (ocId: string) => void;
  selectedTab?: WizardTab; // Pre-selected tab for page mode
  isPageMode?: boolean; // Whether this is in page mode (not popup)
  isManageMode?: boolean; // Whether this is manage mode (show list view first)
}

export default function Wizard({ open, onClose, ocId, onCPIFSaved, selectedTab: propSelectedTab, isPageMode = false, isManageMode = false }: WizardProps) {
  const [selectedTab, setSelectedTab] = useState<WizardTab | ''>(propSelectedTab || '');
  const [currentStep, setCurrentStep] = useState<'list-view' | 'tab-selection' | 'single-row'>(() => {
    const initialState = propSelectedTab ? 'single-row' : 'list-view';
    console.log('Wizard initial currentStep:', initialState, 'propSelectedTab:', propSelectedTab, 'isManageMode:', isManageMode, 'ocId:', ocId);
    return initialState;
  });
  
  const [employeeService] = useState(new EmployeeService());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  // Wizard rows management
  const [wizardRows, setWizardRows] = useState<CPIFDocument[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [editingRow, setEditingRow] = useState<CPIFDocument | null>(null);
  const [selectedRow, setSelectedRow] = useState<CPIFDocument | null>(null);
  
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

  useEffect(() => {
    loadEmployees();
    if (currentStep === 'list-view') {
      console.log('currentStep is list-view, calling loadWizardRows');
      alert('About to load wizard rows...');
      loadWizardRows();
    }
  }, [currentStep]);

  // Reset to list-view when wizard opens (for both Create and Manage)
  useEffect(() => {
    if (open) {
      console.log('Wizard opened - resetting to list-view', 'isManageMode:', isManageMode, 'ocId:', ocId);
      alert(`Wizard opened - setting currentStep to list-view. Current step was: ${currentStep}`);
      setCurrentStep('list-view');
      setSelectedTab('');
      setEditingRow(null);
      setSelectedRow(null);
      // Force load wizard rows when wizard opens
      loadWizardRows();
    }
  }, [open, isManageMode, ocId]);

  // Debug log when ocId changes
  useEffect(() => {
    console.log('Wizard ocId changed to:', ocId);
    alert(`Wizard received ocId: ${ocId}`);
  }, [ocId]);

  const loadEmployees = async () => {
    setLoadingEmployees(true);
    try {
      // For demo purposes, use mock data instead of Azure AD
      const mockEmployees: Employee[] = [
        { id: '1', displayName: 'John Smith', email: 'john.smith@company.com', jobTitle: 'Senior Manager', department: 'Tax', manager: 'Jane Doe' },
        { id: '2', displayName: 'Jane Doe', email: 'jane.doe@company.com', jobTitle: 'Director', department: 'Tax', manager: '' },
        { id: '3', displayName: 'Mike Johnson', email: 'mike.johnson@company.com', jobTitle: 'Senior Associate', department: 'Tax', manager: 'John Smith' },
        { id: '4', displayName: 'Sarah Wilson', email: 'sarah.wilson@company.com', jobTitle: 'Manager', department: 'Audit', manager: 'Jane Doe' },
        { id: '5', displayName: 'David Brown', email: 'david.brown@company.com', jobTitle: 'Partner', department: 'Tax', manager: '' }
      ];
      setEmployees(mockEmployees);
    } catch (error) {
      console.error('Failed to load employees:', error);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const loadWizardRows = async () => {
    setLoadingRows(true);
    try {
      const response = await fetch('/api/cpif');
      if (response.ok) {
        const result = await response.json();
        const allRows: CPIFDocument[] = result.data || [];
        
        // Filter rows by the ocId passed to the Wizard component
        const filteredRows = ocId ? allRows.filter(row => row.ocId === ocId) : allRows;
        
        console.log('Loading wizard rows for OC:', ocId);
        console.log('All rows from DB:', allRows.map(row => ({ id: row.id, ocId: row.ocId, company: row.accountInfo?.legalName })));
        console.log('Filtered rows for current OC:', filteredRows.map(row => ({ id: row.id, ocId: row.ocId, company: row.accountInfo?.legalName })));
        
        alert(`Loading wizard rows for OC: ${ocId}\nAll rows: ${allRows.length}\nFiltered rows: ${filteredRows.length}`);
        
        setWizardRows(filteredRows);
      }
    } catch (error) {
      console.error('Failed to load wizard rows:', error);
    } finally {
      setLoadingRows(false);
    }
  };

  const handleDeleteRow = async (id: string) => {
    if (confirm('Are you sure you want to delete this wizard row?')) {
      try {
        const response = await fetch(`/api/cpif/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setWizardRows(prev => prev.filter(row => row.id !== id));
        }
      } catch (error) {
        console.error('Failed to delete wizard row:', error);
      }
    }
  };

  const handleRowClick = (row: CPIFDocument) => {
    setSelectedRow(row);
  };

  const handleDuplicateRow = (row: CPIFDocument) => {
    setEditingRow(null); // Not editing, just duplicating
    setSelectedRow(row);
    // Populate form with existing data but generate new ID
    populateFormWithData(row);
    setCurrentStep('single-row');
  };

  const populateFormWithData = (row: CPIFDocument) => {
    // Populate form with existing data
    setNewAccountLegalName(row.accountInfo.legalName);
    setPrimaryContactName(row.accountInfo.primaryContact);
    setPrimaryContactTitle(row.accountInfo.primaryContactTitle);
    setPrimaryContactEmail(row.accountInfo.primaryContactEmail);
    setIndustry(row.accountInfo.industry as IndustryOption);
    setEntityType(row.accountInfo.entityType as EntityTypeOption);
    setAddress(row.accountInfo.address);
    setCity(row.accountInfo.city);
    setState(row.accountInfo.state);
    setZipCode(row.accountInfo.zipCode);
    setProductService(row.accountInfo.productService as ProductServiceOption);
    setEstOpptyValue(row.accountInfo.estOpptyValue.toString());
    setOpportunityPartner(employees.find(emp => emp.id === row.accountInfo.opportunityPartner?.id) || null);
    setTaxDeliveryPartner(employees.find(emp => emp.id === row.accountInfo.taxDeliveryPartner?.id) || null);
    setBdSalesSupport(row.accountInfo.bdSalesSupport);
    setLeadSource(row.accountInfo.leadSource as LeadSourceOption);
    setLeadSourceDetails(row.accountInfo.leadSourceDetails);
    setLsFreeText(row.accountInfo.lsFreeText);
    setReferringEmployee(employees.find(emp => emp.id === row.accountInfo.referringEmployee?.id) || null);
    
    // Workday Project & Contract
    setNeedProjectInWorkday(row.workdayInfo.needProjectInWorkday ? 'Yes' : 'No');
    setCustomerCollectionsLead(employees.find(emp => emp.id === row.workdayInfo.customerCollectionsLead?.id) || null);
    setProjectDeliveryLead(employees.find(emp => emp.id === row.workdayInfo.projectDeliveryLead?.id) || null);
    setProjectManager(employees.find(emp => emp.id === row.workdayInfo.projectManager?.id) || null);
    setAsstProjectManager(employees.find(emp => emp.id === row.workdayInfo.asstProjectManager?.id) || null);
    setProjectBillingSpecialist(employees.find(emp => emp.id === row.workdayInfo.projectBillingSpecialist?.id) || null);
    setServiceCode(row.workdayInfo.serviceCode);
    setTaxYearEnd(row.workdayInfo.taxYearEnd);
    setRenewableProject(row.workdayInfo.renewableProject ? 'Yes' : 'No');
    setProjectStartDate(row.workdayInfo.projectStartDate);
    setProjectEndDate(row.workdayInfo.projectEndDate);
    setTaxForm(row.workdayInfo.taxForm);
    setNextDueDate(row.workdayInfo.nextDueDate);
    setDateOfDeath(row.workdayInfo.dateOfDeath);
    setContractType(row.workdayInfo.contractType);
    setTotalEstimatedHours(row.workdayInfo.totalEstimatedHours.toString());
    setEstimatedRealizationYear1(row.workdayInfo.estimatedRealizationYear1.toString());
    setContractRateSheet(row.workdayInfo.contractRateSheet);
    setTotalContractAmount(row.workdayInfo.totalContractAmount.toString());
    setAdminFeePercent(row.workdayInfo.adminFeePercent.toString());
    setAdminFeeIncludedExcluded(row.workdayInfo.adminFeeIncludedExcluded);
    setOnboardingFeePercent(row.workdayInfo.onboardingFeePercent.toString());
    setOnboardingFeeAmount(row.workdayInfo.onboardingFeeAmount.toString());
    setSuggestedWorkdayParentName(row.workdayInfo.suggestedWorkdayParentName);
    
    // Tax Admin
    setElSigned(row.taxAdmin.elSigned ? 'Yes' : 'No');
    setAuthorized7216(row.taxAdmin.authorized7216 ? 'Yes' : 'No');
    
    // PE & TMS
    setConnectedToPEOrTMS(row.peTms.connectedToPEOrTMS);
    setNameOfRelatedPEFundTMSCustomer(row.peTms.nameOfRelatedPEFundTMSCustomer);
    
    // Invoice
    setInvoiceType(row.invoice.invoiceType);
    setConsolidatedBillingCustomerName(row.invoice.consolidatedBillingCustomerName);
    setConsolidatedBillingExistingSchedule(row.invoice.consolidatedBillingExistingSchedule);
    setAdditionalCustomerContacts(row.invoice.additionalCustomerContacts);
    setAdditionalCustomerContactEmails(row.invoice.additionalCustomerContactEmails);
    setInvoiceRecipientNames(row.invoice.invoiceRecipientNames);
    setInvoiceRecipientEmails(row.invoice.invoiceRecipientEmails);
    
    // Engagement
    setPartnerSigningEL(row.engagement.partnerSigningEL);
    setConsultingServicesDescription(row.engagement.consultingServicesDescription);
    
    // Pete Klinger
    setDocumentDelivery(row.peteKlinger.documentDelivery);
    setInvoiceMemo(row.peteKlinger.invoiceMemo);
    setBillToContact(row.peteKlinger.billToContact);
    
    // Revenue Forecast
    setRevenueForecast(row.revenueForecast);
    
    // Onboarding
    setAccountGUID(row.onboarding.accountGUID);
    setOpportunityGUID(row.onboarding.opportunityGUID);
    setOpportunityName(row.onboarding.opportunityName);
    
    setSelectedTab(row.wizardType as WizardTab);
    setCurrentStep('single-row');
  };

  const handleEditRow = (row: CPIFDocument) => {
    setEditingRow(row);
    setSelectedRow(row);
    populateFormWithData(row);
    setCurrentStep('single-row');
  };

  const handleTabSelection = (tab: WizardTab) => {
    setSelectedTab(tab);
    setCurrentStep('single-row');
  };

  const handleSave = async () => {
    console.log('handleSave function called!');
    setIsSaving(true);
    setSaveStatus('saving');
    
    try {
      const cpifData: CPIFDocument = {
        id: editingRow ? editingRow.id : `cpif-${Date.now()}`,
        timestamp: new Date(),
        createdBy: 'current-user-id',
        wizardType: selectedTab as WizardTab,
        ocId: ocId, // Store the OC ID this wizard row belongs to
        accountInfo: {
          legalName: newAccountLegalName,
          primaryContact: primaryContactName,
          primaryContactTitle: primaryContactTitle,
          primaryContactEmail: primaryContactEmail,
          industry: industry,
          entityType: entityType,
          address: address,
          city: city,
          state: state,
          zipCode: zipCode,
          productService: productService,
          estOpptyValue: estOpptyValue,
          opportunityPartner: opportunityPartner || undefined,
          taxDeliveryPartner: taxDeliveryPartner || undefined,
          bdSalesSupport: bdSalesSupport,
          leadSource: leadSource,
          leadSourceDetails: leadSourceDetails,
          lsFreeText: lsFreeText,
          referringEmployee: referringEmployee || undefined
        },
        workdayInfo: {
          needProjectInWorkday: needProjectInWorkday === 'Yes',
          customerCollectionsLead: customerCollectionsLead || undefined,
          projectDeliveryLead: projectDeliveryLead || undefined,
          projectManager: projectManager || undefined,
          asstProjectManager: asstProjectManager || undefined,
          projectBillingSpecialist: projectBillingSpecialist || undefined,
          serviceCode: serviceCode,
          taxYearEnd: taxYearEnd,
          renewableProject: renewableProject === 'Yes',
          projectStartDate: projectStartDate,
          projectEndDate: projectEndDate,
          taxForm: taxForm,
          nextDueDate: nextDueDate,
          dateOfDeath: dateOfDeath,
          contractType: contractType,
          totalEstimatedHours: parseFloat(totalEstimatedHours) || 0,
          estimatedRealizationYear1: estimatedRealizationYear1,
          contractRateSheet: contractRateSheet,
          totalContractAmount: parseFloat(totalContractAmount) || 0,
          adminFeePercent: adminFeePercent,
          adminFeeIncludedExcluded: adminFeeIncludedExcluded,
          onboardingFeePercent: onboardingFeePercent,
          onboardingFeeAmount: parseFloat(onboardingFeeAmount) || 0,
          suggestedWorkdayParentName: suggestedWorkdayParentName
        },
        taxAdmin: {
          elSigned: elSigned === 'Yes',
          authorized7216: authorized7216 === 'Yes'
        },
        peTms: {
          connectedToPEOrTMS: connectedToPEOrTMS,
          nameOfRelatedPEFundTMSCustomer: nameOfRelatedPEFundTMSCustomer
        },
        invoice: {
          invoiceType: invoiceType,
          consolidatedBillingCustomerName: consolidatedBillingCustomerName,
          consolidatedBillingExistingSchedule: consolidatedBillingExistingSchedule,
          additionalCustomerContacts: additionalCustomerContacts,
          additionalCustomerContactEmails: additionalCustomerContactEmails,
          invoiceRecipientNames: invoiceRecipientNames,
          invoiceRecipientEmails: invoiceRecipientEmails
        },
        engagement: {
          partnerSigningEL: partnerSigningEL,
          consultingServicesDescription: consultingServicesDescription
        },
        peteKlinger: {
          documentDelivery: documentDelivery,
          invoiceMemo: invoiceMemo,
          billToContact: billToContact
        },
        revenueForecast: revenueForecast,
        onboarding: {
          accountGUID: accountGUID,
          opportunityGUID: opportunityGUID,
          opportunityName: opportunityName
        },
        status: 'Draft',
        lastModified: new Date(),
        version: 1
      };

      // Save to Azure SQL Database
      console.log('Attempting to save CPIF data:', cpifData);
      
      const isUpdate = editingRow !== null;
      const url = isUpdate ? `/api/cpif/${editingRow.id}` : '/api/cpif';
      const method = isUpdate ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cpifData),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to save CPIF to database: ${errorText}`);
      }

      const result = await response.json();
      console.log('CPIF saved successfully:', result);
      setSaveStatus('saved');

      // Call the callback if provided
      if (onCPIFSaved && ocId) {
        onCPIFSaved(ocId);
      }

      // Clear editing state and refresh the wizard rows list
      setEditingRow(null);
      await loadWizardRows();
      setCurrentStep('list-view');
      
    } catch (error) {
      console.error('Failed to save CPIF:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setSelectedTab('');
    setCurrentStep('list-view');
    setSaveStatus('idle');
    setEditingRow(null);
    setSelectedRow(null);
    onClose();
  };

  if (!open) return null;

  const containerClasses = isPageMode 
    ? "w-full bg-white rounded-lg shadow-lg flex flex-col"
    : "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2";

  const contentClasses = isPageMode
    ? "w-full h-full bg-white rounded-lg shadow-lg flex flex-col"
    : "w-[98vw] h-[96vh] bg-white rounded-lg shadow-xl flex flex-col";

  return (
    <div className={containerClasses}>
      <div className={contentClasses}>
        <div className="flex-1 overflow-hidden">
          <div className="bg-white px-6 py-4 border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {editingRow ? 'Edit Container Wizard' : 'Container Creation Wizard'}
                    </h2>
                    <span className="text-blue-600 text-sm font-medium">{selectedTab}</span>
                  </div>
              <button
                onClick={handleClose}
                className="text-gray-600 hover:text-gray-800 bg-white border border-gray-300 px-3 py-1 rounded text-sm"
              >
                Close
              </button>
            </div>
          </div>

          {currentStep === 'list-view' && (
            <div className="flex-1 overflow-hidden">

              <div className="flex-1 overflow-auto p-6">
                {loadingRows ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-gray-500">Loading wizard rows...</div>
                  </div>
                ) : wizardRows.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500 mb-4">No wizard rows created yet</div>
                    <button
                      onClick={() => setCurrentStep('tab-selection')}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Create New Wizard Row
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company Name</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {wizardRows.map((row, index) => (
                              <tr 
                                key={row.id} 
                                className={`hover:bg-gray-50 cursor-pointer ${
                                  selectedRow?.id === row.id ? 'bg-blue-200 border-l-4 border-blue-600' : ''
                                }`}
                                onClick={() => handleRowClick(row)}
                              >
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                  {String.fromCharCode(97 + index)} {/* a, b, c, d, etc. */}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {row.accountInfo.legalName}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {row.wizardType}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {row.accountInfo.primaryContact}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {row.accountInfo.primaryContactEmail}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    row.status === 'Draft' ? 'bg-yellow-100 text-yellow-800' :
                                    row.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {row.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {new Date(row.timestamp).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <div className="flex gap-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditRow(row);
                                      }}
                                      className="px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded hover:bg-blue-600 transition-colors"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteRow(row.id);
                                      }}
                                      className="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded hover:bg-red-600 transition-colors"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    <div className="flex justify-center gap-4 pt-4">
                      <button
                        onClick={() => setCurrentStep('tab-selection')}
                        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
                      >
                        Create New Wizard Row
                      </button>
                      {selectedRow && (
                        <button
                          onClick={() => handleDuplicateRow(selectedRow)}
                          className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
                        >
                          Duplicate Row
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 'tab-selection' && (
            <div className="space-y-4 p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Select Wizard Type</h3>
                <button
                  onClick={() => setCurrentStep('list-view')}
                  className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                >
                  Back to List
                </button>
              </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button
                          onClick={() => handleTabSelection('New Client-Entity (Need a CUS#)')}
                          className="p-4 bg-green-50 border-2 border-green-300 rounded-lg hover:bg-green-100 text-left"
                        >
                          <h4 className="font-semibold text-green-800">New Client-Entity (Need a CUS#)</h4>
                          <p className="text-sm text-green-600">Create a new client entity that needs a Customer ID</p>
                        </button>
                        <button
                          onClick={() => handleTabSelection('New Project (Have a CUS#)')}
                          className="p-4 bg-blue-500 border-2 border-blue-600 rounded-lg hover:bg-blue-600 text-left"
                        >
                          <h4 className="font-semibold text-white">New Project (Have a CUS#)</h4>
                          <p className="text-sm text-blue-100">Create a new project for existing client</p>
                        </button>
                        <button
                          onClick={() => handleTabSelection('Use if Opportunity is in CRM')}
                          className="p-4 bg-green-500 border-2 border-green-600 rounded-lg hover:bg-green-600 text-left"
                        >
                          <h4 className="font-semibold text-white">Use if Opportunity is in CRM</h4>
                          <p className="text-sm text-green-100">Link to existing opportunity in CRM system</p>
                        </button>
                      </div>
            </div>
          )}

          {currentStep === 'single-row' && selectedTab && (
            <div className="h-full flex flex-col">
              <div className="bg-white px-6 py-3 border-b">
                        <div className="flex justify-between items-center">
                          <div>
                            <h1 className="text-lg font-bold text-red-600 mb-1">
                              {editingRow ? 'Edit Container Wizard - Single Row View' : 'Container Creation Wizard - Single Row View'}
                            </h1>
                            <p className="text-sm text-gray-500 italic">← Scroll horizontally to see all fields →</p>
                          </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        console.log('Save button clicked!');
                        console.log('Form validation:', {
                          newAccountLegalName,
                          primaryContactName,
                          primaryContactEmail,
                          isSaving
                        });
                        handleSave();
                      }}
                      disabled={isSaving || !newAccountLegalName || !primaryContactName || !primaryContactEmail}
                      className="px-4 py-2 bg-green-500 text-white rounded text-sm font-medium hover:bg-green-600 disabled:opacity-50"
                    >
                      {isSaving ? (editingRow ? 'Updating...' : 'Saving...') : (editingRow ? 'Update' : 'Save')}
                    </button>
                            <button
                              onClick={() => setCurrentStep('tab-selection')}
                              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50"
                            >
                              Back to Tab Selection
                            </button>
                            <button
                              onClick={() => setCurrentStep('list-view')}
                              className="px-4 py-2 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                            >
                              Back to List
                            </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Horizontal Scroll Bar */}
                <div className="overflow-x-auto border-b border-gray-200">
                  <div className="min-w-[2000px] h-4 bg-gray-100"></div>
                </div>
                
                {/* Main Content Area */}
                <div className="flex-1 overflow-auto p-6 pb-12">
                  <div className="overflow-x-auto">
                    <div className="min-w-[2000px]">
                      <div className="grid grid-cols-1 gap-6">
                        
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h2 className="text-lg font-bold text-red-600 mb-3">Create Account and Opportunity &/Or Workday Customer</h2>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">New Account Legal Name *</label>
                              <input
                                type="text"
                                value={newAccountLegalName}
                                onChange={(e) => setNewAccountLegalName(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Primary Contact Name *</label>
                              <input
                                type="text"
                                value={primaryContactName}
                                onChange={(e) => setPrimaryContactName(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Primary Contact Title</label>
                              <input
                                type="text"
                                value={primaryContactTitle}
                                onChange={(e) => setPrimaryContactTitle(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Primary Contact Email *</label>
                              <input
                                type="email"
                                value={primaryContactEmail}
                                onChange={(e) => setPrimaryContactEmail(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Industry</label>
                              <select
                                value={industry}
                                onChange={(e) => setIndustry(e.target.value as IndustryOption)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              >
                                <option value="">Select Industry</option>
                                <option value="Agriculture">Agriculture</option>
                                <option value="Architecture">Architecture</option>
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
                              <label className="block text-sm font-medium text-gray-900 mb-1">Entity Type</label>
                              <select
                                value={entityType}
                                onChange={(e) => setEntityType(e.target.value as EntityTypeOption)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Address</label>
                              <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">City</label>
                              <input
                                type="text"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">State</label>
                              <input
                                type="text"
                                value={state}
                                onChange={(e) => setState(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Zip Code</label>
                              <input
                                type="text"
                                value={zipCode}
                                onChange={(e) => setZipCode(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Product/Service</label>
                              <select
                                value={productService}
                                onChange={(e) => setProductService(e.target.value as ProductServiceOption)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
                              <label className="block text-sm font-medium text-gray-900 mb-1">Est. Oppty Value</label>
                              <input
                                type="text"
                                value={estOpptyValue}
                                onChange={(e) => setEstOpptyValue(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Opportunity Partner</label>
                              <select
                                value={opportunityPartner?.id || ''}
                                onChange={(e) => {
                                  const employee = employees.find(emp => emp.id === e.target.value);
                                  setOpportunityPartner(employee || null);
                                }}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              >
                                <option value="">Select Employee</option>
                                {employees.map(emp => (
                                  <option key={emp.id} value={emp.id}>
                                    {emp.displayName}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Tax Delivery Partner</label>
                              <select
                                value={taxDeliveryPartner?.id || ''}
                                onChange={(e) => {
                                  const employee = employees.find(emp => emp.id === e.target.value);
                                  setTaxDeliveryPartner(employee || null);
                                }}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              >
                                <option value="">Select Employee</option>
                                {employees.map(emp => (
                                  <option key={emp.id} value={emp.id}>
                                    {emp.displayName}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">BD Sales Support</label>
                              <input
                                type="text"
                                value={bdSalesSupport}
                                onChange={(e) => setBdSalesSupport(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Lead Source</label>
                              <select
                                value={leadSource}
                                onChange={(e) => setLeadSource(e.target.value as LeadSourceOption)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
                              <label className="block text-sm font-medium text-gray-900 mb-1">Lead Source Details</label>
                              <input
                                type="text"
                                value={leadSourceDetails}
                                onChange={(e) => setLeadSourceDetails(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">LS Free Text</label>
                              <input
                                type="text"
                                value={lsFreeText}
                                onChange={(e) => setLsFreeText(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Referring Employee</label>
                              <select
                                value={referringEmployee?.id || ''}
                                onChange={(e) => {
                                  const employee = employees.find(emp => emp.id === e.target.value);
                                  setReferringEmployee(employee || null);
                                }}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              >
                                <option value="">Select Employee</option>
                                {employees.map(emp => (
                                  <option key={emp.id} value={emp.id}>
                                    {emp.displayName}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Workday Project & Contract Section */}
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                          <h2 className="text-lg font-bold text-red-600 mb-3">Workday Project & Contract (Time Entry & Pricing)</h2>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Need Project in Workday?</label>
                              <select
                                value={needProjectInWorkday}
                                onChange={(e) => setNeedProjectInWorkday(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              >
                                <option value="">Select</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Customer Collections Lead</label>
                              <select
                                value={customerCollectionsLead?.id || ''}
                                onChange={(e) => {
                                  const employee = employees.find(emp => emp.id === e.target.value);
                                  setCustomerCollectionsLead(employee || null);
                                }}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              >
                                <option value="">Select Employee</option>
                                {employees.map(emp => (
                                  <option key={emp.id} value={emp.id}>
                                    {emp.displayName}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Project Delivery Lead</label>
                              <select
                                value={projectDeliveryLead?.id || ''}
                                onChange={(e) => {
                                  const employee = employees.find(emp => emp.id === e.target.value);
                                  setProjectDeliveryLead(employee || null);
                                }}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              >
                                <option value="">Select Employee</option>
                                {employees.map(emp => (
                                  <option key={emp.id} value={emp.id}>
                                    {emp.displayName}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Project Manager</label>
                              <select
                                value={projectManager?.id || ''}
                                onChange={(e) => {
                                  const employee = employees.find(emp => emp.id === e.target.value);
                                  setProjectManager(employee || null);
                                }}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              >
                                <option value="">Select Employee</option>
                                {employees.map(emp => (
                                  <option key={emp.id} value={emp.id}>
                                    {emp.displayName}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Assistant Project Manager</label>
                              <select
                                value={asstProjectManager?.id || ''}
                                onChange={(e) => {
                                  const employee = employees.find(emp => emp.id === e.target.value);
                                  setAsstProjectManager(employee || null);
                                }}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              >
                                <option value="">Select Employee</option>
                                {employees.map(emp => (
                                  <option key={emp.id} value={emp.id}>
                                    {emp.displayName}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Project Billing Specialist</label>
                              <select
                                value={projectBillingSpecialist?.id || ''}
                                onChange={(e) => {
                                  const employee = employees.find(emp => emp.id === e.target.value);
                                  setProjectBillingSpecialist(employee || null);
                                }}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              >
                                <option value="">Select Employee</option>
                                {employees.map(emp => (
                                  <option key={emp.id} value={emp.id}>
                                    {emp.displayName}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Service Code</label>
                              <input
                                type="text"
                                value={serviceCode}
                                onChange={(e) => setServiceCode(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Tax Year End</label>
                              <input
                                type="text"
                                value={taxYearEnd}
                                onChange={(e) => setTaxYearEnd(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Renewable Project?</label>
                              <select
                                value={renewableProject}
                                onChange={(e) => setRenewableProject(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              >
                                <option value="">Select</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Project Start Date</label>
                              <input
                                type="date"
                                value={projectStartDate}
                                onChange={(e) => setProjectStartDate(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Project End Date</label>
                              <input
                                type="date"
                                value={projectEndDate}
                                onChange={(e) => setProjectEndDate(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Tax Form</label>
                              <input
                                type="text"
                                value={taxForm}
                                onChange={(e) => setTaxForm(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Next Due Date</label>
                              <input
                                type="date"
                                value={nextDueDate}
                                onChange={(e) => setNextDueDate(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Date of Death</label>
                              <input
                                type="date"
                                value={dateOfDeath}
                                onChange={(e) => setDateOfDeath(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Contract Type</label>
                              <input
                                type="text"
                                value={contractType}
                                onChange={(e) => setContractType(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Total Estimated Hours</label>
                              <input
                                type="text"
                                value={totalEstimatedHours}
                                onChange={(e) => setTotalEstimatedHours(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Estimated Realization Year 1</label>
                              <input
                                type="text"
                                value={estimatedRealizationYear1}
                                onChange={(e) => setEstimatedRealizationYear1(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Contract Rate Sheet</label>
                              <input
                                type="text"
                                value={contractRateSheet}
                                onChange={(e) => setContractRateSheet(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Total Contract Amount</label>
                              <input
                                type="text"
                                value={totalContractAmount}
                                onChange={(e) => setTotalContractAmount(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Admin Fee %</label>
                              <input
                                type="text"
                                value={adminFeePercent}
                                onChange={(e) => setAdminFeePercent(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Admin Fee Included/Excluded</label>
                              <select
                                value={adminFeeIncludedExcluded}
                                onChange={(e) => setAdminFeeIncludedExcluded(e.target.value as 'Included' | 'Excluded')}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              >
                                <option value="Included">Included</option>
                                <option value="Excluded">Excluded</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Onboarding Fee %</label>
                              <input
                                type="text"
                                value={onboardingFeePercent}
                                onChange={(e) => setOnboardingFeePercent(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Onboarding Fee Amount</label>
                              <input
                                type="text"
                                value={onboardingFeeAmount}
                                onChange={(e) => setOnboardingFeeAmount(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Suggested Workday Parent Name</label>
                              <input
                                type="text"
                                value={suggestedWorkdayParentName}
                                onChange={(e) => setSuggestedWorkdayParentName(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Tax Admin Section */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h2 className="text-lg font-bold text-red-600 mb-3">Tax Admin</h2>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">EL Signed</label>
                              <select
                                value={elSigned}
                                onChange={(e) => setElSigned(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              >
                                <option value="">Select</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Authorized 7216</label>
                              <select
                                value={authorized7216}
                                onChange={(e) => setAuthorized7216(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              >
                                <option value="">Select</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* PE & TMS Section */}
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                          <h2 className="text-lg font-bold text-red-600 mb-3">PE & TMS</h2>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Connected to PE or TMS</label>
                              <input
                                type="text"
                                value={connectedToPEOrTMS}
                                onChange={(e) => setConnectedToPEOrTMS(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Name of Related PE Fund/TMS Customer</label>
                              <input
                                type="text"
                                value={nameOfRelatedPEFundTMSCustomer}
                                onChange={(e) => setNameOfRelatedPEFundTMSCustomer(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Invoice Section */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <h2 className="text-lg font-bold text-red-600 mb-3">Invoice</h2>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Invoice Type</label>
                              <input
                                type="text"
                                value={invoiceType}
                                onChange={(e) => setInvoiceType(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Consolidated Billing Customer Name</label>
                              <input
                                type="text"
                                value={consolidatedBillingCustomerName}
                                onChange={(e) => setConsolidatedBillingCustomerName(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Consolidated Billing Existing Schedule</label>
                              <input
                                type="text"
                                value={consolidatedBillingExistingSchedule}
                                onChange={(e) => setConsolidatedBillingExistingSchedule(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Additional Customer Contacts</label>
                              <input
                                type="text"
                                value={additionalCustomerContacts}
                                onChange={(e) => setAdditionalCustomerContacts(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Additional Customer Contact Emails</label>
                              <input
                                type="text"
                                value={additionalCustomerContactEmails}
                                onChange={(e) => setAdditionalCustomerContactEmails(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Invoice Recipient Names</label>
                              <input
                                type="text"
                                value={invoiceRecipientNames}
                                onChange={(e) => setInvoiceRecipientNames(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Invoice Recipient Emails</label>
                              <input
                                type="text"
                                value={invoiceRecipientEmails}
                                onChange={(e) => setInvoiceRecipientEmails(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Engagement Section */}
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                          <h2 className="text-lg font-bold text-red-600 mb-3">Engagement</h2>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Partner Signing EL</label>
                              <input
                                type="text"
                                value={partnerSigningEL}
                                onChange={(e) => setPartnerSigningEL(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Consulting Services Description</label>
                              <textarea
                                value={consultingServicesDescription}
                                onChange={(e) => setConsultingServicesDescription(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                rows={3}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Pete Klinger Section */}
                        <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                          <h2 className="text-lg font-bold text-red-600 mb-3">Pete Klinger</h2>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Document Delivery</label>
                              <input
                                type="text"
                                value={documentDelivery}
                                onChange={(e) => setDocumentDelivery(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Invoice Memo</label>
                              <input
                                type="text"
                                value={invoiceMemo}
                                onChange={(e) => setInvoiceMemo(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Bill To Contact</label>
                              <input
                                type="text"
                                value={billToContact}
                                onChange={(e) => setBillToContact(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Revenue Forecast Section */}
                        <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                          <h2 className="text-lg font-bold text-red-600 mb-2">Revenue Forecast By Month</h2>
                          <p className="text-sm text-red-600 mb-3">Using the Total Contract Amount, indicate the timing of WIP production over a 12-month period.</p>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="bg-blue-100">
                                  <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">
                                    <div>Sep-2025</div>
                                    <div className="text-xs">Month 1</div>
                                  </th>
                                  <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">
                                    <div>Oct-2025</div>
                                    <div className="text-xs">Month 2</div>
                                  </th>
                                  <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">
                                    <div>Nov-2025</div>
                                    <div className="text-xs">Month 3</div>
                                  </th>
                                  <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">
                                    <div>Dec-2025</div>
                                    <div className="text-xs">Month 4</div>
                                  </th>
                                  <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">
                                    <div>Jan-2026</div>
                                    <div className="text-xs">Month 5</div>
                                  </th>
                                  <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">
                                    <div>Feb-2026</div>
                                    <div className="text-xs">Month 6</div>
                                  </th>
                                  <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">
                                    <div>Mar-2026</div>
                                    <div className="text-xs">Month 7</div>
                                  </th>
                                  <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">
                                    <div>Apr-2026</div>
                                    <div className="text-xs">Month 8</div>
                                  </th>
                                  <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">
                                    <div>May-2026</div>
                                    <div className="text-xs">Month 9</div>
                                  </th>
                                  <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">
                                    <div>Jun-2026</div>
                                    <div className="text-xs">Month 10</div>
                                  </th>
                                  <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">
                                    <div>Jul-2026</div>
                                    <div className="text-xs">Month 11</div>
                                  </th>
                                  <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">
                                    <div>Aug-2026</div>
                                    <div className="text-xs">Month 12</div>
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="bg-pink-50">
                                  {Array.from({ length: 12 }, (_, i) => (
                                    <td key={i} className="border border-gray-300 px-3 py-2">
                                      <input
                                        type="number"
                                        value={revenueForecast[`0-${i}`] || ''}
                                        onChange={(e) => setRevenueForecast(prev => ({ ...prev, [`0-${i}`]: parseFloat(e.target.value) || 0 }))}
                                        className="w-full border-0 focus:ring-0 text-center bg-transparent"
                                        placeholder="0"
                                      />
                                    </td>
                                  ))}
                                </tr>
                                <tr className="bg-pink-50">
                                  {Array.from({ length: 12 }, (_, i) => (
                                    <td key={`row2-${i}`} className="border border-gray-300 px-3 py-2">
                                      <input
                                        type="number"
                                        value={revenueForecast[`1-${i}`] || ''}
                                        onChange={(e) => setRevenueForecast(prev => ({ ...prev, [`1-${i}`]: parseFloat(e.target.value) || 0 }))}
                                        className="w-full border-0 focus:ring-0 text-center bg-transparent"
                                        placeholder="0"
                                      />
                                    </td>
                                  ))}
                                </tr>
                                <tr className="bg-pink-50">
                                  {Array.from({ length: 12 }, (_, i) => (
                                    <td key={`row3-${i}`} className="border border-gray-300 px-3 py-2">
                                      <input
                                        type="number"
                                        value={revenueForecast[`2-${i}`] || ''}
                                        onChange={(e) => setRevenueForecast(prev => ({ ...prev, [`2-${i}`]: parseFloat(e.target.value) || 0 }))}
                                        className="w-full border-0 focus:ring-0 text-center bg-transparent"
                                        placeholder="0"
                                      />
                                    </td>
                                  ))}
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Onboarding Section */}
                        <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4 mb-8">
                          <h2 className="text-lg font-bold text-red-600 mb-3">FOR ONBOARDING ONLY</h2>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Account GUID</label>
                              <input
                                type="text"
                                value={accountGUID}
                                onChange={(e) => setAccountGUID(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Opportunity GUID</label>
                              <input
                                type="text"
                                value={opportunityGUID}
                                onChange={(e) => setOpportunityGUID(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">Opportunity Name</label>
                              <input
                                type="text"
                                value={opportunityName}
                                onChange={(e) => setOpportunityName(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              />
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Bottom Horizontal Scroll Bar */}
                <div className="overflow-x-auto border-t border-gray-200">
                  <div className="min-w-[2000px] h-4 bg-gray-100"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
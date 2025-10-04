import React, { useState, useEffect } from 'react';
import { CPIFDocument, Employee } from '../lib/types/cpif';

interface ExcelGridViewProps {
  ocId: string;
}

const ExcelGridView: React.FC<ExcelGridViewProps> = ({ ocId }) => {
  const [wizardRows, setWizardRows] = useState<CPIFDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempData, setTempData] = useState<Record<string, any>>({});
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showHelperText, setShowHelperText] = useState(true);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [currentRow, setCurrentRow] = useState<string | null>(null);
  const [currentColumn, setCurrentColumn] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [savedRowIds, setSavedRowIds] = useState<Set<string>>(new Set());
  const [modifiedRowIds, setModifiedRowIds] = useState<Set<string>>(new Set());

  // Load wizard rows
  const loadWizardRows = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/cpif');
      if (response.ok) {
        const result = await response.json();
        const allRows: CPIFDocument[] = result.data || [];
        
        // Filter rows by the ocId
        const filteredRows = ocId ? allRows.filter(row => row.ocId === ocId) : allRows;
        setWizardRows(filteredRows);
        
        // Mark existing rows as already saved
        const existingRowIds = new Set(filteredRows.map(row => row.id));
        setSavedRowIds(existingRowIds);
        
        // Clear any previous modification tracking
        setModifiedRowIds(new Set());
      }
    } catch (error) {
      console.error('Failed to load wizard rows:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load employees
  const loadEmployees = async () => {
    try {
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
    }
  };

  useEffect(() => {
    loadWizardRows();
    loadEmployees();
  }, [ocId]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, rowId: string, colIndex: number) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      
      // Save current value before navigating
      const currentField = columnConfig[colIndex].key;
      const currentValue = tempData[currentField] !== undefined ? tempData[currentField] : getFieldValue(wizardRows.find(r => r.id === rowId)!, currentField);
      const currentRow = wizardRows.find(r => r.id === rowId);
      if (currentRow) {
        const updatedRow = setFieldValue(currentRow, currentField, currentValue);
        setWizardRows(prev => prev.map(r => r.id === rowId ? updatedRow : r));
      }
      
      if (e.shiftKey) {
        // Shift + Tab: go to previous column
        if (colIndex > 0) {
          setCurrentColumn(colIndex - 1);
          setCurrentRow(rowId);
          setEditingRow(rowId);
          setEditingField(columnConfig[colIndex - 1].key);
        } else if (wizardRows.length > 1) {
          // Go to last column of previous row
          const currentRowIndex = wizardRows.findIndex(r => r.id === rowId);
          if (currentRowIndex > 0) {
            const prevRow = wizardRows[currentRowIndex - 1];
            setCurrentRow(prevRow.id);
            setCurrentColumn(columnConfig.length - 1);
            setEditingRow(prevRow.id);
            setEditingField(columnConfig[columnConfig.length - 1].key);
          }
        }
      } else {
        // Tab: go to next column
        if (colIndex < columnConfig.length - 1) {
          setCurrentColumn(colIndex + 1);
          setCurrentRow(rowId);
          setEditingRow(rowId);
          setEditingField(columnConfig[colIndex + 1].key);
        } else if (wizardRows.length > 1) {
          // Go to first column of next row
          const currentRowIndex = wizardRows.findIndex(r => r.id === rowId);
          if (currentRowIndex < wizardRows.length - 1) {
            const nextRow = wizardRows[currentRowIndex + 1];
            setCurrentRow(nextRow.id);
            setCurrentColumn(0);
            setEditingRow(nextRow.id);
            setEditingField(columnConfig[0].key);
          }
        }
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      
      // Save current value before navigating
      const currentField = columnConfig[colIndex].key;
      const currentValue = tempData[currentField] !== undefined ? tempData[currentField] : getFieldValue(wizardRows.find(r => r.id === rowId)!, currentField);
      const currentRow = wizardRows.find(r => r.id === rowId);
      if (currentRow) {
        const updatedRow = setFieldValue(currentRow, currentField, currentValue);
        setWizardRows(prev => prev.map(r => r.id === rowId ? updatedRow : r));
      }
      
      // Enter: go to next row, same column
      const currentRowIndex = wizardRows.findIndex(r => r.id === rowId);
      if (currentRowIndex < wizardRows.length - 1) {
        const nextRow = wizardRows[currentRowIndex + 1];
        setCurrentRow(nextRow.id);
        setCurrentColumn(colIndex);
        setEditingRow(nextRow.id);
        setEditingField(columnConfig[colIndex].key);
      }
    } else if (e.key === 'Escape') {
      // Escape: exit editing mode
      setEditingRow(null);
      setEditingField(null);
      setTempData({});
    }
  };

  // Create new row
  const createNewRow = () => {
    const newRow: CPIFDocument = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      createdBy: 'Current User',
      wizardType: 'New Container',
      ocId: ocId,
      status: 'Draft',
      lastModified: new Date().toISOString(),
      version: 1,
      accountInfo: {
        legalName: '',
        primaryContact: '',
        primaryContactTitle: '',
        primaryContactEmail: '',
        industry: '',
        entityType: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        productService: '',
        estOpptyValue: '',
        opportunityPartner: undefined,
        taxDeliveryPartner: undefined,
        bdSalesSupport: '',
        leadSource: '',
        leadSourceDetails: '',
        lsFreeText: '',
        referringEmployee: undefined
      },
      workdayInfo: {
        needProjectInWorkday: false,
        customerCollectionsLead: undefined,
        projectDeliveryLead: undefined,
        projectManager: undefined,
        asstProjectManager: undefined,
        projectBillingSpecialist: undefined,
        serviceCode: '',
        taxYearEnd: '',
        renewableProject: false,
        projectStartDate: '',
        projectEndDate: '',
        taxForm: '',
        nextDueDate: '',
        dateOfDeath: '',
        contractType: '',
        totalEstimatedHours: 0,
        estimatedRealizationYear1: '',
        contractRateSheet: '',
        totalContractAmount: 0,
        adminFeePercent: '',
        adminFeeIncludedExcluded: 'Included',
        onboardingFeePercent: '',
        onboardingFeeAmount: 0,
        suggestedWorkdayParentName: ''
      },
      taxAdmin: {
        elSigned: false,
        authorized7216: false
      },
      peTms: {
        connectedToPEOrTMS: '',
        nameOfRelatedPEFundTMSCustomer: ''
      },
      invoice: {
        invoiceType: '',
        consolidatedBillingCustomerName: '',
        consolidatedBillingExistingSchedule: '',
        additionalCustomerContacts: '',
        additionalCustomerContactEmails: '',
        invoiceRecipientNames: '',
        invoiceRecipientEmails: ''
      },
      engagement: {
        partnerSigningEL: '',
        consultingServicesDescription: ''
      },
      peteKlinger: {
        documentDelivery: '',
        invoiceMemo: '',
        billToContact: ''
      },
      revenueForecast: {
        October2025: 0,
        November2025: 0,
        December2025: 0,
        January2026: 0,
        February2026: 0,
        March2026: 0,
        April2026: 0,
        May2026: 0,
        June2026: 0,
        July2026: 0,
        August2026: 0,
        September2026: 0,
        balance: 0
      },
      onboarding: {
        accountGUID: '',
        opportunityGUID: '',
        opportunityName: ''
      }
    };
    
    setWizardRows(prev => [...prev, newRow]);
    setEditingRow(newRow.id);
    setEditingField(columnConfig[0].key);
    setCurrentRow(newRow.id);
    setCurrentColumn(0);
  };

  // Auto-save row (for real-time saving without interrupting editing)
  const autoSaveRow = async (row: CPIFDocument) => {
    try {
      const isNewRow = row.id.startsWith('temp-');
      const url = isNewRow ? '/api/cpif' : `/api/cpif/${row.id}`;
      const method = isNewRow ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(row)
      });
      
      if (response.ok) {
        const result = await response.json();
        const savedRow = result.data || result;
        
        // Update the row with the saved data (including new ID if it was a temp row)
        setWizardRows(prev => prev.map(r => r.id === row.id ? savedRow : r));
        console.log('Auto-save successful:', savedRow);
      } else {
        console.error('Auto-save failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to auto-save row:', error);
    }
  };

  // Save all rows
  const saveAllRows = async (): Promise<void> => {
    console.log('Starting to save all rows...');
    
    // First, save any pending changes from tempData
    if (currentRow && Object.keys(tempData).length > 0) {
      const currentRowData = wizardRows.find(r => r.id === currentRow);
      if (currentRowData) {
        // Apply tempData changes to the current row
        const updatedRow = { ...currentRowData };
        Object.keys(tempData).forEach(key => {
          setFieldValue(updatedRow, key, tempData[key]);
        });
        setWizardRows(prev => prev.map(r => r.id === currentRow ? updatedRow : r));
        setTempData({});
      }
    }
    
    const rowsToSave = wizardRows.filter(row => {
      // Save rows that are new OR have been modified
      const isNewRow = row.id.startsWith('temp-');
      const isModified = modifiedRowIds.has(row.id);
      const needsSaving = isNewRow || isModified;
      
      console.log(`Row ${row.id}: isNew=${isNewRow}, isModified=${isModified}, needsSaving=${needsSaving}`);
      return needsSaving;
    });
    
    const savePromises = rowsToSave.map(async (row) => {
      const isNewRow = row.id.startsWith('temp-') && !savedRowIds.has(row.id);
      const url = isNewRow ? '/api/cpif' : `/api/cpif/${row.id}`;
      const method = isNewRow ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(row)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to save row ${row.id}:`, {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText,
          url: url,
          method: method
        });
        throw new Error(`Failed to save row ${row.id}: HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      const savedRow = result.data || result;
      
      // Update the row with the saved data
      setWizardRows(prev => prev.map(r => r.id === row.id ? savedRow : r));
      
      // Mark this row as saved
      setSavedRowIds(prev => new Set(prev).add(row.id));
      
      return savedRow;
    });
    
    await Promise.all(savePromises);
    
    // Clear editing state
    setEditingRow(null);
    setEditingField(null);
    setTempData({});
    
    // Clear modified tracking for saved rows
    setModifiedRowIds(new Set());
    
    // Reload to get the latest data
    await loadWizardRows();
  };

  // Save row (for manual save)
  const saveRow = async (row: CPIFDocument): Promise<void> => {
    const isNewRow = row.id.startsWith('temp-') && !savedRowIds.has(row.id);
    const url = isNewRow ? '/api/cpif' : `/api/cpif/${row.id}`;
    const method = isNewRow ? 'POST' : 'PUT';
    
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(row)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    const savedRow = result.data || result;
    
    // Update the row with the saved data
    setWizardRows(prev => prev.map(r => r.id === row.id ? savedRow : r));
    
    // Mark this row as saved
    setSavedRowIds(prev => new Set(prev).add(row.id));
    
    setEditingRow(null);
    setEditingField(null);
    setTempData({});
    
    // Reload to get the latest data
    await loadWizardRows();
  };

  // Delete row
  const deleteRow = async (rowId: string) => {
    if (confirm('Are you sure you want to delete this row?')) {
      try {
        const response = await fetch(`/api/cpif/${rowId}`, { method: 'DELETE' });
        if (response.ok) {
          setWizardRows(prev => prev.filter(r => r.id !== rowId));
          if (editingRow === rowId) {
            setEditingRow(null);
            setEditingField(null);
            setTempData({});
          }
        }
      } catch (error) {
        console.error('Failed to delete row:', error);
      }
    }
  };

  // Get field value
  const getFieldValue = (row: CPIFDocument, fieldPath: string): any => {
    if (!row) return '';
    
    const parts = fieldPath.split('.');
    let value: any = row;
    
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return '';
      }
    }
    
    const result = value || '';
    return result;
  };

  // Set field value
  const setFieldValue = (row: CPIFDocument, fieldPath: string, value: any): CPIFDocument => {
    // Deep clone the row to avoid mutating the original
    const newRow = JSON.parse(JSON.stringify(row));
    const parts = fieldPath.split('.');
    let current: any = newRow;
    
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    
    current[parts[parts.length - 1]] = value;
    
    // Mark this row as modified
    setModifiedRowIds(prev => new Set(prev).add(row.id));
    
    return newRow;
  };

  // Format value for display
  const formatValue = (value: any, type: string): string => {
    if (value === null || value === undefined || value === '') return '';
    
    if (type === 'number') {
      return typeof value === 'number' ? value.toString() : '';
    }
    
    if (type === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    if (type === 'employee') {
      return value?.displayName || '';
    }
    
    return value.toString();
  };

  // Render cell
  const renderCell = (row: CPIFDocument, col: any, rowIndex: number) => {
    if (!row || !row.id) return null;
    
    const isEditing = editingRow === row.id && editingField === col.key;
    const value = getFieldValue(row, col.key);
    const displayValue = formatValue(value, col.type);
    const colIndex = columnConfig.findIndex(c => c.key === col.key);
    
    if (isEditing) {
      if (col.type === 'select' && col.options) {
        return (
          <select
            value={tempData[col.key] || value || ''}
            onChange={(e) => setTempData(prev => ({ ...prev, [col.key]: e.target.value }))}
            onBlur={() => {
              const newValue = tempData[col.key] !== undefined ? tempData[col.key] : value;
              const updatedRow = setFieldValue(row, col.key, newValue);
              setWizardRows(prev => prev.map(r => r.id === row.id ? updatedRow : r));
              setEditingField(null);
              setTempData({});
            }}
            onKeyDown={(e) => handleKeyDown(e, row.id, colIndex)}
            className="w-full p-1 border border-gray-300 rounded text-xs"
            autoFocus
          >
            <option value="">Select...</option>
            {col.options.map((option: string) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      } else if (col.type === 'employee') {
        return (
          <select
            value={tempData[col.key]?.id || value?.id || ''}
            onChange={(e) => {
              const selectedEmployee = employees.find(emp => emp.id === e.target.value);
              setTempData(prev => ({ ...prev, [col.key]: selectedEmployee }));
            }}
            onBlur={() => {
              const newValue = tempData[col.key] !== undefined ? tempData[col.key] : value;
              const updatedRow = setFieldValue(row, col.key, newValue);
              setWizardRows(prev => prev.map(r => r.id === row.id ? updatedRow : r));
              setEditingField(null);
              setTempData({});
            }}
            onKeyDown={(e) => handleKeyDown(e, row.id, colIndex)}
            className="w-full p-1 border border-gray-300 rounded text-xs"
            autoFocus
          >
            <option value="">Select...</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.displayName}</option>
            ))}
          </select>
        );
      } else if (col.type === 'number') {
        return (
          <input
            type="number"
            value={tempData[col.key] || value || ''}
            onChange={(e) => setTempData(prev => ({ ...prev, [col.key]: parseFloat(e.target.value) || 0 }))}
            onBlur={() => {
              const newValue = tempData[col.key] !== undefined ? tempData[col.key] : value;
              const updatedRow = setFieldValue(row, col.key, newValue);
              setWizardRows(prev => prev.map(r => r.id === row.id ? updatedRow : r));
              setEditingField(null);
              setTempData({});
            }}
            className="w-full p-1 border border-gray-300 rounded text-xs"
            autoFocus
          />
        );
      } else if (col.type === 'boolean') {
        return (
          <select
            value={tempData[col.key] !== undefined ? tempData[col.key] : value}
            onChange={(e) => setTempData(prev => ({ ...prev, [col.key]: e.target.value === 'true' }))}
            onBlur={() => {
              const newValue = tempData[col.key] !== undefined ? tempData[col.key] : value;
              const updatedRow = setFieldValue(row, col.key, newValue);
              setWizardRows(prev => prev.map(r => r.id === row.id ? updatedRow : r));
              setEditingField(null);
              setTempData({});
            }}
            onKeyDown={(e) => handleKeyDown(e, row.id, colIndex)}
            className="w-full p-1 border border-gray-300 rounded text-xs"
            autoFocus
          >
            <option value="">Select...</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        );
      } else {
        return (
          <input
            type="text"
            value={tempData[col.key] || value || ''}
            onChange={(e) => {
              setTempData(prev => ({ ...prev, [col.key]: e.target.value }));
              // Update local state only
              const newValue = e.target.value;
              const updatedRow = setFieldValue(row, col.key, newValue);
              setWizardRows(prev => prev.map(r => r.id === row.id ? updatedRow : r));
            }}
            onBlur={() => {
              setEditingField(null);
              setTempData({});
            }}
            onKeyDown={(e) => handleKeyDown(e, row.id, colIndex)}
            className="w-full p-1 border border-gray-300 rounded text-xs"
            autoFocus
          />
        );
      }
    }
    
    return (
      <div
        onClick={() => {
          setEditingRow(row.id);
          setEditingField(col.key);
          setTempData({ [col.key]: value || '' });
          setCurrentRow(row.id);
          setCurrentColumn(colIndex);
        }}
        className={`cursor-pointer hover:bg-gray-100 p-1 text-xs min-h-[20px] ${
          currentRow === row.id ? 'text-black' : ''
        }`}
      >
        {displayValue || ''}
      </div>
    );
  };

  // Column configuration based on your images
  const columnConfig = [
    // === EXISTING CRM PIPELINE SECTION (Green) ===
    { key: 'accountInfo.legalName', label: 'Account Name (Entity/Indiv)', width: 200, type: 'text', section: 'crm-pipeline', headerBgColor: 'bg-green-200', cellBgColor: 'bg-green-50', helperText: '' },
    { key: 'accountInfo.primaryContact', label: 'Opportunity Name (Entity/Indiv)', width: 200, type: 'text', section: 'crm-pipeline', headerBgColor: 'bg-green-200', cellBgColor: 'bg-green-50', helperText: '' },
    { key: 'accountInfo.industry', label: 'Industry', width: 150, type: 'select', section: 'crm-pipeline', headerBgColor: 'bg-green-200', cellBgColor: 'bg-green-50', options: ['Agriculture', 'Architecture', 'Arts & Entertainment', 'Automotive', 'Banking & Finance', 'Construction', 'Education', 'Energy', 'Food & Beverage', 'Government', 'Healthcare', 'Hospitality', 'Insurance', 'Legal', 'Manufacturing', 'Media & Communications', 'Non-Profit', 'Real Estate', 'Retail', 'Technology', 'Transportation', 'Other'], helperText: '' },
    { key: 'accountInfo.entityType', label: 'Entity Type', width: 150, type: 'select', section: 'crm-pipeline', headerBgColor: 'bg-green-200', cellBgColor: 'bg-green-50', options: ['C-Corporation', 'S-Corporation', 'Partnership', 'LLC', 'LLP', 'Sole Proprietorship', 'Trust', 'Estate', 'Individual', 'Other'], helperText: '' },
    { key: 'accountInfo.productService', label: 'Product/Service', width: 150, type: 'select', section: 'crm-pipeline', headerBgColor: 'bg-green-200', cellBgColor: 'bg-green-50', options: ['Tax Preparation', 'Tax Planning', 'Bookkeeping', 'Payroll', 'Audit', 'Consulting', 'Other'], helperText: '' },
    { key: 'accountInfo.leadSource', label: 'Lead Source', width: 150, type: 'select', section: 'crm-pipeline', headerBgColor: 'bg-green-200', cellBgColor: 'bg-green-50', options: ['Referral', 'Website', 'Social Media', 'Advertising', 'Cold Call', 'Trade Show', 'Marketing & Sales Campaign', 'Web Origin'], helperText: '' },
    { key: 'accountInfo.opportunityPartner', label: 'Opportunity Partner', width: 200, type: 'employee', section: 'crm-pipeline', headerBgColor: 'bg-green-200', cellBgColor: 'bg-green-50', helperText: '' },
    { key: 'accountInfo.taxDeliveryPartner', label: 'Tax Delivery Partner', width: 200, type: 'employee', section: 'crm-pipeline', headerBgColor: 'bg-green-200', cellBgColor: 'bg-green-50', helperText: '' },
    { key: 'accountInfo.referringEmployee', label: 'Referring Employee', width: 200, type: 'employee', section: 'crm-pipeline', headerBgColor: 'bg-green-200', cellBgColor: 'bg-green-50', helperText: '' },

    // === WORKDAY PROJECT & CONTRACT SECTION (Blue) ===
    { key: 'workdayInfo.needProjectInWorkday', label: 'Need a Project in Workday to charge time?', width: 250, type: 'boolean', section: 'workday', headerBgColor: 'bg-blue-200', cellBgColor: 'bg-blue-50', helperText: 'if No, STOP HERE; the remaining fields in this file are NOT needed.' },
    { key: 'workdayInfo.customerCollectionsLead', label: 'Customer Collections Lead (CCL)', width: 200, type: 'employee', section: 'workday', headerBgColor: 'bg-blue-200', cellBgColor: 'bg-blue-50', helperText: '' },
    { key: 'workdayInfo.projectDeliveryLead', label: 'Project Delivery Lead', width: 200, type: 'employee', section: 'workday', headerBgColor: 'bg-blue-200', cellBgColor: 'bg-blue-50', helperText: '' },
    { key: 'workdayInfo.projectManager', label: 'Project Manager', width: 200, type: 'employee', section: 'workday', headerBgColor: 'bg-blue-200', cellBgColor: 'bg-blue-50', helperText: '' },
    { key: 'workdayInfo.asstProjectManager', label: 'Asst. Project Manager', width: 200, type: 'employee', section: 'workday', headerBgColor: 'bg-blue-200', cellBgColor: 'bg-blue-50', helperText: '' },
    { key: 'workdayInfo.projectBillingSpecialist', label: 'Project Billing Specialist', width: 200, type: 'employee', section: 'workday', headerBgColor: 'bg-blue-200', cellBgColor: 'bg-blue-50', helperText: '' },
    { key: 'workdayInfo.serviceCode', label: 'Service Code', width: 150, type: 'text', section: 'workday', headerBgColor: 'bg-blue-200', cellBgColor: 'bg-blue-50', helperText: 'What type of work is being done?' },
    { key: 'workdayInfo.taxYearEnd', label: 'Tax Year End', width: 150, type: 'text', section: 'workday', headerBgColor: 'bg-blue-200', cellBgColor: 'bg-blue-50', helperText: '(mm/yy)' },
    { key: 'workdayInfo.renewableProject', label: 'Renewable Project?', width: 150, type: 'boolean', section: 'workday', headerBgColor: 'bg-blue-200', cellBgColor: 'bg-blue-50', helperText: 'Should the project renew/roll forward for next year?' },
    { key: 'workdayInfo.projectStartDate', label: 'Project Start Date', width: 150, type: 'text', section: 'workday', headerBgColor: 'bg-blue-200', cellBgColor: 'bg-blue-50', helperText: 'Anticipated start date of the project. This will drive the start date for the Revenue Forecast. (mm/dd/yyyy)' },
    { key: 'workdayInfo.projectEndDate', label: 'Project End Date', width: 150, type: 'text', section: 'workday', headerBgColor: 'bg-blue-200', cellBgColor: 'bg-blue-50', helperText: 'If blank, end date will default to year end of the project +1 year (ex: YE 12/31/2023 = Project End 12/31/2024.) This is the last date to charge time to the project. If different date needed, enter correct end date. (mm/dd/yyyy)' },
    { key: 'workdayInfo.taxForm', label: 'Tax Form', width: 150, type: 'text', section: 'workday', headerBgColor: 'bg-blue-200', cellBgColor: 'bg-blue-50', helperText: 'Use N/A if not a tax return projects' },
    { key: 'workdayInfo.nextDueDate', label: 'Next Due Date', width: 150, type: 'text', section: 'workday', headerBgColor: 'bg-blue-200', cellBgColor: 'bg-blue-50', helperText: '(mm/dd/yyyy)' },
    { key: 'workdayInfo.dateOfDeath', label: 'Date of Death', width: 150, type: 'text', section: 'workday', headerBgColor: 'bg-blue-200', cellBgColor: 'bg-blue-50', helperText: 'Form 706 only (mm/dd/yyyy)' },
    { key: 'workdayInfo.contractType', label: 'Contract Type', width: 150, type: 'text', section: 'workday', headerBgColor: 'bg-blue-200', cellBgColor: 'bg-blue-50', helperText: '(drop down list)' },
    { key: 'workdayInfo.totalEstimatedHours', label: 'Total Estimated Hours', width: 150, type: 'number', section: 'workday', headerBgColor: 'bg-blue-200', cellBgColor: 'bg-blue-50', helperText: 'Total estimated hours to deliver on the project' },
    { key: 'workdayInfo.estimatedRealizationYear1', label: 'Estimated Realization Year 1', width: 200, type: 'text', section: 'workday', headerBgColor: 'bg-blue-200', cellBgColor: 'bg-blue-50', helperText: 'Choose the closest expected realization value as a percentage' },
    { key: 'workdayInfo.contractRateSheet', label: 'Contract Rate Sheet', width: 150, type: 'text', section: 'workday', headerBgColor: 'bg-blue-200', cellBgColor: 'bg-blue-50', helperText: 'National rate is default unless alternate selected' },
    { key: 'workdayInfo.totalContractAmount', label: 'Total Contract Amount', width: 150, type: 'number', section: 'workday', headerBgColor: 'bg-blue-200', cellBgColor: 'bg-blue-50', helperText: 'The professional fees anticipated over the course of the engagement/project' },
    { key: 'workdayInfo.adminFeePercent', label: 'Admin Fee %', width: 120, type: 'text', section: 'workday', headerBgColor: 'bg-blue-200', cellBgColor: 'bg-blue-50', helperText: 'If less than 5%, must be approved in writing by John Kogan' },
    { key: 'workdayInfo.adminFeeIncludedExcluded', label: 'Admin Fee Included/Excluded', width: 200, type: 'select', section: 'workday', headerBgColor: 'bg-blue-200', cellBgColor: 'bg-blue-50', options: ['Included', 'Excluded'], helperText: 'For EL and billing, is the admin fee included or excluded from the total contract amount?' },
    { key: 'workdayInfo.onboardingFeePercent', label: 'Onboarding Fee %', width: 150, type: 'text', section: 'workday', headerBgColor: 'bg-blue-200', cellBgColor: 'bg-blue-50', helperText: 'Use 5% of Total Contract Amount if we are receiving locator from prior accountant, 10% if we are not receiving locator. The onboarding fee is mandatory. PGL approval required if PDL wants to exclude.' },
    { key: 'workdayInfo.onboardingFeeAmount', label: 'Onboarding Fee Amount', width: 150, type: 'number', section: 'workday', headerBgColor: 'bg-blue-200', cellBgColor: 'bg-blue-50', helperText: '' },
    { key: 'workdayInfo.suggestedWorkdayParentName', label: 'Suggested Workday Parent Name', width: 200, type: 'text', section: 'workday', headerBgColor: 'bg-blue-200', cellBgColor: 'bg-blue-50', helperText: '"Parent" group name should not be legal entity name' },

    // === TAX ADMIN SECTION (Green) ===
    { key: 'taxAdmin.elSigned', label: 'EL Signed?', width: 150, type: 'boolean', section: 'tax-admin', headerBgColor: 'bg-green-200', cellBgColor: 'bg-green-50', helperText: '(drop down list)' },
    { key: 'taxAdmin.authorized7216', label: '7216 Authorized?', width: 150, type: 'boolean', section: 'tax-admin', headerBgColor: 'bg-green-200', cellBgColor: 'bg-green-50', helperText: '(drop down list)' },

    // === PE/TMS SECTION (Purple) ===
    { key: 'peTms.connectedToPEOrTMS', label: 'Connected to Private Equity (PE) or Tax Managed Services (TMS)?', width: 300, type: 'text', section: 'pe-tms', headerBgColor: 'bg-purple-200', cellBgColor: 'bg-purple-50', helperText: '(drop down list)' },
    { key: 'peTms.nameOfRelatedPEFundTMSCustomer', label: 'Name of related PE Fund/TMS Customer', width: 250, type: 'text', section: 'pe-tms', headerBgColor: 'bg-purple-200', cellBgColor: 'bg-purple-50', helperText: '' },

    // === INVOICE SECTION (Yellow) ===
    { key: 'invoice.invoiceType', label: 'Invoice Type', width: 150, type: 'text', section: 'invoice', headerBgColor: 'bg-yellow-200', cellBgColor: 'bg-yellow-50', helperText: '(drop down list)' },
    { key: 'invoice.consolidatedBillingCustomerName', label: 'Consolidated Billing Only Name of Bill-To Customer', width: 250, type: 'text', section: 'invoice', headerBgColor: 'bg-yellow-200', cellBgColor: 'bg-yellow-50', helperText: 'Used for adding customers to existing parent group' },
    { key: 'invoice.consolidatedBillingExistingSchedule', label: 'Consolidated Billing Only Name of Existing Bill Schedule', width: 250, type: 'text', section: 'invoice', headerBgColor: 'bg-yellow-200', cellBgColor: 'bg-yellow-50', helperText: '' },
    { key: 'invoice.additionalCustomerContacts', label: 'Add\'l Customer Contact(s)', width: 200, type: 'text', section: 'invoice', headerBgColor: 'bg-yellow-200', cellBgColor: 'bg-yellow-50', helperText: '' },
    { key: 'invoice.additionalCustomerContactEmails', label: 'Add\'l Customer Contact Email Address(es)', width: 200, type: 'text', section: 'invoice', headerBgColor: 'bg-yellow-200', cellBgColor: 'bg-yellow-50', helperText: '' },
    { key: 'invoice.invoiceRecipientNames', label: 'Invoice Recipient Name(s) First & Last', width: 200, type: 'text', section: 'invoice', headerBgColor: 'bg-yellow-200', cellBgColor: 'bg-yellow-50', helperText: 'A/P, Owner, Spouse, CFO/Controller (list all)' },
    { key: 'invoice.invoiceRecipientEmails', label: 'Invoice Recipient Email Address(es)', width: 200, type: 'text', section: 'invoice', headerBgColor: 'bg-yellow-200', cellBgColor: 'bg-yellow-50', helperText: 'Alt+Enter to add multiple rows in cell' },

    // === ENGAGEMENT SECTION (Orange) ===
    { key: 'engagement.partnerSigningEL', label: 'Partner signing EL', width: 200, type: 'text', section: 'engagement', headerBgColor: 'bg-orange-200', cellBgColor: 'bg-orange-50', helperText: '' },
    { key: 'engagement.consultingServicesDescription', label: 'If Consulting, description of Consulting Services', width: 250, type: 'text', section: 'engagement', headerBgColor: 'bg-orange-200', cellBgColor: 'bg-orange-50', helperText: '* OPTIONAL * (drop down list)' },

    // === PETE KLINGER SECTION (Gray) ===
    { key: 'peteKlinger.documentDelivery', label: 'Document Delivery', width: 200, type: 'text', section: 'pete-klinger', headerBgColor: 'bg-gray-200', cellBgColor: 'bg-gray-50', helperText: '(drop down list)' },
    { key: 'peteKlinger.invoiceMemo', label: 'Invoice Memo', width: 200, type: 'text', section: 'pete-klinger', headerBgColor: 'bg-gray-200', cellBgColor: 'bg-gray-50', helperText: '(drop down list)' },
    { key: 'peteKlinger.billToContact', label: 'Bill-To Contact', width: 200, type: 'text', section: 'pete-klinger', headerBgColor: 'bg-gray-200', cellBgColor: 'bg-gray-50', helperText: '(drop down list)' },

    // === REVENUE FORECAST SECTION (Red) ===
    { key: 'revenueForecast.October2025', label: 'Oct-2025', width: 120, type: 'number', section: 'revenue-forecast', headerBgColor: 'bg-red-200', cellBgColor: 'bg-red-50', helperText: '' },
    { key: 'revenueForecast.November2025', label: 'Nov-2025', width: 120, type: 'number', section: 'revenue-forecast', headerBgColor: 'bg-red-200', cellBgColor: 'bg-red-50', helperText: '' },
    { key: 'revenueForecast.December2025', label: 'Dec-2025', width: 120, type: 'number', section: 'revenue-forecast', headerBgColor: 'bg-red-200', cellBgColor: 'bg-red-50', helperText: '' },
    { key: 'revenueForecast.January2026', label: 'Jan-2026', width: 120, type: 'number', section: 'revenue-forecast', headerBgColor: 'bg-red-200', cellBgColor: 'bg-red-50', helperText: '' },
    { key: 'revenueForecast.February2026', label: 'Feb-2026', width: 120, type: 'number', section: 'revenue-forecast', headerBgColor: 'bg-red-200', cellBgColor: 'bg-red-50', helperText: '' },
    { key: 'revenueForecast.March2026', label: 'Mar-2026', width: 120, type: 'number', section: 'revenue-forecast', headerBgColor: 'bg-red-200', cellBgColor: 'bg-red-50', helperText: '' },
    { key: 'revenueForecast.April2026', label: 'Apr-2026', width: 120, type: 'number', section: 'revenue-forecast', headerBgColor: 'bg-red-200', cellBgColor: 'bg-red-50', helperText: '' },
    { key: 'revenueForecast.May2026', label: 'May-2026', width: 120, type: 'number', section: 'revenue-forecast', headerBgColor: 'bg-red-200', cellBgColor: 'bg-red-50', helperText: '' },
    { key: 'revenueForecast.June2026', label: 'Jun-2026', width: 120, type: 'number', section: 'revenue-forecast', headerBgColor: 'bg-red-200', cellBgColor: 'bg-red-50', helperText: '' },
    { key: 'revenueForecast.July2026', label: 'Jul-2026', width: 120, type: 'number', section: 'revenue-forecast', headerBgColor: 'bg-red-200', cellBgColor: 'bg-red-50', helperText: '' },
    { key: 'revenueForecast.August2026', label: 'Aug-2026', width: 120, type: 'number', section: 'revenue-forecast', headerBgColor: 'bg-red-200', cellBgColor: 'bg-red-50', helperText: '' },
    { key: 'revenueForecast.September2026', label: 'Sep-2026', width: 120, type: 'number', section: 'revenue-forecast', headerBgColor: 'bg-red-200', cellBgColor: 'bg-red-50', helperText: '' },
    { key: 'revenueForecast.balance', label: 'Balance', width: 120, type: 'number', section: 'revenue-forecast', headerBgColor: 'bg-red-200', cellBgColor: 'bg-red-50', helperText: '' },

    // === ONBOARDING SECTION (Blue) ===
    { key: 'onboarding.accountGUID', label: 'Account GUID', width: 200, type: 'text', section: 'onboarding', headerBgColor: 'bg-blue-200', cellBgColor: 'bg-blue-50', helperText: '' },
    { key: 'onboarding.opportunityGUID', label: 'Opportunity GUID', width: 200, type: 'text', section: 'onboarding', headerBgColor: 'bg-blue-200', cellBgColor: 'bg-blue-50', helperText: '' },
    { key: 'onboarding.opportunityName', label: 'Opportunity Name', width: 200, type: 'text', section: 'onboarding', headerBgColor: 'bg-blue-200', cellBgColor: 'bg-blue-50', helperText: '' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading Excel Grid View...</div>
      </div>
    );
  }

  return (
    <div className="p-4" style={{ backgroundColor: 'white' }}>

      {/* Toolbar */}
      <div className="mb-4 flex gap-2 items-center">
        <button
          onClick={createNewRow}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          ➕ Create New
        </button>
        <button
          onClick={async () => {
            setSaving(true);
            console.log('Saving all rows...');
            try {
              await saveAllRows();
              console.log('All rows saved successfully!');
              alert('All rows saved successfully!');
            } catch (error) {
              console.error('Failed to save rows:', error);
              alert('Failed to save rows. Check console for details.');
            } finally {
              setSaving(false);
            }
          }}
          disabled={saving}
          className={`px-4 py-2 text-white rounded flex items-center gap-2 ${
            saving 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            '💾 Save'
          )}
        </button>
        {currentRow && (
          <button
            onClick={() => deleteRow(currentRow)}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            🗑️ Delete Row
          </button>
        )}
        <button
          onClick={() => setShowHelperText(!showHelperText)}
          className={`px-4 py-2 rounded hover:opacity-80 ${
            showHelperText 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-300 text-gray-700'
          }`}
        >
          {showHelperText ? '📝 Hide Helper Text' : '📝 Show Helper Text'}
        </button>
        
        {/* Instructions Tooltip */}
        <div className="relative group">
          <button className="px-3 py-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 text-sm">
            ❓ Instructions
          </button>
          <div className="absolute left-0 top-full mt-2 w-80 bg-white border border-gray-300 rounded-lg shadow-lg p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <h4 className="font-semibold text-gray-800 mb-2">Excel Grid View Instructions</h4>
             <ul className="text-sm text-gray-700 space-y-1">
               <li>• Click on any cell to edit it inline</li>
               <li>• Use the "Create New" button to add a new row</li>
               <li>• Use the "Save Row" button to save changes to the database</li>
               <li>• Use the "Delete Row" button to delete the selected row</li>
               <li>• <strong>Tab/Shift+Tab:</strong> Navigate between columns</li>
               <li>• <strong>Enter:</strong> Move to next row, same column</li>
               <li>• <strong>Escape:</strong> Exit editing mode</li>
               <li>• Click "Save Row" to persist your changes to the database</li>
               <li>• Scroll horizontally and vertically to see all columns and rows</li>
             </ul>
          </div>
        </div>
      </div>

      {/* Excel Grid */}
      <div className="overflow-auto border border-gray-300" style={{ maxHeight: '70vh' }}>
        {/* Section Headers */}
        <div className="flex border-b-2 border-gray-300 sticky top-0 z-10">
          {/* CRM Pipeline Section */}
          <div className="bg-green-200 border-r border-gray-300 flex items-center justify-center text-xs font-bold text-red-700 py-2 px-2" style={{ width: 500, minWidth: 500 }}>
            EXISTING CRM PIPELINE
          </div>
          {/* Workday Section */}
          <div className="bg-blue-200 border-r border-gray-300 flex items-center justify-center text-xs font-bold text-red-700 py-2 px-2" style={{ width: 500, minWidth: 500 }}>
            WORKDAY PROJECT & CONTRACT (TIME ENTRY & PRICING)
          </div>
          {/* Tax Admin Section */}
          <div className="bg-green-200 border-r border-gray-300 flex items-center justify-center text-xs font-bold text-red-700 py-2 px-2" style={{ width: 300, minWidth: 300 }}>
            FOR TAX ADMIN ONLY
          </div>
          {/* PE/TMS Section */}
          <div className="bg-purple-200 border-r border-gray-300 flex items-center justify-center text-xs font-bold text-red-700 py-2 px-2" style={{ width: 450, minWidth: 450 }}>
            FOR PE & TMS ONLY
          </div>
          {/* Invoice Section */}
          <div className="bg-yellow-200 border-r border-gray-300 flex items-center justify-center text-xs font-bold text-red-700 py-2 px-2" style={{ width: 400, minWidth: 400 }}>
            INVOICE STYLE & DELIVERY
          </div>
          {/* Engagement Section */}
          <div className="bg-orange-200 border-r border-gray-300 flex items-center justify-center text-xs font-bold text-red-700 py-2 px-2" style={{ width: 450, minWidth: 450 }}>
            ENGAGEMENT LETTER
          </div>
          {/* Pete Klinger Section */}
          <div className="bg-gray-200 border-r border-gray-300 flex items-center justify-center text-xs font-bold text-red-700 py-2 px-2" style={{ width: 400, minWidth: 400 }}>
            FOR PETE KLINGER ONLY
          </div>
          {/* Revenue Forecast Section */}
          <div className="bg-red-200 border-r border-gray-300 flex items-center justify-center text-xs font-bold text-red-700 py-2 px-2" style={{ width: 600, minWidth: 600 }}>
            REVENUE FORECAST BY MONTH
          </div>
          {/* Onboarding Section */}
          <div className="bg-blue-200 flex items-center justify-center text-xs font-bold text-red-700 py-2 px-2" style={{ width: 400, minWidth: 400 }}>
            FOR ONBOARDING ONLY
          </div>
        </div>

        {/* Column Headers */}
        <div className="flex border-b border-gray-300 sticky top-8 z-10">
          {columnConfig.map((col, index) => (
            <div
              key={index}
              className={`${col.headerBgColor} border-r border-gray-300 px-2 py-2 text-xs font-medium text-gray-800 flex-shrink-0`}
              style={{ width: col.width }}
            >
              {col.label}
            </div>
          ))}
        </div>

        {/* Helper Text Row */}
        {showHelperText && (
          <div className="flex border-b-2 border-gray-400 sticky top-16 z-10">
            {columnConfig.map((col, index) => (
              <div
                key={`helper-${index}`}
                className={`${col.headerBgColor} border-r border-gray-300 border-b-2 border-gray-400 px-2 py-2 text-xs text-gray-600 flex-shrink-0 min-h-[32px] flex items-center`}
                style={{ width: col.width }}
              >
                {col.helperText}
              </div>
            ))}
          </div>
        )}

        {/* Data Rows */}
        {wizardRows.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            No wizard rows found. Click "Create New" to get started.
          </div>
        ) : (
          wizardRows.map((row, rowIndex) => (
            <div
              key={`row-${row.id}-${rowIndex}`}
              className={`relative flex border-b border-gray-200 hover:bg-gray-50 ${
                currentRow === row.id 
                  ? 'bg-blue-200 border-blue-400 shadow-sm text-black' 
                  : rowIndex % 2 === 0 
                    ? 'bg-white' 
                    : 'bg-gray-50'
              }`}
              onMouseEnter={() => setHoveredRow(row.id)}
              onMouseLeave={() => setHoveredRow(null)}
              onClick={() => {
                setCurrentRow(row.id);
                setCurrentColumn(0);
              }}
            >

              {/* Data Columns */}
              {columnConfig.map((col, colIndex) => (
           <div
             key={colIndex}
             className={`${col.cellBgColor} border-r border-gray-300 px-2 py-2 text-sm flex-shrink-0 ${
               currentRow === row.id ? 'text-black' : ''
             }`}
             style={{ width: col.width }}
           >
                  {renderCell(row, col, rowIndex)}
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ExcelGridView;

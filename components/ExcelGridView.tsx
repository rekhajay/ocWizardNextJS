import React, { useState, useEffect } from 'react';
import { CPIFDocument, Employee, ColumnConfig, SectionConfig } from '../lib/types/cpif';
import * as XLSX from 'xlsx';

interface ExcelGridViewProps {
  ocId: string;
  dataType?: 'cpif' | 'employee'; // Add data type prop
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
  const [hoveredInsertionPoint, setHoveredInsertionPoint] = useState<number | null>(null);
  
  // Excel import states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importedData, setImportedData] = useState<CPIFDocument[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);

  // Load wizard rows
  const loadWizardRows = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/cpif');
      if (response.ok) {
        const result = await response.json();
        const allRows: CPIFDocument[] = result.data || [];
        
        // Filter rows by the ocId and sort by displayOrder (preserves custom order)
        const filteredRows = ocId ? allRows.filter(row => row.ocId === ocId) : allRows;
        const sortedRows = filteredRows.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        setWizardRows(sortedRows);
        
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
      displayOrder: wizardRows.length > 0 ? Math.max(...wizardRows.map(r => r.displayOrder || 0)) + 1 : 1,
      // All other fields will be undefined/null by default
    };
    
    setWizardRows(prev => [...prev, newRow]);
    setEditingRow(newRow.id);
    setEditingField(columnConfig[0].key);
    setCurrentRow(newRow.id);
    setCurrentColumn(0);
  };

  // Duplicate selected row
  const duplicateRow = () => {
    if (!currentRow) {
      alert('Please select a row to duplicate');
      return;
    }

    const selectedRow = wizardRows.find(row => row.id === currentRow);
    if (!selectedRow) {
      alert('Selected row not found');
      return;
    }

    // Create a new row with the same data but new ID and timestamp
    const duplicatedRow: CPIFDocument = {
      ...selectedRow,
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      version: 1,
      status: 'Draft',
      displayOrder: selectedRow.displayOrder + 0.5 // Insert after selected row
    };
    
    setWizardRows(prev => [...prev, duplicatedRow]);
    setEditingRow(duplicatedRow.id);
    setEditingField(columnConfig[0].key);
    setCurrentRow(duplicatedRow.id);
    setCurrentColumn(0);
  };

  // Insert new row at specific position
  const insertRowAtPosition = (insertionIndex: number) => {
    const newRow: CPIFDocument = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      createdBy: 'Current User',
      wizardType: 'New Container',
      ocId: ocId,
      status: 'Draft',
      lastModified: new Date().toISOString(),
      version: 1,
      displayOrder: insertionIndex === 0 
        ? (wizardRows[0]?.displayOrder || 1) - 0.5  // Insert before first row
        : insertionIndex >= wizardRows.length
          ? (wizardRows[wizardRows.length - 1]?.displayOrder || wizardRows.length) + 0.5  // Insert after last row
          : (wizardRows[insertionIndex - 1]?.displayOrder || insertionIndex) + 0.5,  // Insert between rows
      // All other fields will be undefined/null by default
    };
    
    // Insert the new row at the specified position
    setWizardRows(prev => {
      const newArray = [...prev];
      newArray.splice(insertionIndex, 0, newRow);
      return newArray;
    });
    setEditingRow(newRow.id);
    setEditingField(columnConfig[0].key);
    setCurrentRow(newRow.id);
    setCurrentColumn(0);
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
    
    console.log(`Found ${rowsToSave.length} rows to save`);
    
    // Save rows sequentially to avoid connection pool issues
    const savedRows: any[] = [];
    const failedRows: { row: any; error: string }[] = [];
    
    for (let i = 0; i < rowsToSave.length; i++) {
      const row = rowsToSave[i];
      try {
        console.log(`Saving row ${i + 1}/${rowsToSave.length}: ${row.id}`);
        
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
        
        savedRows.push(savedRow);
        console.log(`Successfully saved row ${row.id}`);
        
        // Add a small delay between saves to prevent overwhelming the database
        if (i < rowsToSave.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (error: any) {
        console.error(`Failed to save row ${row.id}:`, error);
        failedRows.push({ row, error: error.message });
      }
    }
    
    // Report results
    if (failedRows.length > 0) {
      console.error(`Failed to save ${failedRows.length} rows:`, failedRows);
      throw new Error(`Failed to save ${failedRows.length} rows. Check console for details.`);
    }
    
    console.log(`Successfully saved ${savedRows.length} rows`);
    
    // Clear editing state
    setEditingRow(null);
    setEditingField(null);
    setTempData({});
    
    // Clear modified tracking for saved rows
    setModifiedRowIds(new Set());
    
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
    
    const value = (row as any)[fieldPath];
    return value || '';
  };

  // Set field value
  const setFieldValue = (row: CPIFDocument, fieldPath: string, value: any): CPIFDocument => {
    // Deep clone the row to avoid mutating the original
    const newRow = JSON.parse(JSON.stringify(row));
    (newRow as any)[fieldPath] = value;
    
    // Mark this row as modified
    setModifiedRowIds(prev => new Set(prev).add(row.id));
    
    return newRow;
  };

  // Format value for display
  const formatValue = (value: any, type: string): string => {
    if (value === null || value === undefined || value === '') return '';
    
    if (type === 'number' || type === 'currency') {
      return typeof value === 'number' ? value.toString() : '';
    }
    
    if (type === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    if (type === 'date') {
      return value ? new Date(value).toLocaleDateString() : '';
    }
    
    return value.toString();
  };

  // Render cell
  const renderCell = (row: CPIFDocument, col: ColumnConfig, rowIndex: number) => {
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
      } else if (col.type === 'number' || col.type === 'currency') {
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
      } else if (col.type === 'date') {
        return (
          <input
            type="date"
            value={tempData[col.key] || value || ''}
            onChange={(e) => setTempData(prev => ({ ...prev, [col.key]: e.target.value }))}
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

  // Column configuration for all 9 sections
  const columnConfig: ColumnConfig[] = [
    // Section 1: Create CRM Pipeline Account and Opportunity &/Or Workday Customer
    { key: 'newAccountLegalName', label: 'New Account Legal Name (Entity/Indiv)', width: 250, type: 'text', section: 'crm-pipeline', headerBgColor: 'bg-green-200', cellBgColor: 'bg-green-50', helperText: '' },
    { key: 'primaryContactName', label: 'Primary Contact Name', width: 200, type: 'text', section: 'crm-pipeline', headerBgColor: 'bg-green-200', cellBgColor: 'bg-green-50', helperText: '' },
    { key: 'primaryContactTitle', label: 'Primary Contact Title', width: 150, type: 'text', section: 'crm-pipeline', headerBgColor: 'bg-green-200', cellBgColor: 'bg-green-50', helperText: '' },
    { key: 'primaryContactEmailAddress', label: 'Primary Contact Email Address', width: 200, type: 'email', section: 'crm-pipeline', headerBgColor: 'bg-green-200', cellBgColor: 'bg-green-50', helperText: '' },
    { key: 'industry', label: 'Industry', width: 150, type: 'select', section: 'crm-pipeline', headerBgColor: 'bg-green-200', cellBgColor: 'bg-green-50', options: ['Agriculture', 'Architecture', 'Arts & Entertainment', 'Automotive', 'Banking & Finance', 'Construction', 'Education', 'Energy', 'Food & Beverage', 'Government', 'Healthcare', 'Hospitality', 'Insurance', 'Legal', 'Manufacturing', 'Media & Communications', 'Non-Profit', 'Real Estate', 'Retail', 'Technology', 'Transportation', 'Other'], helperText: '(drop down list)' },
    { key: 'entityType', label: 'Entity Type', width: 150, type: 'select', section: 'crm-pipeline', headerBgColor: 'bg-green-200', cellBgColor: 'bg-green-50', options: ['C-Corporation', 'S-Corporation', 'Partnership', 'LLC', 'LLP', 'Sole Proprietorship', 'Trust', 'Estate', 'Individual', 'Other'], helperText: '(drop down list)' },
    { key: 'address', label: 'Address', width: 250, type: 'text', section: 'crm-pipeline', headerBgColor: 'bg-green-200', cellBgColor: 'bg-green-50', helperText: '' },
    { key: 'city', label: 'City', width: 120, type: 'text', section: 'crm-pipeline', headerBgColor: 'bg-green-200', cellBgColor: 'bg-green-50', helperText: '' },
    { key: 'state', label: 'State', width: 80, type: 'text', section: 'crm-pipeline', headerBgColor: 'bg-green-200', cellBgColor: 'bg-green-50', helperText: '' },
    { key: 'zipCode', label: 'Zip Code', width: 100, type: 'text', section: 'crm-pipeline', headerBgColor: 'bg-green-200', cellBgColor: 'bg-green-50', helperText: '' },
    { key: 'productService', label: 'Product/Service', width: 150, type: 'select', section: 'crm-pipeline', headerBgColor: 'bg-green-200', cellBgColor: 'bg-green-50', options: ['Tax Preparation', 'Tax Planning', 'Bookkeeping', 'Payroll', 'Audit', 'Consulting', 'Other'], helperText: '(drop down list) PDL\'s Practice Group' },
    { key: 'estOpptyValue', label: 'Est. Oppty Value', width: 120, type: 'currency', section: 'crm-pipeline', headerBgColor: 'bg-green-200', cellBgColor: 'bg-green-50', helperText: '' },
    { key: 'opportunityPartner', label: 'Opportunity Partner', width: 180, type: 'text', section: 'crm-pipeline', headerBgColor: 'bg-green-200', cellBgColor: 'bg-green-50', helperText: '' },
    { key: 'taxDeliveryPartner', label: 'Tax Delivery Partner', width: 180, type: 'text', section: 'crm-pipeline', headerBgColor: 'bg-green-200', cellBgColor: 'bg-green-50', helperText: 'PDL in Workday' },
    { key: 'bdSalesSupport', label: 'BD/Sales Support', width: 200, type: 'text', section: 'crm-pipeline', headerBgColor: 'bg-green-200', cellBgColor: 'bg-green-50', helperText: '*OPTIONAL* Ex: a technical partner who supported the sales cycle' },
    { key: 'leadSource', label: 'Lead Source', width: 120, type: 'select', section: 'crm-pipeline', headerBgColor: 'bg-green-200', cellBgColor: 'bg-green-50', options: ['Referral', 'Website', 'Social Media', 'Advertising', 'Cold Call', 'Trade Show', 'Marketing & Sales Campaign', 'Web Origin'], helperText: '(drop down list)' },
    { key: 'leadSourceDetails', label: 'Lead Source Details', width: 200, type: 'select', section: 'crm-pipeline', headerBgColor: 'bg-green-200', cellBgColor: 'bg-green-50', options: ['Employee Referral', 'Client Referral', 'Website Form', 'Social Media', 'Cold Call', 'Trade Show', 'Marketing Campaign'], helperText: '(drop down list) Options are dependent on Lead Source' },
    { key: 'lsFreeText', label: 'LS Free Text', width: 150, type: 'text', section: 'crm-pipeline', headerBgColor: 'bg-green-200', cellBgColor: 'bg-green-50', helperText: '*OPTIONAL*' },
    { key: 'referringEmployee', label: 'Referring Employee', width: 200, type: 'text', section: 'crm-pipeline', headerBgColor: 'bg-green-200', cellBgColor: 'bg-green-50', helperText: '*OPTIONAL* Use if Oppty derived from a direct employee referral' },

    // Section 2: Workday Project & Contract (Time Entry & Pricing)
    { key: 'needProjectInWorkday', label: 'Need a Project in Workday to charge time?', width: 150, type: 'boolean', section: 'workday-project-contract', headerBgColor: 'bg-pink-200', cellBgColor: 'bg-pink-50', helperText: '(drop down list) if No, STOP HERE; the remaining fields in this file are NOT needed.' },
    { key: 'customerCollectionsLead', label: 'Customer Collections Lead (CCL)', width: 150, type: 'text', section: 'workday-project-contract', headerBgColor: 'bg-pink-200', cellBgColor: 'bg-pink-50', helperText: '' },
    { key: 'projectDeliveryLead', label: 'Project Delivery Lead', width: 150, type: 'text', section: 'workday-project-contract', headerBgColor: 'bg-pink-200', cellBgColor: 'bg-pink-50', helperText: '' },
    { key: 'projectManager', label: 'Project Manager', width: 100, type: 'text', section: 'workday-project-contract', headerBgColor: 'bg-pink-200', cellBgColor: 'bg-pink-50', helperText: '' },
    { key: 'asstProjectManager', label: 'Asst. Project Manager', width: 100, type: 'text', section: 'workday-project-contract', headerBgColor: 'bg-pink-200', cellBgColor: 'bg-pink-50', helperText: '' },
    { key: 'projectBillingSpecialist', label: 'Project Billing Specialist', width: 100, type: 'text', section: 'workday-project-contract', headerBgColor: 'bg-pink-200', cellBgColor: 'bg-pink-50', helperText: '' },
    { key: 'serviceCode', label: 'Service Code', width: 150, type: 'select', section: 'workday-project-contract', headerBgColor: 'bg-pink-200', cellBgColor: 'bg-pink-50', options: ['Tax Preparation', 'Tax Planning', 'Bookkeeping', 'Payroll', 'Audit', 'Consulting', 'Other'], helperText: '(drop down list) What type of work is being done?' },
    { key: 'taxYearEnd', label: 'Tax Year End', width: 100, type: 'text', section: 'workday-project-contract', headerBgColor: 'bg-pink-200', cellBgColor: 'bg-pink-50', helperText: '(mm/yy)' },
    { key: 'renewableProject', label: 'Renewable Project?', width: 120, type: 'boolean', section: 'workday-project-contract', headerBgColor: 'bg-pink-200', cellBgColor: 'bg-pink-50', helperText: '(drop down list) Should the project renew/roll forward for next year?' },
    { key: 'projectStartDate', label: 'Project Start Date', width: 150, type: 'date', section: 'workday-project-contract', headerBgColor: 'bg-pink-200', cellBgColor: 'bg-pink-50', helperText: 'Anticipated start date of the project. This will drive the start date for the Revenue Forecast. (mm/dd/yyyy)' },
    { key: 'projectEndDate', label: 'Project End Date', width: 150, type: 'date', section: 'workday-project-contract', headerBgColor: 'bg-pink-200', cellBgColor: 'bg-pink-50', helperText: 'If blank, end date will default to year end of the project +1 year (ex: YE 12/31/2023 = Project End 12/31/2024.) This is the last date to charge time to the project. If different date needed, enter correct end date. (mm/dd/yyyy)' },
    { key: 'taxForm', label: 'Tax Form', width: 120, type: 'select', section: 'workday-project-contract', headerBgColor: 'bg-pink-200', cellBgColor: 'bg-pink-50', options: ['1040', '1065', '1120', '1120S', '990', '706', 'N/A'], helperText: '(drop down list) Use N/A if not a tax return projects' },
    { key: 'nextDueDate', label: 'Next Due Date', width: 120, type: 'date', section: 'workday-project-contract', headerBgColor: 'bg-pink-200', cellBgColor: 'bg-pink-50', helperText: '(mm/dd/yyyy)' },
    { key: 'dateOfDeath', label: 'Date of Death', width: 120, type: 'date', section: 'workday-project-contract', headerBgColor: 'bg-pink-200', cellBgColor: 'bg-pink-50', helperText: 'Form 706 only (mm/dd/yyyy)' },
    { key: 'contractType', label: 'Contract Type', width: 120, type: 'select', section: 'workday-project-contract', headerBgColor: 'bg-pink-200', cellBgColor: 'bg-pink-50', options: ['Fixed Fee', 'Hourly', 'Retainer', 'Hybrid'], helperText: '(drop down list)' },
    { key: 'totalEstimatedHours', label: 'Total Estimated Hours', width: 120, type: 'number', section: 'workday-project-contract', headerBgColor: 'bg-pink-200', cellBgColor: 'bg-pink-50', helperText: 'Total estimated hours to deliver on the project' },
    { key: 'estimatedRealizationYear1', label: 'Estimated Realization Year 1', width: 150, type: 'select', section: 'workday-project-contract', headerBgColor: 'bg-pink-200', cellBgColor: 'bg-pink-50', options: ['90%', '80%', '70%', '60%', '50%'], helperText: '(drop down list) Choose the closest expected realization value as a percentage' },
    { key: 'contractRateSheet', label: 'Contract Rate Sheet', width: 150, type: 'select', section: 'workday-project-contract', headerBgColor: 'bg-pink-200', cellBgColor: 'bg-pink-50', options: ['National (default)', 'Regional', 'Local', 'Custom'], helperText: '(drop down list) National rate is default unless alternate selected' },
    { key: 'totalContractAmount', label: 'Total Contract Amount', width: 150, type: 'currency', section: 'workday-project-contract', headerBgColor: 'bg-pink-200', cellBgColor: 'bg-pink-50', helperText: 'The professional fees anticipated over the course of the engagement/project' },
    { key: 'adminFeePercent', label: 'Admin Fee %', width: 120, type: 'number', section: 'workday-project-contract', headerBgColor: 'bg-pink-200', cellBgColor: 'bg-pink-50', helperText: '(drop down list) If less than 5%, must be approved in writing by John Kogan' },
    { key: 'adminFeeIncludedExcluded', label: 'Admin fee included or excluded in Total Contract amount?', width: 150, type: 'select', section: 'workday-project-contract', headerBgColor: 'bg-pink-200', cellBgColor: 'bg-pink-50', options: ['Included', 'Excluded'], helperText: 'For EL and billing, is the admin fee included or excluded from the total contract amount?' },
    { key: 'onboardingFeePercent', label: 'First-year, one-time Onboarding/Setup Fee %', width: 180, type: 'number', section: 'workday-project-contract', headerBgColor: 'bg-pink-200', cellBgColor: 'bg-pink-50', helperText: 'Use 5% of Total Contract Amount if we are receiving locator from prior accountant, 10% if we are not receiving locator. The onboarding fee is mandatory. PGL approval required if PDL wants to exclude.' },
    { key: 'onboardingFeeAmount', label: 'First-year, one-time Onboarding/Setup Fee Amount', width: 180, type: 'currency', section: 'workday-project-contract', headerBgColor: 'bg-pink-200', cellBgColor: 'bg-pink-50', helperText: '' },
    { key: 'suggestedWorkdayParentName', label: 'Suggested or Existing Workday (Parent) Name', width: 200, type: 'text', section: 'workday-project-contract', headerBgColor: 'bg-pink-200', cellBgColor: 'bg-pink-50', helperText: '"Parent" group name should not be legal entity name' },

    // Section 3: FOR TAX ADMIN ONLY
    { key: 'elSigned', label: 'EL Signed?', width: 100, type: 'boolean', section: 'tax-admin-only', headerBgColor: 'bg-green-300', cellBgColor: 'bg-green-100', helperText: '' },
    { key: 'authorized7216', label: '7216 Authorized?', width: 150, type: 'boolean', section: 'tax-admin-only', headerBgColor: 'bg-green-300', cellBgColor: 'bg-green-100', helperText: '' },

    // Section 4: FOR PE & TMS ONLY
    { key: 'connectedToPEOrTMS', label: 'Connected to Private Equity (PE) or Tax Managed Services (TMS)?', width: 250, type: 'select', section: 'pe-tms', headerBgColor: 'bg-purple-200', cellBgColor: 'bg-purple-50', options: ['Yes', 'No'], helperText: '(drop down list)' },
    { key: 'nameOfRelatedPEFundTMSCustomer', label: 'Name of related PE Fund/TMS Customer', width: 250, type: 'text', section: 'pe-tms', headerBgColor: 'bg-purple-200', cellBgColor: 'bg-purple-50', helperText: '' },

    // Section 5: Invoice Style & Delivery
    { key: 'invoiceType', label: 'Invoice Type', width: 150, type: 'select', section: 'invoice-style-delivery', headerBgColor: 'bg-yellow-200', cellBgColor: 'bg-yellow-50', options: ['Individual', 'Consolidated Billing', 'Parent Group'], helperText: '(drop down list)' },
    { key: 'consolidatedBillingCustomerName', label: 'Consolidated Billing Only Name of Bill-To Customer', width: 250, type: 'text', section: 'invoice-style-delivery', headerBgColor: 'bg-yellow-200', cellBgColor: 'bg-yellow-50', helperText: 'Used for adding customers to existing parent group' },
    { key: 'consolidatedBillingExistingSchedule', label: 'Consolidated Billing Only Name of Existing Bill Schedule', width: 250, type: 'text', section: 'invoice-style-delivery', headerBgColor: 'bg-yellow-200', cellBgColor: 'bg-yellow-50', helperText: '' },
    { key: 'additionalCustomerContacts', label: 'Add\'l Customer Contact(s)', width: 200, type: 'text', section: 'invoice-style-delivery', headerBgColor: 'bg-yellow-200', cellBgColor: 'bg-yellow-50', helperText: '* OPTIONAL * First & Last Name' },
    { key: 'additionalCustomerContactEmails', label: 'Add\'l Customer Contact Email Address(es)', width: 250, type: 'email', section: 'invoice-style-delivery', headerBgColor: 'bg-yellow-200', cellBgColor: 'bg-yellow-50', helperText: '* OPTIONAL * If different from Primary Contact; A/P, Owner, Spouse, CFO/Controller (list all)' },
    { key: 'invoiceRecipientNames', label: 'Invoice Recipient Name(s) First & Last', width: 250, type: 'text', section: 'invoice-style-delivery', headerBgColor: 'bg-yellow-200', cellBgColor: 'bg-yellow-50', helperText: '* OPTIONAL * A/P, Owner, Spouse, CFO/Controller (list all)' },
    { key: 'invoiceRecipientEmails', label: 'Invoice Recipient Email Address(es)', width: 250, type: 'email', section: 'invoice-style-delivery', headerBgColor: 'bg-yellow-200', cellBgColor: 'bg-yellow-50', helperText: '* OPTIONAL * If different from Primary Contact; A/P, Owner, Spouse, CFO/Controller (list all)' },

    // Section 6: Engagement Letter
    { key: 'partnerSigningEL', label: 'Partner signing EL', width: 200, type: 'text', section: 'engagement-letter', headerBgColor: 'bg-orange-200', cellBgColor: 'bg-orange-50', helperText: '' },
    { key: 'consultingServicesDescription', label: 'If Consulting, description of Consulting Services', width: 250, type: 'select', section: 'engagement-letter', headerBgColor: 'bg-orange-200', cellBgColor: 'bg-orange-50', options: ['Business Consulting', 'Tax Planning', 'Financial Planning', 'Other'], helperText: '* OPTIONAL * (drop down list)' },

    // Section 7: FOR PETE KLINGER ONLY
    { key: 'documentDelivery', label: 'Document Delivery', width: 150, type: 'select', section: 'pete-klinger', headerBgColor: 'bg-gray-200', cellBgColor: 'bg-gray-50', options: ['Email', 'Mail', 'Portal', 'In Person'], helperText: '(drop down list)' },
    { key: 'invoiceMemo', label: 'Invoice Memo', width: 150, type: 'select', section: 'pete-klinger', headerBgColor: 'bg-gray-200', cellBgColor: 'bg-gray-50', options: ['Standard', 'Custom', 'None'], helperText: '(drop down list)' },
    { key: 'billToContact', label: 'Bill-To Contact', width: 150, type: 'select', section: 'pete-klinger', headerBgColor: 'bg-gray-200', cellBgColor: 'bg-gray-50', options: ['Primary Contact', 'Secondary Contact', 'Custom'], helperText: '(drop down list)' },

    // Section 8: Revenue Forecast By Month
    { key: 'october2025', label: 'Month 1', width: 100, type: 'currency', section: 'revenue-forecast', headerBgColor: 'bg-red-200', cellBgColor: 'bg-red-50', helperText: '' },
    { key: 'november2025', label: 'Month 2', width: 100, type: 'currency', section: 'revenue-forecast', headerBgColor: 'bg-red-200', cellBgColor: 'bg-red-50', helperText: '' },
    { key: 'december2025', label: 'Month 3', width: 100, type: 'currency', section: 'revenue-forecast', headerBgColor: 'bg-red-200', cellBgColor: 'bg-red-50', helperText: '' },
    { key: 'january2026', label: 'Month 4', width: 100, type: 'currency', section: 'revenue-forecast', headerBgColor: 'bg-red-200', cellBgColor: 'bg-red-50', helperText: '' },
    { key: 'february2026', label: 'Month 5', width: 100, type: 'currency', section: 'revenue-forecast', headerBgColor: 'bg-red-200', cellBgColor: 'bg-red-50', helperText: '' },
    { key: 'march2026', label: 'Month 6', width: 100, type: 'currency', section: 'revenue-forecast', headerBgColor: 'bg-red-200', cellBgColor: 'bg-red-50', helperText: '' },
    { key: 'april2026', label: 'Month 7', width: 100, type: 'currency', section: 'revenue-forecast', headerBgColor: 'bg-red-200', cellBgColor: 'bg-red-50', helperText: '' },
    { key: 'may2026', label: 'Month 8', width: 100, type: 'currency', section: 'revenue-forecast', headerBgColor: 'bg-red-200', cellBgColor: 'bg-red-50', helperText: '' },
    { key: 'june2026', label: 'Month 9', width: 100, type: 'currency', section: 'revenue-forecast', headerBgColor: 'bg-red-200', cellBgColor: 'bg-red-50', helperText: '' },
    { key: 'july2026', label: 'Month 10', width: 100, type: 'currency', section: 'revenue-forecast', headerBgColor: 'bg-red-200', cellBgColor: 'bg-red-50', helperText: '' },
    { key: 'august2026', label: 'Month 11', width: 100, type: 'currency', section: 'revenue-forecast', headerBgColor: 'bg-red-200', cellBgColor: 'bg-red-50', helperText: '' },
    { key: 'september2026', label: 'Month 12', width: 100, type: 'currency', section: 'revenue-forecast', headerBgColor: 'bg-red-200', cellBgColor: 'bg-red-50', helperText: '' },
    { key: 'balance', label: 'Balance', width: 100, type: 'currency', section: 'revenue-forecast', headerBgColor: 'bg-red-200', cellBgColor: 'bg-red-50', helperText: '' },

    // Section 9: FOR ONBOARDING ONLY
    { key: 'accountGUID', label: 'Account GUID', width: 180, type: 'text', section: 'onboarding', headerBgColor: 'bg-blue-200', cellBgColor: 'bg-blue-50', helperText: '' },
    { key: 'opportunityGUID', label: 'Opportunity GUID', width: 180, type: 'text', section: 'onboarding', headerBgColor: 'bg-blue-200', cellBgColor: 'bg-blue-50', helperText: '' },
    { key: 'opportunityName', label: 'Opportunity Name', width: 220, type: 'text', section: 'onboarding', headerBgColor: 'bg-blue-200', cellBgColor: 'bg-blue-50', helperText: '' }
  ];

  // Section configuration
  const sectionConfig: SectionConfig[] = [
    { name: 'Create CRM Pipeline Account and Opportunity &/Or Workday Customer (Complete green section only if NOT previously entered in CRM Pipeline)', identifier: 'crm-pipeline', color: 'bg-green-200', columns: columnConfig.filter(col => col.section === 'crm-pipeline') },
    { name: 'Workday Project & Contract (Time Entry & Pricing)', identifier: 'workday-project-contract', color: 'bg-pink-200', columns: columnConfig.filter(col => col.section === 'workday-project-contract') },
    { name: 'FOR TAX ADMIN ONLY', identifier: 'tax-admin-only', color: 'bg-green-300', columns: columnConfig.filter(col => col.section === 'tax-admin-only') },
    { name: 'FOR PE & TMS ONLY', identifier: 'pe-tms', color: 'bg-purple-200', columns: columnConfig.filter(col => col.section === 'pe-tms') },
    { name: 'Invoice Style & Delivery', identifier: 'invoice-style-delivery', color: 'bg-yellow-200', columns: columnConfig.filter(col => col.section === 'invoice-style-delivery') },
    { name: 'Engagement Letter', identifier: 'engagement-letter', color: 'bg-orange-200', columns: columnConfig.filter(col => col.section === 'engagement-letter') },
    { name: 'FOR PETE KLINGER ONLY', identifier: 'pete-klinger', color: 'bg-gray-200', columns: columnConfig.filter(col => col.section === 'pete-klinger') },
    { name: 'Revenue Forecast By Month', identifier: 'revenue-forecast', color: 'bg-red-200', columns: columnConfig.filter(col => col.section === 'revenue-forecast') },
    { name: 'FOR ONBOARDING ONLY', identifier: 'onboarding', color: 'bg-blue-200', columns: columnConfig.filter(col => col.section === 'onboarding') }
  ];

  // Excel import functions
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/vnd.ms-excel.sheet.macroEnabled.12' // .xlsm
    ];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
      setImportErrors(['Invalid file type. Please upload an Excel file (.xlsx or .xls)']);
      setShowImportModal(true);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
        
        // Validate and extract data
        const { extractedData, errors } = extractDataFromExcel(jsonData);
        
        if (errors.length > 0) {
          setImportErrors(errors);
          setShowImportModal(true);
          return;
        }
        
        setImportedData(extractedData);
        setImportErrors([]);
        setShowImportModal(true);
        
      } catch (error) {
        setImportErrors([`Error reading Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`]);
        setShowImportModal(true);
      }
    };
    
    reader.readAsArrayBuffer(file);
  };

  const extractDataFromExcel = (jsonData: any[][]): { extractedData: CPIFDocument[], errors: string[] } => {
    const errors: string[] = [];
    const extractedData: CPIFDocument[] = [];

    if (!jsonData || jsonData.length === 0) {
      errors.push('Excel file is empty.');
      return { extractedData, errors };
    }

    const normalizeHeader = (value: any): string =>
      (value || '')
        .toString()
        .replace(/\u00A0/g, ' ') // non-breaking spaces
        .replace(/\s+/g, ' ') // collapse all whitespace/newlines/tabs
        .trim()
        .toLowerCase();

    const parseCellByType = (raw: any, type: string): any => {
      if (raw === undefined || raw === null || raw === '') return undefined;
      if (type === 'boolean') {
        const v = raw.toString().trim().toLowerCase();
        if (['y', 'yes', 'true', '1', 'x'].includes(v)) return true;
        if (['n', 'no', 'false', '0'].includes(v)) return false;
        return undefined;
      }
      if (type === 'number' || type === 'currency' || type === 'percentage') {
        const numeric = parseFloat(raw.toString().replace(/[$,%\s,]/g, ''));
        return isNaN(numeric) ? undefined : numeric;
      }
      if (type === 'date') {
        if (typeof raw === 'number') {
          const parsed = XLSX.SSF.parse_date_code(raw);
          if (parsed) {
            const jsDate = new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
            return jsDate.toISOString();
          }
        }
        const d = new Date(raw);
        return isNaN(d.getTime()) ? undefined : d.toISOString();
      }
      // For text-like fields (text, email, select), coerce to string to avoid numeric coercion issues (e.g., zip codes)
      return raw.toString();
    };

    const expectedHeaders = columnConfig.map(c => c.label);

    const findHeaderRowIndex = (rows: any[][], expectations: string[]): number => {
      let bestIndex = -1;
      let bestScore = -1;
      const expectationSet = new Set(expectations.map(h => h.trim().toLowerCase()));
      const maxScan = Math.min(rows.length, 30);
      for (let i = 0; i < maxScan; i++) {
        const row = rows[i] || [];
        const normalizedCells = row.map(normalizeHeader);
        const rowSet = new Set(normalizedCells);

        // Skip known helper rows by phrases only; allow "Month X" headers
        const helperPhraseCount = normalizedCells.filter(c => c && (c.includes('drop down list') || c.includes('optional') || c.includes('to add multiple rows'))).length;
        if (helperPhraseCount >= 2) {
          continue;
        }

        let score = 0;
        expectationSet.forEach(h => { if (rowSet.has(h)) score++; });
        if (score > bestScore) { bestScore = score; bestIndex = i; }
      }
      // Fallback to 4th row (0-indexed) so data starts at 5th logical row
      if (bestScore <= 0) return Math.min(3, rows.length - 1);
      return bestIndex;
    };

    const headerRowIndex = findHeaderRowIndex(jsonData, expectedHeaders);
    const columnHeaders = jsonData[headerRowIndex] || [];

    console.log('Detected header row index:', headerRowIndex);
    console.log('Detected headers:', columnHeaders);

    const headerNameToIndex: Record<string, number> = {};
    columnHeaders.forEach((h: any, idx: number) => {
      const key = normalizeHeader(h);
      if (key) headerNameToIndex[key] = idx;
    });

    // Detect month-like header positions (e.g., "Oct-2025", "Nov 2025", or "Month 1") to align with Month N columns
    const monthHeaderIndices: number[] = [];
    const monthHeaderRegex = /^(month\s*\d+)|((jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s-]?\d{4})$/i;
    columnHeaders.forEach((h: any, idx: number) => {
      const norm = normalizeHeader(h);
      if (monthHeaderRegex.test(norm)) {
        monthHeaderIndices.push(idx);
      }
    });

    const dataStartIndex = Math.max(headerRowIndex + 1, 4); // ensure 5th logical row minimum

    for (let i = dataStartIndex; i < jsonData.length; i++) {
      const row = jsonData[i] || [];

      const firstTwoEmpty = (!row[0] || row[0].toString().trim() === '') && (!row[1] || row[1].toString().trim() === '');
      if (firstTwoEmpty) continue;

      const doc: CPIFDocument = {
        id: `temp-import-${Date.now()}-${i}`,
        createdBy: 'import-user',
        wizardType: 'New Client-Entity (Need a CUS#)',
        ocId: ocId || '',
        timestamp: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        version: 1,
        status: 'Draft',
        displayOrder: 0
      } as CPIFDocument;

      for (const col of columnConfig) {
        let idx: number | undefined = undefined;
        if (col.section === 'revenue-forecast') {
          const revenueCols = columnConfig.filter(c => c.section === 'revenue-forecast');
          const ordinal = revenueCols.findIndex(c => c.key === col.key); // Month N -> 0-based position
          if (ordinal >= 0 && ordinal < monthHeaderIndices.length) {
            idx = monthHeaderIndices[ordinal];
          }
        } else {
          const headerKey = normalizeHeader(col.label);
          idx = headerNameToIndex[headerKey];
        }

        if (idx === undefined || idx >= row.length) continue;
        const raw = row[idx];
        const parsed = parseCellByType(raw, col.type);
        if (parsed !== undefined) {
          (doc as any)[col.key] = parsed;
        }
      }

      extractedData.push(doc);
    }

    if (extractedData.length === 0) {
      errors.push('No data rows found after the header row. Ensure your first data row starts on the 5th logical row.');
    }

    return { extractedData, errors };
  };

  const getCellValue = (row: any[], headers: any[], columnName: string): any => {
    // Simple exact column name matching - no fuzzy logic
    const headerIndex = headers.findIndex((header: string) => {
      if (!header) return false;
      const headerStr = header.toString().trim();
      const searchStr = columnName.trim();
      
      // Exact match (case-insensitive)
      return headerStr.toLowerCase() === searchStr.toLowerCase();
    });
    
    if (headerIndex === -1 || headerIndex >= row.length) {
      console.warn(`Column not found: "${columnName}" in headers:`, headers);
      return undefined;
    }
    
    // Debug logging for successful matches
    const matchedHeader = headers[headerIndex];
    console.log(`✅ Matched "${columnName}" to header "${matchedHeader}" (index: ${headerIndex})`);
    
    const value = row[headerIndex];
    if (value === null || value === undefined || value === '') {
      return undefined;
    }
    
    return value;
  };

  const confirmImport = async () => {
    setImporting(true);
    try {
      // Calculate the next display order for imported rows
      const maxDisplayOrder = wizardRows.length > 0 
        ? Math.max(...wizardRows.map(r => r.displayOrder || 0)) 
        : 0;
      
      // Update imported data with proper display orders and mark as new rows
      const updatedImportedData = importedData.map((row, index) => ({
        ...row,
        displayOrder: maxDisplayOrder + index + 1,
        // Ensure these are treated as new rows (temp IDs)
        id: `temp-import-${Date.now()}-${index}`,
        timestamp: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        version: 1,
        status: 'Draft' as const
      }));
      
      // Add imported data to the end of existing wizard rows
      setWizardRows(prev => [...prev, ...updatedImportedData]);
      
      // Mark imported rows as modified so they'll be saved
      const importedRowIds = updatedImportedData.map(row => row.id);
      setModifiedRowIds(prev => new Set([...Array.from(prev), ...importedRowIds]));
      
      // Close modal
      setShowImportModal(false);
      setImportedData([]);
      setImportErrors([]);
      
      // Show success message
      alert(`Successfully imported ${updatedImportedData.length} rows! They will be saved to the database when you click the Save button.`);
      
    } catch (error) {
      console.error('Error importing data:', error);
      alert('Error importing data. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  const cancelImport = () => {
    setShowImportModal(false);
    setImportedData([]);
    setImportErrors([]);
  };

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
        {/* Debug indicator */}
        {currentRow && (
          <div className="text-sm text-blue-600 font-medium">
            Selected: {currentRow}
          </div>
        )}
        <button
          onClick={createNewRow}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          ➕ Create New
        </button>
        {currentRow && (
          <button
            onClick={duplicateRow}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            title="Duplicate the selected row"
          >
            📋 Duplicate Row
          </button>
        )}
        <button
          onClick={async () => {
            setSaving(true);
            console.log('Saving all rows...');
            try {
              await saveAllRows();
              console.log('All rows saved successfully!');
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
        
        {/* Import Excel Button */}
        <div className="relative">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
            id="excel-import-input"
          />
          <label
            htmlFor="excel-import-input"
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 cursor-pointer flex items-center gap-2"
          >
            📊 Import Excel
          </label>
        </div>
        
        {currentRow && (
          <button
            onClick={() => deleteRow(currentRow)}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            title="Delete the selected row"
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
               <li>• <strong>Horizontal scroll:</strong> Use mouse wheel or scrollbar to see all columns</li>
               <li>• <strong>Vertical scroll:</strong> Scroll up/down to see all rows</li>
             </ul>
          </div>
        </div>
      </div>

      {/* Excel Grid */}
      <div className="overflow-auto border border-gray-300 relative" style={{ maxHeight: '70vh', overflowX: 'auto' }}>
        {/* Scroll indicator */}
        <div className="absolute top-2 right-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded shadow-sm z-20">
          ← Scroll horizontally to see all columns →
        </div>
        <div style={{ minWidth: columnConfig.reduce((sum, col) => sum + col.width, 0) }}>
          {/* Section Headers */}
          <div className="flex border-b-2 border-gray-300 sticky top-0 z-10" style={{ minWidth: columnConfig.reduce((sum, col) => sum + col.width, 0) }}>
          {sectionConfig.map((section, sectionIndex) => {
            const sectionColumns = columnConfig.filter(col => col.section === section.identifier);
            const totalWidth = sectionColumns.reduce((sum, col) => sum + col.width, 0);
            
            return (
              <div
                key={sectionIndex}
                className={`${section.color} border-r border-gray-300 flex items-center justify-center text-xs font-bold text-red-700 py-2 px-2`}
                style={{ width: totalWidth, minWidth: totalWidth }}
              >
                {section.name}
          </div>
            );
          })}
        </div>

        {/* Column Headers */}
        <div className="flex border-b border-gray-300 sticky top-8 z-10" style={{ minWidth: columnConfig.reduce((sum, col) => sum + col.width, 0) }}>
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
          <div className="flex border-b-2 border-gray-400 sticky top-16 z-10" style={{ minWidth: columnConfig.reduce((sum, col) => sum + col.width, 0) }}>
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
          <>
            {/* Plus button for inserting at the beginning */}
            <div 
              className="relative flex items-center hover:bg-blue-100 transition-colors duration-200"
              onMouseEnter={() => setHoveredInsertionPoint(0)}
              onMouseLeave={() => setHoveredInsertionPoint(null)}
            >
              {/* Plus button */}
              {hoveredInsertionPoint === 0 && (
                <button
                  onClick={() => insertRowAtPosition(0)}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 z-30 bg-blue-500 hover:bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold shadow-lg transition-all duration-200 hover:scale-110"
                  title="Insert new row here"
                >
                  +
                </button>
              )}
              
              {/* Highlight line */}
              {hoveredInsertionPoint === 0 && (
                <div className="absolute left-0 right-0 top-0 h-0.5 bg-blue-500 z-20"></div>
              )}
              
              {/* Empty row for spacing */}
              <div className="w-full h-8"></div>
            </div>

            {wizardRows.map((row, rowIndex) => (
              <div key={`row-${row.id}-${rowIndex}`}>
                {/* Row content */}
                <div
                  className={`relative flex hover:bg-gray-50 ${
                currentRow === row.id 
                      ? 'border-2 border-blue-500 bg-blue-50 shadow-sm' 
                      : 'border-b border-gray-200'
                  } ${
                    currentRow === row.id 
                      ? '' 
                  : rowIndex % 2 === 0 
                    ? 'bg-white' 
                    : 'bg-gray-50'
              }`}
                  style={{ minWidth: columnConfig.reduce((sum, col) => sum + col.width, 0) }}
              onMouseEnter={() => setHoveredRow(row.id)}
              onMouseLeave={() => setHoveredRow(null)}
              onClick={() => {
                console.log('Row clicked:', row.id);
                setCurrentRow(row.id);
                setCurrentColumn(0);
              }}
            >
                  {/* Pointer finger for selected row - moved outside grid */}
                  {currentRow === row.id && (
                    <div className="absolute -left-12 top-1/2 transform -translate-y-1/2 z-20 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      ▶
                    </div>
                  )}

              {/* Data Columns */}
              {columnConfig.map((col, colIndex) => (
           <div
             key={colIndex}
                      className={`${col.cellBgColor} border-r border-gray-300 px-2 py-2 text-sm flex-shrink-0`}
             style={{ width: col.width }}
           >
                  {renderCell(row, col, rowIndex)}
                </div>
              ))}
            </div>

                {/* Plus button for inserting after this row */}
                <div 
                  className="relative flex items-center hover:bg-blue-100 transition-colors duration-200"
                  onMouseEnter={() => setHoveredInsertionPoint(rowIndex + 1)}
                  onMouseLeave={() => setHoveredInsertionPoint(null)}
                >
                  {/* Plus button */}
                  {hoveredInsertionPoint === rowIndex + 1 && (
                    <button
                      onClick={() => insertRowAtPosition(rowIndex + 1)}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 z-30 bg-blue-500 hover:bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold shadow-lg transition-all duration-200 hover:scale-110"
                      title="Insert new row here"
                    >
                      +
                    </button>
                  )}
                  
                  {/* Highlight line */}
                  {hoveredInsertionPoint === rowIndex + 1 && (
                    <div className="absolute left-0 right-0 top-0 h-0.5 bg-blue-500 z-20"></div>
                  )}
                  
                  {/* Empty row for spacing */}
                  <div className="w-full h-8"></div>
                </div>
              </div>
            ))}
          </>
        )}
        </div>
      </div>

      {/* Import Preview Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Excel Import Preview
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Review the imported data before confirming
              </p>
            </div>
            
            <div className="p-6 overflow-auto max-h-[60vh]">
              {importErrors.length > 0 ? (
                <div className="mb-4">
                  <h4 className="text-red-600 font-semibold mb-2">Import Errors:</h4>
                  <ul className="list-disc list-inside text-red-600 space-y-1">
                    {importErrors.map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <h4 className="text-green-600 font-semibold mb-2">
                      Successfully extracted {importedData.length} rows
                    </h4>
                    <p className="text-sm text-gray-600">
                      The following data will be added to your grid:
                    </p>
                    {importedData.length > 0 && (
                      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <h5 className="text-sm font-medium text-blue-800 mb-2">Column Mapping Status:</h5>
                        <div className="text-xs text-blue-700">
                          <p>✅ Simple exact column name matching is now active</p>
                          <p>• Excel column names must match grid column names exactly</p>
                          <p>• Example: "Address" column in Excel will match "Address" column in grid</p>
                          <p>• Case-insensitive matching (Address = address = ADDRESS)</p>
                          <p className="mt-1 text-blue-600">Check browser console for detailed mapping results</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="overflow-auto border border-gray-300 rounded relative" style={{ maxHeight: '400px', overflowX: 'auto' }}>
                    <div className="absolute top-2 right-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded shadow-sm z-10">
                      ← Scroll horizontally to see all {columnConfig.length} columns →
                    </div>
                    <table className="min-w-full text-xs" style={{ minWidth: columnConfig.reduce((sum, col) => sum + col.width, 0) + 'px' }}>
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-2 py-2 text-left font-medium text-gray-700 min-w-[50px] sticky left-0 bg-gray-50 z-10">Row</th>
                          {columnConfig.map((col, index) => (
                            <th 
                              key={index}
                              className={`px-2 py-2 text-left font-medium text-gray-700 flex-shrink-0 ${col.headerBgColor}`}
                              style={{ width: col.width, minWidth: col.width }}
                            >
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {importedData.slice(0, 10).map((row, index) => (
                          <tr key={row.id} className="hover:bg-gray-50">
                            <td className="px-2 py-2 text-gray-900 sticky left-0 bg-white z-10 min-w-[50px]">{index + 1}</td>
                            {columnConfig.map((col, colIndex) => {
                              const value = getFieldValue(row, col.key);
                              const displayValue = formatValue(value, col.type);
                              return (
                                <td 
                                  key={colIndex}
                                  className={`px-2 py-2 text-gray-900 flex-shrink-0 ${col.cellBgColor}`}
                                  style={{ width: col.width, minWidth: col.width }}
                                >
                                  {displayValue || '-'}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                        {importedData.length > 10 && (
                          <tr>
                            <td colSpan={columnConfig.length + 1} className="px-3 py-2 text-center text-gray-500 text-sm">
                              ... and {importedData.length - 10} more rows
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={cancelImport}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
              >
                Cancel
              </button>
              {importErrors.length === 0 && (
                <button
                  onClick={confirmImport}
                  disabled={importing}
                  className={`px-4 py-2 text-white rounded flex items-center gap-2 ${
                    importing
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-500 hover:bg-green-600'
                  }`}
                >
                  {importing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Importing...
                    </>
                  ) : (
                    'Confirm Import'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcelGridView;
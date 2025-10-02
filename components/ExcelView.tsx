import React, { useState, useEffect } from 'react';
import { CPIFDocument } from '../lib/types/cpif';

interface ExcelViewProps {
  ocId: string;
}

const ExcelView: React.FC<ExcelViewProps> = ({ ocId }) => {
  const [wizardRows, setWizardRows] = useState<CPIFDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempData, setTempData] = useState<Partial<CPIFDocument>>({});

  // Load wizard rows
  const loadWizardRows = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/cpif');
      if (response.ok) {
        const result = await response.json();
        const allRows: CPIFDocument[] = result.data || [];
        const filteredRows = ocId ? allRows.filter(row => row.ocId === ocId) : allRows;
        setWizardRows(filteredRows);
      }
    } catch (error) {
      console.error('Failed to load wizard rows:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWizardRows();
  }, [ocId]);

  // Create new row
  const createNewRow = () => {
    const newRow: CPIFDocument = {
      id: `temp-${Date.now()}`,
      timestamp: new Date().toISOString(),
      createdBy: 'Current User',
      wizardType: 'New Container',
      ocId: ocId,
      status: 'Draft',
      lastModified: new Date().toISOString(),
      version: 1,
      accountInfo: {
        legalName: '',
        industry: 'Technology',
        entityType: 'Corporation',
        productService: 'Software',
        leadSource: 'Website',
        estOpptyValue: '',
        adminFeePercent: '',
        onboardingFeePercent: '',
        opportunityPartner: undefined,
        opportunityPartnerName: '',
        opportunityPartnerEmail: '',
        opportunityPartnerPhone: '',
        opportunityPartnerTitle: '',
        opportunityPartnerDepartment: '',
        opportunityPartnerManager: undefined,
        opportunityPartnerManagerName: '',
        opportunityPartnerManagerEmail: '',
        opportunityPartnerManagerPhone: '',
        opportunityPartnerManagerTitle: '',
        opportunityPartnerManagerDepartment: '',
        estimatedRealizationYear1: '',
        estimatedRealizationYear2: '',
        estimatedRealizationYear3: '',
        estimatedRealizationYear4: '',
        estimatedRealizationYear5: '',
        estimatedRealizationYear6: '',
        estimatedRealizationYear7: '',
        estimatedRealizationYear8: '',
        estimatedRealizationYear9: '',
        estimatedRealizationYear10: ''
      },
      workdayInfo: {
        workdayProjectContract: '',
        workdayProjectContractName: '',
        workdayProjectContractEmail: '',
        workdayProjectContractPhone: '',
        workdayProjectContractTitle: '',
        workdayProjectContractDepartment: '',
        workdayProjectContractManager: undefined,
        workdayProjectContractManagerName: '',
        workdayProjectContractManagerEmail: '',
        workdayProjectContractManagerPhone: '',
        workdayProjectContractManagerTitle: '',
        workdayProjectContractManagerDepartment: ''
      },
      taxAdmin: {
        taxAdmin: '',
        taxAdminName: '',
        taxAdminEmail: '',
        taxAdminPhone: '',
        taxAdminTitle: '',
        taxAdminDepartment: '',
        taxAdminManager: undefined,
        taxAdminManagerName: '',
        taxAdminManagerEmail: '',
        taxAdminManagerPhone: '',
        taxAdminManagerTitle: '',
        taxAdminManagerDepartment: ''
      },
      peTms: {
        peTms: '',
        peTmsName: '',
        peTmsEmail: '',
        peTmsPhone: '',
        peTmsTitle: '',
        peTmsDepartment: '',
        peTmsManager: undefined,
        peTmsManagerName: '',
        peTmsManagerEmail: '',
        peTmsManagerPhone: '',
        peTmsManagerTitle: '',
        peTmsManagerDepartment: ''
      },
      invoice: {
        invoice: '',
        invoiceName: '',
        invoiceEmail: '',
        invoicePhone: '',
        invoiceTitle: '',
        invoiceDepartment: '',
        invoiceManager: undefined,
        invoiceManagerName: '',
        invoiceManagerEmail: '',
        invoiceManagerPhone: '',
        invoiceManagerTitle: '',
        invoiceManagerDepartment: ''
      },
      engagement: {
        engagement: '',
        engagementName: '',
        engagementEmail: '',
        engagementPhone: '',
        engagementTitle: '',
        engagementDepartment: '',
        engagementManager: undefined,
        engagementManagerName: '',
        engagementManagerEmail: '',
        engagementManagerPhone: '',
        engagementManagerTitle: '',
        engagementManagerDepartment: ''
      },
      peteKlinger: {
        peteKlinger: '',
        peteKlingerName: '',
        peteKlingerEmail: '',
        peteKlingerPhone: '',
        peteKlingerTitle: '',
        peteKlingerDepartment: '',
        peteKlingerManager: undefined,
        peteKlingerManagerName: '',
        peteKlingerManagerEmail: '',
        peteKlingerManagerPhone: '',
        peteKlingerManagerTitle: '',
        peteKlingerManagerDepartment: ''
      },
      revenueForecast: {
        'January 2024': 0,
        'February 2024': 0,
        'March 2024': 0,
        'April 2024': 0,
        'May 2024': 0,
        'June 2024': 0,
        'July 2024': 0,
        'August 2024': 0,
        'September 2024': 0,
        'October 2024': 0,
        'November 2024': 0,
        'December 2024': 0
      },
      onboarding: {
        accountGUID: '',
        opportunityGUID: '',
        opportunityName: ''
      }
    };
    setWizardRows(prev => [...prev, newRow]);
    setEditingRow(newRow.id);
  };

  // Save row
  const saveRow = async (row: CPIFDocument) => {
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
        const savedRow = await response.json();
        if (isNewRow) {
          setWizardRows(prev => prev.map(r => r.id === row.id ? savedRow : r));
        }
        setEditingRow(null);
        setEditingField(null);
        setTempData({});
      }
    } catch (error) {
      console.error('Failed to save row:', error);
    }
  };

  // Delete row
  const deleteRow = async (rowId: string) => {
    try {
      const response = await fetch(`/api/cpif/${rowId}`, { method: 'DELETE' });
      if (response.ok) {
        setWizardRows(prev => prev.filter(r => r.id !== rowId));
      }
    } catch (error) {
      console.error('Failed to delete row:', error);
    }
  };

  // Start editing field
  const startEditing = (rowId: string, field: string, value: any) => {
    setEditingRow(rowId);
    setEditingField(field);
    setTempData({ [field]: value });
  };

  // Update field value
  const updateField = (rowId: string, field: string, value: any) => {
    setWizardRows(prev => prev.map(row => {
      if (row.id === rowId) {
        const updatedRow = { ...row };
        const fieldParts = field.split('.');
        let current = updatedRow as any;
        for (let i = 0; i < fieldParts.length - 1; i++) {
          if (!current[fieldParts[i]]) current[fieldParts[i]] = {};
          current = current[fieldParts[i]];
        }
        current[fieldParts[fieldParts.length - 1]] = value;
        return updatedRow;
      }
      return row;
    }));
  };

  // Get field value
  const getFieldValue = (row: CPIFDocument, field: string) => {
    const fieldParts = field.split('.');
    let current = row as any;
    for (const part of fieldParts) {
      current = current?.[part];
    }
    return current || '';
  };

  // Define columns for the spreadsheet
  const columns = [
    { key: 'accountInfo.legalName', label: 'Company Name', width: '200px' },
    { key: 'accountInfo.industry', label: 'Industry', width: '150px' },
    { key: 'accountInfo.entityType', label: 'Entity Type', width: '150px' },
    { key: 'accountInfo.productService', label: 'Product/Service', width: '150px' },
    { key: 'accountInfo.leadSource', label: 'Lead Source', width: '150px' },
    { key: 'accountInfo.estOpptyValue', label: 'Est. Oppty Value', width: '150px' },
    { key: 'accountInfo.opportunityPartnerName', label: 'Oppty Partner', width: '200px' },
    { key: 'accountInfo.opportunityPartnerEmail', label: 'Partner Email', width: '200px' },
    { key: 'workdayInfo.workdayProjectContractName', label: 'Workday Contact', width: '200px' },
    { key: 'workdayInfo.workdayProjectContractEmail', label: 'Workday Email', width: '200px' },
    { key: 'taxAdmin.taxAdminName', label: 'Tax Admin', width: '200px' },
    { key: 'taxAdmin.taxAdminEmail', label: 'Tax Admin Email', width: '200px' },
    { key: 'peTms.peTmsName', label: 'PE/TMS', width: '200px' },
    { key: 'peTms.peTmsEmail', label: 'PE/TMS Email', width: '200px' },
    { key: 'invoice.invoiceName', label: 'Invoice Contact', width: '200px' },
    { key: 'invoice.invoiceEmail', label: 'Invoice Email', width: '200px' },
    { key: 'engagement.engagementName', label: 'Engagement', width: '200px' },
    { key: 'engagement.engagementEmail', label: 'Engagement Email', width: '200px' },
    { key: 'peteKlinger.peteKlingerName', label: 'Pete Klinger', width: '200px' },
    { key: 'peteKlinger.peteKlingerEmail', label: 'Pete Klinger Email', width: '200px' },
    { key: 'status', label: 'Status', width: '100px' },
    { key: 'wizardType', label: 'Wizard Type', width: '150px' }
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="w-full">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold">Wizard Rows for {ocId}</h3>
        <button
          onClick={createNewRow}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          + Add New Row
        </button>
      </div>

      <div className="overflow-x-auto border border-gray-300 rounded-lg">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                Actions
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  style={{ width: col.width }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {wizardRows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-2 py-2 whitespace-nowrap">
                  <div className="flex space-x-1">
                    {editingRow === row.id ? (
                      <>
                        <button
                          onClick={() => saveRow(row)}
                          className="text-green-600 hover:text-green-800 text-xs"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => {
                            setEditingRow(null);
                            setEditingField(null);
                            setTempData({});
                          }}
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingRow(row.id)}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => deleteRow(row.id)}
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                </td>
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-2 py-2 text-sm text-gray-900"
                    style={{ width: col.width }}
                  >
                    {editingRow === row.id && editingField === col.key ? (
                      <input
                        type="text"
                        value={tempData[col.key] || getFieldValue(row, col.key)}
                        onChange={(e) => {
                          setTempData({ [col.key]: e.target.value });
                          updateField(row.id, col.key, e.target.value);
                        }}
                        onBlur={() => setEditingField(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setEditingField(null);
                          }
                        }}
                        className="w-full border border-gray-300 rounded px-1 py-1 text-xs"
                        autoFocus
                      />
                    ) : (
                      <div
                        onClick={() => startEditing(row.id, col.key, getFieldValue(row, col.key))}
                        className="cursor-pointer hover:bg-gray-100 px-1 py-1 rounded"
                      >
                        {getFieldValue(row, col.key)}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {wizardRows.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No wizard rows found. Click "Add New Row" to create one.
        </div>
      )}
    </div>
  );
};

export default ExcelView;

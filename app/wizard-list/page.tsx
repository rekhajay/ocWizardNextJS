'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CPIFDocument } from '@/lib/types/cpif';

export default function WizardListPage() {
  const router = useRouter();
  const [wizardRows, setWizardRows] = useState<CPIFDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWizardRows();
  }, []);

  const loadWizardRows = async () => {
    try {
      const response = await fetch('/api/cpif');
      if (response.ok) {
        const result = await response.json();
        setWizardRows(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load wizard rows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    router.push('/wizard-create');
  };

  const handleEditRow = (id: string) => {
    router.push(`/wizard-edit/${id}`);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Container Creation Wizard</h1>
          <p className="mt-2 text-gray-600">Manage your wizard rows and create new ones</p>
        </div>

        {/* Grid View */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Wizard Rows</h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading wizard rows...</p>
            </div>
          ) : wizardRows.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No wizard rows yet</h3>
              <p className="text-gray-600 mb-4">Get started by creating your first wizard row.</p>
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wizardRows.map((row) => (
                  <div key={row.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{row.accountInfo.legalName || 'Unnamed'}</h3>
                        <p className="text-sm text-gray-600">{row.wizardType}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        row.status === 'Draft' ? 'bg-yellow-100 text-yellow-800' :
                        row.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {row.status}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><span className="font-medium">Contact:</span> {row.accountInfo.primaryContact}</p>
                      <p><span className="font-medium">Email:</span> {row.accountInfo.primaryContactEmail}</p>
                      <p><span className="font-medium">Created:</span> {new Date(row.timestamp).toLocaleDateString()}</p>
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => handleEditRow(row.id)}
                        className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRow(row.id)}
                        className="px-3 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Create New Button */}
        <div className="mt-8 text-center">
          <button
            onClick={handleCreateNew}
            className="px-6 py-3 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors"
          >
            Create New Wizard Row
          </button>
        </div>
      </div>
    </div>
  );
}

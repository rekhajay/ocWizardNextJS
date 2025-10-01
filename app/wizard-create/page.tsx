'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Wizard from '@/components/Wizard';

type WizardTab = 'New Client-Entity (Need a CUS#)' | 'New Project (Have a CUS#)' | 'Use if Opportunity is in CRM';

export default function WizardCreatePage() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<WizardTab | ''>('');
  const [currentStep, setCurrentStep] = useState<'template-selection' | 'wizard-form'>('template-selection');

  const handleTabSelection = (tab: WizardTab) => {
    setSelectedTab(tab);
    setCurrentStep('wizard-form');
  };

  const handleBackToList = () => {
    router.push('/wizard-list');
  };

  const handleWizardClose = () => {
    setCurrentStep('template-selection');
    setSelectedTab('');
  };

  const handleWizardSaved = () => {
    // Navigate back to list after successful save
    router.push('/wizard-list');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Container Creation Wizard</h1>
              <p className="mt-2 text-gray-600">Create a new wizard row</p>
            </div>
            <button
              onClick={handleBackToList}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Back to List
            </button>
          </div>
        </div>

        {currentStep === 'template-selection' && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Wizard Type</h2>
              <p className="text-gray-600">Choose the template for your new wizard row</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <button
                onClick={() => handleTabSelection('New Client-Entity (Need a CUS#)')}
                className="p-6 bg-green-50 border-2 border-green-300 rounded-lg hover:bg-green-100 text-left transition-colors"
              >
                <h3 className="font-semibold text-green-800 text-lg mb-2">New Client-Entity (Need a CUS#)</h3>
                <p className="text-sm text-green-600">Create a new client entity that needs a Customer ID</p>
              </button>
              
              <button
                onClick={() => handleTabSelection('New Project (Have a CUS#)')}
                className="p-6 bg-blue-500 border-2 border-blue-600 rounded-lg hover:bg-blue-600 text-left transition-colors"
              >
                <h3 className="font-semibold text-white text-lg mb-2">New Project (Have a CUS#)</h3>
                <p className="text-sm text-blue-100">Create a new project for existing client</p>
              </button>
              
              <button
                onClick={() => handleTabSelection('Use if Opportunity is in CRM')}
                className="p-6 bg-green-500 border-2 border-green-600 rounded-lg hover:bg-green-600 text-left transition-colors"
              >
                <h3 className="font-semibold text-white text-lg mb-2">Use if Opportunity is in CRM</h3>
                <p className="text-sm text-green-100">Link to existing opportunity in CRM system</p>
              </button>
            </div>
          </div>
        )}

        {currentStep === 'wizard-form' && selectedTab && (
          <div className="bg-white rounded-lg shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Container Creation Wizard - Single Row View</h2>
                  <p className="text-sm text-gray-600 mt-1">Template: {selectedTab}</p>
                </div>
                <button
                  onClick={handleWizardClose}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Back to Template Selection
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <Wizard
                open={true}
                onClose={handleWizardClose}
                selectedTab={selectedTab}
                onCPIFSaved={handleWizardSaved}
                isPageMode={true}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

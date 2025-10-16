import sql from 'mssql';
import { CPIFDocument } from '../types/cpif';

// OAuth configuration for Azure SQL Database
const getConfig = () => {
  const server = process.env.SQL_SERVER;
  const database = process.env.SQL_DATABASE;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  const tenantId = process.env.AZURE_TENANT_ID;

  console.log('Environment variables:', {
    server: server ? 'SET' : 'NOT SET',
    database: database ? 'SET' : 'NOT SET',
    clientId: clientId ? 'SET' : 'NOT SET',
    clientSecret: clientSecret ? 'SET' : 'NOT SET',
    tenantId: tenantId ? 'SET' : 'NOT SET'
  });

  if (!server || !database || !clientId || !clientSecret || !tenantId) {
    throw new Error(`Missing required environment variables. Server: ${server}, Database: ${database}, ClientId: ${clientId ? 'SET' : 'NOT SET'}, ClientSecret: ${clientSecret ? 'SET' : 'NOT SET'}, TenantId: ${tenantId ? 'SET' : 'NOT SET'}`);
  }

  return {
    server,
    database,
    authentication: {
            type: 'azure-active-directory-service-principal-secret' as const,
      options: {
        clientId,
        clientSecret,
        tenantId,
      }
    },
    options: {
      encrypt: true, // Use encryption for Azure SQL
      trustServerCertificate: false, // Use SSL certificate validation
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };
};

export class DatabaseService {
  private pool: sql.ConnectionPool | null = null;
  private connectionPromise: Promise<void> | null = null;

  async connect(): Promise<void> {
    // If already connecting, wait for that connection to complete
    if (this.connectionPromise) {
      await this.connectionPromise;
      return;
    }

    // If we have a connected pool, check if it's healthy
    if (this.pool && this.pool.connected) {
      const isHealthy = await this.isConnectionHealthy();
      if (isHealthy) {
        console.log('DatabaseService: Using existing healthy connection');
        return;
      } else {
        console.log('DatabaseService: Existing connection is unhealthy, reconnecting...');
        this.pool = null;
      }
    }

    // Start new connection process
    this.connectionPromise = this._connect();
    try {
      await this.connectionPromise;
    } finally {
      this.connectionPromise = null;
    }
  }

  private async _connect(): Promise<void> {
    // Close existing pool if it exists
    if (this.pool) {
      try {
        console.log('DatabaseService: Closing existing disconnected pool');
        await this.pool.close();
      } catch (error) {
        console.log('Error closing existing pool:', error);
      }
      this.pool = null;
    }

    try {
      console.log('DatabaseService: Creating new connection...');
      const config = getConfig();
      this.pool = new sql.ConnectionPool(config);
      
      // Set up error handlers
      this.pool.on('error', (err) => {
        console.error('DatabaseService: Connection pool error:', err);
        this.pool = null;
      });

      await this.pool.connect();
      console.log('DatabaseService: Successfully connected to Azure SQL Database using OAuth');
    } catch (error) {
      console.error('DatabaseService: Failed to connect to Azure SQL Database:', error);
      this.pool = null;
      throw error;
    }
  }

  async saveCPIF(cpifData: CPIFDocument): Promise<string> {
    console.log('DatabaseService: Starting saveCPIF for document:', cpifData.id);
    
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.connect();
        
        if (!this.pool) {
          throw new Error('Database connection pool is null');
        }
        
        // Check connection health and reconnect if needed
        const isHealthy = await this.isConnectionHealthy();
        if (!isHealthy) {
          console.log('DatabaseService: Connection unhealthy, reconnecting...');
          this.pool = null;
          await this.connect();
          
          if (!this.pool) {
            throw new Error('Database connection pool is null after reconnect');
          }
        }

        const request = this.pool.request();
        
        // Core fields
        request.input('id', sql.NVarChar(255), cpifData.id);
        request.input('timestamp', sql.DateTime2, new Date(cpifData.timestamp));
        request.input('createdBy', sql.NVarChar(255), cpifData.createdBy);
        request.input('wizardType', sql.NVarChar(255), cpifData.wizardType);
        request.input('ocId', sql.NVarChar(255), cpifData.ocId || null);
        request.input('status', sql.NVarChar(50), cpifData.status);
        request.input('lastModified', sql.DateTime2, new Date(cpifData.lastModified));
        request.input('version', sql.Int, cpifData.version);
        request.input('displayOrder', sql.Decimal(10, 2), cpifData.displayOrder || 0);
        
        // Section 1: CRM Pipeline
        request.input('newAccountLegalName', sql.NVarChar(500), cpifData.newAccountLegalName || null);
        request.input('primaryContactName', sql.NVarChar(255), cpifData.primaryContactName || null);
        request.input('primaryContactTitle', sql.NVarChar(255), cpifData.primaryContactTitle || null);
        request.input('primaryContactEmailAddress', sql.NVarChar(255), cpifData.primaryContactEmailAddress || null);
        request.input('industry', sql.NVarChar(255), cpifData.industry || null);
        request.input('entityType', sql.NVarChar(255), cpifData.entityType || null);
        request.input('address', sql.NVarChar(500), cpifData.address || null);
        request.input('city', sql.NVarChar(255), cpifData.city || null);
        request.input('state', sql.NVarChar(100), cpifData.state || null);
        request.input('zipCode', sql.NVarChar(20), cpifData.zipCode || null);
        request.input('productService', sql.NVarChar(255), cpifData.productService || null);
        request.input('estOpptyValue', sql.Decimal(15, 2), cpifData.estOpptyValue || null);
        request.input('opportunityPartner', sql.NVarChar(255), cpifData.opportunityPartner || null);
        request.input('taxDeliveryPartner', sql.NVarChar(255), cpifData.taxDeliveryPartner || null);
        request.input('bdSalesSupport', sql.NVarChar(500), cpifData.bdSalesSupport || null);
        request.input('leadSource', sql.NVarChar(255), cpifData.leadSource || null);
        request.input('leadSourceDetails', sql.NVarChar(255), cpifData.leadSourceDetails || null);
        request.input('lsFreeText', sql.NVarChar(500), cpifData.lsFreeText || null);
        request.input('referringEmployee', sql.NVarChar(255), cpifData.referringEmployee || null);
        
        // Section 2: Workday Project & Contract
        request.input('needProjectInWorkday', sql.Bit, cpifData.needProjectInWorkday || null);
        request.input('customerCollectionsLead', sql.NVarChar(255), cpifData.customerCollectionsLead || null);
        request.input('projectDeliveryLead', sql.NVarChar(255), cpifData.projectDeliveryLead || null);
        request.input('projectManager', sql.NVarChar(255), cpifData.projectManager || null);
        request.input('asstProjectManager', sql.NVarChar(255), cpifData.asstProjectManager || null);
        request.input('projectBillingSpecialist', sql.NVarChar(255), cpifData.projectBillingSpecialist || null);
        request.input('serviceCode', sql.NVarChar(255), cpifData.serviceCode || null);
        request.input('taxYearEnd', sql.NVarChar(20), cpifData.taxYearEnd || null);
        request.input('renewableProject', sql.Bit, cpifData.renewableProject || null);
        request.input('projectStartDate', sql.Date, cpifData.projectStartDate ? new Date(cpifData.projectStartDate) : null);
        request.input('projectEndDate', sql.Date, cpifData.projectEndDate ? new Date(cpifData.projectEndDate) : null);
        request.input('taxForm', sql.NVarChar(255), cpifData.taxForm || null);
        request.input('nextDueDate', sql.Date, cpifData.nextDueDate ? new Date(cpifData.nextDueDate) : null);
        request.input('dateOfDeath', sql.Date, cpifData.dateOfDeath ? new Date(cpifData.dateOfDeath) : null);
        request.input('contractType', sql.NVarChar(255), cpifData.contractType || null);
        request.input('totalEstimatedHours', sql.Decimal(10, 2), cpifData.totalEstimatedHours || null);
        request.input('estimatedRealizationYear1', sql.NVarChar(50), cpifData.estimatedRealizationYear1 || null);
        request.input('contractRateSheet', sql.NVarChar(255), cpifData.contractRateSheet || null);
        request.input('totalContractAmount', sql.Decimal(15, 2), cpifData.totalContractAmount || null);
        request.input('adminFeePercent', sql.Decimal(5, 2), cpifData.adminFeePercent || null);
        request.input('adminFeeIncludedExcluded', sql.NVarChar(255), cpifData.adminFeeIncludedExcluded || null);
        request.input('onboardingFeePercent', sql.Decimal(5, 2), cpifData.onboardingFeePercent || null);
        request.input('onboardingFeeAmount', sql.Decimal(15, 2), cpifData.onboardingFeeAmount || null);
        request.input('suggestedWorkdayParentName', sql.NVarChar(255), cpifData.suggestedWorkdayParentName || null);
        
        // Section 3: Tax Admin
        request.input('elSigned', sql.Bit, cpifData.elSigned || null);
        request.input('authorized7216', sql.Bit, cpifData.authorized7216 || null);
        
        // Section 4: PE & TMS
        request.input('connectedToPEOrTMS', sql.NVarChar(255), cpifData.connectedToPEOrTMS || null);
        request.input('nameOfRelatedPEFundTMSCustomer', sql.NVarChar(500), cpifData.nameOfRelatedPEFundTMSCustomer || null);
        
        // Section 5: Invoice Style & Delivery
        request.input('invoiceType', sql.NVarChar(255), cpifData.invoiceType || null);
        request.input('consolidatedBillingCustomerName', sql.NVarChar(500), cpifData.consolidatedBillingCustomerName || null);
        request.input('consolidatedBillingExistingSchedule', sql.NVarChar(500), cpifData.consolidatedBillingExistingSchedule || null);
        request.input('additionalCustomerContacts', sql.NVarChar(500), cpifData.additionalCustomerContacts || null);
        request.input('additionalCustomerContactEmails', sql.NVarChar(500), cpifData.additionalCustomerContactEmails || null);
        request.input('invoiceRecipientNames', sql.NVarChar(500), cpifData.invoiceRecipientNames || null);
        request.input('invoiceRecipientEmails', sql.NVarChar(500), cpifData.invoiceRecipientEmails || null);
        
        // Section 6: Engagement Letter
        request.input('partnerSigningEL', sql.NVarChar(255), cpifData.partnerSigningEL || null);
        request.input('consultingServicesDescription', sql.NVarChar(500), cpifData.consultingServicesDescription || null);
        
        // Section 7: Pete Klinger
        request.input('documentDelivery', sql.NVarChar(255), cpifData.documentDelivery || null);
        request.input('invoiceMemo', sql.NVarChar(255), cpifData.invoiceMemo || null);
        request.input('billToContact', sql.NVarChar(255), cpifData.billToContact || null);
        
        // Section 8: Revenue Forecast
        request.input('october2025', sql.Decimal(15, 2), cpifData.october2025 || null);
        request.input('november2025', sql.Decimal(15, 2), cpifData.november2025 || null);
        request.input('december2025', sql.Decimal(15, 2), cpifData.december2025 || null);
        request.input('january2026', sql.Decimal(15, 2), cpifData.january2026 || null);
        request.input('february2026', sql.Decimal(15, 2), cpifData.february2026 || null);
        request.input('march2026', sql.Decimal(15, 2), cpifData.march2026 || null);
        request.input('april2026', sql.Decimal(15, 2), cpifData.april2026 || null);
        request.input('may2026', sql.Decimal(15, 2), cpifData.may2026 || null);
        request.input('june2026', sql.Decimal(15, 2), cpifData.june2026 || null);
        request.input('july2026', sql.Decimal(15, 2), cpifData.july2026 || null);
        request.input('august2026', sql.Decimal(15, 2), cpifData.august2026 || null);
        request.input('september2026', sql.Decimal(15, 2), cpifData.september2026 || null);
        request.input('balance', sql.Decimal(15, 2), cpifData.balance || null);
        
        // Section 9: Onboarding
        request.input('accountGUID', sql.NVarChar(255), cpifData.accountGUID || null);
        request.input('opportunityGUID', sql.NVarChar(255), cpifData.opportunityGUID || null);
        request.input('opportunityName', sql.NVarChar(255), cpifData.opportunityName || null);

        const result = await request.query(`
          INSERT INTO CPIFDocuments (
            id, timestamp, createdBy, wizardType, ocId, status, lastModified, version, displayOrder,
            newAccountLegalName, primaryContactName, primaryContactTitle, primaryContactEmailAddress, industry, entityType, address, city, state, zipCode, productService, estOpptyValue, opportunityPartner, taxDeliveryPartner, bdSalesSupport, leadSource, leadSourceDetails, lsFreeText, referringEmployee,
            needProjectInWorkday, customerCollectionsLead, projectDeliveryLead, projectManager, asstProjectManager, projectBillingSpecialist, serviceCode, taxYearEnd, renewableProject, projectStartDate, projectEndDate, taxForm, nextDueDate, dateOfDeath, contractType, totalEstimatedHours, estimatedRealizationYear1, contractRateSheet, totalContractAmount, adminFeePercent, adminFeeIncludedExcluded, onboardingFeePercent, onboardingFeeAmount, suggestedWorkdayParentName,
            elSigned, authorized7216,
            connectedToPEOrTMS, nameOfRelatedPEFundTMSCustomer,
            invoiceType, consolidatedBillingCustomerName, consolidatedBillingExistingSchedule, additionalCustomerContacts, additionalCustomerContactEmails, invoiceRecipientNames, invoiceRecipientEmails,
            partnerSigningEL, consultingServicesDescription,
            documentDelivery, invoiceMemo, billToContact,
            october2025, november2025, december2025, january2026, february2026, march2026, april2026, may2026, june2026, july2026, august2026, september2026, balance,
            accountGUID, opportunityGUID, opportunityName
          ) VALUES (
            @id, @timestamp, @createdBy, @wizardType, @ocId, @status, @lastModified, @version, @displayOrder,
            @newAccountLegalName, @primaryContactName, @primaryContactTitle, @primaryContactEmailAddress, @industry, @entityType, @address, @city, @state, @zipCode, @productService, @estOpptyValue, @opportunityPartner, @taxDeliveryPartner, @bdSalesSupport, @leadSource, @leadSourceDetails, @lsFreeText, @referringEmployee,
            @needProjectInWorkday, @customerCollectionsLead, @projectDeliveryLead, @projectManager, @asstProjectManager, @projectBillingSpecialist, @serviceCode, @taxYearEnd, @renewableProject, @projectStartDate, @projectEndDate, @taxForm, @nextDueDate, @dateOfDeath, @contractType, @totalEstimatedHours, @estimatedRealizationYear1, @contractRateSheet, @totalContractAmount, @adminFeePercent, @adminFeeIncludedExcluded, @onboardingFeePercent, @onboardingFeeAmount, @suggestedWorkdayParentName,
            @elSigned, @authorized7216,
            @connectedToPEOrTMS, @nameOfRelatedPEFundTMSCustomer,
            @invoiceType, @consolidatedBillingCustomerName, @consolidatedBillingExistingSchedule, @additionalCustomerContacts, @additionalCustomerContactEmails, @invoiceRecipientNames, @invoiceRecipientEmails,
            @partnerSigningEL, @consultingServicesDescription,
            @documentDelivery, @invoiceMemo, @billToContact,
            @october2025, @november2025, @december2025, @january2026, @february2026, @march2026, @april2026, @may2026, @june2026, @july2026, @august2026, @september2026, @balance,
            @accountGUID, @opportunityGUID, @opportunityName
          )
        `);

        console.log('DatabaseService: Successfully saved CPIF document:', cpifData.id);
        return cpifData.id;
        
      } catch (error: any) {
        console.error(`DatabaseService: Save attempt ${attempt} failed:`, error);
        
        if (error.code === 'ECONNCLOSED' || error.message?.includes('Connection is closed')) {
          console.log('DatabaseService: Connection closed, resetting pool...');
      this.pool = null;
    }
        
        if (attempt === maxRetries) {
          console.error('DatabaseService: All save attempts failed');
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    
    throw new Error('Unexpected error: saveCPIF failed after all retries');
  }

  async updateCPIF(id: string, cpifData: CPIFDocument): Promise<CPIFDocument> {
    console.log('DatabaseService: Starting updateCPIF for document:', id);
    
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.connect();
        
        if (!this.pool) {
          throw new Error('Database connection pool is null');
        }
        
        // Check connection health and reconnect if needed
        const isHealthy = await this.isConnectionHealthy();
        if (!isHealthy) {
          console.log('DatabaseService: Connection unhealthy, reconnecting...');
          this.pool = null;
          await this.connect();
          
          if (!this.pool) {
            throw new Error('Database connection pool is null after reconnect');
          }
        }

        const request = this.pool.request();
    
        // Core fields
        request.input('id', sql.NVarChar(255), id);
        request.input('timestamp', sql.DateTime2, new Date(cpifData.timestamp));
        request.input('createdBy', sql.NVarChar(255), cpifData.createdBy);
        request.input('wizardType', sql.NVarChar(255), cpifData.wizardType);
        request.input('ocId', sql.NVarChar(255), cpifData.ocId || null);
        request.input('status', sql.NVarChar(50), cpifData.status);
        request.input('lastModified', sql.DateTime2, new Date(cpifData.lastModified));
        request.input('version', sql.Int, cpifData.version);
        request.input('displayOrder', sql.Decimal(10, 2), cpifData.displayOrder || 0);
        
        // Section 1: CRM Pipeline
        request.input('newAccountLegalName', sql.NVarChar(500), cpifData.newAccountLegalName || null);
        request.input('primaryContactName', sql.NVarChar(255), cpifData.primaryContactName || null);
        request.input('primaryContactTitle', sql.NVarChar(255), cpifData.primaryContactTitle || null);
        request.input('primaryContactEmailAddress', sql.NVarChar(255), cpifData.primaryContactEmailAddress || null);
        request.input('industry', sql.NVarChar(255), cpifData.industry || null);
        request.input('entityType', sql.NVarChar(255), cpifData.entityType || null);
        request.input('address', sql.NVarChar(500), cpifData.address || null);
        request.input('city', sql.NVarChar(255), cpifData.city || null);
        request.input('state', sql.NVarChar(100), cpifData.state || null);
        request.input('zipCode', sql.NVarChar(20), cpifData.zipCode || null);
        request.input('productService', sql.NVarChar(255), cpifData.productService || null);
        request.input('estOpptyValue', sql.Decimal(15, 2), cpifData.estOpptyValue || null);
        request.input('opportunityPartner', sql.NVarChar(255), cpifData.opportunityPartner || null);
        request.input('taxDeliveryPartner', sql.NVarChar(255), cpifData.taxDeliveryPartner || null);
        request.input('bdSalesSupport', sql.NVarChar(500), cpifData.bdSalesSupport || null);
        request.input('leadSource', sql.NVarChar(255), cpifData.leadSource || null);
        request.input('leadSourceDetails', sql.NVarChar(255), cpifData.leadSourceDetails || null);
        request.input('lsFreeText', sql.NVarChar(500), cpifData.lsFreeText || null);
        request.input('referringEmployee', sql.NVarChar(255), cpifData.referringEmployee || null);
        
        // Section 2: Workday Project & Contract
        request.input('needProjectInWorkday', sql.Bit, cpifData.needProjectInWorkday || null);
        request.input('customerCollectionsLead', sql.NVarChar(255), cpifData.customerCollectionsLead || null);
        request.input('projectDeliveryLead', sql.NVarChar(255), cpifData.projectDeliveryLead || null);
        request.input('projectManager', sql.NVarChar(255), cpifData.projectManager || null);
        request.input('asstProjectManager', sql.NVarChar(255), cpifData.asstProjectManager || null);
        request.input('projectBillingSpecialist', sql.NVarChar(255), cpifData.projectBillingSpecialist || null);
        request.input('serviceCode', sql.NVarChar(255), cpifData.serviceCode || null);
        request.input('taxYearEnd', sql.NVarChar(20), cpifData.taxYearEnd || null);
        request.input('renewableProject', sql.Bit, cpifData.renewableProject || null);
        request.input('projectStartDate', sql.Date, cpifData.projectStartDate ? new Date(cpifData.projectStartDate) : null);
        request.input('projectEndDate', sql.Date, cpifData.projectEndDate ? new Date(cpifData.projectEndDate) : null);
        request.input('taxForm', sql.NVarChar(255), cpifData.taxForm || null);
        request.input('nextDueDate', sql.Date, cpifData.nextDueDate ? new Date(cpifData.nextDueDate) : null);
        request.input('dateOfDeath', sql.Date, cpifData.dateOfDeath ? new Date(cpifData.dateOfDeath) : null);
        request.input('contractType', sql.NVarChar(255), cpifData.contractType || null);
        request.input('totalEstimatedHours', sql.Decimal(10, 2), cpifData.totalEstimatedHours || null);
        request.input('estimatedRealizationYear1', sql.NVarChar(50), cpifData.estimatedRealizationYear1 || null);
        request.input('contractRateSheet', sql.NVarChar(255), cpifData.contractRateSheet || null);
        request.input('totalContractAmount', sql.Decimal(15, 2), cpifData.totalContractAmount || null);
        request.input('adminFeePercent', sql.Decimal(5, 2), cpifData.adminFeePercent || null);
        request.input('adminFeeIncludedExcluded', sql.NVarChar(255), cpifData.adminFeeIncludedExcluded || null);
        request.input('onboardingFeePercent', sql.Decimal(5, 2), cpifData.onboardingFeePercent || null);
        request.input('onboardingFeeAmount', sql.Decimal(15, 2), cpifData.onboardingFeeAmount || null);
        request.input('suggestedWorkdayParentName', sql.NVarChar(255), cpifData.suggestedWorkdayParentName || null);
        
        // Section 3: Tax Admin
        request.input('elSigned', sql.Bit, cpifData.elSigned || null);
        request.input('authorized7216', sql.Bit, cpifData.authorized7216 || null);
        
        // Section 4: PE & TMS
        request.input('connectedToPEOrTMS', sql.NVarChar(255), cpifData.connectedToPEOrTMS || null);
        request.input('nameOfRelatedPEFundTMSCustomer', sql.NVarChar(500), cpifData.nameOfRelatedPEFundTMSCustomer || null);
        
        // Section 5: Invoice Style & Delivery
        request.input('invoiceType', sql.NVarChar(255), cpifData.invoiceType || null);
        request.input('consolidatedBillingCustomerName', sql.NVarChar(500), cpifData.consolidatedBillingCustomerName || null);
        request.input('consolidatedBillingExistingSchedule', sql.NVarChar(500), cpifData.consolidatedBillingExistingSchedule || null);
        request.input('additionalCustomerContacts', sql.NVarChar(500), cpifData.additionalCustomerContacts || null);
        request.input('additionalCustomerContactEmails', sql.NVarChar(500), cpifData.additionalCustomerContactEmails || null);
        request.input('invoiceRecipientNames', sql.NVarChar(500), cpifData.invoiceRecipientNames || null);
        request.input('invoiceRecipientEmails', sql.NVarChar(500), cpifData.invoiceRecipientEmails || null);
        
        // Section 6: Engagement Letter
        request.input('partnerSigningEL', sql.NVarChar(255), cpifData.partnerSigningEL || null);
        request.input('consultingServicesDescription', sql.NVarChar(500), cpifData.consultingServicesDescription || null);
        
        // Section 7: Pete Klinger
        request.input('documentDelivery', sql.NVarChar(255), cpifData.documentDelivery || null);
        request.input('invoiceMemo', sql.NVarChar(255), cpifData.invoiceMemo || null);
        request.input('billToContact', sql.NVarChar(255), cpifData.billToContact || null);
        
        // Section 8: Revenue Forecast
        request.input('october2025', sql.Decimal(15, 2), cpifData.october2025 || null);
        request.input('november2025', sql.Decimal(15, 2), cpifData.november2025 || null);
        request.input('december2025', sql.Decimal(15, 2), cpifData.december2025 || null);
        request.input('january2026', sql.Decimal(15, 2), cpifData.january2026 || null);
        request.input('february2026', sql.Decimal(15, 2), cpifData.february2026 || null);
        request.input('march2026', sql.Decimal(15, 2), cpifData.march2026 || null);
        request.input('april2026', sql.Decimal(15, 2), cpifData.april2026 || null);
        request.input('may2026', sql.Decimal(15, 2), cpifData.may2026 || null);
        request.input('june2026', sql.Decimal(15, 2), cpifData.june2026 || null);
        request.input('july2026', sql.Decimal(15, 2), cpifData.july2026 || null);
        request.input('august2026', sql.Decimal(15, 2), cpifData.august2026 || null);
        request.input('september2026', sql.Decimal(15, 2), cpifData.september2026 || null);
        request.input('balance', sql.Decimal(15, 2), cpifData.balance || null);
        
        // Section 9: Onboarding
        request.input('accountGUID', sql.NVarChar(255), cpifData.accountGUID || null);
        request.input('opportunityGUID', sql.NVarChar(255), cpifData.opportunityGUID || null);
        request.input('opportunityName', sql.NVarChar(255), cpifData.opportunityName || null);
        
        const result = await request.query(`
          UPDATE CPIFDocuments SET
            timestamp = @timestamp, createdBy = @createdBy, wizardType = @wizardType, ocId = @ocId, status = @status, lastModified = @lastModified, version = @version, displayOrder = @displayOrder,
            newAccountLegalName = @newAccountLegalName, primaryContactName = @primaryContactName, primaryContactTitle = @primaryContactTitle, primaryContactEmailAddress = @primaryContactEmailAddress, industry = @industry, entityType = @entityType, address = @address, city = @city, state = @state, zipCode = @zipCode, productService = @productService, estOpptyValue = @estOpptyValue, opportunityPartner = @opportunityPartner, taxDeliveryPartner = @taxDeliveryPartner, bdSalesSupport = @bdSalesSupport, leadSource = @leadSource, leadSourceDetails = @leadSourceDetails, lsFreeText = @lsFreeText, referringEmployee = @referringEmployee,
            needProjectInWorkday = @needProjectInWorkday, customerCollectionsLead = @customerCollectionsLead, projectDeliveryLead = @projectDeliveryLead, projectManager = @projectManager, asstProjectManager = @asstProjectManager, projectBillingSpecialist = @projectBillingSpecialist, serviceCode = @serviceCode, taxYearEnd = @taxYearEnd, renewableProject = @renewableProject, projectStartDate = @projectStartDate, projectEndDate = @projectEndDate, taxForm = @taxForm, nextDueDate = @nextDueDate, dateOfDeath = @dateOfDeath, contractType = @contractType, totalEstimatedHours = @totalEstimatedHours, estimatedRealizationYear1 = @estimatedRealizationYear1, contractRateSheet = @contractRateSheet, totalContractAmount = @totalContractAmount, adminFeePercent = @adminFeePercent, adminFeeIncludedExcluded = @adminFeeIncludedExcluded, onboardingFeePercent = @onboardingFeePercent, onboardingFeeAmount = @onboardingFeeAmount, suggestedWorkdayParentName = @suggestedWorkdayParentName,
            elSigned = @elSigned, authorized7216 = @authorized7216,
            connectedToPEOrTMS = @connectedToPEOrTMS, nameOfRelatedPEFundTMSCustomer = @nameOfRelatedPEFundTMSCustomer,
            invoiceType = @invoiceType, consolidatedBillingCustomerName = @consolidatedBillingCustomerName, consolidatedBillingExistingSchedule = @consolidatedBillingExistingSchedule, additionalCustomerContacts = @additionalCustomerContacts, additionalCustomerContactEmails = @additionalCustomerContactEmails, invoiceRecipientNames = @invoiceRecipientNames, invoiceRecipientEmails = @invoiceRecipientEmails,
            partnerSigningEL = @partnerSigningEL, consultingServicesDescription = @consultingServicesDescription,
            documentDelivery = @documentDelivery, invoiceMemo = @invoiceMemo, billToContact = @billToContact,
            october2025 = @october2025, november2025 = @november2025, december2025 = @december2025, january2026 = @january2026, february2026 = @february2026, march2026 = @march2026, april2026 = @april2026, may2026 = @may2026, june2026 = @june2026, july2026 = @july2026, august2026 = @august2026, september2026 = @september2026, balance = @balance,
            accountGUID = @accountGUID, opportunityGUID = @opportunityGUID, opportunityName = @opportunityName
          WHERE id = @id
        `);

        console.log('DatabaseService: Successfully updated CPIF document:', id);
        return cpifData;
        
      } catch (error: any) {
        console.error(`DatabaseService: Update attempt ${attempt} failed:`, error);
        
        if (error.code === 'ECONNCLOSED' || error.message?.includes('Connection is closed')) {
          console.log('DatabaseService: Connection closed, resetting pool...');
          this.pool = null;
        }
        
        if (attempt === maxRetries) {
          console.error('DatabaseService: All update attempts failed');
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    
    throw new Error('Unexpected error: updateCPIF failed after all retries');
  }

  async getCPIF(id: string): Promise<CPIFDocument | null> {
    try {
    await this.connect();
    
    if (!this.pool) {
        throw new Error('Database connection pool is null');
    }

    const request = this.pool.request();
      request.input('id', sql.NVarChar(255), id);
      
      const result = await request.query('SELECT * FROM CPIFDocuments WHERE id = @id');

    if (result.recordset.length === 0) {
      return null;
    }

      const row = result.recordset[0];
      return this.mapRowToCPIFDocument(row);
      
    } catch (error) {
      console.error('DatabaseService: Failed to get CPIF document:', error);
      throw error;
    }
  }

  async getAllCPIFs(): Promise<CPIFDocument[]> {
    try {
    await this.connect();
    
    if (!this.pool) {
        throw new Error('Database connection pool is null');
    }

    const request = this.pool.request();
      const result = await request.query('SELECT * FROM CPIFDocuments ORDER BY displayOrder, timestamp');
      
      return result.recordset.map(row => this.mapRowToCPIFDocument(row));
      
    } catch (error) {
      console.error('DatabaseService: Failed to get all CPIF documents:', error);
      throw error;
    }
  }

  async deleteCPIF(id: string): Promise<void> {
    try {
    await this.connect();
    
    if (!this.pool) {
        throw new Error('Database connection pool is null');
    }

    const request = this.pool.request();
      request.input('id', sql.NVarChar(255), id);
      
      await request.query('DELETE FROM CPIFDocuments WHERE id = @id');
      
    } catch (error) {
      console.error('DatabaseService: Failed to delete CPIF document:', error);
      throw error;
    }
  }

  private mapRowToCPIFDocument(row: any): CPIFDocument {
    return {
      id: row.id,
      timestamp: row.timestamp?.toISOString() || new Date().toISOString(),
      createdBy: row.createdBy,
      wizardType: row.wizardType,
      ocId: row.ocId,
      status: row.status,
      lastModified: row.lastModified?.toISOString() || new Date().toISOString(),
      version: row.version,
      displayOrder: row.displayOrder,
      
      // Section 1: CRM Pipeline
      newAccountLegalName: row.newAccountLegalName,
      primaryContactName: row.primaryContactName,
      primaryContactTitle: row.primaryContactTitle,
      primaryContactEmailAddress: row.primaryContactEmailAddress,
      industry: row.industry,
      entityType: row.entityType,
      address: row.address,
      city: row.city,
      state: row.state,
      zipCode: row.zipCode,
      productService: row.productService,
      estOpptyValue: row.estOpptyValue,
      opportunityPartner: row.opportunityPartner,
      taxDeliveryPartner: row.taxDeliveryPartner,
      bdSalesSupport: row.bdSalesSupport,
      leadSource: row.leadSource,
      leadSourceDetails: row.leadSourceDetails,
      lsFreeText: row.lsFreeText,
      referringEmployee: row.referringEmployee,
      
      // Section 2: Workday Project & Contract
      needProjectInWorkday: row.needProjectInWorkday,
      customerCollectionsLead: row.customerCollectionsLead,
      projectDeliveryLead: row.projectDeliveryLead,
      projectManager: row.projectManager,
      asstProjectManager: row.asstProjectManager,
      projectBillingSpecialist: row.projectBillingSpecialist,
      serviceCode: row.serviceCode,
      taxYearEnd: row.taxYearEnd,
      renewableProject: row.renewableProject,
      projectStartDate: row.projectStartDate?.toISOString().split('T')[0],
      projectEndDate: row.projectEndDate?.toISOString().split('T')[0],
      taxForm: row.taxForm,
      nextDueDate: row.nextDueDate?.toISOString().split('T')[0],
      dateOfDeath: row.dateOfDeath?.toISOString().split('T')[0],
      contractType: row.contractType,
      totalEstimatedHours: row.totalEstimatedHours,
      estimatedRealizationYear1: row.estimatedRealizationYear1,
      contractRateSheet: row.contractRateSheet,
      totalContractAmount: row.totalContractAmount,
      adminFeePercent: row.adminFeePercent,
      adminFeeIncludedExcluded: row.adminFeeIncludedExcluded,
      onboardingFeePercent: row.onboardingFeePercent,
      onboardingFeeAmount: row.onboardingFeeAmount,
      suggestedWorkdayParentName: row.suggestedWorkdayParentName,
      
      // Section 3: Tax Admin
      elSigned: row.elSigned,
      authorized7216: row.authorized7216,
      
      // Section 4: PE & TMS
      connectedToPEOrTMS: row.connectedToPEOrTMS,
      nameOfRelatedPEFundTMSCustomer: row.nameOfRelatedPEFundTMSCustomer,
      
      // Section 5: Invoice Style & Delivery
      invoiceType: row.invoiceType,
      consolidatedBillingCustomerName: row.consolidatedBillingCustomerName,
      consolidatedBillingExistingSchedule: row.consolidatedBillingExistingSchedule,
      additionalCustomerContacts: row.additionalCustomerContacts,
      additionalCustomerContactEmails: row.additionalCustomerContactEmails,
      invoiceRecipientNames: row.invoiceRecipientNames,
      invoiceRecipientEmails: row.invoiceRecipientEmails,
      
      // Section 6: Engagement Letter
      partnerSigningEL: row.partnerSigningEL,
      consultingServicesDescription: row.consultingServicesDescription,
      
      // Section 7: Pete Klinger
      documentDelivery: row.documentDelivery,
      invoiceMemo: row.invoiceMemo,
      billToContact: row.billToContact,
      
      // Section 8: Revenue Forecast
      october2025: row.october2025,
      november2025: row.november2025,
      december2025: row.december2025,
      january2026: row.january2026,
      february2026: row.february2026,
      march2026: row.march2026,
      april2026: row.april2026,
      may2026: row.may2026,
      june2026: row.june2026,
      july2026: row.july2026,
      august2026: row.august2026,
      september2026: row.september2026,
      balance: row.balance,
      
      // Section 9: Onboarding
      accountGUID: row.accountGUID,
      opportunityGUID: row.opportunityGUID,
      opportunityName: row.opportunityName
    };
  }

  private async isConnectionHealthy(): Promise<boolean> {
    if (!this.pool || !this.pool.connected) {
      return false;
    }
    
    try {
      // Test the connection with a simple query
      const request = this.pool.request();
      await request.query('SELECT 1 as test');
      return true;
    } catch (error) {
      console.log('DatabaseService: Connection health check failed:', error);
      return false;
    }
  }

  async close(): Promise<void> {
    if (this.pool) {
      try {
        await this.pool.close();
        console.log('DatabaseService: Connection pool closed');
      } catch (error) {
        console.error('DatabaseService: Error closing connection pool:', error);
      }
      this.pool = null;
    }
  }
}

export const databaseService = new DatabaseService();
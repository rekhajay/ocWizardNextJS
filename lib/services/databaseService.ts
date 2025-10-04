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

  async connect(): Promise<void> {
    // Check if pool exists and is connected
    if (this.pool && this.pool.connected) {
      return;
    }

    // Close existing pool if it exists but is not connected
    if (this.pool) {
      try {
        await this.pool.close();
      } catch (error) {
        console.log('Error closing existing pool:', error);
      }
      this.pool = null;
    }

    try {
      const config = getConfig();
      this.pool = new sql.ConnectionPool(config);
      await this.pool.connect();
      console.log('Successfully connected to Azure SQL Database using OAuth');
    } catch (error) {
      console.error('Failed to connect to Azure SQL Database:', error);
      this.pool = null;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.close();
      this.pool = null;
    }
  }

  async saveCPIF(cpifData: CPIFDocument): Promise<string> {
    console.log('DatabaseService: Starting saveCPIF');
    console.log('DatabaseService: Environment variables check:', {
      server: process.env.SQL_SERVER,
      database: process.env.SQL_DATABASE,
      clientId: process.env.AZURE_CLIENT_ID ? 'SET' : 'NOT SET',
      clientSecret: process.env.AZURE_CLIENT_SECRET ? 'SET' : 'NOT SET',
      tenantId: process.env.AZURE_TENANT_ID ? 'SET' : 'NOT SET'
    });
    
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.connect();
        console.log('DatabaseService: Connection established successfully');
        
        if (!this.pool) {
          throw new Error('Database connection not established');
        }

        const request = this.pool.request();
        
        // Generate a new UUID for the database (ignore the temp ID from frontend)
        const dbId = `cpif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        console.log('DatabaseService: Generated new ID:', dbId);
        
        // Insert CPIF document
        console.log('DatabaseService: Starting SQL INSERT...');
        const result = await request
          .input('id', sql.VarChar(50), dbId)
          .input('timestamp', sql.DateTime2, cpifData.timestamp)
          .input('createdBy', sql.VarChar(100), cpifData.createdBy)
          .input('wizardType', sql.VarChar(100), cpifData.wizardType)
          .input('ocId', sql.VarChar(50), cpifData.ocId || null)
          .input('status', sql.VarChar(50), cpifData.status)
          .input('lastModified', sql.DateTime2, cpifData.lastModified)
          .input('version', sql.Int, cpifData.version)
          .input('accountInfo', sql.NVarChar(sql.MAX), JSON.stringify(cpifData.accountInfo))
          .input('workdayInfo', sql.NVarChar(sql.MAX), JSON.stringify(cpifData.workdayInfo))
          .input('taxAdmin', sql.NVarChar(sql.MAX), JSON.stringify(cpifData.taxAdmin))
          .input('peTms', sql.NVarChar(sql.MAX), JSON.stringify(cpifData.peTms))
          .input('invoice', sql.NVarChar(sql.MAX), JSON.stringify(cpifData.invoice))
          .input('engagement', sql.NVarChar(sql.MAX), JSON.stringify(cpifData.engagement))
          .input('peteKlinger', sql.NVarChar(sql.MAX), JSON.stringify(cpifData.peteKlinger))
          .input('revenueForecast', sql.NVarChar(sql.MAX), JSON.stringify(cpifData.revenueForecast))
          .input('onboarding', sql.NVarChar(sql.MAX), JSON.stringify(cpifData.onboarding))
          .query(`
            INSERT INTO CPIFDocuments (
              id, timestamp, createdBy, wizardType, ocId, status, lastModified, version,
              accountInfo, workdayInfo, taxAdmin, peTms, invoice,
              engagement, peteKlinger, revenueForecast, onboarding
            ) VALUES (
              @id, @timestamp, @createdBy, @wizardType, @ocId, @status, @lastModified, @version,
              @accountInfo, @workdayInfo, @taxAdmin, @peTms, @invoice,
              @engagement, @peteKlinger, @revenueForecast, @onboarding
            )
          `);
        
        console.log('DatabaseService: SQL INSERT completed successfully');
        return dbId;
      } catch (error: any) {
        lastError = error;
        console.error(`DatabaseService: Save attempt ${attempt} failed:`, error?.message);
        
        // If it's a connection error, reset the pool
        if (error?.code === 'ECONNCLOSED' || error?.message?.includes('Connection is closed')) {
          console.log('DatabaseService: Connection closed, resetting pool...');
          this.pool = null;
        }
        
        // If this is the last attempt, throw the error
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  async getCPIF(id: string): Promise<CPIFDocument | null> {
    await this.connect();
    
    if (!this.pool) {
      throw new Error('Database connection not established');
    }

    const request = this.pool.request();
    const result = await request
      .input('id', sql.VarChar(50), id)
      .query('SELECT * FROM CPIFDocuments WHERE id = @id');

    if (result.recordset.length === 0) {
      return null;
    }

    const record = result.recordset[0];
    return {
      id: record.id,
      timestamp: record.timestamp,
      createdBy: record.createdBy,
      wizardType: record.wizardType,
      ocId: record.ocId,
      status: record.status,
      lastModified: record.lastModified,
      version: record.version,
      accountInfo: JSON.parse(record.accountInfo),
      workdayInfo: JSON.parse(record.workdayInfo),
      taxAdmin: JSON.parse(record.taxAdmin),
      peTms: JSON.parse(record.peTms),
      invoice: JSON.parse(record.invoice),
      engagement: JSON.parse(record.engagement),
      peteKlinger: JSON.parse(record.peteKlinger),
      revenueForecast: JSON.parse(record.revenueForecast),
      onboarding: JSON.parse(record.onboarding),
    };
  }

  async getAllCPIFs(): Promise<CPIFDocument[]> {
    await this.connect();
    
    if (!this.pool) {
      throw new Error('Database connection not established');
    }

    const request = this.pool.request();
    const result = await request.query('SELECT * FROM CPIFDocuments ORDER BY lastModified DESC');

    return result.recordset.map(record => ({
      id: record.id,
      timestamp: record.timestamp,
      createdBy: record.createdBy,
      wizardType: record.wizardType,
      ocId: record.ocId,
      status: record.status,
      lastModified: record.lastModified,
      version: record.version,
      accountInfo: JSON.parse(record.accountInfo),
      workdayInfo: JSON.parse(record.workdayInfo),
      taxAdmin: JSON.parse(record.taxAdmin),
      peTms: JSON.parse(record.peTms),
      invoice: JSON.parse(record.invoice),
      engagement: JSON.parse(record.engagement),
      peteKlinger: JSON.parse(record.peteKlinger),
      revenueForecast: JSON.parse(record.revenueForecast),
      onboarding: JSON.parse(record.onboarding),
    }));
  }

  async updateCPIF(cpifData: CPIFDocument): Promise<void> {
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.connect();
        
        if (!this.pool) {
          throw new Error('Database connection not established');
        }

        const request = this.pool.request();
        await request
          .input('id', sql.VarChar(50), cpifData.id)
          .input('timestamp', sql.DateTime2, cpifData.timestamp)
          .input('createdBy', sql.VarChar(100), cpifData.createdBy)
          .input('wizardType', sql.VarChar(100), cpifData.wizardType)
          .input('ocId', sql.VarChar(50), cpifData.ocId || null)
          .input('status', sql.VarChar(50), cpifData.status)
          .input('lastModified', sql.DateTime2, cpifData.lastModified)
          .input('version', sql.Int, cpifData.version)
          .input('accountInfo', sql.NVarChar(sql.MAX), JSON.stringify(cpifData.accountInfo))
          .input('workdayInfo', sql.NVarChar(sql.MAX), JSON.stringify(cpifData.workdayInfo))
          .input('taxAdmin', sql.NVarChar(sql.MAX), JSON.stringify(cpifData.taxAdmin))
          .input('peTms', sql.NVarChar(sql.MAX), JSON.stringify(cpifData.peTms))
          .input('invoice', sql.NVarChar(sql.MAX), JSON.stringify(cpifData.invoice))
          .input('engagement', sql.NVarChar(sql.MAX), JSON.stringify(cpifData.engagement))
          .input('peteKlinger', sql.NVarChar(sql.MAX), JSON.stringify(cpifData.peteKlinger))
          .input('revenueForecast', sql.NVarChar(sql.MAX), JSON.stringify(cpifData.revenueForecast))
          .input('onboarding', sql.NVarChar(sql.MAX), JSON.stringify(cpifData.onboarding))
          .query(`
            UPDATE CPIFDocuments SET
              timestamp = @timestamp,
              createdBy = @createdBy,
              wizardType = @wizardType,
              ocId = @ocId,
              status = @status,
              lastModified = @lastModified,
              version = @version,
              accountInfo = @accountInfo,
              workdayInfo = @workdayInfo,
              taxAdmin = @taxAdmin,
              peTms = @peTms,
              invoice = @invoice,
              engagement = @engagement,
              peteKlinger = @peteKlinger,
              revenueForecast = @revenueForecast,
              onboarding = @onboarding
            WHERE id = @id
          `);
        
        console.log('DatabaseService: Successfully updated CPIF document');
        return; // Success, exit retry loop
      } catch (error: any) {
        lastError = error;
        console.error(`DatabaseService: Update attempt ${attempt} failed:`, error?.message);
        
        // If it's a connection error, reset the pool
        if (error?.code === 'ECONNCLOSED' || error?.message?.includes('Connection is closed')) {
          console.log('DatabaseService: Connection closed, resetting pool...');
          this.pool = null;
        }
        
        // If this is the last attempt, throw the error
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  async deleteCPIF(id: string): Promise<void> {
    await this.connect();
    
    if (!this.pool) {
      throw new Error('Database connection not established');
    }

    const request = this.pool.request();
    await request
      .input('id', sql.VarChar(50), id)
      .query('DELETE FROM CPIFDocuments WHERE id = @id');
  }
}

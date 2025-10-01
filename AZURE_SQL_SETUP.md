# Azure SQL Database Setup Guide

## 1. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Azure App Registration Configuration (for OAuth authentication)
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
AZURE_TENANT_ID=your-tenant-id

# SQL Server Configuration
SQL_SERVER=your-server.database.windows.net
SQL_DATABASE=your-database-name

# Optional: Connection timeout (in milliseconds)
AZURE_SQL_CONNECTION_TIMEOUT=30000

# Optional: Request timeout (in milliseconds)
AZURE_SQL_REQUEST_TIMEOUT=30000
```

## 2. Database Setup

Run the SQL script in `sql/create-cpif-table.sql` on your Azure SQL Database to create the required table and indexes.

## 3. Azure SQL Database Configuration

### Firewall Rules
Make sure to add your IP address to the Azure SQL Database firewall rules, or enable "Allow Azure services and resources to access this server" if running on Azure.

### Connection String Format
The connection uses the following format:
```
Server=your-server.database.windows.net;Database=your-database-name;User Id=your-username;Password=your-password;Encrypt=true;TrustServerCertificate=false
```

## 4. Testing the Connection

You can test the database connection by:
1. Starting the development server: `npm run dev`
2. Opening the wizard and filling out the form
3. Clicking "Save CPIF" - it should save to the Azure SQL Database

## 5. API Endpoints

The following API endpoints are available:

- `POST /api/cpif` - Create new CPIF document
- `GET /api/cpif` - Get all CPIF documents
- `GET /api/cpif/[id]` - Get specific CPIF document
- `PUT /api/cpif/[id]` - Update CPIF document
- `DELETE /api/cpif/[id]` - Delete CPIF document

## 6. Troubleshooting

### Common Issues:
1. **Connection timeout**: Increase `AZURE_SQL_CONNECTION_TIMEOUT`
2. **Authentication failed**: Check username/password
3. **Server not found**: Verify server name and firewall rules
4. **Table doesn't exist**: Run the SQL script to create the table

### Logs:
Check the browser console and server logs for detailed error messages.

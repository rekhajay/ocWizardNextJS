import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    server: process.env.SQL_SERVER,
    database: process.env.SQL_DATABASE,
    clientId: process.env.AZURE_CLIENT_ID ? 'SET' : 'NOT SET',
    clientSecret: process.env.AZURE_CLIENT_SECRET ? 'SET' : 'NOT SET',
    tenantId: process.env.AZURE_TENANT_ID ? 'SET' : 'NOT SET',
    allEnvVars: Object.keys(process.env).filter(key => 
      key.includes('SQL_') || key.includes('AZURE_')
    )
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/services/databaseService';
import { CPIFDocument } from '@/lib/types/cpif';

const dbService = new DatabaseService();

// GET /api/cpif - Get all CPIF documents
export async function GET() {
  try {
    const cpifs = await dbService.getAllCPIFs();
    return NextResponse.json({ success: true, data: cpifs });
  } catch (error: any) {
    console.error('Error fetching CPIF documents:', error);
    return NextResponse.json(
      { success: false, error: `Failed to fetch CPIF documents: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// POST /api/cpif - Create new CPIF document
export async function POST(request: NextRequest) {
  try {
    console.log('API: Starting CPIF save process');
    const cpifData: CPIFDocument = await request.json();
    console.log('API: Received CPIF data:', cpifData.id);
    console.log('API: Full CPIF data structure:', JSON.stringify(cpifData, null, 2));
    
    // Validate required fields
    if (!cpifData.id || !cpifData.createdBy || !cpifData.wizardType) {
      console.log('API: Missing required fields - id:', !!cpifData.id, 'createdBy:', !!cpifData.createdBy, 'wizardType:', !!cpifData.wizardType);
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('API: Attempting to save to database...');
    console.log('API: Environment check - SQL_SERVER:', process.env.SQL_SERVER ? 'SET' : 'NOT SET');
    console.log('API: Environment check - SQL_DATABASE:', process.env.SQL_DATABASE ? 'SET' : 'NOT SET');
    
    const savedId = await dbService.saveCPIF(cpifData);
    console.log('API: Successfully saved CPIF with ID:', savedId);
    
    // Return the full saved document
    const savedDocument = { ...cpifData, id: savedId };
    return NextResponse.json({ success: true, data: savedDocument });
  } catch (error: any) {
    console.error('API: Error saving CPIF document:', error);
    console.error('API: Error stack:', error?.stack);
    console.error('API: Error details:', error?.message || 'Unknown error');
    return NextResponse.json(
      { success: false, error: `Failed to save CPIF document: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

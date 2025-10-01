import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/services/databaseService';
import { CPIFDocument } from '@/lib/types/cpif';

const dbService = new DatabaseService();

// GET /api/cpif - Get all CPIF documents
export async function GET() {
  try {
    const cpifs = await dbService.getAllCPIFs();
    return NextResponse.json({ success: true, data: cpifs });
  } catch (error) {
    console.error('Error fetching CPIF documents:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch CPIF documents' },
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
    
    // Validate required fields
    if (!cpifData.id || !cpifData.createdBy || !cpifData.wizardType) {
      console.log('API: Missing required fields');
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('API: Attempting to save to database...');
    const savedId = await dbService.saveCPIF(cpifData);
    console.log('API: Successfully saved CPIF with ID:', savedId);
    return NextResponse.json({ success: true, data: { id: savedId } });
  } catch (error) {
    console.error('API: Error saving CPIF document:', error);
    console.error('API: Error details:', error.message);
    return NextResponse.json(
      { success: false, error: `Failed to save CPIF document: ${error.message}` },
      { status: 500 }
    );
  }
}

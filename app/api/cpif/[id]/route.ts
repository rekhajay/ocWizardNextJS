import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/services/databaseService';
import { CPIFDocument } from '@/lib/types/cpif';

const dbService = new DatabaseService();

// GET /api/cpif/[id] - Get specific CPIF document
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cpif = await dbService.getCPIF(params.id);
    
    if (!cpif) {
      return NextResponse.json(
        { success: false, error: 'CPIF document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: cpif });
  } catch (error: any) {
    console.error('Error fetching CPIF document:', error);
    return NextResponse.json(
      { success: false, error: `Failed to fetch CPIF document: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// PUT /api/cpif/[id] - Update CPIF document
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cpifData: CPIFDocument = await request.json();
    
    // Ensure the ID matches the URL parameter
    cpifData.id = params.id;
    
    await dbService.updateCPIF(params.id, cpifData);
    return NextResponse.json({ success: true, data: { id: params.id } });
  } catch (error: any) {
    console.error('Error updating CPIF document:', error);
    return NextResponse.json(
      { success: false, error: `Failed to update CPIF document: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// DELETE /api/cpif/[id] - Delete CPIF document
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbService.deleteCPIF(params.id);
    return NextResponse.json({ success: true, data: { id: params.id } });
  } catch (error: any) {
    console.error('Error deleting CPIF document:', error);
    return NextResponse.json(
      { success: false, error: `Failed to delete CPIF document: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

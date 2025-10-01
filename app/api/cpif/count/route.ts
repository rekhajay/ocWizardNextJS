import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/services/databaseService';

const dbService = new DatabaseService();

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// GET /api/cpif/count?ocId=OC-GOPI-1 - Get count of wizard rows for a specific OC
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ocId = searchParams.get('ocId');
    
    if (!ocId) {
      return NextResponse.json(
        { success: false, error: 'ocId parameter is required' },
        { status: 400 }
      );
    }

    // Get all CPIF documents and filter by ocId
    const cpifs = await dbService.getAllCPIFs();
    const filteredCpifs = cpifs.filter(cpif => cpif.ocId === ocId);
    
    return NextResponse.json({ 
      success: true, 
      data: { 
        ocId, 
        count: filteredCpifs.length,
        hasRows: filteredCpifs.length > 0
      } 
    });
  } catch (error: any) {
    console.error('Error getting CPIF count:', error);
    return NextResponse.json(
      { success: false, error: `Failed to get CPIF count: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

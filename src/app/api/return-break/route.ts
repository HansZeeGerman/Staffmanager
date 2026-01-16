import { NextResponse } from 'next/server';
import { returnFromBreak } from '@/lib/googleSheets';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { staffName } = await request.json();
        const spreadsheetId = process.env.VITE_GOOGLE_SHEETS_ID || '1aiThC_lypPuYqEDl59-vnSLDFaARCXQItzmNZKwdItE';

        if (!staffName) {
            return NextResponse.json(
                { error: 'Staff name is required' },
                { status: 400 }
            );
        }

        const result = await returnFromBreak(spreadsheetId, staffName);

        if (!result.success) {
            return NextResponse.json(
                { error: result.message },
                { status: 400 }
            );
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Return from break API error:', error);
        return NextResponse.json(
            { error: 'Failed to return from break' },
            { status: 500 }
        );
    }
}

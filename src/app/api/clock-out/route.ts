import { NextRequest, NextResponse } from 'next/server';
import { clockOut } from '@/lib/googleSheets';

export async function POST(request: NextRequest) {
    try {
        const spreadsheetId = process.env.VITE_GOOGLE_SHEETS_ID || '1aiThC_lypPuYqEDl59-vnSLDFaARCXQItzmNZKwdItE';

        if (!spreadsheetId) {
            return NextResponse.json(
                { error: 'Google Sheets ID not configured' },
                { status: 500 }
            );
        }

        const { staffName } = await request.json();

        if (!staffName) {
            return NextResponse.json(
                { error: 'Staff name is required' },
                { status: 400 }
            );
        }

        const result = await clockOut(spreadsheetId, staffName);

        if (!result.success) {
            return NextResponse.json(
                { error: result.message },
                { status: 400 }
            );
        }

        return NextResponse.json({ success: true, message: result.message });
    } catch (error) {
        console.error('Error clocking out:', error);
        return NextResponse.json(
            { error: 'Failed to clock out' },
            { status: 500 }
        );
    }
}

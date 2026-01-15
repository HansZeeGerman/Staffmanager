import { NextResponse } from 'next/server';
import { getCurrentStatus } from '@/lib/googleSheets';

export async function GET() {
    try {
        const spreadsheetId = process.env.VITE_GOOGLE_SHEETS_ID || '1aiThC_lypPuYqEDl59-vnSLDFaARCXQItzmNZKwdItE';

        if (!spreadsheetId) {
            return NextResponse.json(
                { error: 'Google Sheets ID not configured' },
                { status: 500 }
            );
        }

        const status = await getCurrentStatus(spreadsheetId);
        return NextResponse.json(status);
    } catch (error) {
        console.error('Error fetching status:', error);
        return NextResponse.json(
            { error: 'Failed to fetch current status' },
            { status: 500 }
        );
    }
}

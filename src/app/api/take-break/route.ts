import { NextRequest, NextResponse } from 'next/server';
import { takeBreak } from '@/lib/googleSheets';

export async function POST(request: NextRequest) {
    try {
        const spreadsheetId = process.env.VITE_GOOGLE_SHEETS_ID;

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

        const result = await takeBreak(spreadsheetId, staffName);

        if (!result.success) {
            return NextResponse.json(
                { error: result.message },
                { status: 400 }
            );
        }

        return NextResponse.json({ success: true, message: result.message });
    } catch (error) {
        console.error('Error taking break:', error);
        return NextResponse.json(
            { error: 'Failed to start break' },
            { status: 500 }
        );
    }
}

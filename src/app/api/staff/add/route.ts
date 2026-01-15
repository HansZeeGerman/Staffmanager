import { NextRequest, NextResponse } from 'next/server';
import { addStaffMember } from '@/lib/googleSheets';

export async function POST(request: NextRequest) {
    try {
        const spreadsheetId = process.env.VITE_GOOGLE_SHEETS_ID;

        if (!spreadsheetId) {
            return NextResponse.json(
                { error: 'Google Sheets ID not configured' },
                { status: 500 }
            );
        }

        const body = await request.json();
        await addStaffMember(spreadsheetId, body);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error adding staff member:', error);
        return NextResponse.json(
            { error: 'Failed to add staff member' },
            { status: 500 }
        );
    }
}

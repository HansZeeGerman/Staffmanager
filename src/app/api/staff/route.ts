import { NextResponse } from 'next/server';
import { getStaffRoster } from '@/lib/googleSheets';

export async function GET() {
    try {
        const spreadsheetId = process.env.VITE_GOOGLE_SHEETS_ID;

        if (!spreadsheetId) {
            return NextResponse.json(
                { error: 'Google Sheets ID not configured' },
                { status: 500 }
            );
        }

        const staff = await getStaffRoster(spreadsheetId);
        return NextResponse.json(staff);
    } catch (error) {
        console.error('Error fetching staff roster:', error);
        return NextResponse.json(
            { error: 'Failed to fetch staff roster' },
            { status: 500 }
        );
    }
}

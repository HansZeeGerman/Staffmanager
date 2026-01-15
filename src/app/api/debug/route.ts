import { NextResponse } from 'next/server';
import { getGoogleSheetsClient } from '@/lib/googleSheets';

export async function GET() {
    try {
        const spreadsheetId = '1aiThC_lypPuYqEDl59-vnSLDFaARCXQItzmNZKwdItE';

        const sheets = await getGoogleSheetsClient();

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Staff Roster!A1:E20', // Read first 20 rows raw
        });

        return NextResponse.json({
            status: 'Connected',
            sheetId: spreadsheetId,
            range: 'Staff Roster!A1:E20',
            values: response.data.values || 'NO DATA FOUND',
        });
    } catch (error: any) {
        return NextResponse.json({
            status: 'Error',
            message: error.message,
            stack: error.stack,
            envId: process.env.VITE_GOOGLE_SHEETS_ID
        }, { status: 500 });
    }
}

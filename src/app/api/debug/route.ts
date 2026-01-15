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
            connectedEmail: (sheets.context._options.auth as any)?.credentials?.client_email || 'Unknown',
            range: 'Staff Roster!A1:E20',
            values: response.data.values || 'NO DATA FOUND',
        });
    } catch (error: any) {
        // Try to extract email even on error
        let connectedEmail = 'Unknown';
        try {
            const sheets = await getGoogleSheetsClient();
            connectedEmail = (sheets.context._options.auth as any)?.credentials?.client_email || 'Unknown';
        } catch (e) { }

        return NextResponse.json({
            status: 'Error',
            message: error.message,
            connectedEmail, // THIS IS THE KEY
            stack: error.stack,
        }, { status: 500 });
    }
}

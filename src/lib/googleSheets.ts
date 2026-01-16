import { google } from 'googleapis';
import path from 'path';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

function cleanSpreadsheetId(id: string): string {
    // If it's a URL, extract the ID
    const match = id.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : id;
}

// FORCE CORRECT ID - Ignore Environment Variable to fix deployment
const HARDCODED_SPREADSHEET_ID = '1aiThC_lypPuYqEDl59-vnSLDFaARCXQItzmNZKwdItE';

export async function getGoogleSheetsClient() {
    const authOptions: any = {
        scopes: SCOPES,
        credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS!),
    };

    if (process.env.GOOGLE_CREDENTIALS) {
        // Production: Parse stringified JSON from ENV
        try {
            authOptions.credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
        } catch (e) {
            console.error('Failed to parse GOOGLE_CREDENTIALS', e);
        }
    } else {
        // Development: Local file
        authOptions.keyFile = path.join(process.cwd(), 'credentials.json');
    }

    const auth = new google.auth.GoogleAuth(authOptions);

    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient as any });

    return sheets;
}

// Simplified Staff interface for roster
export interface StaffRoster {
    name: string;
    department: string;
    position: string;
    hourlyWage: number;
    status: string;
}

// Time entry interface
export interface TimeEntry {
    date: string;
    staffName: string;
    department: string;
    position: string;
    signIn: string;
    signOut?: string;
    hoursWorked?: number;
    hourlyWage: number;
    payForDay?: number;
    status: 'Working' | 'On a Break' | 'Finished';
    notes?: string;
}

// Get all staff from Staff Roster sheet
export async function getStaffRoster(spreadsheetId: string): Promise<StaffRoster[]> {
    // IGNORE ARGUMENT, USE HARDCODED ID
    spreadsheetId = HARDCODED_SPREADSHEET_ID;
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Staff Roster!A2:E',
    });

    const rows = response.data.values || [];

    return rows.map(row => ({
        name: (row[0] || '').trim(), // Trim whitespace from names
        department: row[1] || '',
        position: row[2] || '',
        hourlyWage: parseFloat(row[3]?.toString().replace(/[^0-9.]/g, '') || '0') || 0,
        status: row[4] || 'Active',
    })).filter(staff => staff.name); // Filter out empty rows
}

// Clock In - Add new entry to staff's sheet
export async function clockIn(
    spreadsheetId: string,
    staffName: string
): Promise<{ success: boolean; message: string }> {
    try {
        spreadsheetId = HARDCODED_SPREADSHEET_ID;
        staffName = staffName.trim(); // Remove leading/trailing whitespace
        const sheets = await getGoogleSheetsClient();

        // Get staff info from roster
        const roster = await getStaffRoster(spreadsheetId);
        const staff = roster.find(s => s.name === staffName);

        if (!staff) {
            return { success: false, message: 'Staff member not found' };
        }

        // Check if already clocked in today
        const today = new Date().toLocaleDateString('en-US');
        const sheetData = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `'${staffName}'!A2:C100`,
        });

        const existingEntries = sheetData.data.values || [];
        const todayEntry = existingEntries.find(row => {
            const rowDate = row[0] ? new Date(row[0]).toLocaleDateString('en-US') : '';
            return rowDate === today && row[1] && !row[2]; // Has sign in but no sign out
        });

        if (todayEntry) {
            return { success: false, message: 'Already clocked in today!' };
        }

        // Add new row with today's date and current time
        const now = new Date();
        const values = [
            [
                now.toLocaleDateString('en-US'), // Date
                now.toLocaleTimeString('en-US'), // Sign In
                '', // Sign Out (empty)
                null, // Hours (FORMULA)
                staff.hourlyWage, // Hourly Wage
                null, // Pay (FORMULA)
                null, // Cumulative Pay (FORMULA)
                '' // Notes
            ]
        ];

        // Update Staff Specific Sheet
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `'${staffName}'!A:H`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values },
        });

        // Update Dashboard Sheet (Code_v12.gs structure)
        const dashboardValues = [
            [
                now.toLocaleDateString('en-US'), // A: Date
                staff.name,                      // B: Staff Name
                staff.department,                // C: Department
                staff.position,                  // D: Position
                now.toLocaleTimeString('en-US'), // E: Sign In
                '',                              // F: Sign Out
                null,                            // G: Hours Worked (FORMULA)
                staff.hourlyWage,                // H: Hourly Wage
                null,                            // I: Pay for Day (FORMULA)
                'Working',                       // J: Status
                ''                               // K: Notes
            ]
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Dashboard!A:K',
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: dashboardValues },
        });

        return { success: true, message: `Clocked in at ${now.toLocaleTimeString('en-US')}` };
    } catch (error: any) {
        console.error('Clock in error:', error);
        return { success: false, message: error.message || 'Error clocking in' };
    }
}

// Take Break - Update status and create BreakTimes entry
export async function takeBreak(
    spreadsheetId: string,
    staffName: string
): Promise<{ success: boolean; message: string }> {
    try {
        spreadsheetId = HARDCODED_SPREADSHEET_ID;
        staffName = staffName.trim();
        const sheets = await getGoogleSheetsClient();
        const today = new Date().toLocaleDateString('en-US');
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US');

        // Get staff info for department
        const staffData = await getStaffRoster(spreadsheetId);
        const staffInfo = staffData.find(s => s.name === staffName);
        const department = staffInfo?.department || '';

        // Update Dashboard Status to "On a Break"
        const dashboardData = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Dashboard!A2:J1000',
        });

        const dashboardEntries = dashboardData.data.values || [];
        let dashboardRowIndex = -1;

        for (let i = dashboardEntries.length - 1; i >= 0; i--) {
            const rowDate = dashboardEntries[i][0] ? new Date(dashboardEntries[i][0]).toLocaleDateString('en-US') : '';
            if (rowDate === today && dashboardEntries[i][1] === staffName && dashboardEntries[i][9] === 'Working') {
                dashboardRowIndex = i + 2;
                break;
            }
        }

        if (dashboardRowIndex === -1) {
            return { success: false, message: 'No active shift found to take break from!' };
        }

        // Update Dashboard status to "On a Break"
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Dashboard!J${dashboardRowIndex}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [['On a Break']] },
        });

        // Create new row in BreakTimes sheet
        const breakTimesRow = [
            today,              // Date
            staffName,          // Staff Name
            department,         // Department
            timeStr,            // Break Start
            '',                 // Break End (empty until return)
            '',                 // Duration (empty until return)
            ''                  // Notes
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'BreakTimes!A:G',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [breakTimesRow]
            }
        });

        return { success: true, message: `Break started at ${timeStr}` };
    } catch (error: any) {
        console.error('Break error:', error);
        return { success: false, message: `Error starting break: ${error.message}` };
    }
}

// Return from Break - Update BreakTimes and accumulate break duration in Notes
export async function returnFromBreak(
    spreadsheetId: string,
    staffName: string
): Promise<{ success: boolean; message: string; breakDuration?: number }> {
    try {
        spreadsheetId = HARDCODED_SPREADSHEET_ID;
        staffName = staffName.trim();
        const sheets = await getGoogleSheetsClient();
        const today = new Date().toLocaleDateString('en-US');
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US');

        // Find active break in BreakTimes sheet (Break End is empty)
        const breakTimesData = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'BreakTimes!A2:G1000',
        });

        const breakEntries = breakTimesData.data.values || [];
        let breakRowIndex = -1;
        let breakStartTime: string | null = null;

        for (let i = breakEntries.length - 1; i >= 0; i--) {
            const rowDate = breakEntries[i][0] ? new Date(breakEntries[i][0]).toLocaleDateString('en-US') : '';
            if (rowDate === today && breakEntries[i][1] === staffName && !breakEntries[i][4]) {
                breakRowIndex = i + 2;
                breakStartTime = breakEntries[i][3]; // Break Start column
                break;
            }
        }

        if (breakRowIndex === -1 || !breakStartTime) {
            return { success: false, message: 'No active break found!' };
        }

        // Calculate break duration in minutes
        let breakDurationMinutes = 0;
        try {
            const breakStart = new Date(`1/1/2000 ${breakStartTime}`);
            const breakEnd = new Date(`1/1/2000 ${timeStr}`);
            breakDurationMinutes = Math.round((breakEnd.getTime() - breakStart.getTime()) / 60000);
        } catch (e) {
            console.error('Error calculating break duration:', e);
            breakDurationMinutes = 0;
        }

        // Update BreakTimes row with end time and duration
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `BreakTimes!E${breakRowIndex}:F${breakRowIndex}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[timeStr, breakDurationMinutes]]
            },
        });

        // Find Dashboard row and update status + accumulate break time in Notes
        const dashboardData = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Dashboard!A2:K1000',
        });

        const dashboardEntries = dashboardData.data.values || [];
        let dashboardRowIndex = -1;
        let currentNotes = '';
        let currentBreakMins = 0;

        for (let i = dashboardEntries.length - 1; i >= 0; i--) {
            const rowDate = dashboardEntries[i][0] ? new Date(dashboardEntries[i][0]).toLocaleDateString('en-US') : '';
            if (rowDate === today && dashboardEntries[i][1] === staffName && dashboardEntries[i][9] === 'On a Break') {
                dashboardRowIndex = i + 2;
                currentNotes = dashboardEntries[i][10] || '';
                // Parse existing break time from notes (e.g., "Break: 15 min")
                const match = currentNotes.match(/Break: (\d+) min/);
                if (match) {
                    currentBreakMins = parseInt(match[1]);
                }
                break;
            }
        }

        if (dashboardRowIndex === -1) {
            return { success: false, message: 'No active shift found in Dashboard!' };
        }

        const totalBreakMins = currentBreakMins + breakDurationMinutes;
        const updatedNotes = `Break: ${totalBreakMins} min`;

        // Update Dashboard: Status back to "Working" and update Notes with cumulative break time
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Dashboard!J${dashboardRowIndex}:K${dashboardRowIndex}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [['Working', updatedNotes]]
            },
        });

        return {
            success: true,
            message: `Returned from ${breakDurationMinutes} min break (Total: ${totalBreakMins} min)`,
            breakDuration: breakDurationMinutes
        };
    } catch (error: any) {
        console.error('Return from break error:', error);
        return { success: false, message: `Error returning from break: ${error.message}` };
    }
}


// Clock Out - Update existing entry with sign out time
export async function clockOut(
    spreadsheetId: string,
    staffName: string
): Promise<{ success: boolean; message: string }> {
    try {
        spreadsheetId = HARDCODED_SPREADSHEET_ID;
        staffName = staffName.trim(); // Remove leading/trailing whitespace
        const sheets = await getGoogleSheetsClient();

        // Find today's entry
        const today = new Date().toLocaleDateString('en-US');
        const sheetData = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `'${staffName}'!A2:C100`,
        });

        const entries = sheetData.data.values || [];
        let todayRowIndex = -1;

        // Find most recent active entry (searching from the bottom)
        for (let i = entries.length - 1; i >= 0; i--) {
            const rowDate = entries[i][0] ? new Date(entries[i][0]).toLocaleDateString('en-US') : '';
            if (rowDate === today && entries[i][1] && !entries[i][2]) {
                todayRowIndex = i + 2;
                break;
            }
        }

        if (todayRowIndex === -1) {
            return { success: false, message: 'No clock in found for today!' };
        }

        // Update Staff Sheet
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US');

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `'${staffName}'!C${todayRowIndex}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[timeStr]]
            },
        });

        // Update Dashboard Sheet
        const dashboardData = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Dashboard!A2:J1000',
        });

        const dashboardEntries = dashboardData.data.values || [];
        let dashboardRowIndex = -1;

        for (let i = dashboardEntries.length - 1; i >= 0; i--) {
            const rowDate = dashboardEntries[i][0] ? new Date(dashboardEntries[i][0]).toLocaleDateString('en-US') : '';
            if (rowDate === today && dashboardEntries[i][1] === staffName && dashboardEntries[i][9] === 'Working') {
                dashboardRowIndex = i + 2;
                break;
            }
        }

        if (dashboardRowIndex !== -1) {
            // Update Sign Out (F) and Status (J)
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `Dashboard!F${dashboardRowIndex}`,
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [[timeStr]]
                },
            });

            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `Dashboard!J${dashboardRowIndex}`,
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [['Finished']]
                },
            });
        }

        return { success: true, message: `Clocked out at ${timeStr}` };
    } catch (error) {
        console.error('Clock out error:', error);
        return { success: false, message: 'Error clocking out' };
    }
}

// Get current status (who's clocked in)
export async function getCurrentStatus(spreadsheetId: string): Promise<{
    name: string;
    department: string;
    signInTime: string;
    status: 'clocked-in' | 'on-break' | 'clocked-out';
}[]> {
    try {
        spreadsheetId = HARDCODED_SPREADSHEET_ID;
        const roster = await getStaffRoster(spreadsheetId);
        const today = new Date().toLocaleDateString('en-US');
        const sheets = await getGoogleSheetsClient();

        // Read Dashboard
        const dashboardData = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Dashboard!A2:J1000',
        });

        const dashboardEntries = dashboardData.data.values || [];
        const activeStatuses = new Map<string, { time: string, status: 'clocked-in' | 'on-break' }>();

        // Scan backwards to find the LATEST status for each person
        for (let i = dashboardEntries.length - 1; i >= 0; i--) {
            const row = dashboardEntries[i];
            if (!row || !row[1]) continue; // Skip empty rows

            const name = row[1];
            // If we already found a status for this person, skip
            if (activeStatuses.has(name)) continue;

            const rowDate = row[0] ? new Date(row[0]).toLocaleDateString('en-US') : '';
            if (rowDate === today) {
                const status = row[9];
                if (status === 'Working') {
                    activeStatuses.set(name, { time: row[4], status: 'clocked-in' });
                } else if (status === 'On a Break') {
                    activeStatuses.set(name, { time: row[4], status: 'on-break' });
                } else if (status === 'Finished' || status === 'Completed') {
                    // Mark as found but explicitly clocked out
                    // We use a special marker to indicate they are finished
                    (activeStatuses as any).set(name, { time: '', status: 'clocked-out' });
                }
            }
        }

        return roster.map(staff => {
            const current = activeStatuses.get(staff.name);
            return {
                name: staff.name,
                department: staff.department,
                signInTime: current?.time || '',
                status: (current as any)?.status === 'clocked-out' ? 'clocked-out' : (current?.status || 'clocked-out'),
            };
        });
    } catch (error) {
        console.error('Error getting status:', error);
        return [];
    }
}

// Add Staff Member - Create sheet if not exists and update roster
export async function addStaffMember(
    spreadsheetId: string,
    staffData: StaffRoster
): Promise<{ success: boolean; message: string }> {
    try {
        spreadsheetId = HARDCODED_SPREADSHEET_ID;
        const sheets = await getGoogleSheetsClient();

        // 1. Add to Staff Roster
        const rosterValues = [[
            staffData.name,
            staffData.department,
            staffData.position,
            staffData.hourlyWage, // Now using simple number
            'Active',
        ]];

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Staff Roster!A:E',
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: rosterValues },
        });

        // 2. Create Individual Sheet
        const sheetTitle = staffData.name;

        // Check if sheet exists
        const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
        const sheetExists = spreadsheet.data.sheets?.some(
            s => s.properties?.title === sheetTitle
        );

        if (!sheetExists) {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: [{
                        addSheet: {
                            properties: { title: sheetTitle }
                        }
                    }]
                }
            });

            // Add Headers
            const headers = [
                ['Date', 'Sign In', 'Sign Out', 'Hours Worked', 'Hourly Wage', 'Pay for Day', 'Cumulative Day Pay', 'Notes']
            ];

            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `'${sheetTitle}'!A1:H1`,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: headers },
            });
        }

        return { success: true, message: 'Staff member added successfully' };
    } catch (error: any) {
        console.error('Error adding staff:', error);
        return { success: false, message: error.message || 'Failed to add staff member' };
    }
}

// Update Staff Member
export async function updateStaffMember(
    spreadsheetId: string,
    oldName: string,
    staffData: StaffRoster
): Promise<{ success: boolean; message: string }> {
    try {
        spreadsheetId = HARDCODED_SPREADSHEET_ID;
        const sheets = await getGoogleSheetsClient();

        // 1. Find row in Roster
        const rosterData = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Staff Roster!A2:A',
        });

        const rows = rosterData.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === oldName);

        if (rowIndex === -1) {
            return { success: false, message: 'Staff member not found' };
        }

        // 2. Update Roster Row (Row index + 2 because of header and 0-index)
        const updateRange = `Staff Roster!A${rowIndex + 2}:D${rowIndex + 2}`;

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: updateRange,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[
                    staffData.name,
                    staffData.department,
                    staffData.position,
                    staffData.hourlyWage
                ]]
            }
        });

        // 3. Rename Sheet if name changed
        if (oldName !== staffData.name) {
            const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
            const sheet = spreadsheet.data.sheets?.find(
                s => s.properties?.title === oldName
            );

            if (sheet?.properties?.sheetId) {
                await sheets.spreadsheets.batchUpdate({
                    spreadsheetId,
                    requestBody: {
                        requests: [{
                            updateSheetProperties: {
                                properties: {
                                    sheetId: sheet.properties.sheetId,
                                    title: staffData.name,
                                },
                                fields: 'title',
                            }
                        }]
                    }
                });
            }
        }

        return { success: true, message: 'Staff updated successfully' };
    } catch (error: any) {
        console.error('Error updating staff:', error);
        return { success: false, message: 'Failed to update staff' };
    }
}

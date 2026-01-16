'use client';

import { useState, useEffect } from 'react';

// Force dynamic rendering on every request
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

interface StaffMember {
  name: string;
  department: string;
  position: string;
  hourlyWage: number;
  status: string;
}

interface StaffStatus {
  name: string;
  department: string;
  signInTime: string;
  status: 'clocked-in' | 'on-break' | 'clocked-out';
}

export default function TimeClock() {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [staffStatus, setStaffStatus] = useState<StaffStatus[]>([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [message, setMessage] = useState('');
  const [errorDetails, setErrorDetails] = useState(''); // DEBUG
  const [debugData, setDebugData] = useState<any>({ mounted: 'INITIAL_STATE' }); // DEBUG RAW
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock update effect
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Data loading effect
  useEffect(() => {
    setDebugData({ mounted: 'USE_EFFECT_FIRED', timestamp: new Date().toISOString() });
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setDebugData({ status: 'FETCHING_DEBUG_API', timestamp: new Date().toISOString() });

      // Fetch Debug Data Independently
      try {
        const debugRes = await fetch('/api/debug', { cache: 'no-store' });
        const debugJson = await debugRes.json();
        setDebugData({ ...debugJson, fetchedDebugAt: new Date().toISOString() });
      } catch (e: any) {
        setDebugData({ error: 'Debug Fetch Failed', details: e.message });
      }

      setDebugData((prev: any) => ({ ...prev, status: 'FETCHING_STAFF_API' }));

      const [staffRes, statusRes] = await Promise.all([
        fetch('/api/staff', { cache: 'no-store' }),
        fetch('/api/status', { cache: 'no-store' }),
      ]);

      const staffText = await staffRes.text();

      if (!staffRes.ok) {
        throw new Error(`Staff API Error: ${staffRes.status} - ${staffText}`);
      }

      const staff = JSON.parse(staffText);
      setStaffList(staff);

      // Store debug info AFTER setting state to capture parsed data
      setDebugData({
        status: staffRes.status,
        raw: staffText.substring(0, 500),
        parsedCount: staff.length,
        parsedNames: staff.map((s: any) => s.name).join(', '),
        setStaffListCalled: true,
        fetchedStaffAt: new Date().toISOString()
      });

      if (statusRes.ok) {
        const status = await statusRes.json();
        setStaffStatus(status);
      }

      setErrorDetails('');  // Clear any previous errors
    } catch (error: any) {
      console.error('Error loading data:', error);
      setErrorDetails(error.message || JSON.stringify(error));
      setDebugData((prev: any) => ({ ...prev, error: error.message, stack: error.stack }));
    }
  };

  const handleClockIn = async () => {
    if (!selectedStaff) {
      setMessage('Please select your name');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffName: selectedStaff }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✓ ${data.message}`);
        loadData(); // Refresh status
      } else {
        setMessage(`✗ ${data.error}`);
      }
    } catch (error) {
      setMessage('✗ Error clocking in');
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!selectedStaff) {
      setMessage('Please select your name');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/clock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffName: selectedStaff }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✓ ${data.message}`);
        loadData(); // Refresh status
      } else {
        setMessage(`✗ ${data.error}`);
      }
    } catch (error) {
      setMessage('✗ Error clocking out');
    } finally {
      setLoading(false);
    }
  };
  const handleTakeBreak = async () => {
    if (!selectedStaff) {
      setMessage('Please select your name');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/take-break', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffName: selectedStaff }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✓ ${data.message}`);
        loadData(); // Refresh status
      } else {
        setMessage(`✗ ${data.error}`);
      }
    } catch (error) {
      setMessage('✗ Error starting break');
    } finally {
      setLoading(false);
    }
  };

  const getStaffStatusObj = () => {
    return staffStatus.find(s => s.name === selectedStaff);
  };

  const currentStatusObj = getStaffStatusObj();
  const isStaffClockedIn = currentStatusObj?.status === 'clocked-in';
  const isStaffOnBreak = currentStatusObj?.status === 'on-break';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header with Clock */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Staff Time Clock</h1>
            <div className="text-6xl font-bold text-indigo-600 mb-2">
              {currentTime.toLocaleTimeString('en-US')}
            </div>
            <div className="text-xl text-gray-600">
              {currentTime.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
            <div className="text-xs text-gray-400 mt-2 font-mono">
              System Ready • Staff Loaded: {staffList.length}
            </div>
          </div>
        </div>

        {errorDetails && (<div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6"><h3 className="text-red-800">Connection Error: {errorDetails}</h3></div>)} <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Clock In/Out Panel */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Clock In / Out</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Your Name
                </label>
                <select
                  value={selectedStaff}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring focus:ring-indigo-200 transition"
                >
                  <option value="">-- Select Staff Member --</option>
                  {staffList.map((staff) => (
                    <option key={staff.name} value={staff.name}>
                      {staff.name} - {staff.department}
                    </option>
                  ))}
                </select>
              </div>

              {selectedStaff && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <p className={`text-lg font-semibold ${isStaffClockedIn ? 'text-green-600' : isStaffOnBreak ? 'text-orange-600' : 'text-gray-600'
                        }`}>
                        {isStaffClockedIn ? '🟢 Working' : isStaffOnBreak ? '🟠 On a Break' : '⚪ Clocked Out'}
                      </p>
                    </div>
                    {(isStaffClockedIn || isStaffOnBreak) && (
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Sign In Time</p>
                        <p className="text-lg font-semibold text-indigo-600">
                          {currentStatusObj?.signInTime}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={handleClockIn}
                  disabled={loading || !selectedStaff || isStaffClockedIn}
                  className="px-4 py-4 text-lg font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition transform hover:scale-105"
                >
                  {loading ? '...' : isStaffOnBreak ? 'Back from Break' : 'Clock In'}
                </button>
                <button
                  onClick={handleTakeBreak}
                  disabled={loading || !selectedStaff || !isStaffClockedIn}
                  className="px-4 py-4 text-lg font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition transform hover:scale-105"
                >
                  {loading ? '...' : 'Break Time'}
                </button>
                <button
                  onClick={handleClockOut}
                  disabled={loading || !selectedStaff || (!isStaffClockedIn && !isStaffOnBreak)}
                  className="px-4 py-4 text-lg font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition transform hover:scale-105"
                >
                  {loading ? '...' : 'Clock Out'}
                </button>
              </div>

              {message && (
                <div className={`p-4 rounded-lg text-center text-lg font-semibold ${message.startsWith('✓')
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
                  }`}>
                  {message}
                </div>
              )}
            </div>
          </div>

          {/* Current Status Panel */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Who's Working</h3>
              <button
                onClick={loadData}
                className="px-4 py-2 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition"
              >
                Refresh
              </button>
            </div>

            <div className="space-y-3">
              {staffStatus
                .filter(s => s.status === 'clocked-in' || s.status === 'on-break')
                .map((staff) => (
                  <div key={staff.name} className={`${staff.status === 'clocked-in' ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'} p-4 rounded-lg border`}>
                    <p className="font-semibold text-gray-800">{staff.name}</p>
                    <p className="text-sm text-gray-600">{staff.department}</p>
                    <div className="flex justify-between items-center mt-1">
                      <p className={`text-sm font-medium ${staff.status === 'clocked-in' ? 'text-green-600' : 'text-orange-600'}`}>
                        {staff.status === 'clocked-in' ? 'Working' : 'On a Break'}
                      </p>
                      <p className="text-xs text-gray-500">Since: {staff.signInTime}</p>
                    </div>
                  </div>
                ))}

              {staffStatus.filter(s => s.status === 'clocked-in').length === 0 && (
                <p className="text-center text-gray-500 py-8">No one clocked in</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

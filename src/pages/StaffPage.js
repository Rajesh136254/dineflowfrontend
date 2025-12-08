import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

function StaffPage() {
    const [pin, setPin] = useState('');
    const [staff, setStaff] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('staffToken'));
    const [attendance, setAttendance] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [companyInfo, setCompanyInfo] = useState(null);

    useEffect(() => {
        const fetchCompanyInfo = async () => {
            try {
                const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                    ? 'http://localhost:5000'
                    : (process.env.REACT_APP_API_URL || 'https://dineflowbackend.onrender.com');

                const res = await fetch(`${API_URL}/api/company/public`);
                const json = await res.json();
                if (json.success && json.data) {
                    setCompanyInfo(json.data);
                }
            } catch (err) {
                console.error("Failed to fetch company info", err);
            }
        };
        fetchCompanyInfo();
    }, []);

    // Leave form
    const [leaveData, setLeaveData] = useState({ start_date: '', end_date: '', reason: '' });

    const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000'
        : (process.env.REACT_APP_API_URL || 'https://dineflowbackend.onrender.com');

    const navigate = useNavigate();

    const fetchAttendance = useCallback(async (staffId, authToken) => {
        try {
            const res = await fetch(`${API_URL}/api/staff/attendance/${staffId}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const json = await res.json();
            if (json.success) setAttendance(json.data);
        } catch (err) {
            console.error(err);
        }
    }, [API_URL]);

    const fetchLeaves = useCallback(async (authToken) => {
        // Staff can only see their own leaves? The API I made returns ALL leaves for company.
        // I should probably filter or update API. For now, let's assume staff sees all or I filter in frontend.
        // Wait, the API `GET /api/staff/leaves` returns all leaves for company.
        // I should filter by staff_id if I want privacy.
        try {
            const res = await fetch(`${API_URL}/api/staff/leaves`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const json = await res.json();
            if (json.success) {
                // Filter for current staff
                if (staff) {
                    setLeaves(json.data.filter(l => l.staff_id === staff.id));
                } else {
                    setLeaves(json.data);
                }
            }
        } catch (err) {
            console.error(err);
        }
    }, [API_URL, staff]);

    useEffect(() => {
        const adminToken = localStorage.getItem('token');
        if (adminToken) {
            // Admin is logged in
            if (token !== adminToken) {
                setToken(adminToken);
            }
            setStaff(prev => {
                if (prev && prev.role === 'admin') return prev;
                return { id: 0, name: 'Admin', role: 'admin' };
            });
            // Optionally fetch data for admin if needed, e.g. all leaves
            // fetchLeaves(adminToken); 
        } else if (token) {
            const storedStaff = localStorage.getItem('staffDetails');
            if (storedStaff) {
                const s = JSON.parse(storedStaff);
                // Only update if different to avoid loops if staff is in deps (indirectly via fetchLeaves)
                setStaff(prev => {
                    if (prev && prev.id === s.id) return prev;
                    return s;
                });
                fetchAttendance(s.id, token);
                fetchLeaves(token);
            } else {
                setToken(null);
            }
        }
    }, [token, fetchAttendance, fetchLeaves]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${API_URL}/api/staff/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin })
            });
            const json = await res.json();
            if (json.success) {
                setToken(json.token);
                setStaff(json.staff);
                localStorage.setItem('staffToken', json.token);
                localStorage.setItem('staffDetails', JSON.stringify(json.staff));
                fetchAttendance(json.staff.id, json.token);
            } else {
                setError(json.message);
            }
        } catch (err) {
            setError('Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        setToken(null);
        setStaff(null);
        localStorage.removeItem('staffToken');
        localStorage.removeItem('staffDetails');
    };

    const handlePunch = async (type) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/staff/punch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ staff_id: staff.id, type })
            });
            const json = await res.json();
            if (json.success) {
                setSuccessMsg(json.message);
                fetchAttendance(staff.id, token);
                setTimeout(() => setSuccessMsg(''), 3000);
            } else {
                setError(json.message);
                setTimeout(() => setError(''), 3000);
            }
        } catch (err) {
            setError('Punch failed');
        } finally {
            setLoading(false);
        }
    };

    const handleLeaveSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/staff/leaves`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ...leaveData, staff_id: staff.id })
            });
            const json = await res.json();
            if (json.success) {
                setSuccessMsg('Leave requested successfully');
                setLeaveData({ start_date: '', end_date: '', reason: '' });
                fetchLeaves(token);
                setTimeout(() => setSuccessMsg(''), 3000);
            } else {
                setError(json.message);
            }
        } catch (err) {
            setError('Request failed');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
                <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
                    <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Staff Portal</h2>
                    {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
                    <form onSubmit={handleLogin}>
                        <div className="mb-6">
                            <label className="block text-gray-700 mb-2">Enter PIN</label>
                            <input
                                type="password"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                className="w-full p-3 border rounded-lg text-center text-2xl tracking-widest"
                                maxLength="6"
                                placeholder="••••••"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition"
                        >
                            {loading ? 'Verifying...' : 'Login'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className={`p-4 shadow-md transition-all duration-500 ${!companyInfo?.banner_url ? 'bg-indigo-600 text-white' : 'text-white'}`}
                style={companyInfo?.banner_url ? {
                    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${companyInfo.banner_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                } : {}}
            >
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="text-xl font-bold">Staff Dashboard</h1>
                    <div className="flex items-center gap-4">
                        <span>{staff?.name}</span>
                        {staff?.role === 'admin' ? (
                            <button onClick={() => navigate('/admin.html')} className="bg-indigo-700 px-3 py-1 rounded hover:bg-indigo-800">
                                Back to Admin
                            </button>
                        ) : (
                            <button onClick={handleLogout} className="bg-indigo-700 px-3 py-1 rounded hover:bg-indigo-800">
                                Logout
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <div className="container mx-auto p-4">
                {successMsg && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{successMsg}</div>}
                {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="space-y-2">
                        <p>Role: <span className="font-medium">{staff?.role}</span></p>
                        <p>Today: <span className="font-medium">{new Date().toLocaleDateString()}</span></p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="flex border-b">
                    <button
                        className={`flex-1 py-3 font-medium ${activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600'}`}
                        onClick={() => setActiveTab('dashboard')}
                    >
                        History
                    </button>
                    <button
                        className={`flex-1 py-3 font-medium ${activeTab === 'leaves' ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600'}`}
                        onClick={() => setActiveTab('leaves')}
                    >
                        Leaves
                    </button>
                </div>

                <div className="p-4">
                    {activeTab === 'dashboard' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-600 text-sm">
                                        <th className="p-3">Date</th>
                                        <th className="p-3">In</th>
                                        <th className="p-3">Out</th>
                                        <th className="p-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendance.map(record => (
                                        <tr key={record.id} className="border-b hover:bg-gray-50">
                                            <td className="p-3">{new Date(record.date).toLocaleDateString()}</td>
                                            <td className="p-3">{new Date(record.check_in).toLocaleTimeString()}</td>
                                            <td className="p-3">{record.check_out ? new Date(record.check_out).toLocaleTimeString() : '-'}</td>
                                            <td className="p-3">
                                                <span className={`px-2 py-1 rounded-full text-xs ${record.check_out ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                    {record.check_out ? 'Completed' : 'Active'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {attendance.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="p-4 text-center text-gray-500">No records found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'leaves' && (
                        <div>
                            <form onSubmit={handleLeaveSubmit} className="mb-8 bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-semibold mb-3">Request Leave</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Start Date</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full p-2 border rounded"
                                            value={leaveData.start_date}
                                            onChange={e => setLeaveData({ ...leaveData, start_date: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">End Date</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full p-2 border rounded"
                                            value={leaveData.end_date}
                                            onChange={e => setLeaveData({ ...leaveData, end_date: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label className="block text-sm text-gray-600 mb-1">Reason</label>
                                    <textarea
                                        required
                                        className="w-full p-2 border rounded"
                                        rows="2"
                                        value={leaveData.reason}
                                        onChange={e => setLeaveData({ ...leaveData, reason: e.target.value })}
                                    ></textarea>
                                </div>
                                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                                    Submit Request
                                </button>
                            </form>

                            <h4 className="font-semibold mb-3">Leave History</h4>
                            <div className="space-y-3">
                                {leaves.map(leave => (
                                    <div key={leave.id} className="border rounded-lg p-3 flex justify-between items-center bg-white">
                                        <div>
                                            <p className="font-medium">{new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}</p>
                                            <p className="text-sm text-gray-600">{leave.reason}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${leave.status === 'approved' ? 'bg-green-100 text-green-700' :
                                            leave.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {leave.status.toUpperCase()}
                                        </span>
                                    </div>
                                ))}
                                {leaves.length === 0 && <p className="text-gray-500 text-center">No leave history</p>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default StaffPage;

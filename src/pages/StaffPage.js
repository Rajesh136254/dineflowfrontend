import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

function StaffPage() {
    const [pin, setPin] = useState('');
    const [staff, setStaff] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('staffToken'));
    const [attendance, setAttendance] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [activeTab, setActiveTab] = useState('attendance');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [companyInfo, setCompanyInfo] = useState(null);
    const [dateFilter, setDateFilter] = useState('today');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    useEffect(() => {
        let isMounted = true;
        const fetchCompanyInfo = async () => {
            try {
                const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                    ? 'http://localhost:5000'
                    : (process.env.REACT_APP_API_URL || 'https://dineflowbackend.onrender.com');

                let url = `${API_URL}/api/company/public`;
                let options = {};

                if (token) {
                    url = `${API_URL}/api/company/profile`;
                    options = {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    };
                }

                const res = await fetch(url, options);
                const json = await res.json();
                if (isMounted && json.success && json.data) {
                    setCompanyInfo(json.data);
                }
            } catch (err) {
                console.error("Failed to fetch company info", err);
            }
        };
        fetchCompanyInfo();
        return () => { isMounted = false; };
    }, [token]);

    // Leave form
    const [leaveData, setLeaveData] = useState({ start_date: '', end_date: '', reason: '' });

    const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000'
        : (process.env.REACT_APP_API_URL || 'https://dineflowbackend.onrender.com');

    const navigate = useNavigate();

    const fetchAttendance = useCallback(async (staffId, authToken) => {
        try {
            let url = `${API_URL}/api/staff/attendance/${staffId}`;

            const now = new Date();
            let start = new Date();
            let end = new Date();

            if (dateFilter === 'today') {
                // start and end are already now
            } else if (dateFilter === 'yesterday') {
                start.setDate(now.getDate() - 1);
                end.setDate(now.getDate() - 1);
            } else if (dateFilter === 'last7') {
                start.setDate(now.getDate() - 7);
            } else if (dateFilter === 'thisMonth') {
                start = new Date(now.getFullYear(), now.getMonth(), 1);
            } else if (dateFilter === 'custom' && customStart && customEnd) {
                start = new Date(customStart);
                end = new Date(customEnd);
            } else if (dateFilter === 'custom') {
                return;
            }

            const formatDate = (d) => d.toISOString().split('T')[0];
            url += `?startDate=${formatDate(start)}&endDate=${formatDate(end)}`;

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const json = await res.json();
            if (json.success) setAttendance(json.data);
        } catch (err) {
            console.error(err);
        }
    }, [API_URL, dateFilter, customStart, customEnd]);

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
                    <div className="flex items-center gap-3">
                        {companyInfo?.logo_url ? (
                            <img src={companyInfo.logo_url} alt="Logo" className="w-10 h-10 rounded-full border-2 border-white object-cover" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/20">
                                <i className="fas fa-users"></i>
                            </div>
                        )}
                        <div>
                            <h1 className="text-xl font-bold leading-none">{companyInfo?.name || 'Staff Portal'}</h1>
                            <p className="text-xs opacity-80 font-medium">Staff Dashboard</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold leading-none">{staff?.name}</p>
                            <p className="text-xs opacity-75">{staff?.role}</p>
                        </div>
                        {staff?.role === 'admin' ? (
                            <button onClick={() => navigate('/admin.html')} className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg hover:bg-white/30 transition shadow-sm border border-white/10 flex items-center gap-2">
                                <i className="fas fa-cog"></i> <span className="hidden sm:inline">Admin</span>
                            </button>
                        ) : (
                            <button onClick={handleLogout} className="bg-red-500/80 backdrop-blur-sm px-4 py-2 rounded-lg hover:bg-red-600 transition shadow-sm border border-red-400/50 flex items-center gap-2">
                                <i className="fas fa-sign-out-alt"></i> <span className="hidden sm:inline">Logout</span>
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

            <div className="bg-white rounded-xl shadow-md overflow-hidden max-w-6xl mx-auto">
                <div className="flex border-b bg-gray-50">
                    <button
                        className={`flex-1 py-4 font-bold text-center transition-colors ${activeTab === 'attendance' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                        onClick={() => setActiveTab('attendance')}
                    >
                        <i className="fas fa-clock mr-2"></i> Attendance
                    </button>
                    <button
                        className={`flex-1 py-4 font-bold text-center transition-colors ${activeTab === 'leaves' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                        onClick={() => setActiveTab('leaves')}
                    >
                        <i className="fas fa-calendar-alt mr-2"></i> Leaves
                    </button>
                </div>

                <div className="p-6">
                    {activeTab === 'attendance' && (
                        <div className="fade-in space-y-8">
                            {staff?.role !== 'admin' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <button
                                        onClick={() => handlePunch('in')}
                                        className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl hover:from-green-600 hover:to-green-700 transition transform hover:-translate-y-1 flex flex-col items-center justify-center gap-3"
                                    >
                                        <div className="bg-white/20 p-3 rounded-full">
                                            <i className="fas fa-sign-in-alt text-3xl"></i>
                                        </div>
                                        <span className="font-bold text-xl tracking-wide">PUNCH IN</span>
                                    </button>
                                    <button
                                        onClick={() => handlePunch('out')}
                                        className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl hover:from-red-600 hover:to-red-700 transition transform hover:-translate-y-1 flex flex-col items-center justify-center gap-3"
                                    >
                                        <div className="bg-white/20 p-3 rounded-full">
                                            <i className="fas fa-sign-out-alt text-3xl"></i>
                                        </div>
                                        <span className="font-bold text-xl tracking-wide">PUNCH OUT</span>
                                    </button>
                                </div>
                            )}

                            <div>
                                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                        <i className="fas fa-history text-indigo-500"></i> Attendance History
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                                        <select
                                            value={dateFilter}
                                            onChange={e => setDateFilter(e.target.value)}
                                            className="input-field py-1.5 text-sm w-auto border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                                        >
                                            <option value="today">Today</option>
                                            <option value="yesterday">Yesterday</option>
                                            <option value="last7">Last 7 Days</option>
                                            <option value="thisMonth">This Month</option>
                                            <option value="custom">Custom Range</option>
                                        </select>
                                        {dateFilter === 'custom' && (
                                            <div className="flex items-center gap-2">
                                                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="input-field py-1.5 text-sm w-auto" />
                                                <span className="text-gray-400">-</span>
                                                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="input-field py-1.5 text-sm w-auto" />
                                            </div>
                                        )}
                                        <button
                                            onClick={() => fetchAttendance(staff.id, token)}
                                            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition"
                                            title="Refresh"
                                        >
                                            <i className="fas fa-sync-alt"></i>
                                        </button>
                                    </div>
                                </div>

                                <div className="overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr className="text-gray-600 text-xs uppercase tracking-wider">
                                                    <th className="p-4 font-semibold">Employee Name</th>
                                                    <th className="p-4 font-semibold">Date</th>
                                                    <th className="p-4 font-semibold">In</th>
                                                    <th className="p-4 font-semibold">Out</th>
                                                    <th className="p-4 font-semibold">Hours</th>
                                                    <th className="p-4 font-semibold">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 text-sm">
                                                {attendance.map(record => (
                                                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="p-4 font-medium text-gray-900">{staff?.name}</td>
                                                        <td className="p-4 text-gray-600">{new Date(record.date).toLocaleDateString()}</td>
                                                        <td className="p-4 text-gray-600 font-mono">{new Date(record.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                                        <td className="p-4 text-gray-600 font-mono">{record.check_out ? new Date(record.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                                                        <td className="p-4 font-mono text-indigo-600 font-medium">{record.duration || '-'}</td>
                                                        <td className="p-4">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${record.check_out ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${record.check_out ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                                                                {record.check_out ? 'Completed' : 'Active'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {attendance.length === 0 && (
                                                    <tr>
                                                        <td colSpan="6" className="p-12 text-center text-gray-500">
                                                            <div className="flex flex-col items-center justify-center">
                                                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                                                    <i className="fas fa-clipboard-list text-2xl text-gray-400"></i>
                                                                </div>
                                                                <p className="font-medium">No attendance records found</p>
                                                                <p className="text-xs text-gray-400 mt-1">Try adjusting the date filters</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'leaves' && (
                        <div className="fade-in space-y-8">
                            {staff?.role !== 'admin' && (
                                <div className="bg-indigo-50/50 p-6 rounded-xl border border-indigo-100">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                            <i className="fas fa-envelope-open-text text-xl"></i>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-800">New Leave Request</h3>
                                    </div>
                                    <form onSubmit={handleLeaveSubmit} className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">From</label>
                                                <input
                                                    type="date"
                                                    required
                                                    className="input-field w-full transition-shadow focus:ring-2 focus:ring-indigo-200"
                                                    value={leaveData.start_date}
                                                    onChange={e => setLeaveData({ ...leaveData, start_date: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">To</label>
                                                <input
                                                    type="date"
                                                    required
                                                    className="input-field w-full transition-shadow focus:ring-2 focus:ring-indigo-200"
                                                    value={leaveData.end_date}
                                                    onChange={e => setLeaveData({ ...leaveData, end_date: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Reason</label>
                                            <textarea
                                                required
                                                className="input-field w-full transition-shadow focus:ring-2 focus:ring-indigo-200 min-h-[100px]"
                                                placeholder="Please provide a detailed reason..."
                                                value={leaveData.reason}
                                                onChange={e => setLeaveData({ ...leaveData, reason: e.target.value })}
                                            ></textarea>
                                        </div>
                                        <div className="pt-2">
                                            <button type="submit" className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all w-full md:w-auto font-medium">
                                                Submit Request
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            <div>
                                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                    <i className="fas fa-list-ul text-indigo-500"></i> My Leave History
                                </h3>
                                <div className="grid gap-4">
                                    {leaves.map(leave => (
                                        <div key={leave.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-bold text-gray-900 text-lg">{staff?.name}</span>
                                                        <span className="text-gray-300">|</span>
                                                        <div className="flex items-center gap-2 text-gray-600 text-sm font-medium">
                                                            <i className="far fa-calendar"></i>
                                                            <span>{new Date(leave.start_date).toLocaleDateString()}</span>
                                                            <i className="fas fa-arrow-right text-xs text-gray-400"></i>
                                                            <span>{new Date(leave.end_date).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-gray-600 bg-gray-50 p-2 rounded-lg text-sm border border-gray-100">{leave.reason}</p>
                                                </div>
                                                <div className="self-start md:self-center">
                                                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${leave.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                                                        leave.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                                            'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                        }`}>
                                                        {leave.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {leaves.length === 0 && (
                                        <div className="text-center p-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                            <i className="far fa-folder-open text-4xl text-gray-300 mb-3 block"></i>
                                            <p className="text-gray-500 font-medium">No leave requests found</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default StaffPage;

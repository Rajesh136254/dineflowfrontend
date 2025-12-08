import React, { useState, useEffect, useRef } from 'react';

const SupportTicketModal = ({ isOpen, onClose, currentUser }) => {
    const [view, setView] = useState('create'); // Start with 'create' for guests
    const [tickets, setTickets] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [ticketMessages, setTicketMessages] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        name: currentUser?.full_name || '',
        email: currentUser?.email || '',
        subject: '',
        message: ''
    });

    // Chat State
    const [replyMessage, setReplyMessage] = useState('');

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const messagesEndRef = useRef(null);

    const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000'
        : (process.env.REACT_APP_API_URL || 'https://dineflowbackend.onrender.com');

    useEffect(() => {
        if (isOpen) {
            // Set initial view based on authentication
            if (currentUser) {
                setView('list'); // Authenticated users see their ticket list
                fetchTickets();
            } else {
                setView('create'); // Guests see the create form
            }
        }
    }, [isOpen, currentUser]);

    useEffect(() => {
        if (view === 'chat' && selectedTicket) {
            fetchTicketDetails(selectedTicket.id);
        }
    }, [view, selectedTicket]);

    useEffect(() => {
        scrollToBottom();
    }, [ticketMessages, view]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Debug logging
    useEffect(() => {
        console.log('SupportTicketModal State:', {
            isOpen,
            view,
            hasCurrentUser: !!currentUser,
            currentUserEmail: currentUser?.email,
            ticketsCount: tickets.length,
            selectedTicketId: selectedTicket?.id
        });
    }, [isOpen, view, currentUser, tickets, selectedTicket]);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            console.log('📋 Fetching tickets - currentUser:', currentUser);

            // If currentUser is null, try to get from localStorage
            let userToFetch = currentUser;
            if (!userToFetch) {
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    userToFetch = JSON.parse(storedUser);
                    console.log('📋 Using stored user:', userToFetch);
                }
            }

            if (!userToFetch) {
                console.warn('⚠️ No user found - cannot fetch tickets');
                setTickets([]);
                setLoading(false);
                return;
            }

            const query = userToFetch.id ? `user_id=${userToFetch.id}` : `email=${userToFetch.email}`;
            console.log('📋 Fetching with query:', query);

            const res = await fetch(`${API_URL}/api/support/tickets?${query}`);
            const data = await res.json();

            console.log('📋 Fetch response:', data);

            if (data.success) {
                setTickets(data.data);
                console.log('✅ Tickets loaded:', data.data.length);
            } else {
                console.error('❌ Failed to fetch tickets:', data.message);
            }
        } catch (err) {
            console.error("❌ Failed to fetch tickets", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTicketDetails = async (ticketId) => {
        try {
            const res = await fetch(`${API_URL}/api/support/ticket/${ticketId}`);
            const data = await res.json();
            if (data.success) {
                setTicketMessages(data.messages);
            }
        } catch (err) {
            console.error("Failed to fetch ticket details", err);
        }
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Get user info from currentUser or localStorage
            let userInfo = currentUser;
            if (!userInfo) {
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    userInfo = JSON.parse(storedUser);
                }
            }

            const payload = {
                ...formData,
                user_id: userInfo?.id || null
            };

            console.log('🎫 Creating ticket with payload:', payload);

            const res = await fetch(`${API_URL}/api/support/ticket`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            console.log('🎫 Create ticket response:', data);

            if (data.success) {
                setSuccess(true);
                console.log('✅ Ticket created successfully! ID:', data.ticketId);
                setTimeout(async () => {
                    setSuccess(false);
                    setFormData({ name: currentUser?.full_name || '', email: currentUser?.email || '', subject: '', message: '' });

                    // Force refresh of tickets and switch to list view
                    if (userInfo) {
                        try {
                            await fetchTickets(); // Ensure tickets are fetched before switching
                            setView('list');
                        } catch (e) {
                            console.error("Error refreshing tickets", e);
                        }
                    } else {
                        onClose();
                    }
                }, 1500);
            } else {
                setError(data.message || 'Failed to submit ticket');
                console.error('❌ Failed to create ticket:', data.message);
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
            console.error('❌ Error creating ticket:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleReply = async (e) => {
        e.preventDefault();
        if (!replyMessage.trim()) return;

        try {
            const res = await fetch(`${API_URL}/api/support/ticket/${selectedTicket.id}/reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: replyMessage,
                    sender_role: 'user'
                })
            });

            const data = await res.json();
            if (data.success) {
                setReplyMessage('');
                fetchTicketDetails(selectedTicket.id);
            }
        } catch (err) {
            console.error("Failed to send reply", err);
        }
    };

    // Filter State
    const [filterDate, setFilterDate] = useState('all'); // 'all', '7days', '30days'

    const getFilteredTickets = () => {
        if (filterDate === 'all') return tickets;

        const now = new Date();
        const days = filterDate === '7days' ? 7 : 30;
        const cutoff = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));

        return tickets.filter(ticket => new Date(ticket.created_at) >= cutoff);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md h-[600px] flex flex-col overflow-hidden animate-fade-in-up">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2">
                        {currentUser && view !== 'list' && (
                            <button onClick={() => setView('list')} className="mr-2 hover:bg-white/20 p-1 rounded-full transition">
                                <i className="fas fa-arrow-left"></i>
                            </button>
                        )}
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <i className="fas fa-headset"></i>
                            {view === 'chat' ? `Ticket #${selectedTicket?.id}` : 'Support'}
                        </h3>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* History Icon - Show in create and chat views */}
                        {(() => {
                            const shouldShow = view !== 'list';
                            console.log('🔍 History Icon Debug:', {
                                currentUser: !!currentUser,
                                currentUserEmail: currentUser?.email,
                                view: view,
                                shouldShow: shouldShow,
                                ticketsCount: tickets.length
                            });
                            return shouldShow;
                        })() && (
                                <button
                                    onClick={() => {
                                        console.log('✅ History icon clicked - navigating to list view');
                                        setView('list');
                                    }}
                                    className="text-white hover:bg-white/20 p-2 rounded-full transition relative"
                                    title="View Ticket History"
                                    style={{ minWidth: '40px', minHeight: '40px' }}
                                >
                                    <i className="fas fa-history text-xl"></i>
                                    {tickets.length > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-yellow-400 text-purple-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                            {tickets.length}
                                        </span>
                                    )}
                                </button>
                            )}


                        <button onClick={onClose} className="text-white hover:text-gray-200 transition">
                            <i className="fas fa-times text-xl"></i>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-gray-50 relative">
                    {/* LIST VIEW */}
                    {view === 'list' && (
                        <div className="p-4 space-y-4">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setView('create')}
                                    className="flex-1 bg-indigo-600 text-white py-2 rounded-lg shadow hover:bg-indigo-700 transition flex items-center justify-center gap-2 font-medium text-sm"
                                >
                                    <i className="fas fa-plus"></i> New Ticket
                                </button>
                                <select
                                    className="bg-gray-100 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 outline-none"
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                >
                                    <option value="all">All Time</option>
                                    <option value="7days">Past 7 Days</option>
                                    <option value="30days">Past 30 Days</option>
                                </select>
                            </div>

                            <div className="space-y-3">
                                {loading ? (
                                    <div className="text-center py-4 text-gray-500">Loading tickets...</div>
                                ) : getFilteredTickets().length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <i className="fas fa-inbox text-4xl mb-2 opacity-50"></i>
                                        <p>No tickets found.</p>
                                    </div>
                                ) : (
                                    getFilteredTickets().map(ticket => (
                                        <div
                                            key={ticket.id}
                                            onClick={() => { setSelectedTicket(ticket); setView('chat'); }}
                                            className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer"
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-bold text-gray-800 truncate pr-2">{ticket.subject}</h4>
                                                <span className={`text-xs px-2 py-1 rounded-full capitalize ${ticket.status === 'open' ? 'bg-green-100 text-green-700' :
                                                    ticket.status === 'closed' ? 'bg-gray-100 text-gray-700' :
                                                        'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {ticket.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                {new Date(ticket.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* CREATE VIEW */}
                    {view === 'create' && (
                        <div className="p-6">
                            {currentUser && (
                                <button
                                    onClick={() => setView('list')}
                                    className="mb-4 text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-2 text-sm"
                                >
                                    <i className="fas fa-history"></i> View Ticket History
                                </button>
                            )}

                            {success ? (
                                <div className="text-center py-8 h-full flex flex-col justify-center">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <i className="fas fa-check text-2xl text-green-600"></i>
                                    </div>
                                    <h4 className="text-xl font-bold text-gray-800 mb-2">Ticket Submitted!</h4>
                                    <p className="text-gray-600">We'll get back to you shortly.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleCreateTicket} className="space-y-4">
                                    {error && (
                                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                                            <i className="fas fa-exclamation-circle"></i> {error}
                                        </div>
                                    )}

                                    {/* Name Field */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Your Name"
                                        />
                                    </div>

                                    {/* Email Field */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input
                                            type="email"
                                            required
                                            className={`w-full px-4 py-2 border border-gray-300 rounded-lg outline-none transition ${currentUser ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'}`}
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="your@email.com"
                                            readOnly={!!currentUser}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                        <select
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                            value={formData.subject}
                                            onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                            required
                                        >
                                            <option value="">Select a topic</option>
                                            <option value="General Inquiry">General Inquiry</option>
                                            <option value="Technical Issue">Technical Issue</option>
                                            <option value="Billing">Billing</option>
                                            <option value="Feature Request">Feature Request</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                                        <textarea
                                            required
                                            rows="6"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition resize-none"
                                            value={formData.message}
                                            onChange={e => setFormData({ ...formData, message: e.target.value })}
                                            placeholder="Describe your issue..."
                                        ></textarea>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <i className="fas fa-spinner fa-spin"></i> Sending...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-paper-plane"></i> Submit Ticket
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    )}

                    {/* CHAT VIEW */}
                    {view === 'chat' && (
                        <div className="flex flex-col h-full">
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {ticketMessages.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.sender_role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-lg p-3 ${msg.sender_role === 'user'
                                            ? 'bg-indigo-600 text-white rounded-br-none'
                                            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                                            }`}>
                                            <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                                            <p className={`text-[10px] mt-1 ${msg.sender_role === 'user' ? 'text-indigo-200' : 'text-gray-400'}`}>
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            <form onSubmit={handleReply} className="p-3 bg-white border-t border-gray-200 flex gap-2 shrink-0">
                                <input
                                    type="text"
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                    placeholder="Type a reply..."
                                    value={replyMessage}
                                    onChange={e => setReplyMessage(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    disabled={!replyMessage.trim()}
                                    className="bg-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <i className="fas fa-paper-plane"></i>
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SupportTicketModal;

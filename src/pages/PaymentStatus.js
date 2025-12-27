import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function PaymentStatus() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { token } = useAuth();
    const orderId = searchParams.get('order_id');
    const [status, setStatus] = useState('verifying');
    const [message, setMessage] = useState('Verifying your payment...');

    useEffect(() => {
        if (!orderId) {
            setStatus('error');
            setMessage('Invalid verification request.');
            return;
        }

        const verifyPayment = async () => {
            try {
                const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                    ? 'http://localhost:5000'
                    : (process.env.REACT_APP_API_URL || 'https://dineflowbackend.onrender.com');

                const res = await fetch(`${API_URL}/api/payment/verify`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ order_id: orderId })
                });

                const data = await res.json();

                if (data.success) {
                    setStatus('success');
                    setMessage('Payment Successful! redirecting...');
                    setTimeout(() => {
                        window.location.href = '/admin.html'; // Hard reload to refresh context
                    }, 3000);
                } else {
                    setStatus('failed');
                    setMessage('Payment failed or incomplete. Please try again.');
                }
            } catch (err) {
                console.error('Verification Error:', err);
                setStatus('error');
                setMessage('An error occurred while verifying details.');
            }
        };

        if (token) {
            verifyPayment();
        }
    }, [orderId, token]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 pattern-bg">
            <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center">

                {status === 'verifying' && (
                    <>
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mx-auto mb-6"></div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Verifying Payment</h2>
                        <p className="text-gray-500">{message}</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-slow">
                            <i className="fas fa-check text-green-600 text-4xl"></i>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-800 mb-2">Success!</h2>
                        <p className="text-gray-600 mb-6">{message}</p>
                        <button onClick={() => window.location.href = '/admin.html'} className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-indigo-700 transition">
                            Go to Dashboard
                        </button>
                    </>
                )}

                {(status === 'failed' || status === 'error') && (
                    <>
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <i className="fas fa-times text-red-600 text-4xl"></i>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Failed</h2>
                        <p className="text-gray-500 mb-6">{message}</p>
                        <button onClick={() => navigate('/homepage')} className="w-full bg-gray-800 text-white font-bold py-3 px-6 rounded-xl hover:bg-gray-900 transition mb-3">
                            Try Again
                        </button>
                        <button onClick={() => window.open('https://api.whatsapp.com/send?phone=919999999999', '_blank')} className="text-indigo-600 text-sm font-semibold hover:underline">
                            Contact Support
                        </button>
                    </>
                )}

            </div>
        </div>
    );
}

export default PaymentStatus;

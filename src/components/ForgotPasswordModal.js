import React, { useState } from 'react';
import './ForgotPasswordModal.css';

const ForgotPasswordModal = ({ isOpen, onClose, API_URL }) => {
    const [forgotEmail, setForgotEmail] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isLoading, setIsLoading] = useState(false);

    const handleForgotPassword = async (e) => {
        e.preventDefault();

        if (!forgotEmail || !/\S+@\S+\.\S+/.test(forgotEmail)) {
            setStatus({ type: 'error', message: 'Please enter a valid email address' });
            return;
        }

        setIsLoading(true);
        setStatus({ type: '', message: '' });

        try {
            const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: forgotEmail }),
                credentials: 'include',
                mode: 'cors',
            });

            const data = await response.json();

            if (data.success) {
                setStatus({
                    type: 'success',
                    message: 'Password reset link has been sent to your email! Please check your inbox.'
                });
                setTimeout(() => {
                    setForgotEmail('');
                    setStatus({ type: '', message: '' });
                    onClose();
                }, 3000);
            } else {
                setStatus({ type: 'error', message: data.message || 'Failed to send reset link' });
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            setStatus({ type: 'error', message: 'Network error. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setForgotEmail('');
        setStatus({ type: '', message: '' });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="forgot-modal-overlay" onClick={handleClose}>
            <div className="forgot-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="forgot-modal-close" onClick={handleClose}>
                    <i className="fas fa-times"></i>
                </button>

                <div className="forgot-modal-header">
                    <div className="forgot-modal-icon">
                        <i className="fas fa-key"></i>
                    </div>
                    <h2>Reset Password</h2>
                    <p>Enter your email address and we'll send you a link to reset your password.</p>
                </div>

                <form onSubmit={handleForgotPassword}>
                    <div className="forgot-input-group">
                        <label htmlFor="forgot-email">Email Address</label>
                        <div className="forgot-input-wrapper">
                            <div className="forgot-input-icon">
                                <i className="fas fa-envelope"></i>
                            </div>
                            <input
                                type="email"
                                id="forgot-email"
                                placeholder="Enter your email"
                                value={forgotEmail}
                                onChange={(e) => setForgotEmail(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {status.message && (
                        <div className={`forgot-status-message ${status.type}`}>
                            <i className={`fas fa-${status.type === 'success' ? 'check-circle' : 'exclamation-circle'}`}></i>
                            {status.message}
                        </div>
                    )}

                    <div className="forgot-modal-actions">
                        <button
                            type="button"
                            className="forgot-modal-button forgot-modal-cancel"
                            onClick={handleClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="forgot-modal-button forgot-modal-submit"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i>
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-paper-plane"></i>
                                    Send Reset Link
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ForgotPasswordModal;

import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import './SignupPage.css';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import { useAuth } from '../contexts/AuthContext';

export default function SignupPage() {
  const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : (process.env.REACT_APP_API_URL || 'https://dineflowbackend.onrender.com');

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const isLoginMode = searchParams.get('mode') === 'login';

  // Directly manage form/login mode. Video is now background.
  const [mode, setMode] = useState(isLoginMode ? 'login' : 'signup');

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: ""
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  const navigate = useNavigate();
  const formRef = useRef(null);
  const { login, updateAuthState } = useAuth(); // Import updateAuthState

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 25) return "weak";
    if (passwordStrength <= 50) return "fair";
    if (passwordStrength <= 75) return "good";
    return "strong";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setAuthError("");
    setAuthSuccess("");

    try {
      const endpoint = mode === "signup" ? "/api/auth/register" : "/api/auth/login";
      const payload = mode === "signup"
        ? { fullName: formData.fullName, email: formData.email, password: formData.password, role: 'admin' }
        : { email: formData.email, password: formData.password };

      // Enhanced fetch with proper CORS configuration
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        credentials: 'include', // Important for CORS
        mode: 'cors', // Explicitly set CORS mode
      });

      // Handle non-JSON responses
      const contentType = response.headers.get("content-type");
      let data;

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server returned non-JSON response: ${text}`);
      }

      console.log('=== LOGIN DEBUG ===', 'data:', data, 'data.data:', data.data, 'token:', data.data?.token);


      if (data.success) {
        // Use simpler logic: Update global auth state directly
        // This ensures profile email/name is reflected immediately without reload
        if (data.data && data.data.token) {
          updateAuthState(data.data);
        }

        const user = data.data;
        const company = data.company;
        const token = data.data.token;

        console.log('[AUTH] User data:', user);
        console.log('[AUTH] Company data:', company);

        // Redirect based on mode
        if (mode === "signup") {
          setAuthSuccess("Registration successful! Redirecting to your company site...");

          // For signup, ALWAYS redirect to company subdomain
          if (company && company.slug) {
            // Redirect to company-specific subdomain
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const port = window.location.port ? `:${window.location.port}` : '';

            if (isLocalhost) {
              // Local: Use subdomain.localhost:3000 format
              const companyUrl = `http://${company.slug}.localhost${port}/homepage?token=${token}`;
              console.log('[SIGNUP] Redirecting to:', companyUrl);
              setTimeout(() => {
                window.location.href = companyUrl;
              }, 1500);
            } else {
              // Production: Use company URL from backend
              const companyUrl = company.url ? `${company.url}/homepage?token=${token}` : '/homepage';
              console.log('[SIGNUP] Redirecting to:', companyUrl);
              setTimeout(() => {
                window.location.href = companyUrl;
              }, 1500);
            }
          } else {
            // Fallback if no company slug
            setTimeout(() => {
              navigate('/homepage');
            }, 1500);
          }
        } else {
          // Login success - Redirect to company subdomain
          if (user?.role === 'admin' || user?.role_id || user?.role !== 'customer') {
            // Admin/Staff users - redirect to company subdomain
            if (company && company.slug) {
              const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
              const currentHostname = window.location.hostname;
              const expectedHostname = isLocalhost ? `${company.slug}.localhost` : company.slug;

              console.log('[LOGIN DEBUG] Current hostname:', currentHostname);
              console.log('[LOGIN DEBUG] Company slug:', company.slug);
              console.log('[LOGIN DEBUG] Expected hostname:', expectedHostname);
              console.log('[LOGIN DEBUG] Is localhost:', isLocalhost);

              // Check if we're already on the correct subdomain
              const alreadyOnCorrectSubdomain = isLocalhost
                ? currentHostname === `${company.slug}.localhost`
                : currentHostname.startsWith(company.slug);

              console.log('[LOGIN DEBUG] Already on correct subdomain?', alreadyOnCorrectSubdomain);

              if (alreadyOnCorrectSubdomain) {
                // Already on correct subdomain, just navigate locally
                console.log('[LOGIN] Already on correct subdomain, navigating to /homepage');
                navigate('/homepage');
              } else {
                // Need to redirect to correct subdomain
                const port = window.location.port ? `:${window.location.port}` : '';

                if (isLocalhost) {
                  // Local: Use subdomain.localhost:3000 format
                  const companyUrl = `http://${company.slug}.localhost${port}/homepage?token=${token}`;
                  console.log('[LOGIN] Redirecting admin to:', companyUrl);
                  window.location.href = companyUrl;
                } else {
                  // Production: Use company URL from backend
                  const companyUrl = company.url || '/homepage';
                  console.log('[LOGIN] Redirecting admin to:', companyUrl);
                  window.location.href = companyUrl;
                }
              }
            } else {
              // Fallback if no company slug
              navigate('/homepage');
            }
            return;
          }

          // Customer users - redirect to customer page with table param
          const searchParams = new URLSearchParams(window.location.search);
          const tableNumber = searchParams.get('table') || '1';
          const companyId = searchParams.get('companyId');

          let targetUrl = `/customer.html?table=${tableNumber}`;
          if (companyId) {
            targetUrl += `&companyId=${companyId}`;
          }
          navigate(targetUrl);
        }
      } else {
        setAuthError(data.message || "Authentication failed");
      }
    } catch (error) {
      console.error("Auth error:", error);
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        setAuthError("Network error. Please check your connection and try again.");
      } else if (error.message.includes('CORS')) {
        setAuthError("CORS error. Please contact support.");
      } else {
        setAuthError(error.message || "Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Form validation based on mode
  const validateForm = () => {
    const newErrors = {};

    if (mode === "signup" && !formData.fullName.trim()) {
      newErrors.fullName = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Calculate password strength
  useEffect(() => {
    if (formData.password) {
      let strength = 0;
      if (formData.password.length >= 8) strength += 25;
      if (formData.password.match(/[a-z]+/)) strength += 25;
      if (formData.password.match(/[A-Z]+/)) strength += 25;
      if (formData.password.match(/[0-9]+/)) strength += 25;
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(0);
    }
  }, [formData.password]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 25) return "Weak password";
    if (passwordStrength <= 50) return "Fair password";
    if (passwordStrength <= 75) return "Good password";
    return "Strong password";
  };

  return (
    <div className="signup-page">
      {/* Animated Background - Replaced by Video */}
      <div className="signup-video-background fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-black/40 z-10"></div> {/* Overlay for readability */}
        <video
          src="/intro-video.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* Main Content */}
      <div className="signup-content-container relative z-20">

        {/* Signup Form - Always Visible */}
        <div className="signup-form-overlay">
          <div className="signup-form-container" ref={formRef}>
            <div className="signup-form-card">
              <div className="signup-form-header">
                <div className="signup-logo-section">
                  <div className="signup-logo">
                    <i className="fas fa-utensils"></i>
                  </div>
                  <h2>RedSorm</h2>
                </div>
                <div className="signup-tabs">
                  <div
                    className={`signup-tab ${mode === "signup" ? "signup-active" : ""}`}
                    onClick={() => setMode("signup")}
                  >
                    Sign Up
                  </div>
                  <div
                    className={`signup-tab ${mode === "login" ? "signup-active" : ""}`}
                    onClick={() => setMode("login")}
                  >
                    Login
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                {mode === "signup" && (
                  <div className="signup-input-group">
                    <label htmlFor="fullName">Full Name</label>
                    <div className="signup-input-wrapper">
                      <div className="signup-input-icon">
                        <i className="fas fa-user"></i>
                      </div>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className={errors.fullName ? "signup-error" : ""}
                        required
                      />
                    </div>
                    {errors.fullName && <div className="signup-error-message">{errors.fullName}</div>}
                  </div>
                )}

                <div className="signup-input-group">
                  <label htmlFor="email">Email Address</label>
                  <div className="signup-input-wrapper">
                    <div className="signup-input-icon">
                      <i className="fas fa-envelope"></i>
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={errors.email ? "signup-error" : ""}
                      required
                    />
                  </div>
                  {errors.email && <div className="signup-error-message">{errors.email}</div>}
                </div>

                <div className="signup-input-group">
                  <label htmlFor="password">Password</label>
                  <div className="signup-input-wrapper">
                    <div className="signup-input-icon">
                      <i className="fas fa-lock"></i>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={errors.password ? "signup-error" : ""}
                      required
                    />
                    <button
                      type="button"
                      className="signup-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <i className="fas fa-eye-slash"></i>
                      ) : (
                        <i className="fas fa-eye"></i>
                      )}
                    </button>
                  </div>
                  {errors.password && <div className="signup-error-message">{errors.password}</div>}

                  {mode === "signup" && (
                    <div className="signup-password-strength">
                      <div className="signup-strength-bar">
                        <div
                          className={`signup-strength-fill ${getPasswordStrengthColor()}`}
                          style={{ width: `${passwordStrength}%` }}
                        ></div>
                      </div>
                      <div className="signup-strength-text">{getPasswordStrengthText()}</div>
                    </div>
                  )}

                  {mode === "login" && (
                    <div className="signup-forgot-password">
                      <span onClick={() => setShowForgotPassword(true)}>Forgot Password?</span>
                    </div>
                  )}
                </div>

                {/* Authentication error message */}
                {authSuccess && <div className="signup-auth-success" style={{ color: '#4caf50', marginBottom: '1rem', textAlign: 'center', padding: '10px', background: 'rgba(76, 175, 80, 0.1)', borderRadius: '8px' }}>{authSuccess}</div>}
                {authError && <div className="signup-auth-error">{authError}</div>}

                <button type="submit" className="signup-submit-button" disabled={isLoading}>
                  {isLoading ? (
                    <div className="signup-loading-spinner"></div>
                  ) : (
                    <>
                      <span>{mode === "signup" ? "Create Account" : "Log In"}</span>
                      <i className="fas fa-arrow-right"></i>
                    </>
                  )}
                </button>
              </form>

              <div className="signup-form-footer">
                {mode === "signup" ? (
                  <>Already have an account? <span onClick={() => setMode("login")}>Login</span></>
                ) : (
                  <>Need an account? <span onClick={() => setMode("signup")}>Sign Up</span></>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        API_URL={API_URL}
      />
    </div>
  );
}

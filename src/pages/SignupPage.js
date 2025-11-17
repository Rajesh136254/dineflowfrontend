import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import './SignupPage.css';

export default function SignupPage() {
  const [mode, setMode] = useState("signup");
  const [phase, setPhase] = useState("start");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: ""
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [foodItems, setFoodItems] = useState([]);
  const [interactiveMode, setInteractiveMode] = useState(false);
  const navigate = useNavigate();
  const formRef = useRef(null);
  const [authError, setAuthError] = useState("");

  // Generate floating food items for background
  useEffect(() => {
    const foods = ["🍕", "🍔", "🍟", "🌮", "🍱", "🥘", "🍜", "🍣", "🍗", "🥙"];
    const items = [];
    for (let i = 0; i < 15; i++) {
      items.push({
        id: i,
        icon: foods[Math.floor(Math.random() * foods.length)],
        left: `${Math.random() * 100}%`,
        animationDuration: `${15 + Math.random() * 20}s`,
        animationDelay: `${Math.random() * 5}s`,
        size: `${20 + Math.random() * 30}px`
      });
    }
    setFoodItems(items);
  }, []);

  // Animation flow
  const startRunning = () => {
    setPhase("running");
    setInteractiveMode(true);
  };

  useEffect(() => {
    if (phase === "running") {
      const t = setTimeout(() => setPhase("throwing"), 4000);
      return () => clearTimeout(t);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === "throwing") {
      const t = setTimeout(() => {
        setPhase("form");
        setShowForm(true);
        setTimeout(() => {
          if (formRef.current) {
            const firstInput = formRef.current.querySelector('input');
            if (firstInput) firstInput.focus();
          }
        }, 600);
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // Form validation
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
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setAuthError("");
    
    try {
      const endpoint = mode === "signup" ? "/api/auth/register" : "/api/auth/login";
      const payload = mode === "signup" 
        ? { fullName: formData.fullName, email: formData.email, password: formData.password }
        : { email: formData.email, password: formData.password };
      
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Store user data in localStorage or context
        localStorage.setItem("user", JSON.stringify(data.data));
        
        // Redirect based on mode
        if (mode === "signup") {
          // After successful signup, switch to login mode
          setMode("login");
          setAuthError(""); // Clear any errors
          // Reset form data except email
          setFormData(prev => ({ ...prev, password: "" }));
        } else {
          // After successful login, redirect to HomePage
          navigate("/homepage");
        }
      } else {
        setAuthError(data.message);
      }
    } catch (error) {
      console.error("Authentication error:", error);
      setAuthError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 25) return "weak";
    if (passwordStrength <= 50) return "fair";
    if (passwordStrength <= 75) return "good";
    return "strong";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 25) return "Weak password";
    if (passwordStrength <= 50) return "Fair password";
    if (passwordStrength <= 75) return "Good password";
    return "Strong password";
  };

  // Interactive person controls
  const handlePersonClick = () => {
    if (interactiveMode && phase === "running") {
      // Make the person jump when clicked
      const person = document.querySelector('.signup-person');
      if (person) {
        person.classList.add('signup-jump');
        setTimeout(() => {
          person.classList.remove('signup-jump');
        }, 1000);
      }
    }
  };

  return (
    <div className="signup-page">
      {/* Animated Background */}
      <div className="signup-animated-background">
        <div className="signup-gradient-sphere signup-sphere-1"></div>
        <div className="signup-gradient-sphere signup-sphere-2"></div>
        <div className="signup-gradient-sphere signup-sphere-3"></div>
      </div>

      {/* Floating food items in background */}
      {foodItems.map(item => (
        <div
          key={item.id}
          className="signup-food-item"
          style={{
            left: item.left,
            fontSize: item.size,
            animationDuration: item.animationDuration,
            animationDelay: item.animationDelay,
          }}
        >
          {item.icon}
        </div>
      ))}

      {/* Main Content */}
      <div className="signup-content-container">
        <h1 className="signup-page-title">
          {phase === "start" ? "Welcome to EndOfHunger!" : "Let's Get You Fed!"}
        </h1>

        {/* Start Button */}
        {phase === "start" && (
          <button className="signup-start-button" onClick={startRunning}>
            I'm Starving – Sign Me Up!
          </button>
        )}

        {/* Hungry Text Overlay */}
        {phase === "running" && (
          <div className="signup-hungry-text-overlay">So hungry... need food! 🍽️</div>
        )}

        {/* 3D Character Container */}
        <div className="signup-character-container" onClick={handlePersonClick}>
          {/* Running Person */}
          {phase === "running" && (
            <div className="signup-person-container signup-running-person">
              <div className="signup-person">
                {/* Head */}
                <div className="signup-head">
                  <div className="signup-face">
                    <div className="signup-eyes">
                      <div className="signup-eye"></div>
                      <div className="signup-eye"></div>
                    </div>
                    <div className="signup-mouth signup-hungry"></div>
                  </div>
                  {/* Hair */}
                  <div className="signup-hair"></div>
                </div>
                
                {/* Body */}
                <div className="signup-body">
                  {/* Shirt details */}
                  <div className="signup-shirt-details"></div>
                </div>
                
                {/* Arms */}
                <div className="signup-arms">
                  <div className="signup-arm signup-arm-left">
                    <div className="signup-hand"></div>
                  </div>
                  <div className="signup-arm signup-arm-right">
                    <div className="signup-hand"></div>
                  </div>
                </div>
                
                {/* Legs */}
                <div className="signup-legs">
                  <div className="signup-leg signup-leg-left">
                    <div className="signup-shoe"></div>
                  </div>
                  <div className="signup-leg signup-leg-right">
                    <div className="signup-shoe"></div>
                  </div>
                </div>
                
                {/* Stomach */}
                <div className="signup-stomach signup-rumbling"></div>
                
                {/* Hunger Bubble */}
                <div className="signup-hunger-bubble">
                  <div className="signup-hunger-text">🍔</div>
                </div>
                
                {/* Interactive hint */}
                {interactiveMode && (
                  <div className="signup-interactive-hint">Tap me!</div>
                )}
              </div>
            </div>
          )}

          {/* Throwing Person */}
          {phase === "throwing" && (
            <>
              <div className="signup-person-container signup-throwing-person">
                <div className="signup-person">
                  {/* Head */}
                  <div className="signup-head">
                    <div className="signup-face">
                      <div className="signup-eyes">
                        <div className="signup-eye"></div>
                        <div className="signup-eye"></div>
                      </div>
                      <div className="signup-mouth signup-happy"></div>
                    </div>
                    {/* Hair */}
                    <div className="signup-hair"></div>
                  </div>
                  
                  {/* Body */}
                  <div className="signup-body">
                    {/* Shirt details */}
                    <div className="signup-shirt-details"></div>
                  </div>
                  
                  {/* Arms */}
                  <div className="signup-arms">
                    <div className="signup-arm signup-arm-left">
                      <div className="signup-hand"></div>
                    </div>
                    <div className="signup-arm signup-arm-right signup-throwing">
                      <div className="signup-hand"></div>
                    </div>
                  </div>
                  
                  {/* Legs */}
                  <div className="signup-legs">
                    <div className="signup-leg signup-leg-left">
                      <div className="signup-shoe"></div>
                    </div>
                    <div className="signup-leg signup-leg-right">
                      <div className="signup-shoe"></div>
                    </div>
                  </div>
                  
                  {/* Stomach */}
                  <div className="signup-stomach"></div>
                </div>
              </div>
              
              {/* Briefcase */}
              <div className="signup-briefcase">
                <div className="signup-briefcase-body"></div>
                <div className="signup-briefcase-handle"></div>
              </div>
            </>
          )}
        </div>

        {/* Signup Form */}
        {showForm && (
          <div className="signup-form-overlay">
            <div className="signup-form-container" ref={formRef}>
              <div className="signup-form-card">
                <div className="signup-form-header">
                  <div className="signup-logo-section">
                    <div className="signup-logo">
                      <i className="fas fa-utensils"></i>
                    </div>
                    <h2>EndOfHunger</h2>
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
                  </div>
                    
                  {/* Add this line here - right before the submit button */}
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
        )}
      </div>
    </div>
  );
}
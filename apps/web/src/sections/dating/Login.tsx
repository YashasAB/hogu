import React, { useState } from "react";
import { postJson } from "../../lib/api";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpSendError, setOtpSendError] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  const phoneE164 = "+91" + phone.replace(/\D/g, "");
  const phoneValid = /^\+91[6-9]\d{9}$/.test(phoneE164);

  async function onPasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!phoneValid) { setSubmitError("Enter a valid 10-digit phone number."); return; }
    if (!password) { setSubmitError("Enter your password."); return; }
    try {
      setIsSubmitting(true);
      const data = await postJson<{ ok: boolean; sessionToken?: string }>("/api/dating/auth/login", {
        phone: phoneE164,
        password,
      });
      if (data.sessionToken) sessionStorage.setItem("dating_token", data.sessionToken);
      window.location.href = "/app";
    } catch (err: any) {
      setSubmitError(err?.message || "Login failed. Please check your password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onSendOtp() {
    setOtpSendError(null);
    if (!phoneValid) { setOtpSendError("Enter a valid 10-digit phone number first."); return; }
    try {
      setOtpSending(true);
      await postJson("/api/dating/auth/send-otp", { phone: phoneE164 });
      setOtpSent(true);
      setOtp("");
    } catch (err: any) {
      setOtpSendError(err?.message || "Failed to send code. Please try again.");
    } finally {
      setOtpSending(false);
    }
  }

  async function onVerifyOtp() {
    setOtpError(null);
    if (!otp.trim()) { setOtpError("Enter the code you received."); return; }
    try {
      setOtpVerifying(true);
      const data = await postJson<{ ok: boolean; sessionToken?: string }>("/api/dating/auth/login", {
        phone: phoneE164,
        otp: otp.trim(),
      });
      if (data.sessionToken) sessionStorage.setItem("dating_token", data.sessionToken);
      window.location.href = "/app";
    } catch (err: any) {
      setOtpError(err?.message || "Invalid code. Please try again.");
    } finally {
      setOtpVerifying(false);
    }
  }

  return (
    <div className="hogu-auth">
      <div className="hogu-auth-card" style={{ position: "relative" }}>
        <a href="/" className="back-btn" aria-label="Back to home">← Back</a>

        <h1>Welcome back</h1>
        <p className="muted">Sign in to Hogu.</p>

        {/* Phone field — shared by both paths */}
        <div className="hogu-field" style={{ marginTop: 20 }}>
          <label>Phone number</label>
          <div className="phone-row">
            <span className="phone-prefix">+91</span>
            <input
              className="hogu-input phone-input"
              type="tel"
              inputMode="numeric"
              placeholder="98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        {/* OTP section — sits directly below the phone field */}
        <div className="otp-section" style={{ marginTop: 12 }}>
          <p className="otp-hint">Sign in without a password using a one-time code.</p>

          {!otpSent ? (
            <>
              {otpSendError && <div className="hogu-error" style={{ marginBottom: 8 }}>{otpSendError}</div>}
              <button
                className="hogu-btn hogu-btn--otp"
                type="button"
                onClick={onSendOtp}
                disabled={otpSending}
                style={{ width: "100%" }}
              >
                {otpSending ? "Sending code..." : "Get OTP"}
              </button>
            </>
          ) : (
            <div className="otp-verify-block">
              <p className="otp-sent-msg">A verification code was sent to <strong>+91 {phone}</strong>. Enter it below.</p>
              <div className="hogu-field">
                <label>One-time code</label>
                <input
                  className="hogu-input otp-input"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  autoFocus
                />
              </div>
              {otpError && <div className="hogu-error" style={{ marginBottom: 8 }}>{otpError}</div>}
              <button
                className="hogu-btn hogu-btn--primary"
                type="button"
                onClick={onVerifyOtp}
                disabled={otpVerifying}
                style={{ width: "100%", marginTop: 10 }}
              >
                {otpVerifying ? "Verifying..." : "Verify Code"}
              </button>
              <button
                className="resend-link"
                type="button"
                onClick={onSendOtp}
                disabled={otpSending}
                style={{ marginTop: 8, width: "100%" }}
              >
                {otpSending ? "Resending..." : "Resend code"}
              </button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="otp-divider">
          <span>or use your password</span>
        </div>

        {/* Password form */}
        <form onSubmit={onPasswordLogin} noValidate>
          <div className="hogu-field">
            <label>Password</label>
            <input
              className="hogu-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {submitError && <div className="hogu-error" style={{ marginTop: 8 }}>{submitError}</div>}
          <button className="hogu-btn hogu-btn--primary" type="submit" disabled={isSubmitting} style={{ marginTop: 12, width: "100%" }}>
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="muted tiny" style={{ marginTop: 16 }}>
          <a className="hogu-link" href="/reset-password">Forgot your password?</a>
        </p>
        <p className="muted tiny">
          New to Hogu?{" "}
          <a className="hogu-link" href="/signup">Create an account</a>
        </p>
      </div>

      <style>{loginCss}</style>
    </div>
  );
}

const loginCss = `
.hogu-auth {
  min-height: 100dvh;
  display: grid;
  place-items: center;
  background: #0f1115;
  color: #eaeaea;
  padding: 24px 0;
  padding-top: calc(24px + env(safe-area-inset-top));
}
.hogu-auth-card {
  width: min(520px, 92vw);
  background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03));
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 18px;
  padding: 28px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.25);
}
.back-btn {
  position: absolute;
  top: 16px;
  left: 20px;
  font-size: 13px;
  color: rgba(255,255,255,0.6);
  text-decoration: none;
  padding: 4px 8px;
  border-radius: 8px;
  transition: color .15s, background .15s;
}
.back-btn:hover { color: #fff; background: rgba(255,255,255,0.08); }
.hogu-auth-card h1 {
  margin: 24px 0 4px 0;
  font-size: clamp(22px, 3.6vw, 28px);
  color: #fff;
}
.muted { color: rgba(255,255,255,0.7); margin: 0; }
.tiny { font-size: 12px; margin-top: 10px; }
.hogu-field { display: grid; gap: 6px; }
.hogu-field label { font-weight: 600; color: rgba(255,255,255,0.9); font-size: 13px; }
.phone-row {
  display: flex;
  align-items: stretch;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.14);
  background: rgba(255,255,255,0.06);
  overflow: hidden;
}
.phone-prefix {
  display: flex;
  align-items: center;
  padding: 12px 12px;
  font-size: 14px;
  font-weight: 700;
  color: rgba(255,255,255,0.9);
  border-right: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.05);
  white-space: nowrap;
  user-select: none;
}
.phone-input {
  flex: 1;
  border: none !important;
  border-radius: 0 !important;
  background: transparent !important;
}
.phone-row:focus-within { border-color: rgba(227,41,149,0.6); box-shadow: 0 0 0 3px rgba(227,41,149,0.18); }
.hogu-input {
  border-radius: 12px; border: 1px solid rgba(255,255,255,0.14);
  background: rgba(255,255,255,0.06); color: #fff; padding: 12px 12px; font-size: 14px; outline: none; width: 100%; box-sizing: border-box;
}
.hogu-input:focus { border-color: rgba(227,41,149,0.6); box-shadow: 0 0 0 3px rgba(227,41,149,0.18); }
.otp-input { letter-spacing: 6px; font-size: 20px; font-weight: 700; text-align: center; }
.hogu-btn {
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 14px; padding: 13px 18px; font-weight: 700; font-size: 14px;
  border: 1px solid rgba(255,255,255,0.14); transition: transform .15s ease; cursor: pointer;
  box-sizing: border-box;
}
.hogu-btn--primary { background: #e32995; color: #0b0b0b; border-color: transparent; }
.hogu-btn--primary:hover:not(:disabled) { transform: translateY(-1px); }
.hogu-btn--otp {
  background: transparent;
  color: #e32995;
  border: 2px solid #e32995;
  font-size: 15px;
}
.hogu-btn--otp:hover:not(:disabled) { background: rgba(227,41,149,0.1); }
.hogu-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.otp-divider {
  display: flex; align-items: center; gap: 12px;
  margin: 20px 0 16px;
  color: rgba(255,255,255,0.35); font-size: 12px;
}
.otp-divider::before, .otp-divider::after {
  content: ""; flex: 1; height: 1px; background: rgba(255,255,255,0.12);
}
.otp-section {
  background: rgba(227,41,149,0.06);
  border: 1px solid rgba(227,41,149,0.2);
  border-radius: 14px;
  padding: 14px 16px;
}
.otp-hint {
  font-size: 13px;
  color: rgba(255,255,255,0.7);
  margin: 0 0 10px 0;
  line-height: 1.5;
}
.otp-sent-msg {
  font-size: 13px;
  color: rgba(255,255,255,0.8);
  margin: 0 0 10px 0;
  line-height: 1.5;
}
.otp-verify-block { display: grid; gap: 8px; }
.resend-link {
  background: transparent; border: none; color: rgba(255,255,255,0.5);
  font-size: 13px; cursor: pointer; text-decoration: underline; padding: 0; text-align: center;
}
.resend-link:hover { color: rgba(255,255,255,0.8); }
.resend-link:disabled { opacity: 0.4; cursor: not-allowed; }
.hogu-link { color: #eaeaea; text-decoration: underline; }
.hogu-error { color: #ffb3c6; font-size: 12px; }
`;

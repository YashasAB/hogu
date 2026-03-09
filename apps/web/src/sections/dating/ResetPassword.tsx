import React, { useMemo, useState } from "react";
import { postJson } from "../../lib/api";

export default function ResetPassword() {
  const [form, setForm] = useState({ phone: "", resetToken: "", newPassword: "", confirmPassword: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!/^\+?[0-9]{10,15}$/.test(form.phone))
      e.phone = "Enter a valid phone number";
    if (!form.resetToken.trim())
      e.resetToken = "Reset token is required";
    if (form.newPassword.length < 8)
      e.newPassword = "Min 8 characters";
    if (form.confirmPassword && form.newPassword !== form.confirmPassword)
      e.confirmPassword = "Passwords don't match";
    return e;
  }, [form]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (Object.keys(errors).length) return;
    if (form.newPassword !== form.confirmPassword) {
      setSubmitError("Passwords don't match");
      return;
    }
    try {
      setIsSubmitting(true);
      await postJson("/api/dating/auth/reset-password", {
        phone: form.phone,
        resetToken: form.resetToken,
        newPassword: form.newPassword,
      });
      setSuccess(true);
    } catch (err: any) {
      setSubmitError(err?.message || "Password reset failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="hogu-auth">
        <div className="hogu-auth-card">
          <h1>Password Reset</h1>
          <div className="success-message">
            Your password has been reset successfully. You can now log in with your new password.
          </div>
          <a className="hogu-btn hogu-btn--primary" href="/login" style={{ textAlign: "center", textDecoration: "none", marginTop: 16, display: "block" }}>
            Go to Login
          </a>
        </div>
        <style>{resetCss}</style>
      </div>
    );
  }

  return (
    <div className="hogu-auth">
      <div className="hogu-auth-card">
        <h1>Reset Password</h1>
        <p className="muted">Contact your matchmaker to get the reset token, then use it here to set a new password.</p>

        <form className="hogu-form" onSubmit={onSubmit} noValidate>
          <div className="hogu-field">
            <label>Phone number</label>
            <input
              className="hogu-input"
              type="tel"
              inputMode="tel"
              placeholder="+91 98765 43210"
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value.trim() }))
              }
            />
            {errors.phone && <span className="hogu-error">{errors.phone}</span>}
          </div>

          <div className="hogu-field">
            <label>Reset token</label>
            <div className="reset-token-notice">
              This is a one-time code from your matchmaker. Ask them for it via the contact details on the app.
            </div>
            <input
              className="hogu-input"
              type="text"
              placeholder="Enter the token from your matchmaker"
              value={form.resetToken}
              onChange={(e) =>
                setForm((f) => ({ ...f, resetToken: e.target.value.trim() }))
              }
            />
            {errors.resetToken && <span className="hogu-error">{errors.resetToken}</span>}
          </div>

          <div className="hogu-field">
            <label>New password</label>
            <input
              className="hogu-input"
              type="password"
              placeholder="Min 8 characters"
              value={form.newPassword}
              onChange={(e) =>
                setForm((f) => ({ ...f, newPassword: e.target.value }))
              }
            />
            {errors.newPassword && <span className="hogu-error">{errors.newPassword}</span>}
          </div>

          <div className="hogu-field">
            <label>Confirm new password</label>
            <input
              className="hogu-input"
              type="password"
              placeholder="Re-enter your new password"
              value={form.confirmPassword}
              onChange={(e) =>
                setForm((f) => ({ ...f, confirmPassword: e.target.value }))
              }
            />
            {errors.confirmPassword && <span className="hogu-error">{errors.confirmPassword}</span>}
          </div>

          {submitError && <div className="hogu-error" style={{ marginTop: 8 }}>{submitError}</div>}
          <button className="hogu-btn hogu-btn--primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Resetting..." : "Reset Password"}
          </button>

          <p className="muted tiny">
            Remember your password?{" "}
            <a className="hogu-link" href="/login">
              Log in
            </a>
          </p>
        </form>
      </div>

      <style>{resetCss}</style>
    </div>
  );
}

const resetCss = `
.hogu-auth {
  min-height: 100dvh;
  display: grid;
  place-items: center;
  background: #0f1115;
  color: #eaeaea;
  padding-top: env(safe-area-inset-top);
}
.hogu-auth-card {
  width: min(560px, 92vw);
  background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03));
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 18px;
  padding: 28px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.25);
}
.hogu-auth-card h1 {
  margin: 0 0 6px 0;
  font-size: clamp(22px, 3.6vw, 30px);
  color: #fff;
}
.muted { color: rgba(255,255,255,0.75); }
.tiny { font-size: 12px; margin-top: 10px; }
.hogu-form { margin-top: 16px; display: grid; gap: 14px; }
.hogu-field { display: grid; gap: 6px; }
.hogu-field label { font-weight: 600; color: rgba(255,255,255,0.9); font-size: 13px; }
.hogu-input {
  border-radius: 12px; border: 1px solid rgba(255,255,255,0.14);
  background: rgba(255,255,255,0.06); color: #fff; padding: 12px 12px; font-size: 14px; outline: none;
}
.hogu-input:focus { border-color: rgba(227,41,149,0.6); box-shadow: 0 0 0 3px rgba(227,41,149,0.18); }
.hogu-btn {
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 14px; padding: 12px 18px; font-weight: 700;
  border: 1px solid rgba(255,255,255,0.14); transition: transform .15s ease;
}
.hogu-btn--primary { background: #e32995; color: #0b0b0b; border-color: transparent; }
.hogu-btn--primary:hover { transform: translateY(-1px); }
.hogu-link { color: #eaeaea; text-decoration: underline; }
.hogu-error { color: #ffb3c6; font-size: 12px; }
.reset-token-notice {
  background: rgba(227, 41, 149, 0.12);
  border: 1px solid rgba(227, 41, 149, 0.3);
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  line-height: 1.5;
  color: #f0c0d8;
}
.success-message {
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.4);
  border-radius: 12px;
  padding: 16px;
  color: #86efac;
  font-size: 14px;
  line-height: 1.6;
  margin-top: 16px;
}
`;

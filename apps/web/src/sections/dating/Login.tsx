import React, { useMemo, useState } from "react";
import { postJson } from "../../lib/api";

export default function Login() {
  const [form, setForm] = useState({ phone: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    // Basic phone validation: E.164-ish or 10–15 digits
    if (!/^\+?[0-9]{10,15}$/.test(form.phone))
      e.phone = "Enter a valid phone number";
    if (!form.password || form.password.length < 8)
      e.password = "Min 8 characters";
    return e;
  }, [form]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (Object.keys(errors).length) return;
    try {
      setIsSubmitting(true);
      await postJson("/api/dating/auth/login", {
        phone: form.phone,
        password: form.password,
      });
      window.location.href = "/app";
    } catch (err: any) {
      setSubmitError(err?.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="hogu-auth">
      <div className="hogu-auth-card">
        <h1>Welcome back</h1>
        <p className="muted">Sign in with your phone number.</p>

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
            <label>Password</label>
            <input
              className="hogu-input"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) =>
                setForm((f) => ({ ...f, password: e.target.value }))
              }
            />
            {errors.password && (
              <span className="hogu-error">{errors.password}</span>
            )}
          </div>

          {submitError && <div className="hogu-error" style={{marginTop:8}}>{submitError}</div>}
          <button className="hogu-btn hogu-btn--primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Log in"}
          </button>

          <p className="muted tiny">
            New to Hogu?{" "}
            <a className="hogu-link" href="/signup">
              Create an account
            </a>
          </p>
        </form>
      </div>

      <style>{authCss}</style>
    </div>
  );
}

const authCss = `
.hogu-auth {
  min-height: 100dvh;
  display: grid;
  place-items: center;
  background: #0f1115;
  color: #eaeaea;
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
`;

// apps/web/src/sections/dating/Home.tsx
import React from "react";

export default function DatingHome() {
  return (
    <div className="hogu-landing">
      {/* Background */}
      <div className="hogu-bg" aria-hidden />

      {/* Header */}
      <header className="hogu-shell hogu-header">
        <div className="hogu-brand">Hogu</div>
        <nav className="hogu-nav">
          <a className="hogu-link" href="/login">
            Log in
          </a>
          <a className="hogu-link hogu-link--primary" href="/signup">
            Sign up
          </a>
        </nav>
      </header>

      {/* Hero */}
      <main className="hogu-shell hogu-hero">
        <h1 className="hogu-title">
          Real dates. <span className="hogu-accent">Not swipes.</span>
        </h1>
        <p className="hogu-subtitle">
          Forget swiping. Forget messaging. Forget ghosting.<br />
          Your personal wingman introduces you, sets you up, and gets you both out the door.
        </p>

        <div className="hogu-cta">
          <a
            className="hogu-btn hogu-btn--primary"
            href="/signup"
            aria-label="Sign up for Hogu Dating"
          >
            Sign up
          </a>
          <a
            className="hogu-btn hogu-btn--ghost"
            href="/login"
            aria-label="Log in to Hogu Dating"
          >
            Log in
          </a>
        </div>

        {/* How It Works */}
        <section className="hogu-how-it-works">
          <h2 className="hogu-section-title">How it works</h2>
          <div className="hogu-steps">
            <div className="hogu-step">
              <div className="hogu-step-num">1</div>
              <h3>Sign up & build your profile</h3>
              <p>Tell us about yourself — your interests, diet, profession, preferred neighborhoods. The more detail you share, the better your matches.</p>
            </div>
            <div className="hogu-step">
              <div className="hogu-step-num">2</div>
              <h3>We find your match</h3>
              <p>Our matchmakers handpick introductions based on who you actually are — not an algorithm. Women see the match first and decide if they're interested before the man ever knows.</p>
            </div>
            <div className="hogu-step">
              <div className="hogu-step-num">3</div>
              <h3>Talk to your wingman, not your date</h3>
              <p>Want to know something about your match? Ask your matchmaker. They'll tell you everything you'd learn from months of texting — without the small talk. No messaging your match. No awkward openers.</p>
            </div>
            <div className="hogu-step">
              <div className="hogu-step-num">4</div>
              <h3>We handle the logistics</h3>
              <p>Your wingman finds a common neighborhood and time that works for both of you, picks a great spot, and gets you both out the door. All you have to do is show up.</p>
            </div>
          </div>
        </section>

        {/* Value Props */}
        <section className="hogu-grid">
          <article className="hogu-card">
            <div className="hogu-chip">Women first</div>
            <h3>She decides first</h3>
            <p>Men don't see a match until she says she's interested. She's always in control of who gets introduced to her.</p>
          </article>

          <article className="hogu-card">
            <div className="hogu-chip">Wingman</div>
            <h3>No messaging each other</h3>
            <p>You never text your match. Talk to your matchmaker instead — ask anything you want to know. They do the convincing, the coordinating, and the introducing.</p>
          </article>

          <article className="hogu-card">
            <div className="hogu-chip">Curated</div>
            <h3>Personalized matches</h3>
            <p>Fewer, higher-quality introductions handpicked by real people. No feed fatigue, no endless scrolling.</p>
          </article>

          <article className="hogu-card">
            <div className="hogu-chip">IRL</div>
            <h3>Real dates, fast</h3>
            <p>Say "I'm interested", share your availability, and your wingman moves it offline. No weeks of back-and-forth.</p>
          </article>

          <article className="hogu-card">
            <div className="hogu-chip">Commitment</div>
            <h3>No flaking</h3>
            <p>
              Small venue deposit that turns into credit at the table. Get paid
              the deposit if your date flakes.
            </p>
          </article>

          <article className="hogu-card">
            <div className="hogu-chip">Intent</div>
            <h3>Only serious people</h3>
            <p>Clear preferences, aligned goals, respectful culture. No catfishing, no time-wasters.</p>
          </article>
        </section>

        {/* Trust strip */}
        <div className="hogu-trust">
          <span>Women choose first</span>
          <span className="dot" />
          <span>Wingman-managed</span>
          <span className="dot" />
          <span>Neighborhood-first</span>
          <span className="dot" />
          <span>No messaging matches</span>
          <span className="dot" />
          <span>Privacy & respect</span>
        </div>
      </main>

      {/* Footer */}
      <footer className="hogu-shell hogu-footer">
        <p>
          Hogu connects real people for real dates. You never message your match —
          your wingman handles introductions, coordination, and scheduling.
        </p>
        <p style={{ marginTop: '16px' }}>
          <a href="/restaurant-reservations" className="hogu-link" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Looking for restaurant reservations?
          </a>
        </p>
      </footer>

      {/* Local, component-scoped styles */}
      <style>
        {`
        .hogu-landing {
          min-height: 100dvh;
          color: #0b0b0b;
          background: #0f1115;
          position: relative;
          overflow-x: hidden;
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji";
        }

        .hogu-bg {
          position: absolute;
          inset: -20% -10% 0 -10%;
          background:
            radial-gradient(1200px 600px at 50% -10%, rgba(255,255,255,0.08), transparent 60%),
            radial-gradient(800px 400px at 10% 10%, rgba(100,116,255,0.10), transparent 60%),
            radial-gradient(800px 400px at 90% 0%, rgba(16,185,129,0.08), transparent 60%);
          pointer-events: none;
          z-index: 0;
        }

        .hogu-shell {
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
          padding: 20px clamp(16px, 3vw, 32px);
          position: relative;
          z-index: 1;
        }

        .hogu-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .hogu-brand {
          font-weight: 700;
          letter-spacing: 0.5px;
          color: #fff;
          font-size: 22px;
        }

        .hogu-nav .hogu-link {
          margin-left: 12px;
          padding: 10px 14px;
          border-radius: 10px;
          text-decoration: none;
          font-weight: 600;
          border: 1px solid rgba(255,255,255,0.15);
          color: #e6e6e6;
          transition: all .2s ease;
          backdrop-filter: blur(6px);
        }
        .hogu-link:hover { background: rgba(255,255,255,0.06); }
        .hogu-link--primary {
          color: #0b0b0b;
          background: #e32995;
          border-color: transparent;
        }
        .hogu-link--primary:hover {
          transform: translateY(-1px);
          filter: brightness(0.98);
        }

        .hogu-hero {
          text-align: center;
          padding-top: clamp(24px, 6vh, 64px);
          padding-bottom: clamp(32px, 8vh, 96px);
        }

        .hogu-title {
          color: #ffffff;
          font-size: clamp(28px, 5vw, 56px);
          line-height: 1.08;
          letter-spacing: -0.02em;
          margin: 0;
        }
        .hogu-accent {
          background: linear-gradient(135deg, #a5b4fc, #34d399);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .hogu-subtitle {
          margin: 16px auto 0;
          max-width: 680px;
          color: rgba(255,255,255,0.82);
          font-size: clamp(14px, 2.2vw, 18px);
          line-height: 1.6;
        }

        .hogu-cta {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-top: 28px;
          flex-wrap: wrap;
        }

        .hogu-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 12px 18px;
          border-radius: 14px;
          text-decoration: none;
          font-weight: 700;
          font-size: 15px;
          transition: all .2s ease;
          border: 1px solid rgba(255,255,255,0.14);
          backdrop-filter: blur(6px);
        }
        .hogu-btn--primary {
          color: #0b0b0b;
          background: linear-gradient(135deg, #ffffff, #dfe3ff);
          border-color: transparent;
          box-shadow: 0 8px 24px rgba(164, 176, 255, 0.15);
        }
        .hogu-btn--primary:hover { transform: translateY(-1px); }
        .hogu-btn--ghost {
          color: #eaeaea;
          background: rgba(255,255,255,0.06);
        }
        .hogu-btn--ghost:hover {
          background: rgba(255,255,255,0.10);
          transform: translateY(-1px);
        }

        .hogu-section-title {
          color: #ffffff;
          font-size: clamp(22px, 3.5vw, 32px);
          letter-spacing: -0.01em;
          margin: 0 0 1.5rem;
        }

        .hogu-how-it-works {
          margin-top: 3rem;
          text-align: left;
        }
        .hogu-steps {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }
        @media (min-width: 700px) {
          .hogu-steps { grid-template-columns: repeat(2, 1fr); }
        }
        .hogu-step {
          background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 16px;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .hogu-step-num {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #e32995, #a5b4fc);
          color: #fff;
          font-weight: 800;
          font-size: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .hogu-step h3 {
          margin: 0;
          font-size: 17px;
          color: #ffffff;
        }
        .hogu-step p {
          margin: 0;
          font-size: 14px;
          color: rgba(255,255,255,0.75);
          line-height: 1.55;
        }

        .hogu-grid {
          margin-top: 2.5rem;
          display: grid;
          grid-template-columns: repeat(1, minmax(0, 1fr));
          gap: 14px;
        }
        @media (min-width: 700px) {
          .hogu-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (min-width: 1024px) {
          .hogu-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }

        .hogu-card {
          background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03));
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 16px;
          padding: 18px;
          color: #eaeaea;
          text-align: left;
          min-height: 140px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .hogu-card h3 {
          margin: 0;
          font-size: 18px;
          color: #ffffff;
          letter-spacing: -0.01em;
        }
        .hogu-card p {
          margin: 0;
          font-size: 14px;
          color: rgba(255,255,255,0.78);
          line-height: 1.55;
        }

        .hogu-chip {
          align-self: flex-start;
          font-size: 11px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #0b0b0b;
          background: linear-gradient(135deg, #a5b4fc, #34d399);
          padding: 6px 10px;
          border-radius: 999px;
          font-weight: 800;
        }

        .hogu-trust {
          margin-top: 26px;
          color: rgba(255,255,255,0.65);
          font-size: 12.5px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .hogu-trust .dot {
          width: 4px;
          height: 4px;
          background: rgba(255,255,255,0.4);
          border-radius: 999px;
          display: inline-block;
        }

        .hogu-footer {
          padding-top: 18px;
          padding-bottom: 32px;
        }
        .hogu-footer p {
          color: rgba(255,255,255,0.55);
          text-align: center;
          font-size: 12.5px;
          margin: 0;
        }
        `}
      </style>
    </div>
  );
}

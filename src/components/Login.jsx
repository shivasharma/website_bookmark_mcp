import React, { useState, useEffect } from "react";
import { ShieldHalf, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function Login() {
  const [sessionMsg, setSessionMsg] = useState("Checking current session…");
  const [error, setError] = useState("");

  useEffect(() => {
    // Show OAuth error from URL param
    const params = new URLSearchParams(window.location.search);
    const failure = params.get("error");
    if (failure) setError(`OAuth failed: ${failure}`);

    // Check existing session
    (async () => {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        const json = await res.json();
        if (json.success) {
          setSessionMsg(
            `Logged in as ${json.data.name}${json.data.email ? ` (${json.data.email})` : ""}.`
          );
        } else {
          setSessionMsg("Not logged in yet.");
        }
      } catch {
        setSessionMsg("Unable to check session.");
      }
    })();
  }, []);

  return (
    /* Full-screen layout — bypasses the sidebar shell */
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5 overflow-y-auto"
      style={{
        background:
          "radial-gradient(circle at 20% 18%, rgba(124,92,255,0.18) 0, transparent 34%), " +
          "radial-gradient(circle at 80% 84%, rgba(6,214,255,0.14) 0, transparent 32%), " +
          "linear-gradient(160deg, #0d0f1c, #090b15)",
      }}
    >
      {/* Grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(34,37,64,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(34,37,64,0.7) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          opacity: 0.5,
        }}
      />

      {/* Modal card */}
      <div
        className="relative z-10 w-full max-w-[480px] rounded-2xl border border-border bg-card overflow-hidden animate-fade-in"
        style={{ backdropFilter: "blur(16px)" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="loginTitle"
      >
        {/* Header */}
        <div className="border-b border-border px-6 py-5"
          style={{ background: "linear-gradient(180deg, rgba(19,22,40,0.97) 0%, rgba(20,24,46,0.93) 100%)" }}
        >
          <span className="inline-flex items-center gap-1.5 mb-3 px-2.5 py-1 rounded-full border border-white/15 text-[10px] font-bold uppercase tracking-widest text-[#0b1a2a]"
            style={{ background: "linear-gradient(135deg, #7c5cff, #06d6ff)", boxShadow: "0 6px 16px rgba(124,92,255,0.35)" }}
          >
            <ShieldHalf size={11} />
            Secure Login
          </span>
          <h1 id="loginTitle" className="text-xl font-bold text-text-primary m-0 leading-tight">
            Login with OAuth
          </h1>
          <p className="text-text-muted text-sm mt-1.5 leading-relaxed">
            Use Google or GitHub. No local password is stored.
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-3">
          {/* Google */}
          <a
            href="/auth/google"
            className="flex items-center justify-center gap-2.5 w-full px-4 py-3 rounded-xl border border-accent text-accent text-sm font-semibold no-underline hover:bg-accent/10 transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            Continue with Google
          </a>

          {/* GitHub */}
          <a
            href="/auth/github"
            className="flex items-center justify-center gap-2.5 w-full px-4 py-3 rounded-xl border border-accent text-accent text-sm font-semibold no-underline hover:bg-accent/10 transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            Continue with GitHub
          </a>

          {/* Session status */}
          <div className="text-xs text-text-secondary border border-border rounded-xl px-3 py-2.5 bg-card/60">
            {sessionMsg}
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-error min-h-4">{error}</p>
          )}

          {/* Footer */}
          <div className="flex flex-wrap gap-2 mt-1">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 text-xs text-text-primary font-semibold px-3.5 py-2.5 rounded-xl border border-border bg-card/75 hover:border-border-light hover:bg-card-hover hover:-translate-y-0.5 transition-all no-underline"
            >
              <ArrowLeft size={13} />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

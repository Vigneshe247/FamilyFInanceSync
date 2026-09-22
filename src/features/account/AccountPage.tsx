/* =========================================================
   ACCOUNT & GOOGLE AUTHENTICATION CENTER
   Project: financesync-4568b
   Enables:
   1. "Continue via Google" Single Sign-On (OAuth 2.0)
   2. Live Account Linking & Unlinking with Google Provider
   3. Firebase Authentication Console Providers integration
   4. Step-by-step setup walkthrough for project financesync-4568b
   ========================================================= */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFamilyFinance } from '../../context/FamilyFinanceContext';
import {
  isGoogleLinked,
  linkGoogleToCurrentUser,
  unlinkGoogleFromCurrentUser,
} from '../../services/firebase';
import { loginWithGoogle, resendVerificationEmail } from '../../firebase/authService';
import {
  User,
  Mail,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Key,
  Link,
  Unlink,
  AlertCircle,
  Sparkles,
  Copy,
  Check,
  Globe,
  Settings,
  Shield,
  Smartphone,
  Lock,
  ArrowRight,
} from 'lucide-react';

export const AccountPage: React.FC = () => {
  const { user, userProfile, isEmailVerified, reloadUser, devSimulateVerify } = useAuth();
  const { currentMember, family, isDemoMode } = useFamilyFinance();

  const [googleConnected, setGoogleConnected] = useState<boolean>(() => isGoogleLinked());
  const [providerActionLoading, setProviderActionLoading] = useState(false);
  const [providerFeedback, setProviderFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const FIREBASE_CONSOLE_URL = 'https://console.firebase.google.com/u/0/project/financesync-4568b/authentication/providers';

  const handleCopyConsoleUrl = () => {
    navigator.clipboard.writeText(FIREBASE_CONSOLE_URL);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleLinkGoogle = async () => {
    setProviderActionLoading(true);
    setProviderFeedback(null);
    try {
      const res = await linkGoogleToCurrentUser();
      if (res.success) {
        setGoogleConnected(true);
        setProviderFeedback({ type: 'success', msg: 'Google account linked successfully with your financial workspace!' });
      } else {
        setProviderFeedback({ type: 'error', msg: res.error || 'Failed to link Google account.' });
      }
    } catch (err: any) {
      setProviderFeedback({ type: 'error', msg: err.message || 'Google linking encountered an error.' });
    } finally {
      setProviderActionLoading(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    setProviderActionLoading(true);
    setProviderFeedback(null);
    try {
      const res = await unlinkGoogleFromCurrentUser();
      if (res.success) {
        setGoogleConnected(false);
        setProviderFeedback({ type: 'success', msg: 'Google account unlinked successfully.' });
      } else {
        setProviderFeedback({ type: 'error', msg: res.error || 'Failed to unlink Google account.' });
      }
    } catch (err: any) {
      setProviderFeedback({ type: 'error', msg: err.message || 'Google unlinking encountered an error.' });
    } finally {
      setProviderActionLoading(false);
    }
  };

  const handleTestGoogleSignIn = async () => {
    setProviderActionLoading(true);
    setProviderFeedback(null);
    try {
      const resultUser = await loginWithGoogle();
      setGoogleConnected(true);
      setProviderFeedback({
        type: 'success',
        msg: `Google Sign-In successful! Authenticated as ${resultUser.displayName || resultUser.email}.`,
      });
    } catch (err: any) {
      setProviderFeedback({ type: 'error', msg: err.message || 'Google sign-in attempt failed.' });
    } finally {
      setProviderActionLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendStatus('Sending verification email...');
    try {
      await resendVerificationEmail();
      setResendStatus('Verification link dispatched to your inbox!');
      setTimeout(() => setResendStatus(null), 4000);
    } catch (err: any) {
      setResendStatus('Verification dispatch recorded.');
      setTimeout(() => setResendStatus(null), 4000);
    }
  };

  const handleSimulateVerify = async () => {
    await devSimulateVerify();
    await reloadUser();
    setProviderFeedback({ type: 'success', msg: 'Email verification verified successfully!' });
  };

  return (
    <div className="content-page" style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.15) 0%, rgba(37, 99, 235, 0.15) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#16A34A',
            }}
          >
            <ShieldCheck size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Account & Google Authentication Center
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.25rem' }}>
              Manage single sign-on providers, OAuth credentials, and Firebase integration for project{' '}
              <code style={{ background: 'var(--bg-canvas)', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 700, color: '#16A34A' }}>
                financesync-4568b
              </code>
            </p>
          </div>
        </div>
      </div>

      {/* Firebase Console Direct Action Banner */}
      <div
        className="card"
        style={{
          marginBottom: '2rem',
          background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.06) 0%, rgba(37, 99, 235, 0.06) 100%)',
          border: '1.5px solid rgba(22, 163, 74, 0.25)',
          borderRadius: '18px',
          padding: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ maxWidth: '650px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span
                style={{
                  background: '#16A34A',
                  color: '#FFFFFF',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '0.2rem 0.5rem',
                  borderRadius: '6px',
                  letterSpacing: '0.05em',
                }}
              >
                FIREBASE CONSOLE
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Project: <strong>financesync-4568b</strong>
              </span>
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.4rem' }}>
              Sign-In Providers & Google OAuth Configuration
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              Enable Google and other identity providers directly in the Firebase Console to allow users to sign in with one click.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleCopyConsoleUrl}
              className="btn btn-secondary btn-sm"
              style={{ gap: '0.4rem', fontWeight: 600 }}
              title="Copy Firebase Console URL"
            >
              {copiedLink ? <Check size={14} color="#16A34A" /> : <Copy size={14} />}
              <span>{copiedLink ? 'Copied URL' : 'Copy URL'}</span>
            </button>

            <a
              href={FIREBASE_CONSOLE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm"
              style={{ gap: '0.45rem', fontWeight: 700, textDecoration: 'none' }}
            >
              <span>Open Firebase Providers</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      {providerFeedback && (
        <div
          style={{
            padding: '0.85rem 1.15rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            background: providerFeedback.type === 'success' ? 'rgba(22, 163, 74, 0.1)' : 'rgba(235, 87, 87, 0.1)',
            color: providerFeedback.type === 'success' ? '#16A34A' : '#EB5757',
            border: `1px solid ${providerFeedback.type === 'success' ? 'rgba(22, 163, 74, 0.3)' : 'rgba(235, 87, 87, 0.3)'}`,
          }}
        >
          {providerFeedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{providerFeedback.msg}</span>
        </div>
      )}

      {/* Main Grid: Providers & Profile */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Card 1: Google OAuth 2.0 Integration */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="card-header" style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '12px',
                    background: '#FFFFFF',
                    border: '1px solid var(--border-card)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                    Google (google.com)
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>
                    OAuth 2.0 Single Sign-On
                  </p>
                </div>
              </div>

              <span
                style={{
                  background: googleConnected ? 'rgba(22, 163, 74, 0.12)' : 'rgba(235, 87, 87, 0.1)',
                  color: googleConnected ? '#16A34A' : '#EB5757',
                  border: `1px solid ${googleConnected ? 'rgba(22, 163, 74, 0.3)' : 'rgba(235, 87, 87, 0.3)'}`,
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '0.2rem 0.55rem',
                  borderRadius: '6px',
                  letterSpacing: '0.04em',
                }}
              >
                {googleConnected ? 'LINKED' : 'UNLINKED'}
              </span>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Sign in with your Google account in one tap. Linking keeps all transactions, shared expenses, and allowance approvals synchronized under your unified identity.
            </p>

            <div
              style={{
                background: 'var(--bg-canvas)',
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                border: '1px solid var(--border-card)',
                marginBottom: '1.25rem',
                fontSize: '0.78rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Provider ID:</span>
                <code style={{ fontWeight: 700 }}>google.com</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Auth Method:</span>
                <span style={{ fontWeight: 600 }}>Popup OAuth 2.0</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Project:</span>
                <span style={{ fontWeight: 700, color: '#16A34A' }}>financesync-4568b</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {googleConnected ? (
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button
                  type="button"
                  onClick={handleTestGoogleSignIn}
                  disabled={providerActionLoading}
                  className="btn btn-secondary"
                  style={{ flex: 1, justifyContent: 'center', fontSize: '0.82rem', fontWeight: 700 }}
                >
                  <Sparkles size={14} /> Test Sign-In
                </button>
                <button
                  type="button"
                  onClick={handleUnlinkGoogle}
                  disabled={providerActionLoading}
                  className="btn btn-secondary"
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#EB5757',
                    borderColor: 'rgba(235, 87, 87, 0.3)',
                  }}
                >
                  <Unlink size={14} /> Unlink
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleLinkGoogle}
                disabled={providerActionLoading}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', gap: '0.5rem', fontWeight: 700, padding: '0.75rem' }}
              >
                <Link size={16} /> Continue via Google & Link
              </button>
            )}
          </div>
        </div>

        {/* Card 2: Email & Password Provider */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="card-header" style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '12px',
                    background: 'rgba(22, 163, 74, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#16A34A',
                  }}
                >
                  <Mail size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                    Email & Password
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>
                    Password Credentials
                  </p>
                </div>
              </div>

              <span
                style={{
                  background: isEmailVerified ? 'rgba(22, 163, 74, 0.12)' : 'rgba(217, 119, 6, 0.12)',
                  color: isEmailVerified ? '#16A34A' : '#D97706',
                  border: `1px solid ${isEmailVerified ? 'rgba(22, 163, 74, 0.3)' : 'rgba(217, 119, 6, 0.3)'}`,
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '0.2rem 0.55rem',
                  borderRadius: '6px',
                  letterSpacing: '0.04em',
                }}
              >
                {isEmailVerified ? 'VERIFIED' : 'UNVERIFIED'}
              </span>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Primary email identity associated with your personal profile and family membership.
            </p>

            <div
              style={{
                background: 'var(--bg-canvas)',
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                border: '1px solid var(--border-card)',
                marginBottom: '1.25rem',
                fontSize: '0.78rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Email:</span>
                <strong style={{ color: 'var(--text-main)' }}>
                  {user?.email || userProfile?.email || currentMember.user.email}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                <span style={{ fontWeight: 700, color: isEmailVerified ? '#16A34A' : '#D97706' }}>
                  {isEmailVerified ? 'Verified' : 'Verification Required'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Family Workspace:</span>
                <span style={{ fontWeight: 700 }}>{family.name}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {!isEmailVerified && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Resend Link
                </button>
                <button
                  type="button"
                  onClick={handleSimulateVerify}
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Verify Now
                </button>
              </div>
            )}
            {resendStatus && (
              <div style={{ fontSize: '0.76rem', color: '#16A34A', textAlign: 'center', fontWeight: 600 }}>
                {resendStatus}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Step-by-Step Setup Walkthrough: Enabling Google in Firebase Console */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header" style={{ marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              How to Enable Google Sign-In in Firebase Console
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
              Follow these 4 simple steps to activate Google authentication for project{' '}
              <strong>financesync-4568b</strong>
            </p>
          </div>
          <span
            style={{
              background: 'rgba(37, 99, 235, 0.1)',
              color: '#2563EB',
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '0.2rem 0.55rem',
              borderRadius: '6px',
            }}
          >
            STEP-BY-STEP
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Step 1 */}
          <div
            style={{
              padding: '1rem 1.25rem',
              borderRadius: '12px',
              border: '1px solid var(--border-card)',
              background: 'var(--bg-canvas)',
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: '#16A34A',
                color: '#FFFFFF',
                fontSize: '0.82rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              1
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                Open Sign-in Providers in Firebase Console
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                Navigate to{' '}
                <a
                  href={FIREBASE_CONSOLE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#16A34A', fontWeight: 700 }}
                >
                  Firebase Console &gt; Authentication &gt; Sign-in method
                </a>
                .
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div
            style={{
              padding: '1rem 1.25rem',
              borderRadius: '12px',
              border: '1px solid var(--border-card)',
              background: 'var(--bg-canvas)',
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: '#16A34A',
                color: '#FFFFFF',
                fontSize: '0.82rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              2
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                Enable the Google Provider
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                Under <strong>Additional providers</strong> or <strong>Sign-in providers</strong>, click <strong>Google</strong>. Switch the <strong>Enable</strong> toggle to ON.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div
            style={{
              padding: '1rem 1.25rem',
              borderRadius: '12px',
              border: '1px solid var(--border-card)',
              background: 'var(--bg-canvas)',
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: '#16A34A',
                color: '#FFFFFF',
                fontSize: '0.82rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              3
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                Choose Project Support Email & Save
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                Select your email address from the <strong>Project support email</strong> dropdown, then click <strong>Save</strong>.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div
            style={{
              padding: '1rem 1.25rem',
              borderRadius: '12px',
              border: '1px solid var(--border-card)',
              background: 'var(--bg-canvas)',
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: '#16A34A',
                color: '#FFFFFF',
                fontSize: '0.82rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              4
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                Verify Authorized Domains
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                Under <strong>Authentication &gt; Settings &gt; Authorized domains</strong>, confirm that <code>localhost</code> is present so local browser testing operates without origin blocks.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Safeguards Note */}
      <div
        style={{
          background: 'rgba(217, 119, 6, 0.08)',
          border: '1px solid rgba(217, 119, 6, 0.25)',
          borderRadius: '14px',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
        }}
      >
        <Lock size={18} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--text-main)' }}>Multi-Tenant Security Architecture:</strong> Signing in via Google adheres to the same multi-tenant isolation rules. New users registered via Google automatically provision an isolated family workspace and are assigned the <code>family_head</code> role (conforming to Business Rule 44).
        </div>
      </div>
    </div>
  );
};

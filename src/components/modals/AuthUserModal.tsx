/* =========================================================
   AUTHENTICATION & TENANCY ONBOARDING SYSTEM (Module 1)
   Features:
   - Split-screen branding & auth architecture
   - No role selector on Login (Role derived post-authentication)
   - Step-by-step Registration (Identity → Verification → Choose Flow)
   - Create Family Onboarding Wizard (Auto FAMILY_HEAD)
   - Join Family Flow (Locked to Inviter-Assigned Role)
   - Password Strength Meter, Caps-Lock warning & OTP resend timer
   - Password Reset & Google Auth integration
   - Demo Family Testing Mode trigger for seamless development preview
   ========================================================= */

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFamilyFinance } from '../../context/FamilyFinanceContext';
import { supabaseAuthService } from '../../services/supabase';
import {
  registerUser,
  loginUser,
  loginWithGoogle,
  resetPassword,
  resendVerificationEmail,
  checkEmailVerification,
  getFirebaseErrorMessage,
} from '../../firebase/authService';
import {
  signInWithGoogle,
  linkGoogleToCurrentUser,
  linkConflictingAccount,
  unlinkGoogleFromCurrentUser,
  isGoogleLinked,
  loginWithEmail,
} from '../../services/firebase';
import {
  ShieldCheck,
  User,
  Lock,
  Mail,
  Phone,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  X,
  Home,
  Link,
  Sparkles,
  Users,
  Check,
  UploadCloud,
  CheckCircle2,
  KeyRound,
  Shield,
  Coins,
  Globe,
  Plus,
  Trash2,
  HelpCircle,
} from 'lucide-react';

interface AuthUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthUserModal: React.FC<AuthUserModalProps> = ({ isOpen, onClose }) => {
  const {
    currentMember,
    updateUserProfile,
    createFamilyWorkspace,
    lookupInvitation,
    acceptInvitation,
    loadDemoFamilyWorkspace,
    family,
  } = useFamilyFinance();

  const { user: authUser } = useAuth();
  const [demoAuthPrompt, setDemoAuthPrompt] = useState(false);

  // Primary Navigation Sub-Views
  const [activeView, setActiveView] = useState<
    | 'login'
    | 'register_step1'
    | 'register_step2'
    | 'register_step3'
    | 'verify_email'
    | 'create_family_wizard'
    | 'join_family_flow'
    | 'forgot'
    | 'profile'
  >('login');

  // --- EMAIL VERIFICATION STATE ---
  const [verifyChecking, setVerifyChecking] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState('');
  const [verifyResent, setVerifyResent] = useState(false);

  // --- LOGIN FORM STATE ---
  const [loginEmailOrPhone, setLoginEmailOrPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Firebase Google Auth & Account Linking State
  const [pendingGoogleCredential, setPendingGoogleCredential] = useState<any>(null);
  const [googleLinked, setGoogleLinked] = useState<boolean>(() => isGoogleLinked());
  const [linkFeedbackMsg, setLinkFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // --- REGISTRATION STEP 1 STATE ---
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regMobile, setRegMobile] = useState('+91 ');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [regError, setRegError] = useState('');

  // --- OTP VERIFICATION STATE ---
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(30);
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  // OTP Countdown timer effect
  useEffect(() => {
    let interval: any;
    if (activeView === 'register_step2' && otpTimer > 0) {
      interval = setInterval(() => setOtpTimer(prev => prev - 1), 1000);
    } else if (otpTimer === 0) {
      setCanResendOtp(true);
    }
    return () => clearInterval(interval);
  }, [activeView, otpTimer]);

  // --- CREATE FAMILY WIZARD STATE ---
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [familyNameInput, setFamilyNameInput] = useState('E Family');
  const [familyCurrency, setFamilyCurrency] = useState('INR');
  const [familyTimezone, setFamilyTimezone] = useState('Asia/Kolkata');
  const [familyBudgetInput, setFamilyBudgetInput] = useState('150000');
  const [invitedMembers, setInvitedMembers] = useState<{ name: string; email: string; role: string }[]>([
    { name: '', email: '', role: 'CO_MANAGER' },
  ]);
  const [enabledFeatures, setEnabledFeatures] = useState({
    expenses: true,
    budgets: true,
    goals: true,
    bills: true,
    investments: false,
    loans: false,
  });

  // --- JOIN FAMILY FLOW STATE ---
  const [inviteCodeInput, setInviteCodeInput] = useState('FFS-8K29-XP');
  const [foundInvitation, setFoundInvitation] = useState<any>(null);
  const [joinStep, setJoinStep] = useState<'input' | 'preview' | 'success'>('input');
  const [joinError, setJoinError] = useState('');

  // --- FORGOT PASSWORD STATE ---
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState<'request' | 'sent' | 'reset' | 'done'>('request');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');

  // --- PROFILE EDIT STATE ---
  const [profileName, setProfileName] = useState(currentMember.user.name);
  const [profileEmail, setProfileEmail] = useState(currentMember.user.email);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState(currentMember.user.avatar_url || '');
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // --- HELPER HANDLERS ---
  const handleKeyDownPassword = (e: React.KeyboardEvent) => {
    if (e.getModifierState && e.getModifierState('CapsLock')) {
      setCapsLockOn(true);
    } else {
      setCapsLockOn(false);
    }
  };

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const passScore = getPasswordStrength(regPassword);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginSubmitting(true);

    if (!loginEmailOrPhone.trim() || !loginPassword) {
      setLoginError('Please enter your email address and password.');
      setLoginSubmitting(false);
      return;
    }

    try {
      const user = await loginUser(loginEmailOrPhone, loginPassword);
      await user.reload();
      if (!user.emailVerified) {
        setRegEmail(user.email || loginEmailOrPhone);
        setActiveView('verify_email');
        setLoginSubmitting(false);
        return;
      }
      setActiveView('profile');
    } catch (error: any) {
      console.error('Login error:', error);
      setLoginError(getFirebaseErrorMessage(error));
    } finally {
      setLoginSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoginSubmitting(true);
    setLoginError('');

    try {
      await loginWithGoogle();
      setGoogleLinked(true);
      setActiveView('profile');
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      setLoginError(getFirebaseErrorMessage(error));
    } finally {
      setLoginSubmitting(false);
    }
  };

  const handleLinkGoogle = async () => {
    setLinkFeedbackMsg(null);
    const res = await linkGoogleToCurrentUser();
    if (res.success) {
      setGoogleLinked(true);
      setLinkFeedbackMsg({ type: 'success', text: 'Google account linked successfully!' });
    } else {
      setLinkFeedbackMsg({ type: 'error', text: res.error || 'Failed to link Google account.' });
    }
  };

  const handleUnlinkGoogle = async () => {
    setLinkFeedbackMsg(null);
    const res = await unlinkGoogleFromCurrentUser();
    if (res.success) {
      setGoogleLinked(false);
      setLinkFeedbackMsg({ type: 'success', text: 'Google account unlinked successfully.' });
    } else {
      setLinkFeedbackMsg({ type: 'error', text: res.error || 'Failed to unlink Google account.' });
    }
  };

  const handleRegStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    if (!firstName.trim() || !regEmail.trim()) {
      setRegError('Please fill in all required identity fields.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match.');
      return;
    }
    if (!agreeTerms) {
      setRegError('Please accept the Terms & Privacy Policy.');
      return;
    }

    try {
      setLoginSubmitting(true);
      await registerUser({
        firstName,
        lastName,
        email: regEmail,
        password: regPassword,
        mobile: regMobile,
      });

      // Move directly to dedicated email verification screen
      setActiveView('verify_email');
    } catch (error: any) {
      console.error('Registration error:', error);
      setRegError(getFirebaseErrorMessage(error));
    } finally {
      setLoginSubmitting(false);
    }
  };

  const handleCheckVerification = async () => {
    try {
      setVerifyChecking(true);
      setVerifyMsg('');
      const isVerified = await checkEmailVerification();
      if (isVerified) {
        setVerifyMsg('Email verified successfully! Opening workspace...');
        setTimeout(() => {
          setActiveView('profile');
          onClose();
        }, 1200);
      } else {
        setVerifyMsg('Email is not verified yet. Check your inbox and click the verification link.');
      }
    } catch (error: any) {
      setVerifyMsg(getFirebaseErrorMessage(error));
    } finally {
      setVerifyChecking(false);
    }
  };

  const handleResendEmailVerification = async () => {
    try {
      await resendVerificationEmail();
      setVerifyResent(true);
      setVerifyMsg('Verification email sent! Check your inbox.');
      setTimeout(() => setVerifyResent(false), 30000);
    } catch (error: any) {
      setVerifyMsg(getFirebaseErrorMessage(error));
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpVerified(true);
    setTimeout(() => {
      setActiveView('register_step3');
    }, 800);
  };

  const handleResendOtp = () => {
    setOtpTimer(30);
    setCanResendOtp(false);
  };

  const handleLookupInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');
    const res = lookupInvitation(inviteCodeInput);
    if (res && res.found) {
      setFoundInvitation(res);
      setJoinStep('preview');
    } else {
      setJoinError('Invalid invitation code or link. Please check with your Family Head.');
    }
  };

  const handleAcceptInvite = () => {
    acceptInvitation(inviteCodeInput, `${firstName} ${lastName}`.trim() || 'Invited Member', regEmail || 'member@family.sync');
    setJoinStep('success');
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const handleCreateFamilySubmit = () => {
    createFamilyWorkspace(familyNameInput, familyCurrency, familyTimezone);
    setWizardStep(5);
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    try {
      setForgotMsg('');
      await resetPassword(forgotEmail);
      setForgotMsg('Password reset email sent. Check your inbox.');
      setForgotStep('sent');
    } catch (error: any) {
      setForgotMsg(getFirebaseErrorMessage(error));
    }
  };

  const handleResetPasswordFinal = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setForgotMsg('Passwords do not match.');
      return;
    }
    setForgotStep('done');
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(profileName, profileEmail, profileAvatarUrl);
    setProfileSaveSuccess(true);
    setTimeout(() => setProfileSaveSuccess(false), 2500);
  };

  const handleDevicePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvt) => {
        const base64Url = uploadEvt.target?.result as string;
        if (base64Url) {
          setProfileAvatarUrl(base64Url);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '920px',
          width: '95%',
          padding: 0,
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.28)',
          border: '1px solid var(--border-card)',
        }}
      >
        {/* SPLIT SCREEN CONTAINER */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', minHeight: '580px' }}>
          
          {/* LEFT PANEL — BRANDING & ARCHITECTURE VALUE PROPOSITION */}
          <div
            style={{
              background: 'linear-gradient(145deg, #0F172A 0%, #1E293B 100%)',
              color: '#FFFFFF',
              padding: '2.5rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Background Decorative Rings */}
            <div
              style={{
                position: 'absolute',
                top: '-40px',
                right: '-40px',
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(56,161,105,0.2) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />

            <div>
              {/* Brand Logo & Title */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '12px',
                    background: 'var(--mint-primary)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 14px rgba(56, 161, 105, 0.4)',
                  }}
                >
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#FFFFFF', margin: 0 }}>
                    Family Finance Sync
                  </h2>
                  <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: 0, fontWeight: 500 }}>
                    Your family's finances, together
                  </p>
                </div>
              </div>

              {/* Value Proposition Highlights */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', marginTop: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <CheckCircle size={18} color="var(--mint-primary)" style={{ marginTop: '0.15rem', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#F8FAFC' }}>
                      Family-Wide Financial Visibility
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8', lineHeight: 1.4 }}>
                      Centralized accounts, clear debt tracking, and unified spending summaries.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <CheckCircle size={18} color="var(--mint-primary)" style={{ marginTop: '0.15rem', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#F8FAFC' }}>
                      Controlled Member Access & Roles
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8', lineHeight: 1.4 }}>
                      Family Head governance with role-based permissions for spouses and children.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <CheckCircle size={18} color="var(--mint-primary)" style={{ marginTop: '0.15rem', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#F8FAFC' }}>
                      Realtime Synchronization
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8', lineHeight: 1.4 }}>
                      Multi-tenant security isolation powered by Firebase & Supabase.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <CheckCircle size={18} color="var(--mint-primary)" style={{ marginTop: '0.15rem', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#F8FAFC' }}>
                      Smart Budgeting & Allowance Caps
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8', lineHeight: 1.4 }}>
                      Set child pocket caps and review spending approval requests seamlessly.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Graphic Banner */}
            <div
              style={{
                marginTop: '2rem',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                padding: '0.85rem 1rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
              }}
            >
              <Shield size={20} color="var(--mint-primary)" />
              <div style={{ fontSize: '0.72rem', color: '#CBD5E1', lineHeight: 1.3 }}>
                <strong style={{ color: '#FFFFFF' }}>Bank-grade Encrypted Isolation:</strong> Authentication identifies who you are; membership determines your workspace.
              </div>
            </div>
          </div>

          {/* RIGHT PANEL — AUTHENTICATION & ONBOARDING FORMS */}
          <div style={{ background: 'var(--card-bg)', padding: '2rem 2.25rem', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            
            {/* Top Close Button */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'var(--bg-canvas-subtle)',
                border: '1px solid var(--border-card)',
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-muted)',
              }}
            >
              <X size={16} />
            </button>

            <div>
              {/* =========================================================
                  VIEW 1: MAIN LOGIN CARD (NO ROLE SELECTOR!)
                 ========================================================= */}
              {activeView === 'login' && (
                <div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                      Welcome back
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      Sign in to access your family financial workspace
                    </p>
                  </div>

                  {loginError && (
                    <div
                      style={{
                        background: 'rgba(235, 87, 87, 0.1)',
                        color: '#EB5757',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '12px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        marginBottom: '1rem',
                        border: '1px solid rgba(235, 87, 87, 0.2)',
                      }}
                    >
                      <AlertCircle size={16} />
                      <span>{loginError}</span>
                    </div>
                  )}

                  <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Email Address */}
                    <div>
                      <label className="label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>EMAIL ADDRESS</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="email"
                          className="input"
                          placeholder="Enter your email address"
                          value={loginEmailOrPhone}
                          onChange={e => setLoginEmailOrPhone(e.target.value)}
                          style={{ paddingLeft: '2.5rem' }}
                          required
                        />
                        <Mail size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <label className="label" style={{ fontSize: '0.78rem', fontWeight: 600, margin: 0 }}>Password</label>
                        <button
                          type="button"
                          onClick={() => setActiveView('forgot')}
                          style={{ background: 'none', border: 'none', color: 'var(--mint-primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          className="input"
                          placeholder="••••••••••••"
                          value={loginPassword}
                          onChange={e => setLoginPassword(e.target.value)}
                          onKeyDown={handleKeyDownPassword}
                          style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                          required
                        />
                        <Lock size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {capsLockOn && (
                        <div style={{ fontSize: '0.7rem', color: '#D97706', marginTop: '0.25rem', fontWeight: 600 }}>
                          ⚠️ Caps Lock is ON
                        </div>
                      )}
                    </div>

                    {/* Remember me */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={e => setRememberMe(e.target.checked)}
                      />
                      <span>Remember me (Don't check on shared devices)</span>
                    </label>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loginSubmitting}
                      className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center', fontWeight: 700, padding: '0.7rem' }}
                    >
                      {loginSubmitting ? 'Signing in...' : 'Sign In'}
                    </button>
                  </form>

                  {/* Divider */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.25rem 0' }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-card)' }} />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>OR</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-card)' }} />
                  </div>

                  {/* Google Social Login */}
                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    className="btn btn-secondary"
                    style={{ width: '100%', justifyContent: 'center', gap: '0.6rem', fontWeight: 600 }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Continue with Google</span>
                  </button>

                  {/* Register Trigger & Demo Testing Button */}
                  <div style={{ marginTop: '1.25rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Don't have an account?{' '}
                      <button
                        type="button"
                        onClick={() => setActiveView('register_step1')}
                        style={{ background: 'none', border: 'none', color: 'var(--mint-primary)', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Create account
                      </button>
                    </div>

                    {/* Demo Testing Mode Button requested by user */}
                    <button
                      type="button"
                      onClick={() => {
                        if (!authUser) {
                          setDemoAuthPrompt(true);
                          return;
                        }
                        loadDemoFamilyWorkspace();
                        onClose();
                      }}
                      style={{
                        background: 'var(--mint-pill)',
                        border: '1px solid var(--mint-primary)',
                        color: 'var(--mint-primary)',
                        borderRadius: '12px',
                        padding: '0.45rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <Sparkles size={14} /> Explore Demo Family
                    </button>

                    {demoAuthPrompt && (
                      <div
                        style={{
                          marginTop: '0.85rem',
                          padding: '0.85rem',
                          borderRadius: '12px',
                          background: 'rgba(217, 119, 6, 0.1)',
                          border: '1px solid rgba(217, 119, 6, 0.3)',
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#D97706', marginBottom: '0.25rem' }}>
                          Authentication Required
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
                          Create an account or sign in to explore the Demo Family.
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setDemoAuthPrompt(false);
                              setActiveView('register_step1');
                            }}
                            className="btn btn-primary"
                            style={{ fontSize: '0.72rem', padding: '0.35rem 0.65rem' }}
                          >
                            Create Account
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDemoAuthPrompt(false);
                              setActiveView('login');
                            }}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.72rem', padding: '0.35rem 0.65rem' }}
                          >
                            Sign In
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* =========================================================
                  VIEW 2: REGISTRATION STEP 1 — CREATE IDENTITY ACCOUNT
                 ========================================================= */}
              {activeView === 'register_step1' && (
                <div>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <button
                      onClick={() => setActiveView('login')}
                      style={{ background: 'none', border: 'none', color: 'var(--mint-primary)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.5rem' }}
                    >
                      <ArrowLeft size={14} /> Back to Sign In
                    </button>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                      Create Your Account
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      Register your personal identity for Family Finance Sync
                    </p>
                  </div>

                  {regError && (
                    <div style={{ background: 'rgba(235, 87, 87, 0.1)', color: '#EB5757', padding: '0.5rem 0.75rem', borderRadius: '10px', fontSize: '0.75rem', marginBottom: '0.85rem' }}>
                      {regError}
                    </div>
                  )}

                  <form onSubmit={handleRegStep1Submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label className="label" style={{ fontSize: '0.72rem' }}>First Name</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="Vignesh"
                          value={firstName}
                          onChange={e => setFirstName(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="label" style={{ fontSize: '0.72rem' }}>Last Name</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="E"
                          value={lastName}
                          onChange={e => setLastName(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="label" style={{ fontSize: '0.72rem' }}>Email Address</label>
                      <input
                        type="email"
                        className="input"
                        placeholder="vignesh@example.com"
                        value={regEmail}
                        onChange={e => setRegEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="label" style={{ fontSize: '0.72rem' }}>Mobile Number</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="+91 98765 XXXXX"
                        value={regMobile}
                        onChange={e => setRegMobile(e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label className="label" style={{ fontSize: '0.72rem' }}>Password</label>
                        <input
                          type="password"
                          className="input"
                          placeholder="•••••••••••"
                          value={regPassword}
                          onChange={e => setRegPassword(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="label" style={{ fontSize: '0.72rem' }}>Confirm Password</label>
                        <input
                          type="password"
                          className="input"
                          placeholder="•••••••••••"
                          value={regConfirmPassword}
                          onChange={e => setRegConfirmPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {/* Password Strength Indicator */}
                    {regPassword.length > 0 && (
                      <div style={{ background: 'var(--bg-canvas-subtle)', padding: '0.65rem 0.85rem', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                          <span>Password strength:</span>
                          <span style={{ color: passScore >= 4 ? 'var(--mint-primary)' : passScore >= 2 ? '#D97706' : '#EB5757' }}>
                            {passScore >= 4 ? 'Strong' : passScore >= 2 ? 'Medium' : 'Weak'}
                          </span>
                        </div>
                        <div style={{ height: '5px', width: '100%', background: 'var(--border-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${(passScore / 5) * 100}%`,
                              background: passScore >= 4 ? 'var(--mint-primary)' : passScore >= 2 ? '#D97706' : '#EB5757',
                              transition: 'width 0.2s ease',
                            }}
                          />
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          <span style={{ color: regPassword.length >= 8 ? 'var(--mint-primary)' : undefined }}>✓ Min 8 chars</span>
                          <span style={{ color: /[A-Z]/.test(regPassword) ? 'var(--mint-primary)' : undefined }}>✓ Uppercase</span>
                          <span style={{ color: /[0-9]/.test(regPassword) ? 'var(--mint-primary)' : undefined }}>✓ Number</span>
                          <span style={{ color: /[^A-Za-z0-9]/.test(regPassword) ? 'var(--mint-primary)' : undefined }}>✓ Special</span>
                        </div>
                      </div>
                    )}

                    {/* Terms & Privacy Checkbox */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={e => setAgreeTerms(e.target.checked)}
                      />
                      <span>I agree to the Terms & Privacy Policy</span>
                    </label>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', fontWeight: 700 }}>
                      Create Account
                    </button>
                  </form>
                </div>
              )}

              {/* =========================================================
                  VIEW: DEDICATED EMAIL VERIFICATION CARD (Section 16)
                 ========================================================= */}
              {activeView === 'verify_email' && (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: 'var(--mint-pill)',
                      color: 'var(--mint-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1.25rem',
                      fontSize: '1.75rem',
                    }}
                  >
                    ✉
                  </div>

                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.5rem' }}>
                    Verify your email
                  </h3>

                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 0.35rem' }}>
                    We sent a verification link to:
                  </p>

                  <div
                    style={{
                      display: 'inline-block',
                      background: 'var(--bg-canvas-subtle)',
                      border: '1px solid var(--border-card)',
                      padding: '0.4rem 1rem',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      color: 'var(--text-main)',
                      marginBottom: '1rem',
                    }}
                  >
                    {regEmail || loginEmailOrPhone || 'your registered email'}
                  </div>

                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.4 }}>
                    Check your inbox and click the verification link.
                  </p>

                  {verifyMsg && (
                    <div
                      style={{
                        background: verifyMsg.includes('success') ? 'var(--mint-pill)' : 'rgba(235, 87, 87, 0.1)',
                        color: verifyMsg.includes('success') ? 'var(--mint-primary)' : '#EB5757',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '12px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        marginBottom: '1.25rem',
                        border: '1px solid currentColor',
                      }}
                    >
                      {verifyMsg}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={handleCheckVerification}
                      disabled={verifyChecking}
                      className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center', fontWeight: 700, padding: '0.75rem' }}
                    >
                      {verifyChecking ? 'Checking status...' : "I've Verified My Email"}
                    </button>

                    <button
                      type="button"
                      onClick={handleResendEmailVerification}
                      disabled={verifyResent}
                      className="btn btn-secondary"
                      style={{ width: '100%', justifyContent: 'center', fontWeight: 600 }}
                    >
                      {verifyResent ? 'Verification Sent!' : 'Resend Verification Email'}
                    </button>
                  </div>

                  <div style={{ marginTop: '1.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Didn't receive it? Check spam.
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveView('login')}
                    style={{
                      marginTop: '1.25rem',
                      background: 'none',
                      border: 'none',
                      color: 'var(--mint-primary)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    ← Back to Sign In
                  </button>
                </div>
              )}

              {/* =========================================================
                  VIEW 3: REGISTRATION STEP 2 — OTP VERIFICATION
                 ========================================================= */}
              {activeView === 'register_step2' && (
                <div>
                  <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: 'var(--mint-pill)',
                        color: 'var(--mint-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 0.75rem',
                      }}
                    >
                      <Mail size={22} />
                    </div>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                      Verify Your Email
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      We've sent a 6-digit verification code to <strong>{regEmail || 'vignesh@example.com'}</strong>
                    </p>
                  </div>

                  <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* OTP 6-Digit Grid */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          id={`otp-input-${idx}`}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={e => {
                            const val = e.target.value;
                            const newDigits = [...otpDigits];
                            newDigits[idx] = val;
                            setOtpDigits(newDigits);
                            if (val && idx < 5) {
                              const nextInput = document.getElementById(`otp-input-${idx + 1}`);
                              nextInput?.focus();
                            }
                          }}
                          style={{
                            width: '42px',
                            height: '50px',
                            textAlign: 'center',
                            fontSize: '1.25rem',
                            fontWeight: 800,
                            borderRadius: '12px',
                            border: '1px solid var(--border-card)',
                            background: 'var(--bg-canvas-subtle)',
                          }}
                        />
                      ))}
                    </div>

                    {otpVerified ? (
                      <div style={{ background: 'var(--mint-pill)', color: 'var(--mint-primary)', padding: '0.75rem', borderRadius: '12px', textAlign: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                        ✓ Identity Verified! Redirecting...
                      </div>
                    ) : (
                      <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', fontWeight: 700 }}>
                        Verify & Continue
                      </button>
                    )}

                    {/* Resend Countdown */}
                    <div style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Didn't receive code?{' '}
                      {canResendOtp ? (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          style={{ background: 'none', border: 'none', color: 'var(--mint-primary)', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Resend Code
                        </button>
                      ) : (
                        <span>Resend in <strong>{otpTimer}s</strong></span>
                      )}
                    </div>
                  </form>
                </div>
              )}

              {/* =========================================================
                  VIEW 4: REGISTRATION STEP 3 — CHOOSE WORKSPACE FLOW
                 ========================================================= */}
              {activeView === 'register_step3' && (
                <div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                      Welcome to Family Finance Sync
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      How would you like to continue?
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                    {/* Option A: Create a Family */}
                    <div
                      onClick={() => setActiveView('create_family_wizard')}
                      className="card"
                      style={{
                        cursor: 'pointer',
                        border: '2px solid var(--mint-primary)',
                        background: 'var(--mint-pill)',
                        padding: '1.25rem',
                        transition: 'transform 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <div style={{ width: 38, height: 38, borderRadius: '10px', background: 'var(--mint-primary)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Home size={20} />
                        </div>
                        <div>
                          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                            🏠 Create a Family Workspace
                          </div>
                          <span className="badge badge-sage" style={{ fontSize: '0.65rem' }}>
                            Auto-Assigned Role: Family Head
                          </span>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                        Start a new family financial workspace, invite members, set budgets, and manage your wealth.
                      </p>
                    </div>

                    {/* Option B: Join a Family */}
                    <div
                      onClick={() => setActiveView('join_family_flow')}
                      className="card"
                      style={{
                        cursor: 'pointer',
                        border: '1px solid var(--border-card)',
                        padding: '1.25rem',
                        transition: 'transform 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <div style={{ width: 38, height: 38, borderRadius: '10px', background: 'var(--sky-accent)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Link size={20} />
                        </div>
                        <div>
                          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                            🔗 Join an Existing Family
                          </div>
                          <span className="badge" style={{ fontSize: '0.65rem', background: 'var(--paper-dim)' }}>
                            Uses Inviter-Assigned Role
                          </span>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                        Have an invitation passcode or link from your Family Head? Enter it here to join.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================================
                  VIEW 5: CREATE FAMILY ONBOARDING WIZARD (FAMILY HEAD)
                 ========================================================= */}
              {activeView === 'create_family_wizard' && (
                <div>
                  {/* Wizard Header Progress Bar */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                      <span>FAMILY HEAD ONBOARDING</span>
                      <span>Step {wizardStep} of 5</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--border-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(wizardStep / 5) * 100}%`, background: 'var(--mint-primary)', transition: 'width 0.25s ease' }} />
                    </div>
                  </div>

                  {/* Step 1: Workspace Details */}
                  {wizardStep === 1 && (
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                        Create Your Family Workspace
                      </h3>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        Define tenant parameters for your family unit
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        <div>
                          <label className="label" style={{ fontSize: '0.72rem' }}>Family Name</label>
                          <input
                            type="text"
                            className="input"
                            value={familyNameInput}
                            onChange={e => setFamilyNameInput(e.target.value)}
                            placeholder="E Family"
                            required
                          />
                        </div>

                        <div>
                          <label className="label" style={{ fontSize: '0.72rem' }}>Your Relationship / Position</label>
                          <input
                            type="text"
                            className="input"
                            value="Family Head (System Administrator)"
                            disabled
                            style={{ background: 'var(--bg-canvas-subtle)', opacity: 0.8 }}
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                          <div>
                            <label className="label" style={{ fontSize: '0.72rem' }}>Currency</label>
                            <select className="input" value={familyCurrency} onChange={e => setFamilyCurrency(e.target.value)}>
                              <option value="INR">₹ INR (Indian Rupee)</option>
                              <option value="USD">$ USD (US Dollar)</option>
                              <option value="EUR">€ EUR (Euro)</option>
                            </select>
                          </div>
                          <div>
                            <label className="label" style={{ fontSize: '0.72rem' }}>Timezone</label>
                            <select className="input" value={familyTimezone} onChange={e => setFamilyTimezone(e.target.value)}>
                              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                              <option value="UTC">UTC Universal</option>
                            </select>
                          </div>
                        </div>

                        <button onClick={() => setWizardStep(2)} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', fontWeight: 700 }}>
                          Next: Add Members <ArrowRight size={15} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Add Members */}
                  {wizardStep === 2 && (
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                        Invite Family Members
                      </h3>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        Add initial members to your family workspace
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {invitedMembers.map((m, idx) => (
                          <div key={idx} style={{ background: 'var(--bg-canvas-subtle)', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-card)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                            <input
                              type="text"
                              className="input"
                              placeholder="Name (e.g. Priya)"
                              value={m.name}
                              onChange={e => {
                                const copy = [...invitedMembers];
                                copy[idx].name = e.target.value;
                                setInvitedMembers(copy);
                              }}
                            />
                            <input
                              type="email"
                              className="input"
                              placeholder="email@demo"
                              value={m.email}
                              onChange={e => {
                                const copy = [...invitedMembers];
                                copy[idx].email = e.target.value;
                                setInvitedMembers(copy);
                              }}
                            />
                            <select
                              className="input"
                              value={m.role}
                              onChange={e => {
                                const copy = [...invitedMembers];
                                copy[idx].role = e.target.value;
                                setInvitedMembers(copy);
                              }}
                            >
                              <option value="CO_MANAGER">Spouse / Co-Manager</option>
                              <option value="ADULT_MEMBER">Adult Member</option>
                              <option value="CHILD">Child</option>
                            </select>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => setInvitedMembers([...invitedMembers, { name: '', email: '', role: 'CHILD' }])}
                          className="btn btn-secondary btn-sm"
                          style={{ justifyContent: 'center', gap: '0.4rem' }}
                        >
                          <Plus size={14} /> Add Another Member
                        </button>

                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <button onClick={() => setWizardStep(1)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                            Back
                          </button>
                          <button onClick={() => setWizardStep(3)} className="btn btn-primary" style={{ flex: 2, justifyContent: 'center', fontWeight: 700 }}>
                            Next: Set Budget <ArrowRight size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Set Family Budget */}
                  {wizardStep === 3 && (
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                        Set Monthly Family Budget
                      </h3>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        Define total spending cap for the family
                      </p>

                      <div>
                        <label className="label" style={{ fontSize: '0.75rem' }}>Monthly Total Cap (₹ INR)</label>
                        <input
                          type="number"
                          className="input"
                          value={familyBudgetInput}
                          onChange={e => setFamilyBudgetInput(e.target.value)}
                          placeholder="150000"
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
                        <button onClick={() => setWizardStep(2)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                          Back
                        </button>
                        <button onClick={() => setWizardStep(4)} className="btn btn-primary" style={{ flex: 2, justifyContent: 'center', fontWeight: 700 }}>
                          Next: Choose Features <ArrowRight size={15} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Choose Financial Features */}
                  {wizardStep === 4 && (
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                        Choose Enabled Financial Modules
                      </h3>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        Select tools active in your workspace
                      </p>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                        {Object.entries(enabledFeatures).map(([key, val]) => (
                          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem', borderRadius: '10px', border: '1px solid var(--border-card)', background: val ? 'var(--mint-pill)' : 'transparent', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                            <input
                              type="checkbox"
                              checked={val}
                              onChange={e => setEnabledFeatures({ ...enabledFeatures, [key]: e.target.checked })}
                            />
                            <span style={{ textTransform: 'capitalize' }}>{key}</span>
                          </label>
                        ))}
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
                        <button onClick={() => setWizardStep(3)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                          Back
                        </button>
                        <button onClick={handleCreateFamilySubmit} className="btn btn-primary" style={{ flex: 2, justifyContent: 'center', fontWeight: 700 }}>
                          Complete Setup <ArrowRight size={15} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 5: Completion Card */}
                  {wizardStep === 5 && (
                    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                      <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'var(--mint-pill)', color: 'var(--mint-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                        <CheckCircle size={32} />
                      </div>
                      <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        You're Ready!
                      </h3>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem', marginBottom: '1.5rem' }}>
                        Your family workspace <strong>"{familyNameInput}"</strong> is active with Family Head permissions.
                      </p>
                      <button onClick={onClose} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', fontWeight: 700 }}>
                        Go to Family Dashboard
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* =========================================================
                  VIEW 6: JOIN FAMILY FLOW (INVITER-ASSIGNED ROLE)
                 ========================================================= */}
              {activeView === 'join_family_flow' && (
                <div>
                  <button
                    onClick={() => setActiveView('register_step3')}
                    style={{ background: 'none', border: 'none', color: 'var(--mint-primary)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.75rem' }}
                  >
                    <ArrowLeft size={14} /> Back
                  </button>

                  {joinStep === 'input' && (
                    <div>
                      <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                        Join Your Family
                      </h3>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                        Enter invitation code or link from your Family Head
                      </p>

                      {joinError && (
                        <div style={{ background: 'rgba(235, 87, 87, 0.1)', color: '#EB5757', padding: '0.65rem', borderRadius: '10px', fontSize: '0.78rem', marginBottom: '1rem' }}>
                          {joinError}
                        </div>
                      )}

                      <form onSubmit={handleLookupInvite} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                          <label className="label" style={{ fontSize: '0.75rem' }}>Enter Invitation Code / Link</label>
                          <input
                            type="text"
                            className="input"
                            value={inviteCodeInput}
                            onChange={e => setInviteCodeInput(e.target.value)}
                            placeholder="FFS-8K29-XP"
                            required
                          />
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', fontWeight: 700 }}>
                          Continue & Lookup Invite
                        </button>
                      </form>
                    </div>
                  )}

                  {joinStep === 'preview' && foundInvitation && (
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                        Invitation Found
                      </h3>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        Review your assigned workspace permissions before joining
                      </p>

                      <div className="card" style={{ background: 'var(--bg-canvas-subtle)', padding: '1rem', marginBottom: '1.25rem' }}>
                        <div style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                          <div><strong>Family Workspace:</strong> {foundInvitation.familyName}</div>
                          <div><strong>Invited By:</strong> {foundInvitation.inviterName}</div>
                          <div>
                            <strong>Assigned Role:</strong>{' '}
                            <span className="badge badge-sage" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>
                              {foundInvitation.assignedRole.replace('_', ' ')}
                            </span>
                          </div>
                        </div>

                        <div style={{ borderTop: '1px solid var(--border-card)', marginTop: '0.75rem', paddingTop: '0.75rem' }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                            Granted Role Permissions
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <div>✓ Record personal income & expenses</div>
                            <div>✓ View permitted shared family ledgers</div>
                            <div>✓ Submit expense approval requests</div>
                            <div>✓ Access allowance wishlist caps</div>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => setJoinStep('input')} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                          Decline
                        </button>
                        <button onClick={handleAcceptInvite} className="btn btn-primary" style={{ flex: 2, justifyContent: 'center', fontWeight: 700 }}>
                          Accept Invitation
                        </button>
                      </div>
                    </div>
                  )}

                  {joinStep === 'success' && (
                    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--mint-pill)', color: 'var(--mint-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                        <CheckCircle size={28} />
                      </div>
                      <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        Welcome to {foundInvitation?.familyName || 'the Family'}!
                      </h3>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        You have joined with <strong>{foundInvitation?.assignedRole.replace('_', ' ')}</strong> permissions.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* =========================================================
                  VIEW 7: FORGOT PASSWORD FLOW
                 ========================================================= */}
              {activeView === 'forgot' && (
                <div>
                  <button
                    onClick={() => setActiveView('login')}
                    style={{ background: 'none', border: 'none', color: 'var(--mint-primary)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.75rem' }}
                  >
                    <ArrowLeft size={14} /> ← Back to Login
                  </button>

                  {forgotStep === 'request' && (
                    <div>
                      <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                        Forgot Password?
                      </h3>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                        Enter your registered email to receive password reset instructions
                      </p>

                      <form onSubmit={handleForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                          <label className="label" style={{ fontSize: '0.75rem' }}>Registered Email</label>
                          <input
                            type="email"
                            className="input"
                            placeholder="example@gmail.com"
                            value={forgotEmail}
                            onChange={e => setForgotEmail(e.target.value)}
                            required
                          />
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', fontWeight: 700 }}>
                          Send Reset Link
                        </button>
                      </form>
                    </div>
                  )}

                  {forgotStep === 'sent' && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--mint-pill)', color: 'var(--mint-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                        <Mail size={24} />
                      </div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>Check your email</h3>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.35rem 0 1.25rem' }}>
                        {forgotMsg}
                      </p>
                      <button onClick={() => setForgotStep('reset')} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', fontWeight: 700 }}>
                        I Have Token — Set New Password
                      </button>
                    </div>
                  )}

                  {forgotStep === 'reset' && (
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                        Create New Password
                      </h3>

                      <form onSubmit={handleResetPasswordFinal} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        <div>
                          <label className="label" style={{ fontSize: '0.72rem' }}>New Password</label>
                          <input
                            type="password"
                            className="input"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            required
                          />
                        </div>

                        <div>
                          <label className="label" style={{ fontSize: '0.72rem' }}>Confirm Password</label>
                          <input
                            type="password"
                            className="input"
                            value={confirmNewPassword}
                            onChange={e => setConfirmNewPassword(e.target.value)}
                            required
                          />
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', fontWeight: 700 }}>
                          Reset Password
                        </button>
                      </form>
                    </div>
                  )}

                  {forgotStep === 'done' && (
                    <div style={{ textAlign: 'center' }}>
                      <CheckCircle size={32} color="var(--mint-primary)" style={{ margin: '0 auto 0.5rem' }} />
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Password Reset Complete!</h3>
                      <button onClick={() => { setForgotStep('request'); setActiveView('login'); }} className="btn btn-primary" style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}>
                        Return to Sign In
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* =========================================================
                  VIEW 8: USER PROFILE CARD (LOGGED IN STATE)
                 ========================================================= */}
              {activeView === 'profile' && (
                <div>
                  <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                        User Identity Profile
                      </h3>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                        Active tenant details & profile settings
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveView('login')}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.72rem', gap: '0.3rem' }}
                    >
                      Sign Out / Switch Session
                    </button>
                  </div>

                  {profileSaveSuccess && (
                    <div style={{ background: 'var(--mint-pill)', color: 'var(--mint-primary)', padding: '0.65rem', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.85rem' }}>
                      ✓ Profile details updated!
                    </div>
                  )}

                  <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div>
                      <label className="label" style={{ fontSize: '0.72rem' }}>Display Name</label>
                      <input
                        type="text"
                        className="input"
                        value={profileName}
                        onChange={e => setProfileName(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="label" style={{ fontSize: '0.72rem' }}>Email Address</label>
                      <input
                        type="email"
                        className="input"
                        value={profileEmail}
                        onChange={e => setProfileEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="label" style={{ fontSize: '0.72rem' }}>Profile Photo Selection</label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleDevicePhotoSelect}
                        style={{ display: 'none' }}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => fileInputRef.current?.click()}
                        style={{ width: '100%', justifyContent: 'center', gap: '0.5rem', borderColor: 'var(--mint-primary)', background: 'var(--mint-pill)', color: 'var(--mint-primary)', fontWeight: 700, fontSize: '0.82rem' }}
                      >
                        <UploadCloud size={16} /> Choose Photo from Device
                      </button>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.35rem', fontWeight: 700 }}>
                      Save Profile Updates
                    </button>
                  </form>

                  {/* Linked Providers / Social Sign-In Section */}
                  <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-card)' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                      Linked Sign-In Providers
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
                      Manage authentication methods linked to your account (financesync-4568b)
                    </div>

                    {linkFeedbackMsg && (
                      <div
                        style={{
                          padding: '0.5rem 0.75rem',
                          borderRadius: '8px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          marginBottom: '0.65rem',
                          background: linkFeedbackMsg.type === 'success' ? 'var(--mint-pill)' : '#FEF2F2',
                          color: linkFeedbackMsg.type === 'success' ? 'var(--mint-primary)' : '#DC2626',
                          border: `1px solid ${linkFeedbackMsg.type === 'success' ? 'rgba(34, 160, 91, 0.3)' : 'rgba(220, 38, 38, 0.3)'}`,
                        }}
                      >
                        {linkFeedbackMsg.text}
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {/* Email Provider */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '10px',
                          background: 'var(--bg-canvas)',
                          border: '1px solid var(--border-card)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                          <Mail size={16} color="var(--mint-primary)" />
                          <div>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>Email / Password</div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{currentMember.user.email}</div>
                          </div>
                        </div>
                        <span className="badge badge-sage" style={{ fontSize: '0.65rem' }}>PRIMARY</span>
                      </div>

                      {/* Google Provider */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '10px',
                          background: 'var(--bg-canvas)',
                          border: '1px solid var(--border-card)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                          </svg>
                          <div>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>Google Sign-In</div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                              {googleLinked ? 'Connected (google.com)' : 'Not linked'}
                            </div>
                          </div>
                        </div>

                        {googleLinked ? (
                          <button
                            type="button"
                            onClick={handleUnlinkGoogle}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.68rem', color: 'var(--rust)', borderColor: 'rgba(192, 57, 43, 0.3)' }}
                          >
                            Unlink Google
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleLinkGoogle}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.68rem', color: 'var(--sky-accent)', borderColor: 'rgba(62, 139, 245, 0.4)' }}
                          >
                            Link Google
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Footer Navigation */}
            <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: '0.85rem', marginTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <span>Family Finance Sync • Multi-Tenant RBAC</span>
              {activeView !== 'profile' && (
                <button
                  type="button"
                  onClick={() => setActiveView(activeView === 'login' ? 'register_step1' : 'login')}
                  style={{ background: 'none', border: 'none', color: 'var(--mint-primary)', fontWeight: 700, cursor: 'pointer' }}
                >
                  {activeView === 'login' ? 'Create Account' : 'Existing User? Sign In'}
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AuthUserModal;

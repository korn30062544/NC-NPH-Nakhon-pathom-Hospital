import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User } from '../types';
import { loginUser, requestPasswordReset } from '../services/authService';

interface LoginScreenProps {
  onLogin: (user: User) => void;
  onNavigateToSignUp: () => void;
  users: User[];
}

// FIX (security): this component used to have a hardcoded email/password
// ("sithikorn247@gmail.com" / "korn30062544") baked into the client bundle
// that granted instant Super Admin access to anyone who typed it — visible
// to anyone opening browser dev tools, and doubly exposed since this
// project's source lives in a public GitHub repo. It also had "Quick Login"
// buttons that logged in as any mock Admin/User with a single click (no
// password at all), and a "forgot password" flow that displayed the OTP
// code on screen instead of ever sending one. All of that has been
// replaced with real Firebase Authentication below. If
// "korn30062544" was ever used as a real password anywhere, treat it as
// compromised and change it.
export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onNavigateToSignUp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  function mapFirebaseError(err: any): string {
    const code = err?.code || '';
    if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
      return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
    }
    if (code.includes('too-many-requests')) {
      return 'พยายามเข้าสู่ระบบผิดหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่';
    }
    if (code.includes('invalid-email')) {
      return 'รูปแบบอีเมลไม่ถูกต้อง';
    }
    return err?.message || 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email.trim()) {
      setErrorMsg('กรุณากรอกอีเมล');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('กรุณากรอกรหัสผ่าน');
      return;
    }
    setSubmitting(true);
    try {
      const profile = await loginUser(email, password);
      onLogin(profile);
    } catch (err: any) {
      setErrorMsg(mapFirebaseError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    if (!forgotEmail.trim()) {
      setForgotError('กรุณากรอกอีเมล');
      return;
    }
    setForgotSubmitting(true);
    try {
      await requestPasswordReset(forgotEmail);
      setResetSuccess(true);
    } catch (err: any) {
      setForgotError(mapFirebaseError(err));
    } finally {
      setForgotSubmitting(false);
    }
  };

  return (
    <div className="bg-[#f6faff] min-h-screen flex flex-col items-center justify-center p-4 text-[#141d23]">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-white rounded-xl border border-[#c1c7d2] p-8 shadow-[0_4px_12px_rgba(0,85,150,0.06)] relative overflow-hidden"
      >
        {/* Top Primary Color Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-[#003e6f]"></div>

        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#005596] text-white mb-4 shadow-sm">
            <span className="material-symbols-outlined text-[32px] fill">local_hospital</span>
          </div>
          <h1 className="font-headline-md text-2xl text-[#003e6f] font-bold mb-1">
            โรงพยาบาลนครปฐม
          </h1>
          <h2 className="font-headline-sm text-lg text-[#414750] font-semibold">
            ระบบจัดการความเสี่ยง
          </h2>
          <p className="font-body-md text-sm text-[#727781] mt-2">
            (Risk Management System)
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-4 p-3 bg-[#ffdad6] text-[#93000a] rounded text-sm flex items-center gap-2 border border-[#ba1a1a]/20"
          >
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{errorMsg}</span>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block font-label-md text-xs font-semibold text-[#141d23] uppercase tracking-wider mb-1"
              htmlFor="email"
            >
              อีเมล (Email)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#727781]">
                <span className="material-symbols-outlined text-[18px]">person</span>
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="you@gmail.com"
                className="w-full h-10 pl-10 pr-3 border border-[#c1c7d2] rounded focus:border-[#003e6f] focus:ring-1 focus:ring-[#003e6f] focus:outline-none transition-colors font-body-md text-sm bg-white text-[#141d23]"
              />
            </div>
          </div>

          <div>
            <label
              className="block font-label-md text-xs font-semibold text-[#141d23] uppercase tracking-wider mb-1"
              htmlFor="password"
            >
              รหัสผ่าน (Password)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#727781]">
                <span className="material-symbols-outlined text-[18px]">lock</span>
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="กรอกรหัสผ่าน"
                className="w-full h-10 pl-10 pr-10 border border-[#c1c7d2] rounded focus:border-[#003e6f] focus:ring-1 focus:ring-[#003e6f] focus:outline-none transition-colors font-body-md text-sm bg-white text-[#141d23]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#727781] hover:text-[#414750]"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <div className="text-right">
            <button
              type="button"
              onClick={() => {
                setForgotEmail(email);
                setShowForgotModal(true);
                setResetSuccess(false);
                setForgotError('');
              }}
              className="text-xs text-[#003e6f] hover:underline"
            >
              ลืมรหัสผ่าน?
            </button>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 bg-[#003e6f] hover:bg-[#005596] text-white font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-60 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">login</span>
            <span>{submitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</span>
          </button>
        </form>

        {/* Sign Up Link */}
        <div className="mt-6 text-center border-t border-[#c1c7d2] pt-4">
          <p className="font-body-md text-sm text-[#414750]">
            ยังไม่มีบัญชีผู้ใช้งาน?{' '}
            <button
              type="button"
              onClick={onNavigateToSignUp}
              className="text-[#003e6f] hover:text-[#005596] font-semibold transition-colors ml-1 hover:underline cursor-pointer"
            >
              สร้างบัญชีผู้ใช้งาน (Sign Up)
            </button>
          </p>
        </div>
      </motion.div>

      {/* Forgot Password (real Firebase password-reset email) */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl border border-[#c1c7d2]"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-[#003e6f] flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600">mail</span>
                ลืมรหัสผ่าน
              </h3>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {resetSuccess ? (
              <div className="text-center py-4 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-[28px]">check_circle</span>
                </div>
                <h4 className="font-bold text-slate-800 text-sm">ส่งอีเมลสำเร็จแล้ว!</h4>
                <p className="text-xs text-slate-600">
                  ตรวจสอบกล่องจดหมายของ <strong>{forgotEmail}</strong> สำหรับลิงก์ตั้งรหัสผ่านใหม่
                  (ถ้าไม่พบ ลองดูในโฟลเดอร์สแปม)
                </p>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="w-full py-2 bg-[#003e6f] text-white rounded-lg font-bold text-xs"
                >
                  ปิดหน้าต่างนี้
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <p className="text-xs text-slate-600">
                  กรอกอีเมลที่ใช้สมัครไว้ ระบบจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้ทันที
                </p>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">อีเมล</label>
                  <input
                    type="email"
                    required
                    placeholder="you@gmail.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-none text-xs"
                  />
                </div>
                {forgotError && <p className="text-xs text-rose-600">{forgotError}</p>}
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-3 py-2 rounded-lg text-xs text-slate-600 hover:bg-slate-100 font-medium"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={forgotSubmitting}
                    className="px-4 py-2 rounded-lg text-xs bg-[#003e6f] text-white font-bold hover:bg-[#004881] transition-colors disabled:opacity-60"
                  >
                    {forgotSubmitting ? 'กำลังส่ง...' : 'ส่งลิงก์ตั้งรหัสผ่านใหม่'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};

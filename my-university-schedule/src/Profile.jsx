
import React, { useState, useMemo, useEffect } from 'react';
import { COURSE_SETTINGS, staticTimetable } from './Schedule/ScheduleData/CourseConfig';
import { ref, onValue } from 'firebase/database';
import { database, auth, googleProvider } from './firebase';
import { signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';

// --- الأيقونات ---
const LectureIcon = () => ( <svg width="18" height="18" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z" /></svg> );
const LabIcon = () => ( <svg width="18" height="18" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" /></svg> );
const AssignmentIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%"><path d="M11.25 5.337c0-.355-.186-.676-.401-.959a1.647 1.647 0 0 1-.349-1.003c0-1.036 1.007-1.875 2.25-1.875S15 2.34 15 3.375c0 .369-.128.713-.349 1.003-.215.283-.401.604-.401.959 0 .332.278.598.61.578 1.91-.114 3.79-.342 5.632-.676a.75.75 0 0 1 .878.645 49.17 49.17 0 0 1 .376 5.452.657.657 0 0 1-.66.664c-.354 0-.675-.186-.958-.401a1.647 1.647 0 0 0-1.003-.349c-1.035 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401.31 0 .557.262.534.571a48.774 48.774 0 0 1-.595 4.845.75.75 0 0 1-.61.61c-1.82.317-3.673.533-5.555.642a.58.58 0 0 1-.611-.581c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.035-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959a.641.641 0 0 1-.658.643 49.118 49.118 0 0 1-4.708-.36.75.75 0 0 1-.645-.878c.293-1.614.504-3.257.629-4.924A.53.53 0 0 0 5.337 15c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.036 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.369 0 .713.128 1.003.349.283.215.604.401.959.401a.656.656 0 0 0 .659-.663 47.703 47.703 0 0 0-.31-4.82.75.75 0 0 1 .83-.832c1.343.155 2.703.254 4.077.294a.64.64 0 0 0 .657-.642Z" /></svg> );
const CheckIcon = () => ( <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> );
const XIcon = () => ( <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> );

const StudentIcon = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

// أيقونات الإيميل والقفل لواجهة تسجيل الدخول النظيفة
const MailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
    <polyline points="22,6 12,13 2,6"></polyline>
  </svg>
);

const LockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
);

// أيقونات بسيطة للأنواع
const TypeIcon = ({ type }) => {
  if (type === 'مختبر') return <LabIcon />;
  if (type === 'امتحان') return <span style={{fontWeight:'bold'}}>!</span>;
  if (type === 'واجب' || type === 'تقرير') return <AssignmentIcon />;
  return <LectureIcon />; // افتراضي للمحاضرة
};

// 🌟 أيقونات إخفاء وإظهار الإيميل 🌟
const EyeIcon = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

export default function Profile({ user, navigate, handleLogout, userAttendance, allScheduleData }) {
  const [expandedType, setExpandedType] = useState(null);
  const [viewMode, setViewMode] = useState('flat'); 
  const [expandedSubject, setExpandedSubject] = useState({}); 
  const [animationKey, setAnimationKey] = useState(Date.now());
  
  // 🌟 حالة إخفاء الإيميل 🌟
  const [isEmailHidden, setIsEmailHidden] = useState(false);

  // 🌟 حالات تسجيل الدخول المدمجة 🌟
  const [showLoginView, setShowLoginView] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [bio, setBio] = useState('');
  useEffect(() => {
    if (user) {
      const bioRef = ref(database, `users/${user.uid}/bio`);
      const unsub = onValue(bioRef, (snapshot) => {
        if (snapshot.exists()) {
          setBio(snapshot.val());
        } else {
          setBio('');
        }
      });
      return () => unsub();
    }
  }, [user]);

  // --- دوال المصادقة (Authentication) المدمجة ---
  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    setAuthError("");
    try {
      await signInWithPopup(auth, googleProvider);
      setShowLoginView(false);
    } catch (err) {
      setAuthError("فشل تسجيل الدخول بواسطة جوجل.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setAuthError("يرجى إدخال البريد الإلكتروني وكلمة المرور.");
      return;
    }
    setAuthLoading(true);
    setAuthError("");
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      setShowLoginView(false);
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setAuthError("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
      } else {
        setAuthError("فشل تسجيل الدخول، يرجى المحاولة مرة أخرى.");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const statsDetails = useMemo(() => {
    if (!userAttendance || !allScheduleData) return {};

    const daysArr = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"];
    const details = {};

    Object.keys(userAttendance).forEach(weekKey => {
      const wIdx = parseInt(weekKey.replace('week_', ''));
      const weekData = userAttendance[weekKey];

      Object.keys(weekData).forEach(dayName => {
        const dIdx = daysArr.indexOf(dayName);
        const dayAttendance = weekData[dayName];
        const dayScheduleData = allScheduleData[weekKey]?.[dayName] || {};

        Object.keys(dayAttendance).forEach(subjId => {
          const status = dayAttendance[subjId]; 
          
          let type = 'محاضرة';
          let name = 'مادة سابقة (غير متوفرة)';
          let isHidden = false;

          const staticSubj = (staticTimetable[dayName] || []).find(s => s.id === subjId);
          if (staticSubj) {
            name = staticSubj.name;
            const override = dayScheduleData.fixedOverrides?.[subjId] || {};
            type = override.type || staticSubj.type;
            isHidden = override.isHidden;
          } else {
            const dynamicSubj = (dayScheduleData.dynamicEvents || []).find(d => d.id === subjId);
            if (dynamicSubj) {
              name = dynamicSubj.name;
              type = dynamicSubj.type;
            } else {
              return; 
            }
          }

          if (isHidden) return; 

          const targetDate = new Date(COURSE_SETTINGS.startDate);
          targetDate.setDate(targetDate.getDate() + (wIdx * 7) + dIdx);
          const dateStr = `${targetDate.getDate()} / ${targetDate.getMonth() + 1}`;

          if (!details[type]) {
            details[type] = { presentCount: 0, absentCount: 0, items: [], subjects: {} };
          }

          if (status === 'present') details[type].presentCount++;
          if (status === 'absent') details[type].absentCount++;

          details[type].items.push({ name, date: dateStr, status });

          if (!details[type].subjects[name]) {
            details[type].subjects[name] = { presentCount: 0, absentCount: 0, history: [] };
          }
          if (status === 'present') details[type].subjects[name].presentCount++;
          if (status === 'absent') details[type].subjects[name].absentCount++;
          details[type].subjects[name].history.push({ date: dateStr, status });
        });
      });
    });

    Object.keys(details).forEach(key => {
        details[key].items.sort((a, b) => a.date.localeCompare(b.date));
        Object.keys(details[key].subjects).forEach(subjKey => {
          details[key].subjects[subjKey].history.sort((a, b) => a.date.localeCompare(b.date));
        });
    });

    return details;
  }, [userAttendance, allScheduleData]);

  let activeTotalPresent = 0;
  let activeTotalAbsent = 0;
  Object.values(statsDetails).forEach(data => {
    activeTotalPresent += data.presentCount;
    activeTotalAbsent += data.absentCount;
  });

  const toggleExpand = (type) => {
    setExpandedType(expandedType === type ? null : type);
  };

  const toggleSubjectExpand = (type, subjName) => {
    setExpandedSubject(prev => ({
      ...prev,
      [type]: prev[type] === subjName ? null : subjName
    }));
  };

  const handleViewChange = (newMode) => {
    if (newMode === viewMode) return;
    setViewMode(newMode);
    setExpandedType(null);
    setExpandedSubject({});
    setAnimationKey(Date.now()); 
  };

  const userName = user?.displayName || 'طالب';
  const isNameArabic = /[\u0600-\u06FF]/.test(userName);

  return (
    <div className="week-animate" style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '30px' }}>
      
      <style>
        {`
          @keyframes cascadeIn {
            0% { opacity: 0; transform: translateY(20px) scale(0.98); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes slideDownSubCard {
            0% { opacity: 0; transform: translateY(-15px) scale(0.98); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes fadeSwitch {
            0% { opacity: 0; transform: scale(0.97); }
            100% { opacity: 1; transform: scale(1); }
          }
          .animate-wrapper { animation: cascadeIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; opacity: 0; }
          .animate-sub-card { animation: slideDownSubCard 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; opacity: 0; }
          .fade-switch { animation: fadeSwitch 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
          
          /* تخصيص الـ input ليكون فاخراً */
          .auth-input::placeholder { color: var(--text-muted); opacity: 0.6; }
          .auth-input:focus { border-color: var(--primary-color) !important; box-shadow: 0 0 0 3px rgba(var(--primary-rgb, 59, 130, 246), 0.15); }
        `}
      </style>

      {!user ? (
        <div className="day-card fade-switch" style={{ backgroundColor: 'var(--card-bg-normal)', padding: '0', borderRadius: '20px', border: '1px solid var(--border-line)', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
          
          {!showLoginView ? (
            // --- شاشة الزائر الافتراضية ---
            <div style={{ padding: '40px 24px', textAlign: 'center' }}>
              <div style={{ width: '80px', height: '80px', backgroundColor: 'var(--card-bg-locked)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '1px solid var(--border-line)', color: 'var(--text-muted)' }}>
                <StudentIcon />
              </div>
              <h2 style={{ color: 'var(--text-pure)', marginBottom: '12px', fontSize: '22px' }}>حساب الطالب</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '14px', lineHeight: '1.6', padding: '0 10px' }}>
                سجل دخولك الآن لإنشاء ملفك الشخصي، إدارة حضورك، والوصول إلى ميزات النظام المتقدمة.
              </p>
              
              <button 
                onClick={() => setShowLoginView(true)}
                style={{ 
                  backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '14px', padding: '16px 24px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: '280px', margin: '0 auto', boxShadow: '0 6px 15px rgba(0,0,0,0.2)', transition: 'transform 0.2s', WebkitTapHighlightColor: 'transparent'
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.96)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                تسجيل الدخول للمتابعة
              </button>
            </div>
          ) : (
            // --- واجهة تسجيل الدخول المدمجة والفاخرة ---
            <div className="fade-switch" style={{ padding: '30px 24px', position: 'relative' }}>
              
             

              <div style={{ textAlign: 'center', marginBottom: '30px', marginTop: '10px' }}>
                <h2 style={{ color: 'var(--text-pure)', margin: '0 0 8px 0', fontSize: '24px', letterSpacing: '0.5px' }}>Versa</h2>
                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '14px' }}>أهلاً بك مجدداً في نظام الإدارة</p>
              </div>

              {authError && (
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '12px', borderRadius: '12px', fontSize: '13px', textAlign: 'center', marginBottom: '20px', fontWeight: 'bold' }}>
                  {authError}
                </div>
              )}

              {/* زر جوجل (تصميم قياسي نظيف) */}
              <button 
                onClick={handleGoogleLogin} disabled={authLoading}
                style={{ 
                  width: '100%', backgroundColor: '#ffffff', color: '#3c4043', border: '1px solid #dadce0', borderRadius: '14px', 
                  padding: '14px', fontSize: '15px', fontWeight: 'bold', cursor: authLoading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', opacity: authLoading ? 0.7 : 1, WebkitTapHighlightColor: 'transparent'
                }}
                onMouseEnter={(e) => !authLoading && (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                onMouseLeave={(e) => !authLoading && (e.currentTarget.style.backgroundColor = '#ffffff')}
              >
                {authLoading ? ( <span style={{ color: '#3c4043' }}>جاري التحميل...</span> ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    المتابعة باستخدام Google
                  </>
                )}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', width: '100%', margin: '24px 0' }}>
                  <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-line)' }}></div>
                  <span style={{ padding: '0 15px', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 'bold' }}>أو باستخدام البريد</span>
                  <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-line)' }}></div>
              </div>

              {/* فورم الإيميل والباسورد */}
              <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                    <MailIcon />
                  </div>
                  <input 
                    type="email" 
                    placeholder="البريد الإلكتروني" 
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    className="auth-input"
                    style={{
                      width: '100%', padding: '14px 44px 14px 14px', borderRadius: '12px', border: '1px solid var(--border-line)',
                      backgroundColor: 'var(--card-bg-locked)', color: 'var(--text-pure)', fontSize: '15px', outline: 'none',
                      boxSizing: 'border-box', transition: 'all 0.3s ease', fontFamily: 'inherit'
                    }}
                  />
                </div>

                <div style={{ position: 'relative' }}>
  <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', pointerEvents: 'none' }}>
    <LockIcon />
  </div>
  
  <input 
    type={showPassword ? "text" : "password"} 
    placeholder="كلمة المرور" 
    value={loginPassword}
    onChange={(e) => setLoginPassword(e.target.value)}
    required
    className="auth-input"
    style={{
      width: '100%', padding: '14px 44px 14px 44px', borderRadius: '12px', border: '1px solid var(--border-line)',
      backgroundColor: 'var(--card-bg-locked)', color: 'var(--text-pure)', fontSize: '15px', outline: 'none',
      boxSizing: 'border-box', transition: 'all 0.3s ease', fontFamily: 'inherit'
    }}
  />

  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    style={{
      position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
      background: 'transparent', border: 'none', color: showPassword ? 'var(--primary-color)' : 'var(--text-muted)',
      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px',
      borderRadius: '50%', transition: 'color 0.2s', WebkitTapHighlightColor: 'transparent'
    }}
  >
    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
  </button>
</div>

                <button 
                  type="submit" 
                  disabled={authLoading}
                  style={{ 
                    width: '100%', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '14px', 
                    padding: '16px', fontSize: '16px', fontWeight: 'bold', cursor: authLoading ? 'not-allowed' : 'pointer', 
                    marginTop: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', transition: 'transform 0.2s', opacity: authLoading ? 0.8 : 1,
                    WebkitTapHighlightColor: 'transparent'
                  }}
                  onMouseDown={(e) => !authLoading && (e.currentTarget.style.transform = 'scale(0.97)')}
                  onMouseUp={(e) => !authLoading && (e.currentTarget.style.transform = 'scale(1)')}
                >
                  تسجيل الدخول
                </button>
              </form>

              <button 
                onClick={() => setShowLoginView(false)} 
                style={{ 
                  width: '100%', backgroundColor: 'transparent', color: 'var(--text-muted)', border: 'none', 
                  padding: '16px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', marginTop: '12px',
                  transition: 'color 0.2s', WebkitTapHighlightColor: 'transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-pure)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                المتابعة كزائر
              </button>
            </div>
          )}
        </div>
      ) : (
        // ==========================================================
        // --- واجهة المستخدم المسجل (كما كانت بدون أي تغيير) ---
        // ==========================================================
        <>
          <div className="day-card animate-wrapper" style={{ animationDelay: '0s', backgroundColor: 'var(--card-bg-normal)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-line)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
             
             <div style={{ display: 'flex', alignItems: 'center', gap: '15px', direction: isNameArabic ? 'rtl' : 'ltr', textAlign: isNameArabic ? 'right' : 'left' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', flexShrink: 0, boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                   {userName[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                   <h3 style={{ margin: '0 0 4px 0', color: 'var(--text-pure)', fontSize: '18px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userName}</h3>
                   
                   {/* 🌟 حاوية الإيميل وزر الإخفاء 🌟 */}
                   <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: isNameArabic ? 'flex-start' : 'flex-start' }}>
                     <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', direction: 'ltr', transition: 'all 0.3s ease' }}>
                       {isEmailHidden ? '••••••••••••••••••••••' : user.email}
                     </div>
                     <button 
                       onClick={() => setIsEmailHidden(!isEmailHidden)}
                       style={{ 
                         background: 'transparent', border: 'none', color: 'var(--text-muted)', 
                         cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                         padding: '4px', borderRadius: '6px', transition: 'all 0.2s ease', WebkitTapHighlightColor: 'transparent', flexShrink: 0
                       }}
                       onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--primary-color)'; e.currentTarget.style.borderColor = 'var(--primary-color)'; }}
                       onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-line)'; }}
                     >
                       {isEmailHidden ? <EyeOffIcon /> : <EyeIcon />}
                     </button>
                   </div>

                </div>
             </div>

             {bio && (
                <div style={{ backgroundColor: 'var(--card-bg-locked)', padding: '10px 14px', borderRadius: '10px', borderRight: isNameArabic ? '3px solid var(--primary-color)' : 'none', borderLeft: !isNameArabic ? '3px solid var(--primary-color)' : 'none', color: 'var(--text-details)', fontSize: '13px', lineHeight: '1.5', textAlign: isNameArabic ? 'right' : 'left', direction: isNameArabic ? 'rtl' : 'ltr' }}>
                    {bio}
                </div>
             )}

             <div style={{ display: 'flex', gap: '10px', direction: 'rtl' }}>
                <div style={{ flex: 1, backgroundColor: 'rgba(16, 185, 129, 0.08)', padding: '12px 14px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                   <span style={{ color: 'var(--text-details)', fontSize: '13px', fontWeight: 'bold' }}>الحضور</span>
                   <span style={{ color: '#10b981', fontSize: '18px', fontWeight: 'bold' }}>{activeTotalPresent}</span>
                </div>
                <div style={{ flex: 1, backgroundColor: 'rgba(239, 68, 68, 0.08)', padding: '12px 14px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                   <span style={{ color: 'var(--text-details)', fontSize: '13px', fontWeight: 'bold' }}>الغياب</span>
                   <span style={{ color: '#ef4444', fontSize: '18px', fontWeight: 'bold' }}>{activeTotalAbsent}</span>
                </div>
             </div>
          </div>

          {Object.keys(statsDetails).length > 0 ? (
            <div style={{ marginTop: '10px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 10px 20px 10px' }}>
                <h3 style={{ fontSize: '15px', color: 'var(--text-muted)', margin: 0, textAlign: 'right' }}>
                  تفاصيل السجل
                </h3>
                
                <div style={{ 
                  position: 'relative', display: 'flex', backgroundColor: 'var(--card-bg-locked)', 
                  borderRadius: '12px', padding: '4px', border: '1px solid var(--border-line)', width: '220px' 
                }}>
                  <div style={{
                    position: 'absolute', top: '4px', bottom: '4px', width: 'calc(50% - 4px)',
                    backgroundColor: 'var(--primary-color)', borderRadius: '8px',
                    right: viewMode === 'flat' ? '4px' : 'calc(50%)',
                    transition: 'right 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                  }} />
                  
                  <div 
                    onClick={() => handleViewChange('flat')} 
                    style={{ 
                      flex: 1, zIndex: 1, textAlign: 'center', fontSize: '13px', fontWeight: 'bold', 
                      padding: '8px 0', cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                      color: viewMode === 'flat' ? '#fff' : 'var(--text-muted)',
                      transition: 'color 0.4s ease'
                    }}
                  >
                    عرض زمني
                  </div>
                  <div 
                    onClick={() => handleViewChange('grouped')} 
                    style={{ 
                      flex: 1, zIndex: 1, textAlign: 'center', fontSize: '13px', fontWeight: 'bold', 
                      padding: '8px 0', cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                      color: viewMode === 'grouped' ? '#fff' : 'var(--text-muted)',
                      transition: 'color 0.4s ease'
                    }}
                  >
                    حسب المواد
                  </div>
                </div>
              </div>
              
              <div key={animationKey} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {Object.keys(statsDetails).map((type, index) => {
                  const data = statsDetails[type];
                  const isExpanded = expandedType === type;
                  
                  const glowStyles = isExpanded ? {
                    borderLeft: '5px solid var(--primary-color)',
                    backgroundColor: 'var(--card-bg-expanded)'
                  } : {
                    borderLeft: '5px solid var(--primary-color)',
                    backgroundColor: 'var(--card-bg-normal)'
                  };

                  return (
                    <div key={type} className="animate-wrapper" style={{ display: 'flex', flexDirection: 'column', animationDelay: `${index * 0.12}s` }}>
                      
                      <div 
                        className="day-card schedule-day-box"
                        style={{ 
                          borderRadius: '12px', 
                          zIndex: isExpanded ? 2 : 1,
                          overflow: 'hidden',
                          ...glowStyles
                        }}
                      >
                        <div 
                          onClick={() => toggleExpand(type)}
                          style={{ 
                            padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            cursor: 'pointer', WebkitTapHighlightColor: 'transparent'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <TypeIcon type={type} />
                            <span style={{ color: 'var(--text-pure)', fontWeight: 'bold', fontSize: '16px' }}>{type}</span>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '10px', fontSize: '13px', fontWeight: 'bold' }}>
                            <span style={{ color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                              {data.presentCount}
                            </span>
                            <span style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                              {data.absentCount}
                            </span>
                          </div>
                        </div>

                        {viewMode === 'flat' && (
                          <div style={{ 
                            maxHeight: isExpanded ? '2000px' : '0px', 
                            opacity: isExpanded ? 1 : 0, 
                            transition: isExpanded ? 'max-height 1.3s ease, opacity 0.7s ease' : 'all 0.5s ease',
                            backgroundColor: 'var(--card-bg-locked)',
                            borderTop: isExpanded ? '1px solid var(--border-line)' : 'none',
                            overflow: 'hidden' 
                          }}>
                            <div style={{ padding: '10px 16px 16px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {data.items.map((item, idx) => (
                                <div key={idx} style={{ 
                                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                  paddingBottom: '8px', borderBottom: idx !== data.items.length - 1 ? '1px dashed var(--border-line)' : 'none',
                                  paddingTop: '8px'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ 
                                      width: '8px', height: '8px', borderRadius: '50%', 
                                      backgroundColor: item.status === 'present' ? '#10b981' : '#ef4444',
                                      boxShadow: `0 0 6px ${item.status === 'present' ? '#10b981' : '#ef4444'}`
                                    }} />
                                    <span style={{ color: 'var(--text-pure)', fontSize: '14px', fontWeight: 'bold' }}>{item.name}</span>
                                  </div>
                                  <span style={{ color: 'var(--text-details)', fontSize: '12px', fontFamily: 'monospace' }}>
                                    {item.date}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {viewMode === 'grouped' && (
                        <div style={{
                          maxHeight: isExpanded ? '3000px' : '0px',
                          opacity: isExpanded ? 1 : 0,
                          overflow: 'hidden',
                          transition: isExpanded ? 'max-height 1.3s ease, opacity 0.7s ease' : 'all 0.5s ease',
                          width: '94%',
                          marginLeft: 'auto', 
                          marginRight: '0'
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px', paddingBottom: '10px' }}>
                            {Object.keys(data.subjects).map((subjName, sIdx) => {
                               const subjData = data.subjects[subjName];
                               const isSubjExpanded = expandedSubject[type] === subjName;

                               return (
                                 <div 
                                   key={subjName}
                                   className="day-card animate-sub-card"
                                   style={{
                                      animationDelay: `${sIdx * 0.08}s`,
                                      backgroundColor: 'var(--card-bg-normal)', 
                                      borderRadius: '12px',
                                      borderLeft: '5px solid var(--primary-color)',
                                      overflow: 'hidden',
                                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                   }}
                                 >
                                   <div 
                                     onClick={(e) => { e.stopPropagation(); toggleSubjectExpand(type, subjName); }}
                                     style={{ 
                                       padding: '16px', 
                                       display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                       cursor: 'pointer', WebkitTapHighlightColor: 'transparent'
                                     }}
                                   >
                                      <span style={{ color: 'var(--text-pure)', fontWeight: 'bold', fontSize: '16px' }}>{subjName}</span> 
                                      
                                      <div style={{ display: 'flex', gap: '10px', fontSize: '13px', fontWeight: 'bold' }}>
                                        <span style={{ color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                                          {subjData.presentCount}
                                        </span>
                                        <span style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                                          {subjData.absentCount}
                                        </span>
                                      </div>
                                   </div>

                                   <div style={{ 
                                     maxHeight: isSubjExpanded ? '2000px' : '0px', 
                                     opacity: isSubjExpanded ? 1 : 0, 
                                     transition: isSubjExpanded ? 'max-height 1.3s ease, opacity 0.7s ease' : 'all 0.5s ease',
                                     backgroundColor: 'var(--card-bg-locked)',
                                     borderTop: isSubjExpanded ? '1px solid var(--border-line)' : 'none',
                                     overflow: 'hidden'
                                   }}>
                                      <div style={{ padding: '8px 16px 12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {subjData.history.map((hist, hIdx) => (
                                          <div key={hIdx} style={{ 
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            paddingBottom: '6px', borderBottom: hIdx !== subjData.history.length - 1 ? '1px dashed rgba(128,128,128,0.2)' : 'none',
                                            paddingTop: '6px'
                                          }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                              <div style={{ 
                                                width: '6px', height: '6px', borderRadius: '50%', 
                                                backgroundColor: hist.status === 'present' ? '#10b981' : '#ef4444'
                                              }} />
                                              <span style={{ color: hist.status === 'present' ? '#10b981' : '#ef4444', fontSize: '12px', fontWeight: 'bold' }}>
                                                {hist.status === 'present' ? 'حاضر' : 'غائب'}
                                              </span>
                                            </div>
                                            <span style={{ color: 'var(--text-details)', fontSize: '11px', fontFamily: 'monospace' }}>
                                              {hist.date}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                   </div>
                                 </div>
                               );
                            })}
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ backgroundColor: 'var(--card-bg-normal)', padding: '20px', textAlign: 'center', borderRadius: '15px', border: '1px solid var(--border-line)' }}>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '14px' }}>لا توجد بيانات حضور في هذا الجدول/الأرشيف حتى الآن.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}


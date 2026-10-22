
import React, { useState, useEffect } from 'react';

const ShareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
    <polyline points="16 6 12 2 8 6"></polyline>
    <line x1="12" y1="2" x2="12" y2="15"></line>
  </svg>
);

const AddHomeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="12" y1="8" x2="12" y2="16"></line>
    <line x1="8" y1="12" x2="16" y2="12"></line>
  </svg>
);

const AppIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
    <line x1="12" y1="18" x2="12.01" y2="18"></line>
  </svg>
);

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. فحص إذا كان التطبيق مثبتاً بالفعل (Standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (isStandalone) return; // إذا كان مثبتاً، لا نفعل شيئاً

    // 2. فحص إذا كان المستخدم قد رفض التثبيت سابقاً
    const hasDismissed = localStorage.getItem('install_prompt_dismissed');
    if (hasDismissed) return;

    // 3. التقاط حدث التثبيت لأجهزة الأندرويد (Chrome/Edge)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault(); // منع ظهور النافذة الافتراضية المزعجة للمتصفح
      setDeferredPrompt(e);
      // إظهار نافذتنا الأنيقة بعد 3 ثوانٍ من فتح الموقع
      setTimeout(() => setShowPrompt(true), 3000);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. كشف أجهزة الأيفون (iOS Safari)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    
    if (isIosDevice) {
      setIsIOS(true);
      // إظهار تعليمات الأيفون بعد 3 ثوانٍ
      setTimeout(() => setShowPrompt(true), 3000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // حفظ الرفض لكي لا نزعج الطالب في كل مرة يفتح فيها الموقع
    localStorage.setItem('install_prompt_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div style={{
      position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
      width: 'calc(100% - 40px)', maxWidth: '400px', zIndex: 999999,
      animation: 'slideUpPrompt 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards'
    }}>
      <style>{`
        @keyframes slideUpPrompt {
          from { opacity: 0; transform: translate(-50%, 100%); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
      
      <div style={{
        backgroundColor: 'var(--card-bg-normal)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--border-line)', borderRadius: '24px', padding: '20px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '15px', direction: 'rtl'
      }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ width: '55px', height: '55px', backgroundColor: 'var(--card-bg-locked)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--border-line)' }}>
            <AppIcon />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 4px 0', color: 'var(--text-pure)', fontSize: '16px', fontWeight: 'bold' }}>تثبيت تطبيق Versa</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '12px', lineHeight: '1.5' }}>
              الوصول السريع للجدول والملازم بدون إنترنت، و استقبال الإشعارات.
            </p>
          </div>
        </div>

        {isIOS ? (
          // 📱 واجهة تعليمات التثبيت الخاصة بالأيفون (iOS)
          <div style={{ backgroundColor: 'var(--card-bg-locked)', borderRadius: '14px', padding: '12px', border: '1px solid var(--border-line)' }}>
            <p style={{ margin: '0 0 8px 0', color: 'var(--text-pure)', fontSize: '13px', textAlign: 'center', fontWeight: 'bold' }}>
              لتثبيت التطبيق على جهازك:
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '13px' }}>
              <span>1. اضغط على المشاركة</span>
              <span style={{ color: 'var(--primary-color)' }}><ShareIcon /></span>
              <span>في الأسفل</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px' }}>
              <span>2. اختر "إضافة للشاشة الرئيسية"</span>
              <span style={{ color: 'var(--primary-color)' }}><AddHomeIcon /></span>
            </div>
          </div>
        ) : (
          // 🤖 زر التثبيت المباشر للأندرويد
          <button 
            onClick={handleInstallClick}
            style={{ 
              width: '100%', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '14px',
              padding: '14px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}
          >
            تثبيت التطبيق الآن
          </button>
        )}

        <button 
          onClick={handleDismiss}
          style={{
            width: '100%', backgroundColor: 'transparent', color: 'var(--text-muted)', border: 'none',
            fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', padding: '5px', WebkitTapHighlightColor: 'transparent'
          }}
        >
          ليس الآن
        </button>

      </div>
    </div>
  );
}

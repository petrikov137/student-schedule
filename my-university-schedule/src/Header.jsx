import React, { useState, useEffect } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging, database } from './firebase';
import { ref, set } from 'firebase/database';

const PaperIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z" clipRule="evenodd" />
    <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
  </svg>
);

const ScheduleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M5.625 3.75a2.625 2.625 0 1 0 0 5.25h12.75a2.625 2.625 0 0 0 0-5.25H5.625ZM3.75 11.25a.75.75 0 0 0 0 1.5h16.5a.75.75 0 0 0 0-1.5H3.75ZM3 15.75a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75ZM3.75 18.75a.75.75 0 0 0 0 1.5h16.5a.75.75 0 0 0 0-1.5H3.75Z" />
  </svg>
);

const AssignmentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M11.25 5.337c0-.355-.186-.676-.401-.959a1.647 1.647 0 0 1-.349-1.003c0-1.036 1.007-1.875 2.25-1.875S15 2.34 15 3.375c0 .369-.128.713-.349 1.003-.215.283-.401.604-.401.959 0 .332.278.598.61.578 1.91-.114 3.79-.342 5.632-.676a.75.75 0 0 1 .878.645 49.17 49.17 0 0 1 .376 5.452.657.657 0 0 1-.66.664c-.354 0-.675-.186-.958-.401a1.647 1.647 0 0 0-1.003-.349c-1.035 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401.31 0 .557.262.534.571a48.774 48.774 0 0 1-.595 4.845.75.75 0 0 1-.61.61c-1.82.317-3.673.533-5.555.642a.58.58 0 0 1-.611-.581c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.035-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959a.641.641 0 0 1-.658.643 49.118 49.118 0 0 1-4.708-.36.75.75 0 0 1-.645-.878c.293-1.614.504-3.257.629-4.924A.53.53 0 0 0 5.337 15c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.036 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.369 0 .713.128 1.003.349.283.215.604.401.959.401a.656.656 0 0 0 .659-.663 47.703 47.703 0 0 0-.31-4.82.75.75 0 0 1 .83-.832c1.343.155 2.703.254 4.077.294a.64.64 0 0 0 .657-.642Z" />
  </svg>
);

const BellIcon = ({ isSubscribed }) => {
  return (
    <div style={{ position: 'relative', width: '18px', height: '18px' }}>
      <svg 
        width="18" height="18" viewBox="0 0 24 24" 
        fill={isSubscribed ? "currentColor" : "none"} 
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={{
          position: 'absolute', top: 0, left: 0,
          transition: 'fill 0.3s ease'
        }}
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
      </svg>
      
      <svg 
        width="18" height="18" viewBox="0 0 24 24" 
        style={{
          position: 'absolute', top: 0, left: 0,
          pointerEvents: 'none'
        }}
      >
        <line 
          x1="3" y1="3" x2="21" y2="21" 
          stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          style={{
            strokeDasharray: 26,
            strokeDashoffset: isSubscribed ? 26 : 0, 
            transition: 'stroke-dashoffset 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: isSubscribed ? 0 : 1 
          }}
        />
      </svg>
    </div>
  );
};

function Header({ currentTheme, onThemeSelect, activeTab, onTabChange }) {
  const isLightVariantActive = currentTheme.includes('-light') || currentTheme === 'hearts' || currentTheme === 'light';
  const [isNightMode, setIsNightMode] = useState(!isLightVariantActive);

  const [isSubscribed, setIsSubscribed] = useState(localStorage.getItem('fcm_subscribed') === 'true');
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [isSwinging, setIsSwinging] = useState(false);

  const showAppToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  useEffect(() => {
    const unsubscribe = onMessage(messaging, (payload) => {
      if (payload.notification) {
        showAppToast(`🔔 ${payload.notification.title}: ${payload.notification.body}`);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSubscribe = async () => {
    if (isSubscribed) {
      setIsSubscribed(false);
      localStorage.setItem('fcm_subscribed', 'false');
      showAppToast('تم كتم الإشعارات 🔕');
    } else {
      try {
        setIsSwinging(true);
        setTimeout(() => setIsSwinging(false), 800);

        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setIsSubscribed(true);
          localStorage.setItem('fcm_subscribed', 'true');
          
          try {
            const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
            const token = await getToken(messaging, { 
              vapidKey: 'BE-ZU08UafjtNFOXQYvEW_OOjmTdo-D7SNCS4UVXEsmueTo-Nt84D6j5yM5srwrxVEu7xnC24LYjR1FdrjW5fuI',
              serviceWorkerRegistration: swRegistration 
            });
            
            if (token) {
              await set(ref(database, 'fcmTokens/' + token), true);
            }
          } catch (e) { console.log('FCM token skip:', e); }
          
          showAppToast('تم تفعيل الإشعارات 🔔');
        } else {
          showAppToast('تم رفض الصلاحية من المتصفح ❌');
        }
      } catch (error) {
        console.error('خطأ في تفعيل الإشعارات:', error);
      }
    }
  };

  useEffect(() => {
    if (!messaging) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      const title = payload.notification?.title || payload.data?.title || "تنبيه جديد";
      const options = {
        body: payload.notification?.body || payload.data?.body,
        icon: '/pwa-192x192.png',
        vibrate: [200, 100, 200],
        dir: 'rtl'
      };

      if (Notification.permission === 'granted') {
        new Notification(title, options);
      }
    });

    return () => unsubscribe();
  }, []);

  const toggleMode = (e) => {
    const newIsNight = !isNightMode;
    setIsNightMode(newIsNight); 
    
    // التبديل فقط بين الداكن والفاتح للثيم الحالي
    const themeMap = {
      'coffee': 'coffee-light', 'coffee-light': 'coffee',
      'ocean': 'ocean-light', 'ocean-light': 'ocean',
      'twilight': 'twilight-light', 'twilight-light': 'twilight',
      'hearts-dark': 'hearts', 'hearts': 'hearts-dark',
      'dark': 'light', 'light': 'dark'
    };
    
    if (themeMap[currentTheme]) {
      onThemeSelect(themeMap[currentTheme], e);
    } else {
      onThemeSelect(newIsNight ? 'dark' : 'light', e);
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes swing-bell {
            0% { transform: rotate(0deg); }
            15% { transform: rotate(15deg); }
            30% { transform: rotate(-15deg); }
            45% { transform: rotate(10deg); }
            60% { transform: rotate(-10deg); }
            75% { transform: rotate(5deg); }
            100% { transform: rotate(0deg); }
          }
          .swinging {
            animation: swing-bell 0.8s ease-in-out;
            transform-origin: top center;
          }
        `}
      </style>

      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 15px',
        height: '48px', backgroundColor: 'transparent', borderBottom: '1px solid var(--border-line)', position: 'relative', marginBottom: '20px'
      }}>
        
        <div 
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${showToast ? 1 : 0.8})`,
            opacity: showToast ? 1 : 0,
            pointerEvents: 'none',
            backgroundColor: 'var(--card-bg-locked)',
            color: 'var(--text-pure)',
            padding: '6px 16px',
            borderRadius: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: '1px solid var(--primary-color)',
            zIndex: 50,
            fontWeight: 'bold',
            fontSize: '12px',
            textAlign: 'center',
            transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
            whiteSpace: 'nowrap'
          }}
        >
          {toastMessage}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            onClick={toggleMode}
            style={{
              background: 'transparent', border: 'none', color: 'var(--text-pure)', cursor: 'pointer',
              padding: '6px', borderRadius: '6px', transition: 'background-color 0.3s ease', zIndex: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
              width: '32px', height: '32px', overflow: 'hidden',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--card-bg-locked)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div style={{ position: 'absolute', transition: 'all 0.5s ease-in-out', transform: isNightMode ? 'rotate(0deg) scale(1)' : 'rotate(-180deg) scale(0)', opacity: isNightMode ? 1 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="-2.4 -2.4 28.80 28.80" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19.9001 2.30719C19.7392 1.8976 19.1616 1.8976 19.0007 2.30719L18.5703 3.40247C18.5212 3.52752 18.4226 3.62651 18.298 3.67583L17.2067 4.1078C16.7986 4.26934 16.7986 4.849 17.2067 5.01054L18.298 5.44252C18.4226 5.49184 18.5212 5.59082 18.5703 5.71587L19.0007 6.81115C19.1616 7.22074 19.7392 7.22074 19.9001 6.81116L20.3305 5.71587C20.3796 5.59082 20.4782 5.49184 20.6028 5.44252L21.6941 5.01054C22.1022 4.849 22.1022 4.26934 21.6941 4.1078L20.6028 3.67583C20.4782 3.62651 20.3796 3.52752 20.3305 3.40247L19.9001 2.30719Z" fill="currentColor"></path><path d="M16.0328 8.12967C15.8718 7.72009 15.2943 7.72009 15.1333 8.12967L14.9764 8.52902C14.9273 8.65407 14.8287 8.75305 14.7041 8.80237L14.3062 8.95987C13.8981 9.12141 13.8981 9.70107 14.3062 9.86261L14.7041 10.0201C14.8287 10.0694 14.9273 10.1684 14.9764 10.2935L15.1333 10.6928C15.2943 11.1024 15.8718 11.1024 16.0328 10.6928L16.1897 10.2935C16.2388 10.1684 16.3374 10.0694 16.462 10.0201L16.8599 9.86261C17.268 9.70107 17.268 9.12141 16.8599 8.95987L16.462 8.80237C16.3374 8.75305 16.2388 8.65407 16.1897 8.52902L16.0328 8.12967Z" fill="currentColor"></path><path d="M12 22C17.5228 22 22 17.5228 22 12C22 11.5373 21.3065 11.4608 21.0672 11.8568C19.9289 13.7406 17.8615 15 15.5 15C11.9101 15 9 12.0899 9 8.5C9 6.13845 10.2594 4.07105 12.1432 2.93276C12.5392 2.69347 12.4627 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="currentColor"></path></svg>
            </div>
            <div style={{ position: 'absolute', transition: 'all 0.5s ease-in-out', transform: !isNightMode ? 'rotate(0deg) scale(1)' : 'rotate(180deg) scale(0)', opacity: !isNightMode ? 1 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 12C17 14.7614 14.7614 17 12 17C9.23858 17 7 14.7614 7 12C7 9.23858 9.23858 7 12 7C14.7614 7 17 9.23858 17 12Z" fill="currentColor"></path><path fillRule="evenodd" clipRule="evenodd" d="M12 1.25C12.4142 1.25 12.75 1.58579 12.75 2V4C12.75 4.41421 12.4142 4.75 12 4.75C11.5858 4.75 11.25 4.41421 11.25 4V2C11.25 1.58579 11.5858 1.25 12 1.25ZM3.66865 3.71609C3.94815 3.41039 4.42255 3.38915 4.72825 3.66865L6.95026 5.70024C7.25596 5.97974 7.2772 6.45413 6.9977 6.75983C6.7182 7.06553 6.2438 7.08677 5.9381 6.80727L3.71609 4.77569C3.41039 4.49619 3.38915 4.02179 3.66865 3.71609ZM20.3314 3.71609C20.6109 4.02179 20.5896 4.49619 20.2839 4.77569L18.0619 6.80727C17.7562 7.08677 17.2818 7.06553 17.0023 6.75983C16.7228 6.45413 16.744 5.97974 17.0497 5.70024L19.2718 3.66865C19.5775 3.38915 20.0518 3.41039 20.3314 3.71609ZM1.25 12C1.25 11.5858 1.58579 11.25 2 11.25H4C4.41421 11.25 4.75 11.5858 4.75 12C4.75 12.4142 4.41421 12.75 4 12.75H2C1.58579 12.75 1.25 12.4142 1.25 12ZM19.25 12C19.25 11.5858 19.5858 11.25 20 11.25H22C22.4142 11.25 22.75 11.5858 22.75 12C22.75 12.4142 22.4142 12.75 22 12.75H20C19.5858 12.75 19.25 12.4142 19.25 12ZM17.0255 17.0252C17.3184 16.7323 17.7933 16.7323 18.0862 17.0252L20.3082 19.2475C20.6011 19.5404 20.601 20.0153 20.3081 20.3082C20.0152 20.6011 19.5403 20.601 19.2475 20.3081L17.0255 18.0858C16.7326 17.7929 16.7326 17.3181 17.0255 17.0252ZM6.97467 17.0253C7.26756 17.3182 7.26756 17.7931 6.97467 18.086L4.75244 20.3082C4.45955 20.6011 3.98468 20.6011 3.69178 20.3082C3.39889 20.0153 3.39889 19.5404 3.69178 19.2476L5.91401 17.0253C6.2069 16.7324 6.68177 16.7324 6.97467 17.0253ZM12 19.25C12.4142 19.25 12.75 19.5858 12.75 20V22C12.75 22.4142 12.4142 22.75 12 22.75C11.5858 22.75 11.25 22.4142 11.25 22V20C11.25 19.5858 11.5858 19.25 12 19.25Z" fill="currentColor"></path></svg>
            </div>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            onClick={handleSubscribe}
            className={isSwinging ? 'swinging' : ''} 
            style={{
              background: 'transparent', border: 'none', color: 'var(--primary-color)',
              cursor: 'pointer', padding: '6px', borderRadius: '6px', transition: 'all 0.3s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
              width: '32px', height: '32px',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--card-bg-locked)'; e.currentTarget.style.color = 'var(--text-pure)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--primary-color)'; }}
            title={isSubscribed ? 'إيقاف الإشعارات' : 'تفعيل الإشعارات'}
          >
            <BellIcon isSubscribed={isSubscribed} />
          </button>

          {/* 🌟 أزرار التنقل الأصلية أعيدت للهيدر 🌟 */}
          <button 
            onClick={() => onTabChange(activeTab === 'assignments' ? 'schedule' : 'assignments')}
            style={{
              background: 'transparent', border: 'none', color: activeTab === 'assignments' ? 'var(--text-pure)' : 'var(--primary-color)',
              cursor: 'pointer', padding: '6px', borderRadius: '6px', transition: 'all 0.3s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
              width: '32px', height: '32px', overflow: 'hidden',
              backgroundColor: activeTab === 'assignments' ? 'var(--primary-color)' : 'transparent',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => { if(activeTab !== 'assignments') { e.currentTarget.style.backgroundColor = 'var(--card-bg-locked)'; e.currentTarget.style.color = 'var(--text-pure)'; } }}
            onMouseLeave={(e) => { if(activeTab !== 'assignments') { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--primary-color)'; } }}
            title={activeTab === 'assignments' ? "العودة للجدول" : "الواجبات والتقارير"}
          >
            <div style={{ 
              position: 'absolute', transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', 
              opacity: activeTab !== 'assignments' ? 1 : 0, transform: activeTab !== 'assignments' ? 'scale(1)' : 'scale(0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}>
              <AssignmentIcon />
            </div>

            <div style={{ 
              position: 'absolute', transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', 
              opacity: activeTab === 'assignments' ? 1 : 0, transform: activeTab === 'assignments' ? 'scale(1)' : 'scale(0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}>
              <ScheduleIcon />
            </div>
          </button>

          <button 
            onClick={() => onTabChange(activeTab === 'materials' ? 'schedule' : 'materials')}
            style={{
              background: 'transparent', border: 'none', color: activeTab === 'materials' ? 'var(--text-pure)' : 'var(--primary-color)',
              cursor: 'pointer', padding: '6px', borderRadius: '6px', transition: 'all 0.3s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
              width: '32px', height: '32px', overflow: 'hidden',
              backgroundColor: activeTab === 'materials' ? 'var(--primary-color)' : 'transparent',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => { if(activeTab !== 'materials') { e.currentTarget.style.backgroundColor = 'var(--card-bg-locked)'; e.currentTarget.style.color = 'var(--text-pure)'; } }}
            onMouseLeave={(e) => { if(activeTab !== 'materials') { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--primary-color)'; } }}
            title={activeTab === 'materials' ? "العودة للجدول" : "الملازم الدراسية"}
          >
            <div style={{ 
              position: 'absolute', transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', 
              opacity: activeTab !== 'materials' ? 1 : 0, transform: activeTab !== 'materials' ? 'scale(1)' : 'scale(0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}>
              <PaperIcon />
            </div>

            <div style={{ 
              position: 'absolute', transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', 
              opacity: activeTab === 'materials' ? 1 : 0, transform: activeTab === 'materials' ? 'scale(1)' : 'scale(0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}>
              <ScheduleIcon />
            </div>
          </button>
        </div>
      </header>
    </>
  );
}

export default Header;
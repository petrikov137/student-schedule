import Header from './Header';
import { useState, useEffect, useCallback, useRef } from 'react' 
import { database } from './firebase'
import { ref, onValue } from 'firebase/database'
import localforage from 'localforage'; 

// --- 🎨 الأيقونات ---
const LectureIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z" />
  </svg>
);

const LabIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" />
  </svg>
);

const CompIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M2.25 5.25a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3V15a3 3 0 0 1-3 3h-3v.257c0 .597.237 1.17.659 1.591l.621.622a.75.75 0 0 1-.53 1.28h-9a.75.75 0 0 1-.53-1.28l.621-.622a2.25 2.25 0 0 0 .659-1.59V18h-3a3 3 0 0 1-3-3V5.25Zm1.5 0v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5Z" clipRule="evenodd" />
  </svg>
);

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

const GlassIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" opacity="0.5" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="9" y1="21" x2="9" y2="9" />
  </svg>
);

const MatrixIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00ff41" strokeWidth="2">
    <polyline points="4 17 10 11 4 5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </svg>
);

/* ------------------------- */
/* --- بداية أيقونة الثعلب --- */
const FoxIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff8c00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 22 2 8 12 15 22 8 12 22" fill="#ff8c00" stroke="#ff8c00" opacity="0.9"/>
    <polyline points="2 8 6 2 12 8 18 2 22 8" />
  </svg>
);
/* --- نهاية أيقونة الثعلب --- */
/* ------------------------- */

// ------------------------------------------------------------------------------------------------------------------------

function StudentView() {
  const weeks = [
    "الأسبوع الأول", "الأسبوع الثاني", "الأسبوع الثالث", "الأسبوع الرابع", "الأسبوع الخامس",
    "الأسبوع السادس", "الأسبوع السابع", "الأسبوع الثامن", "الأسبوع التاسع", "الأسبوع العاشر",
    "الأسبوع الحادي عشر", "الأسبوع الثاني عشر", "الأسبوع الثالث عشر", "الأسبوع الرابع عشر", "الأسبوع الخامس عشر"
  ];

  const days = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"];

  const availableSubjects = [
    "برمجة كائنية  |   نظري", 
    "برمجة كائنية  |   عملي",
    "هياكل البيانات 2  |   نظري", 
    "هياكل البيانات 2  |   عملي",
    "هندسة البرمجيات  |   نظري",
    "هندسة البرمجيات  |   عملي",
    "قواعد بيانات موزعة", 
    "معمارية الحاسوب", 
    "اللغة الانكليزية",
    "SE | PowePoint Version",
  ];
  
  const [allScheduleData, setAllScheduleData] = useState({});
  const [materialsData, setMaterialsData] = useState({}); 
  const [loading, setLoading] = useState(true);
  
  const [currentWeek, setCurrentWeek] = useState(0); 
  const [selectedDay, setSelectedDay] = useState(null);
  
  const [activeTab, setActiveTab] = useState('schedule');
  const [selectedSubject, setSelectedSubject] = useState(null);

  const [hoveredWeek, setHoveredWeek] = useState(null);
  const [forceRender, setForceRender] = useState(0); 
  
  const [heartBursts, setHeartBursts] = useState([]);
  const [bubbleBursts, setBubbleBursts] = useState([]);

  // --- نظام الثيمات ---
  const [theme, setTheme] = useState(localStorage.getItem('app-theme') || 'dark');
  const [showThemes, setShowThemes] = useState(false);
  const [hoveredTheme, setHoveredTheme] = useState(null);
  const [pressedTheme, setPressedTheme] = useState(null);

  const themesBoxRef = useRef(null);

  // 🌟 مفاتيح السيطرة على الضغط المطول 🌟
  const adminPressTimer = useRef(null);
  const [isLongPressActive, setIsLongPressActive] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      if (theme === 'light') metaThemeColor.setAttribute('content', '#f5f7fa');
      else if (theme === 'coffee' || theme === 'coffee-light') metaThemeColor.setAttribute('content', '#f5ece5');
      else if (theme === 'ocean' || theme === 'ocean-light') metaThemeColor.setAttribute('content', '#0f2027');
      else if (theme === 'twilight' || theme === 'twilight-light') metaThemeColor.setAttribute('content', '#170f23');
      /* ------------------------- */
      /* --- لون الهاتف لثيم الثعلب --- */
      else if (theme === 'fox') metaThemeColor.setAttribute('content', '#5Dadec');
      /* ------------------------- */
      else metaThemeColor.setAttribute('content', '#141414');
    }
  }, [theme]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (themesBoxRef.current && !themesBoxRef.current.contains(event.target)) {
        setShowThemes(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside); 
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleThemeSelect = (selectedTheme, e) => {
    if (e) e.stopPropagation(); 
    setTheme(selectedTheme);
    setTimeout(() => setShowThemes(false), 250); 
  };

  const handleAdminSecretStart = (e) => {
    setIsLongPressActive(false);
    adminPressTimer.current = setTimeout(() => {
      setIsLongPressActive(true);
      
      const currentUrl = window.location.href;
      if (currentUrl.includes('student-schedule')) {
          window.location.href = window.location.origin + '/student-schedule/#/admin';
      } else {
          window.location.href = window.location.origin + '/#/admin';
      }
    }, 4000); 
  };

  const handleAdminSecretEnd = () => {
    if (adminPressTimer.current) clearTimeout(adminPressTimer.current);
  };

  const handleHeaderClick = () => {
    if (!isLongPressActive) {
      setShowThemes(!showThemes);
    }
  };

  // ----------------------------------------------------------------------------------------------------------

  useEffect(() => {
    const cachedData = localStorage.getItem('offline_schedule_data');
    const cachedMaterials = localStorage.getItem('offline_materials_data'); 
    if (cachedData) {
      setAllScheduleData(JSON.parse(cachedData));
      if (cachedMaterials) setMaterialsData(JSON.parse(cachedMaterials));
      setLoading(false); 
    }

    const dataRef = ref(database, '/');
    onValue(dataRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setAllScheduleData(data);
        setMaterialsData(data.materials || {}); 
        if (data.materials) setMaterialsData(data.materials); 
        setLoading(false);
        localStorage.setItem('offline_schedule_data', JSON.stringify(data));
        if (data.materials) localStorage.setItem('offline_materials_data', JSON.stringify(data.materials));
      }
    });

    const calculateCurrentWeek = () => {
      const calculationStartDate = new Date(2026, 0, 30);
      calculationStartDate.setHours(12, 0, 0, 0);

      const today = new Date();
      today.setHours(12, 0, 0, 0);

      const diffTime = today.getTime() - calculationStartDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      let calculatedWeek = Math.floor(diffDays / 7);

      if (calculatedWeek < 0) calculatedWeek = 0;
      if (calculatedWeek > 14) calculatedWeek = 14;

      setCurrentWeek(calculatedWeek);
    };

    calculateCurrentWeek();

  }, []);

// 🌟 مستمع الإشعارات الفورية للطالب (مع التحقق من حالة الجرس) 🌟
  useEffect(() => {
    const notifRef = ref(database, 'latest_notification');
    const unsubscribe = onValue(notifRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.timestamp) {
        const lastNotifTime = localStorage.getItem('last_notif_time');
        
        if (!lastNotifTime || data.timestamp > parseInt(lastNotifTime)) {
          // 🌟 التحقق من أن الطالب مفعل لزر الجرس 🌟
          const isUserSubscribed = localStorage.getItem('fcm_subscribed') === 'true';
          
          if (Notification.permission === 'granted' && isUserSubscribed) {
            new Notification(data.title, { 
              body: data.body,
              icon: '/vite.svg', 
              dir: 'rtl'
            });
          }
          localStorage.setItem('last_notif_time', data.timestamp.toString());
        }
      }
    });
    return () => unsubscribe();
  }, []);
  const getDayDataHelper = (weekIdx, dayName) => {
    const weekKey = `week_${weekIdx}`;
    return allScheduleData[weekKey] && allScheduleData[weekKey][dayName] ? allScheduleData[weekKey][dayName] : null;
  }

  const hasNewUpdate = (day) => {
    if (activeTab === 'materials') return false; 
    const dayData = getDayDataHelper(currentWeek, day);
    if (!dayData || !dayData.lastUpdated) return false;

    const storageKey = `seen_week_${currentWeek}_day_${day}`;
    const lastSeenTime = localStorage.getItem(storageKey);

    if (!lastSeenTime) return true;
    return dayData.lastUpdated > parseInt(lastSeenTime);
  };

  const triggerThemeBurst = useCallback((weekIndexToBurst, e = null) => {
    const isOceanTheme = theme === 'ocean' || theme === 'ocean-light';
    
    if (isOceanTheme) {
      const dotElement = document.getElementById(`dot-${weekIndexToBurst}`);
      if (dotElement) {
        let burstX, burstY;

        let zoomFactor = 1;
        const container = document.querySelector('.main-container');
        if (container) {
          const computedZoom = window.getComputedStyle(container).zoom;
          if (computedZoom && computedZoom !== 'normal') {
            zoomFactor = parseFloat(computedZoom);
          }
        }

        if (e && e.touches && e.touches.length > 0) {
          burstX = e.touches[0].clientX;
          burstY = e.touches[0].clientY;
        } else if (e && e.clientX && e.clientY) {
           burstX = e.clientX;
           burstY = e.clientY;
        } else {
          const rect = dotElement.getBoundingClientRect();
          burstX = rect.left + (rect.width / 2);
          burstY = rect.top + (rect.height / 2);
        }

        burstX = burstX / zoomFactor;
        burstY = burstY / zoomFactor;

        const newBurst = { id: Date.now() + Math.random(), x: burstX, y: burstY };
        setBubbleBursts(prev => [...prev, newBurst]);
        setTimeout(() => setBubbleBursts(prev => prev.filter(b => b.id !== newBurst.id)), 400); 
      }
    }
  }, [theme]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeTab === 'materials') return; 

      if (e.key === 'ArrowLeft') {
        triggerThemeBurst(currentWeek); 
        setSelectedDay(null);
        setCurrentWeek((prev) => (prev < weeks.length - 1 ? prev + 1 : 0));
      } 
      else if (e.key === 'ArrowRight') {
        triggerThemeBurst(currentWeek); 
        setSelectedDay(null);
        setCurrentWeek((prev) => (prev > 0 ? prev - 1 : weeks.length - 1));
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault(); 
        const currentIndex = days.indexOf(selectedDay);
        if (e.key === 'ArrowDown') {
          if (selectedDay === null) setSelectedDay(days[0]);
          else if (currentIndex < days.length - 1) setSelectedDay(days[currentIndex + 1]);
        } 
      }
      else if (e.key === 'ArrowUp') {
          const currentIndex = days.indexOf(selectedDay);
          if (currentIndex > 0) setSelectedDay(days[currentIndex - 1]);
          else if (currentIndex === 0) setSelectedDay(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDay, weeks.length, activeTab, currentWeek, triggerThemeBurst]); 

  const nextWeek = () => { 
    triggerThemeBurst(currentWeek); 
    setSelectedDay(null);
    if (currentWeek < weeks.length - 1) setCurrentWeek(currentWeek + 1); else setCurrentWeek(0);
  }
  const prevWeek = () => { 
    triggerThemeBurst(currentWeek); 
    setSelectedDay(null);
    if (currentWeek > 0) setCurrentWeek(currentWeek - 1); else setCurrentWeek(weeks.length - 1);
  }

  const toggleDay = (day, isLocked, e) => { 
    if (isLocked) return; 

    if (selectedDay !== day) {
        const storageKey = `seen_week_${currentWeek}_day_${day}`;
        localStorage.setItem(storageKey, Date.now().toString());
        setForceRender(prev => prev + 1); 

        const isHeartsTheme = theme === 'hearts' || theme === 'hearts-dark';
        if (isHeartsTheme && e) {
          let clientX = e.clientX;
          let clientY = e.clientY;
          if (clientX === undefined && e.changedTouches && e.changedTouches.length > 0) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
          }
          
          if (clientX !== undefined && clientY !== undefined) {
            const newBurst = { id: Date.now() + Math.random(), x: clientX, y: clientY };
            setHeartBursts(prev => [...prev, newBurst]);
            setTimeout(() => {
              setHeartBursts(prev => prev.filter(b => b.id !== newBurst.id));
            }, 500); 
          }
        }
    }

    selectedDay === day ? setSelectedDay(null) : setSelectedDay(day); 
  }

  const getDayData = (day) => {
    const weekKey = `week_${currentWeek}`;
    return allScheduleData[weekKey] && allScheduleData[weekKey][day] ? allScheduleData[weekKey][day] : null;
  }

  const getDateForDay = (dayIndex) => {
    const startDate = new Date(2026, 1, 1); 
    const daysToAdd = (currentWeek * 7) + dayIndex;
    startDate.setDate(startDate.getDate() + daysToAdd);
    return `${startDate.getDate()} / ${startDate.getMonth() + 1}`;
  }

  const getDirectDownloadLink = (url) => {
    if (!url) return "#";
    if (url.includes('drive.google.com/file/d/')) {
      const fileId = url.split('/file/d/')[1].split('/')[0];
      return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
    return url;
  };

  if (loading) return <div style={{ color: 'var(--text-pure)', marginTop: '310px' }}>جارِ جلب الجدول..</div>;

  const getStatusColor = (isExamDay) => {
    if (isExamDay) return '#ff0000d1'; 
    if (theme === 'glass' || theme === 'matrix') return '#15ff00c7'; 
    return 'var(--primary-color)'; 
  };

  return (
    <div className="main-container" style={{ width: '100%', maxWidth: '600px', margin: '0 auto', padding: '0 0px' }}>
      
      <style>
        {`
          @keyframes flyOutBurst {
            0% { transform: translate(-50%, -50%) scale(0.3); opacity: 1; }
            100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(1.5) rotate(var(--rot)); opacity: 0; }
          }
          .flying-heart-burst {
            position: absolute;
            animation: flyOutBurst 0.5s cubic-bezier(0.1, 1, 0.2, 1) forwards;
            filter: drop-shadow(0 0 5px var(--primary-color));
          }
          .hb-1 { --tx: -50px; --ty: -60px; --rot: -20deg; }
          .hb-2 { --tx: 50px; --ty: -50px; --rot: 25deg; }
          .hb-3 { --tx: 0px; --ty: -80px; --rot: 0deg; }
          .hb-4 { --tx: -70px; --ty: 10px; --rot: -40deg; }
          .hb-5 { --tx: 70px; --ty: 20px; --rot: 35deg; }

          @keyframes popBubble {
            0% { transform: translate(-50%, -50%) scale(0.2); opacity: 1; }
            100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(1.8); opacity: 0; }
          }
          .bubble-drop {
            position: absolute;
            border-radius: 50%;
            animation: popBubble 0.4s cubic-bezier(0.1, 1, 0.2, 1) forwards;
          }
          [data-theme='ocean'] .bubble-drop {
            background: rgba(255, 255, 255, 0.85); 
            box-shadow: 0 0 6px rgba(255, 255, 255, 0.9);
          }
          [data-theme='ocean-light'] .bubble-drop {
            background: rgba(2, 132, 199, 0.85); 
            box-shadow: 0 0 6px rgba(2, 132, 199, 0.6);
          }
          .bd-1 { width: 5px; height: 5px; --tx: -18px; --ty: -20px; }
          .bd-2 { width: 4px; height: 4px; --tx: 18px; --ty: -15px; }
          .bd-3 { width: 6px; height: 6px; --tx: -12px; --ty: 18px; }
          .bd-4 { width: 5px; height: 5px; --tx: 15px; --ty: 15px; }
          .bd-5 { width: 3px; height: 3px; --tx: 0px; --ty: -25px; }

          @media screen and (max-width: 400px) {
            .main-container {
              zoom: 0.89; 
            }
            @-moz-document url-prefix() {
              .main-container {
                transform: scale(0.88);
                transform-origin: top center;
                width: 113% !important;
              }
            }
          }
        `}
      </style>

      {heartBursts.map(burst => (
        <div key={burst.id} style={{ position: 'fixed', left: burst.x, top: burst.y, zIndex: 9999, pointerEvents: 'none' }}>
          <svg className="flying-heart-burst hb-1" width="18" height="18" viewBox="0 0 24 24" fill="var(--primary-color)"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
          <svg className="flying-heart-burst hb-2" width="14" height="14" viewBox="0 0 24 24" fill="#fca5a5"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
          <svg className="flying-heart-burst hb-3" width="22" height="22" viewBox="0 0 24 24" fill="var(--dot-active)"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
          <svg className="flying-heart-burst hb-4" width="12" height="12" viewBox="0 0 24 24" fill="#fda4af"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
          <svg className="flying-heart-burst hb-5" width="16" height="16" viewBox="0 0 24 24" fill="var(--primary-color)"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
        </div>
      ))}

      {bubbleBursts.map(burst => (
        <div key={burst.id} style={{ position: 'fixed', left: burst.x, top: burst.y, zIndex: 9999, pointerEvents: 'none' }}>
          <div className="bubble-drop bd-1"></div>
          <div className="bubble-drop bd-2"></div>
          <div className="bubble-drop bd-3"></div>
          <div className="bubble-drop bd-4"></div>
          <div className="bubble-drop bd-5"></div>
        </div>
      ))}
      
      <Header currentTheme={theme} onThemeSelect={handleThemeSelect} activeTab={activeTab} onTabChange={setActiveTab} />  
      
      <h1 style={{ textAlign: 'center', color: 'var(--text-pure)', marginBottom: '20px', marginTop: '10px' }}>
        {activeTab === 'schedule' ? 'الجدول الأسبوعي' : 'الملازم الدراسية'}
      </h1>

      {/* ===================== قسم الجدول ===================== */}
      {activeTab === 'schedule' && (
        <>
          <div key={currentWeek} className="week-animate">
            <div 
              className="week-bar-box"
              ref={themesBoxRef} 
              style={{ 
                backgroundColor: 'var(--primary-color)', color: 'var(--text-pure)', borderRadius: '10px', marginBottom: '30px', height: '64px',
                position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                boxShadow: '0 4px 15px rgba(0,0,0,0.15)', transition: 'background-color 0.4s ease', WebkitTapHighlightColor: 'transparent'
              }}
            >
              <div 
                onClick={handleHeaderClick}
                onMouseDown={handleAdminSecretStart}
                onMouseUp={handleAdminSecretEnd}
                onMouseLeave={handleAdminSecretEnd}
                onTouchStart={handleAdminSecretStart}
                onTouchEnd={handleAdminSecretEnd}
                onContextMenu={(e) => e.preventDefault()} 
                style={{
                  position: 'absolute', width: '100%', height: '100%', cursor: 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', 
                  transform: showThemes ? 'scale(0.3)' : 'scale(1)', 
                  opacity: showThemes ? 0 : 1, 
                  pointerEvents: showThemes ? 'none' : 'auto', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                <h2 style={{ margin: 0, textAlign: 'center' }}>{weeks[currentWeek]}</h2>
                <span style={{ opacity: 0.5, fontSize: '14px' }}> </span>
              </div>

              <div style={{
                position: 'absolute', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '15px', width: '100%', padding: '0 5px',
                transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', 
                transform: showThemes ? 'scale(1)' : 'scale(0.3)', 
                opacity: showThemes ? 1 : 0, 
                pointerEvents: showThemes ? 'auto' : 'none'
              }}>
                {[
                  { id: 'glass', icon: <GlassIcon />, label: 'زجاج' }, 
                  { id: 'matrix', icon: <MatrixIcon />, label: 'مصفوفة' },
                  { id: 'fox', icon: <FoxIcon />, label: 'الثعلب' }
                ].map((t) => {
                  const isHovered = hoveredTheme === t.id;
                  const isPressed = pressedTheme === t.id;
                  let btnScale = 1;
                  if (isPressed) { btnScale = 0.9; } else if (isHovered) { btnScale = 1.15; }

                  return (
                    <div 
                      key={t.id} 
                      onClick={(e) => { 
                        handleThemeSelect(t.id, e); 
                        setShowThemes(false); 
                      }} 
                      onMouseEnter={() => setHoveredTheme(t.id)}
                      onMouseLeave={() => { setHoveredTheme(null); setPressedTheme(null); }}
                      onMouseDown={() => setPressedTheme(t.id)}
                      onMouseUp={() => setPressedTheme(null)}
                      onTouchStart={() => setPressedTheme(t.id)}
                      onTouchEnd={() => setPressedTheme(null)}

                      style={{ 
                        backgroundColor: theme === t.id ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)', 
                        border: theme === t.id ? '1px solid rgba(255,255,255,0.8)' : '1px solid transparent', 
                        padding: '8px 15px', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer',
                        zIndex: isHovered || isPressed ? 10 : 1,
                        boxShadow: isHovered && !isPressed ? '0 8px 12px rgba(0,0,0,0.2)' : 'none',
                        transition: 'background-color 0.3s ease, border 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease',
                        transformOrigin: 'center center',
                        transform: `scale(${btnScale})`, 
                      }}>
                      <span>{t.icon}</span><span>{t.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
            
            <div style={{ WebkitTapHighlightColor: 'transparent', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {days.map((day, index) => {
                const dayInfo = getDayData(day);
                const isLocked = !dayInfo || !dayInfo.isOpen;
                const isExpanded = selectedDay === day;
                const dateString = getDateForDay(index);
                const isExam = dayInfo ? dayInfo.isExam : false;
                
                const statusColor = getStatusColor(isExam);
                const showNotification = hasNewUpdate(day) && !isExpanded && !isLocked;

                return (
                  <div 
                    key={index} 
                    onClick={(e) => toggleDay(day, isLocked, e)} 
                    className={`day-card ${isExpanded ? 'expanded' : ''} schedule-day-box`}
                    style={{
                      opacity: isLocked ? 0.6 : 1, cursor: isLocked ? 'default' : 'pointer',
                      ...(showNotification ? {
                        backgroundImage: 'linear-gradient(270deg, var(--notify-1), var(--notify-2), var(--notify-3), var(--notify-1))', backgroundSize: '400% 400%', animation: 'gradientFadeMove 3s ease infinite', borderTop: '1px solid var(--border-line)', borderBottom: '1px solid var(--border-line)', borderRight: '1px solid var(--border-line)'
                      } : { backgroundColor: isLocked ? 'var(--card-bg-locked)' : 'var(--card-bg-normal)' }),
                      
                      borderLeft: isLocked ? '5px solid var(--dot-bg)' : `5px solid ${statusColor}`
                    }}
                  >
                    <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
                      <h3 style={{ margin: 0, fontSize: '18px', color: isLocked ? 'var(--text-muted)' : 'var(--text-pure)' }}>
                        {day} {isExam && !isLocked && !isExpanded ? '!!' : ''}
                      </h3>
                      <span style={{ fontSize: '14px', color: isLocked ? 'var(--text-muted)' : (isExpanded ? statusColor : 'var(--text-main)'), backgroundColor: isExpanded ? `${statusColor}1a` : 'transparent', padding: '4px 10px', borderRadius: '8px', fontWeight: 'bold', transition: 'all 0.3s ease', fontFamily: 'sans-serif' }}>{dateString}</span>
                    </div>
                    
                    <div style={{ maxHeight: isExpanded ? '2000px' : '0px', opacity: isExpanded ? 1 : 0, transition: isExpanded ? 'max-height 1.3s ease, opacity 0.7s ease' : 'all 0.5s ease', borderTop: isExpanded ? '1px solid var(--border-line)' : 'none' }}>
                      <div style={{ padding: '15px 0 20px 0' }}>
                        
                        <div style={{ margin: '10px 0' }}>
                          {dayInfo && Array.isArray(dayInfo.subjects) ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              {dayInfo.subjects.map((subj, idx) => {
                                
                                let eventColor = 'var(--text-muted)'; 
                                const eventType = subj.type || 'محاضرة';
                                const subjectName = subj.name || 'مادة سابقة';

                                return (
                                  <div key={idx} 
                                  className="subject-inner-card"
                                  style={{ 
                                    backgroundColor: 'var(--card-bg-locked)', 
                                    borderRadius: '12px',
                                    padding: '16px',
                                    display: 'flex',
                                    flexDirection: 'column', 
                                    gap: '4px',
                                    textAlign: 'right',
                                    borderRight: `4px solid ${eventColor}`,
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                  }}>
                                    
                                    <span style={{ 
                                      color: 'var(--text-details)', 
                                      fontSize: '13px', 
                                      fontWeight: 'bold',
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: '6px' 
                                    }}>
                                      {eventType === 'محاضرة' && <LectureIcon />}
                                      {eventType === 'مختبر' && <LabIcon />}
                                      {eventType}
                                    </span>
                                    
                                    <span style={{ color: 'var(--text-pure)', fontSize: '18px', fontWeight: 'bold', marginTop: '2px' }}>
                                      {subjectName}
                                    </span>
                                    
                                    {subj.content && (
                                      <span style={{ color: 'var(--text-details)', fontSize: '14px', whiteSpace: 'pre-wrap', marginTop: '4px', lineHeight: '1.6' }}>
                                        {subj.content}
                                      </span>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          ) : ( <p style={{ margin: 0, whiteSpace: 'pre-wrap', color: 'var(--text-pure)' }}>{dayInfo ? dayInfo.subjects : "فراغ"}</p> )}
                        </div>

                        <p style={{ margin: '20px 0 10px 0', fontSize: '18px', whiteSpace: 'pre-wrap', borderTop: '1px dashed var(--border-line)', paddingTop: '10px', color: 'var(--text-pure)' }}>
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ marginTop: '40px', paddingBottom: '20px' }}>
            <div className="dots-container nav-dots-container" onMouseLeave={() => setHoveredWeek(null)} style={{ 
              WebkitTapHighlightColor: 'transparent', display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'nowrap', 
              gap: (theme === 'hearts' || theme === 'hearts-dark') ? 'clamp(1px, 0.5vw, 4px)' : 'clamp(2px, 1.5vw, 8px)', 
              marginBottom: '20px', width: '100%' 
            }}>
              {weeks.map((_, index) => {
                let scale = 1; let transitionDelay = '0s'; let opacity = 1; 
                if (hoveredWeek !== null) {
                  if (index === hoveredWeek) { scale = 1.6; transitionDelay = '0s'; opacity = 1; } 
                  else if (Math.abs(index - hoveredWeek) === 1) { scale = 1.25; transitionDelay = '0.05s'; opacity = 1; } 
                  else if (Math.abs(index - hoveredWeek) === 2) { scale = 1.1; transitionDelay = '0.1s'; opacity = 1; }
                } else { if (index === currentWeek) { scale = 1.5; opacity = 1; } }

                const isHeartsTheme = theme === 'hearts' || theme === 'hearts-dark';
                const isOceanTheme = theme === 'ocean' || theme === 'ocean-light'; 
                
                const size = isHeartsTheme ? '16px' : '10px'; 

                const bubbleStyle = isOceanTheme ? {
                  backgroundColor: currentWeek === index 
                    ? (theme === 'ocean-light' ? 'rgba(2, 132, 199, 0.6)' : 'rgba(255, 255, 255, 0.4)')
                    : (theme === 'ocean-light' ? 'rgba(2, 132, 199, 0.2)' : 'rgba(255, 255, 255, 0.1)'),
                  boxShadow: currentWeek === index 
                    ? (theme === 'ocean-light' 
                        ? 'inset 0 0 5px rgba(2, 132, 199, 0.8), 0 0 8px var(--primary-color)' 
                        : 'inset 0 0 5px rgba(255,255,255,0.8), 0 0 8px var(--primary-color)')
                    : (theme === 'ocean-light'
                        ? 'inset 0 0 3px rgba(2, 132, 199, 0.4)'
                        : 'inset 0 0 3px rgba(255,255,255,0.3)'),
                  border: currentWeek === index 
                    ? (theme === 'ocean-light' ? '1px solid rgba(2, 132, 199, 0.8)' : '1px solid rgba(255,255,255,0.8)')
                    : (theme === 'ocean-light' ? '1px solid rgba(2, 132, 199, 0.3)' : '1px solid rgba(255,255,255,0.2)'),
                  backdropFilter: 'blur(2px)'
                } : {};

                return (
                  <div 
                    id={`dot-${index}`} 
                    key={index} 
                    onClick={(e) => {
                      if (currentWeek !== index) {
                        triggerThemeBurst(currentWeek, e); 
                        setCurrentWeek(index);
                        setSelectedDay(null);
                      }
                    }}
                    onMouseEnter={() => setHoveredWeek(index)} 
                    className={`dot ${currentWeek === index ? 'active' : ''}`} 
                    style={{ 
                      transform: `scale(${scale})`, 
                      willChange: 'transform', 
                      backfaceVisibility: 'hidden', 
                      transition: 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease, border 0.3s ease', 
                      transitionDelay: transitionDelay, 
                      
                      boxShadow: isHeartsTheme ? 'none' : (isOceanTheme ? bubbleStyle.boxShadow : ''), 
                      border: isHeartsTheme ? 'none' : (isOceanTheme ? bubbleStyle.border : ''), 
                      backgroundColor: isHeartsTheme ? 'transparent' : (isOceanTheme ? bubbleStyle.backgroundColor : ''),
                      
                      opacity: opacity, 
                      cursor: 'pointer',
                      borderRadius: isHeartsTheme ? '0' : '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: size, 
                      height: size,
                      backdropFilter: isOceanTheme ? bubbleStyle.backdropFilter : 'none'
                    }}
                  >
                    {isHeartsTheme && (
                      <svg 
                        width="100%" 
                        height="100%" 
                        viewBox="0 0 24 24" 
                        fill={currentWeek === index ? 'var(--dot-active)' : 'var(--dot-bg)'}
                        style={{ transition: 'fill 0.3s ease' }}
                      >
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    )}
                    
                    {isOceanTheme && currentWeek === index && (
                      <div style={{ 
                        position: 'absolute', top: '15%', left: '15%', width: '3px', height: '3px', 
                        backgroundColor: theme === 'ocean-light' ? 'rgba(255,255,255,0.9)' : 'white', 
                        borderRadius: '50%', opacity: 0.8 
                      }}></div>
                    )}
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 5px' }}>
              <button className="nav-btn" onClick={prevWeek} style={{ WebkitTapHighlightColor: 'transparent', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}><span>&rarr;</span> <span>السابق</span></button>
              <button className="nav-btn" onClick={nextWeek} style={{ WebkitTapHighlightColor: 'transparent', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}><span>التالي</span> <span>&larr;</span></button>
            </div>
          </div>
        </>
      )}

      {/* ===================== قسم الملازم ===================== */}
      {activeTab === 'materials' && (
        <div className="week-animate" style={{ paddingBottom: '30px' }}>
          <div style={{ WebkitTapHighlightColor: 'transparent', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {availableSubjects.map((subject, index) => {
              const isExpanded = selectedSubject === subject;
              
              const subjectMaterialsRaw = materialsData[subject];
              const subjectMaterials = Array.isArray(subjectMaterialsRaw) 
                ? subjectMaterialsRaw.filter(Boolean) 
                : Object.values(subjectMaterialsRaw || {}).filter(Boolean);
              
              const hasMaterials = subjectMaterials.length > 0;

              return (
                <div 
                  key={index} 
                  onClick={() => setSelectedSubject(isExpanded ? null : subject)} 
                  className={`day-card ${isExpanded ? 'expanded' : ''} schedule-day-box`}
                  style={{
                    cursor: 'pointer',
                    backgroundColor: isExpanded ? 'var(--card-bg-expanded)' : 'var(--card-bg-normal)',
                    borderLeft: `5px solid var(--primary-color)`
                  }}
                >
                  <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-pure)' }}>{subject}</h3>
                    <span style={{ fontSize: '13px', color: isExpanded ? 'var(--primary-color)' : 'var(--text-muted)', backgroundColor: isExpanded ? 'rgba(0,0,0,0.15)' : 'var(--card-bg-locked)', padding: '4px 10px', borderRadius: '8px', fontWeight: 'bold' }}>
                      {hasMaterials ? `${subjectMaterials.length} ملفات` : 'لا يوجد'}
                    </span>
                  </div>
                  
                  <div style={{ maxHeight: isExpanded ? '2000px' : '0px', opacity: isExpanded ? 1 : 0, transition: isExpanded ? 'max-height 1.3s ease, opacity 0.7s ease' : 'all 0.5s ease', borderTop: isExpanded ? '1px solid var(--border-line)' : 'none', overflow: 'hidden' }}>
                    <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {hasMaterials ? (
                        subjectMaterials.map((mat, idx) => {
                          
                          return (
                            <div key={idx} onClick={(e) => e.stopPropagation()} className="subject-inner-card" style={{ 
                              backgroundColor: 'var(--card-bg-locked)', 
                              borderRadius: '12px', 
                              padding: '12px 16px', 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center', 
                              borderRight: `4px solid var(--primary-color)`,
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'right' }}>
                                <span style={{ color: 'var(--text-pure)', fontWeight: 'bold', fontSize: '15px' }}>{mat.title}</span>
                                <span style={{ color: 'var(--text-details)', fontSize: '12px' }}>تمت الإضافة: {mat.date || 'حديثاً'}</span>
                              </div>
                              
                              <a 
                                href={getDirectDownloadLink(mat.link)} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                download 
                                style={{ 
                                  backgroundColor: 'var(--primary-color)', 
                                  color: 'white', 
                                  padding: '8px 16px', 
                                  borderRadius: '6px', 
                                  textDecoration: 'none', 
                                  fontSize: '13px', 
                                  fontWeight: 'bold',
                                  display: 'inline-block'
                                }}
                              >
                                تنزيل للجهاز ⬇️
                              </a>
                            </div>
                          )
                        })
                      ) : (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0', margin: 0, fontSize: '14px' }}>لم يتم إضافة ملازم لهذه المادة بعد.</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}

export default StudentView
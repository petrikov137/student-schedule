import Header from './Header';
import ExamScheduleStudent from './ExamScheduleStudent'; // Temp
import { useState, useEffect, useCallback, useRef } from 'react' 
import { database, auth } from './firebase'
import { ref, onValue } from 'firebase/database'
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import localforage from 'localforage'; 

// --- 🎨 الأيقونات الأصلية ---
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

const AssignmentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%">
    <path d="M11.25 5.337c0-.355-.186-.676-.401-.959a1.647 1.647 0 0 1-.349-1.003c0-1.036 1.007-1.875 2.25-1.875S15 2.34 15 3.375c0 .369-.128.713-.349 1.003-.215.283-.401.604-.401.959 0 .332.278.598.61.578 1.91-.114 3.79-.342 5.632-.676a.75.75 0 0 1 .878.645 49.17 49.17 0 0 1 .376 5.452.657.657 0 0 1-.66.664c-.354 0-.675-.186-.958-.401a1.647 1.647 0 0 0-1.003-.349c-1.035 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401.31 0 .557.262.534.571a48.774 48.774 0 0 1-.595 4.845.75.75 0 0 1-.61.61c-1.82.317-3.673.533-5.555.642a.58.58 0 0 1-.611-.581c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.035-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959a.641.641 0 0 1-.658.643 49.118 49.118 0 0 1-4.708-.36.75.75 0 0 1-.645-.878c.293-1.614.504-3.257.629-4.924A.53.53 0 0 0 5.337 15c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.036 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.369 0 .713.128 1.003.349.283.215.604.401.959.401a.656.656 0 0 0 .659-.663 47.703 47.703 0 0 0-.31-4.82.75.75 0 0 1 .83-.832c1.343.155 2.703.254 4.077.294a.64.64 0 0 0 .657-.642Z" />
  </svg>
);

const ScheduleIcon = () => (
  <svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor">
    <path d="M5.625 3.75a2.625 2.625 0 1 0 0 5.25h12.75a2.625 2.625 0 0 0 0-5.25H5.625ZM3.75 11.25a.75.75 0 0 0 0 1.5h16.5a.75.75 0 0 0 0-1.5H3.75ZM3 15.75a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75ZM3.75 18.75a.75.75 0 0 0 0 1.5h16.5a.75.75 0 0 0 0-1.5H3.75Z" />
  </svg>
);

// 🌟 الأيقونات الجديدة لشريط التنقل 🌟
const SettingsIcon = () => (
  <svg width="100%" height="100%" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ProfileIcon = () => (
  <svg width="100%" height="100%" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

const ThemeIcon = () => (
  <svg width="100%" height="100%" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.495-6.496a3.75 3.75 0 000-5.303l-1.06-1.06a3.75 3.75 0 00-5.304 0l-6.495 6.495a3.75 3.75 0 000 5.304l1.06 1.06z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.5 6.5l3 3" />
  </svg>
);
// ------------------------------------------------------------------------------------------------------------------------

function StudentView() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
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
  const [theme, setTheme] = useState(localStorage.getItem('app-theme') || 'ocean');

  const adminPressTimer = useRef(null);
  const [isLongPressActive, setIsLongPressActive] = useState(false);

  // 🌟 نظام اكتشاف السكرول لإخفاء/إظهار الشريط السفلي 🌟
  const [isNavVisible, setIsNavVisible] = useState(true);
  const lastScrollY = useRef(0);

  // 🌟 بطاقات الثيمات الجديدة 🌟
  const themeCards = [
    { id: 'ocean', name: 'المحيط (Ocean)', color: '#0094f7', icon: '🌊' },
    { id: 'twilight', name: 'الشفق (Twilight)', color: '#9333ea', icon: '🌌' },
    { id: 'hearts', name: 'القلوب (Hearts)', color: '#f43f5e', icon: '❤️' },
    { id: 'coffee', name: 'القهوة (Coffee)', color: '#d28c47', icon: '☕' },
    { id: 'glass', name: 'الزجاج (Glass)', color: '#a8b2c1', icon: '🧊' },
    { id: 'matrix', name: 'المصفوفة (Matrix)', color: '#00ff41', icon: '💻' },
    { id: 'fox', name: 'الثعلب (Fox)', color: '#ff8c00', icon: '🦊' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setIsNavVisible(false); // سكرول للأسفل -> إخفاء
      } else {
        setIsNavVisible(true);  // سكرول للأعلى -> إظهار
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("خطأ في تسجيل الخروج:", error);
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      if (theme === 'light') metaThemeColor.setAttribute('content', '#f5f7fa');
      else if (theme === 'coffee' || theme === 'coffee-light') metaThemeColor.setAttribute('content', '#f5ece5');
      else if (theme === 'ocean' || theme === 'ocean-light') metaThemeColor.setAttribute('content', '#0f2027');
      else if (theme === 'twilight' || theme === 'twilight-light') metaThemeColor.setAttribute('content', '#170f23');
      else if (theme === 'fox') metaThemeColor.setAttribute('content', '#5Dadec');
      else metaThemeColor.setAttribute('content', '#141414');
    }
  }, [theme]);

  const handleThemeSelect = (selectedTheme, e) => {
    if (e) e.stopPropagation(); 
    setTheme(selectedTheme);
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

  useEffect(() => {
    const notifRef = ref(database, 'latest_notification');
    const unsubscribe = onValue(notifRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.timestamp) {
        const lastNotifTime = localStorage.getItem('last_notif_time');
        
        if (!lastNotifTime || data.timestamp > parseInt(lastNotifTime)) {
          const isUserSubscribed = localStorage.getItem('fcm_subscribed') === 'true';
          const notificationAge = Date.now() - data.timestamp;
          
          if (notificationAge < 60000 && Notification.permission === 'granted' && isUserSubscribed) {
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification(data.title, { 
                  body: data.body,
                  icon: '/pwa-192x192.png', 
                  dir: 'rtl',
                  vibrate: [200, 100, 200]
                });
              });
            } else {
              new Notification(data.title, { body: data.body, icon: '/pwa-192x192.png', dir: 'rtl' });
            }
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
    if (activeTab === 'materials' || activeTab === 'assignments' || activeTab === 'themes' || activeTab === 'profile' || activeTab === 'settings') return false; 
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
      if (activeTab !== 'schedule') return; 

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

  const getDateForDay = (dayIndex, weekIndex = currentWeek) => {
    const startDate = new Date(2026, 1, 1); 
    const daysToAdd = (weekIndex * 7) + dayIndex;
    startDate.setDate(startDate.getDate() + daysToAdd);
    return startDate;
  }

  const getDirectDownloadLink = (url) => {
    if (!url) return "#";
    if (url.includes('drive.google.com/file/d/')) {
      const fileId = url.split('/file/d/')[1].split('/')[0];
      return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
    return url;
  };

  const getCountdown = (targetDate) => {
    const now = new Date();
    const target = new Date(targetDate);
    target.setHours(23, 59, 59, 999);
    const diff = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (diff < 0) return { text: "انتهى", color: "#ef4444" }; 
    if (diffDays === 0) return { text: "ينتهي اليوم", color: "#10b981" }; 
    if (diffDays === 1) return { text: "تبقى يوم", color: "#10b981" }; 
    if (diffDays === 2) return { text: "تبقى يومان", color: "#10b981" };
    if (diffDays <= 10) return { text: `تبقى ${diffDays} أيام`, color: "#10b981" }; 
    return { text: `تبقى ${diffDays} يوم`, color: "#10b981" }; 
  };

  const allAssignmentsList = [];

  for (let w = 0; w < 15; w++) {
    const weekKey = `week_${w}`;
    if (allScheduleData[weekKey]) {
      days.forEach((day, dIdx) => {
        const dayData = allScheduleData[weekKey][day];
        if (dayData && Array.isArray(dayData.subjects)) {
          dayData.subjects.forEach(subj => {
            if (subj.type === "واجب" || subj.type === "تقرير") {
              const targetDate = getDateForDay(dIdx, w);
              targetDate.setHours(23, 59, 59, 999);
              
              const now = new Date();
              const expiryTime = targetDate.getTime() + (24 * 60 * 60 * 1000); 
              
              if (now.getTime() <= expiryTime) {
                allAssignmentsList.push({
                  ...subj,
                  targetDate,
                  weekStr: weeks[w],
                  dayStr: day
                });
              }
            }
          });
        }
      });
    }
  }

  allAssignmentsList.sort((a, b) => a.targetDate - b.targetDate);

  if (loading ) {
    const vBlocks = [
      { id: 1, top: 0, left: 0, delay: '0s' }, { id: 2, top: 18, left: 11, delay: '0.1s' },
      { id: 3, top: 36, left: 22, delay: '0.2s' }, { id: 4, top: 54, left: 33, delay: '0.3s' },
      { id: 5, top: 72, left: 44, delay: '0.4s' }, { id: 6, top: 54, left: 55, delay: '0.5s' },
      { id: 7, top: 36, left: 66, delay: '0.6s' }, { id: 8, top: 18, left: 77, delay: '0.7s' },
      { id: 9, top: 0, left: 88, delay: '0.8s' },
    ];
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#000000', overflow: 'hidden', position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 9999 }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', width: '124px', height: '86px', transform: 'translate(-50%, -50%) scale(1.2)' }}>
          {vBlocks.map(b => (
            <div key={b.id} style={{ position: 'absolute', top: `${b.top}px`, left: `${b.left}px` }}>
              <div className="v-logo-block" style={{ animationDelay: b.delay }}></div>
            </div>
          ))}
        </div>
        <style>{`
          .v-logo-block { width: 36px; height: 14px; background-color: var(--primary-color, #0094f7); border-radius: 3px; transform: skewX(-24deg); box-shadow: 0 0 10px var(--primary-color, #0094f7); animation: v-energy-flow 1.5s ease-in-out infinite; }
          @keyframes v-energy-flow { 0%, 100% { transform: skewX(-24deg) translateY(0) scale(1); filter: brightness(1); opacity: 0.7; } 50% { transform: skewX(-24deg) translateY(-6px) scale(1.15); filter: brightness(1.6); box-shadow: 0 0 25px var(--primary-color, #0094f7); opacity: 1; } }
          body { transition: background-color 0.5s ease; }
        `}</style>
      </div>
    );
  }

  const getStatusColor = (isExamDay) => {
    if (isExamDay) return '#ff0000d1'; 
    if (theme === 'glass' || theme === 'matrix') return '#15ff00c7'; 
    return 'var(--primary-color)'; 
  };

  const showBottomNav = isNavVisible && selectedDay === null;

  return (
    <div className="main-container" style={{ width: '100%', maxWidth: '600px', margin: '0 auto', padding: '0 0px', paddingBottom: '90px' }}>
      
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
      
      {/* 🌟 الهيدر كما كان سابقاً (مع تعديل زر الثيمات) 🌟 */}
      <Header currentTheme={theme} onThemeSelect={handleThemeSelect} activeTab={activeTab} onTabChange={setActiveTab} /> 
      
      <h1 style={{ textAlign: 'center', color: 'var(--text-pure)', marginBottom: '20px', marginTop: '10px' }}>
        {activeTab === 'schedule' ? 'الجدول الأسبوعي' : activeTab === 'materials' ? 'الملازم الدراسية' : activeTab === 'assignments' ? 'الواجبات والتقارير' : activeTab === 'themes' ? 'المظهر والثيمات' : activeTab === 'settings' ? 'الإعدادات' : 'الملف الشخصي'}
      </h1>

      {/* ===================== قسم الجدول ===================== */}
      {activeTab === 'schedule' && (
        <>
          <div key={currentWeek} className="week-animate">
            <div 
              className="week-bar-box"
              style={{ 
                backgroundColor: 'var(--primary-color)', color: 'var(--text-pure)', borderRadius: '10px', marginBottom: '30px', height: '64px',
                position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                boxShadow: '0 4px 15px rgba(0,0,0,0.15)', transition: 'background-color 0.4s ease', WebkitTapHighlightColor: 'transparent'
              }}
            >
              <div 
                onMouseDown={handleAdminSecretStart}
                onMouseUp={handleAdminSecretEnd}
                onMouseLeave={handleAdminSecretEnd}
                onTouchStart={handleAdminSecretStart}
                onTouchEnd={handleAdminSecretEnd}
                onContextMenu={(e) => e.preventDefault()} 
                style={{
                  position: 'absolute', width: '100%', height: '100%', cursor: 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <h2 style={{ margin: 0, textAlign: 'center' }}>{weeks[currentWeek]}</h2>
              </div>
            </div>
            
            <div style={{ WebkitTapHighlightColor: 'transparent', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {days.map((day, index) => {
                const dayInfo = getDayData(day);
                const isLocked = !dayInfo || !dayInfo.isOpen;
                const isExpanded = selectedDay === day;
                const targetDate = getDateForDay(index, currentWeek);
                const dateString = `${targetDate.getDate()} / ${targetDate.getMonth() + 1}`;
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
  
  const isSpecificExam = subj.type === 'امتحان';
  let typeAndContentColor = isSpecificExam ? '#ff4444' : 'var(--text-details)';
  let eventTypeColor = isSpecificExam ? '#ff4444' : 'var(--text-details)';
  
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
      borderRight: `4px solid ${isSpecificExam ? '#ff4444' : 'var(--text-muted)'}`,
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      
      <span style={{ 
        color: eventTypeColor, 
        fontSize: '13px', 
        fontWeight: 'bold',
        display: 'flex', 
        alignItems: 'center', 
        gap: '6px' 
      }}>
        {eventType === 'محاضرة' && <LectureIcon />}
        {eventType === 'مختبر' && <LabIcon />}
        {(eventType === 'واجب' || eventType === 'تقرير') && (
            <div style={{ width: '18px', height: '18px', display: 'flex' }}><AssignmentIcon /></div>
        )}
        {eventType}
      </span>
      
      <span style={{ color: 'var(--text-pure)', fontSize: '18px', fontWeight: 'bold', marginTop: '2px' }}>
        {subjectName}
      </span>
      
      {subj.content && (
        <span style={{ 
          color: typeAndContentColor, 
          fontSize: '14px', 
          whiteSpace: 'pre-wrap', 
          marginTop: '4px', 
          lineHeight: '1.6' 
        }}>
          {subj.content}
        </span>
      )}

      {subj.imageUrl && (
        <div style={{ marginTop: '10px' }}>
          <a 
            href={subj.imageUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{ 
              display: 'inline-block', 
              backgroundColor: 'var(--primary-color)', 
              color: 'white', 
              padding: '6px 16px', 
              borderRadius: '6px', 
              textDecoration: 'none', 
              fontSize: '12px', 
              fontWeight: 'bold', 
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)' 
            }}
          >
               عرض  
          </a>
        </div>
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
                        : 'inset 0 0 3px rgba(2, 132, 199, 0.3)'),
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

      {/* ===================== قسم الملازم (من الهيدر) ===================== */}
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

      {/* ===================== قسم الواجبات والتقارير (من الهيدر) ===================== */}
      {activeTab === 'assignments' && (
        <div className="week-animate" style={{ paddingBottom: '30px' }}>
          <div style={{ WebkitTapHighlightColor: 'transparent', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {allAssignmentsList.length > 0 ? (
              allAssignmentsList.map((assign, idx) => {
                const countdown = getCountdown(assign.targetDate);
                const isExpanded = selectedSubject === `assign-${idx}`;
                
                return (
                  <div 
                    key={idx} 
                    onClick={() => setSelectedSubject(isExpanded ? null : `assign-${idx}`)} 
                    className={`day-card ${isExpanded ? 'expanded' : ''} subject-inner-card`} 
                    style={{ 
                      backgroundColor: 'var(--card-bg-locked)', 
                      borderRadius: '12px', 
                      display: 'flex', 
                      flexDirection: 'column',
                      borderRight: `4px solid ${countdown.color}`,
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      cursor: 'pointer',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
                      <span style={{ color: 'var(--text-pure)', fontWeight: 'bold', fontSize: '17px' }}>
                        {assign.type} {assign.name}
                      </span>
                      <span style={{ 
                        color: countdown.color, 
                        fontSize: '12px', 
                        fontWeight: 'bold', 
                        padding: '4px 10px', 
                        backgroundColor: `${countdown.color}1a`, 
                        borderRadius: '6px',
                        border: `1px solid ${countdown.color}4d`,
                        whiteSpace: 'nowrap'
                      }}>
                        {countdown.text}
                      </span>
                    </div>
                    
                    <div style={{ maxHeight: isExpanded ? '2000px' : '0px', opacity: isExpanded ? 1 : 0, transition: isExpanded ? 'max-height 1.3s ease, opacity 0.7s ease' : 'all 0.5s ease', overflow: 'hidden' }}>
                      <div style={{ padding: '0 16px 16px 16px' }}>
                        <div style={{ color: 'var(--text-pure)', fontSize: '16px', whiteSpace: 'pre-wrap', lineHeight: '1.6', borderTop: '1px dashed var(--border-line)', paddingTop: '10px' }}>
                          {assign.content || 'لا توجد تفاصيل.'}
                          {assign.imageUrl && (
                            <div style={{ marginTop: '15px', borderTop: '1px dashed var(--border-line)', paddingTop: '15px', textAlign: 'center' }}>
                              <img 
                                src={assign.imageUrl} 
                                alt="المرفق" 
                                style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '8px', cursor: 'pointer', marginBottom: '10px' }} 
                                onClick={(e) => { e.stopPropagation(); window.open(assign.imageUrl, '_blank'); }}
                                onError={(e) => e.target.style.display = 'none'} 
                              />
                              <a 
                                href={assign.imageUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                style={{ 
                                  display: 'inline-block', backgroundColor: 'var(--primary-color)', color: 'white', padding: '8px 20px', borderRadius: '6px', textDecoration: 'none', fontSize: '13px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' 
                                }}
                              >
                               عرض
                              </a>
                            </div>
                          )}
                        </div>
                        <p> </p>
                         <div style={{ marginBottom: '8px', color: 'var(--text-details)', fontWeight: 'bold', fontSize: '12px' }}>
                           تاريخ التسليم: {assign.dayStr} ({assign.targetDate.getDate()} / {assign.targetDate.getMonth() + 1})
                          </div>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div style={{ backgroundColor: 'var(--card-bg-normal)', borderRadius: '12px', padding: '30px 20px', textAlign: 'center', borderLeft: '5px solid var(--dot-bg)' }}>
                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '15px', fontWeight: 'bold' }}>لا توجد واجبات أو تقارير نشطة حالياً.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== 🌟 قسم الثيمات الجديد 🌟 ===================== */}
      {activeTab === 'themes' && (
        <div className="week-animate" style={{ paddingBottom: '30px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {themeCards.map((t) => {
              const isActive = theme === t.id || theme === `${t.id}-light` || (theme === 'hearts-dark' && t.id === 'hearts');
              return (
                <div 
                  key={t.id} 
                  onClick={() => setTheme(t.id)} 
                  className="day-card schedule-day-box"
                  style={{
                    cursor: 'pointer',
                    backgroundColor: isActive ? 'var(--card-bg-expanded)' : 'var(--card-bg-normal)',
                    borderLeft: `5px solid ${t.color}`,
                    boxShadow: isActive ? `0 0 10px ${t.color}40` : 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '24px' }}>{t.icon}</span>
                      <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-pure)' }}>{t.name}</h3>
                    </div>
                    {isActive && (
                      <span style={{ color: t.color, fontWeight: 'bold', fontSize: '14px', backgroundColor: `${t.color}20`, padding: '4px 10px', borderRadius: '8px' }}>
                        ✓ مفعل
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ===================== 🌟 قسم الملف الشخصي الجديد 🌟 ===================== */}
      {activeTab === 'profile' && (
        <div className="week-animate" style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '30px' }}>
          {!user ? (
            <div className="day-card" style={{ backgroundColor: 'var(--card-bg-normal)', padding: '40px 20px', textAlign: 'center', borderRadius: '15px', border: '1px solid var(--border-line)' }}>
              <div style={{ width: '80px', height: '80px', backgroundColor: 'var(--card-bg-locked)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '1px solid var(--border-line)' }}>
                <span style={{ fontSize: '40px' }}>👤</span>
              </div>
              <h2 style={{ color: 'var(--text-pure)', marginBottom: '10px' }}>حساب الطالب</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '30px', fontSize: '14px', lineHeight: '1.6' }}>
                سجل دخولك الآن لإنشاء ملفك الشخصي والوصول إلى ميزات إضافية كالملاحظات المشفرة.
              </p>
              
              <button 
                onClick={() => navigate('/login')}
                style={{ 
                  backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px 20px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: '280px', margin: '0 auto', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', transition: 'transform 0.2s', WebkitTapHighlightColor: 'transparent'
                }}
                onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
                onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
              >
                تسجيل الدخول للمتابعة
              </button>
            </div>
          ) : (
            <div className="day-card" style={{ backgroundColor: 'var(--card-bg-normal)', padding: '30px 20px', borderRadius: '15px', border: '1px solid var(--border-line)' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
                     {user.displayName ? user.displayName[0].toUpperCase() : '👤'}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                     <h3 style={{ margin: 0, color: 'var(--text-pure)', fontSize: '20px' }}>{user.displayName || 'طالب'}</h3>
                     <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{user.email}</span>
                  </div>
               </div>
               
               <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
                  <div style={{ flex: 1, backgroundColor: 'var(--card-bg-locked)', padding: '15px', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-line)' }}>
                     <span style={{ display: 'block', color: 'var(--primary-color)', fontSize: '22px', fontWeight: 'bold' }}>0</span>
                     <span style={{ color: 'var(--text-details)', fontSize: '12px' }}>ملاحظات</span>
                  </div>
                  <div style={{ flex: 1, backgroundColor: 'var(--card-bg-locked)', padding: '15px', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-line)' }}>
                     <span style={{ display: 'block', color: 'var(--primary-color)', fontSize: '22px', fontWeight: 'bold' }}>0</span>
                     <span style={{ color: 'var(--text-details)', fontSize: '12px' }}>مهام منجزة</span>
                  </div>
               </div>

               <button 
                 onClick={handleLogout}
                 style={{ 
                   backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '12px', padding: '12px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', width: '100%', transition: 'background-color 0.2s', WebkitTapHighlightColor: 'transparent'
                 }}
                 onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(239,68,68,0.1)'}
                 onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
               >
                 تسجيل الخروج
               </button>
            </div>
          )}
        </div>
      )}

      {/* ===================== قسم الإعدادات (مسودة) ===================== */}
      {activeTab === 'settings' && (
        <div className="week-animate" style={{ padding: '30px 20px', textAlign: 'center', backgroundColor: 'var(--card-bg-normal)', borderRadius: '15px', border: '1px solid var(--border-line)', marginTop: '20px' }}>
          <h2 style={{ color: 'var(--text-pure)', marginBottom: '10px' }}>الإعدادات</h2>
          <p style={{ color: 'var(--text-muted)' }}>سيتم إضافة خيارات (تغيير اللغة، اختيار القسم والمرحلة، الجداول السابقة) قريباً...</p>
        </div>
      )}

      {/* 🌟 شريط التنقل السفلي العائم 🌟 */}
      <div style={{
        position: 'fixed',
        bottom: showBottomNav ? '20px' : '-100px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 30px)',
        maxWidth: '400px',
        backgroundColor: 'var(--card-bg-locked)',
        border: '1px solid var(--border-line)',
        borderRadius: '24px',
        padding: '10px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
        transition: 'bottom 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        zIndex: 1000,
        backdropFilter: 'blur(15px)',
        WebkitTapHighlightColor: 'transparent'
      }}>
        {[
          { id: 'schedule', icon: <ScheduleIcon /> },
          { id: 'themes', icon: <ThemeIcon /> },
          { id: 'profile', icon: <ProfileIcon /> },
          { id: 'settings', icon: <SettingsIcon /> }
        ].map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (item.id === 'schedule') setSelectedDay(null);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: isActive ? 'var(--primary-color)' : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px',
                transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transform: isActive ? 'scale(1.15) translateY(-2px)' : 'scale(1) translateY(0)',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <div style={{ 
                width: '26px', 
                height: '26px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                filter: isActive ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' : 'none'
              }}>
                 {item.icon}
              </div>
              {isActive && (
                <div style={{
                  width: '4px', height: '4px', backgroundColor: 'var(--primary-color)',
                  borderRadius: '50%', marginTop: '4px',
                  boxShadow: '0 0 5px var(--primary-color)'
                }}></div>
              )}
            </button>
          )
        })}
      </div>

      <ExamScheduleStudent/>  

    </div>
  )
}
export default StudentView
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from '../Header';
import ExamScheduleStudent from '../ExamScheduleStudent';
import Settings from '../Settings';
import Profile from '../Profile';
import { database, auth } from '../firebase';
import { ref, onValue, set, get, update} from 'firebase/database';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import localforage from 'localforage'; 
import { currentAvailableSubjects } from './ScheduleData/CurrentSubjects';
import { COURSE_SETTINGS, courseSubjectsList } from './ScheduleData/CourseConfig';

// --- استيراد الملفات الجديدة التي قمنا بفصلها ---
import DayCard from './DayCard';
import MaterialsTab from './MaterialsTab';
import AssignmentsTab from './AssignmentsTab';
import ThemesTab from './ThemesTab';
import BottomNav from './BottomNav';

function StudentView() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  // 🌟 حالات الصلاحيات والكروبات 🌟
  const [userRole, setUserRole] = useState(null); 
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [activeGroup, setActiveGroup] = useState(localStorage.getItem('app-active-group') || 'A');

  // 🌟 حفظ الكروب المختار في المتصفح 🌟
  useEffect(() => {
    localStorage.setItem('app-active-group', activeGroup);
  }, [activeGroup]);

  // توليد الأسابيع تلقائياً بناءً على إعدادات الكورس
const weeks = Array.from({ length: COURSE_SETTINGS.totalWeeks }, (_, i) => {
  const weekNames = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس", "السابع", "الثامن", "التاسع", "العاشر", "الحادي عشر", "الثاني عشر", "الثالث عشر", "الرابع عشر", "الخامس عشر"];
  return `الأسبوع ${weekNames[i] || (i + 1)}`;
});

  const days = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"];
  
  const [allScheduleData, setAllScheduleData] = useState({});
  const [materialsData, setMaterialsData] = useState({}); 
  const [archivesList, setArchivesList] = useState([]); 
  const [selectedArchive, setSelectedArchive] = useState(null); 
  const [archiveData, setArchiveData] = useState(null); 
  const [loading, setLoading] = useState(true);
  
  const [currentWeek, setCurrentWeek] = useState(0); 
  const [selectedDay, setSelectedDay] = useState(null);
  
  const [activeTab, setActiveTab] = useState('schedule');
  const [selectedSubject, setSelectedSubject] = useState(null);

  const [hoveredWeek, setHoveredWeek] = useState(null);
  const [forceRender, setForceRender] = useState(0); 
  
  const [heartBursts, setHeartBursts] = useState([]);
  const [bubbleBursts, setBubbleBursts] = useState([]);

  const [theme, setTheme] = useState(localStorage.getItem('app-theme') || 'ocean');

  const adminPressTimer = useRef(null);
  const [isLongPressActive, setIsLongPressActive] = useState(false);

  const [isNavVisible, setIsNavVisible] = useState(true);
  const lastScrollY = useRef(0);

  const [userAttendance, setUserAttendance] = useState({});
  const [activeAttendanceMenu, setActiveAttendanceMenu] = useState(null);
  const attendanceTimer = useRef(null);
  const isEventLongPress = useRef(false);
  const [studentToast, setStudentToast] = useState({ show: false, message: '', type: '' });

  const themeCards = [
    { id: 'ocean', name: 'المحيط (Ocean)', color: '#0094f7' },
    { id: 'twilight', name: 'الشفق (Twilight)', color: '#9333ea' },
    { id: 'hearts', name: 'القلوب (Hearts)', color: '#f43f5e' },
    { id: 'coffee', name: 'القهوة (Coffee)', color: '#d28c47' },
    { id: 'glass', name: 'الزجاج (Glass)', color: '#a8b2c1',  },
    { id: 'matrix', name: 'المصفوفة (Matrix)', color: '#00ff41' },
    { id: 'fox', name: 'الثعلب (Fox)', color: '#ff8c00' },
  ];

  const activeScheduleData = selectedArchive && archiveData ? archiveData : allScheduleData;
  const activeMaterialsData = selectedArchive && archiveData && archiveData.materials ? archiveData.materials : materialsData;

  const showToast = (message, type = 'default') => {
    setStudentToast({ show: true, message, type });
    setTimeout(() => setStudentToast({ show: false, message: '', type: '' }), 3000);
  };

  useEffect(() => {
    if (localStorage.getItem('app-bg-anim') === 'false') {
      document.documentElement.classList.add('disable-bg-anim');
    } else {
      document.documentElement.classList.remove('disable-bg-anim');
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setIsNavVisible(false);
      } else {
        setIsNavVisible(true);
      }
      lastScrollY.current = currentScrollY;
      
      if (activeAttendanceMenu !== null) setActiveAttendanceMenu(null);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeAttendanceMenu]);

  // 🌟 جلب الصلاحيات والحضور 🌟
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const attRef = ref(database, `users/${currentUser.uid}/attendance`);
        onValue(attRef, (snapshot) => {
          if (snapshot.exists()) {
            setUserAttendance(snapshot.val());
          } else {
            setUserAttendance({});
          }
        });

        // جلب صلاحية الأدمن
        const roleRef = ref(database, `admins/${currentUser.uid}/role`);
        onValue(roleRef, (snapshot) => {
          if (snapshot.exists()) {
            setUserRole(snapshot.val()); // 'super_admin' أو 'admin_a'
          } else {
            setUserRole('student');
            setIsAdminMode(false);
          }
        });
      } else {
        setUserAttendance({});
        setUserRole(null);
        setIsAdminMode(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      showToast("تم تسجيل الخروج بنجاح", "success");
    } catch (error) {
      console.error("خطأ في تسجيل الخروج:", error);
      showToast("حدث خطأ أثناء تسجيل الخروج", "error");
    }
  };

  const handleArchiveCurrentYear = async () => {
    const yearName = window.prompt("أدخل اسم السنة أو الفصل للأرشيف (مثال: 2024-الفصل الأول):");
    if (!yearName) return;
    if (!window.confirm(`سيتم نقل الجدول والملازم إلى أرشيف "${yearName}" وتصفيرها. متأكد؟`)) return;

    try {
      const snapshot = await get(ref(database, '/'));
      const currentData = snapshot.val();
      
      const archivePayload = { materials: currentData.materials || {} };
      for (let i = 0; i <= 14; i++) {
        if (currentData[`week_${i}`]) archivePayload[`week_${i}`] = currentData[`week_${i}`];
      }

      await set(ref(database, `archives/${yearName}`), archivePayload);

      const updatesToClear = { materials: null };
      for (let i = 0; i <= 14; i++) updatesToClear[`week_${i}`] = null;
      await update(ref(database, '/'), updatesToClear);

      showToast("✅ تمت الأرشفة بنجاح وتم تصفير الجدول!", "success");
    } catch (error) { showToast("❌ حدث خطأ", "error"); }
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      if (theme === 'light' || theme === 'hearts') metaThemeColor.setAttribute('content', '#f5f7fa');
      else if (theme === 'coffee-light') metaThemeColor.setAttribute('content', '#f5ece5');
      else if (theme === 'ocean-light') metaThemeColor.setAttribute('content', '#e0f2fe');
      else if (theme === 'twilight-light') metaThemeColor.setAttribute('content', '#f3e8ff');
      else if (theme === 'fox') metaThemeColor.setAttribute('content', '#5Dadec');
      else if (theme === 'ocean') metaThemeColor.setAttribute('content', '#0f2027');
      else if (theme === 'twilight') metaThemeColor.setAttribute('content', '#170f23');
      else metaThemeColor.setAttribute('content', '#141414');
    }
  }, [theme]);
  
  const handleThemeCardClick = (baseId) => {
    const isLightMode = theme.includes('-light') || theme === 'light' || theme === 'hearts';
    let finalTheme = baseId;
    if (baseId === 'hearts') {
      finalTheme = isLightMode ? 'hearts' : 'hearts-dark';
    } 
    else if (['ocean', 'twilight', 'coffee'].includes(baseId)) {
      finalTheme = isLightMode ? `${baseId}-light` : baseId;
    }
    setTheme(finalTheme);
  };

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

  const handleEventPressStart = (eventId) => {
    if (!user || selectedArchive !== null) return; 
    isEventLongPress.current = false;
    attendanceTimer.current = setTimeout(() => {
      isEventLongPress.current = true;
      setActiveAttendanceMenu(eventId);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500); 
  };

  const handleEventPressEnd = () => {
    if (attendanceTimer.current) clearTimeout(attendanceTimer.current);
  };

  const handleEventClick = (e, day, isLocked) => {
    if (!isEventLongPress.current) {
      toggleDay(day, isLocked, e);
    } else {
      e.stopPropagation();
      e.preventDefault();
      isEventLongPress.current = false; 
    }
  };

  const markAttendance = async (weekIdx, dayName, subjectIdx, status) => {
    if (!user) return showToast("يجب تسجيل الدخول لاستخدام هذه الميزة!", "error");
    if (selectedArchive !== null) return; 

    try {
      const dbRef = ref(database, `users/${user.uid}/attendance/week_${weekIdx}/${dayName}/${subjectIdx}`);
      await set(dbRef, status);
      setActiveAttendanceMenu(null);
      if (navigator.vibrate) navigator.vibrate(50);
    } catch (error) {
      showToast("حدث خطأ أثناء الحفظ", "error");
    }
  };

  const handleBulkAttendance = async (weekIdx, dayName, dayInfo, actionType) => {
    if (!user) return showToast("يجب تسجيل الدخول!", "error");
    if (selectedArchive !== null) return;
    if (!dayInfo || !dayInfo.subjects) return;

    const updates = {};
    dayInfo.subjects.forEach((subj, idx) => {
      const currentStatus = userAttendance[`week_${weekIdx}`]?.[dayName]?.[idx];
      
      if (actionType === 'all_present' || actionType === 'all_absent') {
        updates[idx] = actionType === 'all_present' ? 'present' : 'absent';
      } else if (actionType === 'rest_present' || actionType === 'rest_absent') {
        if (!currentStatus) {
          updates[idx] = actionType === 'rest_present' ? 'present' : 'absent';
        } else {
           updates[idx] = currentStatus; 
        }
      }
    });

    try {
      const dbRef = ref(database, `users/${user.uid}/attendance/week_${weekIdx}/${dayName}`);
      await set(dbRef, updates);
      if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
    } catch (error) {
      showToast("حدث خطأ في التسجيل الكلي", "error");
    }
  };

  const getStudentStats = () => {
    let present = 0;
    let absent = 0;
    if (!userAttendance || typeof userAttendance !== 'object') {
      return { present, absent };
    }
    try {
      Object.values(userAttendance).forEach(weekData => {
        if (weekData && typeof weekData === 'object') {
          Object.values(weekData).forEach(dayData => {
            if (dayData && typeof dayData === 'object') {
              Object.values(dayData).forEach(status => {
                if (status === 'present') present++;
                if (status === 'absent') absent++;
              });
            }
          });
        }
      });
    } catch (error) { console.error("Error calculating stats:", error); }
    return { present, absent };
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

    const archivesRef = ref(database, 'archives');
    onValue(archivesRef, (snapshot) => {
       if (snapshot.exists()) {
           setArchivesList(Object.keys(snapshot.val()));
       } else {
           setArchivesList([]);
       }
    });

    const calculateCurrentWeek = () => {
   const calculationStartDate = new Date(COURSE_SETTINGS.startDate);
   calculationStartDate.setHours(12, 0, 0, 0);
   const today = new Date();
   today.setHours(12, 0, 0, 0);
   const diffTime = today.getTime() - calculationStartDate.getTime();
   const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
   let calculatedWeek = Math.floor(diffDays / 7);
   if (calculatedWeek < 0) calculatedWeek = 0;
   if (calculatedWeek >= COURSE_SETTINGS.totalWeeks) calculatedWeek = COURSE_SETTINGS.totalWeeks - 1;
   setCurrentWeek(calculatedWeek);
 };

    calculateCurrentWeek();
  }, []);

  useEffect(() => {
    if (selectedArchive) {
       setLoading(true);
       const specificArchiveRef = ref(database, `archives/${selectedArchive}`);
       onValue(specificArchiveRef, (snapshot) => {
           if (snapshot.exists()) { setArchiveData(snapshot.val()); } 
           else { setArchiveData(null); }
           setLoading(false);
       });
    } else {
       setArchiveData(null);
    }
  }, [selectedArchive]);

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
                registration.showNotification(data.title, { body: data.body, icon: '/pwa-192x192.png', dir: 'rtl', vibrate: [200, 100, 200] });
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
    return activeScheduleData[weekKey] && activeScheduleData[weekKey][dayName] ? activeScheduleData[weekKey][dayName] : null;
  }

  const hasNewUpdate = (day) => {
    if (activeTab === 'materials' || activeTab === 'assignments' || activeTab === 'themes' || activeTab === 'profile' || activeTab === 'settings') return false; 
    if (selectedArchive !== null) return false; 
    const dayData = getDayDataHelper(currentWeek, day);
    if (!dayData || !dayData.lastUpdated) return false;
    const storageKey = `seen_week_${currentWeek}_day_${day}`;
    const lastSeenTime = localStorage.getItem(storageKey);
    if (!lastSeenTime) return true;
    return dayData.lastUpdated > parseInt(lastSeenTime);
  };

  const triggerThemeBurst = useCallback((weekIndexToBurst, e = null) => {
    if (localStorage.getItem('app-interactive-anim') === 'false') return;
    const isOceanTheme = theme === 'ocean' || theme === 'ocean-light';
    if (isOceanTheme) {
      const dotElement = document.getElementById(`dot-${weekIndexToBurst}`);
      if (dotElement) {
        let burstX, burstY;
        let zoomFactor = 1;
        const container = document.querySelector('.main-container');
        if (container) {
          const computedZoom = window.getComputedStyle(container).zoom;
          if (computedZoom && computedZoom !== 'normal') zoomFactor = parseFloat(computedZoom);
        }
        if (e && e.touches && e.touches.length > 0) {
          burstX = e.touches[0].clientX; burstY = e.touches[0].clientY;
        } else if (e && e.clientX && e.clientY) {
           burstX = e.clientX; burstY = e.clientY;
        } else {
          const rect = dotElement.getBoundingClientRect();
          burstX = rect.left + (rect.width / 2); burstY = rect.top + (rect.height / 2);
        }
        burstX = burstX / zoomFactor; burstY = burstY / zoomFactor;
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
        triggerThemeBurst(currentWeek); setSelectedDay(null); setCurrentWeek((prev) => (prev < weeks.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowRight') {
        triggerThemeBurst(currentWeek); setSelectedDay(null); setCurrentWeek((prev) => (prev > 0 ? prev - 1 : weeks.length - 1));
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault(); 
        const currentIndex = days.indexOf(selectedDay);
        if (selectedDay === null) setSelectedDay(days[0]);
        else if (currentIndex < days.length - 1) setSelectedDay(days[currentIndex + 1]);
      } else if (e.key === 'ArrowUp') {
          const currentIndex = days.indexOf(selectedDay);
          if (currentIndex > 0) setSelectedDay(days[currentIndex - 1]);
          else if (currentIndex === 0) setSelectedDay(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDay, weeks.length, activeTab, currentWeek, triggerThemeBurst]); 

  const nextWeek = () => { 
    triggerThemeBurst(currentWeek); setSelectedDay(null);
    if (currentWeek < weeks.length - 1) setCurrentWeek(currentWeek + 1); else setCurrentWeek(0);
  }
  const prevWeek = () => { 
    triggerThemeBurst(currentWeek); setSelectedDay(null);
    if (currentWeek > 0) setCurrentWeek(currentWeek - 1); else setCurrentWeek(weeks.length - 1);
  }

  const toggleDay = (day, isLocked, e) => { 
    if (isLocked) return; 
    if (selectedDay !== day) {
        const storageKey = `seen_week_${currentWeek}_day_${day}`;
        localStorage.setItem(storageKey, Date.now().toString());
        setForceRender(prev => prev + 1); 

        const isHeartsTheme = theme.startsWith('hearts');
        if (isHeartsTheme && e && localStorage.getItem('app-interactive-anim') !== 'false') {
          let clientX = e.clientX; let clientY = e.clientY;
          if (clientX === undefined && e.changedTouches && e.changedTouches.length > 0) {
            clientX = e.changedTouches[0].clientX; clientY = e.changedTouches[0].clientY;
          }
          if (clientX !== undefined && clientY !== undefined) {
            const newBurst = { id: Date.now() + Math.random(), x: clientX, y: clientY };
            setHeartBursts(prev => [...prev, newBurst]);
            setTimeout(() => { setHeartBursts(prev => prev.filter(b => b.id !== newBurst.id)); }, 500); 
          }
        }
    }
    selectedDay === day ? setSelectedDay(null) : setSelectedDay(day); 
  }

  const getDayData = (day) => {
    const weekKey = `week_${currentWeek}`;
    return activeScheduleData[weekKey] && activeScheduleData[weekKey][day] ? activeScheduleData[weekKey][day] : null;
  }

  const getDateForDay = (dayIndex, weekIndex = currentWeek) => {
const startDate = new Date(COURSE_SETTINGS.startDate);
startDate.setDate(startDate.getDate() + (weekIndex * 7) + dayIndex);
return startDate;
}
  const allAssignmentsList = [];
  for (let w = 0; w < 15; w++) {
    const weekKey = `week_${w}`;
    if (activeScheduleData[weekKey]) {
      days.forEach((day, dIdx) => {
        const dayData = activeScheduleData[weekKey][day];
        if (dayData && Array.isArray(dayData.subjects)) {
          dayData.subjects.forEach(subj => {
            if (subj.type === "واجب" || subj.type === "تقرير") {
              const targetDate = getDateForDay(dIdx, w);
              targetDate.setHours(23, 59, 59, 999);
              const now = new Date();
              const expiryTime = targetDate.getTime() + (24 * 60 * 60 * 1000); 
              if (now.getTime() <= expiryTime) {
                allAssignmentsList.push({ ...subj, targetDate, weekStr: weeks[w], dayStr: day });
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
      </div>
    );
  }

  const getStatusColor = (isExamDay) => {
    if (isExamDay) return '#ff0000d1'; 
    if (theme === 'glass' || theme === 'matrix') return '#15ff00c7'; 
    return 'var(--primary-color)'; 
  };

  const showBottomNav = isNavVisible && selectedDay === null;
  const { present: totalPresent, absent: totalAbsent } = getStudentStats();
  const hideDetails = localStorage.getItem('app-hide-details') === 'true';

  return (
    <div className="main-container" style={{ width: '100%', maxWidth: '600px', margin: '0 auto', padding: '0 0px', paddingBottom: '100px', position: 'relative' }}>
      
      {/* 🌟 الزر العائم للأدمن 🌟 */}
      {userRole && userRole !== 'student' && activeTab === 'schedule' && selectedArchive === null && (
        <button
          onClick={() => setIsAdminMode(!isAdminMode)}
          style={{
            position: 'fixed',
            bottom: showBottomNav ? '85px' : '25px',
            right: '15px',
            zIndex: 1000,
            backgroundColor: isAdminMode ? '#ef4444' : 'var(--primary-color)',
            color: '#fff',
            border: 'none',
            borderRadius: '50px',
            padding: '12px 20px',
            fontWeight: 'bold',
            fontSize: '14px',
            boxShadow: '0 6px 15px rgba(0,0,0,0.3)',
            cursor: 'pointer',
            transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            display: 'flex', alignItems: 'center', gap: '8px',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          {isAdminMode ? 'إغلاق التعديل ✕' : 'وضع التعديل 🛠️'}
        </button>
      )}

      {userRole === 'super_admin' && activeTab === 'settings' && (
        <button
          onClick={handleArchiveCurrentYear}
          style={{ width: '100%', padding: '15px', backgroundColor: '#ff9800', color: '#fff', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer', marginTop: '15px' }}
        >
          📦 أرشفة السنة الحالية وتصفير الجدول
        </button>
      )}

      {/* 🌟 Toast Notification 🌟 */}
      <div style={{
        position: 'fixed', top: studentToast.show ? '20px' : '-100px', left: '50%', transform: 'translateX(-50%)',
        backgroundColor: studentToast.type === 'error' ? '#ef4444' : 'var(--card-bg-expanded)', color: '#fff',
        padding: '12px 24px', borderRadius: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', zIndex: 9999,
        fontWeight: 'bold', fontSize: '14px', transition: 'top 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        pointerEvents: 'none', whiteSpace: 'nowrap'
      }}>
        {studentToast.message}
      </div>

      <style>
        {`
          @keyframes flyOutBurst { 0% { transform: translate(-50%, -50%) scale(0.3); opacity: 1; } 100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(1.5) rotate(var(--rot)); opacity: 0; } }
          .flying-heart-burst { position: absolute; animation: flyOutBurst 0.5s cubic-bezier(0.1, 1, 0.2, 1) forwards; filter: drop-shadow(0 0 5px var(--primary-color)); }
          .hb-1 { --tx: -50px; --ty: -60px; --rot: -20deg; } .hb-2 { --tx: 50px; --ty: -50px; --rot: 25deg; } .hb-3 { --tx: 0px; --ty: -80px; --rot: 0deg; } .hb-4 { --tx: -70px; --ty: 10px; --rot: -40deg; } .hb-5 { --tx: 70px; --ty: 20px; --rot: 35deg; }
          @keyframes popBubble { 0% { transform: translate(-50%, -50%) scale(0.2); opacity: 1; } 100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(1.8); opacity: 0; } }
          .bubble-drop { position: absolute; border-radius: 50%; animation: popBubble 0.4s cubic-bezier(0.1, 1, 0.2, 1) forwards; }
          [data-theme='ocean'] .bubble-drop { background: rgba(255, 255, 255, 0.85); box-shadow: 0 0 6px rgba(255, 255, 255, 0.9); }
          [data-theme='ocean-light'] .bubble-drop { background: rgba(2, 132, 199, 0.85); box-shadow: 0 0 6px rgba(2, 132, 199, 0.6); }
          .bd-1 { width: 5px; height: 5px; --tx: -18px; --ty: -20px; } .bd-2 { width: 4px; height: 4px; --tx: 18px; --ty: -15px; } .bd-3 { width: 6px; height: 6px; --tx: -12px; --ty: 18px; } .bd-4 { width: 5px; height: 5px; --tx: 15px; --ty: 15px; } .bd-5 { width: 3px; height: 3px; --tx: 0px; --ty: -25px; }
          @keyframes hintFadeStatic { 0% { opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } 100% { opacity: 0; } }
          @media screen and (max-width: 400px) { .main-container { zoom: 0.89; } @-moz-document url-prefix() { .main-container { transform: scale(0.88); transform-origin: top center; width: 113% !important; } } }
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
      
      {/* 🌟 تمرير الخصائص للهيدر 🌟 */}
      <Header 
        currentTheme={theme} 
        onThemeSelect={handleThemeSelect} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        activeGroup={activeGroup}
        setActiveGroup={setActiveGroup}
        userRole={userRole}
      /> 
      
      {selectedArchive && (
         <div style={{ backgroundColor: 'rgba(255, 152, 0, 0.1)', color: '#ff9800', padding: '12px', textAlign: 'center', borderRadius: '12px', margin: '15px 15px 0 15px', fontWeight: 'bold', fontSize: '14px', border: '1px solid rgba(255, 152, 0, 0.3)' }}>
           ⚠️ أنت تتصفح أرشيف سنة ({selectedArchive}). ميزات الحضور معطلة.
         </div>
      )}

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
                onMouseDown={handleAdminSecretStart} onMouseUp={handleAdminSecretEnd} onMouseLeave={handleAdminSecretEnd}
                onTouchStart={handleAdminSecretStart} onTouchEnd={handleAdminSecretEnd} onContextMenu={(e) => e.preventDefault()} 
                style={{ position: 'absolute', width: '100%', height: '100%', cursor: 'default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
                  <DayCard 
                    key={index}
                    day={day}
                    index={index}
                    currentWeek={currentWeek}
                    dayInfo={dayInfo}
                    isLocked={isLocked}
                    isExpanded={isExpanded}
                    dateString={dateString}
                    isExam={isExam}
                    statusColor={statusColor}
                    showNotification={showNotification}
                    user={user}
                    selectedArchive={selectedArchive}
                    userAttendance={userAttendance}
                    activeAttendanceMenu={activeAttendanceMenu}
                    hideDetails={hideDetails}
                    toggleDay={toggleDay}
                    handleEventClick={handleEventClick}
                    handleEventPressStart={handleEventPressStart}
                    handleEventPressEnd={handleEventPressEnd}
                    markAttendance={markAttendance}
                    handleBulkAttendance={handleBulkAttendance}
                    showToast={showToast}
                    
                    // 🌟 تمرير الخصائص الجديدة 🌟
                    activeGroup={activeGroup}
                    isAdminMode={isAdminMode}
                    userRole={userRole}
                  />
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: '40px', paddingBottom: '20px' }}>
            <div className="dots-container nav-dots-container" onMouseLeave={() => setHoveredWeek(null)} style={{ WebkitTapHighlightColor: 'transparent', display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'nowrap', gap: theme.startsWith('hearts') ? 'clamp(1px, 0.5vw, 4px)' : 'clamp(2px, 1.5vw, 8px)', marginBottom: '20px', width: '100%' }}>
              {weeks.map((_, index) => {
                let scale = 1; let transitionDelay = '0s'; let opacity = 1; 
                if (hoveredWeek !== null) {
                  if (index === hoveredWeek) { scale = 1.6; transitionDelay = '0s'; opacity = 1; } 
                  else if (Math.abs(index - hoveredWeek) === 1) { scale = 1.25; transitionDelay = '0.05s'; opacity = 1; } 
                  else if (Math.abs(index - hoveredWeek) === 2) { scale = 1.1; transitionDelay = '0.1s'; opacity = 1; }
                } else { if (index === currentWeek) { scale = 1.5; opacity = 1; } }

                const isHeartsTheme = theme.startsWith('hearts');
                const isOceanTheme = theme === 'ocean' || theme === 'ocean-light'; 
                const size = isHeartsTheme ? '16px' : '10px'; 

                const bubbleStyle = isOceanTheme ? {
                  backgroundColor: currentWeek === index ? (theme === 'ocean-light' ? 'rgba(2, 132, 199, 0.6)' : 'rgba(255, 255, 255, 0.4)') : (theme === 'ocean-light' ? 'rgba(2, 132, 199, 0.2)' : 'rgba(255, 255, 255, 0.1)'),
                  boxShadow: currentWeek === index ? (theme === 'ocean-light' ? 'inset 0 0 5px rgba(2, 132, 199, 0.8), 0 0 8px var(--primary-color)' : 'inset 0 0 5px rgba(255,255,255,0.8), 0 0 8px var(--primary-color)') : (theme === 'ocean-light' ? 'inset 0 0 3px rgba(2, 132, 199, 0.4)' : 'inset 0 0 3px rgba(2, 132, 199, 0.3)'),
                  border: currentWeek === index ? (theme === 'ocean-light' ? '1px solid rgba(2, 132, 199, 0.8)' : '1px solid rgba(255,255,255,0.8)') : (theme === 'ocean-light' ? '1px solid rgba(2, 132, 199, 0.3)' : '1px solid rgba(255,255,255,0.2)'),
                  backdropFilter: 'blur(2px)'
                } : {};

                return (
                  <div 
                    id={`dot-${index}`} key={index} 
                    onClick={(e) => { if (currentWeek !== index) { triggerThemeBurst(currentWeek, e); setCurrentWeek(index); setSelectedDay(null); } }}
                    onMouseEnter={() => setHoveredWeek(index)} 
                    className={`dot ${currentWeek === index ? 'active' : ''}`} 
                    style={{ 
                      transform: `scale(${scale})`, willChange: 'transform', backfaceVisibility: 'hidden', 
                      transition: 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease, border 0.3s ease', transitionDelay: transitionDelay, 
                      boxShadow: isHeartsTheme ? 'none' : (isOceanTheme ? bubbleStyle.boxShadow : ''), border: isHeartsTheme ? 'none' : (isOceanTheme ? bubbleStyle.border : ''), backgroundColor: isHeartsTheme ? 'transparent' : (isOceanTheme ? bubbleStyle.backgroundColor : ''),
                      opacity: opacity, cursor: 'pointer', borderRadius: isHeartsTheme ? '0' : '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, backdropFilter: isOceanTheme ? bubbleStyle.backdropFilter : 'none'
                    }}
                  >
                    {isHeartsTheme && ( <svg width="100%" height="100%" viewBox="0 0 24 24" fill={currentWeek === index ? 'var(--dot-active)' : 'var(--dot-bg)'} style={{ transition: 'fill 0.3s ease' }}><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg> )}
                    {isOceanTheme && currentWeek === index && ( <div style={{ position: 'absolute', top: '15%', left: '15%', width: '3px', height: '3px', backgroundColor: theme === 'ocean-light' ? 'rgba(255,255,255,0.9)' : 'white', borderRadius: '50%', opacity: 0.8 }}></div> )}
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

      {/* ===================== الأقسام المفصولة ===================== */}
      {activeTab === 'materials' && (
        <MaterialsTab 
          availableSubjects={currentAvailableSubjects}
          selectedSubject={selectedSubject}
          setSelectedSubject={setSelectedSubject}
          activeMaterialsData={activeMaterialsData}
        />
      )}

      {activeTab === 'assignments' && (
        <AssignmentsTab 
          allAssignmentsList={allAssignmentsList}
          selectedSubject={selectedSubject}
          setSelectedSubject={setSelectedSubject}
        />
      )}

      {activeTab === 'themes' && (
        <ThemesTab 
          themeCards={themeCards}
          theme={theme}
          handleThemeCardClick={handleThemeCardClick}
        />
      )}

      {activeTab === 'profile' && (
        <Profile 
          user={user} 
          navigate={navigate} 
          totalPresent={totalPresent} 
          totalAbsent={totalAbsent} 
          handleLogout={handleLogout}
          userAttendance={userAttendance}
          allScheduleData={allScheduleData}
        />
      )}

      {activeTab === 'settings' && (
        <Settings 
           user={user} 
           handleLogout={handleLogout} 
           archivesList={archivesList} 
           selectedArchive={selectedArchive} 
           setSelectedArchive={setSelectedArchive} 
           showToast={showToast} 
           currentTheme={theme} 
           setTheme={setTheme} 
        />
      )}

      <BottomNav 
        showBottomNav={showBottomNav}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setSelectedDay={setSelectedDay}
      />

      <ExamScheduleStudent/>  
    </div>
  );
}

export default StudentView;
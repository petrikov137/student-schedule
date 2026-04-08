import { useState, useEffect } from 'react'
import { database } from './firebase'
import { ref, onValue, update, get, child, set } from 'firebase/database'
import Header from './Header'; 

function Admin() {
  const weeks = [
    "الأسبوع الأول", "الأسبوع الثاني", "الأسبوع الثالث", "الأسبوع الرابع", "الأسبوع الخامس",
    "الأسبوع السادس", "الأسبوع السابع", "الأسبوع الثامن", "الأسبوع التاسع", "الأسبوع العاشر",
    "الأسبوع الحادي عشر", "الأسبوع الثاني عشر", "الأسبوع الثالث عشر", "الأسبوع الرابع عشر", "الأسبوع الخامس عشر"
  ];
  const days = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"];
  
  const materialsSubjects = [
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

  const scheduleSubjects = [
    "البرمجة الكائنية", 
    "هياكل البيانات 2", 
    "هندسة البرمجيات",
    "قواعد بيانات موزعة", 
    "معمارية الحاسوب", 
    "اللغة الانكليزية",
  ];
  
  const eventTypes = ["محاضرة", "مختبر", "امتحان", "أُخرى"];

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [newPassword, setNewPassword] = useState(""); 

  const [allScheduleData, setAllScheduleData] = useState({});
  const [materialsData, setMaterialsData] = useState({}); 
  const [loading, setLoading] = useState(true);
  
  const [currentWeek, setCurrentWeek] = useState(0);
  const [selectedDay, setSelectedDay] = useState(null);
  const [hoveredWeek, setHoveredWeek] = useState(null);

  const [subjectsList, setSubjectsList] = useState([]);
  const [isDayOpen, setIsDayOpen] = useState(false);
  const [isExam, setIsExam] = useState(false);

  const [activeTab, setActiveTab] = useState('schedule'); 
  const [selectedSubject, setSelectedSubject] = useState(null); 
  
  const [matTitle, setMatTitle] = useState("");
  const [matLink, setMatLink] = useState("");

  const [toast, setToast] = useState({ show: false, message: '' });
  
  const [showScrollTop, setShowScrollTop] = useState(false);

  // 🌟 حالات الإشعار المخصص 🌟
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');

  const showNotification = (msg) => {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: '' }), 3000); 
  };

  const [theme, setTheme] = useState(localStorage.getItem('app-theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const handleThemeSelect = (selectedTheme, e) => {
    if (e) e.stopPropagation();
    setTheme(selectedTheme);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const dataRef = ref(database, '/');
    onValue(dataRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setAllScheduleData(data);
        setMaterialsData(data.materials || {}); 
        if (data.materials) setMaterialsData(data.materials);
      }
      setLoading(false);
    });

    const calculateCurrentWeek = () => {
      const calculationStartDate = new Date(2026, 0, 30);
      calculationStartDate.setHours(12, 0, 0, 0);
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      const diffTime = today.getTime() - calculationStartDate.getTime();
      let calculatedWeek = Math.floor(Math.round(diffTime / (1000 * 60 * 60 * 24)) / 7);
      if (calculatedWeek < 0) calculatedWeek = 0;
      if (calculatedWeek > 14) calculatedWeek = 14;
      setCurrentWeek(calculatedWeek);
    };
    calculateCurrentWeek();
  }, []);

  const checkPassword = async () => {
    if (!passwordInput.trim()) return showNotification("⚠️ الرجاء إدخال الرمز!");
    const dbRef = ref(database);
    try {
      const snapshot = await get(child(dbRef, 'admin_password'));
      if (snapshot.exists()) {
        if (passwordInput === snapshot.val().toString()) setIsAuthenticated(true);
        else showNotification("❌ كلمة المرور غير صحيحة!");
      } else showNotification("⚠️ لم يتم تعيين كلمة مرور في القاعدة!");
    } catch (error) { showNotification("❌ حدث خطأ في الاتصال"); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      checkPassword();
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 3) return showNotification("كلمة المرور قصيرة جداً!");
    try {
      await update(ref(database, '/'), { admin_password: newPassword });
      showNotification("✅ تم تغيير كلمة المرور بنجاح!");
      setNewPassword("");
    } catch (error) { showNotification("فشل التغيير: " + error.message); }
  };

  // 🌟 دالة إرسال الإشعار المنبثق الحقيقي (تعمل والتطبيق مغلق) عبر سيرفر Vercel 🌟
  const sendRealPushNotification = async (title, body) => {
    try {
      // 1. جلب توكنات الأجهزة المشتركة
      const tokensSnapshot = await get(ref(database, 'fcmTokens'));
      if (!tokensSnapshot.exists()) {
        console.log("لا يوجد أجهزة مشتركة");
        return;
      }
      
      const tokens = Object.keys(tokensSnapshot.val());

      // 2. إرسال الطلب إلى سيرفر Vercel الخاص بك
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, body, tokens })
      });
      
      const result = await response.json();
      if (result.success) {
        console.log('تم إرسال الإشعار الحقيقي بنجاح عبر السيرفر');
      } else {
        console.error('فشل الإرسال من السيرفر:', result.error);
      }
    } catch (error) {
      console.error('خطأ في إرسال الإشعار:', error);
    }
  };

  // 🌟 دالة إرسال الإشعار المخصص 🌟
  const sendCustomNotification = async () => {
    if (!notifTitle.trim() || !notifBody.trim()) return showNotification("⚠️ الرجاء كتابة عنوان وتفاصيل الإشعار!");
    try {
      // إرسال الإشعار الحقيقي للأجهزة المغلقة
      await sendRealPushNotification(notifTitle, notifBody);

      // التحديث القديم للقاعدة (للأجهزة التي تفتح التطبيق حالياً)
      await update(ref(database, '/'), {
        latest_notification: {
          title: notifTitle,
          body: notifBody,
          timestamp: Date.now()
        }
      });
      showNotification("✅ تم إرسال الإشعار لجميع الطلاب المتاحين!");
      setNotifTitle('');
      setNotifBody('');
    } catch (error) { showNotification("❌ فشل إرسال الإشعار"); }
  };

  const nextWeek = () => { setSelectedDay(null); setCurrentWeek(prev => prev < weeks.length - 1 ? prev + 1 : 0); }
  const prevWeek = () => { setSelectedDay(null); setCurrentWeek(prev => prev > 0 ? prev - 1 : weeks.length - 1); }

  const toggleDay = (day) => {
    if (selectedDay === day) { setSelectedDay(null); } 
    else {
      setSelectedDay(day);
      const currentData = allScheduleData[`week_${currentWeek}`]?.[day];
      if (currentData && Array.isArray(currentData.subjects)) setSubjectsList(currentData.subjects);
      else if (currentData && currentData.subjects) setSubjectsList([{ type: "محاضرة", name: scheduleSubjects[0], content: currentData.subjects }]);
      else setSubjectsList([]);
      setIsDayOpen(currentData?.isOpen === true);
      setIsExam(currentData?.isExam === true);
    }
  }

  const getDateForDay = (dayIndex) => {
    const startDate = new Date(2026, 1, 1); 
    startDate.setDate(startDate.getDate() + (currentWeek * 7) + dayIndex);
    return `${startDate.getDate()} / ${startDate.getMonth() + 1}`;
  }

  const addSubject = () => setSubjectsList([{ type: "محاضرة", name: scheduleSubjects[0], content: "" }, ...subjectsList]); 
  const updateSubject = (index, field, value) => { const newList = [...subjectsList]; newList[index][field] = value; setSubjectsList(newList); };
  const removeSubject = (index) => setSubjectsList(subjectsList.filter((_, i) => i !== index));
  const handleTextareaResize = (e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; };

  const handleSave = async () => {
    if (subjectsList.some(sub => sub.name.trim() === "")) return showNotification("⚠️ يرجى اختيار اسم المادة لجميع الحقول!");
    try {
      await update(ref(database, `week_${currentWeek}/${selectedDay}`), { subjects: subjectsList, isOpen: isDayOpen === true, isExam: isExam === true, lastUpdated: Date.now() });
      
      const title = "تحديث في الجدول 📅";
      const body = `تم تحديث بيانات يوم ${selectedDay} في ${weeks[currentWeek]}`;

      // إرسال الإشعار الحقيقي للأجهزة المغلقة
      await sendRealPushNotification(title, body);

      // 🌟 إرسال إشعار تلقائي للطلاب بتحديث الجدول 🌟
      await update(ref(database, '/'), {
        latest_notification: {
          title: title,
          body: body,
          timestamp: Date.now()
        }
      });

      showNotification("✅ تم حفظ التغييرات وإرسال إشعار");
    } catch (error) { showNotification("❌ حدث خطأ أثناء الحفظ"); }
  }

  const handleAddMaterial = async (subjectName) => {
    if (!matTitle.trim() || !matLink.trim()) return showNotification("⚠️ الرجاء كتابة اسم الملزمة ورابطها!");
    
    const subjectMaterialsRaw = materialsData[subjectName];
    const currentSubjectMaterials = Array.isArray(subjectMaterialsRaw) 
      ? subjectMaterialsRaw.filter(Boolean) 
      : Object.values(subjectMaterialsRaw || {}).filter(Boolean);
      
    const newMaterial = { title: matTitle, link: matLink, date: new Date().toLocaleDateString('ar-IQ') };
    const updatedMaterials = [...currentSubjectMaterials, newMaterial];

    try {
      await set(ref(database, `materials/${subjectName}`), updatedMaterials);
      showNotification("✅ تمت الإضافة بنجاح!");
      setMatTitle(""); setMatLink(""); 
    } catch (error) { showNotification("❌ حدث خطأ أثناء الإضافة"); }
  };

  const handleDeleteMaterial = async (subjectName, materialIndex) => {
    const confirmDelete = window.confirm("هل أنت متأكد من حذف هذه الملزمة؟");
    if (!confirmDelete) return;

    const subjectMaterialsRaw = materialsData[subjectName];
    const currentSubjectMaterials = Array.isArray(subjectMaterialsRaw) 
      ? subjectMaterialsRaw.filter(Boolean) 
      : Object.values(subjectMaterialsRaw || {}).filter(Boolean);

    const updatedMaterials = currentSubjectMaterials.filter((_, idx) => idx !== materialIndex);

    try {
      await set(ref(database, `materials/${subjectName}`), updatedMaterials);
      showNotification("🗑️ تم حذف الملزمة");
    } catch (error) { showNotification("❌ حدث خطأ أثناء الحذف"); }
  };

  const ToggleSwitch = ({ label, isChecked, onChange, activeColor }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: 'var(--card-bg-locked)', borderRadius: '8px', border: '1px solid var(--border-line)', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }} onClick={onChange}>
      <span style={{ color: 'var(--text-pure)', fontWeight: 'bold', fontSize: '15px' }}>{label}</span>
      <div style={{ width: '46px', height: '24px', backgroundColor: isChecked ? activeColor : 'var(--dot-bg)', borderRadius: '15px', position: 'relative', transition: 'background-color 0.3s' }}>
        <div style={{ width: '18px', height: '18px', backgroundColor: 'white', borderRadius: '50%', position: 'absolute', top: '3px', left: isChecked ? '25px' : '3px', transition: 'left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
      </div>
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        
        <div style={{ position: 'fixed', top: toast.show ? '20px' : '-100px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'var(--card-bg-locked)', color: 'var(--text-pure)', padding: '12px 24px', borderRadius: '30px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', border: '1px solid var(--border-line)', transition: 'top 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', zIndex: 1000, fontWeight: 'bold', fontSize: '14px' }}>
          {toast.message}
        </div>

        <div style={{ 
          backgroundColor: 'var(--card-bg-normal)', 
          padding: '40px 30px', 
          borderRadius: '20px', 
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)', 
          border: '1px solid var(--border-line)',
          width: '100%', 
          maxWidth: '350px',
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          gap: '20px',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ width: '60px', height: '60px', backgroundColor: 'var(--primary-color)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px', boxShadow: '0 0 15px var(--primary-color)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#fff" style={{ width: '32px', height: '32px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          
          <h2 style={{ margin: 0, color: 'var(--text-pure)', fontSize: '22px' }}>بوابة المشرفين</h2>
          <p style={{ margin: '-10px 0 10px 0', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>الرجاء إدخال رمز المرور للوصول إلى لوحة التحكم</p>

          <input 
            type="password" 
            placeholder="••••••••" 
            value={passwordInput} 
            onChange={(e) => setPasswordInput(e.target.value)} 
            onKeyDown={handleKeyDown} 
            style={{ 
              width: '100%', 
              padding: '15px', 
              borderRadius: '12px', 
              border: '1px solid var(--border-line)', 
              backgroundColor: 'var(--card-bg-locked)', 
              color: 'var(--text-pure)',
              textAlign: 'center',
              fontSize: '18px',
              letterSpacing: '5px',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.3s'
            }} 
            onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border-line)'}
          />
          
          <button 
            onClick={checkPassword} 
            style={{ 
              width: '100%', 
              backgroundColor: 'var(--primary-color)', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '12px', 
              padding: '15px', 
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 15px rgba(0,0,0,0.2)'; }}
            onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 10px rgba(0,0,0,0.1)'; }}
          >
            تسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  if (loading) return <div style={{ color: 'var(--text-pure)', marginTop: '50px', textAlign: 'center' }}>جاري التحميل...</div>;

  return (
    <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto', padding: '0 10px', position: 'relative' }}>
      <div style={{ position: 'fixed', bottom: toast.show ? '30px' : '-100px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'var(--card-bg-locked)', color: 'var(--text-pure)', padding: '12px 24px', borderRadius: '30px', fontWeight: 'bold', boxShadow: '0 8px 16px rgba(0,0,0,0.4)', border: '1px solid var(--primary-color)', transition: 'bottom 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.5s ease', opacity: toast.show ? 1 : 0, zIndex: 1000, pointerEvents: 'none' }}>{toast.message}</div>

      <Header currentTheme={theme} onThemeSelect={handleThemeSelect} activeTab={activeTab} onTabChange={setActiveTab} />
      
      <h1 style={{ textAlign: 'center', color: 'var(--text-pure)', marginBottom: '20px', marginTop: '10px' }}>
        {activeTab === 'schedule' ? 'لوحة التحكم - الجدول' : 'لوحة التحكم - الملازم'}
      </h1>

      {/* ===================== قسم الجدول (الأساسي) ===================== */}
      {activeTab === 'schedule' && (
        <>
          <div key={currentWeek} className="week-animate">
            <div style={{ backgroundColor: 'var(--primary-color)', color: '#fff', padding: '15px', borderRadius: '8px', marginBottom: '30px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
              <h2 style={{ margin: 0, textAlign: 'center' }}>{weeks[currentWeek]}</h2>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {days.map((day, index) => {
                const isExpanded = selectedDay === day;
                const dateString = getDateForDay(index);
                const currentData = allScheduleData[`week_${currentWeek}`]?.[day];
                const isActuallyOpen = currentData?.isOpen === true;
                const isExamDay = currentData?.isExam === true;
                const statusColor = isExamDay ? '#ff0000' : 'var(--primary-color)';
                const displayOpacity = isExpanded ? (isDayOpen ? 1 : 0.6) : (isActuallyOpen ? 1 : 0.6);

                return (
                  <div key={index} className={`day-card ${isExpanded ? 'expanded' : ''}`} style={{ opacity: displayOpacity, borderLeft: `5px solid ${isExpanded ? (isExam ? '#ff0000' : 'var(--primary-color)') : (isActuallyOpen ? statusColor : 'var(--dot-bg)')}`, backgroundColor: isExpanded ? 'var(--card-bg-expanded)' : 'var(--card-bg-normal)', transition: 'opacity 0.3s ease, border-color 0.3s ease, background-color 0.3s ease', borderRadius: '8px' }}>
                    <div onClick={() => toggleDay(day)} style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
                      <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-pure)' }}>{day} {isExpanded ? ' ' : ''} {isExamDay && !isExpanded ? ' ' : ''}</h3>
                      <span style={{ fontSize: '14px', fontFamily: 'sans-serif', fontWeight: 'bold', padding: '4px 12px', borderRadius: '6px', color: isExpanded ? statusColor : 'var(--text-muted)', backgroundColor: isExpanded ? `${statusColor}1a` : 'transparent', border: isExpanded ? `1px solid ${statusColor}4d` : '1px solid transparent' }}>{dateString}</span>
                    </div>
                    
                    <div style={{ maxHeight: isExpanded ? '5000px' : '0px', opacity: isExpanded ? 1 : 0, transition: 'max-height 1s ease, opacity 0.5s ease', overflow: 'hidden', borderTop: isExpanded ? '1px solid var(--border-line)' : 'none' }}>
                      {isExpanded && (
                        <div style={{ padding: '20px 15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '5px' }}>
                            <ToggleSwitch label="يوم دراسي (دوام)" isChecked={isDayOpen} onChange={() => setIsDayOpen(!isDayOpen)} activeColor="var(--primary-color)" />
                            <ToggleSwitch label="يوم امتحانات" isChecked={isExam} onChange={() => setIsExam(!isExam)} activeColor="#ff0000" />
                          </div>
                          
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid var(--border-line)' }}>
                              <button onClick={addSubject} style={{ backgroundColor: 'transparent', color: 'var(--primary-color)', border: '1px dashed var(--primary-color)', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', WebkitTapHighlightColor: 'transparent' }} onMouseEnter={(e) => { e.target.style.backgroundColor = 'var(--card-bg-locked)'; }} onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; }}><span style={{ fontSize: '16px', lineHeight: 1 }}>+</span> إضافة مادة</button>
                              
                              <button onClick={handleSave} style={{ backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', WebkitTapHighlightColor: 'transparent' }}>💾 حفظ</button>
                            </div>
                            
                            {subjectsList.map((subject, idx) => (
                              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px', backgroundColor: 'var(--card-bg-locked)', padding: '20px 16px', borderRadius: '12px', border: '1px solid var(--border-line)', position: 'relative' }}>
                                <button onClick={() => removeSubject(idx)} style={{ position: 'absolute', top: '10px', left: '10px', background: 'transparent', border: 'none', color: '#d32f2f', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>✕</button>
                                
                                <div style={{ paddingRight: '5px' }}>
                                  <div style={{ fontSize: '12px', color: 'var(--text-details)', marginBottom: '8px', fontWeight: 'bold' }}>نوع الحدث</div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {eventTypes.map(type => (
                                      <div key={type} onClick={() => updateSubject(idx, 'type', type)} style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: subject.type === type ? 'var(--primary-color)' : 'transparent', color: subject.type === type ? '#fff' : 'var(--text-muted)', border: subject.type === type ? '1px solid var(--primary-color)' : '1px solid var(--border-line)', WebkitTapHighlightColor: 'transparent' }}>{type}</div>
                                    ))}
                                  </div>
                                </div>
                                
                                <div style={{ paddingRight: '5px' }}>
                                  <div style={{ fontSize: '12px', color: 'var(--text-details)', marginBottom: '8px', fontWeight: 'bold' }}>عنوان المادة</div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {scheduleSubjects.map((subName) => (
                                      <div key={subName} onClick={() => updateSubject(idx, 'name', subName)} style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: subject.name === subName ? 'var(--primary-color)' : 'transparent', color: subject.name === subName ? '#fff' : 'var(--text-muted)', border: subject.name === subName ? '1px solid var(--primary-color)' : '1px solid var(--border-line)', WebkitTapHighlightColor: 'transparent' }}>{subName}</div>
                                    ))}
                                  </div>
                                </div>
                                
                                <div style={{ paddingRight: '5px' }}>
                                  <div style={{ fontSize: '12px', color: 'var(--text-details)', marginBottom: '8px', fontWeight: 'bold' }}>تفاصيل إضافية</div>
                                  <textarea placeholder="محتوى الدرس أو الملاحظات..." value={subject.content} onChange={(e) => { handleTextareaResize(e); updateSubject(idx, 'content', e.target.value); }} style={{ padding: '12px 14px', borderRadius: '6px', border: '1px solid var(--border-line)', backgroundColor: 'var(--card-bg-normal)', color: 'var(--text-pure)', fontFamily: 'inherit', resize: 'none', minHeight: '50px', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <button onClick={handleSave} style={{ marginTop: '10px', backgroundColor: 'var(--primary-color)', width: '100%', padding: '16px', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px', WebkitTapHighlightColor: 'transparent' }}> حفظ التعديلات</button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          
          <div style={{ marginTop: '40px', paddingBottom: '20px' }}>
            <div className="dots-container" onMouseLeave={() => setHoveredWeek(null)} style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
              {weeks.map((_, index) => <div key={index} onClick={() => { setCurrentWeek(index); setSelectedDay(null); }} className={`dot ${currentWeek === index ? 'active' : ''}`} style={{ transform: `scale(${currentWeek === index ? 1.5 : 1})`, cursor: 'pointer', borderRadius: '4px', backgroundColor: currentWeek === index ? 'var(--primary-color)' : 'var(--dot-bg)', WebkitTapHighlightColor: 'transparent' }}></div> )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 5px' }}>
              <button onClick={prevWeek} style={{ backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '6px', padding: '10px 20px', fontWeight: 'bold', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>السابق</button>
              <button onClick={nextWeek} style={{ backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '6px', padding: '10px 20px', fontWeight: 'bold', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>التالي</button>
            </div>
            
            {/* 🌟 قسم الإشعارات المخصصة للأدمن 🌟 */}
            <div style={{ marginTop: '80px', borderTop: '1px dashed var(--border-line)', paddingTop: '30px', textAlign: 'center' }}>
              <h3 style={{ color: 'var(--text-pure)', fontSize: '18px', marginBottom: '20px' }}>إرسال إشعار للطلاب 🔔</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '350px', margin: '0 auto' }}>
                <input 
                  type="text" 
                  placeholder="عنوان الإشعار (مثال: عطلة رسمية)" 
                  value={notifTitle} 
                  onChange={(e) => setNotifTitle(e.target.value)} 
                  style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-line)', backgroundColor: 'var(--card-bg-locked)', color: 'var(--text-pure)', outline: 'none' }} 
                />
                <textarea 
                  placeholder="تفاصيل الإشعار..." 
                  value={notifBody} 
                  onChange={(e) => setNotifBody(e.target.value)} 
                  style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-line)', backgroundColor: 'var(--card-bg-locked)', color: 'var(--text-pure)', minHeight: '80px', outline: 'none', resize: 'none' }} 
                />
                <button 
                  onClick={sendCustomNotification} 
                  style={{ backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', padding: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', WebkitTapHighlightColor: 'transparent' }}
                >
                  إرسال الإشعار الآن 🚀
                </button>
              </div>
            </div>

            <div style={{ marginTop: '40px', borderTop: '1px dashed var(--border-line)', paddingTop: '30px', textAlign: 'center' }}>
              <h3 style={{ color: 'var(--text-muted)', fontSize: '15px' }}>إعدادات الأمان 🔒</h3>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', maxWidth: '300px', margin: '10px auto' }}>
                <input type="text" placeholder="كلمة مرور جديدة..." value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-line)', backgroundColor: 'var(--card-bg-locked)', color: 'var(--text-pure)', textAlign: 'center', flex: 1, outline: 'none' }} />
                <button onClick={handleChangePassword} style={{ backgroundColor: '#d32f2f', border: 'none', borderRadius: '6px', padding: '10px 15px', color: 'white', cursor: 'pointer', fontWeight: 'bold', WebkitTapHighlightColor: 'transparent' }}>تغيير</button>
              </div>
            </div>

          </div>
        </>
      )}

      {/* ===================== قسم الملازم (الإدمن) ===================== */}
      {activeTab === 'materials' && (
        <div className="week-animate" style={{ paddingBottom: '30px' }}>
          <div style={{ WebkitTapHighlightColor: 'transparent', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            {materialsSubjects.map((subject, index) => {
              const isExpanded = selectedSubject === subject;
              const subjectMaterialsRaw = materialsData[subject];
              const subjectMaterials = Array.isArray(subjectMaterialsRaw) 
                ? subjectMaterialsRaw.filter(Boolean) 
                : Object.values(subjectMaterialsRaw || {}).filter(Boolean);
              const hasMaterials = subjectMaterials.length > 0;

              return (
                <div 
                  key={index} 
                  className={`day-card ${isExpanded ? 'expanded' : ''} schedule-day-box`}
                  style={{
                    backgroundColor: isExpanded ? 'var(--card-bg-expanded)' : 'var(--card-bg-normal)',
                    borderLeft: `5px solid var(--primary-color)`
                  }}
                >
                  <div onClick={() => {
                    setSelectedSubject(isExpanded ? null : subject);
                    setMatTitle(""); 
                    setMatLink("");
                  }} style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-pure)' }}>{subject}</h3>
                    <span style={{ fontSize: '13px', color: isExpanded ? 'var(--primary-color)' : 'var(--text-muted)', backgroundColor: isExpanded ? 'rgba(0,0,0,0.15)' : 'var(--card-bg-locked)', padding: '4px 10px', borderRadius: '8px', fontWeight: 'bold' }}>
                      {hasMaterials ? `${subjectMaterials.length} ملفات` : 'لا يوجد'}
                    </span>
                  </div>
                  
                  <div style={{ maxHeight: isExpanded ? '2000px' : '0px', opacity: isExpanded ? 1 : 0, transition: isExpanded ? 'max-height 1.3s ease, opacity 0.7s ease' : 'all 0.5s ease', borderTop: isExpanded ? '1px solid var(--border-line)' : 'none', overflow: 'hidden' }}>
                    <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      
                      {hasMaterials ? (
                        subjectMaterials.map((mat, idx) => (
                          <div key={idx} className="subject-inner-card" style={{ backgroundColor: 'var(--card-bg-locked)', borderRadius: '12px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', borderRight: '4px solid var(--primary-color)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'right' }}>
                              <span style={{ color: 'var(--text-pure)', fontWeight: 'bold', fontSize: '15px' }}>{mat.title}</span>
                              <span style={{ color: 'var(--text-details)', fontSize: '12px' }}>تمت الإضافة: {mat.date || 'حديثاً'}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <a href={mat.link} target="_blank" rel="noopener noreferrer" style={{ backgroundColor: 'var(--primary-color)', color: '#fff', padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', fontSize: '13px', fontWeight: 'bold', WebkitTapHighlightColor: 'transparent' }}>فتح 📥</a>
                              <button onClick={() => handleDeleteMaterial(subject, idx)} style={{ backgroundColor: '#d32f2f', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', WebkitTapHighlightColor: 'transparent' }}>حذف 🗑️</button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0', margin: 0, fontSize: '14px' }}>لا توجد ملازم لهذه المادة.</p>
                      )}

                      <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed var(--border-line)' }}>
                        <h4 style={{ color: 'var(--text-pure)', marginTop: 0, marginBottom: '10px', fontSize: '15px' }}>➕ إضافة ملزمة جديدة:</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <input type="text" value={matTitle} onChange={(e) => setMatTitle(e.target.value)} placeholder="اسم الملزمة (مثال: الشابتر الأول)..." style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-line)', backgroundColor: 'var(--card-bg-normal)', color: 'var(--text-pure)', boxSizing: 'border-box' }} />
                          <input type="url" value={matLink} onChange={(e) => setMatLink(e.target.value)} placeholder="رابط التحميل (Drive أو غيره)..." style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-line)', backgroundColor: 'var(--card-bg-normal)', color: 'var(--text-pure)', boxSizing: 'border-box', direction: 'ltr', textAlign: 'left' }} />
                          <button onClick={() => handleAddMaterial(subject)} style={{ backgroundColor: 'var(--primary-color)', color: '#fff', fontWeight: 'bold', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', WebkitTapHighlightColor: 'transparent' }}>حفظ المادة 📤</button>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <button 
        onClick={scrollToTop}
        style={{
          position: 'fixed', bottom: '30px', right: '20px', background: 'transparent', color: 'var(--primary-color)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 1000, transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', opacity: showScrollTop ? 1 : 0, transform: showScrollTop ? 'scale(1.2)' : 'scale(0.5) translateY(20px)', pointerEvents: showScrollTop ? 'auto' : 'none', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))', WebkitTapHighlightColor: 'transparent'
        }}
        title="العودة للأعلى"
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19V5M5 12l7-7 7 7"/>
        </svg>
      </button>

    </div>
  )
}

export default Admin
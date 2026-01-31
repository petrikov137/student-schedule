import { useState, useEffect } from 'react'
import { database } from './firebase'
import { ref, onValue, update, get, child } from 'firebase/database'

function Admin() {
  const weeks = [
    "الأسبوع الأول", "الأسبوع الثاني", "الأسبوع الثالث", "الأسبوع الرابع", "الأسبوع الخامس",
    "الأسبوع السادس", "الأسبوع السابع", "الأسبوع الثامن", "الأسبوع التاسع", "الأسبوع العاشر",
    "الأسبوع الحادي عشر", "الأسبوع الثاني عشر", "الأسبوع الثالث عشر", "الأسبوع الرابع عشر", "الأسبوع الخامس عشر"
  ];

  const days = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"];

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [newPassword, setNewPassword] = useState(""); 

  const [allScheduleData, setAllScheduleData] = useState({});
  const [loading, setLoading] = useState(true);
  
  const [currentWeek, setCurrentWeek] = useState(0);
  const [selectedDay, setSelectedDay] = useState(null);
  
  const [hoveredWeek, setHoveredWeek] = useState(null);

  const [subjectsList, setSubjectsList] = useState([]);
  const [note, setNote] = useState("");
  const [isDayOpen, setIsDayOpen] = useState(false);
  const [isExam, setIsExam] = useState(false);

  useEffect(() => {
    const dataRef = ref(database, '/');
    onValue(dataRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setAllScheduleData(data);
      setLoading(false);
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

  const checkPassword = async () => {
    const dbRef = ref(database);
    try {
      const snapshot = await get(child(dbRef, 'admin_password'));
      if (snapshot.exists()) {
        const realPassword = snapshot.val();
        if (passwordInput === realPassword.toString()) { 
          setIsAuthenticated(true);
        } else {
          alert("❌ كلمة المرور غير صحيحة!");
        }
      } else {
        alert("⚠️ لم يتم تعيين كلمة مرور في قاعدة البيانات!");
      }
    } catch (error) {
      alert("حدث خطأ في الاتصال: " + error.message);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 3) {
      alert("كلمة المرور قصيرة جداً!");
      return;
    }
    try {
      await update(ref(database, '/'), {
        admin_password: newPassword
      });
      alert("✅ تم تغيير كلمة المرور بنجاح!");
      setNewPassword("");
    } catch (error) {
      alert("فشل التغيير: " + error.message);
    }
  };

  const nextWeek = () => { 
    setSelectedDay(null);
    if (currentWeek < weeks.length - 1) setCurrentWeek(currentWeek + 1); else setCurrentWeek(0);
  }
  const prevWeek = () => { 
    setSelectedDay(null);
    if (currentWeek > 0) setCurrentWeek(currentWeek - 1); else setCurrentWeek(weeks.length - 1);
  }

  const toggleDay = (day) => {
    if (selectedDay === day) {
      setSelectedDay(null);
    } else {
      setSelectedDay(day);
      const weekKey = `week_${currentWeek}`;
      const currentData = allScheduleData[weekKey] && allScheduleData[weekKey][day];
      
      if (currentData && Array.isArray(currentData.subjects)) {
        setSubjectsList(currentData.subjects);
      } else if (currentData && currentData.subjects) {
        setSubjectsList([{ name: "مادة سابقة", content: currentData.subjects }]);
      } else {
        setSubjectsList([]);
      }

      setNote(currentData ? currentData.note : "");
      setIsDayOpen(currentData?.isOpen === true);
      setIsExam(currentData?.isExam === true);
    }
  }

  const getDateForDay = (dayIndex) => {
    const startDate = new Date(2026, 1, 1); 
    const daysToAdd = (currentWeek * 7) + dayIndex;
    startDate.setDate(startDate.getDate() + daysToAdd);
    return `${startDate.getDate()} / ${startDate.getMonth() + 1}`;
  }

  const addSubject = () => {
    setSubjectsList([...subjectsList, { name: "", content: "" }]);
  };

  const updateSubject = (index, field, value) => {
    const newList = [...subjectsList];
    newList[index][field] = value;
    setSubjectsList(newList);
  };

  const removeSubject = (index) => {
    const newList = subjectsList.filter((_, i) => i !== index);
    setSubjectsList(newList);
  };

  const handleSave = async () => {
    const path = `week_${currentWeek}/${selectedDay}`;
    try {
      await update(ref(database, path), {
        subjects: subjectsList,
        note: note,
        isOpen: isDayOpen === true,
        isExam: isExam === true,
        lastUpdated: Date.now() 
      });
      alert("✅ تم الحفظ!");
      setSelectedDay(null);
    } catch (error) {
      alert("❌ حدث خطأ: " + error.message);
    }
  }

  if (!isAuthenticated) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
        <h2>🔒 منطقة المشرفين</h2>
        <input 
          type="password" 
          placeholder="أدخل كلمة المرور" 
          value={passwordInput} 
          onChange={(e) => setPasswordInput(e.target.value)} 
          style={{ padding: '10px', borderRadius: '5px', border: 'none', marginBottom: '10px', textAlign: 'center' }} 
        />
        <button 
          onClick={checkPassword} 
          style={{ backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '5px', padding: '10px 20px', cursor: 'pointer' }}
        >
          دخول
        </button>
      </div>
    );
  }

  if (loading) return <div style={{ color: 'white', marginTop: '50px' }}>جاري التحميل...</div>;

  return (
    <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto', padding: '0 10px' }}>
      
      <h1 style={{ textAlign: 'center', color: 'white', marginBottom: '20px', marginTop: '10px' }}>
        لوحة التحكم
      </h1>

      <div key={currentWeek} className="week-animate">
        
        <div style={{ backgroundColor: '#d32f2f', color: 'white', padding: '15px', borderRadius: '10px', marginBottom: '30px', boxShadow: '0 4px 10px rgba(211, 47, 47, 0.4)' }}>
          <h2 style={{ margin: 0, textAlign: 'center' }}>{weeks[currentWeek]}</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {days.map((day, index) => {
            const isExpanded = selectedDay === day;
            const dateString = getDateForDay(index);
            const weekKey = `week_${currentWeek}`;
            const currentData = allScheduleData[weekKey] && allScheduleData[weekKey][day];
            
            const isActuallyOpen = currentData?.isOpen === true;
            const isExamDay = currentData?.isExam === true;
            
            const statusColor = isExamDay ? '#ff0000' : '#15ff00';

            return (
              <div 
                key={index} 
                onClick={() => toggleDay(day)} 
                className={`day-card ${isExpanded ? 'expanded' : ''}`}
                style={{
                  opacity: isActuallyOpen ? 1 : 0.4,
                  borderLeft: isActuallyOpen ? `5px solid ${statusColor}` : '5px solid #555',
                  backgroundColor: '#333333'
                }}
              >
                <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px' }}>
                    {day} {isExpanded ? '✏️' : ''} {isExamDay && !isExpanded ? '🔥' : ''}
                  </h3>
                  <span style={{ 
                    fontSize: '14px', fontFamily: 'sans-serif', fontWeight: 'bold', padding: '4px 12px', borderRadius: '20px', transition: 'all 0.3s ease', 
                    color: isExpanded ? statusColor : 'rgba(255, 255, 255, 0.6)', 
                    backgroundColor: isExpanded ? `${statusColor}1a` : 'transparent',
                    border: isExpanded ? `1px solid ${statusColor}4d` : '1px solid transparent'
                  }}>
                    {dateString}
                  </span>
                </div>

                <div style={{ maxHeight: isExpanded ? '2000px' : '0px', opacity: isExpanded ? 1 : 0, transition: isExpanded ? 'max-height 3s ease, opacity 1s ease' : 'all 0.5s ease', borderTop: isExpanded ? '1px solid rgba(255,255,255,0.2)' : 'none', cursor: 'default' }} onClick={(e) => e.stopPropagation()}>
                  
                  {isExpanded && (
                    <div style={{ padding: '15px 10px 20px 10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      
                      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                        <button 
                          onClick={() => setIsDayOpen(!isDayOpen)}
                          style={{
                            flex: 1, backgroundColor: isDayOpen ? '#15ff00' : '#444444', color: isDayOpen ? 'black' : '#aaa', border: isDayOpen ? 'none' : '1px solid #666', borderRadius: '10px', padding: '10px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s'
                          }}
                        >
                          {isDayOpen ? "🔓 دوام" : "🔒 فراغ"}
                        </button>

                        <button 
                          onClick={() => setIsExam(!isExam)}
                          style={{
                            flex: 1, backgroundColor: isExam ? '#ff0000' : '#444', color: 'white', border: isExam ? 'none' : '1px solid #666', borderRadius: '10px', padding: '10px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s'
                          }}
                        >
                          {isExam ? "🔥 يوم امتحان" : "🌱 يوم عادي"}
                        </button>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <label style={{ color: '#15ff00', fontWeight: 'bold' }}>المواد الدراسية:</label>
                          <button onClick={addSubject} style={{ backgroundColor: '#15ff00', color: 'black', border: 'none', borderRadius: '5px', padding: '5px 10px', cursor: 'pointer', fontWeight: 'bold' }}>+ إضافة مادة</button>
                        </div>

                        {subjectsList.map((subject, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '10px', borderRadius: '8px' }}>
                            <button onClick={() => removeSubject(idx)} style={{ background: 'transparent', border: 'none', color: '#ff4444', fontSize: '20px', cursor: 'pointer', padding: '0 5px' }}>×</button>
                            <textarea placeholder="محتوى الدرس..." value={subject.content} onChange={(e) => updateSubject(idx, 'content', e.target.value)} rows="1" style={{ flex: 1, padding: '8px', borderRadius: '5px', border: 'none', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', fontFamily: 'inherit', resize: 'vertical' }} />
                            <span style={{ fontWeight: 'bold', color: 'white' }}>:</span>
                            <input type="text" placeholder="اسم المادة" value={subject.name} onChange={(e) => updateSubject(idx, 'name', e.target.value)} style={{ width: '110px', padding: '8px', borderRadius: '5px', border: 'none', backgroundColor: 'rgba(255,255,255,0.1)', color: '#15ff00', fontWeight: 'bold', fontFamily: 'inherit', textAlign: 'center' }} />
                          </div>
                        ))}
                      </div>

                      <div style={{ textAlign: 'right', marginTop: '10px' }}>
                        <label style={{ color: '#ffeb3b', fontWeight: 'bold' }}>ملاحظات عامة:</label>
                        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows="3" style={{ width: '100%', marginTop: '5px', padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', fontFamily: 'inherit' }} />
                      </div>

                      <button onClick={handleSave} style={{ marginTop: '10px', backgroundColor: '#4caf50', width: '100%', padding: '12px', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>💾 حفظ التعديلات</button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ marginTop: '40px', paddingBottom: '20px' }}>
        
        <div 
          className="dots-container" 
          onMouseLeave={() => setHoveredWeek(null)}
          style={{ 
            WebkitTapHighlightColor: 'transparent',
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            flexWrap: 'wrap', 
            gap: '8px', 
            marginBottom: '20px' 
          }}
        >
          {weeks.map((_, index) => {
             let scale = 1; 
             let transitionDelay = '0s';
             let boxShadow = 'none';
             let opacity = 1; 
 
             if (hoveredWeek !== null) {
               if (index === hoveredWeek) {
                 scale = 1.6;
                 transitionDelay = '0s';
                 opacity = 1;
               } else if (Math.abs(index - hoveredWeek) === 1) {
                 scale = 1.25;
                 transitionDelay = '0.05s';
                 opacity = 1;
               } else if (Math.abs(index - hoveredWeek) === 2) {
                 scale = 1.1;
                 transitionDelay = '0.1s';
                 opacity = 1;
               }
             } else {
               if (index === currentWeek) {
                 scale = 1.5; 
                 opacity = 1;
               }
             }
 
             return (
               <div 
                 key={index} 
                 onClick={() => { setCurrentWeek(index); setSelectedDay(null); }} 
                 onMouseEnter={() => setHoveredWeek(index)}
                 className={`dot ${currentWeek === index ? 'active' : ''}`}
                 style={{
                   transform: `scale(${scale})`, 
                   willChange: 'transform',
                   backfaceVisibility: 'hidden',
                   transition: 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.3s ease, box-shadow 0.3s ease', 
                   transitionDelay: transitionDelay,
                   boxShadow: boxShadow,
                   opacity: opacity,
                   cursor: 'pointer'
                 }}
               ></div>
             )
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 5px' }}>
          <button onClick={prevWeek} style={{ WebkitTapHighlightColor: 'transparent', backgroundColor: '#2196F3', color: 'white', cursor: 'pointer', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}><span>&rarr;</span> <span>السابق</span></button>
          <button onClick={nextWeek} style={{ WebkitTapHighlightColor: 'transparent', backgroundColor: '#2196F3', color: 'white', cursor: 'pointer', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}><span>التالي</span> <span>&larr;</span></button>
        </div>

        <div style={{ marginTop: '900px', borderTop: '1px solid #555', paddingTop: '20px', textAlign: 'center' }}>
          <h3 style={{ color: '#aaa', fontSize: '16px' }}>إعدادات الأمان</h3>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', maxWidth: '300px', margin: '10px auto' }}>
            <input 
              type="text" 
              placeholder="كلمة مرور جديدة" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ padding: '8px', borderRadius: '5px', border: 'none', textAlign: 'center', flex: 1 }}
            />
            <button onClick={handleChangePassword} style={{ backgroundColor: '#ff9800', border: 'none', borderRadius: '5px', padding: '8px 15px', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>تغيير</button>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Admin
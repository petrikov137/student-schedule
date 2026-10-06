
import React, { useState, useMemo } from 'react';

// أيقونات بسيطة للأنواع
const TypeIcon = ({ type }) => {
  if (type === 'مختبر') return <span>🧪</span>;
  if (type === 'امتحان') return <span>📝</span>;
  if (type === 'واجب' || type === 'تقرير') return <span>📋</span>;
  return <span>📚</span>; // افتراضي للمحاضرة
};

export default function Profile({ user, navigate, totalPresent, totalAbsent, handleLogout, userAttendance, allScheduleData }) {
  const [expandedType, setExpandedType] = useState(null);
  
  // 🌟 إضافات جديدة للتحكم بطريقة العرض والبطاقات الفرعية 🌟
  const [viewMode, setViewMode] = useState('flat'); // 'flat' للطريقة القديمة، 'grouped' للطريقة الجديدة (حسب المواد)
  const [expandedSubject, setExpandedSubject] = useState({}); // لتتبع المادة المفتوحة داخل كل تصنيف
  
  // 🌟 مفتاح الأنيميشن لعمل إعادة تحميل بصرية (Remount Effect) عند تبديل العرض 🌟
  const [animationKey, setAnimationKey] = useState(Date.now());

  // خوارزمية جلب وتصنيف بيانات الحضور بدقة بناءً على الجدول
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

        Object.keys(dayAttendance).forEach(subjIdx => {
          const status = dayAttendance[subjIdx]; // 'present' or 'absent'
          const scheduleSubj = allScheduleData[weekKey]?.[dayName]?.subjects?.[subjIdx];

          if (scheduleSubj) {
            const type = scheduleSubj.type || 'محاضرة';
            const name = scheduleSubj.name || 'مادة غير معروفة';

            // حساب التاريخ الدقيق بناءً على نفس الخوارزمية في الجدول
            const targetDate = new Date(2026, 1, 1);
            targetDate.setDate(targetDate.getDate() + (wIdx * 7) + dIdx);
            const dateStr = `${targetDate.getDate()} / ${targetDate.getMonth() + 1}`;

            if (!details[type]) {
              details[type] = { presentCount: 0, absentCount: 0, items: [], subjects: {} };
            }

            if (status === 'present') details[type].presentCount++;
            if (status === 'absent') details[type].absentCount++;

            // بناء المصفوفة للطريقة القديمة (التاريخية الكلية)
            details[type].items.push({ name, date: dateStr, status });

            // بناء المصفوفة للطريقة الجديدة (تصنيف حسب المواد)
            if (!details[type].subjects[name]) {
              details[type].subjects[name] = { presentCount: 0, absentCount: 0, history: [] };
            }
            if (status === 'present') details[type].subjects[name].presentCount++;
            if (status === 'absent') details[type].subjects[name].absentCount++;
            details[type].subjects[name].history.push({ date: dateStr, status });
          }
        });
      });
    });

    // ترتيب العناصر داخل كل نوع (الأحدث أو ترتيب الأيام)
    Object.keys(details).forEach(key => {
        // ترتيب الطريقة القديمة
        details[key].items.sort((a, b) => a.date.localeCompare(b.date));
        
        // ترتيب الطريقة الجديدة للمواد الفرعية
        Object.keys(details[key].subjects).forEach(subjKey => {
          details[key].subjects[subjKey].history.sort((a, b) => a.date.localeCompare(b.date));
        });
    });

    return details;
  }, [userAttendance, allScheduleData]);

  const toggleExpand = (type) => {
    setExpandedType(expandedType === type ? null : type);
  };

  const toggleSubjectExpand = (type, subjName) => {
    setExpandedSubject(prev => ({
      ...prev,
      [type]: prev[type] === subjName ? null : subjName
    }));
  };

  // 🌟 دالة لتبديل العرض مع تشغيل الأنيميشن وتصفير الحالات المفتوحة 🌟
  const handleViewChange = (newMode) => {
    if (newMode === viewMode) return;
    setViewMode(newMode);
    setExpandedType(null);
    setExpandedSubject({});
    setAnimationKey(Date.now()); // يغير المفتاح لتشغيل أنيميشن الدخول من جديد
  };

  return (
    <div className="week-animate" style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '30px' }}>
      
      {/* 🌟 تضمين ستايلات الأنيميشن الانسيابية التي تفضلها 🌟 */}
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
          @keyframes gradientFadeMove {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .animate-list-item {
            animation: cascadeIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            opacity: 0;
          }
          .animate-sub-card {
            animation: slideDownSubCard 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            opacity: 0;
          }
        `}
      </style>

      {!user ? (
        <div className="day-card" style={{ backgroundColor: 'var(--card-bg-normal)', padding: '40px 20px', textAlign: 'center', borderRadius: '15px', border: '1px solid var(--border-line)' }}>
          <div style={{ width: '80px', height: '80px', backgroundColor: 'var(--card-bg-locked)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '1px solid var(--border-line)' }}>
            <span style={{ fontSize: '40px' }}>👤</span>
          </div>
          <h2 style={{ color: 'var(--text-pure)', marginBottom: '10px' }}>حساب الطالب</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '30px', fontSize: '14px', lineHeight: '1.6' }}>
            سجل دخولك الآن لإنشاء ملفك الشخصي والوصول إلى ميزات متقدمة كتسجيل الحضور وتتبع الغيابات.
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
        <>
          {/* 🌟 البطاقة العلوية (المعلومات والإحصائيات الكلية) 🌟 */}
          <div className="day-card animate-list-item" style={{ animationDelay: '0s', backgroundColor: 'var(--card-bg-normal)', padding: '30px 20px', borderRadius: '15px', border: '1px solid var(--border-line)' }}>
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
                <div style={{ flex: 1, backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '15px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                   <span style={{ display: 'block', color: '#10b981', fontSize: '22px', fontWeight: 'bold' }}>{totalPresent}</span>
                   <span style={{ color: 'var(--text-details)', fontSize: '12px' }}>حضور كلي</span>
                </div>
                <div style={{ flex: 1, backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '15px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                   <span style={{ display: 'block', color: '#ef4444', fontSize: '22px', fontWeight: 'bold' }}>{totalAbsent}</span>
                   <span style={{ color: 'var(--text-details)', fontSize: '12px' }}>غياب كلي</span>
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

          {Object.keys(statsDetails).length > 0 && (
            <div style={{ marginTop: '10px' }}>
              
              {/* 🌟 زر التبديل الانسيابي الأنيق 🌟 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 10px 20px 10px' }}>
                <h3 style={{ fontSize: '15px', color: 'var(--text-muted)', margin: 0, textAlign: 'right' }}>
                  تفاصيل السجل
                </h3>
                
                <div style={{ 
                  position: 'relative', display: 'flex', backgroundColor: 'var(--card-bg-locked)', 
                  borderRadius: '12px', padding: '4px', border: '1px solid var(--border-line)', width: '200px' 
                }}>
                  {/* الخلفية المنزلقة */}
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
              
              {/* 🌟 قائمة البطاقات التي تتحدث بالكامل بتأثير الشلال (Cascade) عند التبديل 🌟 */}
              <div key={animationKey} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {Object.keys(statsDetails).map((type, index) => {
                  const data = statsDetails[type];
                  const isExpanded = expandedType === type;
                  
                  // 🌟 إعداد اللمعة للبطاقة الأم في طريقة (حسب المواد) 🌟
                  const isGlowing = isExpanded && viewMode === 'grouped';
                  
                  const glowStyles = isGlowing ? {
                    backgroundImage: 'linear-gradient(270deg, var(--notify-1), var(--notify-2), var(--notify-3), var(--notify-1))',
                    backgroundSize: '400% 400%',
                    animation: 'gradientFadeMove 3s ease infinite',
                    borderTop: '1px solid var(--border-line)',
                    borderBottom: '1px solid var(--border-line)',
                    borderRight: '1px solid var(--border-line)'
                  } : {
                    backgroundColor: isExpanded && viewMode === 'flat' ? 'var(--card-bg-expanded)' : 'var(--card-bg-normal)'
                  };

                  return (
                    <div key={type} style={{ display: 'flex', flexDirection: 'column' }}>
                      
                      {/* البطاقة الأم */}
                      <div 
                        className="day-card animate-list-item"
                        style={{ 
                          animationDelay: `${index * 0.1}s`,
                          borderRadius: '12px', 
                          borderLeft: `4px solid var(--primary-color)`,
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

                        {/* 🌟 الطريقة الأولى: العرض الزمني القديم (مدمج داخل البطاقة الأم) 🌟 */}
                        {viewMode === 'flat' && (
                          <div style={{ 
                            maxHeight: isExpanded ? '2000px' : '0px', 
                            opacity: isExpanded ? 1 : 0, 
                            // 🌟 نفس سرعة أنيميشن الجدول الأصلي 🌟
                            transition: isExpanded ? 'max-height 1.3s ease, opacity 0.7s ease' : 'all 0.5s ease',
                            backgroundColor: 'var(--card-bg-locked)',
                            borderTop: isExpanded ? '1px solid var(--border-line)' : 'none'
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

                      {/* 🌟 الطريقة الثانية: البطاقات الفرعية تظهر تحت البطاقة الأم 🌟 */}
                      {viewMode === 'grouped' && (
                        <div style={{
                          maxHeight: isExpanded ? '3000px' : '0px',
                          opacity: isExpanded ? 1 : 0,
                          overflow: 'hidden',
                          // 🌟 نفس سرعة أنيميشن الجدول الأصلي 🌟
                          transition: isExpanded ? 'max-height 1.3s ease, opacity 0.7s ease' : 'all 0.5s ease',
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: '10px',
                          width: '94%', // 🌟 عرض أصغر فقط 🌟
                          marginLeft: 'auto', // 🌟 محاذاة لجهة اليمين 🌟
                          marginRight: '0',
                          marginTop: isExpanded ? '10px' : '0px'
                        }}>
                          {Object.keys(data.subjects).map((subjName, sIdx) => {
                             const subjData = data.subjects[subjName];
                             const isSubjExpanded = expandedSubject[type] === subjName;

                             return (
                               <div 
                                 key={subjName}
                                 className="day-card animate-sub-card"
                                 style={{
                                    animationDelay: `${sIdx * 0.08}s`, // ظهور متسلسل للبطاقات الفرعية
                                    backgroundColor: 'var(--card-bg-normal)', // 🌟 نفس لون البطاقة الأم للحفاظ على الهوية 🌟
                                    borderRadius: '10px',
                                    borderLeft: '3px solid var(--primary-color)',
                                    overflow: 'hidden',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                 }}
                               >
                                 <div 
                                   onClick={(e) => { e.stopPropagation(); toggleSubjectExpand(type, subjName); }}
                                   style={{ 
                                     padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                     cursor: 'pointer', WebkitTapHighlightColor: 'transparent'
                                   }}
                                 >
                                    <span style={{ color: 'var(--text-pure)', fontWeight: 'bold', fontSize: '14px' }}>{subjName}</span>
                                    
                                    <div style={{ display: 'flex', gap: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                                      <span style={{ color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                        {subjData.presentCount}
                                      </span>
                                      <span style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                        {subjData.absentCount}
                                      </span>
                                    </div>
                                 </div>

                                 {/* سجل التواريخ للمادة */}
                                 <div style={{ 
                                   maxHeight: isSubjExpanded ? '2000px' : '0px', 
                                   opacity: isSubjExpanded ? 1 : 0, 
                                   // 🌟 نفس سرعة أنيميشن الجدول الأصلي 🌟
                                   transition: isSubjExpanded ? 'max-height 1.3s ease, opacity 0.7s ease' : 'all 0.5s ease',
                                   backgroundColor: 'var(--card-bg-locked)',
                                   borderTop: isSubjExpanded ? '1px solid var(--border-line)' : 'none',
                                   // 🌟 الحل الجذري لمشكلة الزوايا (Corner Clipping) 🌟
                                   borderBottomLeftRadius: '10px',
                                   borderBottomRightRadius: '10px',
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
                      )}

                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
import React, { useState, useMemo, useEffect } from 'react';
import { COURSE_SETTINGS, staticTimetable } from './Schedule/ScheduleData/CourseConfig';
import { ref, onValue } from 'firebase/database';
import { database } from './firebase';

// --- الأيقونات ---
const LectureIcon = () => ( <svg width="18" height="18" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z" /></svg> );
const LabIcon = () => ( <svg width="18" height="18" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" /></svg> );
const AssignmentIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%"><path d="M11.25 5.337c0-.355-.186-.676-.401-.959a1.647 1.647 0 0 1-.349-1.003c0-1.036 1.007-1.875 2.25-1.875S15 2.34 15 3.375c0 .369-.128.713-.349 1.003-.215.283-.401.604-.401.959 0 .332.278.598.61.578 1.91-.114 3.79-.342 5.632-.676a.75.75 0 0 1 .878.645 49.17 49.17 0 0 1 .376 5.452.657.657 0 0 1-.66.664c-.354 0-.675-.186-.958-.401a1.647 1.647 0 0 0-1.003-.349c-1.035 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401.31 0 .557.262.534.571a48.774 48.774 0 0 1-.595 4.845.75.75 0 0 1-.61.61c-1.82.317-3.673.533-5.555.642a.58.58 0 0 1-.611-.581c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.035-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959a.641.641 0 0 1-.658.643 49.118 49.118 0 0 1-4.708-.36.75.75 0 0 1-.645-.878c.293-1.614.504-3.257.629-4.924A.53.53 0 0 0 5.337 15c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.036 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.369 0 .713.128 1.003.349.283.215.604.401.959.401a.656.656 0 0 0 .659-.663 47.703 47.703 0 0 0-.31-4.82.75.75 0 0 1 .83-.832c1.343.155 2.703.254 4.077.294a.64.64 0 0 0 .657-.642Z" /></svg> );
const CheckIcon = () => ( <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> );
const XIcon = () => ( <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> );


const StudentIcon = () => (
  <svg
    width="66"
    height="66"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="9" r="3" />
    <path d="M6.5 19a5.5 5.5 0 0 1 11 0" />
  </svg>
);

// أيقونات بسيطة للأنواع
const TypeIcon = ({ type }) => {
  if (type === 'مختبر') return <LabIcon />;
  if (type === 'امتحان') return <span>!</span>;
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
          .animate-wrapper {
            animation: cascadeIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            opacity: 0;
          }
          .animate-sub-card {
            animation: slideDownSubCard 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            opacity: 0;
          }
        `}
      </style>

      {!user ? (
        <div className="day-card" style={{ backgroundColor: 'var(--card-bg-normal)', padding: '40px 20px', textAlign: 'center', borderRadius: '15px', border: '1px solid var(--border-line)' }}>
          <div style={{ width: '80px', height: '80px', backgroundColor: 'var(--card-bg-locked)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '1px solid var(--border-line)' }}>
            <StudentIcon />
          </div>
          <h2 style={{ color: 'var(--text-pure)', marginBottom: '10px' }}>حساب الطالب</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '30px', fontSize: '14px', lineHeight: '1.6' }}>
            سجل دخولك الآن لإنشاء ملفك الشخصي والوصول إلى ميزات متقدمة 
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
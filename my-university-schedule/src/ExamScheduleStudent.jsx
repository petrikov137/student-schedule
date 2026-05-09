import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { database } from './firebase';
import { ref, onValue } from 'firebase/database';

export default function ExamScheduleStudent() {
  const [isOpen, setIsOpen] = useState(true);
  const [exams, setExams] = useState([]);
  const [materialsData, setMaterialsData] = useState({});
  const [selectedDay, setSelectedDay] = useState(null);
  
  // 🌟 إضافة حالة للتحكم في عرض ملفات HTML 🌟
  const [activeHtmlFile, setActiveHtmlFile] = useState(null);

  const examSubjectsMap = {
    "برمجة كائنية": "برمجة كائنية  |   نظري",
    "هياكل البيانات 2": "هياكل البيانات 2  |   نظري",
    "هندسة البرمجيات": "هندسة البرمجيات  |   نظري",
    "قواعد بيانات موزعة": "قواعد بيانات موزعة",
    "معمارية الحاسوب": "معمارية الحاسوب",
    "اللغة الانكليزية": "اللغة الانكليزية"
  };

  useEffect(() => {
    onValue(ref(database, 'exam_schedule'), (snapshot) => {
      setExams(snapshot.val() || []);
    });
    onValue(ref(database, 'materials'), (snapshot) => {
      setMaterialsData(snapshot.val() || {});
    });
  }, []);

  const getExamDate = (index) => {
    const date = new Date(2026, 4, 11); 
    date.setDate(date.getDate() + index);
    const dayName = date.toLocaleDateString('ar-IQ', { weekday: 'long' });
    const dateStr = `${date.getDate()} / ${date.getMonth() + 1}`;
    return { dayName, dateStr };
  };

  const getDirectDownloadLink = (url) => {
    if (!url) return "#";
    if (url.includes('drive.google.com/file/d/')) {
      const fileId = url.split('/file/d/')[1].split('/')[0];
      return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
    return url;
  };

  return (
    <>
      <style>{`
        /* الأنيميشن الأساسي  */
        @keyframes floatMagic {
          0% { transform: translateY(0px) scale(1) translateX(-50%); }
          50% { transform: translateY(-8px) scale(1.02) translateX(-50%); }
          100% { transform: translateY(0px) scale(1) translateX(-50%); }
        }
        @keyframes ambientDrift {
          0% { transform: translate(0, 0) scale(1); opacity: 0.5; }
          33% { transform: translate(30px, -40px) scale(1.2); opacity: 0.7; }
          66% { transform: translate(-20px, 30px) scale(0.9); opacity: 0.4; }
          100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
        }
        @keyframes glassReveal {
          from { opacity: 0; transform: translateY(40px) scale(0.95); filter: blur(10px); }
          to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0px); }
        }
        @keyframes modalEnter {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        /* heart animiation */
        @keyframes slowPulseFull {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }

        /* 🌟 حل مشكلة التموضع بين الهاتف والكومبيوتر 🌟 */
        .responsive-exam-btn {
          bottom: 35px; /* المسافة على شاشات الكومبيوتر (تم إنزاله للأسفل) */
        }
        @media (max-width: 768px) {
          .responsive-exam-btn {
            bottom: 75px; /* المسافة الممتازة التي ضبطتها أنت للهاتف */
          }
        }

        .artistic-scroll::-webkit-scrollbar { width: 0px; background: transparent; }
      `}</style>

      <button 
        onClick={() => setIsOpen(true)}
        className="responsive-exam-btn"
        style={{
          position: 'fixed', left: '50%', zIndex: 9999,
          transform: 'translateX(-50%)',
          background: 'rgba(67, 0, 0, 0.15)',
          backdropFilter: 'blur(15px)',
          WebkitBackdropFilter: 'blur(15px)',
          border: '0.4px solid rgba(255, 8, 68, 0.4)',
          borderRadius: '17px',
          padding: '10px 25px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
          boxShadow: '0 8px 25px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
          transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => { 
          e.currentTarget.style.transform = 'translateX(-50%) scale(1.04)'; 
          e.currentTarget.style.background = 'rgba(67, 0, 0, 0.25)';
          e.currentTarget.style.boxShadow = '0 12px 35px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)';
        }}
        onMouseLeave={(e) => { 
          e.currentTarget.style.transform = 'translateX(-50%) scale(1)'; 
          e.currentTarget.style.background = 'rgba(67, 0, 0, 0.15)';
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)';
        }}
      >
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '17px',
          background: 'linear-gradient(135deg, rgba(255, 8, 70, 0.2) 0%, rgba(255, 8, 68, 0.05) 100%)',
          boxShadow: 'inset 0 0 30px rgba(114, 1, 1, 0.15)',
          animation: 'slowPulseFull 4s ease-in-out infinite both',
          pointerEvents: 'none', zIndex: 1
        }} />

        <span style={{ 
          position: 'relative', zIndex: 2,
          fontSize: '18px', fontWeight: '800', color: '#ffffff',
          letterSpacing: '0.5px' 
        }}>
          جدول الامتحانات
        </span>
      </button>

      {/* 🌟 الحل الجذري هنا: حقن النافذة في document.body متجاهلة زوم الأب 🌟 */}
      {isOpen && typeof document !== 'undefined' ? createPortal(
        <div className="artistic-scroll" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(10, 10, 15, 0.65)', zIndex: 100000,
          overflowY: 'auto', padding: '20px', boxSizing: 'border-box',
          backdropFilter: 'blur(20px) saturate(18%)', WebkitBackdropFilter: 'blur(25px) saturate(1%)',
          animation: 'modalEnter 0.6s cubic-bezier(0.22, 1, 0.36, 1) both'
        }}>
          
          <div style={{ position: 'fixed', top: '10%', right: '10%', width: '30vw', height: '30vw', background: 'radial-gradient(circle, rgba(255,8,68,0.3) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(6px)', animation: 'ambientDrift 15s infinite ease-in-out', zIndex: -1, pointerEvents: 'none' }} />
          <div style={{ position: 'fixed', bottom: '10%', left: '10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(255,177,153,0.2) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(6px)', animation: 'ambientDrift 20s infinite ease-in-out reverse', zIndex: -1, pointerEvents: 'none' }} />

          <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative', paddingBottom: '60px', paddingTop: '40px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
              <button 
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '30px', padding: '12px 30px', fontWeight: '500', fontSize: '15px', letterSpacing: '1px',
                  cursor: 'pointer', backdropFilter: 'blur(10px)', transition: 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '10px'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <span>إغلاق</span> <span style={{ fontSize: '16px', fontWeight: 'bold' }}>✕</span>
              </button>
            </div>

            <h2 style={{ textAlign: 'center', color: '#ffffff', marginBottom: '45px', fontSize: '28px', fontWeight: '400', letterSpacing: '0.5px', textShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
              جدول <span style={{ fontWeight: '900', background: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>الامتحانات</span>
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', WebkitTapHighlightColor: 'transparent' }}>
              {exams.map((exam, index) => {
                const { dayName, dateStr } = getExamDate(index);
                const isExpanded = selectedDay === index;
                const isFreeDay = exam.isFreeDay;
                const subjectTitle = isFreeDay ? "فراغ" : (exam.subject || "لم تُحدد المادة");
                
                const materialKey = examSubjectsMap[exam.subject] || exam.subject;
                const subjectMaterialsRaw = materialsData[materialKey];
                const subjectMaterials = Array.isArray(subjectMaterialsRaw) ? subjectMaterialsRaw.filter(Boolean) : Object.values(subjectMaterialsRaw || {}).filter(Boolean);

                return (
                  <div key={index} 
                    onClick={() => !isFreeDay && setSelectedDay(isExpanded ? null : index)} 
                    style={{
                      cursor: isFreeDay ? 'default' : 'pointer',
                      background: isExpanded ? 'rgba(67, 0, 0, 0.07)' : 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '17px',
                      transform: isExpanded ? 'scale(1.02)' : 'scale(1)',
                      boxShadow: isExpanded 
                        ? '0 20px 40px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)' 
                        : '0 8px 20px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
                      transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
                      border: isExpanded ? '1px solid rgba(189, 189, 189, 0.14)' : '1px solid rgba(255, 255, 255, 0.05)',
                      animation: 'glassReveal 0.8s cubic-bezier(0.22, 1, 0.36, 1) both',
                      animationDelay: `${index * 0.1}s`,
                      position: 'relative',
                      overflow: 'hidden' 
                    }}
                  >
                    {!isFreeDay && (
                      <div style={{
                        position: 'absolute', inset: 0, borderRadius: '17px',
                        background: 'linear-gradient(135deg, rgba(255, 8, 70, 0.07) 0%, rgba(255, 8, 68, 0.02) 100%)',
                        boxShadow: 'inset 0 0 30px rgba(114, 1, 1, 0.06)',
                        animation: 'slowPulseFull 5s ease-in-out infinite both',
                        animationDelay: `${index * 0.4}s`, 
                        pointerEvents: 'none', zIndex: 1
                      }} />
                    )}

                    <div style={{ padding: '22px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'right' }}>
                        <span style={{ color: isFreeDay ? 'rgba(255,255,255,0.3)' : (isExpanded ? '#ffb199' : 'rgba(255,255,255,0.6)'), fontSize: '15.7px', fontWeight: '600', letterSpacing: '0.5px', transition: 'color 0.4s ease' }}>
                          {dayName} {dateStr}
                        </span>
                        <h3 style={{ margin: 0, fontSize: '20px', color: isFreeDay ? 'rgba(255,255,255,0.3)' : '#ffffff', fontWeight: '800', textShadow: isExpanded ? '0 2px 10px rgba(255,255,255,0.2)' : 'none', transition: 'all 0.4s ease' }}>
                          {subjectTitle}
                        </h3>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        {!isFreeDay && (
                          <div style={{ 
                            width: '32px', height: '32px', borderRadius: '50%', background: isExpanded ? '#ffffff' : 'rgba(255,255,255,0.08)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)'
                          }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isExpanded ? "#ff0844" : "#ffffff"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {!isFreeDay && (
                      <div style={{ maxHeight: isExpanded ? '1000px' : '0px', opacity: isExpanded ? 1 : 0, transition: 'max-height 0.8s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.5s ease', overflow: 'hidden', position: 'relative', zIndex: 2 }}>
                        <div style={{ padding: '0 24px 24px 24px' }}>
                          <div style={{ background: 'rgba(0, 0, 0, 0.15)', borderRadius: '18px', padding: '16px', border: '1px solid rgba(0,0,0,0.1)' }}>
                            
                            {subjectMaterials.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {subjectMaterials.map((mat, idx) => {
                                  // 🌟 التحقق إذا كان الملف HTML 🌟
                                  const isHtmlFile = mat.title.toLowerCase().includes('.html') || mat.link.toLowerCase().includes('.html');
                                  const finalLink = isHtmlFile ? mat.link : getDirectDownloadLink(mat.link);

                                  return (
                                    <div key={idx} 
                                      onClick={(e) => e.stopPropagation()} 
                                      style={{ 
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                                        padding: '14px 16px', borderRadius: '14px',
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        transition: 'all 0.3s ease', cursor: 'default'
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                                    >
                                      <span style={{ color: '#ffffff', fontSize: '16px', fontWeight: '800', opacity: 0.9 }}>
                                        {mat.title}
                                      </span>
                                      
                                      {/* 🌟 تغيير الزر لفتح النافذة المنبثقة إذا كان HTML 🌟 */}
                                      {isHtmlFile ? (
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); setActiveHtmlFile(mat.link); }}
                                          style={{ 
                                            background: 'rgba(255, 255, 255, 0.1)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)',
                                            padding: '8px 20px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', 
                                            transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)', backdropFilter: 'blur(5px)'
                                          }}
                                          onMouseEnter={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#ff0844'; e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(255,255,255,0.2)'; }}
                                          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
                                        >
                                         👁️
                                        </button>
                                      ) : (
                                        <a href={finalLink} target="_blank" rel="noopener noreferrer" download 
                                          style={{ 
                                            background: 'rgba(255, 255, 255, 0.1)', color: '#ffffff', 
                                            padding: '8px 20px', borderRadius: '20px', textDecoration: 'none', 
                                            fontSize: '13px', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.1)',
                                            transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)', backdropFilter: 'blur(5px)'
                                          }}
                                          onMouseEnter={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#ff0844'; e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(255,255,255,0.2)'; }}
                                          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
                                        >
                                          تنزيل
                                        </a>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div style={{ textAlign: 'center', padding: '20px 0', opacity: 0.5 }}>
                                <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>🍃</span>
                                <p style={{ color: '#ffffff', margin: 0, fontSize: '14px', fontWeight: '300' }}> لا توجد ملازم حالياً.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>,
        document.body 
      ) : null}

      {/* 🌟 نافذة عرض ملفات الـ HTML داخل الموقع (Iframe Portal) 🌟 */}
      {activeHtmlFile && typeof document !== 'undefined' ? createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.9)', zIndex: 1000000, /* طبقة فوق جدول الامتحانات */
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(15px)', animation: 'modalEnter 0.4s ease'
        }}>
          
          <button
            onClick={() => setActiveHtmlFile(null)}
            style={{
              position: 'absolute', top: '20px', right: '20px', zIndex: 2,
              background: 'rgba(255, 255, 255, 0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '30px', padding: '10px 25px', fontWeight: 'bold', fontSize: '14px',
              cursor: 'pointer', transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#ff4444'; e.currentTarget.style.borderColor = '#ff4444'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
          >
            إغلاق ✕
          </button>
          
          <div style={{
            width: '95%', height: '85%', borderRadius: '15px', overflow: 'hidden',
            background: '#ffffff', boxShadow: '0 10px 40px rgba(0,0,0,0.6)', marginTop: '30px'
          }}>
            <iframe 
              src={activeHtmlFile} 
              width="100%" height="100%" 
              style={{ border: 'none', backgroundColor: '#ffffff' }} 
              title="Interactive Material"
            />
          </div>
        </div>,
        document.body
      ) : null}
    </>
  );
}
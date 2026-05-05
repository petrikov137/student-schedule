import React, { useState, useEffect } from 'react';
import { database } from './firebase';
import { ref, onValue, set } from 'firebase/database';

export default function ExamScheduleAdmin({ showNotification }) {
  const [isOpen, setIsOpen] = useState(false);
  const [exams, setExams] = useState([]);
  const [materialsData, setMaterialsData] = useState({});
  const [matTitle, setMatTitle] = useState("");
  const [matLink, setMatLink] = useState("");
  
  const [selectedDay, setSelectedDay] = useState(null);
  
  const examSubjectsMap = {
    "برمجة كائنية": "برمجة كائنية  |   نظري",
    "هياكل البيانات 2": "هياكل البيانات 2  |   نظري",
    "هندسة البرمجيات": "هندسة البرمجيات  |   نظري",
    "قواعد بيانات موزعة": "قواعد بيانات موزعة",
    "معمارية الحاسوب": "معمارية الحاسوب",
    "اللغة الانكليزية": "اللغة الانكليزية"
  };
  
  const examSubjectsList = Object.keys(examSubjectsMap);
  const getMaterialKey = (subject) => examSubjectsMap[subject] || subject;

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

  const handleAddDay = async () => {
    const newExams = [...exams, { subject: examSubjectsList[0], isFreeDay: false }];
    try {
      await set(ref(database, 'exam_schedule'), newExams);
      showNotification("✅ تم إضافة يوم امتحاني جديد");
    } catch (e) { showNotification("❌ خطأ في الإضافة"); }
  };

  const handleRemoveLastDay = async () => {
    if (exams.length === 0) return;
    const newExams = exams.slice(0, -1);
    try {
      await set(ref(database, 'exam_schedule'), newExams);
      showNotification("🗑️ تم حذف اليوم الأخير");
      setSelectedDay(null);
    } catch (e) { showNotification("❌ خطأ في الحذف"); }
  };

  const updateExamDay = async (index, field, value) => {
    const newExams = [...exams];
    newExams[index][field] = value;
    await set(ref(database, 'exam_schedule'), newExams);
  };

  const handleAddMaterial = async (subjectName) => {
    if (!matTitle.trim() || !matLink.trim()) return showNotification("⚠️ الرجاء كتابة اسم الملزمة ورابطها!");
    const materialKey = getMaterialKey(subjectName);
    const subjectMaterialsRaw = materialsData[materialKey];
    const currentSubjectMaterials = Array.isArray(subjectMaterialsRaw) ? subjectMaterialsRaw.filter(Boolean) : Object.values(subjectMaterialsRaw || {}).filter(Boolean);
    const newMaterial = { title: matTitle, link: matLink, date: new Date().toLocaleDateString('ar-IQ') };
    try {
      await set(ref(database, `materials/${materialKey}`), [...currentSubjectMaterials, newMaterial]);
      showNotification("✅ تمت الإضافة بنجاح!");
      setMatTitle(""); setMatLink(""); 
    } catch (e) { showNotification("❌ خطأ في الإضافة"); }
  };

  const handleDeleteMaterial = async (subjectName, materialIndex) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه الملزمة؟")) return;
    const materialKey = getMaterialKey(subjectName);
    const subjectMaterialsRaw = materialsData[materialKey];
    const currentSubjectMaterials = Array.isArray(subjectMaterialsRaw) ? subjectMaterialsRaw.filter(Boolean) : Object.values(subjectMaterialsRaw || {}).filter(Boolean);
    const updated = currentSubjectMaterials.filter((_, idx) => idx !== materialIndex);
    try {
      await set(ref(database, `materials/${materialKey}`), updated);
      showNotification("🗑️ تم حذف الملزمة");
    } catch (e) { showNotification("❌ خطأ في الحذف"); }
  };

  const ToggleSwitch = ({ label, isChecked, onChange, activeColor }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }} onClick={onChange}>
      <span style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '14px' }}>{label}</span>
      <div style={{ width: '46px', height: '24px', backgroundColor: isChecked ? activeColor : 'rgba(255,255,255,0.2)', borderRadius: '15px', position: 'relative', transition: 'background-color 0.3s' }}>
        <div style={{ width: '18px', height: '18px', backgroundColor: 'white', borderRadius: '50%', position: 'absolute', top: '3px', left: isChecked ? '25px' : '3px', transition: 'left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }} />
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes floatMagic {
          0% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-8px) scale(1.02); }
          100% { transform: translateY(0px) scale(1); }
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
        @keyframes slowPulseFull {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
        .artistic-scroll::-webkit-scrollbar { width: 0px; background: transparent; }
        
        select option { background: #1a1a2e; color: #fff; }
      `}</style>

      <button 
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed', bottom: '30px', left: '20px', zIndex: 9999,
          background: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)',
          color: 'white', border: 'none', borderRadius: '50%', width: '60px', height: '60px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 25px -5px rgba(255, 8, 68, 0.6), inset 0 -2px 5px rgba(0,0,0,0.2), inset 0 2px 5px rgba(255,255,255,0.4)',
          cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
          animation: 'floatMagic 4s ease-in-out infinite',
          transition: 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1) translateY(-5px)'; e.currentTarget.style.boxShadow = '0 12px 35px -5px rgba(255, 8, 68, 0.8)'; e.currentTarget.style.animationPlayState = 'paused'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1) translateY(0)'; e.currentTarget.style.animationPlayState = 'running'; }}
      >
        <span style={{ fontSize: '26px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>⚙️</span>
      </button>

      {isOpen && (
        <div className="artistic-scroll" style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(10, 10, 15, 0.75)', zIndex: 10000,
          overflowY: 'auto', padding: '20px', boxSizing: 'border-box',
          backdropFilter: 'blur(20px) saturate(18%)', WebkitBackdropFilter: 'blur(25px) saturate(1%)',
          animation: 'modalEnter 0.6s cubic-bezier(0.22, 1, 0.36, 1) both'
        }}>
          
          <div style={{ position: 'fixed', top: '10%', right: '10%', width: '30vw', height: '30vw', background: 'radial-gradient(circle, rgba(255,8,68,0.3) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(6px)', animation: 'ambientDrift 15s infinite ease-in-out', zIndex: -1, pointerEvents: 'none' }} />
          <div style={{ position: 'fixed', bottom: '10%', left: '10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(255,177,153,0.2) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(6px)', animation: 'ambientDrift 20s infinite ease-in-out reverse', zIndex: -1, pointerEvents: 'none' }} />

          <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative', paddingBottom: '80px', paddingTop: '30px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
              <button 
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '30px', padding: '10px 25px', fontWeight: '500', fontSize: '14px', letterSpacing: '1px',
                  cursor: 'pointer', backdropFilter: 'blur(10px)', transition: 'all 0.4s ease',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '8px'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <span>إغلاق</span> <span style={{ fontSize: '14px', fontWeight: 'bold' }}>✕</span>
              </button>
            </div>

            <h2 style={{ textAlign: 'center', color: '#ffffff', marginBottom: '30px', fontSize: '24px', fontWeight: '300', textShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
              إدارة <span style={{ fontWeight: '900', background: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>جدول الامتحانات</span>
            </h2>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
              <button onClick={handleAddDay} style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg, rgba(255,8,68,0.8) 0%, rgba(255,177,153,0.8) 100%)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer', backdropFilter: 'blur(10px)', boxShadow: '0 8px 20px rgba(255,8,68,0.2)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform='scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>+ إضافة</button>
              <button onClick={handleRemoveLastDay} disabled={exams.length === 0} style={{ flex: 1, padding: '14px', background: exams.length === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)', color: exams.length === 0 ? 'rgba(255,255,255,0.3)' : 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', fontWeight: 'bold', cursor: exams.length === 0 ? 'not-allowed' : 'pointer', backdropFilter: 'blur(10px)', transition: 'transform 0.2s' }} onMouseEnter={e => { if(exams.length>0) e.currentTarget.style.transform='scale(1.02)'}} onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>- حذف</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', WebkitTapHighlightColor: 'transparent' }}>
              {exams.map((exam, index) => {
                const { dayName, dateStr } = getExamDate(index);
                const currentSubject = exam.subject || examSubjectsList[0];
                const isExpanded = selectedDay === index;
                const isFreeDay = exam.isFreeDay;
                
                const materialKey = getMaterialKey(currentSubject);
                const subjectMaterialsRaw = materialsData[materialKey];
                const subjectMaterials = Array.isArray(subjectMaterialsRaw) ? subjectMaterialsRaw.filter(Boolean) : Object.values(subjectMaterialsRaw || {}).filter(Boolean);

                return (
                  <div key={index} 
                    className="day-card" 
                    style={{
                      background: isExpanded ? 'rgba(67, 0, 0, 0.07)' : 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '17px',
                      transform: isExpanded ? 'scale(1.02)' : 'scale(1)',
                      boxShadow: isExpanded 
                        ? '0 20px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)' 
                        : '0 8px 20px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
                      transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
                      border: isExpanded ? '1px solid rgba(255, 8, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
                      animation: 'glassReveal 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
                      animationDelay: `${index * 0.08}s`,
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

                    {isExpanded && !isFreeDay && (
                      <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '4px', background: 'linear-gradient(to bottom, #ff0000, #ffb199)', boxShadow: '0 0 15px #ff0844' }} />
                    )}

                    <div 
                      onClick={() => setSelectedDay(isExpanded ? null : index)} 
                      style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 2, cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'right' }}>
                        <span style={{ color: isFreeDay ? 'rgba(255,255,255,0.3)' : (isExpanded ? '#ffb199' : 'rgba(255,255,255,0.6)'), fontSize: '14px', fontWeight: '600' }}>
                          {dayName} - {dateStr}
                        </span>
                        <h3 style={{ margin: 0, fontSize: '18px', color: isFreeDay ? 'rgba(255,255,255,0.4)' : '#ffffff', fontWeight: '800' }}>
                          {isFreeDay ? "يوم استراحة" : currentSubject}
                        </h3>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '12px', color: isFreeDay ? 'rgba(255,255,255,0.4)' : '#ffb199', background: isFreeDay ? 'rgba(255,255,255,0.05)' : 'rgba(255,8,68,0.15)', padding: '6px 12px', borderRadius: '10px', border: isFreeDay ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(255,8,68,0.3)', fontWeight: 'bold' }}>
                          {isFreeDay ? 'استراحة' : 'امتحان'}
                        </span>
                        
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: isExpanded ? '#ffffff' : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'all 0.4s ease' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isExpanded ? "#ff0844" : "#ffffff"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div style={{ maxHeight: isExpanded ? '2000px' : '0px', opacity: isExpanded ? 1 : 0, transition: 'max-height 0.6s ease, opacity 0.4s ease', overflow: 'hidden', position: 'relative', zIndex: 2 }}>
                      <div style={{ padding: '0 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        
                        <ToggleSwitch label="تحديد كيوم فراغ (استراحة)" isChecked={exam.isFreeDay || false} onChange={() => updateExamDay(index, 'isFreeDay', !exam.isFreeDay)} activeColor="#ff0844" />
                        
                        {!exam.isFreeDay && (
                          <div style={{ marginTop: '10px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>اختر مادة الامتحان:</span>
                            
                            <select 
                              value={currentSubject} 
                              onChange={(e) => updateExamDay(index, 'subject', e.target.value)} 
                              style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'rgba(0,0,0,0.3)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', outline: 'none', boxSizing: 'border-box', fontSize: '15px', fontWeight: 'bold', backdropFilter: 'blur(5px)' }}
                            >
                              {examSubjectsList.map(subj => <option key={subj} value={subj}>{subj}</option>)}
                            </select>

                            {/*  قسم الملازم  */}
                            <div style={{ marginTop: '25px', background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)' }}>
                              <h4 style={{ color: '#ffffff', marginTop: 0, marginBottom: '15px', fontSize: '14px', borderBottom: '1px dashed rgba(255,255,255,0.1)', paddingBottom: '10px' }}>📚 إدارة الملازم الحالية:</h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {subjectMaterials.length > 0 ? (
                                  subjectMaterials.map((mat, idx) => (
                                    <div key={idx} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '12px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRight: '3px solid #ffb199' }}>
                                      <span style={{ color: '#ffffff', fontSize: '14px', fontWeight: 'bold' }}>{mat.title}</span>
                                      <button onClick={() => handleDeleteMaterial(currentSubject, idx)} style={{ background: 'rgba(255,8,68,0.2)', color: '#ffb199', border: '1px solid rgba(255,8,68,0.4)', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', transition: 'all 0.2s' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,8,68,0.4)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,8,68,0.2)'}>حذف 🗑️</button>
                                    </div>
                                  ))
                                ) : (
                                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: 0, textAlign: 'center' }}>لا توجد ملازم مضافة.</p>
                                )}
                              </div>

                              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                                <h4 style={{ color: '#ffffff', marginTop: 0, marginBottom: '15px', fontSize: '14px' }}>➕ إضافة ملزمة جديدة:</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                  <input type="text" value={matTitle} onChange={(e) => setMatTitle(e.target.value)} placeholder="اسم الملزمة (مثال: المحاضرة الأولى)..." style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#ffffff', boxSizing: 'border-box' }} />
                                  <input type="url" value={matLink} onChange={(e) => setMatLink(e.target.value)} placeholder="رابط التحميل المباشر..." style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#ffffff', boxSizing: 'border-box', direction: 'ltr', textAlign: 'left' }} />
                                  <button onClick={() => handleAddMaterial(currentSubject)} style={{ background: 'rgba(255,255,255,0.1)', color: '#ffffff', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.2)', padding: '12px', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', transition: 'all 0.3s ease' }} onMouseEnter={e=>{e.currentTarget.style.background='#ffffff'; e.currentTarget.style.color='#ff0844'}} onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.1)'; e.currentTarget.style.color='#ffffff'}}>حفظ الملزمة 📥</button>
                                </div>
                              </div>
                            </div>

                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {exams.length === 0 && <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', marginTop: '20px' }}>لم يتم إضافة أيام للجدول بعد.</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
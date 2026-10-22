
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ref, get, set, update, onValue } from 'firebase/database';
import { database } from '../firebase';

export default function AssignmentsTab({ 
  allAssignmentsList, 
  selectedSubject, 
  setSelectedSubject,
  isAdminMode,
  showToast,
  weeks,
  days,
  currentWeek,
  courseSubjectsList,
  user // تم جلب المستخدم لتفعيل الميزة للحسابات المسجلة
}) {

  // --- حالات النافذة المنبثقة للإضافة المباشرة ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addWeek, setAddWeek] = useState(currentWeek || 0);
  const [addDay, setAddDay] = useState(days ? days[0] : 'الأحد');
  const [addType, setAddType] = useState('واجب');
  const [addName, setAddName] = useState(courseSubjectsList ? courseSubjectsList[0] : '');
  const [addContent, setAddContent] = useState('');
  const [addUrl, setAddUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // --- حالات حفظ الواجبات المكتملة ---
  const [completedTasks, setCompletedTasks] = useState({});

  // جلب المهام المكتملة من قاعدة البيانات الخاصة بالطالب
  useEffect(() => {
    if (user) {
      const completedRef = ref(database, `users/${user.uid}/completedAssignments`);
      const unsub = onValue(completedRef, (snapshot) => {
        if (snapshot.exists()) {
          setCompletedTasks(snapshot.val());
        } else {
          setCompletedTasks({});
        }
      });
      return () => unsub();
    } else {
      setCompletedTasks({});
    }
  }, [user]);

  // دالة تغيير حالة الواجب (مكتمل / غير مكتمل)
  const toggleCompletion = async (e, taskId) => {
    e.stopPropagation(); // لمنع البطاقة من الإغلاق عند ضغط الزر
    if (!user) return;
    
    const isCurrentlyCompleted = !!completedTasks[taskId];
    try {
      await update(ref(database, `users/${user.uid}/completedAssignments`), {
        [taskId]: isCurrentlyCompleted ? null : true // مسحها من القاعدة إذا ألغى التحديد لتوفير المساحة
      });
      if (navigator.vibrate) navigator.vibrate(40);
    } catch (error) {
      if(showToast) showToast("حدث خطأ في تحديث الحالة", "error");
    }
  };

  // دالة حساب الوقت المتبقي
  const getCountdown = (targetDate) => {
    const now = new Date();
    const target = new Date(targetDate);
    target.setHours(14, 0, 0, 0);
    const diff = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (diff < 0) return { text: "انتهى", color: "#ef4444" }; 
    if (diffDays === 0) return { text: "ينتهي اليوم", color: "#10b981" }; 
    if (diffDays === 1) return { text: "تبقى يوم", color: "#10b981" }; 
    if (diffDays === 2) return { text: "تبقى يومان", color: "#10b981" };
    if (diffDays <= 10) return { text: `تبقى ${diffDays} أيام`, color: "#10b981" }; 
    return { text: `تبقى ${diffDays} يوم`, color: "#10b981" }; 
  };

  // دالة الحفظ المباشر للأدمن
  const handleSaveDirectAdd = async () => {
    if (!addContent.trim()) {
      if(showToast) showToast("يرجى كتابة التفاصيل والملاحظات", "error");
      return;
    }
    setIsProcessing(true);
    try {
      const path = `week_${addWeek}/${addDay}/dynamicEvents`;
      const snapshot = await get(ref(database, path));
      const currentEvents = snapshot.exists() ? snapshot.val() : [];
      
      const newEvent = {
         id: `dynamic_${Date.now()}`,
         type: addType,
         name: addName,
         content: addContent,
         imageUrl: addUrl,
         groups: [] 
      };
      
      await set(ref(database, path), [...currentEvents, newEvent]);
      if(showToast) showToast("تمت إضافة الحدث بنجاح", "success");
      
      setAddContent('');
      setAddUrl('');
      setIsAddModalOpen(false);
    } catch (e) {
      if(showToast) showToast("حدث خطأ أثناء الحفظ", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="week-animate" style={{ paddingBottom: '30px' }}>
      
      {/* زر الإضافة (للأدمن فقط) */}
      {isAdminMode && (
        <div 
          onClick={() => setIsAddModalOpen(true)}
          className="subject-inner-card"
          style={{ 
            backgroundColor: 'transparent', border: '1.5px dashed var(--primary-color)', borderRadius: '12px', 
            minHeight: '68px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            color: 'var(--primary-color)', fontSize: '28px', fontWeight: '300', lineHeight: 1, userSelect: 'none',
            transition: 'all 0.25s ease', WebkitTapHighlightColor: 'transparent', marginBottom: '15px'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--card-bg-locked)'; e.currentTarget.style.transform = 'scale(0.99)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.transform = 'scale(1)'; }}
        >
          +
        </div>
      )}

      <div style={{ WebkitTapHighlightColor: 'transparent', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {allAssignmentsList && allAssignmentsList.length > 0 ? (
          allAssignmentsList.map((assign, idx) => {
            const countdown = getCountdown(assign.targetDate);
            const isExpanded = selectedSubject === `assign-${idx}`;
            const dateLabel = assign.type === 'امتحان' ? 'تاريخ الامتحان:' : 'تاريخ التسليم:';
            
            // إنشاء معرّف فريد وثابت للواجب لربطه في قاعدة البيانات
            const uniqueTaskId = `${assign.id}_${assign.targetDate.getTime()}`;
            const isCompleted = !!completedTasks[uniqueTaskId];

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
                  // إذا كان مكتملاً نجعل الشريط الجانبي رمادي خافت، وإلا نستخدم لون العداد
                  borderRight: `4px solid ${isCompleted ? 'var(--border-line)' : countdown.color}`,
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  // تخفيف شفافية البطاقة بالكامل إذا كانت مكتملة
                  opacity: isCompleted ? 0.6 : 1,
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
                  <span style={{ 
                    color: isCompleted ? 'var(--text-muted)' : 'var(--text-pure)', 
                    fontWeight: 'bold', 
                    fontSize: '17px',
                    // تمرير خط على النص إذا اكتمل
                    textDecoration: isCompleted ? 'line-through' : 'none',
                    transition: 'all 0.3s ease'
                  }}>
                    {assign.type} {assign.name}
                  </span>
                  
                  {/* العداد التنازلي يبقى كما هو دون تغيير ألوانه */}
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
                    <div 
                      dir="auto" 
                      style={{ color: 'var(--text-pure)', fontSize: '16px', whiteSpace: 'pre-wrap', lineHeight: '1.6', borderTop: '1px dashed var(--border-line)', paddingTop: '10px', textAlign: 'right', unicodeBidi: 'plaintext' }}
                    >
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
                    
                    <div style={{ marginTop: '15px', marginBottom: '8px', color: 'var(--text-details)', fontWeight: 'bold', fontSize: '12px' }}>
                       {dateLabel} {assign.dayStr} ({assign.targetDate.getDate()} / {assign.targetDate.getMonth() + 1})
                    </div>

                    {/* 🌟 زر تبديل حالة الواجب (مكتمل / غير مكتمل) يظهر للحسابات المسجلة فقط 🌟 */}
                    {user && (
                      <div 
                        onClick={(e) => e.stopPropagation()} 
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed var(--border-line)' }}
                      >
                        <span style={{ color: isCompleted ? 'var(--text-muted)' : 'var(--text-pure)', fontSize: '14px', fontWeight: 'bold' }}>
                          حالة الإنجاز: {isCompleted ? 'مكتمل' : 'غير مكتمل'}
                        </span>
                        
                        <div 
                          onClick={(e) => toggleCompletion(e, uniqueTaskId)}
                          style={{
                            width: '46px', height: '24px',
                            backgroundColor: isCompleted ? 'var(--primary-color)' : 'var(--card-bg-locked)',
                            borderRadius: '15px', position: 'relative',
                            transition: 'all 0.3s ease', cursor: 'pointer',
                            border: isCompleted ? '1px solid var(--primary-color)' : '1px solid var(--border-line)'
                          }}
                        >
                          <div style={{
                            width: '18px', height: '18px', backgroundColor: 'white', borderRadius: '50%',
                            position: 'absolute', top: '2px', left: isCompleted ? '25px' : '3px',
                            transition: 'left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }} />
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div style={{ backgroundColor: 'var(--card-bg-normal)', borderRadius: '12px', padding: '30px 20px', textAlign: 'center', borderLeft: '5px solid var(--dot-bg)' }}>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '15px', fontWeight: 'bold' }}>لا توجد واجبات أو امتحانات نشطة حالياً.</p>
          </div>
        )}
      </div>

      {/* نافذة إضافة حدث للأدمن */}
      {isAddModalOpen && typeof document !== 'undefined' ? createPortal(
        <div 
          onClick={() => !isProcessing && setIsAddModalOpen(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px', boxSizing: 'border-box', direction: 'rtl', animation: 'modalBackdropFade 0.25s ease forwards'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: '370px', maxHeight: '90vh', overflowY: 'auto',
              backgroundColor: 'var(--card-bg-normal)', border: '1px solid var(--border-line)', borderRadius: '22px', 
              padding: '24px 20px', boxShadow: '0 20px 50px rgba(0,0,0,0.45)', display: 'flex', flexDirection: 'column', gap: '16px',
              textAlign: 'center', animation: 'modalPopIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
            }}
          >
            <h3 style={{ margin: 0, color: 'var(--text-pure)', fontSize: '18px' }}>إضافة حدث جديد</h3>
            
            <div style={{ textAlign: 'right' }}>
              <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '6px', fontWeight: 'bold' }}>الأسبوع</label>
              <select value={addWeek} onChange={(e) => setAddWeek(Number(e.target.value))} style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-line)', backgroundColor: 'var(--card-bg-locked)', color: 'var(--text-pure)', fontSize: '14px', outline: 'none' }}>
                {weeks.map((w, i) => <option key={i} value={i}>{w}</option>)}
              </select>
            </div>

            <div style={{ textAlign: 'right' }}>
              <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '6px', fontWeight: 'bold' }}>اليوم</label>
              <select value={addDay} onChange={(e) => setAddDay(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-line)', backgroundColor: 'var(--card-bg-locked)', color: 'var(--text-pure)', fontSize: '14px', outline: 'none' }}>
                {days.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div style={{ textAlign: 'right' }}>
              <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '6px', fontWeight: 'bold' }}>نوع الحدث</label>
              <select value={addType} onChange={(e) => setAddType(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-line)', backgroundColor: 'var(--card-bg-locked)', color: 'var(--text-pure)', fontSize: '14px', outline: 'none' }}>
                {["واجب", "تقرير", "امتحان", "أُخرى"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div style={{ textAlign: 'right' }}>
              <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '6px', fontWeight: 'bold' }}>المادة</label>
              <select value={addName} onChange={(e) => setAddName(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-line)', backgroundColor: 'var(--card-bg-locked)', color: 'var(--text-pure)', fontSize: '14px', outline: 'none' }}>
                {courseSubjectsList.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div style={{ textAlign: 'right' }}>
              <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '6px', fontWeight: 'bold' }}>التفاصيل والملاحظات</label>
              <textarea 
                value={addContent} onChange={(e) => setAddContent(e.target.value)} 
                placeholder="اكتب التفاصيل هنا..."
                style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-line)', backgroundColor: 'var(--card-bg-locked)', color: 'var(--text-pure)', fontSize: '14px', outline: 'none', resize: 'vertical', minHeight: '80px', fontFamily: 'inherit' }} 
              />
            </div>

            <div style={{ textAlign: 'right' }}>
              <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '6px', fontWeight: 'bold' }}>رابط صورة مرفقة (اختياري)</label>
              <input 
                type="url" value={addUrl} onChange={(e) => setAddUrl(e.target.value)} dir="ltr"
                placeholder="https://..."
                style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-line)', backgroundColor: 'var(--card-bg-locked)', color: 'var(--text-pure)', fontSize: '13px', outline: 'none' }} 
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button 
                onClick={handleSaveDirectAdd} disabled={isProcessing} 
                style={{ flex: 2, padding: '13px', borderRadius: '12px', border: 'none', backgroundColor: 'var(--primary-color)', color: '#fff', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', opacity: isProcessing ? 0.7 : 1 }}
              >
                {isProcessing ? '...' : 'إضافة وحفظ'}
              </button>
              <button 
                onClick={() => setIsAddModalOpen(false)} disabled={isProcessing} 
                style={{ flex: 1, padding: '13px', borderRadius: '12px', border: '1px solid var(--border-line)', backgroundColor: 'transparent', color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
              >
                إلغاء
              </button>
            </div>

          </div>
        </div>,
        document.body
      ) : null}

    </div>
  );
}


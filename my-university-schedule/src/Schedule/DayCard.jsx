
import React, { useState, useEffect, useMemo } from 'react';
import { database } from '../firebase';
import { ref, set } from 'firebase/database';
import { courseSubjectsList, staticTimetable } from './ScheduleData/CourseConfig';

// --- الأيقونات ---
const LectureIcon = () => ( <svg width="18" height="18" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z" /></svg> );
const LabIcon = () => ( <svg width="18" height="18" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" /></svg> );
const AssignmentIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%"><path d="M11.25 5.337c0-.355-.186-.676-.401-.959a1.647 1.647 0 0 1-.349-1.003c0-1.036 1.007-1.875 2.25-1.875S15 2.34 15 3.375c0 .369-.128.713-.349 1.003-.215.283-.401.604-.401.959 0 .332.278.598.61.578 1.91-.114 3.79-.342 5.632-.676a.75.75 0 0 1 .878.645 49.17 49.17 0 0 1 .376 5.452.657.657 0 0 1-.66.664c-.354 0-.675-.186-.958-.401a1.647 1.647 0 0 0-1.003-.349c-1.035 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401.31 0 .557.262.534.571a48.774 48.774 0 0 1-.595 4.845.75.75 0 0 1-.61.61c-1.82.317-3.673.533-5.555.642a.58.58 0 0 1-.611-.581c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.035-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959a.641.641 0 0 1-.658.643 49.118 49.118 0 0 1-4.708-.36.75.75 0 0 1-.645-.878c.293-1.614.504-3.257.629-4.924A.53.53 0 0 0 5.337 15c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.036 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.369 0 .713.128 1.003.349.283.215.604.401.959.401a.656.656 0 0 0 .659-.663 47.703 47.703 0 0 0-.31-4.82.75.75 0 0 1 .83-.832c1.343.155 2.703.254 4.077.294a.64.64 0 0 0 .657-.642Z" /></svg> );
const CheckIcon = () => ( <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> );
const XIcon = () => ( <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> );

const ToggleSwitch = ({ label, isChecked, onChange, activeColor }) => (
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: 'var(--card-bg-locked)', borderRadius: '8px', border: '1px solid var(--border-line)', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }} onClick={onChange}>
 <span style={{ color: 'var(--text-pure)', fontWeight: 'bold', fontSize: '15px' }}>{label}</span>
 <div style={{ width: '46px', height: '24px', backgroundColor: isChecked ? activeColor : 'var(--dot-bg)', borderRadius: '15px', position: 'relative', transition: 'background-color 0.3s' }}>
   <div style={{ width: '18px', height: '18px', backgroundColor: 'white', borderRadius: '50%', position: 'absolute', top: '3px', left: isChecked ? '25px' : '3px', transition: 'left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
 </div>
</div>
);

export default function DayCard({
day, index, currentWeek, dayInfo, isLocked, isExpanded, dateString, isExam, statusColor, showNotification,
user, selectedArchive, userAttendance, activeAttendanceMenu, hideDetails, toggleDay, handleEventClick,
handleEventPressStart, handleEventPressEnd, markAttendance, handleBulkAttendance, showToast,
activeGroup, isAdminMode, userRole
}) {

const dynamicEventTypes = ["امتحان", "واجب", "تقرير", "أُخرى"];
const groupOptions = ['A', 'B', 'C', 'D'];

// 🌟 حالات الإدارة (ما يوجد في Firebase فقط) 🌟
const [fixedOverrides, setFixedOverrides] = useState({}); // التعديلات على المواد الثابتة (إخفاء، تغيير النوع، إضافة ملاحظة)
const [dynamicEvents, setDynamicEvents] = useState([]); // الواجبات والامتحانات الإضافية الجديدة
const [editIsOpen, setEditIsOpen] = useState(false);
const [editIsExam, setEditIsExam] = useState(false);

useEffect(() => {
 if (dayInfo) {
   setFixedOverrides(dayInfo.fixedOverrides || {});
   setDynamicEvents(dayInfo.dynamicEvents || []);
   setEditIsOpen(dayInfo.isOpen ?? true);
   setEditIsExam(dayInfo.isExam ?? false);
 } else {
   setFixedOverrides({});
   setDynamicEvents([]);
   setEditIsOpen(true);
   setEditIsExam(false);
 }
}, [dayInfo, isExpanded]);

const canAdminEditSubject = (subjGroups) => {
 if (userRole === 'super_admin' || !userRole) return true;
 const adminGroup = userRole.split('_')[1].toUpperCase(); 
 if (!subjGroups || subjGroups.length === 0) return false; 
 return subjGroups.includes(adminGroup);
};

// 🌟 دمج الجدول الثابت مع تعديلات الأدمن للعرض 🌟
const mergedSubjects = useMemo(() => {
 const staticForDay = staticTimetable[day] || [];
 const list = [];

 // 1. معالجة المواد الثابتة
 staticForDay.forEach(staticSubj => {
   const isVisibleForGroup = !staticSubj.groups || staticSubj.groups.length === 0 || staticSubj.groups.includes(activeGroup);
   const override = fixedOverrides[staticSubj.id] || {};
   
   // إذا كنا في وضع الأدمن، نظهر المادة حتى لو كانت مخفية لكي يستطيع إرجاعها
   if (override.isHidden && !isAdminMode) return;
   // إذا كانت غير مرئية للكروب، نظهرها للأدمن فقط إن كان يملك صلاحية أو في وضع الأدمن
   if (!isVisibleForGroup && !isAdminMode) return;

   list.push({
     ...staticSubj,
     type: override.type || staticSubj.type,
     content: override.content || staticSubj.content || "",
     isHidden: override.isHidden || false,
     isFixed: true,
     originalType: staticSubj.type
   });
 });

 // 2. معالجة المواد الديناميكية الإضافية
 dynamicEvents.forEach(dynSubj => {
   const isVisibleForGroup = !dynSubj.groups || dynSubj.groups.length === 0 || dynSubj.groups.includes(activeGroup);
   if (isVisibleForGroup || isAdminMode) {
     list.push({ ...dynSubj, isFixed: false });
   }
 });

 return list;
}, [day, activeGroup, fixedOverrides, dynamicEvents, isAdminMode]);

// ---------- دوال تحكم الأدمن ----------

const toggleHideFixed = (fixedId) => {
 setFixedOverrides(prev => ({
   ...prev,
   [fixedId]: { ...prev[fixedId], isHidden: !prev[fixedId]?.isHidden }
 }));
};

const updateFixedOverride = (fixedId, field, value) => {
 setFixedOverrides(prev => ({
   ...prev,
   [fixedId]: { ...prev[fixedId], [field]: value }
 }));
};

const handleAddDynamic = (e) => {
 e.stopPropagation();
 let defaultGroups = [];
 if (userRole && userRole.startsWith('admin_') && userRole !== 'super_admin') {
   defaultGroups = [userRole.split('_')[1].toUpperCase()];
 }
 const newId = `dynamic_${Date.now()}`;
 setDynamicEvents([...dynamicEvents, { id: newId, type: "امتحان", name: courseSubjectsList[0], content: "", groups: defaultGroups }]);
};

const updateDynamic = (dynId, field, value) => {
 setDynamicEvents(prev => prev.map(ev => ev.id === dynId ? { ...ev, [field]: value } : ev));
};

const toggleDynamicGroup = (dynId, group) => {
 setDynamicEvents(prev => prev.map(ev => {
   if (ev.id === dynId) {
     let currentGroups = ev.groups || [];
     if (currentGroups.includes(group)) currentGroups = currentGroups.filter(g => g !== group);
     else currentGroups.push(group);
     return { ...ev, groups: currentGroups };
   }
   return ev;
 }));
};

const removeDynamic = (dynId) => {
 setDynamicEvents(prev => prev.filter(ev => ev.id !== dynId));
};

const handleSaveDay = async (e) => {
 e.stopPropagation();
 try {
   await set(ref(database, `week_${currentWeek}/${day}`), {
     isOpen: editIsOpen,
     isExam: editIsExam,
     fixedOverrides: fixedOverrides,
     dynamicEvents: dynamicEvents,
     lastUpdated: Date.now()
   });
   showToast(`✅ تم حفظ تحديثات يوم ${day} بنجاح!`, "success");
 } catch (error) {
   showToast("❌ حدث خطأ أثناء الحفظ", "error");
 }
};

// ---------- حسابات الحضور ----------
let dayAttendance = {};
let markedCount = 0; let presentCount = 0; let absentCount = 0; let totalSubjects = 0;
// نحسب الحضور بناءً على العناصر المعروضة للطالب فقط (حتى لا تحسب المحذوفات)
const studentVisibleSubjects = mergedSubjects.filter(s => !s.isHidden && (!s.groups || s.groups.length === 0 || s.groups.includes(activeGroup)));

if (isExpanded && user && selectedArchive === null) {
 dayAttendance = userAttendance[`week_${currentWeek}`]?.[day] || {};
 totalSubjects = studentVisibleSubjects.length;
 
 // نعتمد على id الخاص بكل مادة لضمان دقة التسجيل حتى مع الإضافة/الحذف
 studentVisibleSubjects.forEach(subj => {
   if (dayAttendance[subj.id]) {
     markedCount++;
     if (dayAttendance[subj.id] === 'present') presentCount++;
     if (dayAttendance[subj.id] === 'absent') absentCount++;
   }
 });
}

return (
 <div 
   className={`day-card ${isExpanded ? 'expanded' : ''} schedule-day-box`}
   style={{
     opacity: (isLocked && !isAdminMode) ? 0.6 : 1, cursor: (isLocked && !isAdminMode) ? 'default' : 'pointer',
     ...(showNotification && !isAdminMode ? {
       backgroundImage: 'linear-gradient(270deg, var(--notify-1), var(--notify-2), var(--notify-3), var(--notify-1))', backgroundSize: '400% 400%', animation: 'gradientFadeMove 3s ease infinite', borderTop: '1px solid var(--border-line)', borderBottom: '1px solid var(--border-line)', borderRight: '1px solid var(--border-line)'
     } : { backgroundColor: (isLocked && !isAdminMode) ? 'var(--card-bg-locked)' : 'var(--card-bg-normal)' }),
     borderLeft: (isLocked && !isAdminMode) ? '5px solid var(--dot-bg)' : `5px solid ${statusColor}`,
     outline: (isAdminMode && isExpanded) ? '1px dashed var(--primary-color)' : 'none', outlineOffset: '-1px'
   }}
 >
   <div onClick={(e) => toggleDay(day, (isLocked && !isAdminMode), e)} style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
     <h3 style={{ margin: 0, fontSize: '18px', color: (isLocked && !isAdminMode) ? 'var(--text-muted)' : 'var(--text-pure)' }}>
       {day} {isExam && !(isLocked && !isAdminMode) && !isExpanded ? '!!' : ''}
       {isAdminMode && isExpanded && <span style={{fontSize:'12px', color:'var(--primary-color)', marginRight:'10px'}}>✏️ تعديل</span>}
     </h3>
     <span style={{ fontSize: '14px', color: (isLocked && !isAdminMode) ? 'var(--text-muted)' : (isExpanded ? statusColor : 'var(--text-main)'), backgroundColor: isExpanded ? `${statusColor}1a` : 'transparent', padding: '4px 10px', borderRadius: '8px', fontWeight: 'bold' }}>{dateString}</span>
   </div>
   
   <div style={{ maxHeight: isExpanded ? '5000px' : '0px', opacity: isExpanded ? 1 : 0, transition: isExpanded ? 'max-height 1.3s ease, opacity 0.7s ease' : 'all 0.5s ease', borderTop: isExpanded ? '1px solid var(--border-line)' : 'none', overflow: 'hidden' }}>
     <div style={{ padding: '15px 0 20px 0', position: 'relative' }}>
       
       {/* ===================== واجهة الأدمن (Edit Mode) ===================== */}
       {isAdminMode ? (
         <div style={{ padding: '0 15px', display: 'flex', flexDirection: 'column', gap: '15px' }} onClick={(e)=>e.stopPropagation()}>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '5px' }}>
             <ToggleSwitch label="يوم دراسي (دوام مفتوح)" isChecked={editIsOpen} onChange={() => setEditIsOpen(!editIsOpen)} activeColor="var(--primary-color)" />
             <ToggleSwitch label="يوم امتحانات" isChecked={editIsExam} onChange={() => setEditIsExam(!editIsExam)} activeColor="#ff0000" />
           </div>
           
           <div style={{ textAlign: 'right', marginTop: '10px' }}>
             {mergedSubjects.map((subject) => {
               const hasPermission = canAdminEditSubject(subject.groups);
               const isFixed = subject.isFixed;
               
               return (
                 <div key={subject.id} style={{ 
                   display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px', 
                   backgroundColor: 'var(--card-bg-locked)', padding: '20px 16px', borderRadius: '12px', 
                   border: isFixed ? '2px solid var(--dot-bg)' : '1px dashed var(--primary-color)', position: 'relative',
                   opacity: hasPermission ? (subject.isHidden ? 0.4 : 1) : 0.6, pointerEvents: hasPermission ? 'auto' : 'none'
                 }}>
                   {/* أزرار الإخفاء/الحذف للأدمن */}
                   {hasPermission && isFixed && (
                     <button onClick={() => toggleHideFixed(subject.id)} style={{ position: 'absolute', top: '10px', left: '10px', background: subject.isHidden ? '#10b981' : '#d32f2f', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}>
                       {subject.isHidden ? 'إظهار للطالب 👁️' : 'إخفاء عن الطالب 🚫'}
                     </button>
                   )}
                   {hasPermission && !isFixed && (
                     <button onClick={() => removeDynamic(subject.id)} style={{ position: 'absolute', top: '10px', left: '10px', background: 'transparent', border: 'none', color: '#d32f2f', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>✕</button>
                   )}
                   
                   {!hasPermission && (
                     <div style={{ position: 'absolute', top: '10px', left: '10px', color: '#d32f2f', fontSize: '11px', fontWeight: 'bold', backgroundColor: 'rgba(211,47,47,0.1)', padding: '4px 8px', borderRadius: '6px' }}>مادة مشتركة (قراءة فقط)</div>
                   )}
                   
                   {isFixed && (
                     <div style={{ position: 'absolute', top: '10px', right: '10px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: 'bold' }}>📌 أساسية في الجدول</div>
                   )}
                   
                   {/* الكروبات (تعديلها مسموح فقط للإضافات الديناميكية) */}
                   <div style={{ paddingRight: '5px', marginTop: isFixed ? '20px' : '0' }}>
                     <div style={{ fontSize: '12px', color: 'var(--text-details)', marginBottom: '8px', fontWeight: 'bold' }}>الكروبات المشمولة</div>
                     <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', opacity: isFixed ? 0.7 : 1, pointerEvents: isFixed ? 'none' : 'auto' }}>
                       {groupOptions.map(grp => {
                         const isSelected = subject.groups && subject.groups.includes(grp);
                         const isShared = !subject.groups || subject.groups.length === 0;
                         const isBtnActive = isSelected || isShared;
                         return (
                           <div key={grp} onClick={() => !isFixed && toggleDynamicGroup(subject.id, grp)} style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: isFixed ? 'not-allowed' : 'pointer', backgroundColor: isBtnActive ? 'var(--primary-color)' : 'transparent', color: isBtnActive ? '#fff' : 'var(--text-muted)', border: isBtnActive ? '1px solid var(--primary-color)' : '1px solid var(--border-line)' }}>كروب {grp}</div>
                         )
                       })}
                     </div>
                   </div>

                   {/* نوع الحدث والعنوان */}
                   <div style={{ display: 'flex', gap:'10px' }}>
                     <div style={{ flex: 1 }}>
                       <div style={{ fontSize: '12px', color: 'var(--text-details)', marginBottom: '8px', fontWeight: 'bold' }}>النوع</div>
                       <select value={subject.type} onChange={(e) => isFixed ? updateFixedOverride(subject.id, 'type', e.target.value) : updateDynamic(subject.id, 'type', e.target.value)} style={{width:'100%', padding:'10px', borderRadius:'6px', background:'var(--card-bg-normal)', color:'var(--text-pure)', border:'1px solid var(--border-line)'}}>
                         {isFixed ? (
                           <>
                             <option value={subject.originalType}>{subject.originalType}</option>
                             <option value="امتحان">امتحان</option>
                           </>
                         ) : dynamicEventTypes.map(t => <option key={t} value={t}>{t}</option>)}
                       </select>
                     </div>
                     <div style={{ flex: 2 }}>
                       <div style={{ fontSize: '12px', color: 'var(--text-details)', marginBottom: '8px', fontWeight: 'bold' }}>المادة</div>
                       <select disabled={isFixed} value={subject.name} onChange={(e) => !isFixed && updateDynamic(subject.id, 'name', e.target.value)} style={{width:'100%', padding:'10px', borderRadius:'6px', background:'var(--card-bg-normal)', color: 'var(--text-pure)', border:'1px solid var(--border-line)', opacity: isFixed ? 0.7 : 1}}>
                         {isFixed ? <option value={subject.name}>{subject.name}</option> : courseSubjectsList.map(s => <option key={s} value={s}>{s}</option>)}
                       </select>
                     </div>
                   </div>
                   
                   {/* التفاصيل (مسموح للجميع تعديلها) */}
                   <div style={{ paddingRight: '5px' }}>
                     <div style={{ fontSize: '12px', color: 'var(--text-details)', marginBottom: '8px', fontWeight: 'bold' }}>إضافة ملاحظة للطلاب</div>
                     <textarea placeholder="محتوى الدرس أو الملاحظات..." value={subject.content || ''} onChange={(e) => { 
                       e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px';
                       isFixed ? updateFixedOverride(subject.id, 'content', e.target.value) : updateDynamic(subject.id, 'content', e.target.value); 
                     }} style={{ padding: '12px 14px', borderRadius: '6px', border: '1px solid var(--border-line)', backgroundColor: 'var(--card-bg-normal)', color: 'var(--text-pure)', fontFamily: 'inherit', resize: 'none', minHeight: '50px', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
                   </div>
                 </div>
               )
             })}

             <button onClick={handleAddDynamic} style={{ backgroundColor: 'transparent', color: 'var(--primary-color)', border: '1px dashed var(--primary-color)', borderRadius: '6px', padding: '10px 16px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'center' }}><span>+</span> إضافة حدث إضافي (امتحان، واجب...)</button>

           </div>
           <button onClick={handleSaveDay} style={{ marginTop: '15px', backgroundColor: 'var(--primary-color)', width: '100%', padding: '16px', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}> حفظ التعديلات لليوم</button>
         </div>
       ) : (
       /* ===================== واجهة الطالب العادية ===================== */
       <>
         {isExpanded && studentVisibleSubjects && studentVisibleSubjects.length > 0 && selectedArchive === null && (
           <div style={{ position: 'absolute', top: '0px', width: '100%', textAlign: 'center', fontSize: '12px', color: 'var(--primary-color)', animation: 'hintFadeStatic 3s forwards', pointerEvents: 'none', fontWeight: 'normal' }}>
             {user ? "اضغط مطولاً لتسجيل الحضور" : "يتطلب تسجيل الدخول لتسجيل الحضور"}
           </div>
         )}

         <div style={{ margin: '10px 0' }}>
           {studentVisibleSubjects && studentVisibleSubjects.length > 0 ? (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
               {studentVisibleSubjects.map((subj) => {
                 
                 const isSpecificExam = subj.type === 'امتحان';
                 let typeAndContentColor = isSpecificExam ? '#ff4444' : 'var(--text-details)';
                 let eventTypeColor = isSpecificExam ? '#ff4444' : 'var(--text-details)';
                 const eventType = subj.type || 'محاضرة';
                 const subjectName = subj.name || 'مادة سابقة';

                 // 🌟 استخدام id الخاص بالحدث لضمان دقة التسجيل 🌟
                 const currentEventId = `event-${currentWeek}-${day}-${subj.id}`;
                 const isMenuOpen = activeAttendanceMenu === currentEventId;
                 const eventStatus = selectedArchive === null ? userAttendance[`week_${currentWeek}`]?.[day]?.[subj.id] : null; 

                 return (
                   <div key={subj.id} 
                     className="subject-inner-card"
                     onClick={(e) => handleEventClick(e, day, isLocked)}
                     onMouseDown={(e) => handleEventPressStart(currentEventId)}
                     onMouseUp={handleEventPressEnd} onMouseLeave={handleEventPressEnd}
                     onTouchStart={(e) => handleEventPressStart(currentEventId)} onTouchEnd={handleEventPressEnd}
                     onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
                     style={{ 
                       backgroundColor: 'var(--card-bg-locked)', borderRadius: '12px', display: 'flex', flexDirection: 'column', textAlign: 'right',
                       borderRight: `4px solid ${isSpecificExam ? '#ff4444' : 'var(--text-muted)'}`, boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                       position: 'relative', overflow: 'hidden', userSelect: 'none', boxSizing: 'border-box' 
                     }}>
                       
                       {selectedArchive === null && (
                         <div style={{
                           position: 'absolute', top: 0, left: 0, right: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', padding: '0 15px', boxSizing: 'border-box', zIndex: 10,
                           transform: isMenuOpen ? 'scale(1)' : 'scale(0.9)', opacity: isMenuOpen ? 1 : 0, pointerEvents: isMenuOpen ? 'auto' : 'none', transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', backgroundColor: 'rgba(128, 128, 128, 0.1)', borderRadius: '12px'
                         }}>
                           <button onClick={(e) => { e.stopPropagation(); markAttendance(currentWeek, day, subj.id, 'present'); }} style={{ flex: 1, height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#10b981', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', transition: 'all 0.2s', WebkitTapHighlightColor: 'transparent' }}>
                             حضور <CheckIcon />
                           </button>
                           <button onClick={(e) => { e.stopPropagation(); markAttendance(currentWeek, day, subj.id, 'absent'); }} style={{ flex: 1, height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#ef4444', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', transition: 'all 0.2s', WebkitTapHighlightColor: 'transparent' }}>
                             غياب <XIcon />
                           </button>
                         </div>
                       )}

                       <div style={{ padding: '16px', opacity: isMenuOpen ? 0 : 1, transform: isMenuOpen ? 'scale(0.95)' : 'scale(1)', transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                         <span style={{ color: eventTypeColor, fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                           {eventType === 'محاضرة' && <LectureIcon />}
                           {eventType === 'مختبر' && <LabIcon />}
                           {(eventType === 'واجب' || eventType === 'تقرير') && ( <div style={{ width: '18px', height: '18px', display: 'flex' }}><AssignmentIcon /></div> )}
                           {eventType}
                           {eventStatus === 'present' && <span style={{ color: '#10b981', display: 'flex' }}><CheckIcon /></span>}
                           {eventStatus === 'absent' && <span style={{ color: '#ef4444', display: 'flex' }}><XIcon /></span>}
                         </span>
                         
                         <span style={{ color: 'var(--text-pure)', fontSize: '18px', fontWeight: 'bold', marginTop: '2px' }}>
                           {subjectName}
                         </span>
                         
                         {subj.content && !hideDetails && (
                           <span style={{ color: typeAndContentColor, fontSize: '14px', whiteSpace: 'pre-wrap', marginTop: '4px', lineHeight: '1.6' }}>
                             {subj.content}
                           </span>
                         )}
                       </div>
                   </div>
                 )
               })}
             </div>
           ) : ( <p style={{ margin: 0, whiteSpace: 'pre-wrap', color: 'var(--text-pure)' }}>فراغ</p> )}
         </div>

         <p style={{ margin: '20px 0 10px 0', fontSize: '18px', whiteSpace: 'pre-wrap', borderTop: '1px dashed var(--border-line)', paddingTop: '10px', color: 'var(--text-pure)' }}></p>
         
         {user && selectedArchive === null && isExpanded && studentVisibleSubjects && studentVisibleSubjects.length > 0 && (
           <div style={{ display: 'flex', gap: '10px', marginTop: '15px', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
             {markedCount === 0 ? (
               <>
                 <button onClick={(e) => { e.stopPropagation(); handleBulkAttendance(currentWeek, day, {subjects: studentVisibleSubjects}, 'all_present'); }} style={{ flex: 1, backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold' }}>حضور كلي</button>
                 <button onClick={(e) => { e.stopPropagation(); handleBulkAttendance(currentWeek, day, {subjects: studentVisibleSubjects}, 'all_absent'); }} style={{ flex: 1, backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold' }}>غياب كلي</button>
               </>
             ) : markedCount < totalSubjects ? (
               presentCount >= absentCount ? (
                 <button onClick={(e) => { e.stopPropagation(); handleBulkAttendance(currentWeek, day, {subjects: studentVisibleSubjects}, 'rest_absent'); }} style={{ width: '100%', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '10px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold' }}>تسجيل الباقي غياب</button>
               ) : (
                 <button onClick={(e) => { e.stopPropagation(); handleBulkAttendance(currentWeek, day, {subjects: studentVisibleSubjects}, 'rest_present'); }} style={{ width: '100%', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '10px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold' }}>تسجيل الباقي حضور</button>
               )
             ) : (
               <div style={{ width: '100%', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '5px' }}>اكتمل تسجيل هذا اليوم ✨</div>
             )}
           </div>
         )}
       </>
       )}
     </div>
   </div>
 </div>
);
}
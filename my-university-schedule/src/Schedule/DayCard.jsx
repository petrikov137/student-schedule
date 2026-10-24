import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { database } from '../firebase';
import { ref, set } from 'firebase/database';
import { courseSubjectsList, staticTimetable } from './ScheduleData/CourseConfig';

// --- الأيقونات ---
const LectureIcon = () => ( <svg width="18" height="18" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z" /></svg> );
const LabIcon = () => ( <svg width="18" height="18" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" /></svg> );
const AssignmentIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%"><path d="M11.25 5.337c0-.355-.186-.676-.401-.959a1.647 1.647 0 0 1-.349-1.003c0-1.036 1.007-1.875 2.25-1.875S15 2.34 15 3.375c0 .369-.128.713-.349 1.003-.215.283-.401.604-.401.959 0 .332.278.598.61.578 1.91-.114 3.79-.342 5.632-.676a.75.75 0 0 1 .878.645 49.17 49.17 0 0 1 .376 5.452.657.657 0 0 1-.66.664c-.354 0-.675-.186-.958-.401a1.647 1.647 0 0 0-1.003-.349c-1.035 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401.31 0 .557.262.534.571a48.774 48.774 0 0 1-.595 4.845.75.75 0 0 1-.61.61c-1.82.317-3.673.533-5.555.642a.58.58 0 0 1-.611-.581c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.035-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959a.641.641 0 0 1-.658.643 49.118 49.118 0 0 1-4.708-.36.75.75 0 0 1-.645-.878c.293-1.614.504-3.257.629-4.924A.53.53 0 0 0 5.337 15c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.036 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.369 0 .713.128 1.003.349.283.215.604.401.959.401a.656.656 0 0 0 .659-.663 47.703 47.703 0 0 0-.31-4.82.75.75 0 0 1 .83-.832c1.343.155 2.703.254 4.077.294a.64.64 0 0 0 .657-.642Z" /></svg> );
const CheckIcon = () => ( <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> );
const XIcon = () => ( <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> );

const ToggleSwitch = ({ label, isChecked, onChange, activeColor, children }) => (
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: 'var(--card-bg-locked)', borderRadius: '12px', border: '1px solid var(--border-line)' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
   <span style={{ color: 'var(--text-pure)', fontWeight: 'bold', fontSize: '15px', whiteSpace: 'nowrap' }}>{label}</span>
   {children && <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>{children}</div>}
 </div>
 <div onClick={onChange} style={{ flexShrink: 0, marginLeft: '10px', width: '46px', height: '24px', backgroundColor: isChecked ? activeColor : 'var(--dot-bg)', borderRadius: '15px', position: 'relative', transition: 'background-color 0.3s', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
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
const [fixedOverrides, setFixedOverrides] = useState({}); 
const [dynamicEvents, setDynamicEvents] = useState([]); 
const [editOpenGroups, setEditOpenGroups] = useState([]); // مصفوفة الكروبات المفتوحة دراسياً
const [editExamGroups, setEditExamGroups] = useState([]); // مصفوفة الكروبات المحددة كامتحانات

// 🌟 حالات النافذة العائمة للتعديل على محاضرة منفردة 🌟
const [editingSubjectId, setEditingSubjectId] = useState(null);
const [modalDraft, setModalDraft] = useState(null);

useEffect(() => {
 if (dayInfo) {
   setFixedOverrides(dayInfo.fixedOverrides || {});
   setDynamicEvents(dayInfo.dynamicEvents || []);
   // التوافق مع البيانات القديمة (إذا كان true يتم تفعيل جميع الكروبات)
   setEditOpenGroups(dayInfo.openGroups || (dayInfo.isOpen === true ? ['A', 'B', 'C', 'D'] : []));
   setEditExamGroups(dayInfo.examGroups || (dayInfo.isExam === true ? ['A', 'B', 'C', 'D'] : []));
 } else {
   setFixedOverrides({});
   setDynamicEvents([]);
   setEditOpenGroups([]); 
   setEditExamGroups([]);
 }
}, [dayInfo, isExpanded]);

useEffect(() => {
 if (!isAdminMode || !isExpanded) {
   setEditingSubjectId(null);
   setModalDraft(null);
 }
}, [isAdminMode, isExpanded]);

const canAdminEditSubject = (subjGroups) => {
 if (userRole === 'super_admin' || !userRole) return true;
 const adminGroup = userRole.split('_')[1]?.toUpperCase(); 
 if (!subjGroups || subjGroups.length === 0) return false; 
 return subjGroups.includes(adminGroup);
};

// 🌟 دمج الجدول الثابت مع تعديلات الأدمن للعرض 🌟
const mergedSubjects = useMemo(() => {
 const staticForDay = staticTimetable[day] || [];
 const list = [];

 if (activeGroup === 'X') {
   const groupedBySubject = new Map();

   staticForDay.forEach(staticSubj => {
     const key = `${staticSubj.name}_${staticSubj.type}`;
     if (!groupedBySubject.has(key)) {
       groupedBySubject.set(key, {
         ...staticSubj,
         targetIds: [staticSubj.id],
         groups: [...(staticSubj.groups || [])]
       });
     } else {
       const existing = groupedBySubject.get(key);
       existing.targetIds.push(staticSubj.id);
       if (staticSubj.groups) {
         existing.groups = Array.from(new Set([...existing.groups, ...staticSubj.groups]));
       }
     }
   });

   groupedBySubject.forEach(groupedSubj => {
     const overrides = groupedSubj.targetIds.map(id => fixedOverrides[id] || {});
     const allHidden = overrides.length > 0 && overrides.every(o => o.isHidden);
     if (allHidden && !isAdminMode) return;

     const firstWithContent = overrides.find(o => o.content !== undefined && o.content !== "");
     const firstWithType = overrides.find(o => o.type !== undefined);

     list.push({
       ...groupedSubj,
       type: firstWithType ? firstWithType.type : groupedSubj.type,
       content: firstWithContent ? firstWithContent.content : (groupedSubj.content || ""),
       isHidden: allHidden,
       isFixed: true,
       originalType: groupedSubj.type
     });
   });
 } else {
   staticForDay.forEach(staticSubj => {
     const isVisibleForGroup = !staticSubj.groups || staticSubj.groups.length === 0 || staticSubj.groups.includes(activeGroup);
     if (!isVisibleForGroup) return;

     const override = fixedOverrides[staticSubj.id] || {};
     
     if (override.isHidden && !isAdminMode) return;

     list.push({
       ...staticSubj,
       targetIds: [staticSubj.id],
       type: override.type || staticSubj.type,
       content: override.content !== undefined ? override.content : (staticSubj.content || ""),
       isHidden: override.isHidden || false,
       isFixed: true,
       originalType: staticSubj.type
     });
   });
 }

 dynamicEvents.forEach(dynSubj => {
   const isVisibleForGroup = activeGroup === 'X' || !dynSubj.groups || dynSubj.groups.length === 0 || dynSubj.groups.includes(activeGroup);
   if (isVisibleForGroup) {
     list.push({ ...dynSubj, isFixed: false });
   }
 });

 return list;
}, [day, activeGroup, fixedOverrides, dynamicEvents, isAdminMode]);

// ---------- دوال تحكم الإدارة لليوم الدراسي والامتحانات ----------

const toggleOpenGroup = (grp) => {
 setEditOpenGroups(prev => prev.includes(grp) ? prev.filter(g => g !== grp) : [...prev, grp]);
};

const toggleExamGroup = (grp) => {
 setEditExamGroups(prev => prev.includes(grp) ? prev.filter(g => g !== grp) : [...prev, grp]);
};

// ---------- دوال تحكم الإدارة للمحاضرات ----------

const handleAddDynamic = (e) => {
 e.stopPropagation();
 let defaultGroups = [];
 if (activeGroup && activeGroup !== 'X') {
   defaultGroups = [activeGroup];
 } else if (userRole && userRole.startsWith('admin_') && userRole !== 'super_admin') {
   defaultGroups = [userRole.split('_')[1].toUpperCase()];
 }
 const newId = `dynamic_${Date.now()}`;
 const newEvent = { id: newId, type: "امتحان", name: courseSubjectsList[0], content: "", groups: defaultGroups };
 setDynamicEvents(prev => [...prev, newEvent]);
 setEditingSubjectId(newId);
 setModalDraft({ ...newEvent, isFixed: false });
};

const removeDynamic = (dynId) => {
 setDynamicEvents(prev => prev.filter(ev => ev.id !== dynId));
};

const openSubjectModal = (subject, e) => {
 if (e) e.stopPropagation();
 const hasPermission = canAdminEditSubject(subject.groups);
 if (!hasPermission) {
   showToast("هذه مادة مشتركة (للقراءة فقط)", "error");
   return;
 }
 setEditingSubjectId(subject.id);
 setModalDraft({
   ...subject,
   groups: [...(subject.groups || [])],
   targetIds: subject.targetIds ? [...subject.targetIds] : [subject.id]
 });
};

const closeSubjectModal = (e) => {
 if (e) e.stopPropagation();
 setEditingSubjectId(null);
 setModalDraft(null);
};

const toggleDraftGroup = (grp) => {
 setModalDraft(prev => {
   if (!prev) return prev;
   let currentGroups = [...(prev.groups || [])];
   if (currentGroups.includes(grp)) {
     currentGroups = currentGroups.filter(g => g !== grp);
   } else {
     currentGroups.push(grp);
   }
   return { ...prev, groups: currentGroups };
 });
};

const handleSaveSubjectModal = (e) => {
 if (e) e.stopPropagation();
 if (!modalDraft) return;

 if (modalDraft.isFixed) {
   const ids = Array.isArray(modalDraft.targetIds) ? modalDraft.targetIds : [modalDraft.id];
   setFixedOverrides(prev => {
     const next = { ...prev };
     ids.forEach(id => {
       next[id] = {
         ...prev[id],
         type: modalDraft.type,
         content: modalDraft.content,
         isHidden: modalDraft.isHidden
       };
     });
     return next;
   });
 } else {
   setDynamicEvents(prev => prev.map(ev => ev.id === modalDraft.id ? {
     ...ev,
     type: modalDraft.type,
     name: modalDraft.name,
     content: modalDraft.content,
     groups: modalDraft.groups
   } : ev));
 }

 setEditingSubjectId(null);
 setModalDraft(null);
};

const handleDeleteFromModal = (e) => {
 if (e) e.stopPropagation();
 if (!modalDraft) return;
 removeDynamic(modalDraft.id);
 setEditingSubjectId(null);
 setModalDraft(null);
};

const handleSaveDay = async (e) => {
 e.stopPropagation();
 try {
   await set(ref(database, `week_${currentWeek}/${day}`), {
     isOpen: editOpenGroups.length > 0, // لضمان التوافق مع الكود القديم
     isExam: editExamGroups.length > 0, // لضمان التوافق مع الكود القديم
     openGroups: editOpenGroups,
     examGroups: editExamGroups,
     fixedOverrides: fixedOverrides,
     dynamicEvents: dynamicEvents,
     lastUpdated: Date.now()
   });
   showToast(`تم حفظ تحديثات يوم ${day} بنجاح`, "success");
 } catch (error) {
   showToast("حدث خطأ أثناء الحفظ", "error");
 }
};

// ---------- حسابات الحضور والحالة التلقائية للبطاقة ----------
const studentVisibleSubjects = mergedSubjects.filter(s => !s.isHidden && (activeGroup === 'X' || !s.groups || s.groups.length === 0 || s.groups.includes(activeGroup)));
const isActuallyEmptyForGroup = studentVisibleSubjects.length === 0;

let dayAttendance = {};
let markedCount = 0; let presentCount = 0; let absentCount = 0; let totalSubjects = 0;

if (isExpanded && user && selectedArchive === null) {
 dayAttendance = userAttendance[`week_${currentWeek}`]?.[day] || {};
 totalSubjects = studentVisibleSubjects.length;
 
 studentVisibleSubjects.forEach(subj => {
   if (dayAttendance[subj.id]) {
     markedCount++;
     if (dayAttendance[subj.id] === 'present') presentCount++;
     if (dayAttendance[subj.id] === 'absent') absentCount++;
   }
 });
}

// حساب ما إذا كان اليوم مفتوحاً للكروب المحدد
let groupIsOpen = false;
let groupIsExam = false;
if (activeGroup === 'X') {
 groupIsOpen = dayInfo?.openGroups ? dayInfo.openGroups.length > 0 : (dayInfo?.isOpen === true);
 groupIsExam = dayInfo?.examGroups ? dayInfo.examGroups.length > 0 : (dayInfo?.isExam === true);
} else {
 groupIsOpen = dayInfo?.openGroups ? dayInfo.openGroups.includes(activeGroup) : (dayInfo?.isOpen === true);
 groupIsExam = dayInfo?.examGroups ? dayInfo.examGroups.includes(activeGroup) : (dayInfo?.isExam === true);
}

// الإغلاق التلقائي: يغلق اليوم إذا لم يتم تحديده للأدمن كدوام، أو إذا كان فارغاً تماماً من المحاضرات
const finalIsLocked = !groupIsOpen || isActuallyEmptyForGroup;
const finalIsExam = groupIsExam;

// حالة التعديل الحية للأدمن أثناء فتح البطاقة
let currentEditIsOpen = false;
let currentEditIsExam = false;
if (activeGroup === 'X') {
 currentEditIsOpen = editOpenGroups.length > 0;
 currentEditIsExam = editExamGroups.length > 0;
} else {
 currentEditIsOpen = editOpenGroups.includes(activeGroup);
 currentEditIsExam = editExamGroups.includes(activeGroup);
}

const effectiveIsLocked = (isAdminMode && isExpanded) ? !currentEditIsOpen : finalIsLocked;
const effectiveIsExam = (isAdminMode && isExpanded) ? currentEditIsExam : finalIsExam;
const nonExamColor = (!finalIsExam && statusColor !== '#ff0000d1') ? statusColor : 'var(--primary-color)';
const effectiveStatusColor = effectiveIsExam ? '#ff0000d1' : nonExamColor;

return (
 <>
 <style>{`
   @keyframes adminModalBackdropIn {
     from { opacity: 0; }
     to { opacity: 1; }
   }
   @keyframes adminModalCardIn {
     from { opacity: 0; transform: translateY(24px) scale(0.95); }
     to { opacity: 1; transform: translateY(0) scale(1); }
   }
 `}</style>

 <div 
   className={`day-card ${isExpanded ? 'expanded' : ''} schedule-day-box`}
   onClick={(e) => toggleDay(day, (effectiveIsLocked && !isAdminMode), e)}
   style={{
     opacity: effectiveIsLocked ? 0.6 : 1,
     cursor: (effectiveIsLocked && !isAdminMode) ? 'default' : 'pointer',
     ...(showNotification && !isAdminMode ? {
       backgroundImage: 'linear-gradient(270deg, var(--notify-1), var(--notify-2), var(--notify-3), var(--notify-1))', backgroundSize: '400% 400%', animation: 'gradientFadeMove 3s ease infinite', borderTop: '1px solid var(--border-line)', borderBottom: '1px solid var(--border-line)', borderRight: '1px solid var(--border-line)'
     } : { backgroundColor: effectiveIsLocked ? 'var(--card-bg-locked)' : (isExpanded ? 'var(--card-bg-expanded)' : 'var(--card-bg-normal)') }),
     borderLeft: (effectiveIsLocked && !(isAdminMode && isExpanded && effectiveIsExam)) ? '5px solid var(--dot-bg)' : `5px solid ${effectiveStatusColor}`,
     outline: (isAdminMode && isExpanded) ? '1px dashed var(--primary-color)' : 'none', outlineOffset: '-1px',
     transition: 'opacity 0.3s ease, border-color 0.3s ease, background-color 0.3s ease'
   }}
 >
   <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
     <h3 style={{ margin: 0, fontSize: '18px', color: effectiveIsLocked ? 'var(--text-muted)' : 'var(--text-pure)' }}>
       {day} {effectiveIsExam && !effectiveIsLocked && !isExpanded ? '!!' : ''}
       {isAdminMode && isExpanded && <span style={{fontSize:'12px', color:'var(--primary-color)', marginRight:'10px'}}>تعديل ({activeGroup === 'X' ? 'الكل X' : `كروب ${activeGroup}`})</span>}
     </h3>
     <span style={{ fontSize: '14px', color: (effectiveIsLocked && !(isAdminMode && isExpanded && effectiveIsExam)) ? 'var(--text-muted)' : (isExpanded ? effectiveStatusColor : 'var(--text-main)'), backgroundColor: isExpanded ? `${effectiveStatusColor}1a` : 'transparent', padding: '4px 10px', borderRadius: '8px', fontWeight: 'bold', transition: 'all 0.3s ease' }}>{dateString}</span>
   </div>
   
   <div style={{ maxHeight: isExpanded ? '5000px' : '0px', opacity: isExpanded ? 1 : 0, transition: isExpanded ? 'max-height 1.3s ease, opacity 0.7s ease' : 'all 0.5s ease', borderTop: isExpanded ? '1px solid var(--border-line)' : 'none', overflow: 'hidden' }}>
     <div style={{ padding: '15px 0 20px 0', position: 'relative' }}>
       
       {/* ===================== واجهة الأدمن (Edit Mode) ===================== */}
       {isAdminMode ? (
         <div style={{ padding: '0 15px', display: 'flex', flexDirection: 'column', gap: '15px' }} onClick={(e)=>e.stopPropagation()}>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '5px' }}>
             <ToggleSwitch label="يوم دراسي" isChecked={editOpenGroups.length > 0} onChange={() => setEditOpenGroups(editOpenGroups.length > 0 ? [] : ['A', 'B', 'C', 'D'])} activeColor="var(--primary-color)">
                {groupOptions.map(grp => (
                  <span key={grp} onClick={(e) => { e.stopPropagation(); toggleOpenGroup(grp); }} style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: editOpenGroups.includes(grp) ? 'var(--primary-color)' : 'transparent', color: editOpenGroups.includes(grp) ? '#fff' : 'var(--text-muted)', border: editOpenGroups.includes(grp) ? '1px solid var(--primary-color)' : '1px solid var(--border-line)', transition: 'all 0.2s ease' }}>{grp}</span>
                ))}
             </ToggleSwitch>

             <ToggleSwitch label="يوم امتحانات" isChecked={editExamGroups.length > 0} onChange={() => setEditExamGroups(editExamGroups.length > 0 ? [] : ['A', 'B', 'C', 'D'])} activeColor="#ff0000">
                {groupOptions.map(grp => (
                  <span key={grp} onClick={(e) => { e.stopPropagation(); toggleExamGroup(grp); }} style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: editExamGroups.includes(grp) ? '#ef4444' : 'transparent', color: editExamGroups.includes(grp) ? '#fff' : 'var(--text-muted)', border: editExamGroups.includes(grp) ? '1px solid #ef4444' : '1px solid var(--border-line)', transition: 'all 0.2s ease' }}>{grp}</span>
                ))}
             </ToggleSwitch>
           </div>
           
           <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '5px' }}>
             {mergedSubjects.map((subject) => {
               const hasPermission = canAdminEditSubject(subject.groups);
               const isFixed = subject.isFixed;
               const isSpecificExam = subject.type === 'امتحان';
               const eventType = subject.type || 'محاضرة';
               const subjectName = subject.name || 'مادة سابقة';
               const typeAndContentColor = isSpecificExam ? '#ff4444' : 'var(--text-details)';
               const eventTypeColor = isSpecificExam ? '#ff4444' : 'var(--text-details)';
               
               return (
                 <div 
                   key={subject.id} 
                   className="subject-inner-card"
                   onClick={(e) => openSubjectModal(subject, e)}
                   style={{ 
                     backgroundColor: 'var(--card-bg-locked)', 
                     borderRadius: '12px', 
                     display: 'flex', 
                     flexDirection: 'column', 
                     textAlign: 'right',
                     borderRight: `4px solid ${subject.isHidden ? '#ef4444' : (isSpecificExam ? '#ff4444' : 'var(--primary-color)')}`, 
                     borderTop: isFixed ? '1px solid transparent' : '1px dashed var(--border-line)',
                     borderBottom: isFixed ? '1px solid transparent' : '1px dashed var(--border-line)',
                     borderLeft: isFixed ? '1px solid transparent' : '1px dashed var(--border-line)',
                     boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                     position: 'relative', 
                     overflow: 'hidden', 
                     userSelect: 'none', 
                     boxSizing: 'border-box',
                     cursor: hasPermission ? 'pointer' : 'not-allowed',
                     opacity: hasPermission ? (subject.isHidden ? 0.5 : 1) : 0.6,
                     transition: 'transform 0.2s ease, opacity 0.3s ease, box-shadow 0.2s ease'
                   }}
                 >
                   <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                     
                     <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                       <span style={{ color: eventTypeColor, fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                         {eventType === 'محاضرة' && <LectureIcon />}
                         {eventType === 'مختبر' && <LabIcon />}
                         {(eventType === 'واجب' || eventType === 'تقرير') && ( <div style={{ width: '18px', height: '18px', display: 'flex' }}><AssignmentIcon /></div> )}
                         {eventType}
                       </span>

                       <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                         {subject.isHidden && (
                           <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.12)', padding: '3px 8px', borderRadius: '6px' }}>
                             مخفية عن الطلاب
                           </span>
                         )}
                         {!hasPermission ? (
                           <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.12)', padding: '3px 8px', borderRadius: '6px' }}>
                             قراءة فقط
                           </span>
                         ) : (
                           <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', backgroundColor: 'var(--card-bg-normal)', padding: '3px 8px', borderRadius: '6px', border: '1px solid var(--border-line)' }}>
                             {subject.groups && subject.groups.length > 0 ? subject.groups.join(' ') : 'الكل'}
                           </span>
                         )}
                       </div>
                     </div>
                     
                     <span style={{ color: 'var(--text-pure)', fontSize: '18px', fontWeight: 'bold', marginTop: '2px', textDecoration: subject.isHidden ? 'line-through' : 'none' }}>
                       {subjectName}
                     </span>
                     
                     {subject.content && (
                       <span style={{ color: typeAndContentColor, fontSize: '14px', whiteSpace: 'pre-wrap', marginTop: '4px', lineHeight: '1.6' }}>
                         {subject.content}
                       </span>
                     )}
                   </div>
                 </div>
               )
             })}

             <div 
               onClick={handleAddDynamic}
               className="subject-inner-card"
               style={{ 
                 backgroundColor: 'transparent', 
                 border: '1.5px dashed var(--primary-color)', 
                 borderRadius: '12px', 
                 minHeight: '68px',
                 display: 'flex', 
                 alignItems: 'center', 
                 justifyContent: 'center', 
                 cursor: 'pointer',
                 color: 'var(--primary-color)',
                 fontSize: '28px',
                 fontWeight: '300',
                 lineHeight: 1,
                 userSelect: 'none',
                 transition: 'all 0.25s ease',
                 WebkitTapHighlightColor: 'transparent'
               }}
               onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--card-bg-locked)'; e.currentTarget.style.transform = 'scale(0.99)'; }}
               onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.transform = 'scale(1)'; }}
             >
               +
             </div>

           </div>
           <button onClick={handleSaveDay} style={{ marginTop: '10px', backgroundColor: 'var(--primary-color)', width: '100%', padding: '16px', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', WebkitTapHighlightColor: 'transparent' }}> حفظ التعديلات لليوم</button>
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
               <div style={{ width: '100%', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '5px' }}>اكتمل تسجيل هذا اليوم </div>
             )}
           </div>
         )}
       </>
       )}
     </div>
   </div>
 </div>

 {/* 🌟 النافذة العائمة الفاخرة للتعديل على المحاضرة (Admin Subject Modal) 🌟 */}
 {isAdminMode && editingSubjectId && modalDraft && typeof document !== 'undefined' ? createPortal(
   <div 
     onClick={closeSubjectModal}
     style={{
       position: 'fixed',
       top: 0, left: 0, right: 0, bottom: 0,
       width: '100vw', height: '100vh',
       backgroundColor: 'rgba(0, 0, 0, 0.55)',
       backdropFilter: 'blur(18px)',
       WebkitBackdropFilter: 'blur(18px)',
       zIndex: 100000,
       display: 'flex',
       alignItems: 'center',
       justifyContent: 'center',
       padding: '20px',
       boxSizing: 'border-box',
       direction: 'rtl',
       animation: 'adminModalBackdropIn 0.25s ease forwards'
     }}
   >
     <div 
       onClick={(e) => e.stopPropagation()}
       style={{
         width: '100%',
         maxWidth: '430px',
         maxHeight: '88vh',
         overflowY: 'auto',
         backgroundColor: 'var(--card-bg-normal)',
         border: '1px solid var(--border-line)',
         borderRadius: '24px',
         padding: '24px 20px',
         boxShadow: '0 25px 60px rgba(0, 0, 0, 0.45)',
         display: 'flex',
         flexDirection: 'column',
         gap: '18px',
         textAlign: 'right',
         position: 'relative',
         animation: 'adminModalCardIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards'
       }}
     >
       {/* رأس النافذة */}
       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-line)', paddingBottom: '14px' }}>
         <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
           <span style={{ fontSize: '12px', color: 'var(--primary-color)', fontWeight: 'bold' }}>
             {modalDraft.isFixed ? 'محاضرة في الجدول' : 'حدث إضافي مخصص'}
           </span>
           <h3 style={{ margin: 0, fontSize: '20px', color: 'var(--text-pure)', fontWeight: 'bold' }}>
             {modalDraft.name}
           </h3>
         </div>

         <button 
           onClick={closeSubjectModal}
           style={{
             width: '34px', height: '34px', borderRadius: '50%',
             backgroundColor: 'var(--card-bg-locked)', color: 'var(--text-pure)',
             border: '1px solid var(--border-line)', cursor: 'pointer',
             display: 'flex', alignItems: 'center', justifyContent: 'center',
             fontSize: '14px', fontWeight: 'bold', WebkitTapHighlightColor: 'transparent'
           }}
         >
           ✕
         </button>
       </div>

       {/* حالة الظهور للمواد الأساسية أو زر الحذف للمواد الإضافية */}
       {modalDraft.isFixed ? (
         <div 
           onClick={() => setModalDraft(prev => ({ ...prev, isHidden: !prev.isHidden }))}
           style={{
             display: 'flex', alignItems: 'center', justifyContent: 'space-between',
             padding: '12px 16px', borderRadius: '14px',
             backgroundColor: modalDraft.isHidden ? 'rgba(239, 68, 68, 0.1)' : 'var(--card-bg-locked)',
             border: modalDraft.isHidden ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid var(--border-line)',
             cursor: 'pointer', transition: 'all 0.25s ease'
           }}
         >
           <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
             <span style={{ fontSize: '14px', fontWeight: 'bold', color: modalDraft.isHidden ? '#ef4444' : 'var(--text-pure)' }}>
               {modalDraft.isHidden ? 'المحاضرة مخفية عن الطلاب' : 'المحاضرة مرئية للطلاب'}
             </span>
             <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
               اضغط لتبديل حالة ظهور هذه المحاضرة
             </span>
           </div>
           <div style={{
             padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold',
             backgroundColor: modalDraft.isHidden ? '#10b981' : '#ef4444', color: '#fff'
           }}>
             {modalDraft.isHidden ? 'إظهار' : 'إخفاء'}
           </div>
         </div>
       ) : (
         <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
           <button 
             onClick={handleDeleteFromModal}
             style={{
               backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#ef4444',
               border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: '10px',
               padding: '8px 14px', fontSize: '13px', fontWeight: 'bold',
               cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
             }}
           >
             حذف هذا الحدث نهائياً
           </button>
         </div>
       )}

       {/* الكروبات المشمولة */}
       <div>
         <div style={{ fontSize: '12px', color: 'var(--text-details)', marginBottom: '8px', fontWeight: 'bold' }}>
           الكروبات المشمولة
         </div>
         <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', opacity: modalDraft.isFixed ? 0.65 : 1, pointerEvents: modalDraft.isFixed ? 'none' : 'auto' }}>
           {groupOptions.map(grp => {
             const isSelected = modalDraft.groups && modalDraft.groups.includes(grp);
             const isShared = !modalDraft.groups || modalDraft.groups.length === 0;
             const isBtnActive = isSelected || isShared;
             return (
               <div 
                 key={grp} 
                 onClick={() => !modalDraft.isFixed && toggleDraftGroup(grp)} 
                 style={{ 
                   flex: 1, minWidth: '65px', textAlign: 'center',
                   padding: '8px 10px', borderRadius: '10px', fontSize: '13px', fontWeight: 'bold', 
                   cursor: modalDraft.isFixed ? 'not-allowed' : 'pointer', 
                   backgroundColor: isBtnActive ? 'var(--primary-color)' : 'var(--card-bg-locked)', 
                   color: isBtnActive ? '#fff' : 'var(--text-muted)', 
                   border: isBtnActive ? '1px solid var(--primary-color)' : '1px solid var(--border-line)',
                   transition: 'all 0.2s ease'
                 }}
               >
                 كروب {grp}
               </div>
             )
           })}
         </div>
       </div>

       {/* نوع الحدث واختيار المادة */}
       <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
         <div>
           <div style={{ fontSize: '12px', color: 'var(--text-details)', marginBottom: '8px', fontWeight: 'bold' }}>نوع الحدث</div>
           <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
             {(modalDraft.isFixed ? [modalDraft.originalType, "امتحان"] : dynamicEventTypes).map(t => {
               const isTypeActive = modalDraft.type === t;
               return (
                 <div 
                   key={t}
                   onClick={() => setModalDraft(prev => ({ ...prev, type: t }))}
                   style={{
                     flex: 1, minWidth: '75px', textAlign: 'center',
                     padding: '9px 12px', borderRadius: '10px', fontSize: '13px', fontWeight: 'bold',
                     cursor: 'pointer',
                     backgroundColor: isTypeActive ? (t === 'امتحان' ? '#ef4444' : 'var(--primary-color)') : 'var(--card-bg-locked)',
                     color: isTypeActive ? '#fff' : 'var(--text-pure)',
                     border: isTypeActive ? `1px solid ${t === 'امتحان' ? '#ef4444' : 'var(--primary-color)'}` : '1px solid var(--border-line)',
                     transition: 'all 0.2s ease'
                   }}
                 >
                   {t}
                 </div>
               );
             })}
           </div>
         </div>

         {!modalDraft.isFixed && (
           <div>
             <div style={{ fontSize: '12px', color: 'var(--text-details)', marginBottom: '8px', fontWeight: 'bold' }}>اختر المادة</div>
             <select 
               value={modalDraft.name} 
               onChange={(e) => setModalDraft(prev => ({ ...prev, name: e.target.value }))} 
               style={{
                 width: '100%', padding: '12px 14px', borderRadius: '12px', 
                 backgroundColor: 'var(--card-bg-locked)', color: 'var(--text-pure)', 
                 border: '1px solid var(--border-line)', fontSize: '15px', fontWeight: 'bold', outline: 'none'
               }}
             >
               {courseSubjectsList.map(s => <option key={s} value={s}>{s}</option>)}
             </select>
           </div>
         )}
       </div>

       {/* تفاصيل وملاحظات المحاضرة */}
       <div>
         <div style={{ fontSize: '12px', color: 'var(--text-details)', marginBottom: '8px', fontWeight: 'bold' }}>تفاصيل أو ملاحظات للطلاب</div>
         <textarea 
           placeholder="اكتب محتوى المحاضرة، رقم القاعة، أو تفاصيل الامتحان/الواجب هنا..." 
           value={modalDraft.content || ''} 
           onChange={(e) => setModalDraft(prev => ({ ...prev, content: e.target.value }))} 
           style={{ 
             padding: '14px', borderRadius: '14px', border: '1px solid var(--border-line)', 
             backgroundColor: 'var(--card-bg-locked)', color: 'var(--text-pure)', 
             fontFamily: 'inherit', resize: 'vertical', minHeight: '95px', fontSize: '14px', 
             outline: 'none', width: '100%', boxSizing: 'border-box', lineHeight: '1.6'
           }} 
         />
       </div>

       {/* أزرار الحفظ والإلغاء للمحاضرة */}
       <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
         <button 
           onClick={handleSaveSubjectModal}
           style={{
             flex: 2, backgroundColor: 'var(--primary-color)', color: '#fff',
             border: 'none', borderRadius: '12px', padding: '14px',
             fontSize: '15px', fontWeight: 'bold', cursor: 'pointer',
             boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)', WebkitTapHighlightColor: 'transparent'
           }}
         >
           حفظ التغييرات للمحاضرة
         </button>
         <button 
           onClick={closeSubjectModal}
           style={{
             flex: 1, backgroundColor: 'var(--card-bg-locked)', color: 'var(--text-muted)',
             border: '1px solid var(--border-line)', borderRadius: '12px', padding: '14px',
             fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', WebkitTapHighlightColor: 'transparent'
           }}
         >
           إلغاء
         </button>
       </div>

     </div>
   </div>,
   document.body
 ) : null}
 </>
);
}
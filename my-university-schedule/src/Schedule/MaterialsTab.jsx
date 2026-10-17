import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ref, set, remove } from 'firebase/database';
import { database } from '../firebase';

// --- 🎨 أيقونات التحكم المصغرة للأدمن ---
const EditIcon = () => (
  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#f59e0b" strokeWidth={2.2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={2.2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

// --- 🧠 دوال معالجة روابط Google Drive الذكية ---

// 1. استخراج معرف الملف (File ID) من أي صيغة رابط درايف
const extractDriveFileId = (url) => {
  if (!url) return null;
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
};

// 2. توليد رابط التحميل المباشر الإجباري لجميع الأنظمة
const getDirectDownloadUrl = (url) => {
  const fileId = extractDriveFileId(url);
  if (fileId) {
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }
  return url;
};

// 3. توليد رابط العرض النظيف السريع
const getPreviewUrl = (url) => {
  const fileId = extractDriveFileId(url);
  if (fileId) {
    return `https://drive.google.com/file/d/${fileId}/view`;
  }
  return url;
};

// 4. صياغة نص عدد الملفات بالعربية بشكل سليم
const formatFilesCount = (count) => {
  if (count === 0) return 'لا يوجد';
  if (count === 1) return 'ملف واحد';
  if (count === 2) return 'ملفان';
  if (count >= 3 && count <= 10) return `${count} ملفات`;
  return `${count} ملف`;
};

export default function MaterialsTab({ 
  availableSubjects = [], 
  selectedSubject, 
  setSelectedSubject, 
  activeMaterialsData = {}, 
  isAdminMode = false,
  userRole = null,
  selectedArchive = null,
  showToast = () => {} 
}) {
  // 🌟 السماح للأدمن بالتعديل في تبويب الملازم مباشرة إذا لم يكن في الأرشيف 🌟
  const canEdit = (isAdminMode || (userRole && userRole !== 'student')) && !selectedArchive;

  // حالات النافذة المنبثقة (Modal) للإضافة والتعديل والحذف
  const [modalState, setModalState] = useState({ isOpen: false, mode: null, subject: null, item: null });
  const [matName, setMatName] = useState('');
  const [matUrl, setMatUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const toggleSubjectCard = (subjName) => {
    setSelectedSubject(selectedSubject === subjName ? null : subjName);
  };

  // --- دوال فتح وإغلاق النوافذ للأدمن ---
  const openAddModal = (subjName, e) => {
    e.stopPropagation();
    setMatName('');
    setMatUrl('');
    setModalState({ isOpen: true, mode: 'add', subject: subjName, item: null });
  };

  const openEditModal = (subjName, item, e) => {
    e.stopPropagation();
    setMatName(item.name || '');
    setMatUrl(item.originalUrl || item.url || '');
    setModalState({ isOpen: true, mode: 'edit', subject: subjName, item });
  };

  const openDeleteModal = (subjName, item, e) => {
    e.stopPropagation();
    setModalState({ isOpen: true, mode: 'delete', subject: subjName, item });
  };

  const closeModal = () => {
    if (isProcessing) return;
    setModalState({ isOpen: false, mode: null, subject: null, item: null });
    setMatName('');
    setMatUrl('');
  };

  // --- حفظ أو تعديل الملزمة في Firebase ---
  const handleSaveMaterial = async () => {
    if (!matName.trim() || !matUrl.trim()) {
      return showToast('يرجى إدخال اسم الملزمة والرابط', 'error');
    }

    setIsProcessing(true);
    const { mode, subject, item } = modalState;
    const id = mode === 'edit' && item?.id ? item.id : `mat_${Date.now()}`;
    
    const payload = {
      id,
      name: matName.trim(),
      url: matUrl.trim(),
      timestamp: mode === 'edit' && item?.timestamp ? item.timestamp : Date.now()
    };

    try {
      await set(ref(database, `materials/${subject}/${id}`), payload);
      showToast(mode === 'edit' ? '✅ تم تحديث اسم/رابط الملزمة' : '✅ تمت إضافة الملزمة بنجاح');
      closeModal();
    } catch (error) {
      showToast('❌ حدث خطأ أثناء الحفظ', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // --- حذف الملزمة من Firebase ---
  const handleConfirmDelete = async () => {
    const { subject, item } = modalState;
    if (!subject || !item) return;

    setIsProcessing(true);
    try {
      await remove(ref(database, `materials/${subject}/${item.id}`));
      showToast('🗑️ تم حذف الملزمة');
      closeModal();
    } catch (error) {
      showToast('❌ فشل الحذف', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // --- ⚡ دالة التحميل المباشر الفوري لجميع الأجهزة ⚡ ---
  const triggerDirectDownload = (rawUrl, fileName, e) => {
    e.stopPropagation();
    const directUrl = getDirectDownloadUrl(rawUrl);

    // إنشاء عنصر رابط مخفي لتحفيز مدير التحميل في المتصفح/الهاتف فوراً
    const link = document.createElement('a');
    link.href = directUrl;
    link.setAttribute('download', fileName || 'file');
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- 👁️ دالة العرض السريع ---
  const triggerPreview = (rawUrl, e) => {
    e.stopPropagation();
    const previewUrl = getPreviewUrl(rawUrl);
    window.open(previewUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="week-animate" style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '30px' }}>
      
      <style>
        {`
          @keyframes modalBackdropFade { from { opacity: 0; } to { opacity: 1; } }
          @keyframes modalPopIn { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
          .mat-action-btn:active { transform: scale(0.94); }
        `}
      </style>

      {availableSubjects.map((subj, idx) => {
        const subjName = typeof subj === 'object' ? (subj.name || subj.id) : subj;
        const rawMaterials = activeMaterialsData?.[subjName] || {};
        
        // تحويل الكائن أو المصفوفة إلى مصفوفة مرتبة
        const materialsList = Object.entries(rawMaterials).map(([key, val]) => ({
          ...val,
          id: val.id || key
        })).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

        const count = materialsList.length;
        const isExpanded = selectedSubject === subjName;

        return (
          <div 
            key={idx}
            className="day-card schedule-day-box"
            style={{
              backgroundColor: isExpanded ? 'var(--card-bg-expanded)' : 'var(--card-bg-normal)',
              borderRadius: '14px',
              borderTop: '1px solid var(--border-line)',
              borderRight: '1px solid var(--border-line)',
              borderBottom: '1px solid var(--border-line)',
              borderLeft: '5px solid var(--primary-color)', // الشريط السماوي الجانبي المطابق للصورة 1
              overflow: 'hidden',
              transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
              boxShadow: isExpanded ? '0 8px 25px rgba(0, 0, 0, 0.25)' : '0 4px 10px rgba(0, 0, 0, 0.1)'
            }}
          >
            {/* 🌟 رأس البطاقة (يظهر دائماً) 🌟 */}
            <div 
              onClick={() => toggleSubjectCard(subjName)}
              style={{
                padding: '18px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                direction: 'rtl',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              {/* اسم المادة على اليمين */}
              <span style={{ 
                color: 'var(--text-pure)', 
                fontWeight: 'bold', 
                fontSize: '17px',
                textAlign: 'right'
              }}>
                {subjName}
              </span>

              {/* شارة العدد (لا يوجد / 3 ملفات) على اليسار */}
              <span style={{
                backgroundColor: 'rgba(0, 0, 0, 0.35)',
                color: count > 0 ? 'var(--primary-color)' : 'var(--text-muted)',
                padding: '5px 14px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 'bold',
                border: count > 0 ? '1px solid rgba(0, 148, 247, 0.2)' : '1px solid transparent',
                transition: 'all 0.3s ease',
                flexShrink: 0
              }}>
                {formatFilesCount(count)}
              </span>
            </div>

            {/* 🌟 محتوى البطاقة المتوسع (قائمة الملازم كما في الصورة 2) 🌟 */}
            <div style={{
              maxHeight: isExpanded ? '2000px' : '0px',
              opacity: isExpanded ? 1 : 0,
              overflow: 'hidden',
              transition: isExpanded 
                ? 'max-height 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease' 
                : 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease'
            }}>
              <div style={{ padding: '0 18px 18px 18px', direction: 'rtl' }}>
                
                {/* الخط الفاصل تحت العنوان كما في الصورة الثانية */}
                <div style={{ height: '1px', backgroundColor: 'var(--border-line)', marginBottom: '15px', opacity: 0.7 }} />

                {/* زر إضافة ملزمة يظهر للأدمن فقط داخل البطاقة */}
                {canEdit && (
                  <button
                    onClick={(e) => openAddModal(subjName, e)}
                    style={{
                      width: '100%',
                      padding: '11px',
                      marginBottom: '12px',
                      borderRadius: '12px',
                      border: '1px dashed var(--primary-color)',
                      backgroundColor: 'rgba(0, 148, 247, 0.08)',
                      color: 'var(--primary-color)',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                  >
                    <span>+ إضافة ملزمة جديدة</span>
                  </button>
                )}

                {/* قائمة الملفات الفرعية */}
                {count > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {materialsList.map((mat) => (
                      <div 
                        key={mat.id}
                        style={{
                          backgroundColor: 'var(--card-bg-locked)', // خلفية داكنة/فرعية كما في الصورة 2
                          borderRadius: '14px',
                          padding: '15px 16px',
                          borderRight: '4px solid var(--primary-color)', // الشريط السماوي الأيمن للبطاقة الفرعية
                          borderTop: '1px solid rgba(255,255,255,0.04)',
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          borderLeft: '1px solid rgba(255,255,255,0.04)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '12px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.18)'
                        }}
                      >
                        {/* اسم الملزمة على اليمين (بدون تاريخ إضافة كما طلبت) */}
                        <span style={{
                          color: 'var(--text-pure)',
                          fontWeight: 'bold',
                          fontSize: '15px',
                          textAlign: 'right',
                          flex: 1,
                          lineHeight: '1.4',
                          wordBreak: 'break-word'
                        }}>
                          {mat.name}
                        </span>

                        {/* حاوية الأزرار على اليسار (صغيرة ونظيفة بكلمة واحدة فقط) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          
                          {/* أزرار التعديل والحذف للأدمن */}
                          {canEdit && (
                            <>
                              <button
                                onClick={(e) => openEditModal(subjName, mat, e)}
                                title="إعادة تسمية / تعديل"
                                style={{
                                  background: 'rgba(245, 158, 11, 0.12)',
                                  border: '1px solid rgba(245, 158, 11, 0.25)',
                                  borderRadius: '8px',
                                  width: '30px',
                                  height: '30px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  padding: 0
                                }}
                              >
                                <EditIcon />
                              </button>
                              <button
                                onClick={(e) => openDeleteModal(subjName, mat, e)}
                                title="حذف الملزمة"
                                style={{
                                  background: 'rgba(239, 68, 68, 0.12)',
                                  border: '1px solid rgba(239, 68, 68, 0.25)',
                                  borderRadius: '8px',
                                  width: '30px',
                                  height: '30px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  padding: 0
                                }}
                              >
                                <TrashIcon />
                              </button>
                            </>
                          )}

                          {/* زر العرض فقط */}
                          <button
                            className="mat-action-btn"
                            onClick={(e) => triggerPreview(mat.url, e)}
                            style={{
                              backgroundColor: 'rgba(255, 255, 255, 0.07)',
                              color: 'var(--text-pure)',
                              border: '1px solid var(--border-line)',
                              borderRadius: '9px',
                              padding: '7px 13px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              transition: 'transform 0.15s ease, background-color 0.2s',
                              WebkitTapHighlightColor: 'transparent'
                            }}
                          >
                            عرض
                          </button>

                          {/* زر التحميل المباشر الفوري */}
                          <button
                            className="mat-action-btn"
                            onClick={(e) => triggerDirectDownload(mat.url, mat.name, e)}
                            style={{
                              backgroundColor: 'var(--primary-color)',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '9px',
                              padding: '7px 14px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              boxShadow: '0 2px 8px rgba(0, 148, 247, 0.35)',
                              transition: 'transform 0.15s ease',
                              WebkitTapHighlightColor: 'transparent'
                            }}
                          >
                            تحميل
                          </button>

                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '18px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                    لا توجد ملفات مرفوعة في هذه المادة حالياً
                  </div>
                )}

              </div>
            </div>
          </div>
        );
      })}

      {/* ========================================================= */}
      {/* 🌟 النافذة المنبثقة للأدمن (إضافة / إعادة تسمية / حذف) 🌟 */}
      {/* ========================================================= */}
      {modalState.isOpen && typeof document !== 'undefined' ? createPortal(
        <div 
          onClick={closeModal}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px', boxSizing: 'border-box', direction: 'rtl',
            animation: 'modalBackdropFade 0.25s ease forwards'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: '370px',
              backgroundColor: 'var(--card-bg-normal)',
              border: '1px solid var(--border-line)',
              borderRadius: '22px', padding: '24px 20px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.45)',
              display: 'flex', flexDirection: 'column', gap: '16px',
              textAlign: 'center',
              animation: 'modalPopIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
            }}
          >
            {modalState.mode === 'delete' ? (
              <>
                <h3 style={{ margin: 0, color: '#ef4444', fontSize: '18px' }}>حذف الملزمة</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>
                  هل أنت متأكد من حذف <strong>"{modalState.item?.name}"</strong> نهائياً من مادة {modalState.subject}؟
                </p>
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button 
                    onClick={handleConfirmDelete} disabled={isProcessing}
                    style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: '#ef4444', color: '#fff', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
                  >
                    {isProcessing ? 'جاري الحذف...' : 'حذف'}
                  </button>
                  <button 
                    onClick={closeModal} disabled={isProcessing}
                    style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid var(--border-line)', backgroundColor: 'transparent', color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
                  >
                    إلغاء
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 style={{ margin: 0, color: 'var(--text-pure)', fontSize: '18px' }}>
                  {modalState.mode === 'edit' ? 'تعديل الملزمة' : 'إضافة ملزمة جديدة'}
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--primary-color)', fontWeight: 'bold', marginTop: '-10px' }}>
                  {modalState.subject}
                </span>

                <div style={{ textAlign: 'right' }}>
                  <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '6px', fontWeight: 'bold' }}>
                    اسم الملزمة (مثال: نظري / عملي / الفصل الأول)
                  </label>
                  <input 
                    type="text"
                    value={matName}
                    onChange={(e) => setMatName(e.target.value)}
                    placeholder="أدخل عنوان الملزمة..."
                    autoFocus
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: '12px',
                      border: '1px solid var(--border-line)', backgroundColor: 'var(--card-bg-locked)',
                      color: 'var(--text-pure)', fontSize: '14px', outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ textAlign: 'right' }}>
                  <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '6px', fontWeight: 'bold' }}>
                    رابط الملف من Google Drive
                  </label>
                  <input 
                    type="url"
                    value={matUrl}
                    onChange={(e) => setMatUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/..."
                    dir="ltr"
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: '12px',
                      border: '1px solid var(--border-line)', backgroundColor: 'var(--card-bg-locked)',
                      color: 'var(--text-pure)', fontSize: '13px', outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <button 
                    onClick={handleSaveMaterial} disabled={isProcessing}
                    style={{ flex: 1, padding: '13px', borderRadius: '12px', border: 'none', backgroundColor: 'var(--primary-color)', color: '#fff', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', opacity: isProcessing ? 0.7 : 1 }}
                  >
                    {isProcessing ? 'جاري الحفظ...' : 'حفظ'}
                  </button>
                  <button 
                    onClick={closeModal} disabled={isProcessing}
                    style={{ flex: 1, padding: '13px', borderRadius: '12px', border: '1px solid var(--border-line)', backgroundColor: 'transparent', color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
                  >
                    إلغاء
                  </button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      ) : null}

    </div>
  );
}
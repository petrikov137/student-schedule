//must be the final

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ref, set, remove } from 'firebase/database';
import { database } from '../firebase';
import localforage from 'localforage';

// تهيئة قاعدة البيانات المحلية لحفظ الملفات
const offlineStore = localforage.createInstance({
  name: 'VersaOfflineVault',
  storeName: 'user_materials_blobs'
});

// --- 🎨 الأيقونات ---
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

// --- 🧠 دوال مساعدة ---
const extractDriveFileId = (url) => {
  if (!url) return null;
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /\/presentation\/d\/([a-zA-Z0-9_-]+)/,
    /\/document\/d\/([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
};

const getOnlineEmbedUrl = (url) => {
  const fileId = extractDriveFileId(url);
  if (fileId) {
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }
  return url;
};

// فحص للتأكد من أن الملف هو PDF حقيقي وليس صفحة خطأ
const inspectBlobIsPdf = async (blob) => {
  if (!blob || blob.size < 64) return false;
  try {
    const headerBuffer = await blob.slice(0, 4).arrayBuffer();
    const bytes = new Uint8Array(headerBuffer);
    return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46; // يمثل %PDF
  } catch (err) {
    return false;
  }
};

const formatFilesCount = (count) => {
  if (count === 0) return 'لا يوجد';
  if (count === 1) return 'ملف واحد';
  if (count === 2) return 'ملفان';
  if (count >= 3 && count <= 10) return `${count} ملفات`;
  return `${count} ملف`;
};

// =========================================================================
// 🖥️ مكون العارض بملء الشاشة (يعتمد على المتصفح المدمج 100%)
// =========================================================================
const FullscreenDocumentViewer = ({ viewerData, onClose }) => {
  const [errorMessage, setErrorMessage] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineBlobUrl, setOfflineBlobUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!viewerData) return;
    
    const prepareViewer = async () => {
      setIsLoading(true);
      setErrorMessage('');

      if (viewerData.isOffline && viewerData.blob) {
        // فحص سريع للتأكد من أن الملف سليم ولم يفسد
        const isPdf = await inspectBlobIsPdf(viewerData.blob);
        if (!isPdf) {
          setErrorMessage('هذا الملف تالف أو ليس بصيغة PDF صالحة. يرجى حذفه من حسابك وإعادة تحميله.');
          setIsLoading(false);
          return;
        }

        // تحويل الملف المحلي إلى رابط متصفح لعرضه
        const url = URL.createObjectURL(viewerData.blob);
        setOfflineBlobUrl(url);
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    };

    prepareViewer();

    // تنظيف الذاكرة عند إغلاق النافذة
    return () => {
      if (offlineBlobUrl) {
        URL.revokeObjectURL(offlineBlobUrl);
      }
    };
  }, [viewerData]);

  if (!viewerData) return null;

  return createPortal(
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      width: '100vw', height: '100vh', backgroundColor: '#0a0a0c', zIndex: 999999,
      display: 'flex', flexDirection: 'column', direction: 'rtl', animation: 'viewerFadeIn 0.25s ease forwards'
    }}>
      <div style={{ height: '52px', backgroundColor: 'var(--card-bg-normal)', borderBottom: '1px solid var(--border-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', flexShrink: 0 }}>
        <span style={{ color: 'var(--text-pure)', fontWeight: 'bold', fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '75%' }}>
          {viewerData.title}
        </span>
        <button onClick={onClose} style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', padding: '6px 14px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
          إغلاق
        </button>
      </div>

      <div style={{ flex: 1, width: '100%', height: 'calc(100vh - 52px)', position: 'relative', overflowY: 'hidden', backgroundColor: '#ffffff', WebkitOverflowScrolling: 'touch' }}>
        {isLoading ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#121215', zIndex: 5 }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid rgba(255, 255, 255, 0.2)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'versaSpin 0.65s linear infinite' }} />
          </div>
        ) : viewerData.isOffline ? (
          errorMessage ? (
            <div style={{ height: '100%', backgroundColor: '#121215', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center', color: '#ef4444', fontSize: '14px', fontWeight: 'bold', lineHeight: '1.7' }}>
              {errorMessage}
            </div>
          ) : (
            <iframe 
              src={`${offlineBlobUrl}#toolbar=0&navpanes=0`} 
              title={viewerData.title} 
              style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#ffffff', display: 'block' }} 
            />
          )
        ) : !isOnline ? (
          <div style={{ height: '100%', backgroundColor: '#121215', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '25px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-pure)', marginBottom: '8px' }}>لا يوجد اتصال بالإنترنت</div>
            <div style={{ fontSize: '13px', maxWidth: '300px', lineHeight: '1.6' }}>العرض المباشر لوضع الزائر يتطلب اتصالاً بالإنترنت. سجل دخولك وحمّل الملف ليُحفظ داخل حسابك ويعمل دون إنترنت.</div>
          </div>
        ) : (
          <iframe src={viewerData.onlineUrl} title={viewerData.title} style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#ffffff', display: 'block' }} allow="autoplay" />
        )}
      </div>
    </div>,
    document.body
  );
};

// =========================================================================
// 🗂️ المكون الرئيسي MaterialsTab
// =========================================================================
export default function MaterialsTab({ 
  user = null, availableSubjects = [], selectedSubject, setSelectedSubject, 
  activeMaterialsData = {}, isAdminMode = false, userRole = null, selectedArchive = null, showToast = () => {} 
}) {
  const canEdit = (isAdminMode || (userRole && userRole !== 'student')) && !selectedArchive;

  const [downloadedMap, setDownloadedMap] = useState({});
  const [downloadingMap, setDownloadingMap] = useState({});
  const [deleteOverlayId, setDeleteOverlayId] = useState(null);
  const [viewerData, setViewerData] = useState(null);

  const longPressTimer = useRef(null);
  const isLongPressTriggered = useRef(false);

  const [modalState, setModalState] = useState({ isOpen: false, mode: null, subject: null, item: null });
  const [matName, setMatName] = useState('');
  const [matUrl, setMatUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const checkUserSavedFiles = async () => {
      if (!user) { if (isMounted) setDownloadedMap({}); return; }
      try {
        const keys = await offlineStore.keys();
        const userPrefix = `user_${user.uid}_mat_`;
        const map = {};
        keys.forEach(k => {
          if (k.startsWith(userPrefix)) { map[k.replace(userPrefix, '')] = true; }
        });
        if (isMounted) setDownloadedMap(map);
      } catch (err) { console.error('Offline storage check error:', err); }
    };
    checkUserSavedFiles();
    return () => { isMounted = false; };
  }, [user, activeMaterialsData]);

  useEffect(() => {
    const clearOverlay = () => setDeleteOverlayId(null);
    window.addEventListener('click', clearOverlay);
    return () => window.removeEventListener('click', clearOverlay);
  }, []);

  const toggleSubjectCard = (subjName) => {
    setDeleteOverlayId(null);
    setSelectedSubject(selectedSubject === subjName ? null : subjName);
  };

  // --- ⚡ تحميل الـ PDF وحفظه ⚡ ---
  const handleDownloadToAccount = async (mat, e) => {
    e.stopPropagation();
    if (!user) return;
    if (downloadingMap[mat.id]) return;
    if (!navigator.onLine) return showToast('يرجى الاتصال بالإنترنت لتنزيل الملف', 'error');

    setDownloadingMap(prev => ({ ...prev, [mat.id]: true }));

    try {
      const fileId = extractDriveFileId(mat.url);
      const fetchUrl = fileId ? `/api/drive?id=${fileId}&preferPdf=1` : null;

      if (!fetchUrl) throw new Error('رابط غير صالح');

      const response = await fetch(fetchUrl);
      
      if (response.status === 415) {
        throw new Error('الملف بصيغة قديمة. يرجى رفع ملف PDF حصراً.');
      }
      if (!response.ok) throw new Error('تعذر الجلب من درايف.');

      const blob = await response.blob();
      const isPdf = await inspectBlobIsPdf(blob);

      if (!isPdf) {
        throw new Error('تم رفض الملف. يرجى التأكد من رفع ملف بصيغة PDF.');
      }

      const validBlob = new Blob([blob], { type: 'application/pdf' });
      const storageKey = `user_${user.uid}_mat_${mat.id}`;
      
      await offlineStore.setItem(storageKey, {
        id: mat.id,
        name: mat.name,
        blob: validBlob,
        fileType: 'pdf',
        savedAt: Date.now()
      });

      setDownloadedMap(prev => ({ ...prev, [mat.id]: true }));
      if (navigator.vibrate) navigator.vibrate(40);
    } catch (error) {
      showToast(error.message || 'تعذر الحفظ المحلي', 'error');
    } finally {
      setDownloadingMap(prev => ({ ...prev, [mat.id]: false }));
    }
  };

  const handleOpenFullscreenViewer = async (mat, e) => {
    e.stopPropagation();
    if (user && downloadedMap[mat.id]) {
      try {
        const record = await offlineStore.getItem(`user_${user.uid}_mat_${mat.id}`);
        if (record && record.blob) {
          setViewerData({ title: mat.name, isOffline: true, blob: record.blob, fileType: 'pdf' });
          return;
        }
      } catch (err) { console.error('Error reading offline file:', err); }
    }
    setViewerData({ title: mat.name, isOffline: false, onlineUrl: getOnlineEmbedUrl(mat.url) });
  };

  const handleCloseViewer = () => setViewerData(null);

  const handleCardPressStart = (matId) => {
    if (!user || !downloadedMap[matId] || downloadingMap[matId]) return;
    isLongPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPressTriggered.current = true;
      setDeleteOverlayId(matId);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500);
  };

  const handleCardPressEnd = () => { if (longPressTimer.current) clearTimeout(longPressTimer.current); };

  const handleDeleteFromAccount = async (matId, e) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await offlineStore.removeItem(`user_${user.uid}_mat_${matId}`);
      setDownloadedMap(prev => { const updated = { ...prev }; delete updated[matId]; return updated; });
      setDeleteOverlayId(null);
      if (navigator.vibrate) navigator.vibrate(30);
    } catch (err) { showToast('حدث خطأ أثناء حذف الملف', 'error'); }
  };

  // --- دوال الأدمن ---
  const openAddModal = (subjName, e) => { e.stopPropagation(); setMatName(''); setMatUrl(''); setModalState({ isOpen: true, mode: 'add', subject: subjName, item: null }); };
  const openEditModal = (subjName, item, e) => { e.stopPropagation(); setMatName(item.name || ''); setMatUrl(item.url || ''); setModalState({ isOpen: true, mode: 'edit', subject: subjName, item }); };
  const openDeleteModal = (subjName, item, e) => { e.stopPropagation(); setModalState({ isOpen: true, mode: 'delete', subject: subjName, item }); };
  const closeModal = () => { if (isProcessing) return; setModalState({ isOpen: false, mode: null, subject: null, item: null }); setMatName(''); setMatUrl(''); };

  const handleSaveMaterial = async () => {
    if (!matName.trim() || !matUrl.trim()) return showToast('يرجى إدخال اسم الملزمة والرابط', 'error');
    setIsProcessing(true);
    const { mode, subject, item } = modalState;
    const id = mode === 'edit' && item?.id ? item.id : `mat_${Date.now()}`;
    const payload = { id, name: matName.trim(), url: matUrl.trim(), timestamp: mode === 'edit' && item?.timestamp ? item.timestamp : Date.now() };
    try {
      await set(ref(database, `materials/${subject}/${id}`), payload);
      showToast(mode === 'edit' ? 'تم تحديث الملزمة' : 'تمت إضافة الملزمة');
      closeModal();
    } catch (error) { showToast('حدث خطأ أثناء الحفظ', 'error'); } finally { setIsProcessing(false); }
  };

  const handleConfirmAdminDelete = async () => {
    const { subject, item } = modalState;
    if (!subject || !item) return;
    setIsProcessing(true);
    try {
      await remove(ref(database, `materials/${subject}/${item.id}`));
      showToast('تم حذف الملزمة نهائياً');
      closeModal();
    } catch (error) { showToast('فشل الحذف', 'error'); } finally { setIsProcessing(false); }
  };

  return (
    <div className="week-animate" style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '30px' }}>
      <style>{`
        @keyframes modalBackdropFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalPopIn { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes viewerFadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        @keyframes versaSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .versa-spinner { width: 16px; height: 16px; border: 2.2px solid rgba(255, 255, 255, 0.25); border-top-color: var(--primary-color); border-radius: 50%; animation: versaSpin 0.65s linear infinite; }
        .mat-clean-btn:active { transform: scale(0.94); }
      `}</style>

      <FullscreenDocumentViewer viewerData={viewerData} onClose={handleCloseViewer} />

      {availableSubjects.map((subj, idx) => {
        const subjName = typeof subj === 'object' ? (subj.name || subj.id) : subj;
        const rawMaterials = activeMaterialsData?.[subjName] || {};
        const materialsList = Object.entries(rawMaterials).map(([key, val]) => ({ ...val, id: val.id || key })).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        const count = materialsList.length;
        const isExpanded = selectedSubject === subjName;

        return (
          <div key={idx} className="day-card schedule-day-box" style={{ backgroundColor: isExpanded ? 'var(--card-bg-expanded)' : 'var(--card-bg-normal)', borderRadius: '14px', borderTop: '1px solid var(--border-line)', borderRight: '1px solid var(--border-line)', borderBottom: '1px solid var(--border-line)', borderLeft: '5px solid var(--primary-color)', overflow: 'hidden', transition: 'background-color 0.3s ease, box-shadow 0.3s ease', boxShadow: isExpanded ? '0 8px 25px rgba(0, 0, 0, 0.25)' : '0 4px 10px rgba(0, 0, 0, 0.1)' }}>
            <div onClick={() => toggleSubjectCard(subjName)} style={{ padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', direction: 'rtl', WebkitTapHighlightColor: 'transparent' }}>
              <span style={{ color: 'var(--text-pure)', fontWeight: 'bold', fontSize: '17px', textAlign: 'right' }}>{subjName}</span>
              <span style={{ backgroundColor: 'rgba(0, 0, 0, 0.35)', color: count > 0 ? 'var(--primary-color)' : 'var(--text-muted)', padding: '5px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', border: count > 0 ? '1px solid rgba(0, 148, 247, 0.2)' : '1px solid transparent', transition: 'all 0.3s ease', flexShrink: 0 }}>{formatFilesCount(count)}</span>
            </div>

            <div style={{ maxHeight: isExpanded ? '2000px' : '0px', opacity: isExpanded ? 1 : 0, overflow: 'hidden', transition: isExpanded ? 'max-height 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease' : 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease' }}>
              <div style={{ padding: '0 18px 18px 18px', direction: 'rtl' }}>
                <div style={{ height: '1px', backgroundColor: 'var(--border-line)', marginBottom: '15px', opacity: 0.7 }} />
                {canEdit && (
                  <button onClick={(e) => openAddModal(subjName, e)} style={{ width: '100%', padding: '11px', marginBottom: '12px', borderRadius: '12px', border: '1px dashed var(--primary-color)', backgroundColor: 'rgba(0, 148, 247, 0.08)', color: 'var(--primary-color)', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', WebkitTapHighlightColor: 'transparent' }}>+ إضافة ملزمة (PDF حصراً)</button>
                )}
                {count > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {materialsList.map((mat) => {
                      const isDownloaded = !!downloadedMap[mat.id];
                      const isDownloading = !!downloadingMap[mat.id];
                      const showDeleteOverlay = deleteOverlayId === mat.id;

                      return (
                        <div key={mat.id} onMouseDown={() => handleCardPressStart(mat.id)} onMouseUp={handleCardPressEnd} onMouseLeave={handleCardPressEnd} onTouchStart={() => handleCardPressStart(mat.id)} onTouchEnd={handleCardPressEnd} onTouchCancel={handleCardPressEnd} onContextMenu={(e) => { if (user && isDownloaded) e.preventDefault(); }} style={{ position: 'relative', backgroundColor: 'var(--card-bg-locked)', borderRadius: '14px', padding: '15px 16px', borderRight: '4px solid var(--primary-color)', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', borderLeft: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.18)', overflow: 'hidden', userSelect: 'none', WebkitUserSelect: 'none' }}>
                          {showDeleteOverlay && (
                            <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(15, 15, 20, 0.92)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', animation: 'modalBackdropFade 0.2s ease forwards' }}>
                              <button className="mat-clean-btn" onClick={(e) => handleDeleteFromAccount(mat.id, e)} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '9px', padding: '7px 20px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 10px rgba(239, 68, 68, 0.35)' }}>حذف</button>
                              <button className="mat-clean-btn" onClick={(e) => { e.stopPropagation(); setDeleteOverlayId(null); }} style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)', border: '1px solid var(--border-line)', borderRadius: '9px', padding: '7px 16px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>إلغاء</button>
                            </div>
                          )}
                          <span style={{ color: 'var(--text-pure)', fontWeight: 'bold', fontSize: '15px', textAlign: 'right', flex: 1, lineHeight: '1.4', wordBreak: 'break-word' }}>{mat.name}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            {canEdit && (
                              <>
                                <button onClick={(e) => openEditModal(subjName, mat, e)} style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '8px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}><EditIcon /></button>
                                <button onClick={(e) => openDeleteModal(subjName, mat, e)} style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}><TrashIcon /></button>
                              </>
                            )}
                            {!user ? (
                              <button className="mat-clean-btn" onClick={(e) => handleOpenFullscreenViewer(mat, e)} style={{ backgroundColor: 'var(--primary-color)', color: '#ffffff', border: 'none', borderRadius: '9px', padding: '7px 16px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0, 148, 247, 0.3)', transition: 'all 0.2s ease', WebkitTapHighlightColor: 'transparent' }}>عرض</button>
                            ) : isDownloading ? (
                              <div style={{ width: '64px', height: '31px', borderRadius: '9px', backgroundColor: 'rgba(255, 255, 255, 0.06)', border: '1px solid var(--border-line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="versa-spinner" /></div>
                            ) : isDownloaded ? (
                              <button className="mat-clean-btn" onClick={(e) => handleOpenFullscreenViewer(mat, e)} style={{ backgroundColor: 'rgba(255, 255, 255, 0.09)', color: 'var(--text-pure)', border: '1px solid var(--primary-color)', borderRadius: '9px', padding: '7px 16px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s ease', WebkitTapHighlightColor: 'transparent' }}>عرض</button>
                            ) : (
                              <button className="mat-clean-btn" onClick={(e) => handleDownloadToAccount(mat, e)} style={{ backgroundColor: 'var(--primary-color)', color: '#ffffff', border: 'none', borderRadius: '9px', padding: '7px 15px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0, 148, 247, 0.35)', transition: 'all 0.2s ease', WebkitTapHighlightColor: 'transparent' }}>تحميل</button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '18px 0', color: 'var(--text-muted)', fontSize: '13px' }}>لا توجد ملفات مرفوعة في هذه المادة حالياً</div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {modalState.isOpen && typeof document !== 'undefined' ? createPortal(
        <div onClick={closeModal} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', boxSizing: 'border-box', direction: 'rtl', animation: 'modalBackdropFade 0.25s ease forwards' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '370px', backgroundColor: 'var(--card-bg-normal)', border: '1px solid var(--border-line)', borderRadius: '22px', padding: '24px 20px', boxShadow: '0 20px 50px rgba(0,0,0,0.45)', display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center', animation: 'modalPopIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
            {modalState.mode === 'delete' ? (
              <>
                <h3 style={{ margin: 0, color: '#ef4444', fontSize: '18px' }}>حذف الملزمة</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>هل أنت متأكد من حذف <strong>"{modalState.item?.name}"</strong> نهائياً من مادة {modalState.subject}؟</p>
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button onClick={handleConfirmAdminDelete} disabled={isProcessing} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: '#ef4444', color: '#fff', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}>{isProcessing ? '...' : 'حذف'}</button>
                  <button onClick={closeModal} disabled={isProcessing} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid var(--border-line)', backgroundColor: 'transparent', color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}>إلغاء</button>
                </div>
              </>
            ) : (
              <>
                <h3 style={{ margin: 0, color: 'var(--text-pure)', fontSize: '18px' }}>{modalState.mode === 'edit' ? 'تعديل الملزمة' : 'إضافة ملزمة جديدة (PDF)'}</h3>
                <span style={{ fontSize: '12px', color: 'var(--primary-color)', fontWeight: 'bold', marginTop: '-10px' }}>{modalState.subject}</span>
                <div style={{ textAlign: 'right' }}>
                  <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '6px', fontWeight: 'bold' }}>اسم الملزمة</label>
                  <input type="text" value={matName} onChange={(e) => setMatName(e.target.value)} placeholder="أدخل عنوان الملزمة..." autoFocus style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-line)', backgroundColor: 'var(--card-bg-locked)', color: 'var(--text-pure)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ textAlign: 'right' }}>
                  <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '6px', fontWeight: 'bold' }}>رابط الملف (PDF حصراً من جوجل درايف)</label>
                  <input type="url" value={matUrl} onChange={(e) => setMatUrl(e.target.value)} placeholder="https://drive.google.com/file/d/..." dir="ltr" style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-line)', backgroundColor: 'var(--card-bg-locked)', color: 'var(--text-pure)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <button onClick={handleSaveMaterial} disabled={isProcessing} style={{ flex: 1, padding: '13px', borderRadius: '12px', border: 'none', backgroundColor: 'var(--primary-color)', color: '#fff', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', opacity: isProcessing ? 0.7 : 1 }}>{isProcessing ? '...' : 'حفظ'}</button>
                  <button onClick={closeModal} disabled={isProcessing} style={{ flex: 1, padding: '13px', borderRadius: '12px', border: '1px solid var(--border-line)', backgroundColor: 'transparent', color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}>إلغاء</button>
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


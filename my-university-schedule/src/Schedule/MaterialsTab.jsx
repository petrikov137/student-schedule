import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ref, set, remove } from 'firebase/database';
import { database } from '../firebase';
import localforage from 'localforage';

// تهيئة قاعدة البيانات المحلية داخل Versa لحفظ الملفات الضخمة بدون إنترنت
const offlineStore = localforage.createInstance({
  name: 'VersaOfflineVault',
  storeName: 'user_materials_blobs'
});

// --- 🎨 أيقونات النظام النظيفة (بدون أي ملصقات) ---
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

// --- 🧠 دوال معالجة الروابط والتعرف على صيغ الملفات ---
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

const getDirectDownloadUrl = (url) => {
  const fileId = extractDriveFileId(url);
  if (fileId) {
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }
  return url;
};

const getOnlineEmbedUrl = (url, fileType) => {
  const fileId = extractDriveFileId(url);
  if (fileId) {
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }
  if (fileType === 'word' || fileType === 'ppt') {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
  }
  return url;
};

// فحص البصمة الرقمية للملف (Magic Bytes) والامتداد لتحديد نوعه بدقة
const detectFileType = async (blob, fileName = '', url = '') => {
  const combined = `${fileName} ${url}`.toLowerCase();
  const mime = (blob?.type || '').toLowerCase();

  if (mime.includes('pdf') || combined.includes('.pdf')) return 'pdf';
  if (mime.includes('word') || mime.includes('officedocument.word') || combined.match(/\.(docx|doc)\b/)) return 'word';
  if (mime.includes('presentation') || mime.includes('powerpoint') || combined.match(/\.(pptx|ppt)\b/)) return 'ppt';

  if (blob) {
    try {
      const headerBuffer = await blob.slice(0, 4).arrayBuffer();
      const bytes = new Uint8Array(headerBuffer);
      // بصمة ملفات PDF هي %PDF (25 50 44 46)
      if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
        return 'pdf';
      }
      // بصمة ملفات الأوفيس الحديثة (ZIP Container: 50 4B 03 04)
      if (bytes[0] === 0x50 && bytes[1] === 0x4B) {
        return combined.includes('ppt') ? 'ppt' : 'word';
      }
    } catch (e) { /* fallback to pdf */ }
  }
  return 'pdf';
};

const formatFilesCount = (count) => {
  if (count === 0) return 'لا يوجد';
  if (count === 1) return 'ملف واحد';
  if (count === 2) return 'ملفان';
  if (count >= 3 && count <= 10) return `${count} ملفات`;
  return `${count} ملف`;
};

// =========================================================================
// 🖥️ عارض الملفات الداخلي بملء الشاشة (يدعم PDF, Word, PowerPoint بدون إنترنت)
// =========================================================================
const FullscreenDocumentViewer = ({ viewerData, onClose }) => {
  const [officeHtml, setOfficeHtml] = useState('');
  const [isParsingOffice, setIsParsingOffice] = useState(false);

  useEffect(() => {
    if (!viewerData) return;

    // إذا كان الملف محفوظاً محلياً وهو من نوع Word أو PowerPoint، نقوم بتحويله وعرضه محلياً
    if (viewerData.isOffline && (viewerData.fileType === 'word' || viewerData.fileType === 'ppt') && viewerData.blob) {
      setIsParsingOffice(true);
      renderOfflineOfficeFile(viewerData.blob, viewerData.fileType)
        .then(html => setOfficeHtml(html))
        .catch(() => setOfficeHtml('<div style="text-align:center;padding:40px;color:#ef4444;">تعذر تحليل هيكلية هذا الملف محلياً</div>'))
        .finally(() => setIsParsingOffice(false));
    }
  }, [viewerData]);

  if (!viewerData) return null;

  return createPortal(
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      width: '100vw', height: '100vh',
      backgroundColor: '#0a0a0c',
      zIndex: 999999,
      display: 'flex',
      flexDirection: 'column',
      direction: 'rtl',
      animation: 'viewerFadeIn 0.25s ease forwards'
    }}>
      {/* شريط علوي مدمج ونظيف جداً */}
      <div style={{
        height: '52px',
        backgroundColor: 'var(--card-bg-normal)',
        borderBottom: '1px solid var(--border-line)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        flexShrink: 0
      }}>
        <span style={{
          color: 'var(--text-pure)',
          fontWeight: 'bold',
          fontSize: '15px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '75%'
        }}>
          {viewerData.title}
        </span>

        <button
          onClick={onClose}
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            color: '#ef4444',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            padding: '6px 14px',
            fontSize: '13px',
            fontWeight: 'bold',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          إغلاق
        </button>
      </div>

      {/* مساحة العرض بملء الشاشة */}
      <div style={{ flex: 1, width: '100%', height: 'calc(100vh - 52px)', position: 'relative', overflow: 'hidden', backgroundColor: '#121215' }}>
        {viewerData.isOffline ? (
          viewerData.fileType === 'pdf' ? (
            <iframe
              src={viewerData.blobUrl}
              title={viewerData.title}
              style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#fff' }}
            />
          ) : isParsingOffice ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <div className="versa-spinner" style={{ width: '32px', height: '32px' }} />
            </div>
          ) : (
            <div 
              style={{ width: '100%', height: '100%', overflowY: 'auto', padding: '20px', boxSizing: 'border-box', backgroundColor: '#18181b', color: '#f4f4f5' }}
              dangerouslySetInnerHTML={{ __html: officeHtml }}
            />
          )
        ) : (
          <iframe
            src={viewerData.onlineUrl}
            title={viewerData.title}
            style={{ width: '100%', height: '100%', border: 'none' }}
            allow="autoplay"
          />
        )}
      </div>
    </div>,
    document.body
  );
};

// محرك قراءة ملفات Word و PowerPoint محلياً بدون إنترنت
async function renderOfflineOfficeFile(blob, fileType) {
  const arrayBuffer = await blob.arrayBuffer();

  // تحميل محرك فك ضغط وتحويل مستندات الأوفيس وتخزينه في كاش المتصفح للعمل أوفلاين
  if (fileType === 'word') {
    if (!window.mammoth) {
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
        s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      });
    }
    const result = await window.mammoth.convertToHtml({ arrayBuffer });
    return `<div style="max-width:800px;margin:0 auto;background:#fff;color:#111;padding:30px;border-radius:12px;line-height:1.8;direction:auto;">${result.value}</div>`;
  }

  if (fileType === 'ppt') {
    if (!window.JSZip) {
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      });
    }
    const zip = await window.JSZip.loadAsync(arrayBuffer);
    const slideFiles = Object.keys(zip.files)
      .filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name))
      .sort((a, b) => {
        const numA = parseInt(a.match(/slide(\d+)\.xml/)[1]);
        const numB = parseInt(b.match(/slide(\d+)\.xml/)[1]);
        return numA - numB;
      });

    let slidesHtml = '<div style="display:flex;flex-direction:column;gap:20px;max-width:850px;margin:0 auto;">';
    for (let i = 0; i < slideFiles.length; i++) {
      const xmlText = await zip.file(slideFiles[i]).async('string');
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
      const textNodes = xmlDoc.getElementsByTagName('a:t');
      let paragraphs = [];
      for (let j = 0; j < textNodes.length; j++) {
        if (textNodes[j].textContent.trim()) {
          paragraphs.push(textNodes[j].textContent);
        }
      }
      slidesHtml += `
        <div style="background:#27272a;border:1px solid #3f3f46;border-radius:16px;padding:28px;box-shadow:0 8px 20px rgba(0,0,0,0.3);direction:auto;">
          <div style="color:#38bdf8;font-size:12px;font-weight:bold;margin-bottom:12px;">شريحة ${i + 1}</div>
          <div style="font-size:16px;line-height:1.7;color:#f4f4f5;">${paragraphs.join('<br/>') || '...'}</div>
        </div>
      `;
    }
    slidesHtml += '</div>';
    return slidesHtml;
  }
}

export default function MaterialsTab({ 
  user = null,
  availableSubjects = [], 
  selectedSubject, 
  setSelectedSubject, 
  activeMaterialsData = {}, 
  isAdminMode = false,
  userRole = null,
  selectedArchive = null,
  showToast = () => {} 
}) {
  const canEdit = (isAdminMode || (userRole && userRole !== 'student')) && !selectedArchive;

  // 🌟 حالات التخزين المحلي والتحميل والضغط المطول 🌟
  const [downloadedMap, setDownloadedMap] = useState({}); // { [matId]: true }
  const [downloadingMap, setDownloadingMap] = useState({}); // { [matId]: true }
  const [deleteOverlayId, setDeleteOverlayId] = useState(null); // معرف البطاقة التي ظهر عليها زر الحذف
  const [viewerData, setViewerData] = useState(null); // بيانات الملف المفتوح بملء الشاشة

  // مراجع للتحكم بالضغط المطول (Long Press)
  const longPressTimer = useRef(null);
  const isLongPressTriggered = useRef(false);

  // حالات نافذة الأدمن (إضافة / تعديل / حذف من السيرفر)
  const [modalState, setModalState] = useState({ isOpen: false, mode: null, subject: null, item: null });
  const [matName, setMatName] = useState('');
  const [matUrl, setMatUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. فحص الملفات المحملة مسبقاً في حساب المستخدم الحالي فور فتح التبويب
  useEffect(() => {
    let isMounted = true;
    const checkUserSavedFiles = async () => {
      if (!user) {
        if (isMounted) setDownloadedMap({});
        return;
      }
      try {
        const keys = await offlineStore.keys();
        const userPrefix = `user_${user.uid}_mat_`;
        const map = {};
        keys.forEach(k => {
          if (k.startsWith(userPrefix)) {
            const matId = k.replace(userPrefix, '');
            map[matId] = true;
          }
        });
        if (isMounted) setDownloadedMap(map);
      } catch (err) {
        console.error('Offline storage check error:', err);
      }
    };
    checkUserSavedFiles();
    return () => { isMounted = false; };
  }, [user, activeMaterialsData]);

  // إخفاء خيار الحذف عند الضغط في أي مكان فارغ
  useEffect(() => {
    const clearOverlay = () => setDeleteOverlayId(null);
    window.addEventListener('click', clearOverlay);
    return () => window.removeEventListener('click', clearOverlay);
  }, []);

  const toggleSubjectCard = (subjName) => {
    setDeleteOverlayId(null);
    setSelectedSubject(selectedSubject === subjName ? null : subjName);
  };

  // --- ⚡ دالة تحميل الملف وحفظه داخل حساب المستخدم في Versa ⚡ ---
  const handleDownloadToAccount = async (mat, e) => {
    e.stopPropagation();
    if (!user) return;
    if (downloadingMap[mat.id]) return;

    setDownloadingMap(prev => ({ ...prev, [mat.id]: true }));

    try {
      const fileId = extractDriveFileId(mat.url);
      const targetUrl = getDirectDownloadUrl(mat.url);
      
      const fetchCandidates = [
        // 1. خادم Vercel الخاص بك (مضمون 100% وسريع جداً)
        fileId ? `/api/drive?id=${fileId}` : null,
        // 2. بروكسي بديل يعمل على Localhost للروابط العادية
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`,
        // 3. في حال كان الملف Google Doc/Slide على Localhost
        fileId ? `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(`https://docs.google.com/document/d/${fileId}/export?format=pdf`)}` : null
      ].filter(Boolean);

      let fetchedBlob = null;

      for (const candidate of fetchCandidates) {
        try {
          const response = await fetch(candidate);
          if (response.ok) {
            const blob = await response.blob();
            // التأكد من أن الملف المستلم حقيقي وليس صفحة خطأ فارغة
            if (blob.size > 500 && !blob.type.includes('text/html')) {
              fetchedBlob = blob;
              break;
            }
          }
        } catch (err) {
          // الانتقال للبوابة التالية تلقائياً
        }
      }

      if (!fetchedBlob) {
        throw new Error('CORS_OR_NETWORK_BLOCK');
      }

      const detectedType = await detectFileType(fetchedBlob, mat.name, mat.url);
      const finalBlob = detectedType === 'pdf' 
        ? new Blob([fetchedBlob], { type: 'application/pdf' }) 
        : fetchedBlob;

      const storageKey = `user_${user.uid}_mat_${mat.id}`;
      await offlineStore.setItem(storageKey, {
        id: mat.id,
        name: mat.name,
        blob: finalBlob,
        fileType: detectedType,
        savedAt: Date.now()
      });

      setDownloadedMap(prev => ({ ...prev, [mat.id]: true }));
      if (navigator.vibrate) navigator.vibrate(40);
    } catch (error) {
      showToast('تعذر الحفظ المحلي، تأكد من أن رابط Drive عام', 'error');
    } finally {
      setDownloadingMap(prev => ({ ...prev, [mat.id]: false }));
    }
  };

  // --- 🖥️ دالة عرض الملف بملء الشاشة (أوفلاين للمحمل / أونلاين للضيف) ---
  const handleOpenFullscreenViewer = async (mat, e) => {
    e.stopPropagation();

    // 1. إذا كان المستخدم مسجلاً والملف محمل في حسابه -> يفتح بدون إنترنت فوراً
    if (user && downloadedMap[mat.id]) {
      try {
        const storageKey = `user_${user.uid}_mat_${mat.id}`;
        const record = await offlineStore.getItem(storageKey);
        if (record && record.blob) {
          const blobUrl = URL.createObjectURL(record.blob);
          setViewerData({
            title: mat.name,
            isOffline: true,
            blob: record.blob,
            blobUrl,
            fileType: record.fileType || 'pdf'
          });
          return;
        }
      } catch (err) {
        console.error('Error reading offline file:', err);
      }
    }

    // 2. في وضع الضيف (أو في حال عدم وجود الملف محلياً) -> يفتح عبر الإنترنت بملء الشاشة
    const guessedType = await detectFileType(null, mat.name, mat.url);
    const embedUrl = getOnlineEmbedUrl(mat.url, guessedType);
    setViewerData({
      title: mat.name,
      isOffline: false,
      onlineUrl: embedUrl,
      fileType: guessedType
    });
  };

  const handleCloseViewer = () => {
    if (viewerData?.blobUrl) {
      URL.revokeObjectURL(viewerData.blobUrl);
    }
    setViewerData(null);
  };

  // --- 🗑️ دوال الضغط المطول وحذف الملف من الحساب ---
  const handleCardPressStart = (matId) => {
    // الضغط المطول يعمل فقط للمستخدم المسجل وعلى الملفات التي قام بتحميلها
    if (!user || !downloadedMap[matId] || downloadingMap[matId]) return;

    isLongPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPressTriggered.current = true;
      setDeleteOverlayId(matId);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500);
  };

  const handleCardPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleDeleteFromAccount = async (matId, e) => {
    e.stopPropagation();
    if (!user) return;

    try {
      const storageKey = `user_${user.uid}_mat_${matId}`;
      await offlineStore.removeItem(storageKey);
      setDownloadedMap(prev => {
        const updated = { ...prev };
        delete updated[matId];
        return updated;
      });
      setDeleteOverlayId(null);
      if (navigator.vibrate) navigator.vibrate(30);
    } catch (err) {
      showToast('حدث خطأ أثناء حذف الملف', 'error');
    }
  };

  // --- دوال الأدمن (إضافة / تعديل / حذف من قاعدة البيانات العامة) ---
  const openAddModal = (subjName, e) => {
    e.stopPropagation();
    setMatName('');
    setMatUrl('');
    setModalState({ isOpen: true, mode: 'add', subject: subjName, item: null });
  };

  const openEditModal = (subjName, item, e) => {
    e.stopPropagation();
    setMatName(item.name || '');
    setMatUrl(item.url || '');
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
      showToast(mode === 'edit' ? 'تم تحديث الملزمة' : 'تمت إضافة الملزمة');
      closeModal();
    } catch (error) {
      showToast('حدث خطأ أثناء الحفظ', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmAdminDelete = async () => {
    const { subject, item } = modalState;
    if (!subject || !item) return;

    setIsProcessing(true);
    try {
      await remove(ref(database, `materials/${subject}/${item.id}`));
      showToast('تم حذف الملزمة نهائياً');
      closeModal();
    } catch (error) {
      showToast('فشل الحذف', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="week-animate" style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '30px' }}>
      
      <style>
        {`
          @keyframes modalBackdropFade { from { opacity: 0; } to { opacity: 1; } }
          @keyframes modalPopIn { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
          @keyframes viewerFadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
          @keyframes versaSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          
          .versa-spinner {
            width: 16px;
            height: 16px;
            border: 2.2px solid rgba(255, 255, 255, 0.25);
            border-top-color: var(--primary-color);
            border-radius: 50%;
            animation: versaSpin 0.65s linear infinite;
          }
          .mat-clean-btn:active { transform: scale(0.94); }
        `}
      </style>

      {/* عارض الملفات بملء الشاشة */}
      <FullscreenDocumentViewer viewerData={viewerData} onClose={handleCloseViewer} />

      {availableSubjects.map((subj, idx) => {
        const subjName = typeof subj === 'object' ? (subj.name || subj.id) : subj;
        const rawMaterials = activeMaterialsData?.[subjName] || {};
        
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
              borderLeft: '5px solid var(--primary-color)',
              overflow: 'hidden',
              transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
              boxShadow: isExpanded ? '0 8px 25px rgba(0, 0, 0, 0.25)' : '0 4px 10px rgba(0, 0, 0, 0.1)'
            }}
          >
            {/* رأس بطاقة المادة */}
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
              <span style={{ color: 'var(--text-pure)', fontWeight: 'bold', fontSize: '17px', textAlign: 'right' }}>
                {subjName}
              </span>

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

            {/* القائمة الفرعية للملازم */}
            <div style={{
              maxHeight: isExpanded ? '2000px' : '0px',
              opacity: isExpanded ? 1 : 0,
              overflow: 'hidden',
              transition: isExpanded 
                ? 'max-height 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease' 
                : 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease'
            }}>
              <div style={{ padding: '0 18px 18px 18px', direction: 'rtl' }}>
                
                <div style={{ height: '1px', backgroundColor: 'var(--border-line)', marginBottom: '15px', opacity: 0.7 }} />

                {canEdit && (
                  <button
                    onClick={(e) => openAddModal(subjName, e)}
                    style={{
                      width: '100%', padding: '11px', marginBottom: '12px', borderRadius: '12px',
                      border: '1px dashed var(--primary-color)', backgroundColor: 'rgba(0, 148, 247, 0.08)',
                      color: 'var(--primary-color)', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', WebkitTapHighlightColor: 'transparent'
                    }}
                  >
                    + إضافة ملزمة جديدة
                  </button>
                )}

                {count > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {materialsList.map((mat) => {
                      const isDownloaded = !!downloadedMap[mat.id];
                      const isDownloading = !!downloadingMap[mat.id];
                      const showDeleteOverlay = deleteOverlayId === mat.id;

                      return (
                        <div 
                          key={mat.id}
                          onMouseDown={() => handleCardPressStart(mat.id)}
                          onMouseUp={handleCardPressEnd}
                          onMouseLeave={handleCardPressEnd}
                          onTouchStart={() => handleCardPressStart(mat.id)}
                          onTouchEnd={handleCardPressEnd}
                          onTouchCancel={handleCardPressEnd}
                          onContextMenu={(e) => { if (user && isDownloaded) e.preventDefault(); }}
                          style={{
                            position: 'relative',
                            backgroundColor: 'var(--card-bg-locked)',
                            borderRadius: '14px',
                            padding: '15px 16px',
                            borderRight: '4px solid var(--primary-color)',
                            borderTop: '1px solid rgba(255,255,255,0.04)',
                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                            borderLeft: '1px solid rgba(255,255,255,0.04)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '12px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.18)',
                            overflow: 'hidden',
                            userSelect: 'none',
                            WebkitUserSelect: 'none'
                          }}
                        >
                          {/* طبقة الحذف من الحساب عند الضغط المطول */}
                          {showDeleteOverlay && (
                            <div 
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                position: 'absolute', inset: 0,
                                backgroundColor: 'rgba(15, 15, 20, 0.92)',
                                backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
                                zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                                animation: 'modalBackdropFade 0.2s ease forwards'
                              }}
                            >
                              <button
                                className="mat-clean-btn"
                                onClick={(e) => handleDeleteFromAccount(mat.id, e)}
                                style={{
                                  backgroundColor: '#ef4444', color: '#fff', border: 'none',
                                  borderRadius: '9px', padding: '7px 20px', fontSize: '13px', fontWeight: 'bold',
                                  cursor: 'pointer', boxShadow: '0 2px 10px rgba(239, 68, 68, 0.35)'
                                }}
                              >
                                حذف
                              </button>
                              <button
                                className="mat-clean-btn"
                                onClick={(e) => { e.stopPropagation(); setDeleteOverlayId(null); }}
                                style={{
                                  backgroundColor: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)',
                                  border: '1px solid var(--border-line)', borderRadius: '9px',
                                  padding: '7px 16px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer'
                                }}
                              >
                                إلغاء
                              </button>
                            </div>
                          )}

                          {/* اسم الملزمة على اليمين */}
                          <span style={{
                            color: 'var(--text-pure)', fontWeight: 'bold', fontSize: '15px',
                            textAlign: 'right', flex: 1, lineHeight: '1.4', wordBreak: 'break-word'
                          }}>
                            {mat.name}
                          </span>

                          {/* حاوية الأزرار على اليسار */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            
                            {/* أزرار الأدمن للتعديل والحذف من السيرفر */}
                            {canEdit && (
                              <>
                                <button
                                  onClick={(e) => openEditModal(subjName, mat, e)}
                                  style={{
                                    background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.25)',
                                    borderRadius: '8px', width: '30px', height: '30px', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0
                                  }}
                                >
                                  <EditIcon />
                                </button>
                                <button
                                  onClick={(e) => openDeleteModal(subjName, mat, e)}
                                  style={{
                                    background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)',
                                    borderRadius: '8px', width: '30px', height: '30px', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0
                                  }}
                                >
                                  <TrashIcon />
                                </button>
                              </>
                            )}

                            {/* 🌟 منطق الزر الذكي (ضيف vs مستخدم مسجل) 🌟 */}
                            {!user ? (
                              // 1. وضع الضيف: يظهر زر "عرض" فقط ويعمل عبر الإنترنت
                              <button
                                className="mat-clean-btn"
                                onClick={(e) => handleOpenFullscreenViewer(mat, e)}
                                style={{
                                  backgroundColor: 'var(--primary-color)', color: '#ffffff',
                                  border: 'none', borderRadius: '9px', padding: '7px 16px',
                                  fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
                                  boxShadow: '0 2px 8px rgba(0, 148, 247, 0.3)',
                                  transition: 'all 0.2s ease', WebkitTapHighlightColor: 'transparent'
                                }}
                              >
                                عرض
                              </button>
                            ) : isDownloading ? (
                              // 2. حالة جاري التحميل: دائرة تحميل نظيفة
                              <div style={{
                                width: '64px', height: '31px', borderRadius: '9px',
                                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                                border: '1px solid var(--border-line)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}>
                                <div className="versa-spinner" />
                              </div>
                            ) : isDownloaded ? (
                              // 3. بعد انتهاء التحميل: يتحول الزر إلى "عرض" ويفتح بملء الشاشة بدون إنترنت
                              <button
                                className="mat-clean-btn"
                                onClick={(e) => handleOpenFullscreenViewer(mat, e)}
                                style={{
                                  backgroundColor: 'rgba(255, 255, 255, 0.09)',
                                  color: 'var(--text-pure)',
                                  border: '1px solid var(--primary-color)',
                                  borderRadius: '9px', padding: '7px 16px',
                                  fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
                                  transition: 'all 0.2s ease', WebkitTapHighlightColor: 'transparent'
                                }}
                              >
                                عرض
                              </button>
                            ) : (
                              // 4. الحالة الابتدائية للمستخدم المسجل: زر "تحميل" لحفظ الملف داخل Versa
                              <button
                                className="mat-clean-btn"
                                onClick={(e) => handleDownloadToAccount(mat, e)}
                                style={{
                                  backgroundColor: 'var(--primary-color)', color: '#ffffff',
                                  border: 'none', borderRadius: '9px', padding: '7px 15px',
                                  fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
                                  boxShadow: '0 2px 8px rgba(0, 148, 247, 0.35)',
                                  transition: 'all 0.2s ease', WebkitTapHighlightColor: 'transparent'
                                }}
                              >
                                تحميل
                              </button>
                            )}

                          </div>
                        </div>
                      );
                    })}
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

      {/* نافذة الأدمن المنبثقة للإضافة والتعديل والحذف من السيرفر */}
      {modalState.isOpen && typeof document !== 'undefined' ? createPortal(
        <div 
          onClick={closeModal}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px', boxSizing: 'border-box', direction: 'rtl',
            animation: 'modalBackdropFade 0.25s ease forwards'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: '370px', backgroundColor: 'var(--card-bg-normal)',
              border: '1px solid var(--border-line)', borderRadius: '22px', padding: '24px 20px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.45)', display: 'flex', flexDirection: 'column', gap: '16px',
              textAlign: 'center', animation: 'modalPopIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
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
                    onClick={handleConfirmAdminDelete} disabled={isProcessing}
                    style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: '#ef4444', color: '#fff', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
                  >
                    {isProcessing ? '...' : 'حذف'}
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
                    اسم الملزمة
                  </label>
                  <input 
                    type="text" value={matName} onChange={(e) => setMatName(e.target.value)}
                    placeholder="أدخل عنوان الملزمة..." autoFocus
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: '12px',
                      border: '1px solid var(--border-line)', backgroundColor: 'var(--card-bg-locked)',
                      color: 'var(--text-pure)', fontSize: '14px', outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ textAlign: 'right' }}>
                  <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '6px', fontWeight: 'bold' }}>
                    رابط الملف (PDF / Word / PowerPoint)
                  </label>
                  <input 
                    type="url" value={matUrl} onChange={(e) => setMatUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/..." dir="ltr"
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
                    {isProcessing ? '...' : 'حفظ'}
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

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ref, set, remove } from 'firebase/database';
import { database } from '../firebase';
import localforage from 'localforage';
import JSZip from 'jszip';
import mammoth from 'mammoth';



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

// --- 🧠 دوال معالجة الروابط والفحص الجذري لمحتوى الملفات ---
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

const isPresentationOrDocHint = (name = '', url = '') => {
  const combined = `${name} ${url}`.toLowerCase();
  return (
    combined.includes('/presentation/') ||
    combined.includes('/document/') ||
    /\.(pptx|ppt|docx|doc)\b/.test(combined) ||
    combined.includes('powerpoint') ||
    combined.includes('بوربوينت')
  );
};

const getDirectDownloadUrl = (url) => {
  const fileId = extractDriveFileId(url);
  if (fileId) {
    return `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;
  }
  return url;
};

const getOnlineEmbedUrl = (url, fileName = '') => {
  const fileId = extractDriveFileId(url);
  if (fileId) {
    if (url.includes('/presentation/')) {
      return `https://docs.google.com/presentation/d/${fileId}/embed?start=false&loop=false`;
    }
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }
  const combined = `${fileName} ${url}`.toLowerCase();
  if (/\.(docx|doc|pptx|ppt)\b/.test(combined)) {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
  }
  return url;
};

// 🌟 فحص البصمة الحقيقية وهيكلية الملف من الداخل قبل قبوله أو عرضه 🌟
const inspectBlobContent = async (blob) => {
  if (!blob || blob.size < 64) {
    return { valid: false, reason: 'EMPTY_FILE' };
  }

  try {
    const headerBuffer = await blob.slice(0, 8).arrayBuffer();
    const bytes = new Uint8Array(headerBuffer);

    // 1. فحص بصمة PDF (%PDF-)
    if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
      return { valid: true, fileType: 'pdf', mime: 'application/pdf' };
    }

    // 2. فحص بصمة Office Open XML الحديثة (PK\x03\x04) والتحقق من الملفات الداخلية
    if (bytes[0] === 0x50 && bytes[1] === 0x4B && bytes[2] === 0x03 && bytes[3] === 0x04) {
      const zip = await JSZip.loadAsync(blob);
      if (zip.files['ppt/presentation.xml']) {
        return { valid: true, fileType: 'ppt', mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' };
      }
      if (zip.files['word/document.xml']) {
        return { valid: true, fileType: 'word', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
      }
      return { valid: false, reason: 'UNSUPPORTED_ZIP_ARCHIVE' };
    }

    // 3. فحص بصمة ملفات الأوفيس القديمة Binary OLE2 (.ppt / .doc 97-2003)
    if (bytes[0] === 0xD0 && bytes[1] === 0xCF && bytes[2] === 0x11 && bytes[3] === 0xE0) {
      return { valid: false, reason: 'LEGACY_BINARY_OFFICE' };
    }

    return { valid: false, reason: 'INVALID_OR_HTML_RESPONSE' };
  } catch (err) {
    return { valid: false, reason: 'CORRUPTED_DATA' };
  }
};

const formatFilesCount = (count) => {
  if (count === 0) return 'لا يوجد';
  if (count === 1) return 'ملف واحد';
  if (count === 2) return 'ملفان';
  if (count >= 3 && count <= 10) return `${count} ملفات`;
  return `${count} ملف`;
};

const escapeHtml = (str = '') =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// =========================================================================
// 🖥️ محرك تحليل وعرض ملفات PPTX و DOCX دون إنترنت (يدعم النصوص، الجداول، الصور، والتنسيق)
// =========================================================================
async function renderOfflineOfficeFile(blob, fileType) {
  const arrayBuffer = await blob.arrayBuffer();

  if (fileType === 'word') {
    const result = await mammoth.convertToHtml({ arrayBuffer });
    return `
      <div style="max-width:820px;margin:0 auto;background:#ffffff;color:#111827;padding:28px 24px;border-radius:14px;line-height:1.85;direction:auto;font-size:15px;box-shadow:0 10px 30px rgba(0,0,0,0.35);">
        ${result.value || '<p style="text-align:center;color:#6b7280;">المستند لا يحتوي على نصوص قابلة للعرض</p>'}
      </div>
    `;
  }

  if (fileType === 'ppt') {
    const zip = await JSZip.loadAsync(arrayBuffer);
    const slideFiles = Object.keys(zip.files)
      .filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name))
      .sort((a, b) => {
        const numA = parseInt(a.match(/slide(\d+)\.xml/)[1], 10);
        const numB = parseInt(b.match(/slide(\d+)\.xml/)[1], 10);
        return numA - numB;
      });

    if (slideFiles.length === 0) {
      throw new Error('NO_SLIDES_IN_PPTX');
    }

    const parser = new DOMParser();
    let slidesHtml = '<div style="display:flex;flex-direction:column;gap:22px;max-width:900px;margin:0 auto;padding-bottom:30px;">';

    for (let i = 0; i < slideFiles.length; i++) {
      const slidePath = slideFiles[i];
      const slideNum = slidePath.match(/slide(\d+)\.xml/)[1];
      const xmlText = await zip.file(slidePath).async('string');
      const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

      // 1. بناء خريطة العلاقات (Relationships) للصور داخل الشريحة
      const relMap = {};
      const relsPath = `ppt/slides/_rels/slide${slideNum}.xml.rels`;
      if (zip.files[relsPath]) {
        const relsXml = await zip.file(relsPath).async('string');
        const relsDoc = parser.parseFromString(relsXml, 'application/xml');
        const relNodes = relsDoc.getElementsByTagName('Relationship');
        for (let r = 0; r < relNodes.length; r++) {
          const rId = relNodes[r].getAttribute('Id');
          const target = relNodes[r].getAttribute('Target') || '';
          if (rId && target.includes('media/')) {
            const cleanMediaName = target.split('media/').pop();
            relMap[rId] = `ppt/media/${cleanMediaName}`;
          }
        }
      }

      // 2. استخراج الأشكال النصية والعناوين (<p:sp>)
      let titleHtml = '';
      let bodyBlocksHtml = '';
      const spNodes = xmlDoc.getElementsByTagName('p:sp');

      for (let s = 0; s < spNodes.length; s++) {
        const sp = spNodes[s];
        const phNode = sp.getElementsByTagName('p:ph')[0];
        const phType = phNode ? (phNode.getAttribute('type') || '') : '';
        const isTitle = phType === 'title' || phType === 'ctrTitle' || (s === 0 && !titleHtml && phType !== 'body');

        const pNodes = sp.getElementsByTagName('a:p');
        let shapeLines = [];

        for (let p = 0; p < pNodes.length; p++) {
          const tNodes = pNodes[p].getElementsByTagName('a:t');
          let lineText = '';
          for (let t = 0; t < tNodes.length; t++) {
            lineText += tNodes[t].textContent;
          }
          if (lineText.trim()) {
            shapeLines.push(escapeHtml(lineText.trim()));
          }
        }

        if (shapeLines.length > 0) {
          if (isTitle && !titleHtml) {
            titleHtml = `<h3 style="margin:0 0 18px 0;color:#111827;font-size:24px;font-weight:bold;line-height:1.45;direction:auto;text-align:center;">${shapeLines.join('<br/>')}</h3>`;
          } else {
            bodyBlocksHtml += `
              <div style="margin-bottom:12px;direction:auto;text-align:center;">
                ${shapeLines.map(line => `<div style="margin-bottom:8px;font-size:17px;line-height:1.6;color:#374151;">• ${line}</div>`).join('')}
              </div>
            `;
          }
        }
      }

      // 3. استخراج الجداول (<a:tbl>) إن وجدت في الشريحة
      let tablesHtml = '';
      const tblNodes = xmlDoc.getElementsByTagName('a:tbl');
      for (let tb = 0; tb < tblNodes.length; tb++) {
        const trNodes = tblNodes[tb].getElementsByTagName('a:tr');
        let rowsHtml = '';
        for (let r = 0; r < trNodes.length; r++) {
          const tcNodes = trNodes[r].getElementsByTagName('a:tc');
          let cellsHtml = '';
          for (let c = 0; c < tcNodes.length; c++) {
            const tNodes = tcNodes[c].getElementsByTagName('a:t');
            let cellText = '';
            for (let t = 0; t < tNodes.length; t++) cellText += tNodes[t].textContent + ' ';
            const cellStyle = r === 0
              ? 'background:#f3f4f6;color:#111827;font-weight:bold;'
              : 'background:#ffffff;color:#374151;';
            cellsHtml += `<td style="border:1px solid #d1d5db;padding:10px;font-size:14px;${cellStyle}">${escapeHtml(cellText.trim())}</td>`;
          }
          rowsHtml += `<tr>${cellsHtml}</tr>`;
        }
        if (rowsHtml) {
          tablesHtml += `<div style="overflow-x:auto;margin:16px 0;display:flex;justify-content:center;"><table style="width:90%;border-collapse:collapse;direction:auto;text-align:center;">${rowsHtml}</table></div>`;
        }
      }

      // 4. استخراج الصور المرتبطة بالشريحة
      let imagesHtml = '';
      const blipNodes = xmlDoc.getElementsByTagName('a:blip');
      const usedMediaPaths = new Set();

      for (let b = 0; b < blipNodes.length; b++) {
        const embedId = blipNodes[b].getAttribute('r:embed');
        const mediaPath = relMap[embedId];
        if (mediaPath && zip.files[mediaPath] && !usedMediaPaths.has(mediaPath)) {
          if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(mediaPath)) {
            usedMediaPaths.add(mediaPath);
            const base64 = await zip.file(mediaPath).async('base64');
            const ext = mediaPath.split('.').pop().toLowerCase();
            const mime = ext === 'jpg' ? 'image/jpeg' : ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
            imagesHtml += `
              <div style="margin-top:16px;text-align:center;display:flex;justify-content:center;">
                <img src="data:${mime};base64,${base64}" style="max-width:90%;max-height:450px;border-radius:6px;border:1px solid #e5e7eb;object-fit:contain;background:#fff;" />
              </div>
            `;
          }
        }
      }

      const hasContent = titleHtml || bodyBlocksHtml || tablesHtml || imagesHtml;

      // 🌟 التعديل الجذري هنا: جعل مظهر البوربوينت يشبه السلايدات الحقيقية (خلفية بيضاء ونسبة 16:9) 🌟
      slidesHtml += `
        <div style="background:#ffffff;color:#000000;border:1px solid #e5e7eb;border-radius:12px;padding:40px 30px;box-shadow:0 12px 30px rgba(0,0,0,0.15);position:relative;aspect-ratio:16/9;display:flex;flex-direction:column;justify-content:center;overflow:hidden;">
          <div style="position:absolute;top:15px;right:20px;color:#9ca3af;font-size:13px;font-weight:bold;font-family:sans-serif;">
            شريحة ${i + 1} / ${slideFiles.length}
          </div>
          <div style="flex:1;display:flex;flex-direction:column;justify-content:center;overflow-y:auto;padding-right:5px;">
            ${titleHtml}
            ${bodyBlocksHtml}
            ${tablesHtml}
            ${imagesHtml}
            ${!hasContent ? '<div style="color:#9ca3af;font-size:15px;text-align:center;padding:20px 0;">(شريحة رسومية أو فارغة)</div>' : ''}
          </div>
        </div>
      `;
    }

    slidesHtml += '</div>';
    return slidesHtml;
  }

  throw new Error('UNSUPPORTED_OFFICE_TYPE');
}

// محرك عرض ملفات PDF (أو ملفات البوربوينت المحولة إلى PDF) كشرائح وصفحات عالية الدقة دون إنترنت
async function renderOfflinePdfFile(blob, containerElement) {
  const arrayBuffer = await blob.arrayBuffer();
  
  // 🌟 الحل الجذري لمشكلة تداخل النصوص (تلف الملفات): إرفاق ملفات CMaps لدعم الخطوط العربية والمعقدة 🌟
  const pdfVersion = (typeof pdfjsLib !== 'undefined' && pdfjsLib.version) ? pdfjsLib.version : '3.11.174';
  const cMapUrl = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfVersion}/cmaps/`;
  const standardFontDataUrl = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfVersion}/standard_fonts/`;

  const loadingTask = pdfjsLib.getDocument({ 
    data: arrayBuffer,
    cMapUrl: cMapUrl,
    cMapPacked: true,
    standardFontDataUrl: standardFontDataUrl,
  });
  
  const pdf = await loadingTask.promise;

  containerElement.innerHTML = '';

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const baseScale = window.innerWidth < 768 ? 1.2 : 1.5;

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: baseScale * dpr });

    const wrapper = document.createElement('div');
    wrapper.style.marginBottom = '20px';
    wrapper.style.borderRadius = '10px';
    wrapper.style.overflow = 'hidden';
    wrapper.style.boxShadow = '0 8px 25px rgba(0,0,0,0.35)';
    wrapper.style.backgroundColor = '#ffffff';
    wrapper.style.display = 'flex';
    wrapper.style.justifyContent = 'center';

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    // 🌟 ضمان عرض Canvas بدقة وعدم تشوه الأبعاد 🌟
    canvas.style.width = '100%';
    canvas.style.maxWidth = `${viewport.width / dpr}px`;
    canvas.style.height = 'auto';
    canvas.style.display = 'block';

    wrapper.appendChild(canvas);
    containerElement.appendChild(wrapper);

    await page.render({
      canvasContext: canvas.getContext('2d'),
      viewport
    }).promise;
  }
}

// =========================================================================
// 🖥️ مكون العارض بملء الشاشة
// =========================================================================
const FullscreenDocumentViewer = ({ viewerData, onClose }) => {
  const [officeHtml, setOfficeHtml] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const pdfContainerRef = useRef(null);

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
    let isCancelled = false;

    const renderOffline = async () => {
      if (!viewerData.isOffline || !viewerData.blob) return;

      setIsParsing(true);
      setOfficeHtml('');
      setErrorMessage('');
      if (pdfContainerRef.current) pdfContainerRef.current.innerHTML = '';

      try {
        // فحص البصمة الحقيقية للـ Blob المخزن بغض النظر عن التسمية القديمة
        const inspection = await inspectBlobContent(viewerData.blob);

        if (!inspection.valid) {
          if (!isCancelled) {
            if (inspection.reason === 'LEGACY_BINARY_OFFICE') {
              setErrorMessage('هذا الملف بصيغة PowerPoint/Word قديمة (97-2003). يرجى رفعه بصيغة PPTX حديثة أو PDF ليعمل دون إنترنت.');
            } else {
              setErrorMessage('الملف المحفوظ سابقاً غير صالح أو تالف. اضغط مطولاً على بطاقة الملف لحذفه ثم أعد تحميله.');
            }
          }
          return;
        }

        if (inspection.fileType === 'pdf') {
          if (pdfContainerRef.current) {
            await renderOfflinePdfFile(viewerData.blob, pdfContainerRef.current);
          }
        } else if (inspection.fileType === 'ppt' || inspection.fileType === 'word') {
          const html = await renderOfflineOfficeFile(viewerData.blob, inspection.fileType);
          if (!isCancelled) setOfficeHtml(html);
        }
      } catch (err) {
        console.error('Offline Viewer Error:', err);
        if (!isCancelled) {
          setErrorMessage('تعذر تحليل وعرض هذا الملف محلياً. يرجى حذفه بالضغط المطول وإعادة تحميله.');
        }
      } finally {
        if (!isCancelled) setIsParsing(false);
      }
    };

    renderOffline();
    return () => { isCancelled = true; };
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

      <div style={{ flex: 1, width: '100%', height: 'calc(100vh - 52px)', position: 'relative', overflowY: 'auto', backgroundColor: '#121215', WebkitOverflowScrolling: 'touch' }}>
        {viewerData.isOffline ? (
          <>
            {isParsing && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 5 }}>
                <div style={{ width: '32px', height: '32px', border: '3px solid rgba(255, 255, 255, 0.2)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'versaSpin 0.65s linear infinite' }} />
              </div>
            )}

            {errorMessage && !isParsing && (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center', color: '#ef4444', fontSize: '14px', fontWeight: 'bold', lineHeight: '1.7' }}>
                {errorMessage}
              </div>
            )}

            <div
              ref={pdfContainerRef}
              style={{
                padding: '15px',
                maxWidth: '900px',
                margin: '0 auto',
                display: (!isParsing && !officeHtml && !errorMessage) ? 'block' : 'none'
              }}
            />

            {officeHtml && !isParsing && !errorMessage && (
              <div
                dangerouslySetInnerHTML={{ __html: officeHtml }}
                style={{ padding: '18px', boxSizing: 'border-box', color: '#f4f4f5' }}
              />
            )}
          </>
        ) : !isOnline ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '25px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-pure)', marginBottom: '8px' }}>
              لا يوجد اتصال بالإنترنت
            </div>
            <div style={{ fontSize: '13px', maxWidth: '300px', lineHeight: '1.6' }}>
              العرض المباشر لوضع الزائر يتطلب اتصالاً بالإنترنت. سجل دخولك وحمّل الملف ليُحفظ داخل حسابك ويعمل دون إنترنت.
            </div>
          </div>
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

// =========================================================================
// 🗂️ المكون الرئيسي MaterialsTab
// =========================================================================
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

  // فحص الملفات المحفوظة في حساب المستخدم والتأكد من صلاحيتها
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

  useEffect(() => {
    const clearOverlay = () => setDeleteOverlayId(null);
    window.addEventListener('click', clearOverlay);
    return () => window.removeEventListener('click', clearOverlay);
  }, []);

  const toggleSubjectCard = (subjName) => {
    setDeleteOverlayId(null);
    setSelectedSubject(selectedSubject === subjName ? null : subjName);
  };

  // --- ⚡ دالة تنزيل الملف وتحويله/فحصه وحفظه للعمل دون إنترنت ⚡ ---
  const handleDownloadToAccount = async (mat, e) => {
    e.stopPropagation();
    if (!user) return;
    if (downloadingMap[mat.id]) return;

    if (!navigator.onLine) {
      return showToast('يرجى الاتصال بالإنترنت لتنزيل الملف لأول مرة', 'error');
    }

    setDownloadingMap(prev => ({ ...prev, [mat.id]: true }));

    try {
      const fileId = extractDriveFileId(mat.url);
      const preferPdf = isPresentationOrDocHint(mat.name, mat.url) ? '1' : '0';

      // 🌟 الاعتماد الكلي على الـ API الخاص بمشروعك (api/drive.js)
      const fetchCandidates = [
        fileId ? `/api/drive?id=${fileId}&preferPdf=${preferPdf}` : null
      ].filter(Boolean);

      let validBlob = null;
      let detectedType = null;
      let specificError = null;

      for (const candidate of fetchCandidates) {
        try {
          const response = await fetch(candidate);
          
          if (response.status === 415) {
            specificError = 'صيغة الملف قديمة (.ppt أو .doc). يرجى رفعه بصيغة PPTX أو PDF ليعمل دون إنترنت.';
            break;
          }
          
          if (!response.ok) continue;

          const blob = await response.blob();
          const inspection = await inspectBlobContent(blob);

          if (inspection.valid) {
            validBlob = new Blob([blob], { type: inspection.mime });
            detectedType = inspection.fileType;
            break;
          } else if (inspection.reason === 'LEGACY_BINARY_OFFICE') {
            specificError = 'صيغة الملف قديمة. يرجى رفعه بصيغة PPTX أو PDF';
          }
        } catch (err) {
          console.error("Fetch error:", err);
        }
      }

      if (!validBlob || !detectedType) {
        throw new Error(specificError || 'تعذر تنزيل الملف، تأكد من أن صلاحية رابط Drive عامة');
      }

      const storageKey = `user_${user.uid}_mat_${mat.id}`;
      await offlineStore.setItem(storageKey, {
        id: mat.id,
        name: mat.name,
        blob: validBlob,
        fileType: detectedType,
        savedAt: Date.now()
      });

      setDownloadedMap(prev => ({ ...prev, [mat.id]: true }));
      if (navigator.vibrate) navigator.vibrate(40);
    } catch (error) {
      showToast(error.message || 'تعذر الحفظ المحلي، تأكد من أن رابط Drive عام', 'error');
    } finally {
      setDownloadingMap(prev => ({ ...prev, [mat.id]: false }));
    }
  };

  // --- 🖥️ دالة فتح وعرض الملف بملء الشاشة ---
  const handleOpenFullscreenViewer = async (mat, e) => {
    e.stopPropagation();

    if (user && downloadedMap[mat.id]) {
      try {
        const storageKey = `user_${user.uid}_mat_${mat.id}`;
        const record = await offlineStore.getItem(storageKey);
        if (record && record.blob) {
          setViewerData({
            title: mat.name,
            isOffline: true,
            blob: record.blob,
            fileType: record.fileType || 'pdf'
          });
          return;
        }
      } catch (err) {
        console.error('Error reading offline file:', err);
      }
    }

    // وضع الزائر (أونلاين)
    const embedUrl = getOnlineEmbedUrl(mat.url, mat.name);
    setViewerData({
      title: mat.name,
      isOffline: false,
      onlineUrl: embedUrl
    });
  };

  const handleCloseViewer = () => {
    setViewerData(null);
  };

  // --- 🗑️ دوال الضغط المطول وحذف الملف من الحساب ---
  const handleCardPressStart = (matId) => {
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

  // --- دوال الأدمن ---
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
                              <div style={{
                                width: '64px', height: '31px', borderRadius: '9px',
                                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                                border: '1px solid var(--border-line)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}>
                                <div className="versa-spinner" />
                              </div>
                            ) : isDownloaded ? (
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

      {/* نافذة الأدمن المنبثقة */}
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


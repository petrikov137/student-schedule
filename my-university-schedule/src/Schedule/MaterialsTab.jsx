// المسار: src/Schedule/MaterialsTab.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ref, set, remove } from 'firebase/database';
import { database } from '../firebase';
import localforage from 'localforage';

import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';
import JSZip from 'jszip';
import mammoth from 'mammoth';
import { init as initPptxPreview } from 'pptx-preview';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

const offlineStore = localforage.createInstance({
  name: 'VersaOfflineVault',
  storeName: 'user_materials_blobs'
});

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

const isPresentationHint = (name = '', url = '') => {
  const combined = `${name} ${url}`.toLowerCase();
  return (
    combined.includes('/presentation/') ||
    /\.(pptx|ppt)\b/.test(combined) ||
    combined.includes('powerpoint') ||
    combined.includes('بوربوينت') ||
    combined.includes('slide')
  );
};

const isPresentationOrDocHint = (name = '', url = '') => {
  const combined = `${name} ${url}`.toLowerCase();
  return (
    isPresentationHint(name, url) ||
    combined.includes('/document/') ||
    /\.(docx|doc)\b/.test(combined)
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

const inspectBlobContent = async (blob) => {
  if (!blob || blob.size < 64) {
    return { valid: false, reason: 'EMPTY_FILE' };
  }

  try {
    const headerBuffer = await blob.slice(0, 8).arrayBuffer();
    const bytes = new Uint8Array(headerBuffer);

    if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
      return { valid: true, fileType: 'pdf', mime: 'application/pdf' };
    }

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

async function renderOfflineWordFile(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  return `
    <div style="max-width:820px;margin:0 auto;background:#ffffff;color:#111827;padding:28px 24px;border-radius:14px;line-height:1.85;direction:auto;font-size:15px;box-shadow:0 10px 30px rgba(0,0,0,0.35);">
      ${result.value || '<p style="text-align:center;color:#6b7280;">المستند لا يحتوي على نصوص قابلة للعرض</p>'}
    </div>
  `;
}

async function renderOfflinePdfDocument(blob, containerElement) {
  const arrayBuffer = await blob.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  containerElement.innerHTML = '';

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const baseScale = window.innerWidth < 768 ? 1.25 : 1.55;

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: baseScale * dpr });

    const wrapper = document.createElement('div');
    wrapper.style.marginBottom = '14px';
    wrapper.style.borderRadius = '10px';
    wrapper.style.overflow = 'hidden';
    wrapper.style.boxShadow = '0 6px 18px rgba(0,0,0,0.35)';
    wrapper.style.backgroundColor = '#ffffff';

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.style.width = '100%';
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

const FullscreenDocumentViewer = ({ viewerData, onClose }) => {
  const [officeHtml, setOfficeHtml] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const [viewerMode, setViewerMode] = useState('pdf-scroll'); // 'slide-deck' | 'pptx-deck' | 'pdf-scroll' | 'word'
  const [currentSlide, setCurrentSlide] = useState(1);
  const [totalSlides, setTotalSlides] = useState(0);

  const pdfScrollContainerRef = useRef(null);
  const pdfSlideCanvasRef = useRef(null);
  const pptxHostRef = useRef(null);
  const pdfDocRef = useRef(null);
  const pptxInstanceRef = useRef(null);
  const touchStartXRef = useRef(null);

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

  const renderSinglePdfSlide = useCallback(async (pdfDoc, slideNum) => {
    const canvas = pdfSlideCanvasRef.current;
    if (!pdfDoc || !canvas) return;

    const page = await pdfDoc.getPage(slideNum);
    const unscaledViewport = page.getViewport({ scale: 1 });
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const maxW = Math.min(window.innerWidth - 24, 1100);
    const maxH = Math.max(window.innerHeight - 135, 260);
    const scaleToFit = Math.min(maxW / unscaledViewport.width, maxH / unscaledViewport.height);
    const viewport = page.getViewport({ scale: Math.max(scaleToFit, 0.5) * dpr });

    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.style.width = `${Math.round(viewport.width / dpr)}px`;
    canvas.style.height = `${Math.round(viewport.height / dpr)}px`;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport
    }).promise;
  }, []);

  const syncPptxVisibleSlide = useCallback((slideIndexOneBased) => {
    const host = pptxHostRef.current;
    if (!host) return;

    const wrapper = host.querySelector('.pptx-preview-wrapper') || host.firstElementChild;
    if (!wrapper) return;

    const slideNodes = Array.from(wrapper.children).filter(
      el => el.tagName === 'SECTION' || el.tagName === 'DIV'
    );

    if (slideNodes.length > 0) {
      slideNodes.forEach((node, idx) => {
        node.style.display = idx === slideIndexOneBased - 1 ? 'block' : 'none';
        node.style.margin = '0 auto';
      });
    }
  }, []);

  const goToSlide = useCallback(async (targetSlide) => {
    if (totalSlides < 1) return;
    const clamped = Math.max(1, Math.min(totalSlides, targetSlide));
    setCurrentSlide(clamped);

    if (viewerMode === 'slide-deck' && pdfDocRef.current) {
      await renderSinglePdfSlide(pdfDocRef.current, clamped);
    } else if (viewerMode === 'pptx-deck') {
      if (pptxInstanceRef.current && typeof pptxInstanceRef.current.renderSingleSlide === 'function') {
        pptxInstanceRef.current.renderSingleSlide(clamped - 1);
      } else {
        syncPptxVisibleSlide(clamped);
      }
    }
  }, [totalSlides, viewerMode, renderSinglePdfSlide, syncPptxVisibleSlide]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!viewerData?.isOffline || totalSlides <= 1) return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        goToSlide(currentSlide + 1);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        goToSlide(currentSlide - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewerData, totalSlides, currentSlide, goToSlide]);

  useEffect(() => {
    if (!viewerData) return;
    let isCancelled = false;

    const renderOffline = async () => {
      if (!viewerData.isOffline || !viewerData.blob) return;

      setIsParsing(true);
      setOfficeHtml('');
      setErrorMessage('');
      setCurrentSlide(1);
      setTotalSlides(0);
      pdfDocRef.current = null;
      pptxInstanceRef.current = null;

      if (pdfScrollContainerRef.current) pdfScrollContainerRef.current.innerHTML = '';
      if (pptxHostRef.current) pptxHostRef.current.innerHTML = '';

      try {
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
          const arrayBuffer = await viewerData.blob.arrayBuffer();
          const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          if (isCancelled) return;

          pdfDocRef.current = pdfDoc;
          const firstPage = await pdfDoc.getPage(1);
          const vp = firstPage.getViewport({ scale: 1 });
          const isLandscapeSlide = vp.width > vp.height * 1.05;
          const treatAsSlideDeck = viewerData.isSlideDeck || isLandscapeSlide || isPresentationHint(viewerData.title, '');

          if (treatAsSlideDeck) {
            setViewerMode('slide-deck');
            setTotalSlides(pdfDoc.numPages);
            setCurrentSlide(1);
            await renderSinglePdfSlide(pdfDoc, 1);
          } else {
            setViewerMode('pdf-scroll');
            if (pdfScrollContainerRef.current) {
              await renderOfflinePdfDocument(viewerData.blob, pdfScrollContainerRef.current);
            }
          }
        } else if (inspection.fileType === 'ppt') {
          setViewerMode('pptx-deck');
          const arrayBuffer = await viewerData.blob.arrayBuffer();

          const zip = await JSZip.loadAsync(arrayBuffer);
          const slideCount = Object.keys(zip.files).filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name)).length;

          if (slideCount === 0) {
            throw new Error('NO_SLIDES_FOUND');
          }

          if (!isCancelled && pptxHostRef.current) {
            pptxHostRef.current.innerHTML = '';
            const availW = Math.min(window.innerWidth - 24, 1000);
            const slideW = Math.max(availW, 320);
            const slideH = Math.round((slideW * 9) / 16);

            const previewer = initPptxPreview(pptxHostRef.current, {
              width: slideW,
              height: slideH,
              mode: 'slide'
            });

            pptxInstanceRef.current = previewer;
            await previewer.preview(arrayBuffer);

            if (!isCancelled) {
              setTotalSlides(slideCount);
              setCurrentSlide(1);
              setTimeout(() => syncPptxVisibleSlide(1), 30);
            }
          }
        } else if (inspection.fileType === 'word') {
          setViewerMode('word');
          const html = await renderOfflineWordFile(viewerData.blob);
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
  }, [viewerData, renderSinglePdfSlide, syncPptxVisibleSlide]);

  if (!viewerData) return null;

  const isSlideNavigationActive =
    viewerData.isOffline &&
    !isParsing &&
    !errorMessage &&
    (viewerMode === 'slide-deck' || viewerMode === 'pptx-deck') &&
    totalSlides > 0;

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
      {/* الشريط العلوي */}
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

      {/* منطقة العرض الرئيسية */}
      <div
        onTouchStart={(e) => {
          if (!isSlideNavigationActive) return;
          touchStartXRef.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (!isSlideNavigationActive || touchStartXRef.current === null) return;
          const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
          touchStartXRef.current = null;
          if (Math.abs(deltaX) > 45) {
            if (deltaX > 0) goToSlide(currentSlide + 1);
            else goToSlide(currentSlide - 1);
          }
        }}
        style={{
          flex: 1,
          width: '100%',
          height: isSlideNavigationActive ? 'calc(100vh - 110px)' : 'calc(100vh - 52px)',
          position: 'relative',
          overflowY: 'auto',
          overflowX: 'hidden',
          backgroundColor: '#121215',
          WebkitOverflowScrolling: 'touch',
          display: isSlideNavigationActive ? 'flex' : 'block',
          alignItems: isSlideNavigationActive ? 'center' : 'stretch',
          justifyContent: isSlideNavigationActive ? 'center' : 'flex-start'
        }}
      >
        {viewerData.isOffline ? (
          <>
            {isParsing && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 5 }}>
                <div style={{ width: '32px', height: '32px', border: '3px solid rgba(255, 255, 255, 0.2)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'versaSpin 0.65s linear infinite' }} />
              </div>
            )}

            {errorMessage && !isParsing && (
              <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center', color: '#ef4444', fontSize: '14px', fontWeight: 'bold', lineHeight: '1.7', boxSizing: 'border-box' }}>
                {errorMessage}
              </div>
            )}

            {/* 1. عارض الشرائح المرئية الكاملة (PDF المحول من PowerPoint/Slides) */}
            <div
              style={{
                display: (!isParsing && !errorMessage && viewerMode === 'slide-deck') ? 'flex' : 'none',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                padding: '12px',
                boxSizing: 'border-box'
              }}
            >
              <canvas
                ref={pdfSlideCanvasRef}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  borderRadius: '10px',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 12px 35px rgba(0, 0, 0, 0.5)'
                }}
              />
            </div>

            {/* 2. عارض شرائح PPTX المباشر (يحافظ على التصميم والأشكال والخلفيات) */}
            <div
              ref={pptxHostRef}
              style={{
                display: (!isParsing && !errorMessage && viewerMode === 'pptx-deck') ? 'flex' : 'none',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                padding: '12px',
                boxSizing: 'border-box',
                direction: 'ltr'
              }}
            />

            {/* 3. عارض مستندات PDF الطولية العادية */}
            <div
              ref={pdfScrollContainerRef}
              style={{
                padding: '15px',
                maxWidth: '900px',
                margin: '0 auto',
                display: (!isParsing && !errorMessage && viewerMode === 'pdf-scroll') ? 'block' : 'none'
              }}
            />

            {/* 4. عارض مستندات Word */}
            {officeHtml && !isParsing && !errorMessage && viewerMode === 'word' && (
              <div
                dangerouslySetInnerHTML={{ __html: officeHtml }}
                style={{ padding: '18px', boxSizing: 'border-box', color: '#f4f4f5', width: '100%' }}
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

      {/* شريط التنقل السفلي بين الشرائح (السابق / رقم الشريحة / التالي) */}
      {isSlideNavigationActive && (
        <div style={{
          height: '58px',
          backgroundColor: 'var(--card-bg-normal)',
          borderTop: '1px solid var(--border-line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '18px',
          padding: '0 16px',
          flexShrink: 0,
          direction: 'rtl'
        }}>
          <button
            className="mat-clean-btn"
            onClick={() => goToSlide(currentSlide - 1)}
            disabled={currentSlide <= 1}
            style={{
              backgroundColor: currentSlide <= 1 ? 'rgba(255,255,255,0.04)' : 'var(--primary-color)',
              color: currentSlide <= 1 ? 'var(--text-muted)' : '#ffffff',
              border: '1px solid var(--border-line)',
              borderRadius: '10px',
              padding: '7px 18px',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: currentSlide <= 1 ? 'not-allowed' : 'pointer',
              opacity: currentSlide <= 1 ? 0.5 : 1,
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            السابق
          </button>

          <span style={{
            color: 'var(--text-pure)',
            fontSize: '14px',
            fontWeight: 'bold',
            minWidth: '90px',
            textAlign: 'center',
            backgroundColor: 'rgba(0,0,0,0.3)',
            padding: '6px 14px',
            borderRadius: '10px',
            border: '1px solid var(--border-line)'
          }}>
            {currentSlide} / {totalSlides}
          </span>

          <button
            className="mat-clean-btn"
            onClick={() => goToSlide(currentSlide + 1)}
            disabled={currentSlide >= totalSlides}
            style={{
              backgroundColor: currentSlide >= totalSlides ? 'rgba(255,255,255,0.04)' : 'var(--primary-color)',
              color: currentSlide >= totalSlides ? 'var(--text-muted)' : '#ffffff',
              border: '1px solid var(--border-line)',
              borderRadius: '10px',
              padding: '7px 18px',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: currentSlide >= totalSlides ? 'not-allowed' : 'pointer',
              opacity: currentSlide >= totalSlides ? 0.5 : 1,
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            التالي
          </button>
        </div>
      )}
    </div>,
    document.body
  );
};

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
      const targetUrl = getDirectDownloadUrl(mat.url);
      const isSlideDeck = isPresentationHint(mat.name, mat.url);
      const preferPdf = isPresentationOrDocHint(mat.name, mat.url) ? '1' : '0';

      const fetchCandidates = [
        fileId ? `/api/drive?id=${fileId}&preferPdf=${preferPdf}` : null,
        (fileId && preferPdf === '1')
          ? `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(`https://docs.google.com/presentation/d/${fileId}/export/pdf`)}`
          : null,
        fileId
          ? `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(`https://docs.google.com/document/d/${fileId}/export?format=pdf`)}`
          : null,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`,
        fileId
          ? `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(`https://docs.google.com/presentation/d/${fileId}/export/pdf`)}`
          : null
      ].filter(Boolean);

      let validBlob = null;
      let detectedType = null;
      let specificError = null;

      for (const candidate of fetchCandidates) {
        try {
          const response = await fetch(candidate);
          if (response.status === 415) {
            specificError = 'صيغة الملف قديمة (.ppt). يرجى رفعه بصيغة PPTX أو PDF';
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
            specificError = 'صيغة الملف قديمة (.ppt). يرجى رفعه بصيغة PPTX أو PDF';
          }
        } catch (err) {}
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
        isSlideDeck: isSlideDeck || detectedType === 'ppt',
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
            fileType: record.fileType || 'pdf',
            isSlideDeck: !!record.isSlideDeck || isPresentationHint(mat.name, mat.url)
          });
          return;
        }
      } catch (err) {
        console.error('Error reading offline file:', err);
      }
    }

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

                          <span style={{
                            color: 'var(--text-pure)', fontWeight: 'bold', fontSize: '15px',
                            textAlign: 'right', flex: 1, lineHeight: '1.4', wordBreak: 'break-word'
                          }}>
                            {mat.name}
                          </span>

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
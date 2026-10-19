// المسار: api/drive.js

// دالة فحص البصمة الثنائية للتأكد من أن البيانات ملف صالح وليست صفحة HTML أو خطأ
function inspectFileSignature(buffer) {
  if (!buffer || buffer.byteLength < 8) return { valid: false, type: 'empty' };
  const bytes = new Uint8Array(buffer.slice(0, 8));

  // 1. بصمة ملف PDF صريح: %PDF (25 50 44 46)
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return { valid: true, type: 'pdf', mime: 'application/pdf' };
  }

  // 2. بصمة حاوية Office Open XML الحديثة (PPTX / DOCX): PK\x03\x04 (50 4B 03 04)
  if (bytes[0] === 0x50 && bytes[1] === 0x4B && bytes[2] === 0x03 && bytes[3] === 0x04) {
    return { valid: true, type: 'openxml', mime: 'application/octet-stream' };
  }

  // 3. بصمة ملفات الأوفيس القديمة Binary OLE2 (.ppt / .doc): D0 CF 11 E0
  if (bytes[0] === 0xD0 && bytes[1] === 0xCF && bytes[2] === 0x11 && bytes[3] === 0xE0) {
    return { valid: false, type: 'legacy_office' };
  }

  return { valid: false, type: 'unknown_or_html' };
}

export default async function handler(req, res) {
  const { id, preferPdf } = req.query;
  if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return res.status(400).json({ error: 'معرف الملف غير صالح' });
  }

  // ترتيب المسارات: إذا كان الملف عرضاً تقديمياً أو مستنداً، نفضل سحبه كـ PDF كامل التنسيق أولاً
  const exportEndpoints = [
    `https://docs.google.com/presentation/d/${id}/export/pdf`,
    `https://docs.google.com/document/d/${id}/export?format=pdf`
  ];

  const rawEndpoints = [
    `https://drive.google.com/uc?export=download&id=${id}&confirm=t`,
    `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`
  ];

  const urlsToTry = preferPdf === '1'
    ? [...exportEndpoints, ...rawEndpoints]
    : [...rawEndpoints, ...exportEndpoints];

  let detectedLegacyOffice = false;

  for (const url of urlsToTry) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': '*/*'
        },
        redirect: 'follow'
      });

      if (!response.ok) continue;

      const arrayBuffer = await response.arrayBuffer();
      const check = inspectFileSignature(arrayBuffer);

      if (check.type === 'legacy_office') {
        detectedLegacyOffice = true;
        continue; // نستمر في المحاولة عبر مسار التصدير إلى PDF
      }

      if (check.valid) {
        res.setHeader('Content-Type', check.mime);
        res.setHeader('X-Detected-File-Type', check.type);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Expose-Headers', 'X-Detected-File-Type');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.status(200).send(Buffer.from(arrayBuffer));
      }
    } catch (err) {
      // الانتقال للمسار البديل في حال فشل الاتصال
    }
  }

  if (detectedLegacyOffice) {
    return res.status(415).json({
      error: 'LEGACY_OFFICE_FORMAT',
      message: 'هذا الملف بصيغة أوفيس قديمة (.ppt / .doc). يرجى تحويله إلى PPTX أو PDF ليعمل دون إنترنت.'
    });
  }

  return res.status(502).json({
    error: 'DRIVE_FETCH_FAILED',
    message: 'تعذر جلب الملف من Google Drive. تأكد من أن صلاحية الرابط عامة (Anyone with the link).'
  });
}
///
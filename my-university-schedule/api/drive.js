// المسار: api/drive.js
export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).send('Missing file ID');

  const urlsToTry = [
    // 1. محاولة سحب الملف الأصلي المرفوع (PDF, PPTX, DOCX)
    `https://drive.google.com/uc?export=download&id=${id}&confirm=t`,
    // 2. إذا كان Google Slides أو Google Docs، نقوم بتصديره كـ PDF عالي الدقة لضمان عمله 100%
    `https://docs.google.com/presentation/d/${id}/export/pdf`,
    `https://docs.google.com/document/d/${id}/export?format=pdf`
  ];

  for (const url of urlsToTry) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        redirect: 'follow'
      });
      const contentType = response.headers.get('content-type') || '';

      if (response.ok && !contentType.includes('text/html')) {
        const arrayBuffer = await response.arrayBuffer();
        res.setHeader('Content-Type', contentType || 'application/octet-stream');
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(200).send(Buffer.from(arrayBuffer));
      }
    } catch (e) {
      // الانتقال للرابط التالي
    }
  }

  return res.status(500).send('Failed to fetch from Drive');
}
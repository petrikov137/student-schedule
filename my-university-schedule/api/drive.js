// المسار: api/drive.js
export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).send('Missing file ID');

  // روابط تدعم الملفات المرفوعة + مستندات جوجل + تخطي شاشة فحص الفيروسات
  const urlsToTry = [
    `https://drive.google.com/uc?export=download&id=${id}&confirm=t`,
    `https://docs.google.com/document/d/${id}/export?format=pdf`,
    `https://docs.google.com/presentation/d/${id}/export/pdf`
  ];

  for (const url of urlsToTry) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const contentType = response.headers.get('content-type') || '';

      if (response.ok && !contentType.includes('text/html')) {
        const arrayBuffer = await response.arrayBuffer();
        res.setHeader('Content-Type', contentType || 'application/octet-stream');
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(200).send(Buffer.from(arrayBuffer));
      }
    } catch (e) {
      // يجرب الرابط التالي تلقائياً
    }
  }

  return res.status(500).send('Failed to fetch from Drive');
}
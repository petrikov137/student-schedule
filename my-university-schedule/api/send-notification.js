import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'الطريقة غير مسموحة' });

  try {
    const { title, body, tokens } = req.body;
    if (!tokens || tokens.length === 0) return res.status(400).json({ error: 'لا يوجد أجهزة' });

    const message = {
      tokens: tokens,
      // 🌟 نرسل البيانات في قسم data فقط لتجنب التضارب 🌟
      data: {
        title: title || "تنبيه جديد",
        body: body || "تحديث في الجدول",
        url: "/"
      },
      // 🌟 أولوية قصوى لاختراق النوم العميق 🌟
      android: { priority: "high" },
      webpush: { headers: { Urgency: "high" } }
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    res.status(200).json({ success: true, response });
  } catch (error) {
    res.status(500).json({ error: 'فشل إرسال الإشعار' });
  }
}
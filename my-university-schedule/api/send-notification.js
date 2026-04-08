import admin from 'firebase-admin';

// هذا الكود يتصل بفايربيس بطريقة آمنة باستخدام "أسرار" سنضعها في لوحة Vercel لاحقاً
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'الطريقة غير مسموحة' });
  }

  try {
    const { title, body, tokens } = req.body;

    if (!tokens || tokens.length === 0) {
      return res.status(400).json({ error: 'لا يوجد أجهزة مشتركة' });
    }

    const message = {
      tokens: tokens,
      // 🌟 أعدنا هذا القسم لكي يفهم الأندرويد أنه إشعار هام ويوقظ الهاتف 🌟
      notification: { 
        title: title, 
        body: body 
      },
      // 🌟 أولوية قصوى لاختراق وضع توفير البطارية 🌟
      android: {
        priority: "high",
      },
      // 🌟 البيانات المرفقة لكي يعرف السيرفس ووركر أين يوجه الطالب عند الضغط 🌟
      data: {
        url: "/"
      }
    };

    // إرسال الإشعار لجميع الأجهزة المخزنة
    const response = await admin.messaging().sendEachForMulticast(message);
    
    res.status(200).json({ success: true, response });
  } catch (error) {
    console.error('خطأ في إرسال الإشعار:', error);
    res.status(500).json({ error: 'فشل إرسال الإشعار' });
  }
}
// ScheduleData/StaticTimetable.js

export const staticTimetable = {
  "الأحد": [
    // هذا الحدث سيظهر للكروبات (A, B) كـ محاضرة ثابتة
    { name: "مادة جديدة 1", type: "محاضرة", groups: ['A', 'B'], content: "محاضرة أساسية" },
    // هذا الحدث سيظهر للجميع كـ مختبر ثابت
    { name: "مادة جديدة 2", type: "مختبر", groups: [], content: "مختبر عام" }
  ],
  "الاثنين": [
    { name: "مادة جديدة 3", type: "محاضرة", groups: ['C', 'D'], content: "" }
  ],
  "الثلاثاء": [], // يوم فارغ
  "الأربعاء": [],
  "الخميس": []
};
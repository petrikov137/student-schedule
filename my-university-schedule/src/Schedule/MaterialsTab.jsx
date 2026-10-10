import React from 'react';

export default function MaterialsTab({ 
  availableSubjects, 
  selectedSubject, 
  setSelectedSubject, 
  activeMaterialsData 
}) {
  
  // دالة تحويل روابط درايف إلى روابط تحميل مباشر (تم نقلها من الملف الرئيسي)
  const getDirectDownloadLink = (url) => {
    if (!url) return "#";
    if (url.includes('drive.google.com/file/d/')) {
      const fileId = url.split('/file/d/')[1].split('/')[0];
      return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
    return url;
  };

  return (
    <div className="week-animate" style={{ paddingBottom: '30px' }}>
      <div style={{ WebkitTapHighlightColor: 'transparent', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {availableSubjects.map((subject, index) => {
          const isExpanded = selectedSubject === subject;
          
          const subjectMaterialsRaw = activeMaterialsData[subject];
          const subjectMaterials = Array.isArray(subjectMaterialsRaw) 
            ? subjectMaterialsRaw.filter(Boolean) 
            : Object.values(subjectMaterialsRaw || {}).filter(Boolean);
          
          const hasMaterials = subjectMaterials.length > 0;

          return (
            <div 
              key={index} 
              onClick={() => setSelectedSubject(isExpanded ? null : subject)} 
              className={`day-card ${isExpanded ? 'expanded' : ''} schedule-day-box`}
              style={{
                cursor: 'pointer',
                backgroundColor: isExpanded ? 'var(--card-bg-expanded)' : 'var(--card-bg-normal)',
                borderLeft: `5px solid var(--primary-color)`
              }}
            >
              <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-pure)' }}>{subject}</h3>
                <span style={{ fontSize: '13px', color: isExpanded ? 'var(--primary-color)' : 'var(--text-muted)', backgroundColor: isExpanded ? 'rgba(0,0,0,0.15)' : 'var(--card-bg-locked)', padding: '4px 10px', borderRadius: '8px', fontWeight: 'bold' }}>
                  {hasMaterials ? `${subjectMaterials.length} ملفات` : 'لا يوجد'}
                </span>
              </div>
              
              <div style={{ maxHeight: isExpanded ? '2000px' : '0px', opacity: isExpanded ? 1 : 0, transition: isExpanded ? 'max-height 1.3s ease, opacity 0.7s ease' : 'all 0.5s ease', borderTop: isExpanded ? '1px solid var(--border-line)' : 'none', overflow: 'hidden' }}>
                <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {hasMaterials ? (
                    subjectMaterials.map((mat, idx) => {
                      return (
                        <div key={idx} onClick={(e) => e.stopPropagation()} className="subject-inner-card" style={{ 
                          backgroundColor: 'var(--card-bg-locked)', 
                          borderRadius: '12px', 
                          padding: '12px 16px', 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          borderRight: `4px solid var(--primary-color)`,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'right' }}>
                            <span style={{ color: 'var(--text-pure)', fontWeight: 'bold', fontSize: '15px' }}>{mat.title}</span>
                            <span style={{ color: 'var(--text-details)', fontSize: '12px' }}>تمت الإضافة: {mat.date || 'حديثاً'}</span>
                          </div>
                          
                          <a 
                            href={getDirectDownloadLink(mat.link)} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            download 
                            style={{ 
                              backgroundColor: 'var(--primary-color)', 
                              color: 'white', 
                              padding: '8px 16px', 
                              borderRadius: '6px', 
                              textDecoration: 'none', 
                              fontSize: '13px', 
                              fontWeight: 'bold',
                              display: 'inline-block'
                            }}
                          >
                            تنزيل للجهاز ⬇️
                          </a>
                        </div>
                      )
                    })
                  ) : (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0', margin: 0, fontSize: '14px' }}>لم يتم إضافة ملازم لهذه المادة بعد.</p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}
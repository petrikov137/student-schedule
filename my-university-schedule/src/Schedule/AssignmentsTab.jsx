import React from 'react';

export default function AssignmentsTab({ 
  allAssignmentsList, 
  selectedSubject, 
  setSelectedSubject 
}) {

  // دالة حساب الوقت المتبقي للواجبات (تم نقلها من الملف الرئيسي)
  const getCountdown = (targetDate) => {
    const now = new Date();
    const target = new Date(targetDate);
    target.setHours(23, 59, 59, 999);
    const diff = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (diff < 0) return { text: "انتهى", color: "#ef4444" }; 
    if (diffDays === 0) return { text: "ينتهي اليوم", color: "#10b981" }; 
    if (diffDays === 1) return { text: "تبقى يوم", color: "#10b981" }; 
    if (diffDays === 2) return { text: "تبقى يومان", color: "#10b981" };
    if (diffDays <= 10) return { text: `تبقى ${diffDays} أيام`, color: "#10b981" }; 
    return { text: `تبقى ${diffDays} يوم`, color: "#10b981" }; 
  };

  return (
    <div className="week-animate" style={{ paddingBottom: '30px' }}>
      <div style={{ WebkitTapHighlightColor: 'transparent', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {allAssignmentsList.length > 0 ? (
          allAssignmentsList.map((assign, idx) => {
            const countdown = getCountdown(assign.targetDate);
            const isExpanded = selectedSubject === `assign-${idx}`;
            
            return (
              <div 
                key={idx} 
                onClick={() => setSelectedSubject(isExpanded ? null : `assign-${idx}`)} 
                className={`day-card ${isExpanded ? 'expanded' : ''} subject-inner-card`} 
                style={{ 
                  backgroundColor: 'var(--card-bg-locked)', 
                  borderRadius: '12px', 
                  display: 'flex', 
                  flexDirection: 'column',
                  borderRight: `4px solid ${countdown.color}`,
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  overflow: 'hidden'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
                  <span style={{ color: 'var(--text-pure)', fontWeight: 'bold', fontSize: '17px' }}>
                    {assign.type} {assign.name}
                  </span>
                  <span style={{ 
                    color: countdown.color, 
                    fontSize: '12px', 
                    fontWeight: 'bold', 
                    padding: '4px 10px', 
                    backgroundColor: `${countdown.color}1a`, 
                    borderRadius: '6px',
                    border: `1px solid ${countdown.color}4d`,
                    whiteSpace: 'nowrap'
                  }}>
                    {countdown.text}
                  </span>
                </div>
                
                <div style={{ maxHeight: isExpanded ? '2000px' : '0px', opacity: isExpanded ? 1 : 0, transition: isExpanded ? 'max-height 1.3s ease, opacity 0.7s ease' : 'all 0.5s ease', overflow: 'hidden' }}>
                  <div style={{ padding: '0 16px 16px 16px' }}>
                    <div style={{ color: 'var(--text-pure)', fontSize: '16px', whiteSpace: 'pre-wrap', lineHeight: '1.6', borderTop: '1px dashed var(--border-line)', paddingTop: '10px' }}>
                      {assign.content || 'لا توجد تفاصيل.'}
                      {assign.imageUrl && (
                        <div style={{ marginTop: '15px', borderTop: '1px dashed var(--border-line)', paddingTop: '15px', textAlign: 'center' }}>
                          <img 
                            src={assign.imageUrl} 
                            alt="المرفق" 
                            style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '8px', cursor: 'pointer', marginBottom: '10px' }} 
                            onClick={(e) => { e.stopPropagation(); window.open(assign.imageUrl, '_blank'); }}
                            onError={(e) => e.target.style.display = 'none'} 
                          />
                          <a 
                            href={assign.imageUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{ 
                              display: 'inline-block', backgroundColor: 'var(--primary-color)', color: 'white', padding: '8px 20px', borderRadius: '6px', textDecoration: 'none', fontSize: '13px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' 
                            }}
                          >
                           عرض
                          </a>
                        </div>
                      )}
                    </div>
                    <p> </p>
                     <div style={{ marginBottom: '8px', color: 'var(--text-details)', fontWeight: 'bold', fontSize: '12px' }}>
                       تاريخ التسليم: {assign.dayStr} ({assign.targetDate.getDate()} / {assign.targetDate.getMonth() + 1})
                      </div>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div style={{ backgroundColor: 'var(--card-bg-normal)', borderRadius: '12px', padding: '30px 20px', textAlign: 'center', borderLeft: '5px solid var(--dot-bg)' }}>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '15px', fontWeight: 'bold' }}>لا توجد واجبات أو تقارير نشطة حالياً.</p>
          </div>
        )}
      </div>
    </div>
  );
}
import React from 'react';

export default function ThemesTab({ themeCards, theme, handleThemeCardClick }) {
  return (
    <div className="week-animate" style={{ paddingBottom: '30px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {themeCards.map((t) => {
          const isActive = theme.startsWith(t.id);
          return (
            <div 
              key={t.id} 
              onClick={() => handleThemeCardClick(t.id)} 
              className="day-card schedule-day-box"
              style={{
                cursor: 'pointer',
                backgroundColor: isActive ? 'var(--card-bg-expanded)' : 'var(--card-bg-normal)',
                borderLeft: `5px solid ${t.color}`,
                boxShadow: isActive ? `0 0 10px ${t.color}40` : 'none',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>{t.icon}</span>
                  <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-pure)' }}>{t.name}</h3>
                </div>
                {isActive && (
                  <span style={{ color: t.color, fontWeight: 'bold', fontSize: '14px', backgroundColor: `${t.color}20`, padding: '4px 10px', borderRadius: '8px' }}>
                    ✓ مفعل
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}
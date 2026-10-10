import React from 'react';

// --- 🎨 الأيقونات الخاصة بشريط التنقل ---
const ScheduleIcon = () => (
  <svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor">
    <path d="M5.625 3.75a2.625 2.625 0 1 0 0 5.25h12.75a2.625 2.625 0 0 0 0-5.25H5.625ZM3.75 11.25a.75.75 0 0 0 0 1.5h16.5a.75.75 0 0 0 0-1.5H3.75ZM3 15.75a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75ZM3.75 18.75a.75.75 0 0 0 0 1.5h16.5a.75.75 0 0 0 0-1.5H3.75Z" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="100%" height="100%" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const MaterialsIcon = () => (
  <svg width="100%" height="100%" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
  </svg>
);

const AssignmentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%">
    <path d="M11.25 5.337c0-.355-.186-.676-.401-.959a1.647 1.647 0 0 1-.349-1.003c0-1.036 1.007-1.875 2.25-1.875S15 2.34 15 3.375c0 .369-.128.713-.349 1.003-.215.283-.401.604-.401.959 0 .332.278.598.61.578 1.91-.114 3.79-.342 5.632-.676a.75.75 0 0 1 .878.645 49.17 49.17 0 0 1 .376 5.452.657.657 0 0 1-.66.664c-.354 0-.675-.186-.958-.401a1.647 1.647 0 0 0-1.003-.349c-1.035 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401.31 0 .557.262.534.571a48.774 48.774 0 0 1-.595 4.845.75.75 0 0 1-.61.61c-1.82.317-3.673.533-5.555.642a.58.58 0 0 1-.611-.581c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.035-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959a.641.641 0 0 1-.658.643 49.118 49.118 0 0 1-4.708-.36.75.75 0 0 1-.645-.878c.293-1.614.504-3.257.629-4.924A.53.53 0 0 0 5.337 15c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.036 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.369 0 .713.128 1.003.349.283.215.604.401.959.401a.656.656 0 0 0 .659-.663 47.703 47.703 0 0 0-.31-4.82.75.75 0 0 1 .83-.832c1.343.155 2.703.254 4.077.294a.64.64 0 0 0 .657-.642Z" />
  </svg>
);

export default function BottomNav({ showBottomNav, activeTab, setActiveTab, setSelectedDay }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: showBottomNav ? '25px' : '-100px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 30px)',
      maxWidth: '420px',
      backgroundColor: 'var(--card-bg-normal)',
      border: '1px solid var(--border-line)',
      borderRadius: '30px',
      padding: '8px 12px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 15px 40px rgba(0,0,0,0.25)',
      backdropFilter: 'blur(15px)',
      WebkitBackdropFilter: 'blur(15px)',
      transition: 'bottom 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
      zIndex: 1000
    }}>
      {[
        { id: 'schedule', icon: <ScheduleIcon />, label: 'الجدول' },
        { id: 'materials', icon: <MaterialsIcon />, label: 'الملازم' },
        { id: 'assignments', icon: <AssignmentIcon />, label: 'الواجبات' },
        { id: 'settings', icon: <SettingsIcon />, label: 'الإعدادات' }
      ].map(item => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              if (item.id === 'schedule') setSelectedDay(null);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isActive ? '6px' : '0px',
              padding: isActive ? '12px 18px' : '12px',
              backgroundColor: isActive ? 'rgba(150, 150, 150, 0.15)' : 'transparent',
              color: isActive ? 'var(--primary-color)' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <div style={{
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
              transform: isActive ? 'scale(1.1)' : 'scale(1)'
            }}>
              {item.icon}
            </div>
            <span style={{
              fontWeight: 'bold',
              fontSize: '14px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              transition: 'max-width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease, margin 0.4s ease',
              maxWidth: isActive ? '100px' : '0px',
              opacity: isActive ? 1 : 0,
              marginLeft: isActive ? '4px' : '0px'
            }}>
              {item.label}
            </span>
          </button>
        )
      })}
    </div>
  );
}
import React, { useState, useEffect } from 'react';

// --- 🎨 مجموعة الأيقونات ---
const IconWrapper = ({ children, color }) => (
  <div style={{
    width: '32px', height: '32px', borderRadius: '8px',
    backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', flexShrink: 0
  }}>
    {children}
  </div>
);

const ArchiveIcon = () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>;
const GlobeIcon = () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const FontIcon = () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M3 6h18M3 18h18" /></svg>; 
const AnimationIcon = () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const DetailsIcon = () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>;
const MoonIcon = () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>;
const TeacherIcon = () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>;
const MailIcon = () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const LockIcon = () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
const UserIcon = () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const BioIcon = () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const TrashIcon = () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const LogoutIcon = () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const BugIcon = () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
const BulbIcon = () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>;
const InfoIcon = () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ChevronLeft = ({ isOpen }) => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)" strokeWidth={2} style={{ transform: isOpen ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.6s ease-in-out' }}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const CheckIconSmall = () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--primary-color)" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;

const ToggleSwitch = ({ isChecked, onChange }) => (
  <div onClick={(e) => { e.stopPropagation(); onChange(); }} style={{
    width: '44px', height: '24px', borderRadius: '12px',
    backgroundColor: isChecked ? 'var(--primary-color)' : 'var(--dot-bg)',
    position: 'relative', transition: 'background-color 0.3s', cursor: 'pointer'
  }}>
    <div style={{
      width: '20px', height: '20px', backgroundColor: '#fff', borderRadius: '50%',
      position: 'absolute', top: '2px', left: isChecked ? '2px' : '22px',
      transition: 'left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
    }} />
  </div>
);

export default function Settings({ 
  user, handleLogout, archivesList, selectedArchive, setSelectedArchive, showToast, 
  currentTheme, setTheme 
}) {
  
  const [isChangingLang, setIsChangingLang] = useState(false);
  const [lang, setLang] = useState(localStorage.getItem('app-lang') || 'ar');
  const [hideDetails, setHideDetails] = useState(localStorage.getItem('app-hide-details') === 'true');
  const [showTeachers, setShowTeachers] = useState(localStorage.getItem('app-show-teachers') === 'true');
  
  // 🌟 State الأنميشنات المتطورة 🌟
  const [interactiveAnimations, setInteractiveAnimations] = useState(localStorage.getItem('app-interactive-anim') !== 'false');
  const [backgroundAnimations, setBackgroundAnimations] = useState(localStorage.getItem('app-bg-anim') !== 'false');

  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);

  // 🌟 State نوع الخط 🌟
  const [appFont, setAppFont] = useState(localStorage.getItem('app-font') || 'Cairo');

  // 🌟 تطبيق الخط على الموقع 🌟
  useEffect(() => {
    document.body.style.fontFamily = appFont === 'Tajawal' ? "'Tajawal', sans-serif" : "'Cairo', sans-serif";
  }, [appFont]);

  // تأكيد تطبيق كلاس الخلفيات في حال تم التغيير من الإعدادات
  useEffect(() => {
    if (localStorage.getItem('app-bg-anim') === 'false') {
      document.documentElement.classList.add('disable-bg-anim');
    } else {
      document.documentElement.classList.remove('disable-bg-anim');
    }
  }, []);

  const handleLangChange = (newLang) => {
    if(lang === newLang) return;
    setIsChangingLang(true);
    setTimeout(() => {
      setLang(newLang);
      localStorage.setItem('app-lang', newLang);
      setIsChangingLang(false);
    }, 800);
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme); 
  };

  const handleFontChange = (newFont) => {
    setAppFont(newFont);
    localStorage.setItem('app-font', newFont);
  };

  const toggleToggle = (setter, key) => {
    setter(prev => {
      const newVal = !prev;
      localStorage.setItem(key, newVal);
      return newVal;
    });
  };

  // 🌟 دوال التحكم بالأنميشن 🌟
  const toggleInteractiveAnim = () => {
    setInteractiveAnimations(prev => {
      const newVal = !prev;
      localStorage.setItem('app-interactive-anim', newVal);
      return newVal;
    });
  };

  const toggleBackgroundAnim = () => {
    setBackgroundAnimations(prev => {
      const newVal = !prev;
      localStorage.setItem('app-bg-anim', newVal);
      if (!newVal) {
        document.documentElement.classList.add('disable-bg-anim');
      } else {
        document.documentElement.classList.remove('disable-bg-anim');
      }
      return newVal;
    });
  };

  const handleExpand = (sectionId) => {
    setExpandedSection(prev => prev === sectionId ? null : sectionId);
  };

  const SettingsItem = ({ id, icon, color, title, subtitle, rightElement, onClick, isLast, isDestructive, expandableContent }) => {
    const isExpanded = expandedSection === id;

    return (
      <div style={{ position: 'relative' }}>
        <div 
          onClick={expandableContent ? () => handleExpand(id) : onClick}
          style={{
            display: 'flex', alignItems: 'center', padding: '14px 16px',
            backgroundColor: 'var(--card-bg-normal)', cursor: (onClick || expandableContent) ? 'pointer' : 'default',
            transition: 'background-color 0.2s',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          <IconWrapper color={isDestructive ? '#ef4444' : color}>{icon}</IconWrapper>
          
          <div style={{ flex: 1, marginRight: '15px', display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
            <span style={{ fontSize: '16px', fontWeight: 'bold', color: isDestructive ? '#ef4444' : 'var(--text-pure)' }}>{title}</span>
            {subtitle && <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{subtitle}</span>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            {rightElement}
            {expandableContent && <ChevronLeft isOpen={isExpanded} />}
          </div>
        </div>

        {expandableContent && (
          <div style={{
            display: 'grid',
            gridTemplateRows: isExpanded ? '1fr' : '0fr',
            transition: 'grid-template-rows 0.5s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.5s ease',
            backgroundColor: isExpanded ? 'rgba(0,0,0,0.03)' : 'transparent',
          }}>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ 
                padding: isExpanded ? '5px 16px 15px 55px' : '0 16px 0 55px', 
                display: 'flex', flexDirection: 'column', gap: '8px',
                opacity: isExpanded ? 1 : 0, transition: 'opacity 0.4s ease, padding 0.5s ease'
              }}>
                {expandableContent}
              </div>
            </div>
          </div>
        )}

        {!isLast && <div style={{ height: '1px', backgroundColor: 'var(--border-line)', marginLeft: '50px' }} />}
      </div>
    );
  };

  const SettingsGroup = ({ title, children }) => (
    <div style={{ marginBottom: '25px', textAlign: 'right' }}>
      <h3 style={{ fontSize: '14px', color: 'var(--primary-color)', margin: '0 16px 8px 16px', fontWeight: 'bold' }}>{title}</h3>
      <div style={{ 
        backgroundColor: 'var(--card-bg-normal)', 
        borderRadius: '16px', 
        overflow: 'hidden',
        border: '1px solid var(--border-line)',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
      }}>
        {children}
      </div>
    </div>
  );

  const SubOption = ({ label, isActive, onClick }) => (
    <div 
      onClick={onClick}
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 15px', borderRadius: '10px',
        backgroundColor: isActive ? 'var(--card-bg-locked)' : 'transparent',
        color: isActive ? 'var(--primary-color)' : 'var(--text-pure)',
        fontWeight: isActive ? 'bold' : 'normal',
        cursor: 'pointer', transition: 'all 0.3s', border: '1px solid transparent',
        borderColor: isActive ? 'var(--border-line)' : 'transparent'
      }}
    >
      <span style={{ fontSize: '15px' }}>{label}</span>
      {isActive && <CheckIconSmall />}
    </div>
  );

  // 🌟 عنصر التبديل المصغر للأنميشنات 🌟
  const ToggleSubOption = ({ label, isChecked, onChange }) => (
    <div 
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 15px', borderRadius: '10px',
        backgroundColor: 'transparent',
        color: 'var(--text-pure)',
        transition: 'all 0.3s'
      }}
    >
      <span style={{ fontSize: '14px', flex: 1, textAlign: 'right' }}>{label}</span>
      <ToggleSwitch isChecked={isChecked} onChange={onChange} />
    </div>
  );

  return (
    <div className="week-animate" style={{ paddingBottom: '40px', position: 'relative' }}>
      
      {/* شاشة التحميل */}
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        backgroundColor: 'var(--bg-gradient)', backdropFilter: 'blur(10px)',
        zIndex: isChangingLang ? 9999 : -1, opacity: isChangingLang ? 1 : 0,
        transition: 'opacity 0.4s ease', display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: isChangingLang ? 'auto' : 'none'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
           <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid var(--border-line)', borderTop: '4px solid var(--primary-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
           <span style={{ color: 'var(--text-pure)', fontWeight: 'bold', fontSize: '16px' }}>جاري الترجمة...</span>
        </div>
      </div>

      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>

      {/* النافذة العائمة للأرشيف */}
      {showArchiveModal && (
        <div 
          onClick={() => setShowArchiveModal(false)}
          style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: showArchiveModal ? 1 : 0, transition: 'opacity 0.3s ease', padding: '20px'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--card-bg-normal)', width: '100%', maxWidth: '350px',
              borderRadius: '24px', padding: '25px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              border: '1px solid var(--border-line)', transform: showArchiveModal ? 'scale(1)' : 'scale(0.9)',
              transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ width: '50px', height: '50px', backgroundColor: '#3b82f6', borderRadius: '15px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px auto', boxShadow: '0 4px 10px rgba(59,130,246,0.3)' }}>
                <ArchiveIcon />
              </div>
              <h2 style={{ color: 'var(--text-pure)', margin: '0 0 5px 0', fontSize: '20px' }}>الأرشيف الأكاديمي</h2>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '13px' }}>اختر سنة دراسية لعرض جداولها وملازمها</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto', paddingRight: '5px' }}>
              <button 
                onClick={() => { setSelectedArchive(null); setShowArchiveModal(false); showToast("تم استرجاع السنة الحالية"); }}
                style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '15px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', backgroundColor: selectedArchive === null ? 'var(--primary-color)' : 'var(--card-bg-locked)', color: selectedArchive === null ? '#fff' : 'var(--text-pure)', border: `1px solid var(--border-line)` }}
              >
                <span>السنة الحالية (الأساسية)</span>
                {selectedArchive === null && <CheckIconSmall />}
              </button>

              {archivesList.length > 0 ? archivesList.map(arch => (
                <button 
                  key={arch} 
                  onClick={() => { setSelectedArchive(arch); setShowArchiveModal(false); showToast(`تم عرض سنة ${arch}`); }}
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '15px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', backgroundColor: selectedArchive === arch ? 'var(--primary-color)' : 'var(--card-bg-locked)', color: selectedArchive === arch ? '#fff' : 'var(--text-pure)', border: `1px solid var(--border-line)` }}
                >
                  <span>سنة {arch}</span>
                  {selectedArchive === arch && <CheckIconSmall />}
                </button>
              )) : <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', marginTop: '10px' }}>لا توجد سنوات سابقة في الأرشيف</p>}
            </div>

            <button onClick={() => setShowArchiveModal(false)} style={{ width: '100%', marginTop: '20px', padding: '14px', borderRadius: '12px', backgroundColor: 'transparent', color: 'var(--text-muted)', border: 'none', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}>إلغاء</button>
          </div>
        </div>
      )}

      {/* 1. مجموعة إعدادات الجدول */}
      <SettingsGroup title="إعدادات الجدول">
        <SettingsItem 
          icon={<ArchiveIcon />} color="#3b82f6" 
          title="الأرشيف الأكاديمي" 
          subtitle={selectedArchive ? `يتم عرض: ${selectedArchive}` : "يتم عرض: السنة الحالية"}
          onClick={() => setShowArchiveModal(true)}
          isLast={true}
        />
      </SettingsGroup>

      {/* 2. مجموعة المظهر والواجهة */}
      <SettingsGroup title="المظهر والواجهة">
        <SettingsItem 
          id="lang"
          icon={<GlobeIcon />} color="#8b5cf6" 
          title="لغة التطبيق" 
          subtitle={lang === 'ar' ? 'العربية' : 'English'}
          expandableContent={
            <>
              <SubOption label="العربية" isActive={lang === 'ar'} onClick={() => handleLangChange('ar')} />
              <SubOption label="English" isActive={lang === 'en'} onClick={() => handleLangChange('en')} />
            </>
          }
        />
        <SettingsItem 
          id="darkMode"
          icon={<MoonIcon />} color="#64748b" 
          title="نوع الوضع الداكن (السمة)" 
          subtitle="تخصيص ألوان البرنامج"
          expandableContent={
            <>
              <SubOption label="أزرق ومحيط (Ocean)" isActive={currentTheme === 'ocean'} onClick={() => handleThemeChange('ocean')} />
              <SubOption label="رمادي وزجاج (Glass)" isActive={currentTheme === 'glass'} onClick={() => handleThemeChange('glass')} />
              <SubOption label="فحمي وشفق (Twilight)" isActive={currentTheme === 'twilight'} onClick={() => handleThemeChange('twilight')} />
              <SubOption label="أسود وأحمر (Hearts)" isActive={currentTheme.includes('hearts')} onClick={() => handleThemeChange('hearts-dark')} />
              <SubOption label="أخضر ماتركس (Matrix)" isActive={currentTheme === 'matrix'} onClick={() => handleThemeChange('matrix')} />
            </>
          }
        />
        <SettingsItem 
          id="font"
          icon={<FontIcon />} color="#f59e0b" 
          title="نوع الخط" 
          subtitle={appFont === 'Tajawal' ? 'تجوال (Tajawal)' : 'كايرو (Cairo)'}
          expandableContent={
             <>
               <SubOption label="كايرو (Cairo) - الافتراضي" isActive={appFont === 'Cairo'} onClick={() => handleFontChange('Cairo')} />
               <SubOption label="تجوال (Tajawal)" isActive={appFont === 'Tajawal'} onClick={() => handleFontChange('Tajawal')} />
             </>
          }
        />
        {/* 🌟 ميزة الأنميشن الجديدة والموسعة 🌟 */}
        <SettingsItem 
          id="animations"
          icon={<AnimationIcon />} color="#ec4899" 
          title="التأثيرات الحركية (Animations)" 
          subtitle="التحكم بالتفاعلات الجمالية والخلفيات"
          expandableContent={
            <>
              <ToggleSubOption 
                label="التفاعلات الجمالية (عند الضغط)" 
                isChecked={interactiveAnimations} 
                onChange={toggleInteractiveAnim} 
              />
              <ToggleSubOption 
                label="الخلفيات المتحركة (المطر والماتركس)" 
                isChecked={backgroundAnimations} 
                onChange={toggleBackgroundAnim} 
              />
            </>
          }
        />
        <SettingsItem 
          icon={<DetailsIcon />} color="#10b981" 
          title="تفاصيل المواد" 
          subtitle="إخفاء الملاحظات الطويلة من الجدول"
          rightElement={<ToggleSwitch isChecked={hideDetails} onChange={() => toggleToggle(setHideDetails, 'app-hide-details')} />}
        />
        <SettingsItem 
          icon={<TeacherIcon />} color="#14b8a6" 
          title="أسماء الأساتذة" 
          subtitle="إظهار أسماء تدريسيي المواد"
          rightElement={<ToggleSwitch isChecked={showTeachers} onChange={() => toggleToggle(setShowTeachers, 'app-show-teachers')} />}
          isLast={true}
        />
      </SettingsGroup>

      {/* 3. مجموعة الحساب */}
      <SettingsGroup title="الحساب والأمان">
        {user ? (
          <>
            <SettingsItem icon={<UserIcon />} color="#6366f1" title="الاسم الشخصي" subtitle={user.displayName || 'طالب'} />
            <SettingsItem icon={<MailIcon />} color="#f43f5e" title="البريد الإلكتروني" subtitle={user.email} />
            <SettingsItem icon={<BioIcon />} color="#0ea5e9" title="البايو (النبذة)" onClick={() => showToast("قريباً")} />
            <SettingsItem icon={<LockIcon />} color="#8b5cf6" title="تغيير كلمة المرور" onClick={() => showToast("قريباً")} />
            <SettingsItem icon={<LogoutIcon />} color="#ef4444" title="تسجيل الخروج" isDestructive={true} onClick={handleLogout} />
            <SettingsItem icon={<TrashIcon />} color="#ef4444" title="حذف الحساب نهائياً" isLast={true} isDestructive={true} onClick={() => showToast("للحذف تواصل مع الإدارة")} />
          </>
        ) : (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>يجب تسجيل الدخول للوصول للحساب</p>
          </div>
        )}
      </SettingsGroup>

      {/* 4. مجموعة المساعدة */}
      <SettingsGroup title="المساعدة والدعم">
        <SettingsItem icon={<BugIcon />} color="#ef4444" title="الإبلاغ عن مشكلة" onClick={() => showToast("سيتم فتح نافذة الإبلاغ")} />
        <SettingsItem icon={<BulbIcon />} color="#f59e0b" title="اقتراح ميزة جديدة" onClick={() => showToast("سيتم فتح نافذة الاقتراحات")} />
        <SettingsItem icon={<InfoIcon />} color="#3b82f6" title="حول نظام Versa" subtitle="الإصدار 3.5.0" isLast={true} onClick={() => showToast("نظام إدارة أكاديمي ذكي")} />
      </SettingsGroup>

    </div>
  );
}
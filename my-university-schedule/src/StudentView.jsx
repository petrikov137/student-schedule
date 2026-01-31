import { useState, useEffect } from 'react'
import { database } from './firebase'
import { ref, onValue } from 'firebase/database'

function StudentView() {
  const weeks = [
    "الأسبوع الأول", "الأسبوع الثاني", "الأسبوع الثالث", "الأسبوع الرابع", "الأسبوع الخامس",
    "الأسبوع السادس", "الأسبوع السابع", "الأسبوع الثامن", "الأسبوع التاسع", "الأسبوع العاشر",
    "الأسبوع الحادي عشر", "الأسبوع الثاني عشر", "الأسبوع الثالث عشر", "الأسبوع الرابع عشر", "الأسبوع الخامس عشر"
  ];

  const days = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"];

  const [allScheduleData, setAllScheduleData] = useState({});
  const [loading, setLoading] = useState(true);
  
  const [currentWeek, setCurrentWeek] = useState(0); 
  const [selectedDay, setSelectedDay] = useState(null);

  const [hoveredWeek, setHoveredWeek] = useState(null);
  const [forceRender, setForceRender] = useState(0); 

  useEffect(() => {
    const dataRef = ref(database, '/');
    onValue(dataRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setAllScheduleData(data);
      setLoading(false);
    });

    const calculateCurrentWeek = () => {
      const calculationStartDate = new Date(2026, 0, 30);
      calculationStartDate.setHours(12, 0, 0, 0);

      const today = new Date();
      today.setHours(12, 0, 0, 0);

      const diffTime = today.getTime() - calculationStartDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      let calculatedWeek = Math.floor(diffDays / 7);

      if (calculatedWeek < 0) calculatedWeek = 0;
      if (calculatedWeek > 14) calculatedWeek = 14;

      setCurrentWeek(calculatedWeek);
    };

    calculateCurrentWeek();

  }, []);

  const getDayDataHelper = (weekIdx, dayName) => {
    const weekKey = `week_${weekIdx}`;
    return allScheduleData[weekKey] && allScheduleData[weekKey][dayName] ? allScheduleData[weekKey][dayName] : null;
  }

  const hasNewUpdate = (day) => {
    const dayData = getDayDataHelper(currentWeek, day);
    if (!dayData || !dayData.lastUpdated) return false;

    const storageKey = `seen_week_${currentWeek}_day_${day}`;
    const lastSeenTime = localStorage.getItem(storageKey);

    if (!lastSeenTime) return true;
    return dayData.lastUpdated > parseInt(lastSeenTime);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        setSelectedDay(null);
        setCurrentWeek((prev) => (prev < weeks.length - 1 ? prev + 1 : 0));
      } 
      else if (e.key === 'ArrowRight') {
        setSelectedDay(null);
        setCurrentWeek((prev) => (prev > 0 ? prev - 1 : weeks.length - 1));
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault(); 
        const currentIndex = days.indexOf(selectedDay);
        if (e.key === 'ArrowDown') {
          if (selectedDay === null) setSelectedDay(days[0]);
          else if (currentIndex < days.length - 1) setSelectedDay(days[currentIndex + 1]);
        } 
      }
      else if (e.key === 'ArrowUp') {
          const currentIndex = days.indexOf(selectedDay);
          if (currentIndex > 0) setSelectedDay(days[currentIndex - 1]);
          else if (currentIndex === 0) setSelectedDay(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDay, weeks.length]); 


  const nextWeek = () => { 
    setSelectedDay(null);
    if (currentWeek < weeks.length - 1) setCurrentWeek(currentWeek + 1); else setCurrentWeek(0);
  }
  const prevWeek = () => { 
    setSelectedDay(null);
    if (currentWeek > 0) setCurrentWeek(currentWeek - 1); else setCurrentWeek(weeks.length - 1);
  }

  const toggleDay = (day, isLocked) => { 
    if (isLocked) return; 

    if (selectedDay !== day) {
        const storageKey = `seen_week_${currentWeek}_day_${day}`;
        localStorage.setItem(storageKey, Date.now().toString());
        setForceRender(prev => prev + 1); 
    }

    selectedDay === day ? setSelectedDay(null) : setSelectedDay(day); 
  }

  const getDayData = (day) => {
    const weekKey = `week_${currentWeek}`;
    return allScheduleData[weekKey] && allScheduleData[weekKey][day] ? allScheduleData[weekKey][day] : null;
  }

  const getDateForDay = (dayIndex) => {
    const startDate = new Date(2026, 1, 1); 
    const daysToAdd = (currentWeek * 7) + dayIndex;
    startDate.setDate(startDate.getDate() + daysToAdd);
    return `${startDate.getDate()} / ${startDate.getMonth() + 1}`;
  }

  if (loading) return <div style={{ color: 'white', marginTop: '310px' }}>جارِ جلب الجدول..</div>;

  return (
    <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto', padding: '0 0px' }}>
      
      <style>
        {`
          @keyframes gradientFadeMove {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}
      </style>

      <h1 style={{ textAlign: 'center', color: 'white', marginBottom: '20px', marginTop: '10px' }}>
        الجدول الأسبوعي
      </h1>

      <div key={currentWeek} className="week-animate">
        
        <div style={{ backgroundColor: '#208de7b0', color: 'white', padding: '15px', borderRadius: '10px', marginBottom: '30px' }}>
          <h2 style={{ margin: 0, textAlign: 'center' }}>{weeks[currentWeek]}</h2>
        </div>

        <div style={{ WebkitTapHighlightColor: 'transparent', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {days.map((day, index) => {
            const dayInfo = getDayData(day);
            const isLocked = !dayInfo || !dayInfo.isOpen;
            const isExpanded = selectedDay === day;
            const dateString = getDateForDay(index);
            const isExam = dayInfo ? dayInfo.isExam : false;
            const statusColor = isExam ? '#ff0000d1' : '#15ff00c7';

            const showNotification = hasNewUpdate(day) && !isExpanded && !isLocked;

            return (
              <div 
                key={index} 
                onClick={() => toggleDay(day, isLocked)} 
                className={`day-card ${isExpanded ? 'expanded' : ''}`}
                style={{
                  opacity: isLocked ? 0.6 : 1, 
                  cursor: isLocked ? 'default' : 'pointer',
                  transition: 'all 0.3s ease',

                  ...(showNotification ? {
                    backgroundImage: 'linear-gradient(270deg, #2a2a2a, #444, #555, #2a2a2a)', 
                    backgroundSize: '400% 400%', 
                    animation: 'gradientFadeMove 3s ease infinite',
                    boxShadow: `0 0 15px ${statusColor}40`,
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    borderRight: '1px solid rgba(255,255,255,0.1)'
                  } : {
                    backgroundColor: isLocked ? '#2a2a2a' : '#333',
                  }),

                  borderLeft: isLocked ? '5px solid #555' : `5px solid ${statusColor}`
                }}
              >
                <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', color: isLocked ? '#aaa' : 'white' }}>
                    {day} {isExam && !isLocked && !isExpanded ? '!!' : ''}
                  </h3>
                  <span style={{ fontSize: '14px', color: isLocked ? '#777' : (isExpanded ? statusColor : 'rgba(255,255,255,0.5)'), backgroundColor: isExpanded ? `${statusColor}1a` : 'transparent', padding: '4px 10px', borderRadius: '8px', fontWeight: 'bold', transition: 'all 0.3s ease', fontFamily: 'sans-serif' }}>{dateString}</span>
                </div>
                <div style={{ maxHeight: isExpanded ? '2000px' : '0px', opacity: isExpanded ? 1 : 0, transition: isExpanded ? 'max-height 1.3s ease, opacity 0.7s ease' : 'all 0.5s ease', borderTop: isExpanded ? '1px solid rgba(255,255,255,0.2)' : 'none' }}>
                  <div style={{ padding: '15px 0 20px 0' }}>
                    <div style={{ margin: '10px 0', fontSize: '18px' }}>
                      {dayInfo && Array.isArray(dayInfo.subjects) ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                          {dayInfo.subjects.map((subj, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '5px', whiteSpace: 'pre-wrap', padding: '12px 0', borderBottom: idx !== dayInfo.subjects.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                              <span style={{ color: '#1cd10b', fontWeight: 'bold', minWidth: 'fit-content' }}>{subj.name}</span>
                              <span style={{ color: 'white' }}> : </span>
                              <span style={{ color: 'white', flex: 1 }}>{subj.content}</span>
                            </div>
                          ))}
                        </div>
                      ) : ( <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{dayInfo ? dayInfo.subjects : "فراغ"}</p> )}
                    </div>
                    <p style={{ margin: '20px 0 10px 0', fontSize: '18px', whiteSpace: 'pre-wrap', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '10px' }}>
                      <strong style={{ color: '#ffeb3b' }}>ملاحظات: </strong><br/>{dayInfo ? dayInfo.note : "-"}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ marginTop: '40px', paddingBottom: '20px' }}>
        
        <div 
          className="dots-container" 
          onMouseLeave={() => setHoveredWeek(null)}
          style={{
            WebkitTapHighlightColor: 'transparent',  
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            flexWrap: 'wrap', 
            gap: '8px',
            marginBottom: '20px',
          }}
        >
          {weeks.map((_, index) => {
            let scale = 1; let transitionDelay = '0s'; let boxShadow = 'none'; let opacity = 1; 
            if (hoveredWeek !== null) {
              if (index === hoveredWeek) { scale = 1.6; transitionDelay = '0s'; opacity = 1; } 
              else if (Math.abs(index - hoveredWeek) === 1) { scale = 1.25; transitionDelay = '0.05s'; opacity = 1; } 
              else if (Math.abs(index - hoveredWeek) === 2) { scale = 1.1; transitionDelay = '0.1s'; opacity = 1; }
            } else { if (index === currentWeek) { scale = 1.5; opacity = 1; } }

            return (
              <div key={index} onClick={() => { setCurrentWeek(index); setSelectedDay(null); }} onMouseEnter={() => setHoveredWeek(index)} className={`dot ${currentWeek === index ? 'active' : ''}`} style={{ transform: `scale(${scale})`, willChange: 'transform', backfaceVisibility: 'hidden', transition: 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.3s ease, box-shadow 0.3s ease', transitionDelay: transitionDelay, boxShadow: boxShadow, opacity: opacity, cursor: 'pointer' }}></div>
            )
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 5px' }}>
          <button onClick={prevWeek} style={{ WebkitTapHighlightColor: 'transparent', backgroundColor: '#208de7b0', color: 'white', cursor: 'pointer', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}><span>&rarr;</span> <span>السابق</span></button>
          <button onClick={nextWeek} style={{ WebkitTapHighlightColor: 'transparent', backgroundColor: '#208de7b0', color: 'white', cursor: 'pointer', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}><span>التالي</span> <span>&larr;</span></button>
        </div>
      </div>
    </div>
  )
}

export default StudentView
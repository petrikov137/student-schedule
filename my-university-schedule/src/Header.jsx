import React, { useState, useEffect, useRef } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging, database } from './firebase';
import { ref, set } from 'firebase/database';

// --- 🎨 طقم أيقونات الثيمات المزاجية ---

const HeartsIcon = ({ color }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={color}>
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

const CoffeeThemeIcon = ({ color }) => (
  <svg width="18" height="18" viewBox="0 0 511.996 511.996" fill={color} xmlns="http://www.w3.org/2000/svg">
    <path d="M431.571,229.096c-2.968,0-5.279,0.174-8.827,0.49v35.628h0.004c0,0.076,0.04,0.151,0.039,0.228 c2.843-0.566,5.802-0.869,8.809-0.869c24.76,0,44.914,20.143,44.914,44.904s-20.139,44.903-44.899,44.903 c-9.524,0-18.354-2.988-25.628-8.064c-4.214,9.709-9.165,19.13-14.894,28.155c-0.671,1.057-1.375,2.087-2.065,3.13 c12.358,7.754,26.955,12.258,42.59,12.258c44.323,0,80.382-36.059,80.382-80.382S475.894,229.096,431.571,229.096z"></path>
    <path d="M444.057,417.622h-89.983h-39.435c51.954-31.93,84.457-90.187,84.457-152.409v-61.642H62.054v61.642 c0,62.223,33.15,120.479,85.104,152.409h-39.434H17.739C7.942,417.622,0,425.564,0,435.361S7.942,453.1,17.739,453.1h38.373 h24.177c4.641,17.739,20.272,29.565,38.8,29.565h223.512c18.527,0,34.16-11.826,38.8-29.565h24.177h38.478 c9.797,0,17.739-7.942,17.739-17.739S453.854,417.622,444.057,417.622z"></path>
    <path d="M177.756,148.643l-8.7-6.992c-3.355-2.696-5.246-6.71-5.188-11.014c0.058-4.303,2.057-8.265,5.484-10.869 c12.012-9.13,19.112-23.016,19.48-38.1s-6.047-29.299-17.599-39.003c-7.501-6.301-18.691-5.328-24.993,2.174 c-6.301,7.501-5.328,18.691,2.174,24.993c4.45,3.737,5.012,8.478,4.952,10.972c-0.06,2.493-0.854,7.201-5.48,10.718 c-12.18,9.256-19.285,23.338-19.49,38.635c-0.207,15.297,6.513,29.566,18.439,39.15l8.7,6.992 c3.277,2.633,7.201,3.912,11.101,3.912c5.19,0,10.335-2.267,13.839-6.627C186.609,165.946,185.393,154.781,177.756,148.643z"></path>
    <path d="M251.423,157.823l-10.205-8.2c-4.675-3.757-7.31-9.351-7.228-15.348c0.08-5.997,2.867-11.517,7.641-15.147 c13.342-10.14,21.229-25.564,21.637-42.317s-6.716-32.544-19.547-43.322c-7.501-6.302-18.692-5.329-24.992,2.172 c-6.302,7.501-5.329,18.691,2.172,24.992c4.529,3.804,7.045,9.378,6.899,15.291c-0.144,5.913-2.928,11.358-7.637,14.936 c-13.528,10.28-21.419,25.922-21.649,42.913c-0.231,16.99,7.234,32.84,20.479,43.483l3.807,3.058l6.398,5.142 c3.278,2.632,7.203,3.912,11.102,3.912c5.19,0,10.335-2.267,13.839-6.627c0.621-0.773,1.147-1.589,1.618-2.426 C259.943,172.909,258.287,163.338,251.423,157.823z"></path>
    <path d="M322.319,148.643l-8.7-6.992c-3.355-2.696-5.246-6.71-5.188-11.014c0.058-4.303,2.057-8.265,5.484-10.869 c12.012-9.13,19.112-23.016,19.48-38.1c0.368-15.084-6.047-29.299-17.599-39.003c-7.502-6.301-18.692-5.328-24.993,2.174 c-6.301,7.501-5.328,18.691,2.174,24.993c4.45,3.737,5.012,8.478,4.952,10.972c-0.061,2.493-0.854,7.201-5.48,10.718 c-12.18,9.256-19.285,23.338-19.49,38.635c-0.207,15.297,6.513,29.566,18.439,39.15l8.7,6.992 c3.277,2.633,7.201,3.912,11.101,3.912c5.19,0,10.335-2.267,13.839-6.627C331.172,165.946,329.956,154.781,322.319,148.643z"></path>
  </svg>
);

const OceanThemeIcon = ({ color }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M4.58167 6.01037C5.27244 4.99469 6.71529 5.03259 7.44359 5.90937C8.42557 7.09155 9.80993 8.24983 12.0002 8.24983C14.2279 8.24983 15.5911 7.31995 16.5187 6.15371C17.2401 5.24674 18.7776 5.10103 19.5337 6.17693C20.1521 7.05691 20.8281 7.75783 22.1624 8.05353C22.5668 8.14315 22.822 8.54363 22.7324 8.94803C22.6428 9.35244 22.2423 9.60762 21.8379 9.518C19.9969 9.11001 19.0392 8.08213 18.3064 7.0394C18.2578 6.97023 18.171 6.91916 18.04 6.9215C17.904 6.92393 17.7732 6.98622 17.6927 7.08746C16.5174 8.56506 14.7413 9.74983 12.0002 9.74983C9.1773 9.74983 7.41088 8.21753 6.28974 6.86782C6.2245 6.78928 6.1275 6.7479 6.02885 6.74989C5.93349 6.75182 5.86412 6.79199 5.822 6.85393C5.07583 7.95107 4.11857 9.0845 2.16243 9.518C1.75803 9.60762 1.35754 9.35244 1.26793 8.94803C1.17831 8.54363 1.43349 8.14315 1.83789 8.05353C3.2498 7.74063 3.92606 6.97435 4.58167 6.01037ZM4.58167 16.0104C5.27244 14.9947 6.71529 15.0326 7.44359 15.9094C8.42557 17.0915 9.80993 18.2498 12.0002 18.2498C14.2279 18.2498 15.5911 17.3199 16.5187 16.1537C17.2401 15.2467 18.7776 15.101 19.5337 16.1769C20.1521 17.0569 20.8281 17.7578 22.1624 18.0535C22.5668 18.1431 22.822 18.5436 22.7324 18.948C22.6428 19.3524 22.2423 19.6076 21.8379 19.518C19.9969 19.11 19.0392 18.0821 18.3064 17.0394C18.2578 16.9702 18.171 16.9192 18.04 16.9215C17.904 16.9239 17.7732 16.9862 17.6927 17.0875C16.5174 18.5651 14.7413 19.7498 12.0002 19.7498C9.1773 19.7498 7.41088 18.2175 6.28974 16.8678C6.2245 16.7893 6.1275 16.7479 6.02885 16.7499C5.93349 16.7518 5.86412 16.792 5.822 16.8539C5.07583 17.9511 4.11857 19.0845 2.16243 19.518C1.75803 19.6076 1.35754 19.3524 1.26793 18.948C1.17831 18.5436 1.43349 18.1431 1.83789 18.0535C3.2498 17.7406 3.92606 16.9744 4.58167 16.0104Z" fill={color}></path>
    <path opacity="0.6" d="M4.58167 11.0104C5.27244 9.99469 6.71529 10.0326 7.44359 10.9094C8.42557 12.0915 9.80993 13.2498 12.0002 13.2498C14.2279 13.2498 15.5911 12.3199 16.5187 11.1537C17.2401 10.2467 18.7776 10.101 19.5337 11.1769C20.1521 12.0569 20.8281 12.7578 22.1624 13.0535C22.5668 13.1431 22.822 13.5436 22.7324 13.948C22.6428 14.3524 22.2423 14.6076 21.8379 14.518C19.9969 14.11 19.0392 13.0821 18.3064 12.0394C18.2578 11.9702 18.171 11.9192 18.04 11.9215C17.904 11.9239 17.7732 11.9862 17.6927 12.0875C16.5174 13.5651 14.7413 14.7498 12.0002 14.7498C9.1773 14.7498 7.41088 13.2175 6.28974 11.8678C6.2245 11.7893 6.1275 11.7479 6.02885 11.7499C5.93349 11.7518 5.86412 11.792 5.822 11.8539C5.07583 12.9511 4.11857 14.0845 2.16243 14.518C1.75803 14.6076 1.35754 14.3524 1.26793 13.948C1.17831 13.5436 1.43349 13.1431 1.83789 13.0535C3.2498 12.7406 3.92606 11.9744 4.58167 11.0104Z" fill={color}></path>
  </svg>
);

const TwilightThemeIcon = ({ color }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.8114 6.7267C12.8247 4.9089 13.3314 4 14.0889 4C14.8464 4 15.353 4.9089 16.3663 6.7267L16.6285 7.19699C16.9164 7.71355 17.0604 7.97183 17.2849 8.14225C17.5094 8.31266 17.789 8.37592 18.3482 8.50244L18.8572 8.61762C20.825 9.06284 21.8089 9.28545 22.0429 10.0382C22.277 10.7909 21.6063 11.5753 20.2648 13.1439L19.9177 13.5498C19.5365 13.9955 19.3459 14.2184 19.2602 14.4942C19.1744 14.7699 19.2032 15.0673 19.2609 15.662L19.3133 16.2035C19.5162 18.2965 19.6176 19.343 19.0047 19.8082C18.3919 20.2734 17.4707 19.8492 15.6283 19.0009L15.1517 18.7815C14.6281 18.5404 14.3664 18.4199 14.0889 18.4199C13.8114 18.4199 13.5496 18.5404 13.0261 18.7815L12.5494 19.0009C10.707 19.8492 9.78581 20.2734 9.17299 19.8082C8.56016 19.343 8.66157 18.2965 8.86438 16.2035L8.91685 15.662C8.97449 15.0673 9.0033 14.7699 8.91756 14.4942C8.83181 14.2184 8.64121 13.9955 8.26 13.5498L7.91295 13.1439C6.57147 11.5753 5.90073 10.7909 6.1348 10.0382C6.36888 9.28545 7.35275 9.06284 9.3205 8.61762L9.82958 8.50244C10.3887 8.37592 10.6683 8.31266 10.8928 8.14225C11.1173 7.97183 11.2613 7.71355 11.5492 7.19699L11.8114 6.7267Z" fill={color}></path>
    <path opacity="0.5" fillRule="evenodd" clipRule="evenodd" d="M8.74549 5.20241C6.76387 4.63138 4.63821 4.933 2.58729 6.13407L2.37913 6.25598C2.0217 6.4653 1.56226 6.34523 1.35293 5.9878C1.14361 5.63037 1.26368 5.17092 1.62111 4.9616L1.82927 4.8397C4.18969 3.45737 6.73702 3.0626 9.16083 3.76106L9.36871 3.82096C9.76673 3.93566 9.99641 4.35129 9.88171 4.74931C9.76702 5.14733 9.35139 5.37701 8.95337 5.26231L8.74549 5.20241ZM4.83628 9.93646C4.87144 10.3492 4.56537 10.7123 4.15265 10.7474C3.99949 10.7605 3.88206 10.7679 3.78365 10.7742C3.60627 10.7854 3.49069 10.7928 3.33902 10.8219C3.14253 10.8596 2.8874 10.9394 2.4244 11.1709C2.05391 11.3562 1.60341 11.206 1.41817 10.8355C1.23293 10.465 1.38309 10.0145 1.75358 9.8293C2.29057 9.5608 2.68032 9.42092 3.05627 9.34876C3.30317 9.30137 3.55804 9.28477 3.78724 9.26984C3.87053 9.26441 3.95043 9.25921 4.02533 9.25283C4.43804 9.21767 4.80112 9.52374 4.83628 9.93646ZM5.91788 15.8561C4.73392 15.5786 3.48653 15.8538 2.55316 16.5892C2.22781 16.8456 1.75624 16.7896 1.49988 16.4643C1.24353 16.1389 1.29946 15.6674 1.62482 15.411C2.92261 14.3884 4.63911 14.0158 6.2601 14.3956C6.66339 14.4901 6.91371 14.8937 6.81921 15.297C6.72471 15.7003 6.32117 15.9506 5.91788 15.8561Z" fill="#8b5cf6"></path>
  </svg>
);

const PaperIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z" clipRule="evenodd" />
    <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
  </svg>
);

const ScheduleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M5.625 3.75a2.625 2.625 0 1 0 0 5.25h12.75a2.625 2.625 0 0 0 0-5.25H5.625ZM3.75 11.25a.75.75 0 0 0 0 1.5h16.5a.75.75 0 0 0 0-1.5H3.75ZM3 15.75a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75ZM3.75 18.75a.75.75 0 0 0 0 1.5h16.5a.75.75 0 0 0 0-1.5H3.75Z" />
  </svg>
);

// 🌟 أيقونة الواجبات 🌟
const AssignmentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M11.25 5.337c0-.355-.186-.676-.401-.959a1.647 1.647 0 0 1-.349-1.003c0-1.036 1.007-1.875 2.25-1.875S15 2.34 15 3.375c0 .369-.128.713-.349 1.003-.215.283-.401.604-.401.959 0 .332.278.598.61.578 1.91-.114 3.79-.342 5.632-.676a.75.75 0 0 1 .878.645 49.17 49.17 0 0 1 .376 5.452.657.657 0 0 1-.66.664c-.354 0-.675-.186-.958-.401a1.647 1.647 0 0 0-1.003-.349c-1.035 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401.31 0 .557.262.534.571a48.774 48.774 0 0 1-.595 4.845.75.75 0 0 1-.61.61c-1.82.317-3.673.533-5.555.642a.58.58 0 0 1-.611-.581c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.035-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959a.641.641 0 0 1-.658.643 49.118 49.118 0 0 1-4.708-.36.75.75 0 0 1-.645-.878c.293-1.614.504-3.257.629-4.924A.53.53 0 0 0 5.337 15c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.036 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.369 0 .713.128 1.003.349.283.215.604.401.959.401a.656.656 0 0 0 .659-.663 47.703 47.703 0 0 0-.31-4.82.75.75 0 0 1 .83-.832c1.343.155 2.703.254 4.077.294a.64.64 0 0 0 .657-.642Z" />
  </svg>
);

// 🌟 أيقونة الجرس مع أنيميشن الخط المائل 🌟
const BellIcon = ({ isSubscribed }) => {
  return (
    <div style={{ position: 'relative', width: '18px', height: '18px' }}>
      <svg 
        width="18" height="18" viewBox="0 0 24 24" 
        fill={isSubscribed ? "currentColor" : "none"} 
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={{
          position: 'absolute', top: 0, left: 0,
          transition: 'fill 0.3s ease'
        }}
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
      </svg>
      
      <svg 
        width="18" height="18" viewBox="0 0 24 24" 
        style={{
          position: 'absolute', top: 0, left: 0,
          pointerEvents: 'none'
        }}
      >
        <line 
          x1="3" y1="3" x2="21" y2="21" 
          stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          style={{
            strokeDasharray: 26,
            strokeDashoffset: isSubscribed ? 26 : 0, 
            transition: 'stroke-dashoffset 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: isSubscribed ? 0 : 1 
          }}
        />
      </svg>
    </div>
  );
};

function Header({ currentTheme, onThemeSelect, activeTab, onTabChange }) {
  const [isThemesOpen, setIsThemesOpen] = useState(false);
  const themesContainerRef = useRef(null);
  
  const [hoveredThemeId, setHoveredThemeId] = useState(null);
  const [pressedThemeId, setPressedThemeId] = useState(null);

  const isLightVariantActive = currentTheme.includes('-light') || currentTheme === 'hearts' || currentTheme === 'light';
  const [isNightMode, setIsNightMode] = useState(!isLightVariantActive);

  const [isSubscribed, setIsSubscribed] = useState(localStorage.getItem('fcm_subscribed') === 'true');
  
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const [isSwinging, setIsSwinging] = useState(false);

  const showAppToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  useEffect(() => {
    const unsubscribe = onMessage(messaging, (payload) => {
      if (payload.notification) {
        showAppToast(`🔔 ${payload.notification.title}: ${payload.notification.body}`);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSubscribe = async () => {
    if (isSubscribed) {
      setIsSubscribed(false);
      localStorage.setItem('fcm_subscribed', 'false');
      showAppToast('تم كتم الإشعارات 🔕');
    } else {
      try {
        setIsSwinging(true);
        setTimeout(() => setIsSwinging(false), 800);

        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setIsSubscribed(true);
          localStorage.setItem('fcm_subscribed', 'true');
          
          try {
            const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
            const token = await getToken(messaging, { 
              vapidKey: 'BE-ZU08UafjtNFOXQYvEW_OOjmTdo-D7SNCS4UVXEsmueTo-Nt84D6j5yM5srwrxVEu7xnC24LYjR1FdrjW5fuI',
              serviceWorkerRegistration: swRegistration 
            });
            
            if (token) {
              await set(ref(database, 'fcmTokens/' + token), true);
            }
          } catch (e) { console.log('FCM token skip:', e); }
          
          showAppToast('تم تفعيل الإشعارات 🔔');
        } else {
          showAppToast('تم رفض الصلاحية من المتصفح ❌');
        }
      } catch (error) {
        console.error('خطأ في تفعيل الإشعارات:', error);
      }
    }
  };

  useEffect(() => {
    if (!messaging) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('استلمت إشعار والتطبيق مفتوح: ', payload);
      
      const title = payload.notification?.title || payload.data?.title || "تنبيه جديد";
      const options = {
        body: payload.notification?.body || payload.data?.body,
        icon: '/pwa-192x192.png',
        vibrate: [200, 100, 200],
        dir: 'rtl'
      };

      if (Notification.permission === 'granted') {
        new Notification(title, options);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (themesContainerRef.current && !themesContainerRef.current.contains(event.target)) {
        setIsThemesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleModeAndOpen = (e) => {
    const newIsNight = !isNightMode;
    setIsNightMode(newIsNight); 
    setIsThemesOpen(true); 

    const themeMap = {
      'coffee': 'coffee-light', 'coffee-light': 'coffee',
      'ocean': 'ocean-light', 'ocean-light': 'ocean',
      'twilight': 'twilight-light', 'twilight-light': 'twilight',
      'hearts-dark': 'hearts', 'hearts': 'hearts-dark',
      'dark': 'light', 'light': 'dark'
    };
    
    if (themeMap[currentTheme]) {
      onThemeSelect(themeMap[currentTheme], e);
    } else {
      onThemeSelect(newIsNight ? 'dark' : 'light', e);
    }
  };

  const getThemeColor = (baseId) => {
    switch(baseId) {
      case 'twilight': return isNightMode ? '#7e22ce' : '#9333ea';
      case 'ocean': return isNightMode ? '#0284c7' : '#0094f7';
      case 'hearts': return isNightMode ? '#fda4af' : '#f43f5e';
      case 'coffee': return isNightMode ? '#8b5a2b' : '#d28c47';
      default: return 'currentColor';
    }
  };

  const baseThemesDefinitions = [
    { baseId: 'twilight', dark: 'twilight', light: 'twilight-light', icon: <TwilightThemeIcon color={getThemeColor('twilight')} /> },
    { baseId: 'ocean', dark: 'ocean', light: 'ocean-light', icon: <OceanThemeIcon color={getThemeColor('ocean')} /> },
    { baseId: 'hearts', dark: 'hearts-dark', light: 'hearts', icon: <HeartsIcon color={getThemeColor('hearts')} /> },
    { baseId: 'coffee', dark: 'coffee', light: 'coffee-light', icon: <CoffeeThemeIcon color={getThemeColor('coffee')} /> }
  ];

  return (
    <>
      <style>
        {`
          @keyframes sweep-glint {
            0% { right: -100%; }
            100% { right: 200%; }
          }
          .glint-box {
            position: relative; overflow: hidden; width: 100%; height: 100%;
            display: flex; align-items: center; justify-content: center; border-radius: 6px;
          }
          .glint-beam {
            position: absolute; top: 0; bottom: 0; width: 100%;
            background: linear-gradient(to left, rgba(255,255,255,0) 0%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0) 100%);
            transform: skewX(-25deg); animation: sweep-glint 0.8s cubic-bezier(0.4, 0, 0.2, 1) both;
            pointer-events: none; z-index: 2;
          }
          
          @keyframes swing-bell {
            0% { transform: rotate(0deg); }
            15% { transform: rotate(15deg); }
            30% { transform: rotate(-15deg); }
            45% { transform: rotate(10deg); }
            60% { transform: rotate(-10deg); }
            75% { transform: rotate(5deg); }
            100% { transform: rotate(0deg); }
          }
          .swinging {
            animation: swing-bell 0.8s ease-in-out;
            transform-origin: top center;
          }
        `}
      </style>

      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 15px',
        height: '48px', backgroundColor: 'transparent', borderBottom: '1px solid var(--border-line)', position: 'relative', marginBottom: '20px'
      }}>
        
        <div 
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${showToast ? 1 : 0.8})`,
            opacity: showToast ? 1 : 0,
            pointerEvents: 'none',
            backgroundColor: 'var(--card-bg-locked)',
            color: 'var(--text-pure)',
            padding: '6px 16px',
            borderRadius: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: '1px solid var(--primary-color)',
            zIndex: 50,
            fontWeight: 'bold',
            fontSize: '12px',
            textAlign: 'center',
            transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
            whiteSpace: 'nowrap'
          }}
        >
          {toastMessage}
        </div>

        <div ref={themesContainerRef} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            onClick={toggleModeAndOpen}
            style={{
              background: 'transparent', border: 'none', color: 'var(--text-pure)', cursor: 'pointer',
              padding: '6px', borderRadius: '6px', transition: 'background-color 0.3s ease', zIndex: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
              width: '32px', height: '32px', overflow: 'hidden',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--card-bg-locked)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div style={{ position: 'absolute', transition: 'all 0.5s ease-in-out', transform: isNightMode ? 'rotate(0deg) scale(1)' : 'rotate(-180deg) scale(0)', opacity: isNightMode ? 1 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="-2.4 -2.4 28.80 28.80" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19.9001 2.30719C19.7392 1.8976 19.1616 1.8976 19.0007 2.30719L18.5703 3.40247C18.5212 3.52752 18.4226 3.62651 18.298 3.67583L17.2067 4.1078C16.7986 4.26934 16.7986 4.849 17.2067 5.01054L18.298 5.44252C18.4226 5.49184 18.5212 5.59082 18.5703 5.71587L19.0007 6.81115C19.1616 7.22074 19.7392 7.22074 19.9001 6.81116L20.3305 5.71587C20.3796 5.59082 20.4782 5.49184 20.6028 5.44252L21.6941 5.01054C22.1022 4.849 22.1022 4.26934 21.6941 4.1078L20.6028 3.67583C20.4782 3.62651 20.3796 3.52752 20.3305 3.40247L19.9001 2.30719Z" fill="currentColor"></path><path d="M16.0328 8.12967C15.8718 7.72009 15.2943 7.72009 15.1333 8.12967L14.9764 8.52902C14.9273 8.65407 14.8287 8.75305 14.7041 8.80237L14.3062 8.95987C13.8981 9.12141 13.8981 9.70107 14.3062 9.86261L14.7041 10.0201C14.8287 10.0694 14.9273 10.1684 14.9764 10.2935L15.1333 10.6928C15.2943 11.1024 15.8718 11.1024 16.0328 10.6928L16.1897 10.2935C16.2388 10.1684 16.3374 10.0694 16.462 10.0201L16.8599 9.86261C17.268 9.70107 17.268 9.12141 16.8599 8.95987L16.462 8.80237C16.3374 8.75305 16.2388 8.65407 16.1897 8.52902L16.0328 8.12967Z" fill="currentColor"></path><path d="M12 22C17.5228 22 22 17.5228 22 12C22 11.5373 21.3065 11.4608 21.0672 11.8568C19.9289 13.7406 17.8615 15 15.5 15C11.9101 15 9 12.0899 9 8.5C9 6.13845 10.2594 4.07105 12.1432 2.93276C12.5392 2.69347 12.4627 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="currentColor"></path></svg>
            </div>
            <div style={{ position: 'absolute', transition: 'all 0.5s ease-in-out', transform: !isNightMode ? 'rotate(0deg) scale(1)' : 'rotate(180deg) scale(0)', opacity: !isNightMode ? 1 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 12C17 14.7614 14.7614 17 12 17C9.23858 17 7 14.7614 7 12C7 9.23858 9.23858 7 12 7C14.7614 7 17 9.23858 17 12Z" fill="currentColor"></path><path fillRule="evenodd" clipRule="evenodd" d="M12 1.25C12.4142 1.25 12.75 1.58579 12.75 2V4C12.75 4.41421 12.4142 4.75 12 4.75C11.5858 4.75 11.25 4.41421 11.25 4V2C11.25 1.58579 11.5858 1.25 12 1.25ZM3.66865 3.71609C3.94815 3.41039 4.42255 3.38915 4.72825 3.66865L6.95026 5.70024C7.25596 5.97974 7.2772 6.45413 6.9977 6.75983C6.7182 7.06553 6.2438 7.08677 5.9381 6.80727L3.71609 4.77569C3.41039 4.49619 3.38915 4.02179 3.66865 3.71609ZM20.3314 3.71609C20.6109 4.02179 20.5896 4.49619 20.2839 4.77569L18.0619 6.80727C17.7562 7.08677 17.2818 7.06553 17.0023 6.75983C16.7228 6.45413 16.744 5.97974 17.0497 5.70024L19.2718 3.66865C19.5775 3.38915 20.0518 3.41039 20.3314 3.71609ZM1.25 12C1.25 11.5858 1.58579 11.25 2 11.25H4C4.41421 11.25 4.75 11.5858 4.75 12C4.75 12.4142 4.41421 12.75 4 12.75H2C1.58579 12.75 1.25 12.4142 1.25 12ZM19.25 12C19.25 11.5858 19.5858 11.25 20 11.25H22C22.4142 11.25 22.75 11.5858 22.75 12C22.75 12.4142 22.4142 12.75 22 12.75H20C19.5858 12.75 19.25 12.4142 19.25 12ZM17.0255 17.0252C17.3184 16.7323 17.7933 16.7323 18.0862 17.0252L20.3082 19.2475C20.6011 19.5404 20.601 20.0153 20.3081 20.3082C20.0152 20.6011 19.5403 20.601 19.2475 20.3081L17.0255 18.0858C16.7326 17.7929 16.7326 17.3181 17.0255 17.0252ZM6.97467 17.0253C7.26756 17.3182 7.26756 17.7931 6.97467 18.086L4.75244 20.3082C4.45955 20.6011 3.98468 20.6011 3.69178 20.3082C3.39889 20.0153 3.39889 19.5404 3.69178 19.2476L5.91401 17.0253C6.2069 16.7324 6.68177 16.7324 6.97467 17.0253ZM12 19.25C12.4142 19.25 12.75 19.5858 12.75 20V22C12.75 22.4142 12.4142 22.75 12 22.75C11.5858 22.75 11.25 22.4142 11.25 22V20C11.25 19.5858 11.5858 19.25 12 19.25Z" fill="currentColor"></path></svg>
            </div>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', pointerEvents: isThemesOpen ? 'auto' : 'none' }}>
            {baseThemesDefinitions.map((themeObj, index) => {
              const currentModeId = isNightMode ? themeObj.dark : themeObj.light;
              const isHovered = hoveredThemeId === themeObj.baseId;
              const isPressed = pressedThemeId === themeObj.baseId;

              let targetScale = 1;
              if (isPressed) {
                targetScale = 0.9;
              } else if (isHovered) {
                targetScale = 1.15;
              }
              
              return (
                <div 
                  key={themeObj.baseId} 
                  onClick={(e) => onThemeSelect(currentModeId, e)}
                  onMouseEnter={() => setHoveredThemeId(themeObj.baseId)}
                  onMouseLeave={() => { setHoveredThemeId(null); setPressedThemeId(null); }}
                  onMouseDown={() => setPressedThemeId(themeObj.baseId)}
                  onMouseUp={() => setPressedThemeId(null)}
                  onTouchStart={() => setPressedThemeId(themeObj.baseId)}
                  onTouchEnd={() => setPressedThemeId(null)}
                  style={{
                    backgroundColor: 'transparent', border: 'none', padding: '4px 6px', borderRadius: '6px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-pure)', width: '32px', height: '32px',
                    zIndex: isHovered || isPressed ? 10 : 1, 
                    transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1.1)', 
                    transitionDelay: (isThemesOpen && hoveredThemeId === null && pressedThemeId === null) ? `${index * 0.05}s` : '0s', 
                    transformOrigin: 'center center',
                    transform: isThemesOpen ? `translateX(0px) scale(${targetScale})` : `translateX(${(index + 1) * 36}px) scale(0.6)`,
                    opacity: isThemesOpen ? 1 : 0,
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  <div className="glint-box" key={String(isNightMode)}>
                    {themeObj.icon}
                    <div className="glint-beam" style={{ animationDelay: `${index * 0.12}s` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            onClick={handleSubscribe}
            className={isSwinging ? 'swinging' : ''} 
            style={{
              background: 'transparent', border: 'none', color: 'var(--primary-color)',
              cursor: 'pointer', padding: '6px', borderRadius: '6px', transition: 'all 0.3s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
              width: '32px', height: '32px',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--card-bg-locked)'; e.currentTarget.style.color = 'var(--text-pure)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--primary-color)'; }}
            title={isSubscribed ? 'إيقاف الإشعارات' : 'تفعيل الإشعارات'}
          >
            <BellIcon isSubscribed={isSubscribed} />
          </button>

          {/* 🌟 زر التبديل للواجبات 🌟 */}
          <button 
            onClick={() => onTabChange(activeTab === 'assignments' ? 'schedule' : 'assignments')}
            style={{
              background: 'transparent', border: 'none', color: activeTab === 'assignments' ? 'var(--text-pure)' : 'var(--primary-color)',
              cursor: 'pointer', padding: '6px', borderRadius: '6px', transition: 'all 0.3s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
              width: '32px', height: '32px', overflow: 'hidden',
              backgroundColor: activeTab === 'assignments' ? 'var(--primary-color)' : 'transparent',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => { if(activeTab !== 'assignments') { e.currentTarget.style.backgroundColor = 'var(--card-bg-locked)'; e.currentTarget.style.color = 'var(--text-pure)'; } }}
            onMouseLeave={(e) => { if(activeTab !== 'assignments') { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--primary-color)'; } }}
            title={activeTab === 'assignments' ? "العودة للجدول" : "الواجبات والتقارير"}
          >
            <div style={{ 
              position: 'absolute', transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', 
              opacity: activeTab !== 'assignments' ? 1 : 0, transform: activeTab !== 'assignments' ? 'scale(1)' : 'scale(0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}>
              <AssignmentIcon />
            </div>

            <div style={{ 
              position: 'absolute', transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', 
              opacity: activeTab === 'assignments' ? 1 : 0, transform: activeTab === 'assignments' ? 'scale(1)' : 'scale(0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}>
              <ScheduleIcon />
            </div>
          </button>

          {/* 🌟 زر التبديل للملازم 🌟 */}
          <button 
            onClick={() => onTabChange(activeTab === 'materials' ? 'schedule' : 'materials')}
            style={{
              background: 'transparent', border: 'none', color: activeTab === 'materials' ? 'var(--text-pure)' : 'var(--primary-color)',
              cursor: 'pointer', padding: '6px', borderRadius: '6px', transition: 'all 0.3s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
              width: '32px', height: '32px', overflow: 'hidden',
              backgroundColor: activeTab === 'materials' ? 'var(--primary-color)' : 'transparent',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => { if(activeTab !== 'materials') { e.currentTarget.style.backgroundColor = 'var(--card-bg-locked)'; e.currentTarget.style.color = 'var(--text-pure)'; } }}
            onMouseLeave={(e) => { if(activeTab !== 'materials') { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--primary-color)'; } }}
            title={activeTab === 'materials' ? "العودة للجدول" : "الملازم الدراسية"}
          >
            <div style={{ 
              position: 'absolute', transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', 
              opacity: activeTab !== 'materials' ? 1 : 0, transform: activeTab !== 'materials' ? 'scale(1)' : 'scale(0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}>
              <PaperIcon />
            </div>

            <div style={{ 
              position: 'absolute', transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', 
              opacity: activeTab === 'materials' ? 1 : 0, transform: activeTab === 'materials' ? 'scale(1)' : 'scale(0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}>
              <ScheduleIcon />
            </div>
          </button>

        </div>
      </header>
    </>
  );
}

export default Header;
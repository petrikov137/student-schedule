import { useState, useEffect } from "react";
import { auth, googleProvider } from "./firebase";
import { signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  // لضمان تناسق الثيم مع صفحة تسجيل الدخول
  const [theme, setTheme] = useState(localStorage.getItem('app-theme') || 'ocean');
  
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError("");
    try {
      await signInWithPopup(auth, googleProvider);
      // توجيه المستخدم للرئيسية بعد تسجيل الدخول بنجاح
      navigate("/"); 
    } catch (err) {
      setError("فشل تسجيل الدخول، يرجى المحاولة مرة أخرى.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = () => {
     navigate("/"); 
  };

  return (
    <div className="main-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      
      <div style={{ 
        backgroundColor: 'var(--card-bg-normal)', 
        padding: '40px 30px', 
        borderRadius: '20px', 
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)', 
        border: '1px solid var(--border-line)',
        width: '100%', 
        maxWidth: '350px',
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        gap: '20px',
        backdropFilter: 'blur(10px)'
      }}>
        
        <div style={{ width: '80px', height: '80px', backgroundColor: 'var(--card-bg-locked)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px', border: '1px solid var(--border-line)' }}>
          <span style={{ fontSize: '40px' }}>📚</span>
        </div>
        
        <div style={{ textAlign: 'center' }}>
            <h1 style={{ margin: 0, color: 'var(--text-pure)', fontSize: '24px', marginBottom: '8px' }}>Versa</h1>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.5' }}>
                نظام إدارة الجدول الدراسي. <br/>سجل دخولك للوصول إلى الملاحظات والميزات المتقدمة.
            </p>
        </div>

        {error && (
            <div style={{ backgroundColor: 'rgba(255,0,0,0.1)', color: '#ff4444', padding: '10px', borderRadius: '8px', fontSize: '13px', width: '100%', textAlign: 'center', border: '1px solid #ff4444' }}>
                {error}
            </div>
        )}

        <button 
          onClick={handleGoogleLogin} 
          disabled={isLoading}
          style={{ 
            width: '100%', 
            backgroundColor: '#ffffff', 
            color: '#000000', 
            border: 'none', 
            borderRadius: '12px', 
            padding: '12px 15px', 
            fontSize: '15px',
            fontWeight: 'bold',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            WebkitTapHighlightColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            opacity: isLoading ? 0.7 : 1
          }}
        >
          {isLoading ? (
            <span>جاري التحميل...</span>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              المتابعة باستخدام Google
            </>
          )}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', width: '100%', margin: '5px 0' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-line)' }}></div>
            <span style={{ padding: '0 10px', color: 'var(--text-muted)', fontSize: '12px' }}>أو</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-line)' }}></div>
        </div>

        <button 
          onClick={handleGuestLogin} 
          style={{ 
            width: '100%', 
            backgroundColor: 'transparent', 
            color: 'var(--text-main)', 
            border: '1px solid var(--border-line)', 
            borderRadius: '12px', 
            padding: '12px 15px', 
            fontSize: '15px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            WebkitTapHighlightColor: 'transparent',
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--card-bg-locked)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          المتابعة كزائر (بدون تسجيل)
        </button>

      </div>
    </div>
  );
};

export default Login;
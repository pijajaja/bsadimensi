import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Home, Gamepad2, UserCircle, Settings, FileText, Users, 
  Moon, Sun, Plus, MessageCircle, Feather, PenTool, BookOpenCheck, 
  Landmark, BookHeart, Globe, Check, X, Trash2, ThumbsUp, LogOut, Search
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInAnonymously, onAuthStateChanged, 
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updatePassword,
  signInWithCustomToken
} from 'firebase/auth';
import { 
  getFirestore, collection, onSnapshot, doc, setDoc, 
  updateDoc, addDoc, arrayUnion, arrayRemove
} from 'firebase/firestore';

// --- CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyDJ0G2GQPMjtP8atxWDh8yX5kZdDV5UjDA",
  authDomain: "al-bud-b9af9.firebaseapp.com",
  projectId: "al-bud-b9af9",
  storageBucket: "al-bud-b9af9.firebasestorage.app",
  messagingSenderId: "414499709060",
  appId: "1:414499709060:web:1852782556776230b362d1",
  measurementId: "G-FT6STPS6TG"
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// Perbaikan Vercel 1: Gunakan window checking agar ESLint tidak error "undeclared variable"
const appId = typeof window !== 'undefined' && window.__app_id ? window.__app_id : 'al-bud-b9af9';

export default function App() {
  // --- STATE ---
  const [theme, setTheme] = useState('light');
  const [view, setView] = useState('login'); 
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  
  // Data State
  const [allUsers, setAllUsers] = useState([]);
  const [allArticles, setAllArticles] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  
  // Selections
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);

  // --- INITIALIZATION ---
  useEffect(() => {
    const initAuth = async () => {
      // Perbaikan Vercel 2: Gunakan window checking
      if (typeof window !== 'undefined' && window.__initial_auth_token) {
        await signInWithCustomToken(auth, window.__initial_auth_token);
      } else if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setIsAdmin(false);
        setUserProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // --- FIRESTORE SYNC ---
  useEffect(() => {
    if (!user) return;

    // Users
    const unsubUsers = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'users'), 
      (snapshot) => {
        const list = snapshot.docs.map(d => ({ uid: d.id, ...d.data() }));
        setAllUsers(list);
        const me = list.find(u => u.uid === user.uid);
        if (me) setUserProfile(me);
      }, (e) => console.error(e));

    // Articles
    const unsubArticles = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'articles'), 
      (snapshot) => {
        setAllArticles(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (e) => console.error(e));

    // Quiz
    const unsubQuiz = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'quizzes'), 
      (snapshot) => {
        const quizzes = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setActiveQuiz(quizzes.find(q => q.active) || null);
      }, (e) => console.error(e));

    // Leaderboard
    const unsubLeader = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'leaderboard'), 
      (snapshot) => {
        setLeaderboard(snapshot.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => b.score - a.score));
      }, (e) => console.error(e));

    return () => { unsubUsers(); unsubArticles(); unsubQuiz(); unsubLeader(); };
  }, [user]);

  // --- UTILS ---
  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 3000);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setView('login');
    showToast('Berhasil keluar');
  };

  // --- UI STYLES ---
  const isDark = theme === 'dark';
  const mainClasses = isDark ? 'bg-black text-white' : 'bg-white text-red-950';
  const cardClasses = isDark ? 'bg-neutral-900 border border-red-900/40' : 'bg-red-50/30 border border-red-100';
  const inputClasses = `w-full p-3 rounded-xl border outline-none focus:ring-2 transition-all ${isDark ? 'bg-black border-red-900 text-white focus:ring-red-700' : 'bg-white border-red-200 text-red-950 focus:ring-red-400'}`;
  const btnPrimary = "bg-red-700 hover:bg-red-800 text-white font-bold py-3 px-6 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50";

  // --- SUB-VIEWS ---

  const Header = () => (
    <header className={`sticky top-0 z-50 px-4 py-3 border-b flex flex-col gap-3 ${isDark ? 'bg-black border-red-900' : 'bg-white border-red-100 shadow-sm'}`}>
      <div className="max-w-4xl mx-auto w-full flex justify-between items-center">
        <div className="flex gap-4 items-center overflow-x-auto no-scrollbar">
          <button onClick={() => setView('beranda')} className="p-2 text-red-600 hover:bg-red-500/10 rounded-full transition-colors"><Home size={22}/></button>
          <button onClick={() => setView('minigame')} className="p-2 text-red-600 hover:bg-red-500/10 rounded-full transition-colors"><Gamepad2 size={22}/></button>
          <button onClick={() => setView('profile')} className="p-2 text-red-600 hover:bg-red-500/10 rounded-full transition-colors"><UserCircle size={22}/></button>
          <button onClick={() => setView('settings')} className="p-2 text-red-600 hover:bg-red-500/10 rounded-full transition-colors"><Settings size={22}/></button>
          <button onClick={() => setView('myworks')} className="p-2 text-red-600 hover:bg-red-500/10 rounded-full transition-colors"><FileText size={22}/></button>
          <button onClick={() => setView('search-users')} className="p-2 text-red-600 hover:bg-red-500/10 rounded-full transition-colors"><Users size={22}/></button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')} className="p-2 text-red-600">
            {isDark ? <Sun size={22}/> : <Moon size={22}/>}
          </button>
          <button onClick={handleLogout} className="p-2 text-red-600"><LogOut size={22}/></button>
        </div>
      </div>
      <h1 className="text-center font-black tracking-[0.2em] text-red-700 text-lg">DIMENSI KARYA BSA</h1>
    </header>
  );

  const LoginView = () => {
    const [tab, setTab] = useState('penulis');
    const [form, setForm] = useState({ email: '', password: '', username: '', nama: '', kelas: '', angkatan: '', pin: '' });

    const handleLogin = async (e) => {
      e.preventDefault();
      try {
        if (tab === 'admin') {
          if (form.username === 'admin' && form.password === 'admin123' && form.pin === '9988') {
            setIsAdmin(true);
            setView('admin');
            showToast('Login Admin Berhasil', 'success');
          } else {
            showToast('Kredensial Admin Salah!', 'error');
          }
        } else if (tab === 'penulis') {
          await signInWithEmailAndPassword(auth, form.email, form.password);
          setView('beranda');
          showToast('Selamat datang kembali!');
        } else {
          const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
          const profile = {
            uid: cred.user.uid,
            nama: form.nama,
            username: form.username,
            email: form.email,
            kelas: form.kelas,
            angkatan: form.angkatan,
            quotes: 'Menulis adalah bekerja untuk keabadian.',
            friends: [],
            friendRequests: [],
            avatar: ''
          };
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', cred.user.uid), profile);
          setUserProfile(profile);
          setView('beranda');
          showToast('Akun berhasil dibuat!');
        }
      } catch (err) {
        showToast(err.message, 'error');
      }
    };

    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${isDark ? 'bg-black' : 'bg-red-50/50'}`}>
        <div className="mb-12 text-center">
          <BookOpen size={90} className="mx-auto text-red-700 mb-12 animate-pulse" />
          <h1 className="text-5xl font-serif text-red-800 font-bold mb-2">البعد العلمي</h1>
          <p className="opacity-60 font-medium tracking-widest uppercase text-xs">Dimensi Karya Bahasa & Sastra Arab</p>
        </div>

        <div className={`${cardClasses} w-full max-w-md p-8 rounded-3xl shadow-2xl`}>
          <div className="flex bg-red-100/50 dark:bg-neutral-800 p-1 rounded-2xl mb-8">
            {['penulis', 'admin', 'daftar'].map(t => (
              <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2.5 rounded-xl text-sm font-bold capitalize transition-all ${tab === t ? 'bg-red-700 text-white shadow-lg' : 'text-red-900/60 dark:text-white/60'}`}>
                {t}
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {tab === 'daftar' && (
              <>
                <input required placeholder="Nama Lengkap" className={inputClasses} onChange={e=>setForm({...form, nama: e.target.value})} />
                <input required placeholder="Username" className={inputClasses} onChange={e=>setForm({...form, username: e.target.value})} />
                <div className="flex gap-4">
                   <input required placeholder="Kelas" className={inputClasses} onChange={e=>setForm({...form, kelas: e.target.value})} />
                   <input required placeholder="Angkatan" className={inputClasses} onChange={e=>setForm({...form, angkatan: e.target.value})} />
                </div>
              </>
            )}
            {tab !== 'admin' && <input required type="email" placeholder="Email" className={inputClasses} onChange={e=>setForm({...form, email: e.target.value})} />}
            {tab === 'admin' && <input required placeholder="Admin Username" className={inputClasses} onChange={e=>setForm({...form, username: e.target.value})} />}
            <input required type="password" placeholder="Password" className={inputClasses} onChange={e=>setForm({...form, password: e.target.value})} />
            {tab === 'admin' && <input required type="password" placeholder="PIN Admin" className={inputClasses} onChange={e=>setForm({...form, pin: e.target.value})} />}
            
            <button type="submit" className={`${btnPrimary} w-full mt-4`}>
              {tab === 'daftar' ? 'Buat Akun Sekarang' : 'Masuk ke Aplikasi'}
            </button>
          </form>
        </div>
      </div>
    );
  };

  const BerandaView = () => {
    const cats = [
      { id: 'linguistik', name: 'Linguistik', icon: MessageCircle },
      { id: 'sastra', name: 'Sastra', icon: Feather },
      { id: 'opini', name: 'Opini & Esai Reflektif', icon: PenTool },
      { id: 'resensi', name: 'Resensi', icon: BookOpenCheck },
      { id: 'sosial-politik', name: 'Sosial Politik', icon: Landmark },
      { id: 'agama', name: 'Agama', icon: BookHeart },
      { id: 'kebudayaan', name: 'Kebudayaan', icon: Globe },
    ];

    return (
      <div className="p-6 max-w-4xl mx-auto pb-32">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {cats.map(c => (
            <div 
              key={c.id} 
              onClick={() => { setSelectedCategory(c.id); setView('category'); }}
              className={`${cardClasses} p-8 rounded-[2rem] flex flex-col items-center text-center cursor-pointer hover:scale-[1.03] hover:shadow-xl transition-all group`}
            >
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center text-red-700 mb-4 group-hover:bg-red-700 group-hover:text-white transition-colors">
                <c.icon size={32} />
              </div>
              <h3 className="font-bold text-lg leading-tight">{c.name}</h3>
            </div>
          ))}
        </div>

        <button 
          onClick={() => setView('write')}
          className="fixed bottom-10 left-1/2 -translate-x-1/2 w-16 h-16 bg-red-700 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-50 border-4 border-white dark:border-black"
        >
          <Plus size={36} />
        </button>
      </div>
    );
  };

  const CategoryView = () => {
    const arts = allArticles.filter(a => a.category === selectedCategory && a.status === 'approved');
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <button onClick={() => setView('beranda')} className="mb

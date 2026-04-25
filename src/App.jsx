import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Home, Gamepad2, UserCircle, Settings, FileText, Users, 
  Moon, Sun, Plus, MessageCircle, Feather, PenTool, BookOpenCheck, 
  Landmark, BookHeart, Globe, Check, X, Trash2, ThumbsUp, LogOut
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInAnonymously, onAuthStateChanged, 
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updatePassword
} from 'firebase/auth';
import { 
  getFirestore, collection, onSnapshot, doc, setDoc, 
  updateDoc, addDoc, deleteDoc, arrayUnion, arrayRemove 
} from 'firebase/firestore';

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyDJ0G2GQPMjtP8atxWDh8yX5kZdDV5UjDA",
  authDomain: "al-bud-b9af9.firebaseapp.com",
  projectId: "al-bud-b9af9",
  storageBucket: "al-bud-b9af9.firebasestorage.app",
  messagingSenderId: "414499709060",
  appId: "1:414499709060:web:1852782556776230b362d1",
  measurementId: "G-FT6STPS6TG"
};

// Setup Firebase Instances
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'al-bud-b9af9';

export default function App() {
  // --- GLOBAL STATE ---
  const [theme, setTheme] = useState('light');
  const [view, setView] = useState('login'); 
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  
  // Auth & User States
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Data States
  const [allUsers, setAllUsers] = useState([]);
  const [allArticles, setAllArticles] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  
  // Active Selections
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);

  // --- FIREBASE INITIALIZATION & LISTENERS ---
  useEffect(() => {
    // Standard web initial anon auth to ensure db connection
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("Auth init error:", err);
      }
    };
    initAuth();

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribeAuth();
  }, []);

  // Fetch Public Data (Users, Articles, Quizzes)
  useEffect(() => {
    if (!user) return;

    // Users List
    const unsubUsers = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'users'), 
      (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllUsers(usersData);
        if (user && !isAdmin) {
          const profile = usersData.find(u => u.uid === user.uid);
          if (profile) setUserProfile(profile);
        }
      },
      (error) => console.error(error)
    );

    // Articles List
    const unsubArticles = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'articles'), 
      (snapshot) => {
        setAllArticles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (error) => console.error(error)
    );

    // Quiz Data
    const unsubQuiz = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'quizzes'), 
      (snapshot) => {
        const quizzes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const active = quizzes.find(q => q.active);
        setActiveQuiz(active || null);
      },
      (error) => console.error(error)
    );

    // Leaderboard Data
    const unsubLeaderboard = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'leaderboard'), 
      (snapshot) => {
        setLeaderboard(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => b.score - a.score));
      },
      (error) => console.error(error)
    );

    return () => { unsubUsers(); unsubArticles(); unsubQuiz(); unsubLeaderboard(); };
  }, [user, isAdmin]);

  // --- HELPERS ---
  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 3000);
  };

  const logout = async () => {
    await signOut(auth);
    setIsAdmin(false);
    setUserProfile(null);
    setView('login');
    showToast('Berhasil keluar');
  };

  // --- THEME CLASSES ---
  const appClasses = theme === 'dark' 
    ? 'bg-black text-red-50 min-h-screen font-sans selection:bg-red-900' 
    : 'bg-red-50 text-red-950 min-h-screen font-sans selection:bg-red-200';
  
  const cardClasses = theme === 'dark'
    ? 'bg-neutral-900 border border-red-900/30 rounded-2xl shadow-xl'
    : 'bg-white border border-red-100 rounded-2xl shadow-lg';

  const inputClasses = theme === 'dark'
    ? 'w-full p-3 bg-black border border-red-900 rounded-xl focus:ring-2 focus:ring-red-600 outline-none text-red-50'
    : 'w-full p-3 bg-red-50/50 border border-red-200 rounded-xl focus:ring-2 focus:ring-red-400 outline-none text-red-900';

  const btnPrimary = 'bg-red-700 hover:bg-red-800 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2';

  // --- SUB-COMPONENTS ---

  const Toast = () => {
    if (!toast.show) return null;
    return (
      <div className={`fixed top-5 right-5 p-4 rounded-xl shadow-2xl z-50 animate-bounce ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
        {toast.message}
      </div>
    );
  };

  const Header = () => (
    <header className={`${theme === 'dark' ? 'bg-black border-b border-red-900' : 'bg-white border-b border-red-200'} sticky top-0 z-40 px-4 py-3 flex flex-col items-center gap-3`}>
      <div className="flex justify-between items-center w-full max-w-4xl">
        <div className="flex items-center gap-4 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar w-full justify-between">
          <button onClick={() => setView('beranda')} className="p-2 hover:bg-red-500/20 rounded-full text-red-600 transition-colors"><Home size={24} /></button>
          <button onClick={() => setView('minigame')} className="p-2 hover:bg-red-500/20 rounded-full text-red-600 transition-colors"><Gamepad2 size={24} /></button>
          <button onClick={() => setView('profile')} className="p-2 hover:bg-red-500/20 rounded-full text-red-600 transition-colors"><UserCircle size={24} /></button>
          <button onClick={() => setView('settings')} className="p-2 hover:bg-red-500/20 rounded-full text-red-600 transition-colors"><Settings size={24} /></button>
          <button onClick={() => setView('myworks')} className="p-2 hover:bg-red-500/20 rounded-full text-red-600 transition-colors"><FileText size={24} /></button>
          <button onClick={() => setView('search-users')} className="p-2 hover:bg-red-500/20 rounded-full text-red-600 transition-colors"><Users size={24} /></button>
          
          <div className="h-6 w-px bg-red-300/30 mx-2"></div>
          
          <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')} className="p-2 hover:bg-red-500/20 rounded-full text-red-600 transition-colors">
            {theme === 'light' ? <Moon size={24} /> : <Sun size={24} />}
          </button>
          <button onClick={logout} className="p-2 hover:bg-red-500/20 rounded-full text-red-600 transition-colors"><LogOut size={24} /></button>
        </div>
      </div>
      <h1 className="text-xl font-bold tracking-widest text-red-700 text-center">DIMENSI KARYA BSA</h1>
    </header>
  );

  const Footer = () => (
    <footer className="mt-12 py-6 text-center text-sm opacity-60 border-t border-red-900/20">
      <p>2026 Divisi Penelitian dan Pengembangan HMPS BSA UIN Syarif Hidayatullah Jakarta</p>
    </footer>
  );

  // --- VIEWS ---

  const LoginView = () => {
    const [tab, setTab] = useState('penulis'); 
    const [form, setForm] = useState({ email: '', password: '', username: '', nama: '', kelas: '', angkatan: '', pin: '' });

    const handleAction = async (e) => {
      e.preventDefault();
      try {
        if (tab === 'admin') {
          if (form.username === 'admin' && form.password === 'admin123' && form.pin === '9988') {
            setIsAdmin(true);
            setView('admin');
            showToast('Selamat datang Admin', 'success');
          } else {
            showToast('Kredensial Admin Salah!', 'error');
          }
        } else if (tab === 'penulis') {
          await signInWithEmailAndPassword(auth, form.email, form.password);
          setView('beranda');
          showToast('Berhasil Login', 'success');
        } else if (tab === 'daftar') {
          const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
          const newUser = {
            uid: userCredential.user.uid,
            nama: form.nama,
            username: form.username,
            email: form.email,
            kelas: form.kelas,
            angkatan: form.angkatan,
            quotes: 'Menulis adalah bekerja untuk keabadian.',
            avatar: '',
            friends: [],
            friendRequests: [],
            role: 'penulis'
          };
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', userCredential.user.uid), newUser);
          setUserProfile(newUser);
          setView('beranda');
          showToast('Akun berhasil dibuat!', 'success');
        }
      } catch (err) {
        showToast(err.message, 'error');
      }
    };

    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center mb-12 animate-fade-in-down">
          <BookOpen size={80} className="mx-auto text-red-700 mb-8" />
          <h1 className="text-4xl font-bold text-red-700 mt-8 mb-2" style={{ fontFamily: 'serif' }}>البعد العلمي</h1>
          <p className="opacity-70">Dimensi Karya Bahasa & Sastra Arab</p>
        </div>

        <div className={`${cardClasses} w-full max-w-md p-6 animate-fade-in-up`}>
          <div className="flex bg-red-100 dark:bg-neutral-800 rounded-xl p-1 mb-6">
            {['penulis', 'admin', 'daftar'].map(t => (
              <button 
                key={t} onClick={() => setTab(t)} 
                className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-colors ${tab === t ? 'bg-red-700 text-white shadow' : 'text-red-900 dark:text-red-300'}`}
              >
                {t}
              </button>
            ))}
          </div>

          <form onSubmit={handleAction} className="flex flex-col gap-4">
            {tab === 'daftar' && (
              <>
                <input required placeholder="Nama Lengkap" className={inputClasses} onChange={e => setForm({...form, nama: e.target.value})} />
                <input required placeholder="Username" className={inputClasses} onChange={e => setForm({...form, username: e.target.value})} />
                <input required type="email" placeholder="Email" className={inputClasses} onChange={e => setForm({...form, email: e.target.value})} />
                <div className="flex gap-4">
                  <input required placeholder="Kelas" className={inputClasses} onChange={e => setForm({...form, kelas: e.target.value})} />
                  <input required placeholder="Angkatan (Contoh: 2024)" className={inputClasses} onChange={e => setForm({...form, angkatan: e.target.value})} />
                </div>
                <input required type="password" placeholder="Password" className={inputClasses} onChange={e => setForm({...form, password: e.target.value})} />
              </>
            )}
            
            {tab === 'penulis' && (
              <>
                <input required type="email" placeholder="Email Akun" className={inputClasses} onChange={e => setForm({...form, email: e.target.value})} />
                <input required type="password" placeholder="Password" className={inputClasses} onChange={e => setForm({...form, password: e.target.value})} />
              </>
            )}

            {tab === 'admin' && (
              <>
                <input required placeholder="Username Admin" className={inputClasses} onChange={e => setForm({...form, username: e.target.value})} />
                <input required type="password" placeholder="Password" className={inputClasses} onChange={e => setForm({...form, password: e.target.value})} />
                <input required type="password" placeholder="PIN Admin"

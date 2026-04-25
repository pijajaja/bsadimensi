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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'al-bud-b9af9';

export default function App() {
  const [theme, setTheme] = useState('light');
  const [view, setView] = useState('login'); 
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [allArticles, setAllArticles] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const initAuth = async () => {
      try { await signInAnonymously(auth); } catch (err) { console.error(err); }
    };
    initAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubUsers = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllUsers(usersData);
      if (user && !isAdmin) {
        const profile = usersData.find(u => u.uid === user.uid);
        if (profile) setUserProfile(profile);
      }
    });
    const unsubArticles = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'articles'), (snapshot) => {
      setAllArticles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { unsubUsers(); unsubArticles(); };
  }, [user, isAdmin]);

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

  const appClasses = theme === 'dark' ? 'bg-black text-red-50 min-h-screen' : 'bg-red-50 text-red-950 min-h-screen';
  const cardClasses = theme === 'dark' ? 'bg-neutral-900 border border-red-900/30 rounded-2xl shadow-xl' : 'bg-white border border-red-100 rounded-2xl shadow-lg';
  const inputClasses = theme === 'dark' ? 'w-full p-3 bg-black border border-red-900 rounded-xl text-red-50' : 'w-full p-3 bg-red-50/50 border border-red-200 rounded-xl text-red-900';
  const btnPrimary = 'bg-red-700 hover:bg-red-800 text-white font-semibold py-3 px-6 rounded-xl transition-all w-full flex items-center justify-center gap-2';

  const Header = () => (
    <header className={`${theme === 'dark' ? 'bg-black border-b border-red-900' : 'bg-white border-b border-red-200'} sticky top-0 z-40 px-4 py-3`}>
      <div className="flex justify-between items-center max-w-4xl mx-auto">
        <div className="flex gap-4 overflow-x-auto">
          <button onClick={() => setView('beranda')} className="text-red-600"><Home size={24} /></button>
          <button onClick={() => setView('minigame')} className="text-red-600"><Gamepad2 size={24} /></button>
          <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')} className="text-red-600">
            {theme === 'light' ? <Moon size={24} /> : <Sun size={24} />}
          </button>
          <button onClick={logout} className="text-red-600"><LogOut size={24} /></button>
        </div>
      </div>
    </header>
  );

  const LoginView = () => {
    const [tab, setTab] = useState('penulis'); 
    const [form, setForm] = useState({ email: '', password: '', username: '', nama: '', kelas: '', angkatan: '', pin: '' });

    const handleAction = async (e) => {
      e.preventDefault();
      try {
        if (tab === 'admin') {
          if (form.username === 'admin' && form.password === 'admin123' && form.pin === '9988') {
            setIsAdmin(true); setView('admin'); showToast('Selamat datang Admin', 'success');
          } else { showToast('Kredensial Admin Salah!', 'error'); }
        } else if (tab === 'penulis') {
          await signInWithEmailAndPassword(auth, form.email, form.password);
          setView('beranda'); showToast('Berhasil Login', 'success');
        } else if (tab === 'daftar') {
          const res = await createUserWithEmailAndPassword(auth, form.email, form.password);
          const newUser = { uid: res.user.uid, nama: form.nama, username: form.username, email: form.email, role: 'penulis' };
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', res.user.uid), newUser);
          setView('beranda'); showToast('Akun berhasil dibuat!', 'success');
        }
      } catch (err) { showToast(err.message, 'error'); }
    };

    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center mb-8">
          <BookOpen size={60} className="mx-auto text-red-700 mb-4" />
          <h1 className="text-3xl font-bold text-red-700">البعد العلمي</h1>
        </div>
        <div className={`${cardClasses} w-full max-w-md p-6`}>
          <div className="flex bg-red-100 dark:bg-neutral-800 rounded-xl p-1 mb-6">
            {['penulis', 'admin', 'daftar'].map(t => (
              <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize ${tab === t ? 'bg-red-700 text-white' : 'text-red-900'}`}>{t}</button>
            ))}
          </div>
          <form onSubmit={handleAction} className="flex flex-col gap-3">
            {tab === 'daftar' && (
              <>
                <input required placeholder="Nama" className={inputClasses} onChange={e => setForm({...form, nama: e.target.value})} />
                <input required placeholder="Username" className={inputClasses} onChange={e => setForm({...form, username: e.target.value})} />
                <input required type="email" placeholder="Email" className={inputClasses} onChange={e => setForm({...form, email: e.target.value})} />
                <input required type="password" placeholder="Password" className={inputClasses} onChange={e => setForm({...form, password: e.target.value})} />
              </>
            )}
            {tab === 'penulis' && (
              <>
                <input required type="email" placeholder="Email" className={inputClasses} onChange={e => setForm({...form, email: e.target.value})} />
                <input required type="password" placeholder="Password" className={inputClasses} onChange={e => setForm({...form, password: e.target.value})} />
              </>
            )}
            {tab === 'admin' && (
              <>
                <input required placeholder="Username Admin" className={inputClasses} onChange={e => setForm({...form, username: e.target.value})} />
                <input required type="password" placeholder="Password" className={inputClasses} onChange={e => setForm({...form, password: e.target.value})} />
                <input required type="password" placeholder="PIN Admin" className={inputClasses} onChange={e => setForm({...form, pin: e.target.value})} />
              </>
            )}
            <button type="submit" className={btnPrimary}>{tab === 'daftar' ? 'Daftar' : 'Masuk'}</button>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className={appClasses}>
      {toast.show && <div className="fixed top-5 right-5 p-4 bg-red-600 text-white rounded-xl z-50">{toast.message}</div>}
      {view !== 'login' && <Header />}
      <main className="max-w-4xl mx-auto p-4">
        {view === 'login' ? <LoginView /> : <div className="text-center py-20 text-2xl font-bold">Selamat Datang di {view}</div>}
      </main>
      <footer className="py-6 text-center text-xs opacity-50">
        <p>© 2026 Litbang HMPS BSA UIN Jakarta</p>
      </footer>
    </div>
  );
}

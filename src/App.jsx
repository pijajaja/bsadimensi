```react
import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, Home, Gamepad2, UserCircle, Settings, FileText, Users, 
  Moon, Sun, Plus, MessageCircle, Feather, PenTool, BookOpenCheck, 
  Landmark, BookHeart, Globe, Check, X, Edit, Trash2, ThumbsUp, LogOut, Search
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInAnonymously, onAuthStateChanged, 
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updatePassword,
  signInWithCustomToken
} from 'firebase/auth';
import { 
  getFirestore, collection, onSnapshot, doc, setDoc, 
  updateDoc, addDoc, deleteDoc, arrayUnion, arrayRemove, query
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
const appId = typeof __app_id !== 'undefined' ? __app_id : 'al-bud-b9af9';

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
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
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
        <button onClick={() => setView('beranda')} className="mb-6 text-red-700 font-bold flex items-center gap-2">← Kembali</button>
        <h2 className="text-3xl font-black mb-8 capitalize border-l-8 border-red-700 pl-4">{selectedCategory.replace('-', ' ')}</h2>
        <div className="space-y-6">
          {arts.length === 0 && <p className="opacity-50 italic text-center py-20">Belum ada karya yang diterbitkan di kategori ini.</p>}
          {arts.map(a => (
            <div key={a.id} onClick={() => { setSelectedArticle(a); setView('detail'); }} className={`${cardClasses} p-6 rounded-3xl cursor-pointer hover:border-red-500 transition-all`}>
              <h3 className="text-xl font-bold mb-2">{a.title}</h3>
              <p className="text-sm opacity-60 mb-4">Oleh: {a.authorName} • {new Date(a.createdAt).toLocaleDateString()}</p>
              <p className="line-clamp-2 opacity-80 leading-relaxed">{a.content}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const DetailView = () => {
    const [cmt, setCmt] = useState('');
    if (!selectedArticle) return null;

    const handleLike = async () => {
      if (!userProfile) return;
      const ref = doc(db, 'artifacts', appId, 'public', 'data', 'articles', selectedArticle.id);
      const isLiked = selectedArticle.likes?.includes(userProfile.uid);
      await updateDoc(ref, { likes: isLiked ? arrayRemove(userProfile.uid) : arrayUnion(userProfile.uid) });
    };

    const handleComment = async (e) => {
      e.preventDefault();
      if (!cmt.trim() || !userProfile) return;
      const ref = doc(db, 'artifacts', appId, 'public', 'data', 'articles', selectedArticle.id);
      await updateDoc(ref, { 
        comments: arrayUnion({ id: Date.now(), uid: userProfile.uid, name: userProfile.nama, text: cmt, date: Date.now() }) 
      });
      setCmt('');
    };

    const delComment = async (c) => {
      if (!isAdmin) return;
      const ref = doc(db, 'artifacts', appId, 'public', 'data', 'articles', selectedArticle.id);
      await updateDoc(ref, { comments: arrayRemove(c) });
    };

    return (
      <div className="p-6 max-w-4xl mx-auto pb-24">
        <button onClick={() => setView('category')} className="mb-6 text-red-700 font-bold">← Kembali</button>
        <div className={`${cardClasses} p-8 rounded-[2.5rem] shadow-xl`}>
          <h1 className="text-4xl font-black mb-4 leading-tight">{selectedArticle.title}</h1>
          <div className="flex items-center gap-3 opacity-60 text-sm mb-8 border-b pb-6 border-red-900/10">
            <span className="bg-red-700 text-white px-3 py-1 rounded-full font-bold">{selectedArticle.authorName}</span>
            <span>•</span>
            <span className="capitalize">{selectedArticle.category}</span>
          </div>
          <div className="prose prose-red dark:prose-invert max-w-none text-lg leading-relaxed whitespace-pre-wrap">
            {selectedArticle.content}
          </div>
          
          <div className="mt-12 pt-8 border-t border-red-900/10 flex gap-8">
            <button onClick={handleLike} className={`flex items-center gap-2 font-bold ${selectedArticle.likes?.includes(userProfile?.uid) ? 'text-red-600' : 'opacity-60'}`}>
              <ThumbsUp size={22}/> {selectedArticle.likes?.length || 0}
            </button>
            <span className="flex items-center gap-2 opacity-60 font-bold"><MessageCircle size={22}/> {selectedArticle.comments?.length || 0}</span>
          </div>
        </div>

        <div className="mt-12">
          <h3 className="text-xl font-bold mb-6">Diskusi Karya</h3>
          <form onSubmit={handleComment} className="flex gap-3 mb-8">
            <input value={cmt} onChange={e=>setCmt(e.target.value)} placeholder="Tulis tanggapan Anda..." className={inputClasses} />
            <button type="submit" className={btnPrimary}>Kirim</button>
          </form>
          <div className="space-y-4">
            {selectedArticle.comments?.map(c => (
              <div key={c.id} className={`${cardClasses} p-5 rounded-2xl flex justify-between items-start`}>
                <div>
                  <p className="font-black text-red-700 text-sm">{c.name}</p>
                  <p className="mt-1 opacity-90">{c.text}</p>
                </div>
                {isAdmin && <button onClick={() => delComment(c)} className="text-red-500 p-2"><Trash2 size={18}/></button>}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const WriteView = () => {
    const [form, setForm] = useState({ title: '', cat: 'linguistik', content: '' });

    const handlePublish = async (e) => {
      e.preventDefault();
      if (!userProfile) return;
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'articles'), {
        ...form,
        category: form.cat,
        authorId: userProfile.uid,
        authorName: userProfile.nama,
        status: 'pending',
        createdAt: Date.now(),
        likes: [],
        comments: []
      });
      showToast('Karya dikirim! Menunggu peninjauan admin.', 'success');
      setView('myworks');
    };

    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h2 className="text-3xl font-black mb-8">Tulis Karya Baru</h2>
        <form onSubmit={handlePublish} className={`${cardClasses} p-8 rounded-[2.5rem] space-y-6 shadow-2xl`}>
          <div>
            <label className="block text-sm font-bold mb-2 opacity-60">Kategori Karya</label>
            <select className={inputClasses} value={form.cat} onChange={e=>setForm({...form, cat: e.target.value})}>
              <option value="linguistik">Linguistik</option>
              <option value="sastra">Sastra</option>
              <option value="opini">Opini & Esai Reflektif</option>
              <option value="resensi">Resensi</option>
              <option value="sosial-politik">Sosial Politik</option>
              <option value="agama">Agama</option>
              <option value="kebudayaan">Kebudayaan</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 opacity-60">Judul Karya</label>
            <input required placeholder="Masukkan judul yang menarik..." className={inputClasses} value={form.title} onChange={e=>setForm({...form, title: e.target.value})} />
          </div>
          <div>
             <label className="block text-sm font-bold mb-2 opacity-60">Isi Tulisan</label>
             <div className="border border-red-100 dark:border-red-900 rounded-2xl overflow-hidden">
                <div className="bg-red-50 dark:bg-neutral-800 p-3 border-b border-red-100 dark:border-red-900 flex gap-4 text-xs font-bold opacity-60">
                  <span>BOLD</span> <span>ITALIC</span> <span>UNDERLINE</span> <span>ALIGN</span>
                </div>
                <textarea required placeholder="Tuangkan pikiranmu di sini..." className="w-full p-6 min-h-[400px] bg-transparent outline-none resize-y leading-relaxed" value={form.content} onChange={e=>setForm({...form, content: e.target.value})} />
             </div>
          </div>
          <button type="submit" className={`${btnPrimary} w-full py-4 text-lg`}>Ajukan Penerbitan</button>
        </form>
      </div>
    );
  };

  const AdminView = () => {
    const [pinAuth, setPinAuth] = useState('');
    const [unlocked, setUnlocked] = useState(false);
    const [qForm, setQForm] = useState({ q: '', o1: '', o2: '', o3: '', a: 0, t: 60 });

    const review = async (id, status) => {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'articles', id), { status });
      showToast(`Karya berhasil ${status === 'approved' ? 'diterbitkan' : 'ditolak'}`);
    };

    const makeQuiz = async (e) => {
      e.preventDefault();
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'quizzes'), {
        question: qForm.q,
        options: [qForm.o1, qForm.o2, qForm.o3],
        correctAnswer: parseInt(qForm.a),
        timeLimit: parseInt(qForm.t),
        active: true,
        createdAt: Date.now()
      });
      showToast('Kuis Aktif!');
    };

    if (!unlocked) {
      return (
        <div className="p-6 max-w-md mx-auto mt-20">
          <div className={`${cardClasses} p-8 rounded-3xl text-center shadow-xl`}>
            <h2 className="text-2xl font-black mb-6">Otorisasi Admin</h2>
            <input type="password" placeholder="Masukkan PIN Rahasia" className={inputClasses} value={pinAuth} onChange={e=>setPinAuth(e.target.value)} />
            <button onClick={() => pinAuth === '9988' ? setUnlocked(true) : showToast('PIN Salah', 'error')} className={`${btnPrimary} w-full mt-4`}>Buka Panel</button>
          </div>
        </div>
      );
    }

    return (
      <div className="p-6 max-w-5xl mx-auto space-y-12 pb-24">
        <section>
          <h2 className="text-3xl font-black mb-6 flex items-center gap-3"><FileText/> Peninjauan Karya</h2>
          <div className="grid gap-6">
            {allArticles.filter(a => a.status === 'pending').map(a => (
              <div key={a.id} className={`${cardClasses} p-6 rounded-3xl`}>
                <h3 className="text-xl font-bold mb-1">{a.title}</h3>
                <p className="text-sm opacity-60 mb-4">Penulis: {a.authorName}</p>
                <p className="mb-6 line-clamp-3 opacity-80 italic">"{a.content}"</p>
                <div className="flex gap-3">
                  <button onClick={() => review(a.id, 'approved')} className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2"><Check size={18}/> Terbitkan</button>
                  <button onClick={() => review(a.id, 'rejected')} className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2"><X size={18}/> Tolak</button>
                  <button onClick={() => setSelectedArticle(a)} className="bg-neutral-700 text-white px-6 py-2 rounded-xl font-bold">Edit</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-8">
          <div className={`${cardClasses} p-8 rounded-3xl`}>
             <h2 className="text-2xl font-black mb-6">Kelola Kuis</h2>
             <form onSubmit={makeQuiz} className="space-y-4">
                <input placeholder="Pertanyaan" className={inputClasses} onChange={e=>setQForm({...qForm, q: e.target.value})} />
                <input placeholder="Opsi 1" className={inputClasses} onChange={e=>setQForm({...qForm, o1: e.target.value})} />
                <input placeholder="Opsi 2" className={inputClasses} onChange={e=>setQForm({...qForm, o2: e.target.value})} />
                <input placeholder="Opsi 3" className={inputClasses} onChange={e=>setQForm({...qForm, o3: e.target.value})} />
                <select className={inputClasses} onChange={e=>setQForm({...qForm, a: e.target.value})}>
                   <option value="0">Jawaban: Opsi 1</option>
                   <option value="1">Jawaban: Opsi 2</option>
                   <option value="2">Jawaban: Opsi 3</option>
                </select>
                <input type="number" placeholder="Waktu (detik)" className={inputClasses} onChange={e=>setQForm({...qForm, t: e.target.value})} />
                <button type="submit" className={btnPrimary + " w-full"}>Aktifkan Kuis Sekarang</button>
             </form>
          </div>
          <div className={`${cardClasses} p-8 rounded-3xl`}>
             <h2 className="text-2xl font-black mb-6">Data Penulis</h2>
             <div className="space-y-3 h-[400px] overflow-y-auto pr-2">
                {allUsers.map(u => (
                  <div key={u.uid} className="flex justify-between items-center p-3 border-b border-red-900/10">
                    <div>
                      <p className="font-bold">{u.nama}</p>
                      <p className="text-xs opacity-50">@{u.username} • {u.kelas}</p>
                    </div>
                    <button className="text-red-700 font-bold text-xs uppercase tracking-tighter">Detail</button>
                  </div>
                ))}
             </div>
          </div>
        </section>
      </div>
    );
  };

  const MinigameView = () => {
    const [ans, setAns] = useState(null);
    const [timer, setTimer] = useState(0);

    useEffect(() => {
      if (activeQuiz && !ans) {
        setTimer(activeQuiz.timeLimit);
        const interval = setInterval(() => {
          setTimer(t => (t > 0 ? t - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
      }
    }, [activeQuiz, ans]);

    const submitAns = async (idx) => {
      if (ans || timer === 0 || !userProfile) return;
      setAns(idx);
      if (idx === activeQuiz.correctAnswer) {
        showToast('Tepat sekali! +100 Poin', 'success');
        const ref = doc(db, 'artifacts', appId, 'public', 'data', 'leaderboard', userProfile.uid);
        const current = leaderboard.find(l => l.id === userProfile.uid);
        await setDoc(ref, { nama: userProfile.nama, score: (current?.score || 0) + 100 });
      } else {
        showToast('Kurang tepat, coba lagi nanti!', 'error');
      }
    };

    return (
      <div className="p-6 max-w-4xl mx-auto flex flex-col md:flex-row gap-8">
        <div className="flex-1">
          <h2 className="text-3xl font-black mb-8">Arena Tantangan</h2>
          {!activeQuiz ? (
            <div className={`${cardClasses} p-12 text-center rounded-[3rem] shadow-inner`}>
              <Gamepad2 size={60} className="mx-auto mb-6 opacity-20" />
              <p className="text-xl font-bold opacity-40">Admin belum menyediakan soal saat ini.</p>
            </div>
          ) : (
            <div className={`${cardClasses} p-10 rounded-[3rem] shadow-2xl border-t-8 border-red-700`}>
              <div className="flex justify-between items-center mb-8">
                <span className="font-black text-red-700">WAKTU:</span>
                <span className={`text-3xl font-mono font-black ${timer < 10 ? 'text-red-600 animate-pulse' : ''}`}>{timer}s</span>
              </div>
              <h3 className="text-2xl font-bold mb-8 leading-snug">{activeQuiz.question}</h3>
              <div className="grid gap-4">
                {activeQuiz.options.map((o, i) => (
                  <button 
                    key={i} 
                    disabled={ans !== null || timer === 0}
                    onClick={() => submitAns(i)}
                    className={`p-5 rounded-2xl text-left font-bold border-2 transition-all ${ans === i ? (i === activeQuiz.correctAnswer ? 'bg-green-600 border-green-600 text-white' : 'bg-red-600 border-red-600 text-white') : 'border-red-100 dark:border-red-900 hover:border-red-700'}`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="w-full md:w-80">
          <div className={`${cardClasses} p-6 rounded-3xl shadow-lg`}>
            <h3 className="text-xl font-black mb-6 flex items-center gap-2">🏆 Papan Skor</h3>
            <div className="space-y-4">
              {leaderboard.map((l, i) => (
                <div key={l.id} className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                  <span className="font-bold opacity-40">#{i+1}</span>
                  <span className="flex-1 px-3 font-bold truncate">{l.nama}</span>
                  <span className="font-black text-red-700">{l.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ProfileView = () => {
    if (!userProfile) return null;

    const accept = async (rid) => {
      const myRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', userProfile.uid);
      const theirRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', rid);
      await updateDoc(myRef, { friendRequests: arrayRemove(rid), friends: arrayUnion(rid) });
      await updateDoc(theirRef, { friends: arrayUnion(userProfile.uid) });
      showToast('Kini kalian berteman!');
    };

    return (
      <div className="p-6 max-w-4xl mx-auto flex flex-col md:flex-row gap-8">
        <div className="flex-1 space-y-6">
          <div className={`${cardClasses} p-10 rounded-[3rem] text-center relative overflow-hidden shadow-2xl`}>
            <div className="absolute top-0 left-0 w-full h-32 bg-red-700"></div>
            <div className="relative z-10">
              <div className="w-36 h-36 mx-auto rounded-full bg-white dark:bg-black border-8 border-red-50 dark:border-neutral-900 flex items-center justify-center text-5xl font-black text-red-700 mb-6 shadow-xl overflow-hidden">
                {userProfile.avatar ? <img src={userProfile.avatar} className="w-full h-full object-cover" /> : userProfile.nama[0]}
              </div>
              <h2 className="text-3xl font-black">{userProfile.nama}</h2>
              <p className="opacity-60 font-bold">@{userProfile.username} • {userProfile.kelas}</p>
              <div className="mt-8 pt-8 border-t border-red-900/10 max-w-xs mx-auto italic opacity-70">
                "{userProfile.quotes}"
              </div>
            </div>
          </div>
        </div>
        <div className="w-full md:w-80 space-y-6">
          {userProfile.friendRequests?.length > 0 && (
            <div className={`${cardClasses} p-6 rounded-3xl border-yellow-500/50 bg-yellow-500/5`}>
              <h3 className="font-bold mb-4 flex items-center gap-2">Permintaan Teman</h3>
              {userProfile.friendRequests.map(rid => {
                const u = allUsers.find(x => x.uid === rid);
                return (
                  <div key={rid} className="flex justify-between items-center p-2">
                    <span className="text-sm font-bold truncate">{u?.nama}</span>
                    <button onClick={() => accept(rid)} className="bg-green-600 text-white text-[10px] px-3 py-1 rounded-full font-bold">TERIMA</button>
                  </div>
                );
              })}
            </div>
          )}
          <div className={`${cardClasses} p-6 rounded-3xl`}>
            <h3 className="font-bold mb-4">Teman ({userProfile.friends?.length || 0})</h3>
            <div className="grid grid-cols-4 gap-2">
              {userProfile.friends?.map(fid => {
                const u = allUsers.find(x => x.uid === fid);
                return <div key={fid} title={u?.nama} className="w-10 h-10 rounded-full bg-red-700 text-white flex items-center justify-center font-bold text-xs">{u?.nama[0]}</div>;
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const SearchUsersView = () => {
    const [q, setQ] = useState('');
    const req = async (tid) => {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', tid), {
        friendRequests: arrayUnion(userProfile.uid)
      });
      showToast('Permintaan dikirim!');
    };

    const list = allUsers.filter(u => u.uid !== userProfile?.uid && !userProfile?.friends?.includes(u.uid) && (u.nama.toLowerCase().includes(q.toLowerCase()) || u.username.toLowerCase().includes(q.toLowerCase())));

    return (
      <div className="p-6 max-w-2xl mx-auto">
        <h2 className="text-3xl font-black mb-8">Cari Rekan Penulis</h2>
        <div className="relative mb-8">
           <Search className="absolute left-4 top-4 opacity-40" />
           <input placeholder="Ketik nama atau username..." className={inputClasses + " pl-12"} value={q} onChange={e=>setQ(e.target.value)} />
        </div>
        <div className="space-y-4">
          {list.map(u => {
            const hasSent = u.friendRequests?.includes(userProfile?.uid);
            return (
              <div key={u.uid} className={`${cardClasses} p-5 rounded-2xl flex justify-between items-center`}>
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-full bg-red-700 text-white flex items-center justify-center font-black">{u.nama[0]}</div>
                   <div>
                      <p className="font-bold">{u.nama}</p>
                      <p className="text-xs opacity-50">@{u.username}</p>
                   </div>
                </div>
                <button disabled={hasSent} onClick={() => req(u.uid)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${hasSent ? 'bg-neutral-200 text-neutral-500' : 'bg-red-700 text-white'}`}>
                  {hasSent ? 'MENUNGGU' : 'ADD FRIEND'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const SettingsView = () => {
    const [pw, setPw] = useState('');
    const handleUp = async (e) => {
      e.preventDefault();
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, pw);
        showToast('Password Berhasil Diubah!', 'success');
        setPw('');
      }
    };
    return (
      <div className="p-6 max-w-md mx-auto">
        <h2 className="text-3xl font-black mb-8">Pengaturan</h2>
        <div className={`${cardClasses} p-8 rounded-3xl shadow-xl`}>
          <h3 className="font-bold mb-6">Ganti Password</h3>
          <form onSubmit={handleUp} className="space-y-4">
             <input type="password" required placeholder="Password Baru" className={inputClasses} value={pw} onChange={e=>setPw(e.target.value)} />
             <button type="submit" className={btnPrimary + " w-full"}>Simpan Perubahan</button>
          </form>
        </div>
      </div>
    );
  };

  const MyWorksView = () => {
    const mine = allArticles.filter(a => a.authorId === userProfile?.uid);
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h2 className="text-3xl font-black mb-8">Arsip Karya Saya</h2>
        <div className="grid gap-4">
          {mine.map(a => (
            <div key={a.id} className={`${cardClasses} p-6 rounded-2xl flex justify-between items-center`}>
              <div>
                <h4 className="font-bold text-lg">{a.title}</h4>
                <p className="text-xs opacity-50 uppercase tracking-widest">{a.category}</p>
              </div>
              <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${a.status === 'approved' ? 'bg-green-600 text-white' : a.status === 'pending' ? 'bg-yellow-500 text-black' : 'bg-red-600 text-white'}`}>
                {a.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // --- RENDER ---
  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 ${mainClasses}`}>
      {toast.show && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl font-bold animate-bounce ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
          {toast.message}
        </div>
      )}

      {view !== 'login' && <Header />}

      <main className="min-h-[calc(100vh-160px)]">
        {view === 'login' && <LoginView />}
        {view === 'beranda' && <BerandaView />}
        {view === 'category' && <CategoryView />}
        {view === 'detail' && <DetailView />}
        {view === 'write' && <WriteView />}
        {view === 'admin' && <AdminView />}
        {view === 'minigame' && <MinigameView />}
        {view === 'profile' && <ProfileView />}
        {view === 'myworks' && <MyWorksView />}
        {view === 'search-users' && <SearchUsersView />}
        {view === 'settings' && <SettingsView />}
      </main>

      {view !== 'login' && (
        <footer className="py-12 border-t border-red-900/10 text-center opacity-40 text-[10px] font-bold tracking-widest uppercase px-6">
          2026 DIVISI PENELITIAN DAN PENGEMBANGAN HMPS BSA UIN SYARIF HIDAYATULLAH JAKARTA
        </footer>
      )}
    </div>
  );
}

```

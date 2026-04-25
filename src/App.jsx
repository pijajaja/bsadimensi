import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Home, Gamepad2, UserCircle, Settings, FileText, Users, 
  Moon, Sun, Plus, MessageCircle, Feather, PenTool, BookOpenCheck, 
  Landmark, BookHeart, Globe, Check, X, Trash2, ThumbsUp, LogOut, Search
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, onAuthStateChanged, 
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updatePassword
} from 'firebase/auth';
import { 
  getFirestore, collection, onSnapshot, doc, setDoc, 
  updateDoc, addDoc, arrayUnion, arrayRemove
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDJ0G2GQPMjtP8atxWDh8yX5kZdDV5UjDA",
  authDomain: "al-bud-b9af9.firebaseapp.com",
  projectId: "al-bud-b9af9",
  storageBucket: "al-bud-b9af9.firebasestorage.app",
  messagingSenderId: "414499709060",
  appId: "1:414499709060:web:1852782556776230b362d1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "al-bud-b9af9";

export default function App() {
  const [theme, setTheme] = useState("light");
  const [view, setView] = useState("login"); 
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });
  const [allUsers, setAllUsers] = useState([]);
  const [allArticles, setAllArticles] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedArticle, setSelectedArticle] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) { setIsAdmin(false); setUserProfile(null); }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubUsers = onSnapshot(collection(db, "artifacts", appId, "public", "data", "users"), (s) => {
      const list = s.docs.map(d => ({ uid: d.id, ...d.data() }));
      setAllUsers(list);
      const me = list.find(u => u.uid === user.uid);
      if (me) setUserProfile(me);
    });
    const unsubArticles = onSnapshot(collection(db, "artifacts", appId, "public", "data", "articles"), (s) => {
      setAllArticles(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubUsers(); unsubArticles(); };
  }, [user]);

  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "info" }), 3000);
  };

  const isDark = theme === "dark";
  const mainClasses = isDark ? "bg-black text-white" : "bg-white text-red-950";
  const cardClasses = isDark ? "bg-neutral-900 border border-red-900/40" : "bg-red-50/30 border border-red-100";
  const inputClasses = "w-full p-3 rounded-xl border outline-none " + (isDark ? "bg-black border-red-900 text-white" : "bg-white border-red-200 text-red-950");
  const btnPrimary = "bg-red-700 hover:bg-red-800 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2";

    const Header = () => (
    <header className={"sticky top-0 z-50 px-4 py-3 border-b " + (isDark ? "bg-black border-red-900" : "bg-white border-red-100 shadow-sm")}>
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <div className="flex gap-4 overflow-x-auto">
          <button onClick={() => setView("beranda")} className="p-2 text-red-600"><Home size={22}/></button>
          <button onClick={() => setView("profile")} className="p-2 text-red-600"><UserCircle size={22}/></button>
          <button onClick={() => setView("myworks")} className="p-2 text-red-600"><FileText size={22}/></button>
        </div>
        <button onClick={() => setTheme(t => t === "light" ? "dark" : "light")} className="p-2 text-red-600">
          {isDark ? <Sun size={22}/> : <Moon size={22}/>}
        </button>
      </div>
    </header>
  );

  const LoginView = () => {
    const [tab, setTab] = useState("penulis");
    const [form, setForm] = useState({ email: "", password: "", username: "", nama: "", kelas: "" });
    const handleLogin = async (e) => {
      e.preventDefault();
      try {
        if (tab === "admin") {
          if (form.username === "admin" && form.password === "admin123") {
            setIsAdmin(true); setView("admin");
          }
        } else if (tab === "penulis") {
          await signInWithEmailAndPassword(auth, form.email, form.password);
          setView("beranda");
        } else {
          const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
          await setDoc(doc(db, "artifacts", appId, "public", "data", "users", cred.user.uid), {
            uid: cred.user.uid, nama: form.nama, username: form.username, email: form.email, kelas: form.kelas, friends: []
          });
          setView("beranda");
        }
      } catch (err) { showToast(err.message, "error"); }
    };
    return (
      <div className="flex flex-col items-center justify-center p-6 mt-10">
        <BookOpen size={60} className="text-red-700 mb-4" />
        <h1 className="text-3xl font-bold text-red-800 mb-8">البعد العلمي</h1>
        <div className={cardClasses + " w-full max-w-md p-8 rounded-3xl"}>
          <form onSubmit={handleLogin} className="space-y-4">
            {tab === "daftar" && <input placeholder="Nama" className={inputClasses} onChange={e=>setForm({...form, nama: e.target.value})} />}
            <input placeholder="Email" className={inputClasses} onChange={e=>setForm({...form, email: e.target.value})} />
            <input type="password" placeholder="Password" className={inputClasses} onChange={e=>setForm({...form, password: e.target.value})} />
            <button type="submit" className={btnPrimary + " w-full"}>Masuk</button>
            <p className="text-center text-xs mt-4 cursor-pointer" onClick={() => setTab(tab === "daftar" ? "penulis" : "daftar")}>
              {tab === "daftar" ? "Sudah punya akun? Login" : "Belum punya akun? Daftar"}
            </p>
          </form>
        </div>
      </div>
    );
  };

  const BerandaView = () => (
    <div className="p-6 grid grid-cols-2 gap-4 max-w-4xl mx-auto">
      {["linguistik", "sastra", "opini", "agama"].map(c => (
        <div key={c} onClick={() => { setSelectedCategory(c); setView("category"); }} className={cardClasses + " p-10 rounded-3xl text-center cursor-pointer capitalize font-bold"}>
          {c}
        </div>
      ))}
      <button onClick={() => setView("write")} className="fixed bottom-10 right-10 w-14 h-14 bg-red-700 text-white rounded-full shadow-xl flex items-center justify-center"><Plus/></button>
    </div>
  );

  return (
    <div className={"min-h-screen transition-colors " + mainClasses}>
      {toast.show && <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-red-600 text-white rounded-xl">{toast.message}</div>}
      {view !== "login" && <Header />}
      <main>
        {view === "login" && <LoginView />}
        {view === "beranda" && <BerandaView />}
        {view === "write" && (
           <div className="p-6 max-w-2xl mx-auto">
             <h2 className="text-2xl font-bold mb-4">Tulis Karya</h2>
             <button onClick={()=>setView("beranda")} className="mb-4 text-sm">Kembali</button>
             <div className={cardClasses + " p-6 rounded-2xl"}>Fitur tulis sedang sinkronisasi...</div>
           </div>
        )}
      </main>
      <footer className="py-10 text-center opacity-40 text-[10px] uppercase">
        2026 LITBANG HMPS BSA UIN JAKARTA
      </footer>
    </div>
  );
}



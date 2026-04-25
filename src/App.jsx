import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Home, UserCircle, FileText, Moon, Sun, Plus, MessageCircle, 
  Feather, PenTool, Landmark, Check, X, Trash2, LogOut, Send, Award
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, signOut 
} from 'firebase/auth';
import { 
  getFirestore, collection, onSnapshot, doc, setDoc, 
  updateDoc, addDoc, deleteDoc, query, orderBy 
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
  const [articles, setArticles] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        onSnapshot(doc(db, "artifacts", appId, "public", "data", "users", u.uid), (s) => {
          if (s.exists()) setUserProfile(s.data());
        });
        setView("beranda");
      } else { setView("login"); }
    });
    onSnapshot(query(collection(db, "artifacts", appId, "public", "data", "articles"), orderBy("createdAt", "desc")), (s) => {
      setArticles(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    onSnapshot(collection(db, "artifacts", appId, "public", "data", "users"), (s) => {
      setUsers(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubAuth();
  }, []);

  const isDark = theme === "dark";
  const mainCls = isDark ? "bg-zinc-950 text-zinc-100" : "bg-slate-50 text-slate-900";
  const cardCls = isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200 shadow-sm";

  // --- HANDLERS ---
  const handleAction = async (type, data) => {
    setLoading(true);
    try {
      if (type === "write") {
        await addDoc(collection(db, "artifacts", appId, "public", "data", "articles"), {
          ...data, authorId: user.uid, authorName: userProfile.nama, status: "pending", createdAt: new Date().toISOString()
        });
        setView("beranda");
      } else if (type === "approve") {
        await updateDoc(doc(db, "artifacts", appId, "public", "data", "articles", data.id), { status: "approved" });
      } else if (type === "delete") {
        await deleteDoc(doc(db, "artifacts", appId, "public", "data", "articles", data.id));
      }
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  // --- VIEWS ---
  const LoginView = () => {
    const [isReg, setIsReg] = useState(false);
    const [form, setForm] = useState({ email: "", pass: "", nama: "" });
    const submit = async (e) => {
      e.preventDefault();
      try {
        if (isReg) {
          const res = await createUserWithEmailAndPassword(auth, form.email, form.pass);
          await setDoc(doc(db, "artifacts", appId, "public", "data", "users", res.user.uid), {
            nama: form.nama, email: form.email, role: "penulis", points: 0
          });
        } else { await signInWithEmailAndPassword(auth, form.email, form.pass); }
      } catch (e) { alert(e.message); }
    };
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <BookOpen size={48} className="text-red-700 mb-2" />
        <h1 className="text-2xl font-bold mb-8">Al-Bud Al-Ilmi</h1>
        <form onSubmit={submit} className={cardCls + " p-8 rounded-2xl w-full max-w-sm border"}>
          {isReg && <input placeholder="Nama Lengkap" className="w-full p-3 mb-3 rounded-lg border bg-transparent" onChange={e=>setForm({...form, nama: e.target.value})} />}
          <input placeholder="Email" className="w-full p-3 mb-3 rounded-lg border bg-transparent" onChange={e=>setForm({...form, email: e.target.value})} />
          <input type="password" placeholder="Password" className="w-full p-3 mb-6 rounded-lg border bg-transparent" onChange={e=>setForm({...form, pass: e.target.value})} />
          <button className="w-full bg-red-700 text-white p-3 rounded-lg font-bold">{isReg ? "Daftar" : "Masuk"}</button>
          <p onClick={()=>setIsReg(!isReg)} className="text-center text-sm mt-4 cursor-pointer opacity-60">{isReg ? "Sudah punya akun? Login" : "Belum punya akun? Daftar"}</p>
        </form>
      </div>
    );
  };

  const Nav = () => (
    <nav className={"sticky top-0 z-50 p-4 border-b flex justify-between items-center " + (isDark ? "bg-zinc-950 border-zinc-800" : "bg-white border-slate-200")}>
      <div className="flex gap-4">
        <Home onClick={()=>setView("beranda")} className="cursor-pointer text-red-700" />
        <Award onClick={()=>setView("leaderboard")} className="cursor-pointer opacity-60" />
        {userProfile?.role === "admin" && <Settings onClick={()=>setView("admin")} className="cursor-pointer text-blue-600" />}
      </div>
      <div className="flex gap-4 items-center">
        <button onClick={()=>setTheme(isDark?"light":"dark")}>{isDark?<Sun size={20}/>:<Moon size={20}/>}</button>
        <UserCircle onClick={()=>setView("profile")} className="cursor-pointer" />
      </div>
    </nav>
  );

  return (
    <div className={"min-h-screen " + mainCls}>
      {view === "login" ? <LoginView /> : (
        <>
          <Nav />
          <main className="max-w-2xl mx-auto p-4 pb-24">
            {view === "beranda" && (
              <div className="grid grid-cols-2 gap-4">
                {[["linguistik", <PenTool/>], ["sastra", <Feather/>], ["opini", <MessageCircle/>], ["agama", <Landmark/>]].map(([id, icon]) => (
                  <div key={id} onClick={()=>{setSelectedCat(id); setView("category")}} className={cardCls + " p-6 rounded-xl border cursor-pointer capitalize font-bold flex flex-col items-center"}>
                    <div className="text-red-700 mb-2">{icon}</div> {id}
                  </div>
                ))}
              </div>
            )}
            {view === "category" && (
              <div>
                <h2 className="text-xl font-bold mb-4 capitalize">Kategori: {selectedCat}</h2>
                {articles.filter(a => a.category === selectedCat && a.status === "approved").map(a => (
                  <div key={a.id} className={cardCls + " p-4 rounded-xl border mb-3"}>
                    <h3 className="font-bold">{a.title}</h3>
                    <p className="text-sm opacity-70">Oleh: {a.authorName}</p>
                  </div>
                ))}
              </div>
            )}
            {view === "admin" && (
              <div>
                <h2 className="text-xl font-bold mb-4">Validasi Karya</h2>
                {articles.filter(a => a.status === "pending").map(a => (
                  <div key={a.id} className={cardCls + " p-4 rounded-xl border mb-3 flex justify-between items-center"}>
                    <div><p className="font-bold">{a.title}</p><p className="text-xs">{a.authorName}</p></div>
                    <div className="flex gap-2">
                      <Check onClick={()=>handleAction("approve", a)} className="text-green-500 cursor-pointer" />
                      <Trash2 onClick={()=>handleAction("delete", a)} className="text-red-500 cursor-pointer" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {view === "profile" && (
               <div className="text-center">
                 <UserCircle size={64} className="mx-auto mb-2" />
                 <h2 className="text-xl font-bold">{userProfile?.nama}</h2>
                 <p className="opacity-60 mb-6">{userProfile?.email}</p>
                 <button onClick={()=>signOut(auth)} className="bg-red-100 text-red-700 px-6 py-2 rounded-full flex items-center gap-2 mx-auto"><LogOut size={16}/> Keluar</button>
               </div>
            )}
          </main>
          <button onClick={()=>setView("write")} className="fixed bottom-6 right-6 w-14 h-14 bg-red-700 text-white rounded-full shadow-lg flex items-center justify-center"><Plus/></button>
        </>
      )}
      <footer className="p-10 text-center opacity-30 text-[10px] uppercase">LITBANG HMPS BSA UIN JAKARTA 2026</footer>
    </div>
  );
}

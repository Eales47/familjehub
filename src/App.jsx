import { useState, useEffect, useCallback, useRef, useMemo } from "react";

const T = {
  bg: "#F7F6F2", surface: "#FFFFFF", surfaceAlt: "#F0EEE9", border: "#E8E4DC",
  text: "#1C1917", textMuted: "#78716C", textLight: "#A8A29E",
  accent: "#E07A44", accentSoft: "#FDF0E8", accentHover: "#C96830",
  green: "#3DAD7F", greenSoft: "#E8F7F1", blue: "#4A80C4", blueSoft: "#EAF1FB",
  red: "#D95B5B", redSoft: "#FDEAEA", yellow: "#D4A017", yellowSoft: "#FDF6E3",
  purple: "#8B5CF6", purpleSoft: "#F3EFFE",
  shadow: "0 1px 4px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.05)",
  shadowMd: "0 4px 24px rgba(0,0,0,0.10)", radius: 14,
};

const INITIAL_USERS = [
  { id:1, name:"Camilla", role:"parent", color:"#E07A44", avatar:"👩", birthdate:"1981-09-17", phone:"", pin:"" },
  { id:2, name:"Basse", role:"parent", color:"#4A80C4", avatar:"👨", birthdate:"1991-10-04", phone:"", pin:"" },
  { id:3, name:"Justus", role:"child", color:"#3DAD7F", avatar:"👦", birthdate:"2012-02-01", phone:"", pin:"" },
  { id:4, name:"Noomi", role:"child", color:"#D95B5B", avatar:"👧", birthdate:"2015-04-05", phone:"", pin:"" },
  { id:5, name:"Noel", role:"child", color:"#8B5CF6", avatar:"👦", birthdate:"2016-09-21", phone:"", pin:"" },
  { id:6, name:"Ellie", role:"child", color:"#D4A017", avatar:"👧", birthdate:"2018-12-23", phone:"", pin:"" },
];

const today = new Date();
const fmt = (d) => { const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,"0"); const day=String(d.getDate()).padStart(2,"0"); return `${y}-${m}-${day}`; };
const todayStr = fmt(today);
const addDays = (d,n) => { const x=new Date(d); x.setDate(x.getDate()+n); return x; };

const INITIAL_EVENTS = [];

const MEAL_INIT = { Måndag:"Köttbullar & pasta", Tisdag:"Kycklingwok", Onsdag:"Tacos", Torsdag:"Laxgratäng", Fredag:"Pizza", Lördag:"Grillat", Söndag:"Soppa & bröd" };
const SHOP_INIT = [];
const MEDS_INIT = [];
const WISHES_INIT = [];
const TASKS_INIT = [];
const QUICK_INIT = [];
const CHAT_INIT = [
  { id: 1001, familyId: "demo-family", type: "group", name: "Familjechatten", createdBy: 1, memberIds: [1,2,3,4,5,6] },
  { id: 1002, familyId: "demo-family", type: "group", name: "Barnhörnan", createdBy: 1, memberIds: [3,4,5,6] },
  { id: 1003, familyId: "demo-family", type: "direct", name: "", createdBy: 1, memberIds: [1,3] },
];
const CHAT_MESSAGES_INIT = [
  { id: 2001, chatId: 1001, senderId: 1, text: "Välkommen till familjechatten 💛 Här kan vi hålla ihop vardagen.", createdAt: "2026-03-26T07:30:00" },
  { id: 2002, chatId: 1002, senderId: 3, text: "Barnhörnan är öppen 😎", createdAt: "2026-03-26T07:45:00" },
  { id: 2003, chatId: 1003, senderId: 1, text: "Justus, glöm inte träningen efter skolan.", createdAt: "2026-03-26T08:05:00" },
];
const CHAT_READS_INIT = {
  1001: { 1: "2026-03-26T07:30:00", 2: "2026-03-26T07:30:00" },
  1002: { 1: "2026-03-26T07:45:00", 2: "2026-03-26T07:45:00", 3: "2026-03-26T07:45:00", 4: "2026-03-26T07:45:00", 5: "2026-03-26T07:45:00", 6: "2026-03-26T07:45:00" },
  1003: { 1: "2026-03-26T08:05:00", 3: "2026-03-26T08:05:00" },
};

const INITIAL_FAMILY = {
  id: "demo-family",
  name: "Familjen Karlstad",
  inviteCode: "FAM-2468",
};

const STORAGE_KEYS = {
  family: "familjehub_family_v1",
  users: "familjehub_users_v1",
  events: "familjehub_events_v1",
  meals: "familjehub_meals_v1",
  shopping: "familjehub_shopping_v1",
  meds: "familjehub_meds_v1",
  wishes: "familjehub_wishes_v1",
  tasks: "familjehub_tasks_v1",
  quickAlerts: "familjehub_quick_alerts_v1",
  chats: "familjehub_chats_v1",
  chatMessages: "familjehub_chat_messages_v1",
  chatReads: "familjehub_chat_reads_v1",
  seenNotifications: "familjehub_seen_notifications_v1",
};

function loadStored(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.error("[Storage] Kunde inte läsa", key, e);
    return fallback;
  }
}
function saveStored(key, value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("[Storage] Kunde inte spara", key, e);
  }
}
function normalizeUsers(input) {
  if (!Array.isArray(input) || !input.length) return INITIAL_USERS;
  return input.map(u => ({
    ...u,
    role: u.role === "parent" ? "parent" : "child",
    pin: u.pin || "",
    phone: u.phone || "",
    birthdate: u.birthdate || "",
  }));
}
function isAdminUser(u) {
  return u?.role === "parent";
}
function isChildOnlyChat(chat, users) {
  return !!chat?.memberIds?.length && chat.memberIds.every(id => users.find(u => u.id === id)?.role === "child");
}
function canUserSeeChat(chat, currentUser, users) {
  if (!chat || !currentUser) return false;
  if (chat.memberIds?.includes(currentUser.id)) return true;
  if (currentUser.role === "parent") return isChildOnlyChat(chat, users);
  return false;
}
function isUserChatParticipant(chat, currentUser) {
  return !!chat && !!currentUser && Array.isArray(chat.memberIds) && chat.memberIds.includes(currentUser.id);
}

const ET = {
  training: { label:"Träning", icon:"🏃", color:T.green, soft:T.greenSoft },
  transport: { label:"Skjutsning", icon:"🚗", color:T.yellow, soft:T.yellowSoft },
  meeting: { label:"Möte", icon:"📋", color:T.blue, soft:T.blueSoft },
  family: { label:"Familj", icon:"🏠", color:T.accent, soft:T.accentSoft },
  birthday: { label:"Födelsedag", icon:"🎂", color:T.purple, soft:T.purpleSoft },
  other: { label:"Övrigt", icon:"📌", color:T.textMuted, soft:T.surfaceAlt },
};

const WD = ["Mån","Tis","Ons","Tor","Fre","Lör","Sön"];
const WDF = ["Måndag","Tisdag","Onsdag","Torsdag","Fredag","Lördag","Söndag"];

function getWeekDates(off=0) {
  const d=new Date(); const day=d.getDay()===0?6:d.getDay()-1;
  const mon=new Date(d); mon.setDate(d.getDate()-day+off*7);
  return Array.from({length:7},(_,i)=>{ const dd=new Date(mon); dd.setDate(mon.getDate()+i); return dd; });
}
function isSameDay(a,b){ return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate(); }
function getBirthdays(users,dates){
  const r=[];
  users.forEach(u=>{ if(!u.birthdate)return; const bd=new Date(u.birthdate);
    dates.forEach(d=>{ if(bd.getDate()===d.getDate()&&bd.getMonth()===d.getMonth()){
      r.push({id:`bd-${u.id}-${fmt(d)}`,title:`${u.name} fyller ${d.getFullYear()-bd.getFullYear()}!`,date:fmt(d),time:"00:00",type:"birthday",assignedTo:[u.id],createdBy:0,note:"",recurring:false});
    }});
  }); return r;
}

function Toast({ msg, onClose }) {
  useEffect(()=>{ const t=setTimeout(onClose,3000); return ()=>clearTimeout(t); },[onClose]);
  return (
    <div style={{position:"fixed",bottom:28,right:28,background:T.text,color:"#fff",padding:"13px 20px",borderRadius:12,zIndex:9999,fontSize:14,boxShadow:T.shadowMd,display:"flex",alignItems:"center",gap:8,maxWidth:340,animation:"toast 0.2s ease"}}>
      <style>{`@keyframes toast{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}`}</style>
      {msg}
    </div>
  );
}

function weatherCodeToIcon(code) {
  if (code === 0) return { icon:"☀️", desc:"Klart och soligt" };
  if (code <= 2) return { icon:"🌤️", desc:"Mestadels soligt" };
  if (code === 3) return { icon:"☁️", desc:"Mulet" };
  if (code <= 49) return { icon:"🌫️", desc:"Dimma" };
  if (code <= 59) return { icon:"🌦️", desc:"Duggregn" };
  if (code <= 69) return { icon:"🌧️", desc:"Regn" };
  if (code <= 79) return { icon:"🌨️", desc:"Snö" };
  if (code <= 84) return { icon:"🌦️", desc:"Regnskurar" };
  if (code <= 94) return { icon:"⛈️", desc:"Åska" };
  return { icon:"⛈️", desc:"Kraftig åska" };
}

function normalizeMedTimes(input) {
  if (Array.isArray(input)) return input.filter(Boolean);
  return String(input || "").split(",").map(s=>s.trim()).filter(Boolean);
}
function getMedStatus(med, userId, date = todayStr) {
  const raw = med?.confirms?.[userId];
  if (!raw) return "idle";
  if (typeof raw === "string") return raw;
  if (raw?.date === date) return raw.status || "idle";
  return "idle";
}
function isMedDueToday(med, date = todayStr) {
  if (!med?.active) return false;
  const start = med.startDate || date;
  const end = med.endDate || "";
  if (date < start) return false;
  if (end && date > end) return false;
  return true;
}
function medScheduleLabel(med) {
  const times = normalizeMedTimes(med.times).join(", ");
  const schedule = med.scheduleType === "twice_daily" ? "2 ggr/dag" : med.scheduleType === "custom" ? "Egna tider" : med.recurring ? "Dagligen" : "Engångsmedicin";
  const end = med.endDate ? ` · till ${med.endDate}` : med.recurring ? " · utan slutdatum" : "";
  return `${schedule} · ${times}${end}`;
}
function weatherAdvice(code, high, wind, precip) {
  if (code >= 95) return "Stanna inne – åska! ⛈️";
  if (precip > 10) return "Regnjacka & stövlar! 🥾";
  if (code >= 70) return "Varma kläder & stövlar ❄️";
  if (code >= 60 || precip > 2) return "Ta med regnjacka 🌂";
  if (wind > 10) return "Blåsigt – ta en tjockare jacka";
  if (high < 5) return "Klä dig varmt! 🧥";
  if (high < 12) return "Jacka behövs 🧣";
  if (high < 18) return "Lätt jacka räcker";
  return "Perfekt väder! 🌿";
}

function useIsMobile(breakpoint = 900) {
  const getMatch = () => (typeof window !== "undefined" ? window.innerWidth <= breakpoint : false);
  const [isMobile, setIsMobile] = useState(getMatch);
  useEffect(() => {
    const onResize = () => setIsMobile(getMatch());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isMobile;
}

function MobileBottomNav({ items, activeTab, onChange }) {
  return (
    <div style={{position:"fixed",left:0,right:0,bottom:0,zIndex:40,background:"rgba(255,255,255,0.96)",backdropFilter:"blur(10px)",borderTop:`1px solid ${T.border}`,display:"grid",gridTemplateColumns:`repeat(${Math.min(items.length,5)},1fr)`,gap:0,padding:"8px 8px calc(env(safe-area-inset-bottom, 0px) + 8px)"}}>
      {items.slice(0,5).map(item=>(
        <button key={item.id} onClick={()=>onChange(item.id)} style={{background:"transparent",border:"none",padding:"8px 4px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,color:activeTab===item.id?T.accent:T.textMuted,fontWeight:activeTab===item.id?800:700,fontSize:11,position:"relative"}}>
          <span style={{fontSize:18,lineHeight:1}}>{item.icon}</span>
          <span>{item.label}</span>
          {item.badge>0&&<span style={{position:"absolute",top:2,right:"18%",minWidth:18,height:18,borderRadius:999,background:T.red,color:"#fff",display:"inline-flex",alignItems:"center",justifyContent:"center",padding:"0 5px",fontSize:10,fontWeight:800}}>{item.badge}</span>}
        </button>
      ))}
    </div>
  );
}

function MobileQuickTabs({ items, activeTab, onChange }) {
  return (
    <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:2,marginBottom:14}}>
      {items.map(item=>(
        <button key={item.id} onClick={()=>onChange(item.id)} style={{whiteSpace:"nowrap",background:activeTab===item.id?T.accentSoft:T.surface,border:`1px solid ${activeTab===item.id?T.accent:T.border}`,color:activeTab===item.id?T.accent:T.textMuted,borderRadius:999,padding:"9px 12px",fontSize:12,fontWeight:800,display:"inline-flex",alignItems:"center",gap:6,position:"relative"}}>
          <span>{item.icon}</span><span>{item.label}</span>
          {item.badge>0&&<span style={{minWidth:18,height:18,borderRadius:999,background:T.red,color:"#fff",display:"inline-flex",alignItems:"center",justifyContent:"center",padding:"0 5px",fontSize:10,fontWeight:800}}>{item.badge}</span>}
        </button>
      ))}
    </div>
  );
}


export default function App() {
  const [user, setUser] = useState(null);
  const [family, setFamily] = useState(() => ({ ...INITIAL_FAMILY, ...loadStored(STORAGE_KEYS.family, INITIAL_FAMILY) }));
  const [users, setUsers] = useState(() => normalizeUsers(loadStored(STORAGE_KEYS.users, INITIAL_USERS)));
  const [events, setEvents] = useState(() => loadStored(STORAGE_KEYS.events, INITIAL_EVENTS));
  const [meals, setMeals] = useState(() => loadStored(STORAGE_KEYS.meals, MEAL_INIT));
  const [shopping, setShopping] = useState(() => loadStored(STORAGE_KEYS.shopping, SHOP_INIT));
  const [meds, setMeds] = useState(() => loadStored(STORAGE_KEYS.meds, MEDS_INIT));
  const [wishes, setWishes] = useState(() => loadStored(STORAGE_KEYS.wishes, WISHES_INIT));
  const [tasks, setTasks] = useState(() => loadStored(STORAGE_KEYS.tasks, TASKS_INIT));
  const [quickAlerts, setQuickAlerts] = useState(() => loadStored(STORAGE_KEYS.quickAlerts, QUICK_INIT));
  const [chats, setChats] = useState(() => loadStored(STORAGE_KEYS.chats, CHAT_INIT));
  const [chatMessages, setChatMessages] = useState(() => loadStored(STORAGE_KEYS.chatMessages, CHAT_MESSAGES_INIT));
  const [chatReads, setChatReads] = useState(() => loadStored(STORAGE_KEYS.chatReads, CHAT_READS_INIT));
  const [seenNotifications, setSeenNotifications] = useState(() => loadStored(STORAGE_KEYS.seenNotifications, []));
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);
  const [tab, setTab] = useState("dashboard");
  const [weekOff, setWeekOff] = useState(0);
  const [toast, setToast] = useState(null);
  const [city, setCity] = useState("Karlstad");
  const [weather, setWeather] = useState([]);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState("");
  const [weatherOpen, setWeatherOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobile = useIsMobile();

  useEffect(() => { saveStored(STORAGE_KEYS.family, family); }, [family]);
  useEffect(() => { saveStored(STORAGE_KEYS.users, users); }, [users]);
  useEffect(() => { saveStored(STORAGE_KEYS.events, events); }, [events]);
  useEffect(() => { saveStored(STORAGE_KEYS.meals, meals); }, [meals]);
  useEffect(() => { saveStored(STORAGE_KEYS.shopping, shopping); }, [shopping]);
  useEffect(() => { saveStored(STORAGE_KEYS.meds, meds); }, [meds]);
  useEffect(() => { saveStored(STORAGE_KEYS.wishes, wishes); }, [wishes]);
  useEffect(() => { saveStored(STORAGE_KEYS.tasks, tasks); }, [tasks]);
  useEffect(() => { saveStored(STORAGE_KEYS.quickAlerts, quickAlerts); }, [quickAlerts]);
  useEffect(() => { saveStored(STORAGE_KEYS.chats, chats); }, [chats]);
  useEffect(() => { saveStored(STORAGE_KEYS.chatMessages, chatMessages); }, [chatMessages]);
  useEffect(() => { saveStored(STORAGE_KEYS.chatReads, chatReads); }, [chatReads]);
  useEffect(() => { saveStored(STORAGE_KEYS.seenNotifications, seenNotifications); }, [seenNotifications]);

  useEffect(() => {
    if (!user) return;
    const next = users.find(u => u.id === user.id);
    if (!next) { setUser(null); return; }
    if (JSON.stringify(next) !== JSON.stringify(user)) setUser(next);
  }, [users]);

  useEffect(() => {
    if (!city.trim()) return;
    const ctrl = new AbortController();
    async function fetchWeather() {
      setWeatherLoading(true);
      setWeatherError("");
      try {
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city.trim())}&count=1&format=json`,
          { signal: ctrl.signal }
        );
        const geoData = await geoRes.json();
        if (!geoData.results?.length) {
          setWeatherError(`Hittade ingen stad som heter "${city}"`);
          setWeatherLoading(false);
          return;
        }
        const { latitude, longitude } = geoData.results[0];
        const wRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
          `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max` +
          `&timezone=Europe%2FStockholm&forecast_days=7`,
          { signal: ctrl.signal }
        );
        const wData = await wRes.json();
        const d = wData.daily;
        if (!d) { setWeatherError("Ogiltigt svar från väder-API"); setWeatherLoading(false); return; }
        const days = d.time.map((dateStr, i) => {
          const date = new Date(dateStr + "T12:00:00");
          const jsDay = date.getDay();
          const dayIdx = jsDay === 0 ? 6 : jsDay - 1;
          const code = d.weather_code[i];
          const precip = d.precipitation_sum[i] ?? 0;
          const wind = Math.round(d.wind_speed_10m_max[i] ?? 0);
          const high = Math.round(d.temperature_2m_max[i]);
          const low = Math.round(d.temperature_2m_min[i]);
          const { icon, desc } = weatherCodeToIcon(code);
          const outdoor = precip < 5 && wind < 12;
          const advice = weatherAdvice(code, high, wind, precip);
          return { day: WD[dayIdx], dateStr, icon, high, low, desc, wind, advice, outdoor, precip };
        });
        setWeather(days);
      } catch(e) {
        if (e.name !== "AbortError") setWeatherError("Kunde inte hämta väder. Kontrollera uppkopplingen.");
      }
      setWeatherLoading(false);
    }
    const t = setTimeout(fetchWeather, 600);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [city]);
  const [modal, setModal] = useState(null);

  // form states
  const [newEv, setNewEv] = useState({ title:"", date:todayStr, time:"12:00", timeTo:"", type:"other", assignedTo:[], note:"" });
  const [rec, setRec] = useState({ title:"", startDate:todayStr, endDate:"", time:"18:00", timeTo:"", type:"training", days:[], assignedTo:[], note:"" });
  const [newUser, setNewUser] = useState({ name:"", role:"child", color:"#E07A44", avatar:"👤", birthdate:"", phone:"", pin:"" });
  const [editUserData, setEditUserData] = useState(null);
  const [smsMsg, setSmsMsg] = useState(""); const [smsRec, setSmsRec] = useState([]);
  const [newWish, setNewWish] = useState("");
  const [shopForm, setShopForm] = useState({ item:"", qty:"", category:"Övrigt" });
  const [medForm, setMedForm] = useState({ name:"", dose:"", times:"08:00", assignedTo:3, recurring:true, scheduleType:"daily", startDate:todayStr, endDate:"" });
  const [taskForm, setTaskForm] = useState({ title:"", assignedTo:3, points:5, dueDate:fmt(addDays(today,1)) });

  const notify = (m) => setToast(m);
  const close = () => setModal(null);
  const isParent = isAdminUser(user);
  const weekDates = getWeekDates(weekOff);
  const allEvs = [...events, ...getBirthdays(users, weekDates)];
  const visEvs = isParent ? allEvs : allEvs.filter(e=>e.assignedTo.includes(user?.id));
  const efd = (date) => visEvs.filter(e=>e.date===fmt(date)).sort((a,b)=>a.time.localeCompare(b.time));
  const byId = (id) => users.find(u=>u.id===id);
  const unread = wishes.filter(w=>!w.read).length + quickAlerts.filter(a=>!a.read).length;
  const visibleChatsNow = chats.filter(c => canUserSeeChat(c, user, users));
  const participatedChatsNow = visibleChatsNow.filter(c => isUserChatParticipant(c, user));
  const chatUnread = participatedChatsNow.reduce((sum, chat) => {
    const lastRead = chatReads?.[chat.id]?.[user?.id] || "";
    const unreadCount = chatMessages.filter(m => m.chatId === chat.id && m.senderId !== user?.id && (!lastRead || m.createdAt > lastRead)).length;
    return sum + unreadCount;
  }, 0);
  const myMedPending = !isParent ? meds.filter(m=>isMedDueToday(m)&&m.assignedTo===user?.id&&getMedStatus(m, user?.id)==="pending") : [];
  const pendingCount = isParent ? meds.filter(m=>isMedDueToday(m) && users.some(u=>u.id===m.assignedTo && getMedStatus(m,u.id)==="pending")).length : myMedPending.length;

  const notifications = (() => {
    const items = [];
    participatedChatsNow.forEach(chat => {
      const lastRead = chatReads?.[chat.id]?.[user?.id] || "";
      chatMessages
        .filter(m => m.chatId === chat.id && m.senderId !== user?.id && (!lastRead || m.createdAt > lastRead))
        .forEach(msg => {
          const sender = byId(msg.senderId);
          items.push({
            id: `chat-${msg.id}-u${user?.id}`,
            createdAt: msg.createdAt,
            title: `💬 ${sender ? sender.name : "Nytt meddelande"}`,
            subtitle: msg.text,
            unread: true,
            action: () => { setActiveChatId(chat.id); setTab("chat"); setNotificationsOpen(false); },
          });
        });
    });

    if (isParent) {
      quickAlerts.filter(a => !a.read).forEach(a => {
        const sender = byId(a.from);
        items.push({
          id: `quick-${a.id}`,
          createdAt: `${a.date}T${a.time}`,
          title: `${a.icon} ${sender ? sender.name : "Barn"} behöver dig`,
          subtitle: a.message,
          unread: true,
          action: () => { setTab("messages"); setNotificationsOpen(false); },
        });
      });
      wishes.filter(w => !w.read).forEach(w => {
        const sender = byId(w.from);
        items.push({
          id: `wish-${w.id}`,
          createdAt: `${w.date}T12:00`,
          title: `🍕 Matönskemål från ${sender ? sender.name : "barn"}`,
          subtitle: w.wish,
          unread: true,
          action: () => { setTab("messages"); setNotificationsOpen(false); },
        });
      });
      meds.forEach(m => {
        const child = byId(m.assignedTo);
        const status = getMedStatus(m, m.assignedTo);
        if (child?.role === "child" && status === "done" && isMedDueToday(m)) {
          items.push({
            id: `med-${m.id}-${m.assignedTo}-${todayStr}`,
            createdAt: `${todayStr}T23:00`,
            title: `✅ ${child.name} har tagit ${m.name}`,
            subtitle: medScheduleLabel(m),
            unread: !seenNotifications.includes(`med-${m.id}-${m.assignedTo}-${todayStr}`),
            action: () => { setTab("health"); setNotificationsOpen(false); },
          });
        }
      });
      tasks.filter(t => t.done && t.completedAt && String(t.completedAt).slice(0,10) === todayStr).forEach(t => {
        const child = byId(t.assignedTo);
        if (child?.role === "child") {
          items.push({
            id: `task-${t.id}-${t.completedAt}`,
            createdAt: t.completedAt,
            title: `🎯 ${child.name} klar med uppdrag`,
            subtitle: t.title,
            unread: !seenNotifications.includes(`task-${t.id}-${t.completedAt}`),
            action: () => { setTab("tasks"); setNotificationsOpen(false); },
          });
        }
      });
    }

    return items.sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0,20);
  })();
  const notificationBadge = notifications.filter(n => n.unread && !seenNotifications.includes(n.id)).length;
  function handleNotificationClick(item) {
    setSeenNotifications(prev => prev.includes(item.id) ? prev : [item.id, ...prev].slice(0,300));
    item.action?.();
  }
  function markAllNotificationsRead() {
    setSeenNotifications(prev => Array.from(new Set([...notifications.map(n => n.id), ...prev])).slice(0,300));
  }


  function saveEvent() {
    if(!newEv.title) return;
    const assignedTo = isParent ? (newEv.assignedTo.length ? newEv.assignedTo : [user.id]) : [user.id];
    setEvents(p=>[...p,{...newEv,id:Date.now(),createdBy:user.id,assignedTo,recurring:false}]);
    close(); setNewEv({title:"",date:todayStr,time:"12:00",timeTo:"",type:"other",assignedTo:[],note:""}); notify(isParent?"📅 Händelse sparad!":"📅 Din händelse är inlagd i kalendern!");
  }
  function sendQuickAction(action) {
    const alert = {
      id: Date.now(),
      from: user.id,
      type: action.id,
      icon: action.icon,
      label: action.label,
      message: action.message,
      date: new Date().toLocaleDateString("sv-SE"),
      time: new Date().toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" }),
      read: false,
    };
    setQuickAlerts(p=>[...p, alert]);
    notify(`${action.message} – skickat till föräldrarna!`);
  }
  function saveRecurring() {
    if(!rec.title||!rec.days.length||!rec.endDate) return;
    const evs=[];
    // Parse dates as local time by splitting the string — avoids UTC-offset day shift
    const [sy,sm,sd]=rec.startDate.split("-").map(Number);
    const [ey,em,ed]=rec.endDate.split("-").map(Number);
    const cur=new Date(sy,sm-1,sd); const end=new Date(ey,em-1,ed);
    while(cur<=end){
      const jsDay=cur.getDay(); const mapped=jsDay===0?6:jsDay-1;
      if(rec.days.includes(mapped)) evs.push({id:Date.now()+evs.length,title:rec.title,date:fmt(cur),time:rec.time,timeTo:rec.timeTo||"",type:rec.type,assignedTo:rec.assignedTo.length?rec.assignedTo:[user.id],createdBy:user.id,note:rec.note,recurring:true});
      cur.setDate(cur.getDate()+1);
    }
    setEvents(p=>[...p,...evs]); close();
    setRec({title:"",startDate:todayStr,endDate:"",time:"18:00",timeTo:"",type:"training",days:[],assignedTo:[],note:""});
    notify(`🔁 ${evs.length} återkommande händelser skapade!`);
  }
  function sendReminder(medId,userId) {
    setMeds(p=>p.map(m=>m.id===medId?{...m,confirms:{...m.confirms,[userId]:{date:todayStr,status:"pending"}}}:m));
    notify(`💊 Påminnelse skickad till ${byId(userId)?.name}!`);
  }
  function confirmMed(medId,userId) {
    setMeds(p=>p.map(m=>m.id===medId?{...m,confirms:{...m.confirms,[userId]:{date:todayStr,status:"done"}}}:m));
    notify("✅ Medicin bekräftad – bra jobbat!");
  }
  function markChatRead(chatId, readerId = user?.id) {
    if (!readerId || !chatId) return;
    setChatReads(prev => ({ ...prev, [chatId]: { ...(prev[chatId] || {}), [readerId]: new Date().toISOString() } }));
  }
  function sendChatMessage(chatId, text) {
    const clean = String(text || "").trim();
    if (!clean || !user) return;
    const stamp = new Date().toISOString();
    setChatMessages(prev => [...prev, { id: Date.now(), chatId, senderId: user.id, text: clean, createdAt: stamp }]);
    setChatReads(prev => ({ ...prev, [chatId]: { ...(prev[chatId] || {}), [user.id]: stamp } }));
    notify("📨 Meddelande skickat!");
  }
  function createChat({ type, name, memberIds }) {
    if (!user) return { ok: false };
    const uniqueMembers = Array.from(new Set([...(memberIds || []), user.id]));
    if (type === "direct" && uniqueMembers.length !== 2) {
      notify("⚠️ En direktchatt måste ha exakt två deltagare.");
      return { ok: false };
    }
    if (type === "group" && uniqueMembers.length < 2) {
      notify("⚠️ En gruppchatt behöver minst två deltagare.");
      return { ok: false };
    }
    if (user.role !== "parent" && type === "group") {
      notify("⚠️ Gruppchattar skapas av en vuxen/admin.");
      return { ok: false };
    }
    const existingDirect = chats.find(c => c.type === "direct" && c.memberIds?.length === 2 && uniqueMembers.length === 2 && uniqueMembers.every(id => c.memberIds.includes(id)));
    if (existingDirect) return { ok: true, chatId: existingDirect.id, existed: true };
    const chatId = Date.now();
    const created = { id: chatId, familyId: family.id, type, name: type === "group" ? (name || "Ny grupp") : "", createdBy: user.id, memberIds: uniqueMembers };
    setChats(prev => [...prev, created]);
    const stamp = new Date().toISOString();
    setChatMessages(prev => [...prev, { id: chatId + 1, chatId, senderId: user.id, text: type === "group" ? `Skapade gruppchatten ${created.name}` : "Startade en ny direktchatt 👋", createdAt: stamp, system: true }]);
    setChatReads(prev => ({ ...prev, [chatId]: Object.fromEntries(uniqueMembers.map(id => [id, id === user.id ? stamp : ""])) }));
    notify(type === "group" ? "💬 Gruppchatt skapad!" : "💬 Direktchatt skapad!");
    return { ok: true, chatId, existed: false };
  }

  if(!user) return <LoginScreen users={users} family={family} onLogin={u=>{setUser(u);setTab("dashboard");}}/>;

  const NAV = [
    {id:"dashboard",icon:"🏠",label:"Hem"},
    {id:"calendar",icon:"📅",label:"Kalender"},
    {id:"meals",icon:"🍽️",label:"Matsedel"},
    {id:"shopping",icon:"🛒",label:"Inköp"},
    {id:"health",icon:"💊",label:"Hälsa",badge:pendingCount},
    {id:"tasks",icon:"🎯",label:"Uppdrag"},
    {id:"chat",icon:"🗨️",label:"Chatt",badge:chatUnread},
    ...(isParent?[
      {id:"messages",icon:"📣",label:"Meddelanden",badge:unread},
      {id:"admin",icon:"⚙️",label:"Admin"},
    ]:[
      {id:"wishes",icon:"🍕",label:"Matönskemål"},
      {id:"quick",icon:"⚡",label:"Snabbåtgärder"},
    ]),
  ];

  const PAGE_TITLE = {dashboard:"Hem",calendar:"Kalender",meals:"Matsedel",shopping:"Inköpslista",health:"Hälsa & Mediciner",tasks:"Veckouppdrag",chat:"Familjechatt",messages:"Meddelanden",admin:"Familjeadmin",wishes:"Matönskemål",quick:"Snabbåtgärder"};

  return (
    <div style={{display:"flex",minHeight:"100vh",background:T.bg,fontFamily:"'Nunito','Segoe UI',sans-serif",color:T.text,paddingBottom:mobile?"88px":0,overflowX:"hidden",width:"100%",maxWidth:"100vw"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');*{box-sizing:border-box;}html,body,#root{margin:0;padding:0;width:100%;max-width:100%;overflow-x:hidden;background:${T.bg};}img,svg,canvas{max-width:100%;}::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-thumb{background:${T.border};border-radius:3px;}input,select,textarea,button{font-family:inherit;min-width:0;}`}</style>
      {toast && <Toast msg={toast} onClose={()=>setToast(null)}/>}

      {/* SIDEBAR */}
      {!mobile && <aside style={{width:220,background:T.surface,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{padding:"22px 20px 16px",borderBottom:`1px solid ${T.border}`}}>
          <div style={{fontSize:20,fontWeight:800,color:T.accent}}>🏡 {family.name}</div>
          <div style={{fontSize:11,color:T.textLight,marginTop:1}}>Basort: {city}</div>
        </div>

        <div style={{padding:"14px 16px",borderBottom:`1px solid ${T.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:isParent?10:0}}>
            <div style={{width:38,height:38,borderRadius:"50%",background:user.color+"22",border:`2px solid ${user.color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:19}}>{user.avatar}</div>
            <div>
              <div style={{fontWeight:700,fontSize:13}}>{user.name}</div>
              <div style={{fontSize:11,color:isParent?T.accent:T.textLight}}>{isParent?"👑 Förälder":"👶 Barn"}</div>
            </div>
          </div>
          {isParent&&(
            <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
              {users.map(u=>(
                <button key={u.id} onClick={()=>setUser(u)} title={u.name} style={{width:26,height:26,borderRadius:"50%",border:`2px solid ${user.id===u.id?u.color:"transparent"}`,background:user.id===u.id?u.color+"22":"transparent",fontSize:14,cursor:"pointer",padding:0}}>
                  {u.avatar}
                </button>
              ))}
            </div>
          )}
        </div>

        <nav style={{flex:1,padding:"10px 10px",overflowY:"auto"}}>
          {NAV.map(n=>(
            <button key={n.id} onClick={()=>setTab(n.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:9,padding:"9px 10px",borderRadius:9,border:"none",background:tab===n.id?T.accentSoft:"transparent",color:tab===n.id?T.accent:T.textMuted,cursor:"pointer",fontWeight:tab===n.id?700:600,fontSize:13,marginBottom:2,textAlign:"left",position:"relative"}}>
              <span style={{fontSize:16}}>{n.icon}</span>{n.label}
              {n.badge>0&&<span style={{marginLeft:"auto",background:T.red,color:"#fff",fontSize:9,fontWeight:800,width:17,height:17,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>{n.badge}</span>}
            </button>
          ))}
        </nav>

        <div style={{padding:"12px 16px",borderTop:`1px solid ${T.border}`}}>
          <button onClick={()=>setUser(null)} style={{width:"100%",padding:"7px 10px",borderRadius:7,border:`1px solid ${T.border}`,background:"transparent",color:T.textMuted,cursor:"pointer",fontSize:12,fontWeight:600}}>← Byt profil</button>
        </div>
      </aside>}

      {/* MAIN AREA */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",width:"100%"}}>
        <header style={{position:mobile?"sticky":"static",top:0,zIndex:30,background:"rgba(255,255,255,0.94)",backdropFilter:mobile?"blur(10px)":"none",borderBottom:`1px solid ${T.border}`,padding:mobile?"12px 14px":"14px 26px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:12,minWidth:0}}>
            {mobile && <button onClick={()=>setMobileMenuOpen(true)} style={{width:40,height:40,borderRadius:12,border:`1px solid ${T.border}`,background:T.surface,cursor:"pointer",fontSize:18,flexShrink:0}}>☰</button>}
            <div style={{minWidth:0}}>
              <h1 style={{margin:0,fontSize:mobile?18:19,fontWeight:800,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{mobile ? `🏡 ${PAGE_TITLE[tab]}` : PAGE_TITLE[tab]}</h1>
              <div style={{fontSize:11,color:T.textLight,marginTop:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{mobile ? `${family.name} · ${today.toLocaleDateString("sv-SE",{month:"short",day:"numeric"})}` : today.toLocaleDateString("sv-SE",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div>
            </div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center",position:"relative",flexShrink:0}}>
            <button onClick={()=>setNotificationsOpen(v=>!v)} style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"center",width:42,height:42,borderRadius:12,border:`1px solid ${notificationsOpen ? T.accent : T.border}`,background:notificationsOpen ? T.accentSoft : T.surface,cursor:"pointer",fontSize:18}}>
              🔔
              {notificationBadge>0 && <span style={{position:"absolute",top:-4,right:-4,minWidth:20,height:20,borderRadius:999,background:T.red,color:"#fff",display:"inline-flex",alignItems:"center",justifyContent:"center",padding:"0 6px",fontSize:10,fontWeight:800}}>{notificationBadge}</span>}
            </button>
            {notificationsOpen && <NotificationCenter notifications={notifications} seenNotifications={seenNotifications} onClickItem={handleNotificationClick} onClose={()=>setNotificationsOpen(false)} onMarkAllRead={markAllNotificationsRead} />}
            {!mobile && <button onClick={()=>setWeatherOpen(true)} style={{display:"flex",alignItems:"center",gap:7,padding:"7px 13px",borderRadius:9,border:`1px solid ${T.border}`,background:T.surface,cursor:"pointer",fontWeight:600,fontSize:13}}>
              {weatherLoading ? "⏳" : weather[0] ? <>{weather[0].icon} {weather[0].high}°</> : "🌤️"} <span style={{color:T.textLight,fontSize:11}}>{city}</span>
            </button>}
            <button onClick={()=>setModal("event")} style={{...S.btnPrimary,padding:mobile?"10px 12px":"9px 17px"}}>{mobile?"＋":"＋ Händelse"}</button>
          </div>
        </header>

        {myMedPending.length>0&&(
          <div style={{background:T.redSoft,borderBottom:`2px solid ${T.red}44`,padding:"10px 26px",display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:20}}>💊</span>
            <div style={{flex:1}}><b style={{color:T.red}}>Påminnelse!</b> <span style={{fontSize:13}}>Du har {myMedPending.length} medicin att ta.</span></div>
            <button onClick={()=>setTab("health")} style={{...S.btnSm,background:T.red,color:"#fff",border:"none"}}>Visa →</button>
          </div>
        )}


        {mobile && (
          <>
            <div style={{padding:"10px 14px 0"}}>
              <MobileQuickTabs items={NAV} activeTab={tab} onChange={(next)=>{setTab(next); setMobileMenuOpen(false);}} />
            </div>
            {mobileMenuOpen && (
              <Overlay onClose={()=>setMobileMenuOpen(false)}>
                <Box style={{maxWidth:380,padding:"20px 18px 18px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
                    <div>
                      <div style={{fontWeight:800,fontSize:18}}>🏡 {family.name}</div>
                      <div style={{fontSize:12,color:T.textMuted,marginTop:3}}>{user.avatar} {user.name} · {isParent?"Admin":"Barn"}</div>
                    </div>
                    <IBtn onClick={()=>setMobileMenuOpen(false)}>✕</IBtn>
                  </div>
                  <div style={{display:"grid",gap:8,marginBottom:14}}>
                    {NAV.map(n=>(
                      <button key={n.id} onClick={()=>{setTab(n.id); setMobileMenuOpen(false);}} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"11px 12px",borderRadius:12,border:`1px solid ${tab===n.id?T.accent:T.border}`,background:tab===n.id?T.accentSoft:T.surfaceAlt,color:tab===n.id?T.accent:T.text,fontWeight:800,fontSize:13}}>
                        <span style={{fontSize:18}}>{n.icon}</span><span style={{flex:1,textAlign:"left"}}>{n.label}</span>
                        {n.badge>0&&<span style={{minWidth:20,height:20,borderRadius:999,background:T.red,color:"#fff",display:"inline-flex",alignItems:"center",justifyContent:"center",padding:"0 6px",fontSize:10,fontWeight:800}}>{n.badge}</span>}
                      </button>
                    ))}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(74px,1fr))",gap:8,marginBottom:14}}>
                    {users.map(u=>(
                      <button key={u.id} onClick={()=>{setUser(u); setMobileMenuOpen(false);}} style={{background:user.id===u.id?u.color+"22":T.surfaceAlt,border:`1px solid ${user.id===u.id?u.color:T.border}`,borderRadius:12,padding:"10px 6px",display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                        <span style={{fontSize:24}}>{u.avatar}</span>
                        <span style={{fontSize:11,fontWeight:800,color:user.id===u.id?u.color:T.text}}>{u.name}</span>
                      </button>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>{setWeatherOpen(true); setMobileMenuOpen(false);}} style={{...S.btnSec,flex:1}}>🌤️ Väder</button>
                    <button onClick={()=>{setUser(null); setMobileMenuOpen(false);}} style={{...S.btnSec,flex:1}}>← Byt profil</button>
                  </div>
                </Box>
              </Overlay>
            )}
          </>
        )}
        <main style={{flex:1,overflowY:"auto",overflowX:"hidden",padding:mobile?"14px 12px 24px":"22px 26px",width:"100%",maxWidth:"100vw"}}>
          {tab==="dashboard"&&<Dashboard mobile={mobile} user={user} users={users} events={visEvs} weekDates={weekDates} meals={meals} tasks={tasks} meds={meds} shopping={shopping} isParent={isParent} onWeather={()=>setWeatherOpen(true)} setTab={setTab} byId={byId} weather={weather} weatherLoading={weatherLoading} weatherError={weatherError} quickAlerts={quickAlerts} confirmMed={confirmMed} sendReminder={sendReminder} chats={chats} chatMessages={chatMessages} chatReads={chatReads} notify={notify} setTasks={setTasks} openChat={(chatId)=>{ setActiveChatId(chatId); setTab("chat"); }}/>}
          {tab==="calendar"&&<CalendarTab mobile={mobile} user={user} users={users} efd={efd} weekDates={weekDates} weekOff={weekOff} setWeekOff={setWeekOff} isParent={isParent} onAdd={()=>setModal("event")} onRecurring={()=>setModal("recurring")} byId={byId} setEvents={setEvents} notify={notify} weather={weather}/>}
          {tab==="meals"&&<MealsTab meals={meals} setMeals={setMeals} isParent={isParent} notify={notify}/>}
          {tab==="shopping"&&<ShoppingTab mobile={mobile} shopping={shopping} setShopping={setShopping} shopForm={shopForm} setShopForm={setShopForm} addItem={()=>{ if(!shopForm.item)return; setShopping(p=>[...p,{...shopForm,id:Date.now(),done:false}]); setShopForm({item:"",qty:"",category:"Övrigt"}); notify("🛒 Tillagd!"); }} isParent={isParent} notify={notify}/>}
          {tab==="health"&&<HealthTab mobile={mobile} meds={meds} setMeds={setMeds} users={users} isParent={isParent} user={user} medForm={medForm} setMedForm={setMedForm} addMed={()=>{ if(!medForm.name)return; const normalizedTimes = normalizeMedTimes(medForm.times); if(!normalizedTimes.length){ notify("⚠️ Lägg in minst en tid."); return; } setMeds(p=>[...p,{...medForm,id:Date.now(),times:normalizedTimes,active:true,confirms:{}}]); setMedForm({name:"",dose:"",times:"08:00",assignedTo:3,recurring:true,scheduleType:"daily",startDate:todayStr,endDate:""}); notify("💊 Medicin tillagd!"); }} notify={notify} sendReminder={sendReminder} confirmMed={confirmMed}/>}
          {tab==="tasks"&&<TasksTab tasks={tasks} setTasks={setTasks} users={users} isParent={isParent} user={user} notify={notify} onAdd={()=>setModal("task")}/>}
          {tab==="chat"&&<ChatTab mobile={mobile} user={user} users={users} isParent={isParent} chats={chats} chatMessages={chatMessages} chatReads={chatReads} onCreateChat={createChat} onSendMessage={sendChatMessage} onReadChat={markChatRead} initialChatId={activeChatId} onConsumeInitialChat={()=>setActiveChatId(null)}/>}
          {tab==="messages"&&isParent&&<MessagesTab mobile={mobile} wishes={wishes} quickAlerts={quickAlerts} users={users} setWishes={setWishes} setQuickAlerts={setQuickAlerts} onSms={()=>setModal("sms")}/>}
          {tab==="admin"&&isParent&&<AdminTab mobile={mobile} family={family} setFamily={setFamily} users={users} setUsers={setUsers} events={events} setEvents={setEvents} onAddUser={()=>setModal("user")} onSms={()=>setModal("sms")} notify={notify} onEditUser={u=>{setEditUserData({...u});setModal("editUser");}} onDeleteUser={id=>{if(users.length<=1)return; const target=users.find(u=>u.id===id); const adminCount=users.filter(isAdminUser).length; if(target?.role==="parent"&&adminCount<=1){ notify("⚠️ Minst en admin måste finnas kvar."); return; } setUsers(p=>p.filter(u=>u.id!==id)); notify("🗑️ Familjemedlem borttagen");}} onResetDemo={()=>{ setFamily(INITIAL_FAMILY); setUsers(INITIAL_USERS); setEvents(INITIAL_EVENTS); setMeals(MEAL_INIT); setShopping(SHOP_INIT); setMeds(MEDS_INIT); setWishes(WISHES_INIT); setTasks(TASKS_INIT); setQuickAlerts(QUICK_INIT); setChats(CHAT_INIT); setChatMessages(CHAT_MESSAGES_INIT); setChatReads(CHAT_READS_INIT); setSeenNotifications([]); setNotificationsOpen(false); setActiveChatId(null); setUser(null); setTab("dashboard"); Object.values(STORAGE_KEYS).forEach(k=>window.localStorage.removeItem(k)); notify("♻️ Demo-data återställd"); }}/>}
          {tab==="wishes"&&!isParent&&<WishesTab mobile={mobile} user={user} wishes={wishes} onAdd={()=>setModal("wish")}/>}
          {tab==="quick"&&!isParent&&<QuickTab mobile={mobile} user={user} onSend={sendQuickAction}/>}
        </main>
      </div>

      {mobile && <MobileBottomNav items={NAV} activeTab={tab} onChange={(next)=>setTab(next)} />}

      {/* WEATHER MODAL */}
      {weatherOpen&&(
        <Overlay onClose={()=>setWeatherOpen(false)}>
          <Box style={{maxWidth:520}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:mobile?"stretch":"center",flexDirection:mobile?"column":"row",gap:mobile?10:0,marginBottom:20}}>
              <div><h2 style={{margin:0,fontSize:18,fontWeight:800}}>🌤️ Väderprognos</h2><p style={{margin:"3px 0 0",fontSize:12,color:T.textMuted}}>Open-Meteo · uppdateras live</p></div>
              <div style={{display:"flex",gap:8,alignItems:"center",width:mobile?"100%":"auto"}}>
                <input value={city} onChange={e=>setCity(e.target.value)} style={{...S.input,width:mobile?"100%":120,padding:"6px 10px",fontSize:13}} placeholder="Stad..."/>
                <IBtn onClick={()=>setWeatherOpen(false)}>✕</IBtn>
              </div>
            </div>

            {weatherLoading&&<div style={{textAlign:"center",padding:40,color:T.textMuted,fontSize:14}}>⏳ Hämtar väder för {city}...</div>}
            {!weatherLoading&&weatherError&&<div style={{textAlign:"center",padding:30,color:T.red,fontWeight:600,fontSize:13}}>{weatherError}</div>}

            {!weatherLoading&&!weatherError&&weather.length>0&&(()=>{
              const [today0,...rest]=weather;
              return (
                <>
                  {/* TODAY — big hero card */}
                  <div style={{background:`linear-gradient(135deg,${T.accentSoft},${T.blueSoft})`,border:`1px solid ${T.accent}33`,borderRadius:16,padding:"22px 24px",marginBottom:14}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div>
                        <div style={{fontSize:11,fontWeight:800,color:T.accent,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Idag · {today0.day}</div>
                        <div style={{fontSize:56,lineHeight:1}}>{today0.icon}</div>
                        <div style={{fontSize:13,color:T.textMuted,marginTop:6}}>{today0.desc}</div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:52,fontWeight:800,color:T.text,lineHeight:1}}>{today0.high}°</div>
                        <div style={{fontSize:16,color:T.textLight,marginTop:2}}>/ {today0.low}°</div>
                        <div style={{fontSize:12,color:T.textMuted,marginTop:8}}>💨 {today0.wind} m/s &nbsp;·&nbsp; 🌧️ {today0.precip} mm</div>
                      </div>
                    </div>
                    <div style={{marginTop:14,padding:"10px 14px",background:"rgba(255,255,255,0.6)",borderRadius:10,fontSize:13,fontWeight:600,color:T.text}}>
                      👗 {today0.advice}
                    </div>
                  </div>

                  {/* NEXT 3 DAYS */}
                  <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"repeat(3,1fr)",gap:8,marginBottom:14}}>
                    {rest.slice(0,3).map((w,i)=>(
                      <div key={i} style={{background:T.surfaceAlt,border:`1px solid ${T.border}`,borderRadius:12,padding:"14px 10px",textAlign:"center"}}>
                        <div style={{fontSize:11,fontWeight:700,color:T.textMuted,marginBottom:4}}>{w.day}</div>
                        <div style={{fontSize:30,marginBottom:4}}>{w.icon}</div>
                        <div style={{fontWeight:800,fontSize:16}}>{w.high}°<span style={{fontSize:11,color:T.textLight,fontWeight:400}}>/{w.low}°</span></div>
                        <div style={{fontSize:10,color:T.textMuted,marginTop:3}}>{w.desc}</div>
                        <div style={{fontSize:10,marginTop:5,color:w.outdoor?T.green:T.red,fontWeight:700}}>{w.outdoor?"✅ Bra ute":"🌂 Ta det lugnt"}</div>
                      </div>
                    ))}
                  </div>

                  {/* REMAINING DAYS compact */}
                  {rest.slice(3).map((w,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",borderRadius:9,background:i%2===0?T.surfaceAlt:"transparent",marginBottom:2}}>
                      <span style={{fontSize:22,width:30,textAlign:"center"}}>{w.icon}</span>
                      <div style={{width:60,fontWeight:700,fontSize:13}}>{w.day}</div>
                      <div style={{flex:1,fontSize:12,color:T.textMuted}}>{w.desc}</div>
                      <div style={{fontSize:11,color:T.textMuted}}>💨 {w.wind} m/s</div>
                      <div style={{fontWeight:800,fontSize:14}}>{w.high}°<span style={{fontSize:11,color:T.textLight}}>/{w.low}°</span></div>
                    </div>
                  ))}
                </>
              );
            })()}
          </Box>
        </Overlay>
      )}

      {/* ADD EVENT */}
      {modal==="event"&&(
        <Overlay onClose={close}>
          <Box title="➕ Lägg till händelse" onClose={close}>
            <FI label="Titel" value={newEv.title} set={v=>setNewEv({...newEv,title:v})}/>
            <Row2><FI label="Datum" type="date" value={newEv.date} set={v=>setNewEv({...newEv,date:v})}/><div/></Row2>
            <Row2><FI label="Starttid" type="time" value={newEv.time} set={v=>setNewEv({...newEv,time:v})}/><FI label="Sluttid (valfri)" type="time" value={newEv.timeTo} set={v=>setNewEv({...newEv,timeTo:v})}/></Row2>
            <FS label="Typ" value={newEv.type} set={v=>setNewEv({...newEv,type:v})} opts={Object.entries(ET).map(([k,v])=>({v:k,l:`${v.icon} ${v.label}`}))}/>
            {isParent ? <Assigned users={users} sel={newEv.assignedTo} toggle={id=>setNewEv(p=>({...p,assignedTo:p.assignedTo.includes(id)?p.assignedTo.filter(x=>x!==id):[...p.assignedTo,id]}))}/> : <SelfOnlyAssigned user={user} />}
            <FI label="Notering" value={newEv.note} set={v=>setNewEv({...newEv,note:v})}/>
            <div style={{display:"flex",gap:8}}>
              <button style={S.btnPrimary} onClick={saveEvent}>Spara</button>
              {isParent&&<button style={{...S.btnPrimary,background:T.purpleSoft,color:T.purple}} onClick={()=>{close();setModal("recurring");}}>🔁 Återkommande</button>}
            </div>
          </Box>
        </Overlay>
      )}

      {/* RECURRING */}
      {modal==="recurring"&&isParent&&(
        <Overlay onClose={close}>
          <Box title="🔁 Återkommande aktivitet" onClose={close}>
            <FI label="Titel" value={rec.title} set={v=>setRec({...rec,title:v})}/>
            <Row2><FI label="Från" type="date" value={rec.startDate} set={v=>setRec({...rec,startDate:v})}/><FI label="Till" type="date" value={rec.endDate} set={v=>setRec({...rec,endDate:v})}/></Row2>
            <Row2><FI label="Starttid" type="time" value={rec.time} set={v=>setRec({...rec,time:v})}/><FI label="Sluttid (valfri)" type="time" value={rec.timeTo} set={v=>setRec({...rec,timeTo:v})}/></Row2>
            <FS label="Typ" value={rec.type} set={v=>setRec({...rec,type:v})} opts={Object.entries(ET).map(([k,v])=>({v:k,l:`${v.icon} ${v.label}`}))}/>
            <div style={{marginBottom:14}}>
              <label style={S.lbl}>Dagar</label>
              <div style={{display:"flex",gap:5}}>{WD.map((d,i)=>(
                <button key={i} onClick={()=>setRec(p=>({...p,days:p.days.includes(i)?p.days.filter(x=>x!==i):[...p.days,i]}))} style={{width:38,height:38,borderRadius:7,border:`1.5px solid ${rec.days.includes(i)?T.accent:T.border}`,background:rec.days.includes(i)?T.accentSoft:"transparent",color:rec.days.includes(i)?T.accent:T.textMuted,fontWeight:700,cursor:"pointer",fontSize:11}}>{d}</button>
              ))}</div>
            </div>
            <Assigned users={users} sel={rec.assignedTo} toggle={id=>setRec(p=>({...p,assignedTo:p.assignedTo.includes(id)?p.assignedTo.filter(x=>x!==id):[...p.assignedTo,id]}))}/>
            <button style={S.btnPrimary} onClick={saveRecurring}>Skapa aktiviteter</button>
          </Box>
        </Overlay>
      )}

      {/* EDIT USER */}
      {modal==="editUser"&&isParent&&editUserData&&(
        <Overlay onClose={close}>
          <Box title={`✏️ Redigera ${editUserData.name}`} onClose={close}>
            <div style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",borderRadius:12,background:editUserData.color+"12",border:`1.5px solid ${editUserData.color}44`,marginBottom:18}}>
              <div style={{width:52,height:52,borderRadius:"50%",background:editUserData.color+"22",border:`2px solid ${editUserData.color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>{editUserData.avatar}</div>
              <div><div style={{fontWeight:800,fontSize:16}}>{editUserData.name}</div><div style={{fontSize:12,color:T.textMuted}}>{editUserData.role==="parent"?"🛡️ Admin":"👶 Barn"}</div></div>
            </div>
            <FI label="Namn" value={editUserData.name} set={v=>setEditUserData(p=>({...p,name:v}))}/>
            <FS label="Roll" value={editUserData.role} set={v=>setEditUserData(p=>({...p,role:v}))} opts={[{v:"child",l:"👶 Barn"},{v:"parent",l:"🛡️ Admin (vuxen)"}]}/>
            <FI label="Avatar (emoji)" value={editUserData.avatar} set={v=>setEditUserData(p=>({...p,avatar:v}))} placeholder="👤"/>
            <FI label="Födelsedag" type="date" value={editUserData.birthdate||""} set={v=>setEditUserData(p=>({...p,birthdate:v}))}/>
            <FI label="Telefon" value={editUserData.phone||""} set={v=>setEditUserData(p=>({...p,phone:v}))}/>
            <div style={{marginBottom:18}}>
              <label style={S.lbl}>PIN-kod (4 siffror, lämna tomt = ingen PIN)</label>
              <div style={{display:"flex",alignItems:mobile?"stretch":"center",flexDirection:mobile?"column":"row",gap:10}}>
                <input type="password" maxLength={4} inputMode="numeric" pattern="[0-9]*" value={editUserData.pin||""} onChange={e=>setEditUserData(p=>({...p,pin:e.target.value.replace(/\D/g,"").slice(0,4)}))} style={{...S.input,width:120,letterSpacing:6,fontSize:18,textAlign:"center"}} placeholder="––––"/>
                {editUserData.pin?<span style={{fontSize:12,color:T.green,fontWeight:700}}>🔒 PIN aktiv</span>:<span style={{fontSize:12,color:T.textLight}}>Ingen PIN</span>}
              </div>
            </div>
            <div style={{marginBottom:18}}>
              <label style={S.lbl}>Färg</label>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <input type="color" value={editUserData.color} onChange={e=>setEditUserData(p=>({...p,color:e.target.value}))} style={{height:42,width:80,borderRadius:8,border:`1px solid ${T.border}`,cursor:"pointer",padding:2}}/>
                <div style={{width:42,height:42,borderRadius:"50%",background:editUserData.color+"22",border:`2px solid ${editUserData.color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{editUserData.avatar}</div>
                <span style={{fontSize:12,color:T.textMuted}}>Förhandsgranskning</span>
              </div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button style={S.btnPrimary} onClick={()=>{
                if(!editUserData.name)return;
                const adminCount = users.filter(isAdminUser).length;
                const current = users.find(u=>u.id===editUserData.id);
                if(current?.role==="parent" && editUserData.role!=="parent" && adminCount<=1){
                  notify("⚠️ Minst en admin måste finnas kvar.");
                  return;
                }
                setUsers(p=>p.map(u=>u.id===editUserData.id?{...editUserData}:u));
                if(user.id===editUserData.id) setUser({...editUserData});
                close(); setEditUserData(null); notify(`✅ ${editUserData.name} uppdaterad!`);
              }}>Spara ändringar</button>
              <button style={S.btnSec} onClick={()=>{close();setEditUserData(null);}}>Avbryt</button>
            </div>
          </Box>
        </Overlay>
      )}

      {/* ADD USER */}
      {modal==="user"&&isParent&&(
        <Overlay onClose={close}>
          <Box title="➕ Ny familjemedlem" onClose={close}>
            <FI label="Namn" value={newUser.name} set={v=>setNewUser({...newUser,name:v})}/>
            <FS label="Roll" value={newUser.role} set={v=>setNewUser({...newUser,role:v})} opts={[{v:"child",l:"👶 Barn"},{v:"parent",l:"🛡️ Admin (vuxen)"}]}/>
            <FI label="Avatar (emoji)" value={newUser.avatar} set={v=>setNewUser({...newUser,avatar:v})}/>
            <FI label="Födelsedag" type="date" value={newUser.birthdate} set={v=>setNewUser({...newUser,birthdate:v})}/>
            <FI label="Telefon" value={newUser.phone} set={v=>setNewUser({...newUser,phone:v})}/>
            <div style={{marginBottom:14}}>
              <label style={S.lbl}>PIN-kod (4 siffror, valfri)</label>
              <input type="password" maxLength={4} inputMode="numeric" pattern="[0-9]*" value={newUser.pin} onChange={e=>setNewUser({...newUser,pin:e.target.value.replace(/\D/g,"").slice(0,4)})} style={{...S.input,width:120,letterSpacing:6,fontSize:18,textAlign:"center"}} placeholder="––––"/>
            </div>
            <div style={{marginBottom:14}}><label style={S.lbl}>Färg</label><input type="color" value={newUser.color} onChange={e=>setNewUser({...newUser,color:e.target.value})} style={{height:40,width:70,borderRadius:7,border:`1px solid ${T.border}`,cursor:"pointer"}}/></div>
            <button style={S.btnPrimary} onClick={()=>{ if(!newUser.name)return; setUsers(p=>[...p,{...newUser,id:Date.now()}]); close(); setNewUser({name:"",role:"child",color:"#E07A44",avatar:"👤",birthdate:"",phone:"",pin:""}); notify(`👨‍👩‍👧‍👦 ${newUser.name} tillagd!`); }}>Lägg till</button>
          </Box>
        </Overlay>
      )}

      {/* SMS */}
      {modal==="sms"&&isParent&&(
        <Overlay onClose={close}>
          <Box title="📱 Skicka SMS" onClose={close}>
            <Assigned users={users} sel={smsRec} toggle={id=>setSmsRec(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id])} label="Mottagare"/>
            <div style={{marginBottom:14}}><label style={S.lbl}>Meddelande</label><textarea value={smsMsg} onChange={e=>setSmsMsg(e.target.value)} rows={4} style={{...S.input,resize:"vertical"}} placeholder="Skriv meddelande..."/></div>
            <button style={S.btnPrimary} onClick={()=>{ const n=smsRec.map(id=>users.find(u=>u.id===id)?.name).join(", "); notify(`📱 SMS skickat till: ${n}`); close(); setSmsMsg(""); setSmsRec([]); }}>Skicka SMS</button>
          </Box>
        </Overlay>
      )}

      {/* WISH */}
      {modal==="wish"&&(
        <Overlay onClose={close}>
          <Box title="🍕 Matönskemål" onClose={close}>
            <FI label="Vad vill du äta?" value={newWish} set={setNewWish} placeholder="T.ex. Tacos med extra ost!"/>
            <button style={S.btnPrimary} onClick={()=>{ if(!newWish.trim())return; setWishes(p=>[...p,{id:Date.now(),wish:newWish,from:user.id,date:todayStr,read:false}]); setNewWish(""); close(); notify("🍕 Önskemål skickat!"); }}>Skicka</button>
          </Box>
        </Overlay>
      )}

      {/* TASK */}
      {modal==="task"&&isParent&&(
        <Overlay onClose={close}>
          <Box title="🎯 Nytt uppdrag" onClose={close}>
            <FI label="Uppgift" value={taskForm.title} set={v=>setTaskForm({...taskForm,title:v})}/>
            <FS label="Tilldela" value={taskForm.assignedTo} set={v=>setTaskForm({...taskForm,assignedTo:Number(v)})} opts={users.map(u=>({v:u.id,l:`${u.avatar} ${u.name}`}))}/>
            <Row2><FI label="Poäng" type="number" value={taskForm.points} set={v=>setTaskForm({...taskForm,points:Number(v)})}/><FI label="Deadline" type="date" value={taskForm.dueDate} set={v=>setTaskForm({...taskForm,dueDate:v})}/></Row2>
            <button style={S.btnPrimary} onClick={()=>{ if(!taskForm.title)return; setTasks(p=>[...p,{...taskForm,id:Date.now(),done:false}]); close(); setTaskForm({title:"",assignedTo:3,points:5,dueDate:fmt(addDays(today,1))}); notify("🎯 Uppdrag skapat!"); }}>Skapa</button>
          </Box>
        </Overlay>
      )}
    </div>
  );
}

// ─── LOGIN ───────────────────────────────────────────────────────────────────

function NotificationCenter({ notifications, seenNotifications, onClickItem, onClose, onMarkAllRead }) {
  return (
    <div style={{position:"absolute",top:52,right:0,width:380,maxWidth:"calc(100vw - 40px)",background:T.surface,border:`1px solid ${T.border}`,borderRadius:16,boxShadow:T.shadowMd,zIndex:50,overflow:"hidden"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px",borderBottom:`1px solid ${T.border}`}}>
        <div>
          <div style={{fontWeight:800,fontSize:15}}>🔔 Notiser</div>
          <div style={{fontSize:11,color:T.textMuted,marginTop:2}}>Familjens puls just nu</div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {notifications.length>0 && <button onClick={onMarkAllRead} style={{...S.btnSm,fontSize:11}}>Markera alla</button>}
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:T.textLight,fontSize:18,lineHeight:1}}>×</button>
        </div>
      </div>
      <div style={{maxHeight:440,overflowY:"auto",padding:12}}>
        {notifications.length===0 ? (
          <div style={{padding:"18px 8px",textAlign:"center",color:T.textMuted,fontSize:13}}>Lugnt just nu. Inga nya notiser.</div>
        ) : notifications.map(item => {
          const unseen = item.unread && !seenNotifications.includes(item.id);
          return (
            <button key={item.id} onClick={()=>onClickItem(item)} style={{width:"100%",textAlign:"left",background:unseen?T.accentSoft:T.surfaceAlt,border:`1px solid ${unseen?T.accent+"33":T.border}`,borderRadius:12,padding:"11px 12px",marginBottom:8,cursor:"pointer"}}>
              <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"start"}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:800,fontSize:13,display:"flex",alignItems:"center",gap:8}}>
                    <span style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.title}</span>
                    {unseen && <span style={{width:8,height:8,borderRadius:"50%",background:T.red,flexShrink:0}} />}
                  </div>
                  <div style={{fontSize:12,color:T.textMuted,marginTop:4,lineHeight:1.35}}>{item.subtitle}</div>
                </div>
                <div style={{fontSize:10,color:T.textLight,flexShrink:0}}>{new Date(item.createdAt || Date.now()).toLocaleTimeString("sv-SE",{hour:"2-digit",minute:"2-digit"})}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}


function LoginScreen({ users, family, onLogin }) {
  const [selected, setSelected] = useState(null);
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);

  const u = selected ? users.find(x => x.id === selected) : null;

  function handleSelect(user) {
    if (!user.pin) { onLogin(user); return; }
    setSelected(user.id); setPin("");
  }

  function handleDigit(d) {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4) {
      if (next === u.pin) { setTimeout(() => onLogin(u), 180); }
      else { setTimeout(() => { setShake(true); setPin(""); setTimeout(() => setShake(false), 500); }, 180); }
    }
  }

  function handleBack() { setPin(p => p.slice(0, -1)); }

  const DIGITS = ["1","2","3","4","5","6","7","8","9","","0","⌫"];

  return (
    <div style={{minHeight:"100vh",background:`linear-gradient(135deg,${T.accentSoft},#fff,${T.blueSoft})`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'Nunito','Segoe UI',sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}`}</style>

      {!selected ? (
        <>
          <div style={{textAlign:"center",marginBottom:36}}>
            <div style={{fontSize:56,marginBottom:10}}>🏡</div>
            <h1 style={{color:T.text,fontSize:32,fontWeight:800,margin:0,letterSpacing:-0.5}}>{family?.name || "FamiljeHub"}</h1>
            <p style={{color:T.textMuted,margin:"8px 0 0",fontSize:14}}>Välj din profil för att fortsätta</p>
            <p style={{color:T.textLight,margin:"4px 0 0",fontSize:12}}>Vuxna är admins för hela familjegruppen</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,maxWidth:580,width:"100%",gridTemplateColumns:typeof window!=="undefined" && window.innerWidth < 640 ? "1fr 1fr" : "repeat(auto-fit,minmax(140px,1fr))"}}>
            {users.map(u=>(
              <button key={u.id} onClick={()=>handleSelect(u)} style={{background:T.surface,border:`2px solid ${T.border}`,borderRadius:16,padding:"20px 14px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:9,boxShadow:T.shadow,transition:"all 0.15s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=u.color;e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 8px 24px ${u.color}33`;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow=T.shadow;}}>
                <div style={{width:52,height:52,borderRadius:"50%",background:u.color+"18",border:`2px solid ${u.color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>{u.avatar}</div>
                <div style={{fontWeight:700,fontSize:15,color:T.text}}>{u.name}</div>
                <div style={{fontSize:11,color:u.color,background:u.color+"18",padding:"3px 10px",borderRadius:20,fontWeight:700}}>{u.role==="parent"?"🛡️ Admin":"👶 Barn"}</div>
                {u.pin&&<div style={{fontSize:10,color:T.textLight}}>🔒 PIN-skyddad</div>}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:0,animation:shake?"shake 0.4s ease":undefined}}>
          <button onClick={()=>setSelected(null)} style={{alignSelf:"flex-start",background:"none",border:"none",color:T.textMuted,cursor:"pointer",fontSize:13,fontWeight:700,marginBottom:24,padding:0}}>← Byt profil</button>
          <div style={{width:72,height:72,borderRadius:"50%",background:u.color+"22",border:`3px solid ${u.color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:34,marginBottom:12}}>{u.avatar}</div>
          <div style={{fontWeight:800,fontSize:20,marginBottom:4}}>{u.name}</div>
          <div style={{fontSize:13,color:T.textMuted,marginBottom:28}}>Ange din PIN-kod</div>

          {/* PIN dots */}
          <div style={{display:"flex",gap:14,marginBottom:32}}>
            {[0,1,2,3].map(i=>(
              <div key={i} style={{width:18,height:18,borderRadius:"50%",background:pin.length>i?u.color:T.border,transition:"background 0.15s",border:`2px solid ${pin.length>i?u.color:T.border}`}}/>
            ))}
          </div>

          {/* Number pad */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,width:220}}>
            {DIGITS.map((d,i)=>(
              d===""
                ? <div key={i}/>
                : <button key={i} onClick={()=>d==="⌫"?handleBack():handleDigit(d)}
                    style={{height:62,borderRadius:14,border:`1.5px solid ${T.border}`,background:T.surface,fontSize:d==="⌫"?22:24,fontWeight:700,cursor:"pointer",color:d==="⌫"?T.textMuted:T.text,boxShadow:T.shadow,transition:"all 0.1s"}}
                    onMouseDown={e=>e.currentTarget.style.transform="scale(0.93)"}
                    onMouseUp={e=>e.currentTarget.style.transform="none"}
                    onMouseLeave={e=>e.currentTarget.style.transform="none"}>
                    {d}
                  </button>
            ))}
          </div>
          {shake&&<div style={{marginTop:18,color:T.red,fontWeight:700,fontSize:13}}>Fel PIN-kod, försök igen</div>}
        </div>
      )}
    </div>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
function Dashboard({ mobile, user, users, events, weekDates, meals, tasks, meds, shopping, isParent, onWeather, setTab, byId, weather, weatherLoading, weatherError, quickAlerts, confirmMed, sendReminder, chats, chatMessages, chatReads, notify, setTasks, openChat }) {
  const todayEvs=events.filter(e=>e.date===todayStr).sort((a,b)=>a.time.localeCompare(b.time));
  const dayIdx=(today.getDay()+6)%7;
  const todayMeal=meals[WDF[dayIdx]]||"Ej planerat";
  const myTasks=isParent?tasks:tasks.filter(t=>t.assignedTo===user.id);
  const pts=myTasks.filter(t=>t.done).reduce((s,t)=>s+t.points,0);
  const weekItems = weekDates
    .flatMap(date => events.filter(e=>e.date===fmt(date)).map(e=>({ ...e, _date: date })))
    .sort((a,b)=>`${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
    .slice(0,8);
  const unreadQuick = quickAlerts.filter(a=>!a.read).length;
  const openShopping = shopping.filter(i=>!i.done).slice(0,5);
  const relevantMeds = isParent ? meds.filter(m=>isMedDueToday(m)) : meds.filter(m=>isMedDueToday(m) && m.assignedTo===user.id);
  const pendingMeds = isParent
    ? relevantMeds.filter(m=>{
        const assignee = users.find(u=>u.id===m.assignedTo);
        return assignee && getMedStatus(m, assignee.id) !== "done";
      })
    : relevantMeds.filter(m=>getMedStatus(m, user.id) === "pending");
  const homeTasks = isParent ? tasks.filter(t=>!t.done).slice(0,4) : myTasks.filter(t=>!t.done).slice(0,4);
  const visibleChats = chats.filter(c => canUserSeeChat(c, user, users))
    .map(chat => {
      const messages = chatMessages.filter(m => m.chatId === chat.id).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
      const lastMessage = messages[messages.length - 1] || null;
      const lastRead = chatReads?.[chat.id]?.[user.id] || "";
      const unreadCount = messages.filter(m => m.senderId !== user.id && (!lastRead || m.createdAt > lastRead)).length;
      return { ...chat, messages, lastMessage, unreadCount };
    })
    .filter(chat => chat.lastMessage)
    .sort((a,b) => {
      const aUnread = a.unreadCount > 0 ? 1 : 0;
      const bUnread = b.unreadCount > 0 ? 1 : 0;
      if (aUnread !== bUnread) return bUnread - aUnread;
      return new Date(b.lastMessage?.createdAt || 0) - new Date(a.lastMessage?.createdAt || 0);
    });
  const participantChats = visibleChats.filter(chat => chat.memberIds.includes(user.id));
  const homeChats = participantChats;
  const unreadChats = participantChats.filter(c=>c.unreadCount>0);
  function toggleTaskFromHome(taskId) {
    const task = tasks.find(t=>t.id===taskId);
    if (!task) return;
    setTasks(prev => prev.map(t => t.id===taskId ? { ...t, done: !t.done, completedAt: !t.done ? new Date().toISOString() : "", completedBy: !t.done ? user.id : null } : t));
    if (!task.done) notify(`🎯 ${task.title} markerat som klart!`);
    else notify(`↩️ ${task.title} öppnades igen.`);
  }
  function chatTitle(chat) {
    if (!chat) return "Chatt";
    if (chat.type === "group") return chat.name || "Gruppchatt";
    const otherId = chat.memberIds.find(id => id !== user.id);
    const other = byId(otherId);
    return other ? `${other.avatar} ${other.name}` : "Direktchatt";
  }

  return (
    <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"repeat(auto-fill,minmax(260px,1fr))",gap:16}}>
      <Card style={{gridColumn:"1/-1",background:`linear-gradient(120deg,${user.color}18,${T.surface})`,border:`1px solid ${user.color}33`}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:56,height:56,borderRadius:"50%",background:user.color+"22",border:`3px solid ${user.color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>{user.avatar}</div>
          <div style={{flex:1}}>
            <h2 style={{margin:0,fontSize:20,fontWeight:800}}>Hej, {user.name}! 👋</h2>
            <p style={{margin:"3px 0 0",color:T.textMuted,fontSize:13}}>{today.toLocaleDateString("sv-SE",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
            {isParent&&<div style={{marginTop:8,fontSize:12,color:T.blue,fontWeight:700}}>Du är admin för familjegruppen och kommer senare kunna se alla chattar och barns senast delade plats.</div>}
          </div>
          {!isParent&&<div style={{textAlign:"right"}}><div style={{fontSize:28,fontWeight:800,color:T.accent}}>{pts}⭐</div><div style={{fontSize:11,color:T.textMuted}}>Poäng</div></div>}
        </div>
      </Card>

      <Card onClick={onWeather} style={{cursor:"pointer"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
          <CT>🌤️ Väder</CT><span style={{fontSize:11,color:T.accent,fontWeight:700}}>Öppna →</span>
        </div>
        {weatherLoading && <div style={{color:T.textMuted,fontSize:13}}>⏳ Hämtar väder...</div>}
        {!weatherLoading && weatherError && <div style={{color:T.red,fontSize:12,fontWeight:600}}>{weatherError}</div>}
        {!weatherLoading && !weatherError && weather.length > 0 && <>
          <div style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:2}}>
            {weather.slice(0,5).map((w,i)=>(
              <div key={i} style={{textAlign:"center",background:i===0?T.accentSoft:T.surfaceAlt,borderRadius:9,padding:"9px 9px",minWidth:52,flex:"0 0 auto"}}>
                <div style={{fontSize:18}}>{w.icon}</div>
                <div style={{fontSize:10,color:T.textMuted,marginTop:1}}>{w.day}</div>
                <div style={{fontWeight:800,fontSize:13}}>{w.high}°</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:9,fontSize:12,color:T.textMuted}}>👗 {weather[0].advice}</div>
        </>}
      </Card>

      <Card onClick={()=>setTab("calendar")} style={{cursor:"pointer"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <CT>📅 Idag</CT><span style={{fontSize:11,color:T.accent,fontWeight:700}}>Kalender →</span>
        </div>
        {todayEvs.length===0?<p style={{color:T.textLight,fontSize:13}}>Ingen planering idag 🎉</p>:todayEvs.map(e=>{const et=ET[e.type];return(
          <div key={e.id} style={{display:"flex",gap:9,alignItems:"center",padding:"7px 9px",borderRadius:7,background:et?.soft,marginBottom:5}}>
            <span style={{fontSize:16}}>{et?.icon}</span>
            <div><div style={{fontWeight:700,fontSize:12}}>{e.title}</div><div style={{fontSize:11,color:T.textMuted}}>{e.time}{e.timeTo?` – ${e.timeTo}`:""}</div></div>
          </div>
        );})}
      </Card>

      <Card onClick={()=>setTab("meals")} style={{cursor:"pointer"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <CT>🍽️ Middag idag</CT><span style={{fontSize:11,color:T.accent,fontWeight:700}}>Matsedel →</span>
        </div>
        <div style={{fontSize:20,fontWeight:800,marginBottom:4}}>{todayMeal}</div>
        <div style={{fontSize:12,color:T.textMuted}}>{WDF[dayIdx]}</div>
        <div style={{marginTop:10,fontSize:12,color:T.textMuted}}>Tryck för att se hela veckans plan.</div>
      </Card>

      <Card onClick={()=>setTab("shopping")} style={{cursor:"pointer"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <CT>🛒 Inköpslistan</CT><span style={{fontSize:11,color:T.accent,fontWeight:700}}>Öppna →</span>
        </div>
        {openShopping.length===0 ? <p style={{color:T.textLight,fontSize:13}}>Inget saknas just nu. Ett sällsynt mirakel.</p> : (
          <div style={{display:"grid",gap:7}}>
            {openShopping.map(item=>(
              <div key={item.id} style={{display:"flex",justifyContent:"space-between",gap:10,background:T.surfaceAlt,borderRadius:9,padding:"8px 10px"}}>
                <div style={{fontWeight:700,fontSize:12}}>{item.item}</div>
                <div style={{fontSize:11,color:T.textMuted}}>{item.qty || item.category}</div>
              </div>
            ))}
          </div>
        )}
        <div style={{marginTop:10,fontSize:12,color:T.textMuted}}>{shopping.filter(i=>!i.done).length} sak{shopping.filter(i=>!i.done).length!==1?"er":""} kvar att handla</div>
      </Card>

      <Card onClick={()=>setTab("health")} style={{cursor:"pointer"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <CT>💊 Mediciner</CT><span style={{fontSize:11,color:T.accent,fontWeight:700}}>Hälsa →</span>
        </div>
        {relevantMeds.length===0 ? <p style={{color:T.textLight,fontSize:13}}>Inga aktiva mediciner just nu.</p> : (
          <div style={{display:"grid",gap:8}}>
            {relevantMeds.slice(0,3).map(m=>{
              const assigned = byId(m.assignedTo);
              const status = getMedStatus(m, m.assignedTo);
              return (
                <div key={m.id} style={{background:T.surfaceAlt,border:`1px solid ${T.border}`,borderRadius:10,padding:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",gap:10}}>
                    <div>
                      <div style={{fontWeight:800,fontSize:13}}>💊 {m.name}</div>
                      <div style={{fontSize:11,color:T.textMuted}}>{m.dose} · {medScheduleLabel(m)}</div>
                      {assigned && isParent && <div style={{marginTop:4,fontSize:11,color:assigned.color,fontWeight:700}}>{assigned.avatar} {assigned.name}</div>}
                    </div>
                    {m.assignedTo === user.id && status !== "done" && (
                      <button
                        onClick={(e)=>{e.stopPropagation(); confirmMed(m.id, user.id);}}
                        style={{...S.btnSm,background:T.greenSoft,color:T.green,border:`1px solid ${T.green}33`,fontWeight:800}}
                      >
                        ✅ Gjort
                      </button>
                    )}
                    {m.assignedTo === user.id && status === "done" && <span style={{fontSize:11,background:T.greenSoft,color:T.green,padding:"3px 8px",borderRadius:20,fontWeight:800}}>✅ Klar</span>}
                    {isParent && m.assignedTo !== user.id && status === "done" && (
                      <span style={{fontSize:11,background:T.greenSoft,color:T.green,padding:"3px 8px",borderRadius:20,fontWeight:800}}>
                        ✅ Bekräftad
                      </span>
                    )}
                    {isParent && m.assignedTo !== user.id && status !== "done" && (
                      <button
                        onClick={(e)=>{e.stopPropagation(); sendReminder(m.id, m.assignedTo);}}
                        style={{...S.btnSm,background:T.yellowSoft,color:T.yellow,border:`1px solid ${T.yellow}33`,fontWeight:700}}
                      >
                        🔔 Påminn
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div style={{marginTop:10,fontSize:12,color:T.textMuted}}>
          {isParent ? `${pendingMeds.length} väntar på bekräftelse${relevantMeds.some(m=>getMedStatus(m, m.assignedTo)==="done") ? " · gröna bockar betyder bekräftat" : ""}` : pendingMeds.length ? "Du har medicin att bocka av." : "Allt avklarat just nu."}
        </div>
      </Card>

      <Card onClick={()=>setTab("tasks")} style={{cursor:"pointer"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <CT>🎯 Uppdrag</CT><span style={{fontSize:11,color:T.accent,fontWeight:700}}>Öppna →</span>
        </div>
        {isParent?(
          <>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:10}}>
              {users.filter(u=>u.role==="child").map(u=>{const ut=tasks.filter(t=>t.assignedTo===u.id);const p=ut.filter(t=>t.done).reduce((s,t)=>s+t.points,0);return(
                <div key={u.id} style={{background:T.surfaceAlt,borderRadius:9,padding:9,textAlign:"center"}}>
                  <div style={{fontSize:20}}>{u.avatar}</div>
                  <div style={{fontWeight:700,fontSize:12,marginTop:3}}>{u.name}</div>
                  <div style={{color:T.accent,fontWeight:800,fontSize:15}}>{p}p</div>
                  <div style={{fontSize:10,color:T.textLight}}>{ut.filter(t=>!t.done).length} kvar</div>
                </div>
              );})}
            </div>
            {homeTasks.length>0 && (
              <div style={{display:"grid",gap:7}}>
                {homeTasks.map(t=>{ const assignee=byId(t.assignedTo); return (
                  <div key={t.id} onClick={(e)=>e.stopPropagation()} style={{display:"flex",alignItems:"center",gap:8,background:T.surfaceAlt,borderRadius:9,padding:"8px 10px",border:`1px solid ${T.border}`}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:12,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.title}</div>
                      <div style={{fontSize:10,color:T.textMuted}}>{assignee ? `${assignee.avatar} ${assignee.name}` : ""} · {t.points}p</div>
                    </div>
                    <button onClick={()=>toggleTaskFromHome(t.id)} style={{...S.btnSm,background:T.greenSoft,color:T.green,border:`1px solid ${T.green}33`,fontWeight:800}}>✅ Gjort</button>
                  </div>
                );})}
              </div>
            )}
          </>
        ):(
          <>
            <div style={{fontSize:26,fontWeight:800,color:T.accent}}>{pts} ⭐</div>
            <div style={{fontSize:12,color:T.textMuted,marginTop:3}}>{myTasks.filter(t=>!t.done).length} uppdrag kvar</div>
            <div style={{height:6,background:T.border,borderRadius:3,marginTop:10,overflow:"hidden"}}>
              <div style={{height:"100%",background:T.green,width:`${myTasks.length?((myTasks.filter(t=>t.done).length/myTasks.length)*100):0}%`,borderRadius:3,transition:"width 0.4s"}}/>
            </div>
            {homeTasks.length>0 && (
              <div style={{display:"grid",gap:7,marginTop:10}}>
                {homeTasks.map(t=>(
                  <div key={t.id} onClick={(e)=>e.stopPropagation()} style={{display:"flex",alignItems:"center",gap:8,background:T.surfaceAlt,borderRadius:9,padding:"8px 10px",border:`1px solid ${T.border}`}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:12,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.title}</div>
                      <div style={{fontSize:10,color:T.textMuted}}>Deadline: {t.dueDate} · {t.points}p</div>
                    </div>
                    <button onClick={()=>toggleTaskFromHome(t.id)} style={{...S.btnSm,background:T.greenSoft,color:T.green,border:`1px solid ${T.green}33`,fontWeight:800}}>✅ Gjort</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Card>

      <Card style={{gridColumn:"1/-1"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <CT>💬 Chattnotiser</CT>
          <button onClick={()=>setTab("chat")} style={S.btnSm}>Öppna chatt →</button>
        </div>
        {homeChats.length===0 ? <p style={{color:T.textLight,fontSize:13}}>Inga chattar ännu.</p> : (
          <div style={{display:"grid",gap:8}}>
            {homeChats.slice(0,4).map(chat=>{
              const sender = byId(chat.lastMessage?.senderId);
              return (
                <button key={chat.id} onClick={()=>openChat(chat.id)} style={{background:chat.unreadCount>0?T.blueSoft:T.surfaceAlt,border:`1px solid ${chat.unreadCount>0?T.blue+"33":T.border}`,borderRadius:10,padding:"10px 12px",display:"flex",alignItems:"center",gap:10,textAlign:"left",cursor:"pointer"}}>
                  <div style={{fontSize:20}}>{chat.type === "group" ? "👨‍👩‍👧‍👦" : "💬"}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{fontWeight:800,fontSize:13,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{chatTitle(chat)}</div>
                      {chat.unreadCount>0 && <span style={{fontSize:10,background:T.red,color:"#fff",padding:"2px 7px",borderRadius:999,fontWeight:800}}>{chat.unreadCount} ny{chat.unreadCount>1?"a":""}</span>}
                    </div>
                    <div style={{fontSize:11,color:T.textMuted,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",marginTop:3}}>
                      {sender ? `${sender.name}: ` : ""}{chat.lastMessage?.text}
                    </div>
                  </div>
                  <div style={{fontSize:11,color:T.textLight,flexShrink:0}}>{new Date(chat.lastMessage?.createdAt || Date.now()).toLocaleTimeString("sv-SE",{hour:"2-digit",minute:"2-digit"})}</div>
                </button>
              );
            })}
          </div>
        )}
        <div style={{marginTop:10,fontSize:12,color:T.textMuted}}>
          {unreadChats.length>0 ? `Du har ${unreadChats.reduce((s,c)=>s+c.unreadCount,0)} oläst${unreadChats.reduce((s,c)=>s+c.unreadCount,0)!==1?"a meddelanden":" meddelande"} i chatten.` : "Inga nya chattmeddelanden just nu."}
        </div>
      </Card>

      <Card style={{gridColumn:"1/-1"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <CT>🗓️ Veckoplanering</CT>
          <button onClick={()=>setTab("calendar")} style={S.btnSm}>Öppna kalender →</button>
        </div>
        {weekItems.length===0 ? <p style={{color:T.textLight,fontSize:13}}>Veckan ser ovanligt tom ut – inget inlagt än.</p> : (
          <div style={{display:"grid",gap:8}}>
            {weekItems.map(item=>{ const et=ET[item.type]; return (
              <div key={item.id} style={{display:"flex",gap:10,alignItems:"center",padding:"9px 10px",borderRadius:10,background:et?.soft || T.surfaceAlt,border:`1px solid ${(et?.color || T.border)}22`}}>
                <div style={{fontSize:18}}>{et?.icon || "📌"}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:13}}>{item.title}</div>
                  <div style={{fontSize:11,color:T.textMuted}}>{item._date.toLocaleDateString("sv-SE",{weekday:"long", day:"numeric", month:"short"})} · {item.time}{item.timeTo?`–${item.timeTo}`:""}</div>
                </div>
                <div style={{display:"flex",gap:4,flexWrap:"wrap",justifyContent:"flex-end"}}>
                  {item.assignedTo.slice(0,2).map(id=>{ const u=byId(id); return u ? <span key={id} style={{fontSize:10,background:u.color+"22",color:u.color,padding:"2px 7px",borderRadius:20,fontWeight:700}}>{u.avatar} {u.name}</span> : null; })}
                </div>
              </div>
            );})}
          </div>
        )}
      </Card>

      {isParent&&unreadQuick>0&&(
        <Card>
          <CT>⚡ Nya snabbåtgärder</CT>
          <div style={{fontSize:28,fontWeight:800,color:T.red}}>{unreadQuick}</div>
          <div style={{fontSize:12,color:T.textMuted,marginTop:4}}>Barnen har skickat snabbnotiser som väntar på att ses.</div>
          <button onClick={()=>setTab("messages")} style={{...S.btnSm,marginTop:10}}>Öppna meddelanden →</button>
        </Card>
      )}

      {isParent&&(
        <Card style={{gridColumn:"1/-1"}}>
          <CT>👨‍👩‍👧‍👦 Familjeöversikt</CT>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:10}}>
            {users.map(u=>{const ue=events.filter(e=>e.date===todayStr&&e.assignedTo.includes(u.id));return(
              <div key={u.id} style={{background:T.surfaceAlt,border:`1px solid ${u.color}33`,borderRadius:10,padding:12,textAlign:"center"}}>
                <div style={{fontSize:26}}>{u.avatar}</div>
                <div style={{fontWeight:700,fontSize:13,marginTop:4}}>{u.name}</div>
                <div style={{fontSize:10,color:T.textMuted,marginTop:2}}>{ue.length} händelse{ue.length!==1?"r":""}</div>
              </div>
            );})}
          </div>
        </Card>
      )}
    </div>
  );
}

function CalendarTab({ mobile, user, users, efd, weekDates, weekOff, setWeekOff, isParent, onAdd, onRecurring, byId, setEvents, notify, weather }) {
  const [sel, setSel] = useState(null);
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <div style={{display:"flex",gap:7}}>
          <button style={S.btnSec} onClick={()=>setWeekOff(p=>p-1)}>←</button>
          <button style={{...S.btnSec,background:weekOff===0?T.accentSoft:T.surface,color:weekOff===0?T.accent:T.text}} onClick={()=>setWeekOff(0)}>Idag</button>
          <button style={S.btnSec} onClick={()=>setWeekOff(p=>p+1)}>→</button>
        </div>
        {isParent&&<div style={{display:"flex",gap:7}}>
          <button style={S.btnPrimary} onClick={onAdd}>＋ Händelse</button>
          <button style={{...S.btnPrimary,background:T.purpleSoft,color:T.purple}} onClick={onRecurring}>🔁 Återkommande</button>
        </div>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"repeat(7,1fr)",gap:6,marginBottom:18}}>
        {weekDates.map((date,i)=>{
          const devs=efd(date); const isToday=isSameDay(date,today); const w=weather[i];
          return (
            <div key={i} onClick={()=>setSel(sel===i?null:i)} style={{background:T.surface,border:`2px solid ${sel===i?T.accent:isToday?T.accent+"55":T.border}`,borderRadius:12,padding:"10px 8px",cursor:"pointer",minHeight:150,boxShadow:sel===i?`0 0 0 3px ${T.accent}1a`:T.shadow,transition:"all 0.15s"}}>
              <div style={{textAlign:"center",marginBottom:5}}>
                <div style={{fontSize:10,color:T.textLight,fontWeight:700,textTransform:"uppercase"}}>{WD[i]}</div>
                <div style={{fontWeight:800,fontSize:18,color:isToday?T.accent:T.text}}>{date.getDate()}</div>
              </div>
              {w&&<div style={{textAlign:"center",marginBottom:6}}><span style={{fontSize:17}}>{w.icon}</span><span style={{fontSize:10,color:T.textMuted,marginLeft:2}}>{w.high}°</span></div>}
              <div style={{display:"flex",flexDirection:"column",gap:2}}>
                {devs.slice(0,3).map(e=>{const et=ET[e.type];return(
                  <div key={e.id} style={{fontSize:9,background:et?.soft,color:et?.color,borderRadius:4,padding:"2px 5px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:700}}>
                    {et?.icon} {e.title}{e.recurring?" 🔁":""}
                  </div>
                );})}
                {devs.length>3&&<div style={{fontSize:9,color:T.textLight,textAlign:"center"}}>+{devs.length-3}</div>}
              </div>
            </div>
          );
        })}
      </div>
      {sel!==null&&(
        <Card>
          <h3 style={{margin:"0 0 12px",fontSize:15,fontWeight:800}}>{WDF[sel]} {weekDates[sel].toLocaleDateString("sv-SE")}</h3>
          {efd(weekDates[sel]).length===0?<p style={{color:T.textLight,fontSize:13}}>Inga händelser</p>:efd(weekDates[sel]).map(e=>{const et=ET[e.type];return(
            <div key={e.id} style={{display:"flex",gap:12,alignItems:"flex-start",padding:"11px 13px",borderRadius:10,background:et?.soft,marginBottom:7,border:`1px solid ${et?.color}22`}}>
              <span style={{fontSize:20}}>{et?.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:14}}>{e.title}{e.recurring&&<span style={{marginLeft:6,fontSize:10,color:T.textMuted}}>🔁</span>}</div>
                <div style={{fontSize:11,color:T.textMuted,marginTop:1}}>{e.time}{e.timeTo?` – ${e.timeTo}`:""}{e.note?` · ${e.note}`:""}</div>
                <div style={{marginTop:5,display:"flex",gap:4,flexWrap:"wrap"}}>
                  {e.assignedTo.map(id=>{const u=byId(id);return u?<span key={id} style={{fontSize:11,background:u.color+"22",color:u.color,padding:"2px 8px",borderRadius:20,fontWeight:700}}>{u.avatar} {u.name}</span>:null;})}
                </div>
              </div>
              {isParent&&<button onClick={()=>{setEvents(p=>p.filter(x=>x.id!==e.id));notify("🗑️ Borttagen");}} style={{background:"none",border:"none",color:T.textLight,cursor:"pointer",fontSize:15,padding:0}}>✕</button>}
            </div>
          );})}
          {weather[sel]&&<div style={{marginTop:10,fontSize:11,color:T.textMuted}}>☁️ {weather[sel].desc} · 👗 {weather[sel].advice}</div>}
        </Card>
      )}
    </div>
  );
}

// ─── MEALS ───────────────────────────────────────────────────────────────────
function MealsTab({ meals, setMeals, isParent, notify }) {
  const [ed, setEd] = useState(null); const [v, setV] = useState("");
  return (
    <Card>
      <CT>🗓️ Veckans matsedel</CT>
      {WDF.map((day,i)=>{const isT=(today.getDay()+6)%7===i;return(
        <div key={day} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:9,background:isT?T.accentSoft:T.surfaceAlt,marginBottom:5,border:`1px solid ${isT?T.accent+"44":T.border}`}}>
          <div style={{width:82,fontWeight:700,color:isT?T.accent:T.textMuted,fontSize:13,flexShrink:0}}>{day}</div>
          {ed===day?(
            <>
              <input value={v} onChange={e=>setV(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){setMeals(p=>({...p,[day]:v}));setEd(null);notify("🍽️ Uppdaterat!");}}} style={{...S.input,flex:1}} autoFocus/>
              <button style={{...S.btnSm,background:T.green,color:"#fff",border:"none"}} onClick={()=>{setMeals(p=>({...p,[day]:v}));setEd(null);notify("🍽️ Uppdaterat!");}}>✓</button>
              <button style={S.btnSm} onClick={()=>setEd(null)}>✕</button>
            </>
          ):(
            <>
              <span style={{flex:1,fontWeight:600,fontSize:14}}>{meals[day]||<span style={{color:T.textLight}}>Ej planerat</span>}</span>
              {isParent&&<button style={{...S.btnSm,opacity:0.5}} onClick={()=>{setEd(day);setV(meals[day]||"");}}>✏️</button>}
            </>
          )}
        </div>
      );})}
    </Card>
  );
}

// ─── SHOPPING ────────────────────────────────────────────────────────────────
function ShoppingTab({ mobile, shopping, setShopping, shopForm, setShopForm, addItem, isParent, notify }) {
  const cats=[...new Set(shopping.map(s=>s.category))];
  const done=shopping.filter(s=>s.done).length;
  const pct=Math.round((done/Math.max(shopping.length,1))*100);
  return (
    <div>
      <Card>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}><CT>🛒 Inköpslista</CT><span style={{fontSize:12,color:T.textMuted,fontWeight:600}}>{done}/{shopping.length}</span></div>
        <div style={{height:7,background:T.border,borderRadius:4,marginBottom:16,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:pct===100?T.green:T.accent,borderRadius:4,transition:"width 0.3s"}}/></div>
        {cats.map(cat=>(
          <div key={cat} style={{marginBottom:14}}>
            <div style={{fontSize:10,color:T.textLight,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>{cat}</div>
            {shopping.filter(s=>s.category===cat).map(item=>(
              <div key={item.id} onClick={()=>setShopping(p=>p.map(x=>x.id===item.id?{...x,done:!x.done}:x))} style={{display:"flex",alignItems:"center",gap:11,padding:"9px 10px",borderRadius:7,cursor:"pointer",background:item.done?T.greenSoft:"transparent",marginBottom:3,transition:"all 0.15s"}}>
                <div style={{width:21,height:21,borderRadius:5,border:`2px solid ${item.done?T.green:T.border}`,background:item.done?T.green:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {item.done&&<span style={{fontSize:11,color:"#fff",fontWeight:700}}>✓</span>}
                </div>
                <span style={{flex:1,fontSize:13,fontWeight:600,textDecoration:item.done?"line-through":"none",color:item.done?T.textLight:T.text}}>{item.item}</span>
                <span style={{fontSize:12,color:T.textMuted}}>{item.qty}</span>
                {isParent&&<button style={{background:"none",border:"none",color:T.textLight,cursor:"pointer",fontSize:14,padding:0}} onClick={e=>{e.stopPropagation();setShopping(p=>p.filter(s=>s.id!==item.id));}} >✕</button>}
              </div>
            ))}
          </div>
        ))}
        {isParent&&done>0&&<button style={{...S.btnSm,color:T.red,borderColor:T.red+"44"}} onClick={()=>{setShopping(p=>p.filter(s=>!s.done));notify("🗑️ Klara borttagna!");}}>🗑️ Rensa klara</button>}
      </Card>
      {isParent&&(
        <Card>
          <CT>➕ Lägg till vara</CT>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",flexDirection:mobile?"column":"row"}}>
            <input placeholder="Vara..." value={shopForm.item} onChange={e=>setShopForm({...shopForm,item:e.target.value})} style={{...S.input,flex:2,minWidth:100}} onKeyDown={e=>e.key==="Enter"&&addItem()}/>
            <input placeholder="Mängd..." value={shopForm.qty} onChange={e=>setShopForm({...shopForm,qty:e.target.value})} style={{...S.input,flex:1,minWidth:70}}/>
            <select value={shopForm.category} onChange={e=>setShopForm({...shopForm,category:e.target.value})} style={{...S.input,flex:1,minWidth:90}}>
              {["Mejeri","Kött","Grönt","Bröd","Torrvaror","Dryck","Fryst","Övrigt"].map(c=><option key={c}>{c}</option>)}
            </select>
            <button style={{...S.btnPrimary,width:mobile?"100%":"auto"}} onClick={addItem}>Lägg till</button>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── HEALTH ──────────────────────────────────────────────────────────────────
function HealthTab({ mobile, meds, setMeds, users, isParent, user, medForm, setMedForm, addMed, notify, sendReminder, confirmMed }) {
  const vis=isParent?meds:meds.filter(m=>m.assignedTo===user.id);
  return (
    <div>
      <Card>
        <CT>💊 Medicinschema</CT>
        {vis.map(m=>{
          const u=users.find(x=>x.id===m.assignedTo);
          const st=getMedStatus(m, m.assignedTo);
          const canConfirmSelf = user && m.assignedTo===user.id && m.active;
          return (
            <div key={m.id} style={{background:T.surfaceAlt,borderRadius:12,padding:14,marginBottom:10,border:`1px solid ${T.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
                <div>
                  <div style={{fontWeight:800,fontSize:15}}>💊 {m.name} <span style={{fontWeight:400,fontSize:13,color:T.textMuted}}>{m.dose}</span></div>
                  <div style={{display:"flex",gap:5,marginTop:7,flexWrap:"wrap"}}>
                    {normalizeMedTimes(m.times).map((t,i)=><span key={i} style={{fontSize:11,background:T.blueSoft,color:T.blue,padding:"2px 8px",borderRadius:20,fontWeight:700}}>🕐 {t}</span>)}
                  </div>
                  <div style={{marginTop:7,fontSize:11,color:T.textMuted}}>{medScheduleLabel(m)}</div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"}}>
                  {u&&<span style={{fontSize:11,background:u.color+"22",color:u.color,padding:"3px 10px",borderRadius:20,fontWeight:700}}>{u.avatar} {u.name}</span>}
                  {isParent&&<button style={{...S.btnSm,background:m.active?T.greenSoft:T.redSoft,color:m.active?T.green:T.red,border:`1px solid ${m.active?T.green:T.red}33`}} onClick={()=>setMeds(p=>p.map(x=>x.id===m.id?{...x,active:!x.active}:x))}>{m.active?"✅ Aktiv":"⏸ Pausad"}</button>}
                  {isParent&&m.active&&m.assignedTo!==user?.id&&st!=="done"&&(
                    <button style={{...S.btnSm,background:st==="pending"?T.yellowSoft:T.yellowSoft,color:st==="pending"?T.yellow:T.accent,border:`1px solid ${st==="pending"?T.yellow:T.accent}33`}} onClick={()=>sendReminder(m.id,m.assignedTo)}>
                      {st==="pending"?"📩 Påminnelse skickad":"🔔 Skicka påminnelse"}
                    </button>
                  )}
                  {canConfirmSelf&&st!=="done"&&(
                    <button style={{...S.btnSm,background:T.greenSoft,color:T.green,border:`1px solid ${T.green}33`,fontWeight:700}} onClick={()=>confirmMed(m.id,user.id)}>
                      ✅ Jag har tagit den!
                    </button>
                  )}
                  {st==="done"&&(
                    <span style={{fontSize:11,background:T.greenSoft,color:T.green,padding:"3px 10px",borderRadius:20,fontWeight:700}}>
                      ✅ {isParent && u ? `${u.name} har tagit den` : "Intagen"}
                    </span>
                  )}
                  {isParent&&(
                    <button
                      style={{...S.btnSm,background:T.redSoft,color:T.red,border:`1px solid ${T.red}33`}}
                      onClick={()=>{
                        if(window.confirm(`Ta bort ${m.name}?`)){
                          setMeds(p=>p.filter(x=>x.id!==m.id));
                          notify("🗑️ Medicin borttagen");
                        }
                      }}
                    >
                      🗑️ Ta bort
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {vis.length===0&&<p style={{color:T.textLight,fontSize:13}}>Inga mediciner</p>}
      </Card>
      {isParent&&(
        <Card>
          <CT>➕ Ny medicin</CT>
          <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"1fr 1fr",gap:10,marginBottom:10}}>
            <div><label style={S.lbl}>Medicin</label><input value={medForm.name} onChange={e=>setMedForm({...medForm,name:e.target.value})} style={S.input}/></div>
            <div><label style={S.lbl}>Dos</label><input value={medForm.dose} onChange={e=>setMedForm({...medForm,dose:e.target.value})} style={S.input}/></div>
            <div><label style={S.lbl}>Schema</label><select value={medForm.scheduleType} onChange={e=>{ const v=e.target.value; setMedForm({...medForm,scheduleType:v, recurring:v!=="once", times:v==="twice_daily"?"08:00, 20:00":medForm.times||"08:00"}); }} style={S.input}><option value="daily">Dagligen</option><option value="twice_daily">2 gånger per dag</option><option value="custom">Egna tider</option><option value="once">Engångsmedicin</option></select></div>
            <div><label style={S.lbl}>Person</label><select value={medForm.assignedTo} onChange={e=>setMedForm({...medForm,assignedTo:Number(e.target.value)})} style={S.input}>{users.map(u=><option key={u.id} value={u.id}>{u.avatar} {u.name}</option>)}</select></div>
            <div><label style={S.lbl}>Tid/tider</label><input value={medForm.times} onChange={e=>setMedForm({...medForm,times:e.target.value})} style={S.input} placeholder="08:00 eller 08:00, 20:00"/></div>
            <div><label style={S.lbl}>Startdatum</label><input type="date" value={medForm.startDate} onChange={e=>setMedForm({...medForm,startDate:e.target.value})} style={S.input}/></div>
            <div><label style={S.lbl}>Slutdatum</label><input type="date" value={medForm.endDate} onChange={e=>setMedForm({...medForm,endDate:e.target.value})} style={S.input} placeholder="Lämna tomt för tills vidare"/></div>
            <div style={{display:"flex",alignItems:"end",fontSize:12,color:T.textMuted,paddingBottom:6}}>{medForm.scheduleType==="once"?"Engångsmedicin visas från startdatum och framåt tills du tar bort den eller sätter slutdatum.":medForm.endDate?"Återkommer tills slutdatumet.":"Återkommer utan slutdatum."}</div>
          </div>
          <button style={S.btnPrimary} onClick={addMed}>Spara</button>
        </Card>
      )}
    </div>
  );
}

// ─── TASKS ───────────────────────────────────────────────────────────────────
function TasksTab({ tasks, setTasks, users, isParent, user, notify, onAdd }) {
  const my=isParent?tasks:tasks.filter(t=>t.assignedTo===user.id);
  const pts=my.filter(t=>t.done).reduce((s,t)=>s+t.points,0);
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <h3 style={{margin:0,fontWeight:800,fontSize:17}}>🎯 {isParent?"Familjens uppdrag":"Mina uppdrag"}</h3>
        {isParent&&<button style={S.btnPrimary} onClick={onAdd}>➕ Nytt uppdrag</button>}
      </div>
      {!isParent&&(
        <Card style={{background:`linear-gradient(120deg,${T.accentSoft},${T.surface})`,marginBottom:16,border:`1px solid ${T.accent}33`}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div><div style={{fontSize:11,color:T.textMuted,fontWeight:700}}>Dina poäng</div><div style={{fontSize:32,fontWeight:800,color:T.accent}}>{pts} ⭐</div></div>
            <div style={{textAlign:"right"}}><div style={{fontSize:12,color:T.textMuted}}>{my.filter(t=>t.done).length}/{my.length} klart</div><div style={{height:7,width:100,background:T.border,borderRadius:3,marginTop:5,overflow:"hidden"}}><div style={{height:"100%",background:T.green,width:`${my.length?((my.filter(t=>t.done).length/my.length)*100):0}%`,borderRadius:3,transition:"width 0.4s"}}/></div></div>
          </div>
        </Card>
      )}
      {isParent?users.filter(u=>u.role==="child").map(u=>{
        const ut=tasks.filter(t=>t.assignedTo===u.id);
        const p=ut.filter(t=>t.done).reduce((s,t)=>s+t.points,0);
        return (
          <Card key={u.id} style={{marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:10}}>
              <span style={{fontSize:22}}>{u.avatar}</span><span style={{fontWeight:800,fontSize:15}}>{u.name}</span>
              <span style={{marginLeft:"auto",fontWeight:800,color:T.accent,fontSize:16}}>{p}p ⭐</span>
            </div>
            {ut.map(t=><TR key={t.id} t={t} setTasks={setTasks} notify={notify} isParent user={user}/>)}
            {ut.length===0&&<p style={{color:T.textLight,fontSize:12}}>Inga uppdrag</p>}
          </Card>
        );
      }):(
        <Card>{my.map(t=><TR key={t.id} t={t} setTasks={setTasks} notify={notify} isParent={false} user={user}/>)}{my.length===0&&<p style={{color:T.textLight}}>Inga uppdrag just nu 🎉</p>}</Card>
      )}
    </div>
  );
}

function TR({ t, setTasks, notify, isParent, user }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:11,padding:"9px 11px",borderRadius:9,background:t.done?T.greenSoft:T.surfaceAlt,marginBottom:5,border:`1px solid ${t.done?T.green+"44":T.border}`}}>
      <button onClick={()=>{setTasks(p=>p.map(x=>x.id===t.id?{...x,done:!x.done,completedAt:!t.done?new Date().toISOString():"",completedBy:!t.done?user?.id:null}:x));if(!t.done)notify(`⭐ +${t.points} poäng!`);}} style={{width:22,height:22,borderRadius:5,border:`2px solid ${t.done?T.green:T.border}`,background:t.done?T.green:"transparent",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff",fontWeight:700,padding:0}}>{t.done?"✓":""}</button>
      <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13,textDecoration:t.done?"line-through":"none",color:t.done?T.textLight:T.text}}>{t.title}</div><div style={{fontSize:10,color:T.textMuted}}>Deadline: {t.dueDate}</div></div>
      <span style={{fontWeight:800,color:t.done?T.green:T.accent,fontSize:13}}>{t.points}p</span>
      {isParent&&<button onClick={()=>setTasks(p=>p.filter(x=>x.id!==t.id))} style={{background:"none",border:"none",color:T.textLight,cursor:"pointer",fontSize:14,padding:0}}>✕</button>}
    </div>
  );
}

// ─── CHAT ────────────────────────────────────────────────────────────────────
function ChatTab({ mobile, user, users, isParent, chats, chatMessages, chatReads, onCreateChat, onSendMessage, onReadChat, initialChatId, onConsumeInitialChat }) {
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [draft, setDraft] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [chatType, setChatType] = useState("direct");
  const [chatName, setChatName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);

  const visibleChats = chats.filter(c => canUserSeeChat(c, user, users))
    .map(chat => {
      const messages = chatMessages.filter(m => m.chatId === chat.id).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
      const lastMessage = messages[messages.length - 1] || null;
      const lastRead = chatReads?.[chat.id]?.[user.id] || "";
      const unreadCount = messages.filter(m => m.senderId !== user.id && (!lastRead || m.createdAt > lastRead)).length;
      return { ...chat, messages, lastMessage, unreadCount };
    })
    .sort((a,b) => new Date(b.lastMessage?.createdAt || 0) - new Date(a.lastMessage?.createdAt || 0));

  useEffect(() => {
    if (!visibleChats.length) {
      setSelectedChatId(null);
      return;
    }
    if (initialChatId && visibleChats.some(c => c.id === initialChatId)) {
      setSelectedChatId(initialChatId);
      onConsumeInitialChat?.();
      return;
    }
    if (!selectedChatId || !visibleChats.some(c => c.id === selectedChatId)) {
      setSelectedChatId(visibleChats[0].id);
    }
  }, [selectedChatId, visibleChats.length, chats, chatMessages, initialChatId]);

  const activeChat = visibleChats.find(c => c.id === selectedChatId) || null;
  const myChats = visibleChats.filter(chat => chat.memberIds?.includes(user.id));
  const moderatedChildChats = isParent ? visibleChats.filter(chat => !chat.memberIds?.includes(user.id) && isChildOnlyChat(chat, users)) : [];

  useEffect(() => {
    if (activeChat?.id) onReadChat(activeChat.id, user.id);
  }, [activeChat?.id, user.id]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    requestAnimationFrame(() => {
      if (messagesEndRef.current?.scrollIntoView) {
        messagesEndRef.current.scrollIntoView({ behavior: "auto", block: "end" });
      } else {
        container.scrollTop = container.scrollHeight;
      }
    });
  }, [activeChat?.id, activeChat?.messages?.length]);

  function getUser(id) {
    return users.find(u => u.id === id);
  }
  function chatTitle(chat) {
    if (!chat) return "";
    if (chat.type === "group") return chat.name;
    const other = chat.memberIds.find(id => id !== user.id);
    const u = getUser(other);
    return u ? `${u.avatar} ${u.name}` : "Direktchatt";
  }
  function chatSubtitle(chat) {
    if (!chat) return "";
    const names = chat.memberIds.map(id => getUser(id)?.name).filter(Boolean);
    return chat.type === "group" ? `${names.length} deltagare` : "Direktchatt";
  }
  function toggleMember(id) {
    setSelectedMembers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }
  function submitNewChat() {
    const memberIds = Array.from(new Set([user.id, ...selectedMembers]));
    const res = onCreateChat({ type: chatType, name: chatName.trim(), memberIds });
    if (res?.ok && res.chatId) {
      setSelectedChatId(res.chatId);
      setShowComposer(false);
      setChatName("");
      setSelectedMembers([]);
      setChatType("direct");
    }
  }

  const selectableUsers = users.filter(u => u.id !== user.id);

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,gap:10,flexWrap:"wrap"}}>
        <div>
          <h3 style={{margin:0,fontWeight:800,fontSize:17}}>🗨️ Familjechatt</h3>
          <div style={{fontSize:12,color:T.textMuted,marginTop:3}}>{isParent ? "Du ser dina egna chattar och barnens interna chattar. Andra vuxnas privata chattar syns inte för dig." : "Du ser bara chattar där du själv är med."}</div>
        </div>
        <button style={S.btnPrimary} onClick={()=>setShowComposer(s=>!s)}>{showComposer ? "Stäng" : (isParent ? "➕ Ny chatt" : "➕ Ny direktchatt")}</button>
      </div>

      {showComposer && (
        <Card style={{marginBottom:16}}>
          <CT>➕ Skapa chatt</CT>
          {isParent && (
            <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
              <button onClick={()=>setChatType("direct")} style={{...S.btnSm, background: chatType==="direct" ? T.accent : T.surfaceAlt, color: chatType==="direct" ? "#fff" : T.text, border:`1px solid ${chatType==="direct"?T.accent:T.border}`}}>Direktchatt</button>
              <button onClick={()=>setChatType("group")} style={{...S.btnSm, background: chatType==="group" ? T.accent : T.surfaceAlt, color: chatType==="group" ? "#fff" : T.text, border:`1px solid ${chatType==="group"?T.accent:T.border}`}}>Gruppchatt</button>
            </div>
          )}
          {chatType === "group" && isParent && (
            <div style={{marginBottom:12}}>
              <label style={S.lbl}>Gruppnamn</label>
              <input value={chatName} onChange={e=>setChatName(e.target.value)} style={S.input} placeholder="Ex. Hämtning & logistik" />
            </div>
          )}
          <div style={{marginBottom:12}}>
            <label style={S.lbl}>{chatType === "group" ? "Deltagare" : "Välj person"}</label>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:8}}>
              {selectableUsers.map(u => {
                const checked = selectedMembers.includes(u.id);
                const disabled = !isParent && chatType === "group";
                return (
                  <button key={u.id} disabled={disabled} onClick={()=>toggleMember(u.id)} style={{background:checked?u.color+"22":T.surfaceAlt,border:`1px solid ${checked?u.color:T.border}`,borderRadius:10,padding:"10px 12px",cursor:disabled?"not-allowed":"pointer",textAlign:"left",opacity:disabled?0.6:1}}>
                    <div style={{fontWeight:700,fontSize:13}}>{u.avatar} {u.name}</div>
                    <div style={{fontSize:11,color:T.textMuted,marginTop:2}}>{u.role === "parent" ? "Admin" : "Barn"}</div>
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <button style={S.btnPrimary} onClick={submitNewChat}>{chatType === "group" ? "Skapa grupp" : "Starta chatt"}</button>
            <button style={S.btnSec} onClick={()=>{setShowComposer(false);setSelectedMembers([]);setChatName("");}}>Avbryt</button>
          </div>
        </Card>
      )}

      <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"320px 1fr",gap:16,alignItems:"start"}}>
        <Card style={mobile && activeChat ? {display:"none"} : {}}>
          <CT>Chattar</CT>
          {visibleChats.length===0 && <p style={{color:T.textLight,fontSize:13}}>Inga chattar än.</p>}
          <div style={{fontSize:11,color:T.textMuted,fontWeight:700,marginBottom:8}}>DINA CHATTER</div>
          {myChats.length===0 && <div style={{fontSize:12,color:T.textLight,marginBottom:10}}>Du är inte med i några chattar ännu.</div>}
          {myChats.map(chat => (
            <button key={chat.id} onClick={()=>{ setSelectedChatId(chat.id); onReadChat(chat.id, user.id); }} style={{width:"100%",background:selectedChatId===chat.id?T.accentSoft:T.surfaceAlt,border:`1px solid ${selectedChatId===chat.id?T.accent:T.border}`,borderRadius:12,padding:"12px 13px",marginBottom:8,cursor:"pointer",textAlign:"left"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{fontSize:20}}>{chat.type === "group" ? "👥" : "💬"}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:800,fontSize:14,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{chatTitle(chat)}</div>
                  <div style={{fontSize:11,color:T.textMuted}}>{chatSubtitle(chat)}</div>
                </div>
                {chat.unreadCount>0 && <span style={{minWidth:22,height:22,borderRadius:999,background:T.red,color:"#fff",display:"inline-flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:11,padding:"0 6px"}}>{chat.unreadCount}</span>}
              </div>
              {chat.lastMessage && (
                <div style={{fontSize:12,color:T.textMuted,marginTop:8,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                  {getUser(chat.lastMessage.senderId)?.name}: {chat.lastMessage.text}
                </div>
              )}
            </button>
          ))}
          {isParent && (
            <>
              <div style={{fontSize:11,color:T.textMuted,fontWeight:700,marginTop:12,marginBottom:8}}>BARNENS CHATTER</div>
              <div style={{fontSize:11,color:T.textMuted,marginBottom:8}}>Här ser du bara chattar där enbart barn deltar, så att du kan hålla koll på tonen. Om en annan vuxen är med i chatten och du själv inte är det, är den privat för er vuxna.</div>
              {moderatedChildChats.length===0 && <div style={{fontSize:12,color:T.textLight}}>Just nu finns inga barnchattar utan dig.</div>}
              {moderatedChildChats.map(chat => (
                <button key={chat.id} onClick={()=>{ setSelectedChatId(chat.id); onReadChat(chat.id, user.id); }} style={{width:"100%",background:selectedChatId===chat.id?T.blueSoft:T.surfaceAlt,border:`1px solid ${selectedChatId===chat.id?T.blue:T.border}`,borderRadius:12,padding:"12px 13px",marginBottom:8,cursor:"pointer",textAlign:"left"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{fontSize:20}}>🛡️</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:800,fontSize:14,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{chatTitle(chat)}</div>
                      <div style={{fontSize:11,color:T.textMuted}}>Barnchatt · {chatSubtitle(chat)}</div>
                    </div>
                    {chat.unreadCount>0 && <span style={{minWidth:22,height:22,borderRadius:999,background:T.red,color:"#fff",display:"inline-flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:11,padding:"0 6px"}}>{chat.unreadCount}</span>}
                  </div>
                  {chat.lastMessage && (
                    <div style={{fontSize:12,color:T.textMuted,marginTop:8,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                      {getUser(chat.lastMessage.senderId)?.name}: {chat.lastMessage.text}
                    </div>
                  )}
                </button>
              ))}
            </>
          )}
        </Card>

        <Card style={mobile && !activeChat ? {display:"none"} : {}}>
          {!activeChat ? (
            <p style={{color:T.textLight}}>Välj en chatt i listan.</p>
          ) : (
            <>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:12,flexWrap:"wrap"}}>
                <div>
                  {mobile && <button onClick={()=>setSelectedChatId(null)} style={{...S.btnSm,marginBottom:8}}>← Chattar</button>}<div style={{fontWeight:800,fontSize:17}}>{chatTitle(activeChat)}</div>
                  <div style={{fontSize:12,color:T.textMuted}}>{activeChat.memberIds.map(id => `${getUser(id)?.avatar || ""} ${getUser(id)?.name || "Okänd"}`).join(" · ")}</div>
                </div>
                <span style={{fontSize:11,background:T.surfaceAlt,border:`1px solid ${T.border}`,padding:"4px 10px",borderRadius:999,fontWeight:700}}>{activeChat.type === "group" ? "Gruppchatt" : "Direktchatt"}</span>
              </div>
              <div ref={messagesContainerRef} style={{background:T.surfaceAlt,border:`1px solid ${T.border}`,borderRadius:12,padding:12,minHeight:360,maxHeight:520,overflow:"auto",marginBottom:12}}>
                {activeChat.messages.length===0 && <p style={{color:T.textLight,fontSize:13}}>Skriv första meddelandet.</p>}
                {activeChat.messages.map(msg => {
                  const mine = msg.senderId === user.id;
                  const sender = getUser(msg.senderId);
                  return (
                    <div key={msg.id} style={{display:"flex",justifyContent:mine?"flex-end":"flex-start",marginBottom:10}}>
                      <div style={{maxWidth:"78%",background:mine?T.accentSoft:"#fff",border:`1px solid ${mine?T.accent+"33":T.border}`,borderRadius:14,padding:"10px 12px",boxShadow:"0 1px 2px rgba(0,0,0,0.04)"}}>
                        <div style={{fontSize:11,fontWeight:700,color:mine?T.accent:(sender?.color || T.textMuted),marginBottom:4}}>{sender?.avatar} {sender?.name}</div>
                        <div style={{fontSize:14,lineHeight:1.4,color:T.text}}>{msg.text}</div>
                        <div style={{fontSize:10,color:T.textLight,marginTop:6,textAlign:"right"}}>{new Date(msg.createdAt).toLocaleString("sv-SE", { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" })}</div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
                <textarea value={draft} onChange={e=>setDraft(e.target.value)} rows={3} style={{...S.input,resize:"vertical",flex:1}} placeholder="Skriv ett meddelande..." onFocus={()=>onReadChat(activeChat.id, user.id)} onKeyDown={e=>{ if(e.key === "Enter" && !e.shiftKey){ e.preventDefault(); if(draft.trim()){ onSendMessage(activeChat.id, draft); setDraft(""); } } }} />
                <button style={S.btnPrimary} onClick={()=>{ if(draft.trim()){ onSendMessage(activeChat.id, draft); setDraft(""); } }}>Skicka</button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

// ─── MESSAGES ────────────────────────────────────────────────────────────────
function MessagesTab({ mobile, wishes, quickAlerts, users, setWishes, setQuickAlerts, onSms }) {
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <h3 style={{margin:0,fontWeight:800,fontSize:17}}>💬 Familjemeddelanden</h3>
        <button style={S.btnPrimary} onClick={onSms}>📱 Skicka SMS</button>
      </div>
      <Card style={{marginBottom:16}}>
        <CT>⚡ Snabbåtgärder från barnen</CT>
        {quickAlerts.length===0?<p style={{color:T.textLight}}>Inga snabbåtgärder ännu</p>:quickAlerts.slice().reverse().map(a=>{
          const u=users.find(x=>x.id===a.from);
          return (
            <div key={a.id} style={{background:a.read?T.surfaceAlt:T.redSoft,border:`1px solid ${a.read?T.border:T.red+"44"}`,borderRadius:10,padding:13,marginBottom:9}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
                <div>
                  {u&&<div style={{color:u.color,fontWeight:700,marginBottom:3,fontSize:12}}>{u.avatar} {u.name}</div>}
                  <div style={{fontWeight:700,fontSize:14}}>{a.icon} {a.message}</div>
                  <div style={{color:T.textLight,fontSize:11,marginTop:3}}>{a.date} · {a.time}</div>
                </div>
                {!a.read&&<button style={{...S.btnSm,background:T.green,color:"#fff",border:"none"}} onClick={()=>setQuickAlerts(p=>p.map(x=>x.id===a.id?{...x,read:true}:x))}>✓ Sett</button>}
              </div>
            </div>
          );
        })}
      </Card>
      <Card>
        <CT>🍕 Matönskemål</CT>
        {wishes.length===0?<p style={{color:T.textLight}}>Inga önskemål ännu</p>:wishes.slice().reverse().map(w=>{
          const u=users.find(x=>x.id===w.from);
          return (
            <div key={w.id} style={{background:w.read?T.surfaceAlt:T.accentSoft,border:`1px solid ${w.read?T.border:T.accent+"44"}`,borderRadius:10,padding:13,marginBottom:9}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
                <div>{u&&<div style={{color:u.color,fontWeight:700,marginBottom:3,fontSize:12}}>{u.avatar} {u.name}</div>}<div style={{fontWeight:600,fontSize:14}}>{w.wish}</div><div style={{color:T.textLight,fontSize:11,marginTop:3}}>{w.date}</div></div>
                {!w.read&&<button style={{...S.btnSm,background:T.green,color:"#fff",border:"none"}} onClick={()=>setWishes(p=>p.map(x=>x.id===w.id?{...x,read:true}:x))}>✓ Läst</button>}
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

// ─── WISHES ──────────────────────────────────────────────────────────────────
function WishesTab({ mobile, user, wishes, onAdd }) {
  const mine=wishes.filter(w=>w.from===user.id);
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <h3 style={{margin:0,fontWeight:800,fontSize:17}}>🍕 Mina matönskemål</h3>
        <button style={S.btnPrimary} onClick={onAdd}>➕ Nytt önskemål</button>
      </div>
      <Card>
        {mine.length===0?<p style={{color:T.textLight}}>Inga önskemål skickade än!</p>:mine.slice().reverse().map(w=>(
          <div key={w.id} style={{background:T.surfaceAlt,borderRadius:9,padding:13,marginBottom:7}}>
            <div style={{fontWeight:700,fontSize:14}}>{w.wish}</div>
            <div style={{fontSize:11,color:T.textMuted,marginTop:3}}>{w.date} · {w.read?"✅ Sett":"⏳ Ej läst"}</div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── QUICK ───────────────────────────────────────────────────────────────────
function QuickTab({ mobile, user, onSend }) {
  const actions=[
    {id:"late",icon:"🕐",label:"Jag är sen hem",desc:"Meddelar föräldrarna",c:T.yellow,s:T.yellowSoft,message:"🕐 Jag är sen hem!"},
    {id:"pickup",icon:"🚗",label:"Hämta mig!",desc:"Be om skjuts",c:T.blue,s:T.blueSoft,message:"🚗 Hämta mig!"},
    {id:"help",icon:"🆘",label:"Jag behöver hjälp",desc:"Akut notis",c:T.red,s:T.redSoft,message:"🆘 Jag behöver hjälp!"},
    {id:"here",icon:"✅",label:"Jag är framme",desc:"Bekräfta att du är på plats",c:T.green,s:T.greenSoft,message:"✅ Jag är framme!"},
  ];
  return (
    <div>
      <Card style={{background:T.accentSoft,border:`1px solid ${T.accent}33`,marginBottom:18}}>
        <div style={{fontWeight:700,fontSize:15}}>⚡ Snabbåtgärder</div>
        <div style={{color:T.textMuted,fontSize:13,marginTop:3}}>Tryck för att direkt meddela föräldrarna</div>
        <div style={{fontSize:11,color:T.textLight,marginTop:8}}>Skickas som en notis från {user.avatar} {user.name} till familjens admins.</div>
      </Card>
      <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"repeat(auto-fill,minmax(190px,1fr))",gap:12}}>
        {actions.map(a=>(
          <button key={a.id} onClick={()=>onSend(a)}
            style={{background:a.s,border:`2px solid ${a.c}33`,borderRadius:14,padding:"20px 16px",cursor:"pointer",textAlign:"left",transition:"all 0.15s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=a.c;e.currentTarget.style.transform="translateY(-2px)";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=`${a.c}33`;e.currentTarget.style.transform="none";}}>
            <div style={{fontSize:32,marginBottom:9}}>{a.icon}</div>
            <div style={{fontWeight:800,fontSize:15,color:a.c}}>{a.label}</div>
            <div style={{fontSize:11,color:T.textMuted,marginTop:3}}>{a.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── ADMIN ───────────────────────────────────────────────────────────────────
function AdminTab({ mobile, family, setFamily, users, setUsers, events, setEvents, onAddUser, onSms, notify, getUser, onEditUser, onDeleteUser, onResetDemo }) {
  const [confirmDelete, setConfirmDelete] = useState(null);
  const adminCount = users.filter(isAdminUser).length;
  const childCount = users.filter(u=>u.role==="child").length;
  return (
    <div>
      <div style={{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap"}}>
        <button style={S.btnPrimary} onClick={onAddUser}>➕ Ny familjemedlem</button>
        <button style={S.btnSec} onClick={onSms}>📱 Skicka SMS</button>
      </div>
      <Card>
        <CT>🛡️ Familjegrupp & roller</CT>
        <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"repeat(auto-fit,minmax(220px,1fr))",gap:12}}>
          <div style={{background:T.surfaceAlt,border:`1px solid ${T.border}`,borderRadius:12,padding:14}}>
            <label style={S.lbl}>Familjenamn</label>
            <input value={family.name} onChange={e=>setFamily(p=>({...p,name:e.target.value}))} style={S.input} placeholder="Familjenamn"/>
            <div style={{fontSize:11,color:T.textMuted,marginTop:8}}>Detta visas på inloggningen och i sidomenyn.</div>
          </div>
          <div style={{background:T.surfaceAlt,border:`1px solid ${T.border}`,borderRadius:12,padding:14}}>
            <label style={S.lbl}>Familjekod</label>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{...S.input,display:"flex",alignItems:"center",fontWeight:800,letterSpacing:1.2}}>{family.inviteCode}</div>
              <button style={S.btnSm} onClick={()=>{const next=`FAM-${Math.floor(1000+Math.random()*9000)}`; setFamily(p=>({...p,inviteCode:next})); notify("🔐 Ny familjekod skapad");}}>Ny kod</button>
            </div>
            <div style={{fontSize:11,color:T.textMuted,marginTop:8}}>Bra grund när vi senare lägger till familjeinbjudningar och riktiga konton.</div>
          </div>
          <div style={{background:T.surfaceAlt,border:`1px solid ${T.border}`,borderRadius:12,padding:14}}>
            <label style={S.lbl}>Överblick</label>
            <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"repeat(3,1fr)",gap:8}}>
              <div style={{background:T.surface,borderRadius:10,padding:10,textAlign:"center"}}><div style={{fontSize:20,fontWeight:800,color:T.accent}}>{users.length}</div><div style={{fontSize:11,color:T.textMuted}}>Profiler</div></div>
              <div style={{background:T.surface,borderRadius:10,padding:10,textAlign:"center"}}><div style={{fontSize:20,fontWeight:800,color:T.blue}}>{adminCount}</div><div style={{fontSize:11,color:T.textMuted}}>Admins</div></div>
              <div style={{background:T.surface,borderRadius:10,padding:10,textAlign:"center"}}><div style={{fontSize:20,fontWeight:800,color:T.green}}>{childCount}</div><div style={{fontSize:11,color:T.textMuted}}>Barn</div></div>
            </div>
          </div>
        </div>
        <div style={{marginTop:12,padding:"10px 12px",borderRadius:10,background:T.blueSoft,color:T.blue,fontSize:12,fontWeight:700}}>
          Vuxna är admins för hela familjegruppen. Barn ser bara det som senare uttryckligen delas med dem.
        </div>
      </Card>
      <Card>
        <CT>👨‍👩‍👧‍👦 Familjemedlemmar</CT>
        {users.map(u=>(
          <div key={u.id} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 13px",borderRadius:10,background:T.surfaceAlt,marginBottom:7,border:`1px solid ${T.border}`}}>
            <div style={{width:40,height:40,borderRadius:"50%",background:u.color+"22",border:`2px solid ${u.color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{u.avatar}</div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:14}}>{u.name}</div>
              <div style={{fontSize:11,color:T.textMuted}}>{u.role==="parent"?"🛡️ Admin":"👶 Barn"} · {u.birthdate||"–"} · {u.phone||"–"} · <span style={{color:u.pin?T.green:T.textLight}}>{u.pin?"🔒 PIN":"Ingen PIN"}</span></div>
            </div>
            <div style={{width:14,height:14,borderRadius:"50%",background:u.color,flexShrink:0,marginRight:4}}/>
            <button onClick={()=>onEditUser(u)} style={{...S.btnSm,padding:"5px 11px",fontSize:12,color:T.blue,borderColor:T.blue+"44",background:T.blueSoft}} title="Redigera">✏️</button>
            {confirmDelete===u.id?(
              <div style={{display:"flex",gap:5,alignItems:"center"}}>
                <span style={{fontSize:11,color:T.red,fontWeight:700}}>Ta bort?</span>
                <button onClick={()=>{onDeleteUser(u.id);setConfirmDelete(null);}} style={{...S.btnSm,background:T.red,color:"#fff",border:"none",padding:"4px 9px"}}>Ja</button>
                <button onClick={()=>setConfirmDelete(null)} style={S.btnSm}>Nej</button>
              </div>
            ):(
              <button onClick={()=>setConfirmDelete(u.id)} style={{...S.btnSm,color:T.red,borderColor:T.red+"44",background:T.redSoft,padding:"5px 10px"}} title="Ta bort">🗑️</button>
            )}
          </div>
        ))}
      </Card>
      <Card>
        <CT>📋 Alla händelser ({events.length})</CT>
        <div style={{maxHeight:300,overflowY:"auto"}}>
          {events.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(e=>{const et=ET[e.type];return(
            <div key={e.id} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 0",borderBottom:`1px solid ${T.border}`}}>
              <span style={{fontSize:15}}>{et?.icon}</span>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{e.title}{e.recurring?" 🔁":""}</div><div style={{fontSize:11,color:T.textMuted}}>{e.date} {e.time}{e.timeTo?` – ${e.timeTo}`:""}</div></div>
              <button style={{background:"none",border:"none",color:T.textLight,cursor:"pointer",padding:0}} onClick={()=>{setEvents(p=>p.filter(x=>x.id!==e.id));notify("🗑️ Borttagen");}}>✕</button>
            </div>
          );})}
        </div>
      </Card>
      <Card style={{border:`1px solid ${T.red}33`}}>
        <CT>♻️ Underhåll</CT>
        <div style={{fontSize:12,color:T.textMuted,marginBottom:12}}>När vi bygger vidare är det skönt att kunna hoppa tillbaka till demo-läget med ett klick.</div>
        <button style={{...S.btnSec,background:T.redSoft,color:T.red,borderColor:T.red+"33"}} onClick={onResetDemo}>Återställ demo-data</button>
      </Card>
    </div>
  );
}

// ─── SHARED COMPONENTS ───────────────────────────────────────────────────────
function Overlay({ children, onClose }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.3)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:12,backdropFilter:"blur(4px)"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()}>{children}</div>
    </div>
  );
}
function Box({ title, onClose, children, style={} }) {
  const mobile = typeof window !== "undefined" ? window.innerWidth < 640 : false;
  return (
    <div style={{background:T.surface,borderRadius:mobile?16:18,padding:mobile?18:26,width:"100%",maxWidth:mobile?"100%":480,maxHeight:"90vh",overflowY:"auto",boxShadow:T.shadowMd,...style}}>
      {(title||onClose)&&(
        <div style={{display:"flex",justifyContent:"space-between",alignItems:mobile?"stretch":"center",flexDirection:mobile?"column":"row",gap:mobile?10:0,marginBottom:20}}>
          {title&&<h3 style={{margin:0,fontSize:17,fontWeight:800}}>{title}</h3>}
          {onClose&&<IBtn onClick={onClose}>✕</IBtn>}
        </div>
      )}
      {children}
    </div>
  );
}
function Card({ children, style={}, onClick }) {
  return <div onClick={onClick} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:T.radius,padding:"16px 18px",marginBottom:14,boxShadow:T.shadow,...style}}>{children}</div>;
}
function CT({ children }) { return <div style={{fontWeight:800,fontSize:14,color:T.text,marginBottom:11}}>{children}</div>; }
function IBtn({ onClick, children }) { return <button onClick={onClick} style={{background:T.surfaceAlt,border:"none",borderRadius:7,width:32,height:32,cursor:"pointer",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",color:T.textMuted,flexShrink:0,padding:0}}>{children}</button>; }
function FI({ label, value, set, type="text", placeholder }) {
  return (
    <div style={{marginBottom:13}}>
      {label&&<label style={S.lbl}>{label}</label>}
      <input type={type} value={value} onChange={e=>set(e.target.value)} style={S.input} placeholder={placeholder||""}/>
    </div>
  );
}
function FS({ label, value, set, opts }) {
  return (
    <div style={{marginBottom:13}}>
      {label&&<label style={S.lbl}>{label}</label>}
      <select value={value} onChange={e=>set(e.target.value)} style={S.input}>
        {opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
}
function Row2({ children }) { const mobile = typeof window !== "undefined" ? window.innerWidth < 760 : false; return <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"1fr 1fr",gap:12,width:"100%"}}>{children}</div>; }
function SelfOnlyAssigned({ user, label="Tilldelade" }) {
  return (
    <div style={{marginBottom:13}}>
      <label style={S.lbl}>{label}</label>
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",borderRadius:10,background:T.surfaceAlt,border:`1px solid ${T.border}`}}>
        <span style={{fontSize:20}}>{user.avatar}</span>
        <div>
          <div style={{fontWeight:700,fontSize:13}}>{user.name}</div>
          <div style={{fontSize:11,color:T.textMuted}}>Barn kan lägga till egna kalenderhändelser, men bara för sig själva.</div>
        </div>
      </div>
    </div>
  );
}

function Assigned({ users, sel, toggle, label="Tilldelade" }) {
  return (
    <div style={{marginBottom:13}}>
      <label style={S.lbl}>{label}</label>
      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
        {users.map(u=>(
          <button key={u.id} onClick={()=>toggle(u.id)} style={{display:"inline-flex",alignItems:"center",gap:4,padding:"5px 11px",borderRadius:20,fontSize:12,cursor:"pointer",fontWeight:600,background:sel.includes(u.id)?u.color:T.surfaceAlt,color:sel.includes(u.id)?"#fff":T.textMuted,border:`1px solid ${sel.includes(u.id)?u.color:T.border}`}}>
            {u.avatar} {u.name}
          </button>
        ))}
      </div>
    </div>
  );
}

const S = {
  btnPrimary: { background:T.accent, color:"#fff", border:"none", borderRadius:8, padding:"9px 17px", cursor:"pointer", fontWeight:700, fontSize:13, transition:"background 0.15s" },
  btnSec: { background:T.surface, color:T.text, border:`1.5px solid ${T.border}`, borderRadius:8, padding:"8px 15px", cursor:"pointer", fontSize:13, fontWeight:600 },
  btnSm: { background:T.surfaceAlt, color:T.textMuted, border:`1px solid ${T.border}`, borderRadius:6, padding:"4px 11px", cursor:"pointer", fontSize:12, fontWeight:600 },
  input: { width:"100%", background:T.bg, border:`1.5px solid ${T.border}`, borderRadius:7, padding:"9px 13px", color:T.text, fontSize:13, outline:"none" },
  lbl: { display:"block", color:T.textMuted, fontSize:11, fontWeight:700, marginBottom:4, textTransform:"uppercase", letterSpacing:0.5 },
};

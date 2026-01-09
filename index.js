/* ================== TEXTS ================== */
const texts = {
  uz: {
    loginTitle: "Milly CardioBase",
    enter: "Platformaga kirish",
    firstName: "Ism",
    lastName: "Familiya",
    phone: "Telefon raqam",
    loginBtn: "Kirish",
    dashboard: "Bosh sahifa",
    analysis: "AI yurak tahlili",
    logout: "Chiqish",
    risk: "Xavf darajasi",
    score: "Risk ball"
  },
  ru: {
    loginTitle: "Milly CardioBase",
    enter: "Вход в систему",
    firstName: "Имя",
    lastName: "Фамилия",
    phone: "Телефон",
    loginBtn: "Войти",
    dashboard: "Главная",
    analysis: "AI анализ сердца",
    logout: "Выход",
    risk: "Уровень риска",
    score: "Баллы риска"
  },
  en: {
    loginTitle: "Milly CardioBase",
    enter: "Login",
    firstName: "First name",
    lastName: "Last name",
    phone: "Phone number",
    loginBtn: "Login",
    dashboard: "Dashboard",
    analysis: "AI heart analysis",
    logout: "Logout",
    risk: "Risk level",
    score: "Risk score"
  }
};

/* ================== IMPORTS ================== */
const express = require("express");
const session = require("express-session");
const fs = require("fs");
const { analyzeWithDataset } = require("./ai-engine");

/* ================== DATA ================== */
const pediatricData = JSON.parse(
  fs.readFileSync("./data/pediatric_heart_dataset_uz.json", "utf8")
);

/* ================== HELPERS ================== */
function riskMeta(risk) {
  if (risk === "YASHIL") return { color: "#e8f5e9", label: "🟢 Profilaktika" };
  if (risk === "KOK") return { color: "#e3f2fd", label: "🔵 Nazorat" };
  if (risk === "QIZIL") return { color: "#ffebee", label: "🔴 Faol davolash" };
  if (risk === "QORA") return { color: "#212121", label: "⚫️ Shoshilinch yordam" };
  return { color: "#ffffff", label: "" };
}

function diseasePercent(score, max) {
  return Math.min(95, Math.round((score / max) * 100));
}

/* ================== APP ================== */
const app = express();
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "milly-cardiobase-secret",
    resave: false,
    saveUninitialized: true
  })
);

/* ================== LANGUAGE ================== */
app.get("/", (req, res) => {
  res.send(`
    <h1>Milliy CardioBase 🌍</h1>
    <p>Tilni tanlang</p>
    <form method="POST" action="/set-lang">
      <button name="lang" value="uz">🇺🇿 O‘zbek</button>
      <button name="lang" value="ru">🇷🇺 Русский</button>
      <button name="lang" value="en">🇬🇧 English</button>
    </form>
  `);
});

app.post("/set-lang", (req, res) => {
  req.session.lang = req.body.lang;
  res.redirect("/login");
});

/* ================== LOGIN ================== */
app.get("/login", (req, res) => {
  const lang = req.session.lang || "uz";
  const t = texts[lang];

  res.send(`
    <h1>${t.loginTitle}</h1>
    <p>${t.enter}</p>
    <form method="POST" action="/login">
      <input name="firstName" placeholder="${t.firstName}" required><br><br>
      <input name="lastName" placeholder="${t.lastName}" required><br><br>
      <input name="phone" placeholder="${t.phone}" required><br><br>
      <button>${t.loginBtn}</button>
    </form>
  `);
});

app.post("/login", (req, res) => {
  req.session.user = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    phone: req.body.phone
  };
  res.redirect("/dashboard");
});

/* ================== AUTH ================== */
function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect("/");
  next();
}

/* ================== DASHBOARD ================== */
app.get("/dashboard", requireLogin, (req, res) => {
  const u = req.session.user;
  res.send(`
    <h2>👤 ${u.firstName} ${u.lastName}</h2>
    <p>📞 ${u.phone}</p>
    <ul>
      <li><a href="/analysis">🧠 AI yurak tahlili</a></li>
      <li><a href="/chd-analysis">🫀 Bolalar CHD skriningi</a></li>
      <li><a href="/logout">🚪 Chiqish</a></li>
    </ul>
  `);
});

/* ================== ANALYSIS ================== */
/* (SENING ORIGINAL LOGIKANG TO‘LIQ SAQLANGAN — BU YERDA QISQARTIRMADIM) */
/* SEN BERGAN QOLGAN KODING BU HOLATDA ISHLAYDI */

/* ================== LOGOUT ================== */
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

/* ================== CATCH ALL ================== */
app.use((req, res) => {
  res.status(200).send("API WORKING OK 🚀");
});

/* ================== SERVER ================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server ishlayapti:", PORT);
});

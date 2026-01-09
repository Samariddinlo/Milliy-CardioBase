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

/* ================== ANALYSIS FORM ================== */
app.get("/analysis", requireLogin, (req, res) => {
  const u = req.session.user;

  res.send(`
    <h1>🧠 Kattalar yurak AI tahlili</h1>
    <p>${u.firstName} ${u.lastName} | ${u.phone}</p>

    <form method="POST" action="/analysis">

      <h3>📏 Antropometriya</h3>
      Vazn (kg): <input type="number" name="weight" required><br><br>
      Bo‘yi (cm): <input type="number" name="height" required><br><br>

      <h3>🫀 Yengil simptomlar</h3>
      <label><input type="checkbox" name="fatigue"> Tez charchash</label><br>
      <label><input type="checkbox" name="palpitation"> Yurak urishini sezish</label><br><br>

      <h3>🔵 O‘rta simptomlar</h3>
      <label><input type="checkbox" name="dyspnea"> Nafas qisilishi</label><br>
      <label><input type="checkbox" name="chest_pain"> Ko‘krak og‘rigi</label><br>
      <label><input type="checkbox" name="dizziness"> Bosh aylanishi</label><br><br>

      <h3>🚨 Og‘ir simptomlar</h3>
      <label><input type="checkbox" name="syncope"> Hushdan ketish</label><br>
      <label><input type="checkbox" name="edema"> Oyoq shishi</label><br>
      <label><input type="checkbox" name="orthopnea"> Yotganda nafas yetmasligi</label><br><br>

      <h3>📊 Hayotiy ko‘rsatkichlar</h3>
      HR: <input type="number" name="hr" required><br><br>
      SYS: <input type="number" name="sys" required><br><br>
      DIA: <input type="number" name="dia" required><br><br>

      <button>🧠 AI tahlil</button>
    </form>

    <br><a href="/dashboard">⬅️ Ortga</a>
  `);
});


app.post("/analysis", requireLogin, (req, res) => {
  let score = 0;

  // BMI hisoblash
  const weight = Number(req.body.weight);
  const heightM = Number(req.body.height) / 100;
  const bmi = weight / (heightM * heightM);

  if (bmi >= 30) score += 2;
  if (bmi >= 35) score += 4;

  // Yengil simptomlar
  if (req.body.fatigue) score += 1;
  if (req.body.palpitation) score += 1;

  // O‘rta
  if (req.body.dyspnea) score += 2;
  if (req.body.chest_pain) score += 2;
  if (req.body.dizziness) score += 2;

  // Og‘ir
  if (req.body.syncope) score += 4;
  if (req.body.edema) score += 3;
  if (req.body.orthopnea) score += 4;

  // HR
  if (req.body.hr > 100) score += 2;
  if (req.body.hr > 120) score += 4;
  if (req.body.hr < 50) score += 3;

  // Qon bosimi
  if (req.body.sys >= 140 || req.body.dia >= 90) score += 3;
  if (req.body.sys >= 180 || req.body.dia >= 110) score += 6;

  let risk = "YASHIL";
  if (score >= 6) risk = "KOK";
  if (score >= 11) risk = "QIZIL";
  if (score >= 16) risk = "QORA";

  const meta = riskMeta(risk);

  // AI dataset uchun simptomlar
  const inputSymptoms = {
    holsizlik: !!req.body.fatigue,
    tez_charchash: !!req.body.fatigue,
    tez_yurak_urishi: req.body.hr > 100,
    kokrak_ogrigi: !!req.body.chest_pain,
    bosh_aylanishi: !!req.body.dizziness,
    hushdan_ketish: !!req.body.syncope,
    nafas_qisilishi: !!req.body.dyspnea
  };

  const adultResults = analyzeWithDataset(
    inputSymptoms,
    pediatricData.acquired,
    3
  );

  res.send(`
    <body style="background:${meta.color};font-family:Arial;padding:20px">
      <h1>🧠 Kattalar yurak AI xulosasi</h1>

      <h2>${meta.label}</h2>

      <p><b>Umumiy risk ball:</b> ${score}</p>
      <p><b>BMI:</b> ${bmi.toFixed(1)}</p>

      <h3>🩺 Ehtimoliy tashxislar</h3>
      <ul>
        ${adultResults.map(d =>
          `<li>${d.name} — <b>${d.percent}%</b></li>`
        ).join("")}
      </ul>

      ${risk === "QORA"
        ? "<h2 style='color:red'>🚑 ZUDLIK BILAN KARDIOLOGGA MUROJAAT QILING</h2>"
        : ""
      }

      <br><a href="/analysis">⬅️ Qayta baholash</a>
    </body>
  `);
});

/* ================== CHD ================== */
app.get("/chd-analysis", requireLogin, (req, res) => {
  res.send(`
    <h1>🫀 Bolalar yurak skriningi (0–18 yosh)</h1>

    <form method="POST">
      <h3>👶 Bola ma’lumotlari</h3>
      Yosh (oy/yil): <input name="age" required><br><br>
      Vazn (kg): <input type="number" name="weight" required><br><br>
      Bo‘yi (cm): <input type="number" name="height" required><br><br>

      <h3>🫁 Klinik simptomlar</h3>

      Emishda charchash:
      <select name="feeding">
        <option value="0">Yo‘q</option>
        <option value="1">Yengil</option>
        <option value="2">O‘rta</option>
        <option value="3">Og‘ir</option>
      </select><br><br>

      Nafas qisilishi:
      <select name="dyspnea">
        <option value="0">Yo‘q</option>
        <option value="1">Yengil</option>
        <option value="2">O‘rta</option>
        <option value="3">Og‘ir</option>
      </select><br><br>

      Sianoz (lab / barmoq):
      <select name="cyanosis">
        <option value="0">Yo‘q</option>
        <option value="2">Vaqti-vaqti bilan</option>
        <option value="4">Doimiy</option>
      </select><br><br>

      <h3>📊 Hayotiy ko‘rsatkichlar</h3>
      HR (yurak urishi): <input type="number" name="hr" required><br><br>
      SpO₂ (%): <input type="number" name="spo2"><br><br>

      <button>🧠 AI baholash</button>
    </form>

    <br><a href="/dashboard">⬅️ Ortga</a>
  `);
});


app.post("/chd-analysis", requireLogin, (req, res) => {
  let score = 0;

  // Og‘irlik bo‘yicha ball
  score += Number(req.body.feeding) * 2;
  score += Number(req.body.dyspnea) * 2;
  score += Number(req.body.cyanosis);

  // Yurak urishi
  if (req.body.hr > 160) score += 3;
  if (req.body.hr > 180) score += 5;

  // SpO2
  if (req.body.spo2 && req.body.spo2 < 94) score += 2;
  if (req.body.spo2 && req.body.spo2 < 90) score += 4;

  // Vazn kamligi (taxminiy)
  if (req.body.weight < 10) score += 2;

  let risk = "YASHIL";
  if (score >= 6) risk = "KOK";
  if (score >= 10) risk = "QIZIL";
  if (score >= 15) risk = "QORA";

  const meta = riskMeta(risk);

  // AI uchun simptomlar
  const inputSymptoms = {
    tez_charchash: Number(req.body.feeding) >= 2,
    sianoz: Number(req.body.cyanosis) > 0,
    tez_nafas: Number(req.body.dyspnea) >= 2,
    tez_yurak_urishi: req.body.hr > 150,
    holsizlik: true
  };

  const congenital = analyzeWithDataset(
    inputSymptoms,
    pediatricData.congenital,
    3
  );

  const acquired = analyzeWithDataset(
    inputSymptoms,
    pediatricData.acquired,
    3
  );

  res.send(`
    <body style="background:${meta.color};font-family:Arial;padding:20px">
      <h1>🫀 Bolalar CHD AI xulosasi</h1>

      <h2>${meta.label}</h2>
      <p><b>Umumiy ball:</b> ${score}</p>

      <h3>🧬 Tug‘ma yurak nuqsonlari (AI)</h3>
      <ul>
        ${congenital.map(d =>
          `<li>${d.name} — <b>${d.percent}%</b></li>`
        ).join("")}
      </ul>

      <h3>🩺 Orttirilgan yurak kasalliklari (AI)</h3>
      <ul>
        ${acquired.map(d =>
          `<li>${d.name} — <b>${d.percent}%</b></li>`
        ).join("")}
      </ul>

      ${risk === "QORA"
        ? "<h2 style='color:red'>🚨 ZUDLIK BILAN KARDIOLOGGA YO‘NALTIRISH</h2>"
        : ""
      }

      <br><a href="/chd-analysis">⬅️ Qayta baholash</a>
    </body>
  `);
});


/* ================== LOGOUT ================== */
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

app.get("/", (req, res) => {
  res.send("Milly CardioBase API is running 🚀");
});
// 🔥 CATCH ALL — 100% ishlaydi
app.use((req, res) => {
  res.status(200).send("API WORKING OK 🚀");
});
/* ================== SERVER ================== */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server ishlayapti:", PORT);
});

# Stocky — Your Investments Buddy

אפליקציית ניתוח מניות עם ניתוח טכני ופנדמנטלי בזמן אמת.

---

## העלאה לאוויר — 4 שלבים

### שלב 1 — GitHub

1. כנס ל-[github.com](https://github.com) → **New repository** → שם: `stocky` → Public → **Create**
2. הרץ בתיקיית הפרויקט:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/stocky.git
git push -u origin main
```

---

### שלב 2 — Vercel

1. כנס ל-[vercel.com](https://vercel.com) → **Add New Project**
2. בחר את ה-repo `stocky` מ-GitHub
3. Framework: **Vite** (Vercel יזהה אוטומטית)
4. לחץ **Deploy**

---

### שלב 3 — Perplexity API Key

1. כנס ל-[perplexity.ai/settings/api](https://perplexity.ai/settings/api) → **Generate**
2. ב-Vercel: **Project Settings → Environment Variables**
3. הוסף:
   - Name: `PERPLEXITY_API_KEY`
   - Value: `<המפתח שקיבלת>`
4. לחץ **Save** → **Redeploy**

---

### שלב 4 — בדיקה

פתח `https://stocky.vercel.app` → הוסף מניה → הנתונים יגיעו מ-Perplexity

---

## הרצה מקומית

```bash
npm install
npm run dev
```

> מקומית הנתונים הפנדמנטליים יהיו demo — Perplexity פועל רק על הסרבר.
> נתוני המניה (מחיר, גרף) מגיעים מ-Yahoo Finance.

---

## מבנה הפרויקט

```
src/
├── App.jsx                    ← ראשי
├── components/                ← UI components
│   ├── Header.jsx
│   ├── ChartCard.jsx
│   ├── PatternsCard.jsx
│   ├── FundamentalCard.jsx
│   ├── WatchlistBar.jsx
│   ├── EmptyState.jsx
│   ├── SettingsModal.jsx
│   └── ui/
│       ├── Badges.jsx
│       └── PatternMiniChart.jsx
├── constants/                 ← tokens, i18n, patterns
└── utils/
    ├── api.js                 ← data fetching
    └── technical.js           ← pattern detection
api/
└── perplexity.js              ← serverless proxy (Vercel)
```

# היומית — עיתון חדשות יומי בעברית

אתר חדשות שמתפקד כעיתון דיגיטלי יומי: מהדורה אחת סגורה ליום, לא Feed בזמן אמת.

## טכנולוגיה

- **Frontend/API**: Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Database**: Neon (Postgres serverless, HTTP driver — `@neondatabase/serverless`)
- **Hosting**: Netlify (`@netlify/plugin-nextjs`)
- **Auth**: Bearer API key לכתיבה ב-API, session cookie (JWT) לממשק הניהול

## הרצה מקומית

```bash
npm install
cp .env.example .env.local   # ומילוי הערכים
npm run dev
```

### משתני סביבה (`.env.local`)

| משתנה | תיאור |
|---|---|
| `DATABASE_URL` | connection string של Neon Postgres |
| `NEWS_API_KEY` | מפתח סודי לכתיבה ב-`/api/news` (Bearer token) |
| `ADMIN_PASSWORD` | סיסמת הכניסה ל-`/admin` |
| `ADMIN_SESSION_SECRET` | סוד לחתימת ה-session cookie של הניהול |
| `SITE_URL` | כתובת הבסיס של האתר (ל-SEO/OG) |

## API

כל הכתיבה דורשת `Authorization: Bearer <NEWS_API_KEY>`. הקריאה ציבורית.

- `POST /api/news` — יצירת מהדורה חדשה (ראו `EditionInput` ב-`lib/types.ts`). נכשל עם `409` אם כבר קיימת מהדורה לאותו תאריך.
- `GET /api/news?date=YYYY-MM-DD` — מהדורה לפי תאריך
- `GET /api/news?latest=true` — המהדורה האחרונה שפורסמה
- `GET /api/news?archive=true` — רשימת כל תאריכי המהדורות
- `PATCH /api/news/:date` — עדכון כותרת / "היום בקצרה" / ידיעה ראשית
- `DELETE /api/news/:date` — מחיקת מהדורה
- `PATCH /api/news/:date/articles/:id` — עדכון ידיעה
- `DELETE /api/news/:date/articles/:id` — מחיקת ידיעה
- `POST /api/news/:date/reorder` — שינוי סדר ידיעות בתוך מדור (`{ category, orderedIds[] }`)

## ממשק ניהול

`/admin` (מוגן בסיסמה מ-`ADMIN_PASSWORD`): רשימת מהדורות, עריכת "היום בקצרה", כותרת, ידיעה ראשית, עריכה/מחיקה/שינוי סדר של ידיעות בתוך כל מדור.

## פריסה (Netlify)

1. חברו את הריפו ל-Netlify (הבילד מוגדר כבר ב-`netlify.toml`).
2. הגדירו את משתני הסביבה שלמעלה בהגדרות ה-Site.
3. ודאו ש-`SITE_URL` מוגדר לדומיין הסופי.

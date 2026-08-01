# Quizloft — Cloud Online Quiz System

A full online quiz platform with login/register, an admin panel to build quizzes,
a student dashboard, a countdown timer per quiz, and a live leaderboard — backed
by **Firebase Authentication** and **Firebase Firestore**. Plain HTML/CSS/JS, no
build tools required.

## Folder structure

```
quizloft/
├── firebase.json          Firebase Hosting config (optional)
├── firestore.rules        Firestore security rules
├── README.md
└── public/
    ├── index.html          Login page
    ├── register.html       Sign up page
    ├── student-dashboard.html
    ├── admin-dashboard.html
    ├── quiz.html            Quiz-taking screen (with timer)
    ├── leaderboard.html
    ├── css/
    │   └── style.css
    └── js/
        ├── firebase-config.js   <-- put YOUR Firebase keys here
        ├── auth-guard.js        role-based route protection
        ├── login.js
        ├── register.js
        ├── student.js
        ├── admin.js
        ├── quiz.js
        └── leaderboard.js
```

## 1. Create a Firebase project

1. Go to https://console.firebase.google.com → **Add project**.
2. In **Build → Authentication → Sign-in method**, enable **Email/Password**.
3. In **Build → Firestore Database**, click **Create database** (start in production mode).
4. In **Project settings → General → Your apps**, click the web icon `</>` to register a web app and copy the config object.

## 2. Add your config

Open `public/js/firebase-config.js` and paste your keys:

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};
```

## 3. Deploy Firestore rules

Install the Firebase CLI once: `npm install -g firebase-tools`

```
firebase login
firebase init firestore   # point it at this folder, keep firestore.rules
firebase deploy --only firestore:rules
```

## 4. Run it

Any static server works. Easiest options:

- **Firebase Hosting:** `firebase init hosting` (set public dir to `public`), then `firebase deploy`
- **Local test:** `npx serve public` or the VS Code "Live Server" extension
- **GitHub Pages:** push this repo, enable Pages, set source to `/public`

> Firebase Auth requires the domain you're serving from to be in
> **Authentication → Settings → Authorized domains**. `localhost` is allowed by default.

## Data model (Firestore)

| Collection | Document | Fields |
|---|---|---|
| `users` | `{uid}` | `name, email, role ('admin' \| 'student'), createdAt` |
| `quizzes` | `{quizId}` | `title, description, durationMinutes, createdBy, createdAt` |
| `quizzes/{quizId}/questions` | `{questionId}` | `text, options[4], correctIndex` |
| `results` | `{resultId}` | `quizId, quizTitle, studentId, studentName, score, total, timeTakenSec, submittedAt` |

## Roles

- **Register** lets a new user pick "Student" or "Admin" for demo purposes. In a
  real production app you'd remove the admin option from the public form and
  promote admins manually from the Firebase console (Firestore → `users` → set
  `role: "admin"`), or via a protected Cloud Function.
- **Admins** land on `admin-dashboard.html`: create quizzes, add questions, delete quizzes.
- **Students** land on `student-dashboard.html`: browse quizzes, take them with a timer, see their own past scores.
- **Leaderboard** (`leaderboard.html`) is open to both roles — pick a quiz, see ranked scores.

## Firestore composite indexes

A couple of queries (results filtered by student + ordered by date, and the
leaderboard's score+time ordering) need composite indexes. Firestore is smart
about this: the first time you run the app and hit one of these screens, if
an index is missing you'll see an error in the browser console with a direct
link that creates the exact index for you in one click. Just open that link,
click **Create index**, wait a minute, and reload.

## Notes

- Passwords are handled entirely by Firebase Auth — never stored in Firestore.
- The quiz timer auto-submits whatever is answered when it reaches zero.
- Leaderboard ranks by score (desc), then by time taken (asc) as a tiebreaker.

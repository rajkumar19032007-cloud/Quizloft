requireRole(["student"]).then((profile) => {
  document.getElementById("student-name").textContent = profile.name.split(" ")[0];
  loadQuizzes();
  loadMyResults(profile.uid);
});

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

async function loadQuizzes() {
  const listEl = document.getElementById("quiz-list");
  const snap = await db.collection("quizzes").orderBy("createdAt", "desc").get();

  if (snap.empty) {
    listEl.innerHTML = '<div class="empty">No quizzes are available yet — check back soon.</div>';
    return;
  }

  listEl.innerHTML = snap.docs.map((doc) => {
    const q = doc.data();
    return `
      <div class="item">
        <div>
          <div class="title">${escapeHtml(q.title)}</div>
          <div class="meta">${escapeHtml(q.description || "No description")} · ${q.durationMinutes} min</div>
        </div>
        <button class="primary" onclick="location.href='quiz.html?id=${doc.id}'">Start quiz</button>
      </div>
    `;
  }).join("");
}

async function loadMyResults(uid) {
  const listEl = document.getElementById("my-results");
  const snap = await db.collection("results")
    .where("studentId", "==", uid)
    .orderBy("submittedAt", "desc")
    .limit(20)
    .get();

  if (snap.empty) {
    listEl.innerHTML = '<div class="empty">You haven\'t taken any quizzes yet.</div>';
    return;
  }

  listEl.innerHTML = snap.docs.map((doc) => {
    const r = doc.data();
    const pct = Math.round((r.score / r.total) * 100);
    return `
      <div class="item">
        <div>
          <div class="title">${escapeHtml(r.quizTitle)}</div>
          <div class="meta">${r.score}/${r.total} correct (${pct}%) · ${formatTime(r.timeTakenSec)}</div>
        </div>
      </div>
    `;
  }).join("");
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

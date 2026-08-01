requireRole(["admin", "student"]).then((profile) => {
  document.getElementById("role-badge").textContent = profile.role === "admin" ? "Admin" : "Student";
  document.getElementById("dashboard-link").href =
    profile.role === "admin" ? "admin-dashboard.html" : "student-dashboard.html";
  loadQuizSelect();
});

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

async function loadQuizSelect() {
  const select = document.getElementById("quiz-select");
  const snap = await db.collection("quizzes").orderBy("createdAt", "desc").get();

  if (snap.empty) {
    select.innerHTML = '<option value="">No quizzes yet</option>';
    return;
  }

  select.innerHTML =
    '<option value="">Select a quiz…</option>' +
    snap.docs.map((doc) => `<option value="${doc.id}">${escapeHtml(doc.data().title)}</option>`).join("");

  select.addEventListener("change", () => loadBoard(select.value));

  // Support deep-linking via ?quiz=<id> from the results screen
  const preselect = new URLSearchParams(window.location.search).get("quiz");
  if (preselect) {
    select.value = preselect;
    loadBoard(preselect);
  }
}

async function loadBoard(quizId) {
  const boardEl = document.getElementById("board");
  if (!quizId) {
    boardEl.innerHTML = '<div class="empty">Pick a quiz to see rankings.</div>';
    return;
  }

  boardEl.innerHTML = '<div class="empty">Loading…</div>';

  const snap = await db.collection("results")
    .where("quizId", "==", quizId)
    .limit(50)
    .get();

  if (snap.empty) {
    boardEl.innerHTML = '<div class="empty">No attempts yet for this quiz.</div>';
    return;
  }

  const rows = snap.docs.map((doc, i) => {
    const r = doc.data();
    const rankClass = i === 0 ? "rank gold" : "rank";
    return `
      <tr>
        <td class="${rankClass}">${i + 1}</td>
        <td>${escapeHtml(r.studentName)}</td>
        <td>${r.score}/${r.total}</td>
        <td>${formatTime(r.timeTakenSec)}</td>
      </tr>
    `;
  }).join("");

  boardEl.innerHTML = `
    <table class="leaderboard">
      <thead><tr><th>#</th><th>Student</th><th>Score</th><th>Time</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

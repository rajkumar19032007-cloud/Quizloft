requireRole(["admin", "student"]).then((profile) => {
  document.getElementById("role-badge").textContent =
    profile.role === "admin" ? "Admin" : "Student";

  document.getElementById("dashboard-link").href =
    profile.role === "admin"
      ? "admin-dashboard.html"
      : "student-dashboard.html";

  loadQuizSelect();
});

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

async function loadQuizSelect() {
  const select = document.getElementById("quiz-select");

  const snap = await db
    .collection("quizzes")
    .orderBy("createdAt", "desc")
    .get();

  if (snap.empty) {
    select.innerHTML = '<option value="">No quizzes yet</option>';
    return;
  }

  select.innerHTML =
    '<option value="">Select a quiz…</option>' +
    snap.docs
      .map(
        (doc) =>
          `<option value="${doc.id}">${escapeHtml(
            doc.data().title
          )}</option>`
      )
      .join("");

  select.addEventListener("change", () => loadBoard(select.value));

  const preselect = new URLSearchParams(window.location.search).get("quiz");

  if (preselect) {
    select.value = preselect;
    loadBoard(preselect);
  }
}

async function loadBoard(quizId) {
  const boardEl = document.getElementById("board");

  if (!quizId) {
    boardEl.innerHTML =
      '<div class="empty">Pick a quiz to see rankings.</div>';
    return;
  }

  boardEl.innerHTML = '<div class="empty">Loading...</div>';

  const snap = await db
    .collection("results")
    .where("quizId", "==", quizId)
    .get();

  if (snap.empty) {
    boardEl.innerHTML =
      '<div class="empty">No attempts yet for this quiz.</div>';
    return;
  }

  const results = snap.docs.map((doc) => doc.data());

  // Sort by score first, then time
  results.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.timeTakenSec - b.timeTakenSec;
  });
    const rows = results
    .map((r, i) => {
      let rankClass = "rank";

      if (i === 0) rankClass = "rank gold";
      else if (i === 1) rankClass = "rank silver";
      else if (i === 2) rankClass = "rank bronze";

      return `
        <tr>
          <td class="${rankClass}">${i + 1}</td>
          <td>${escapeHtml(r.studentName)}</td>
          <td>${r.score}/${r.total}</td>
          <td>${formatTime(r.timeTakenSec)}</td>
        </tr>
      `;
    })
    .join("");

  boardEl.innerHTML = `
    <table class="leaderboard">
      <thead>
        <tr>
          <th>#</th>
          <th>Student</th>
          <th>Score</th>
          <th>Time</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

function formatTime(sec) {
  sec = Number(sec) || 0;

  const m = Math.floor(sec / 60);
  const s = sec % 60;

  return `${m}m ${s}s`;
}

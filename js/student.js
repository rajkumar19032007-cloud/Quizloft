requireRole(["student"]).then((profile) => {
  document.getElementById("student-name").textContent =
    profile.name.split(" ")[0];

  loadQuizzes();
  loadMyResults(profile.uid);
});


function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}


// Load available quizzes
async function loadQuizzes() {
  const listEl = document.getElementById("quiz-list");

  try {
    const snap = await db.collection("quizzes")
      .orderBy("createdAt", "desc")
      .get();

    if (snap.empty) {
      listEl.innerHTML =
        '<div class="empty">No quizzes are available yet.</div>';
      return;
    }

    listEl.innerHTML = snap.docs.map((doc) => {
      const q = doc.data();

      return `
        <div class="item">
          <div>
            <div class="title">${escapeHtml(q.title)}</div>
            <div class="meta">
              ${escapeHtml(q.description || "No description")} · 
              ${q.durationMinutes} min
            </div>
          </div>

          <button class="primary"
          onclick="location.href='quiz.html?id=${doc.id}'">
          Start quiz
          </button>
        </div>
      `;
    }).join("");

  } catch(error) {
    console.error("QUIZ ERROR:", error);
    listEl.innerHTML =
      '<div class="empty">Unable to load quizzes.</div>';
  }
}


// Load student's past results
async function loadMyResults(uid) {

  const listEl = document.getElementById("my-results");

  try {

    console.log("Loading results for UID:", uid);

    const snap = await db.collection("results")
      .where("studentId", "==", uid)
      .get();


    console.log("Results found:", snap.size);


    if (snap.empty) {

      listEl.innerHTML =
      '<div class="empty">You haven\'t taken any quizzes yet.</div>';

      return;
    }


    let results = snap.docs.map(doc => doc.data());


    // Latest result first
    results.sort((a,b) => {
      return b.submittedAt.seconds - a.submittedAt.seconds;
    });


    listEl.innerHTML = results.map((r)=>{

      const percentage =
      Math.round((r.score / r.total) * 100);


      return `
        <div class="item">

          <div>

            <div class="title">
              ${escapeHtml(r.quizTitle)}
            </div>

            <div class="meta">
              ${r.score}/${r.total} correct 
              (${percentage}%)
              · ${formatTime(r.timeTakenSec)}
            </div>

          </div>

        </div>
      `;

    }).join("");


  } catch(error) {

    console.error("RESULT ERROR:", error);

    listEl.innerHTML =
    `<div class="empty">
      Error: ${error.message}
    </div>`;

  }
}



function formatTime(sec) {

  const m = Math.floor(sec / 60);
  const s = sec % 60;

  return `${m}m ${s}s`;
}

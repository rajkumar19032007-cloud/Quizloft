let currentAdmin = null;

requireRole(["admin"]).then((profile) => {
  currentAdmin = profile;
  loadQuizSelect();
  loadQuizList();
});

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function setMsg(id, text, ok = false) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = "msg " + (ok ? "ok" : "err");
}

async function createQuiz() {
  const title = document.getElementById("quiz-title").value.trim();
  const description = document.getElementById("quiz-desc").value.trim();
  const durationMinutes = parseInt(document.getElementById("quiz-duration").value, 10);

  if (!title || !durationMinutes || durationMinutes < 1) {
    setMsg("quiz-msg", "Give the quiz a title and a valid time limit.");
    return;
  }

  setMsg("quiz-msg", "Creating…", true);

  try {
    await db.collection("quizzes").add({
      title,
      description,
      durationMinutes,
      createdBy: currentAdmin.uid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    document.getElementById("quiz-title").value = "";
    document.getElementById("quiz-desc").value = "";
    document.getElementById("quiz-duration").value = "10";
    setMsg("quiz-msg", "Quiz created.", true);
    loadQuizSelect();
    loadQuizList();
  } catch (err) {
    setMsg("quiz-msg", err.message);
  }
}

async function loadQuizSelect() {
  const select = document.getElementById("quiz-select");
  const snap = await db.collection("quizzes").orderBy("createdAt", "desc").get();

  if (snap.empty) {
    select.innerHTML = '<option value="">Create a quiz first</option>';
    return;
  }

  select.innerHTML = snap.docs
    .map((doc) => `<option value="${doc.id}">${escapeHtml(doc.data().title)}</option>`)
    .join("");
}

async function addQuestion() {
  const quizId = document.getElementById("quiz-select").value;
  const text = document.getElementById("qtext").value.trim();
  const optEls = Array.from(document.querySelectorAll(".opt"));
  const options = optEls.map((o) => o.value.trim());
  const correctIndex = parseInt(document.querySelector('input[name=correct]:checked').value, 10);

  if (!quizId) {
    setMsg("question-msg", "Create or select a quiz first.");
    return;
  }
  if (!text || options.some((o) => !o)) {
    setMsg("question-msg", "Fill in the question and all four options.");
    return;
  }

  setMsg("question-msg", "Adding…", true);

  try {
    await db.collection("quizzes").doc(quizId).collection("questions").add({
      text,
      options,
      correctIndex
    });
    document.getElementById("qtext").value = "";
    optEls.forEach((o) => (o.value = ""));
    document.querySelector('input[name=correct][value="0"]').checked = true;
    setMsg("question-msg", "Question added.", true);
    loadQuizList();
  } catch (err) {
    setMsg("question-msg", err.message);
  }
}

async function loadQuizList() {
  const listEl = document.getElementById("quiz-list");
  const snap = await db.collection("quizzes").orderBy("createdAt", "desc").get();

  if (snap.empty) {
    listEl.innerHTML = '<div class="empty">No quizzes yet — create one above.</div>';
    return;
  }

  const rows = await Promise.all(snap.docs.map(async (doc) => {
    const q = doc.data();
    const qCount = (await db.collection("quizzes").doc(doc.id).collection("questions").get()).size;
    return `
      <div class="item">
        <div>
          <div class="title">${escapeHtml(q.title)}</div>
          <div class="meta">${qCount} question${qCount === 1 ? "" : "s"} · ${q.durationMinutes} min</div>
        </div>
        <button class="danger" onclick="deleteQuiz('${doc.id}')">Delete</button>
      </div>
    `;
  }));

  listEl.innerHTML = rows.join("");
}

async function deleteQuiz(quizId) {
  if (!confirm("Delete this quiz and all its questions? This can't be undone.")) return;

  const questionsSnap = await db.collection("quizzes").doc(quizId).collection("questions").get();
  const batch = db.batch();
  questionsSnap.docs.forEach((doc) => batch.delete(doc.ref));
  batch.delete(db.collection("quizzes").doc(quizId));
  await batch.commit();

  loadQuizSelect();
  loadQuizList();
}

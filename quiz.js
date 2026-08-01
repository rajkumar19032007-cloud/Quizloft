let currentStudent = null;
let quizId = null;
let quizData = null;
let questions = [];
let session = { index: 0, answers: [] };
let timerInterval = null;
let secondsRemaining = 0;
let startedAt = null;

const params = new URLSearchParams(window.location.search);
quizId = params.get("id");

requireRole(["student"]).then(async (profile) => {
  currentStudent = profile;
  if (!quizId) {
    document.getElementById("loading").textContent = "No quiz specified.";
    return;
  }
  await loadQuiz();
});

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

async function loadQuiz() {
  const quizDoc = await db.collection("quizzes").doc(quizId).get();
  if (!quizDoc.exists) {
    document.getElementById("loading").textContent = "This quiz no longer exists.";
    return;
  }
  quizData = quizDoc.data();

  const qSnap = await db.collection("quizzes").doc(quizId).collection("questions").get();
  questions = qSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  if (questions.length === 0) {
    document.getElementById("loading").textContent = "This quiz has no questions yet.";
    return;
  }

  document.getElementById("loading").style.display = "none";
  document.getElementById("intro-title").textContent = quizData.title;
  document.getElementById("intro-desc").textContent = quizData.description || "";
  document.getElementById("intro-meta").textContent =
    `${questions.length} questions · ${quizData.durationMinutes} minute time limit`;
  document.getElementById("quiz-intro").style.display = "block";
}

function startQuiz() {
  document.getElementById("quiz-intro").style.display = "none";
  document.getElementById("quiz-question").style.display = "block";

  session = { index: 0, answers: [] };
  secondsRemaining = quizData.durationMinutes * 60;
  startedAt = Date.now();

  renderQuestion();
  updateTimerDisplay();
  timerInterval = setInterval(tick, 1000);
}

function tick() {
  secondsRemaining--;
  updateTimerDisplay();
  if (secondsRemaining <= 0) {
    clearInterval(timerInterval);
    finishQuiz(); // auto-submit
  }
}

function updateTimerDisplay() {
  const m = Math.floor(Math.max(secondsRemaining, 0) / 60);
  const s = Math.max(secondsRemaining, 0) % 60;
  const el = document.getElementById("timer");
  el.textContent = `⏱ ${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  el.classList.toggle("low", secondsRemaining <= 30);
}

function renderQuestion() {
  const q = questions[session.index];
  document.getElementById("q-eyebrow").textContent = `Question ${session.index + 1} of ${questions.length}`;
  document.getElementById("q-text").textContent = q.text;
  document.getElementById("progress-bar").style.width = `${(session.index / questions.length) * 100}%`;

  const choicesEl = document.getElementById("q-choices");
  choicesEl.innerHTML = q.options.map((opt, i) => `
    <button class="choice" data-i="${i}" onclick="selectChoice(${i})">${escapeHtml(opt)}</button>
  `).join("");

  // Restore previous selection if navigating back isn't supported (linear quiz),
  // but keep button state consistent if re-rendered.
  const nextBtn = document.getElementById("next-btn");
  nextBtn.textContent = session.index === questions.length - 1 ? "Submit quiz" : "Next";
}

function selectChoice(i) {
  session.answers[session.index] = i;
  document.querySelectorAll(".choice").forEach((el) => {
    el.classList.toggle("selected", parseInt(el.dataset.i, 10) === i);
  });
}

function nextQuestion() {
  if (session.index < questions.length - 1) {
    session.index++;
    renderQuestion();
  } else {
    clearInterval(timerInterval);
    finishQuiz();
  }
}

async function finishQuiz() {
  document.getElementById("quiz-question").style.display = "none";
  document.getElementById("quiz-results").style.display = "block";

  const timeTakenSec = Math.round((Date.now() - startedAt) / 1000);
  let correctCount = 0;

  const reviewHtml = questions.map((q, i) => {
    const chosen = session.answers[i];
    const answered = chosen !== undefined && chosen !== null;
    const isCorrect = answered && chosen === q.correctIndex;
    if (isCorrect) correctCount++;
    return `
      <div class="item" style="display:block;">
        <div class="title" style="font-size:15px;">${i + 1}. ${escapeHtml(q.text)}</div>
        <div class="meta">
          Your answer: ${answered ? escapeHtml(q.options[chosen]) : "No answer (time ran out)"}
          ${!isCorrect ? " · Correct: " + escapeHtml(q.options[q.correctIndex]) : ""}
        </div>
      </div>
    `;
  }).join("");

  document.getElementById("score-num").textContent = `${correctCount}/${questions.length}`;
  document.getElementById("time-taken").textContent = formatTime(timeTakenSec);
  document.getElementById("review-list").innerHTML = reviewHtml;

  try {
    await db.collection("results").add({
      quizId,
      quizTitle: quizData.title,
      studentId: currentStudent.uid,
      studentName: currentStudent.name,
      score: correctCount,
      total: questions.length,
      timeTakenSec,
      submittedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (err) {
    console.error("Could not save result:", err);
  }
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

// Guard against navigating away mid-quiz and losing the timer silently.
window.addEventListener("beforeunload", (e) => {
  if (timerInterval) {
    e.preventDefault();
    e.returnValue = "";
  }
});

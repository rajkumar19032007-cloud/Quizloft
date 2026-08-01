let currentStudent = null;
let quizId = null;
let quizData = null;
let questions = [];

let session = {
  index: 0,
  answers: []
};

let timerInterval = null;
let secondsRemaining = 0;
let startedAt = null;


const params = new URLSearchParams(window.location.search);
quizId = params.get("id");



requireRole(["student"]).then(async (profile) => {

  currentStudent = profile;

  if (!quizId) {

    document.getElementById("loading").textContent =
    "No quiz specified.";

    return;

  }

  await loadQuiz();

});



function escapeHtml(str) {

  const div = document.createElement("div");

  div.textContent = str || "";

  return div.innerHTML;

}




async function loadQuiz() {

  try {


    const quizDoc = await db.collection("quizzes")
      .doc(quizId)
      .get();



    if (!quizDoc.exists) {

      document.getElementById("loading").textContent =
      "This quiz no longer exists.";

      return;

    }



    quizData = quizDoc.data();



    const qSnap = await db.collection("quizzes")
      .doc(quizId)
      .collection("questions")
      .get();



    questions = qSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));



    if (questions.length === 0) {

      document.getElementById("loading").textContent =
      "This quiz has no questions yet.";

      return;

    }



    document.getElementById("loading").style.display =
    "none";



    document.getElementById("intro-title").textContent =
    quizData.title;



    document.getElementById("intro-desc").textContent =
    quizData.description || "";



    document.getElementById("intro-meta").textContent =
    `${questions.length} questions · ${quizData.durationMinutes || 0} minute time limit`;



    document.getElementById("quiz-intro").style.display =
    "block";



  } catch(error) {


    console.error(error);


    document.getElementById("loading").textContent =
    "Unable to load quiz.";

  }

}




function startQuiz() {


  document.getElementById("quiz-intro").style.display =
  "none";


  document.getElementById("quiz-question").style.display =
  "block";



  session = {
    index: 0,
    answers: []
  };



  secondsRemaining =
  (quizData.durationMinutes || 10) * 60;



  startedAt = Date.now();



  renderQuestion();


  updateTimerDisplay();


  timerInterval = setInterval(tick,1000);

}




function tick() {


  secondsRemaining--;


  updateTimerDisplay();



  if(secondsRemaining <= 0){

    clearInterval(timerInterval);

    finishQuiz();

  }

}




function updateTimerDisplay(){

  const timer =
  document.getElementById("timer");


  const m =
  Math.floor(secondsRemaining / 60);


  const s =
  secondsRemaining % 60;



  timer.textContent =
  `⏱ ${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;

}





function renderQuestion(){


  const q = questions[session.index];



  document.getElementById("q-eyebrow").textContent =
  `Question ${session.index + 1} of ${questions.length}`;



  document.getElementById("q-text").textContent =
  q.text;



  document.getElementById("progress-bar").style.width =
  `${((session.index + 1) / questions.length) * 100}%`;



  document.getElementById("q-choices").innerHTML =
  q.options.map((opt,index)=>`

    <button class="choice"
    data-i="${index}"
    onclick="selectChoice(${index})">

    ${escapeHtml(opt)}

    </button>

  `).join("");



  document.getElementById("next-btn").textContent =
  session.index === questions.length - 1
  ? "Submit quiz"
  : "Next";


}




function selectChoice(index){


  session.answers[session.index] = index;



  document.querySelectorAll(".choice")
  .forEach(btn=>{

    btn.classList.toggle(
      "selected",
      Number(btn.dataset.i) === index
    );

  });


}




function nextQuestion(){


  if(session.index < questions.length - 1){

    session.index++;

    renderQuestion();


  } else {

    clearInterval(timerInterval);

    finishQuiz();

  }

}





async function finishQuiz(){


  document.getElementById("quiz-question").style.display =
  "none";


  document.getElementById("quiz-results").style.display =
  "block";



  const timeTakenSec =
  Math.round((Date.now()-startedAt)/1000);



  let correctCount = 0;



  const reviewHtml = questions.map((q,i)=>{


    const selected =
    session.answers[i];


    const correct =
    selected === q.correctIndex;



    if(correct)
    correctCount++;



    return `

    <div class="item">

      <div class="title">

      ${i+1}. ${escapeHtml(q.text)}

      </div>

      <div class="meta">

      Your answer:
      ${
        selected !== undefined
        ? escapeHtml(q.options[selected])
        : "No answer"
      }

      </div>

    </div>

    `;


  }).join("");



  document.getElementById("score-num").textContent =
  `${correctCount}/${questions.length}`;



  document.getElementById("time-taken").textContent =
  formatTime(timeTakenSec);



  document.getElementById("review-list").innerHTML =
  reviewHtml;



  try {


    await db.collection("results").add({

      quizId: quizId,

      quizTitle: quizData.title,

      studentId: currentStudent.uid,

      studentName: currentStudent.name,

      score: correctCount,

      total: questions.length,

      timeTakenSec: timeTakenSec,

      submittedAt:
      firebase.firestore.FieldValue.serverTimestamp()

    });


  } catch(error){

    console.error("Result save error:",error);

  }


}




function formatTime(sec){

  const m = Math.floor(sec/60);

  const s = sec % 60;

  return `${m}m ${s}s`;

}

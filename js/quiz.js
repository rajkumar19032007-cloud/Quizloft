const quizId = new URLSearchParams(window.location.search).get("id");

let quizData = null;
let currentQuestion = 0;


loadQuiz();


async function loadQuiz() {

  try {

    const doc = await db.collection("quizzes")
      .doc(quizId)
      .get();


    if (!doc.exists) {
      document.getElementById("loading").textContent = "Quiz not found";
      return;
    }


    quizData = doc.data();


    document.getElementById("loading").style.display = "none";
    document.getElementById("quiz-intro").style.display = "block";


    document.getElementById("intro-title").textContent =
      quizData.title;


    document.getElementById("intro-desc").textContent =
      quizData.description || "";


    document.getElementById("intro-meta").textContent =
      `${quizData.questions.length} Questions · ${quizData.durationMinutes} min`;


  } catch (error) {

    document.getElementById("loading").textContent =
      "Unable to load quiz";

  }

}



function startQuiz() {

  document.getElementById("quiz-intro").style.display = "none";

  document.getElementById("quiz-question").style.display = "block";


  currentQuestion = 0;

  showQuestion();

}



function showQuestion() {

  const q = quizData.questions[currentQuestion];


  document.getElementById("q-eyebrow").textContent =
    `Question ${currentQuestion + 1}/${quizData.questions.length}`;


  document.getElementById("q-text").textContent =
    q.question;


  document.getElementById("q-choices").innerHTML =
    q.options.map(option => {

      return `
      <label>
        <input type="radio" name="answer" value="${option}">
        ${option}
      </label><br>
      `;

    }).join("");


  document.getElementById("next-btn").textContent =
    currentQuestion === quizData.questions.length - 1
    ? "Submit"
    : "Next";

}



function nextQuestion() {

  const selected =
    document.querySelector('input[name="answer"]:checked');


  if (!selected) {
    alert("Please select an answer");
    return;
  }


  if (currentQuestion < quizData.questions.length - 1) {

    currentQuestion++;
    showQuestion();

  } else {

    document.getElementById("quiz-question").style.display = "none";
    document.getElementById("quiz-results").style.display = "block";

    document.getElementById("score-num").textContent =
      "Quiz Completed";

  }

}

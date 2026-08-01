const quizId = new URLSearchParams(window.location.search).get("id");

let quizData = null;


loadQuiz();


async function loadQuiz() {

  try {

    const doc = await db.collection("quizzes")
      .doc(quizId)
      .get();


    if (!doc.exists) {

      document.getElementById("loading").innerHTML =
      "Quiz not found";

      return;
    }


    quizData = doc.data();


    document.getElementById("loading").style.display = "none";


    document.getElementById("quiz-intro").style.display = "block";


    document.getElementById("intro-title").textContent =
    quizData.title;


    document.getElementById("intro-desc").textContent =
    quizData.description || "No description";


    document.getElementById("intro-meta").textContent =
    `${quizData.questions.length} Questions · ${quizData.durationMinutes} min`;


  }
  catch(error){

    console.error("QUIZ ERROR:", error);

    document.getElementById("loading").innerHTML =
    "Unable to load quiz";

  }

}


function startQuiz(){

  document.getElementById("quiz-intro").style.display = "none";

  document.getElementById("quiz-question").style.display = "block";

}

const quizId = new URLSearchParams(window.location.search).get("id");

let quiz = null;
let current = 0;


loadQuiz();


async function loadQuiz(){

  try{

    const snap = await db.collection("quizzes")
      .doc(quizId)
      .get();


    if(!snap.exists){

      document.getElementById("loading").innerHTML =
      "Quiz not found";

      return;
    }


    quiz = snap.data();


    document.getElementById("loading").style.display="none";

    document.getElementById("quiz-intro").style.display="block";


    document.getElementById("intro-title").textContent =
    quiz.title;


    document.getElementById("intro-desc").textContent =
    quiz.description || "";


    document.getElementById("intro-meta").textContent =
    quiz.durationMinutes + " min";


  }
  catch(e){

    console.log(e);

    document.getElementById("loading").innerHTML =
    "Error loading quiz";

  }

}



function startQuiz(){

  document.getElementById("quiz-intro").style.display="none";

  document.getElementById("quiz-question").style.display="block";

  showQuestion();

}



function showQuestion(){

  let q = quiz.questions[current];


  document.getElementById("q-eyebrow").innerHTML =
  "Question " + (current + 1);


  document.getElementById("q-text").innerHTML =
  q.question;


  document.getElementById("q-choices").innerHTML =
  "";


  q.options.forEach(option=>{

    document.getElementById("q-choices").innerHTML +=
    `
    <label>
      <input type="radio" name="answer" value="${option}">
      ${option}
    </label>
    <br>
    `;

  });


  document.getElementById("next-btn").innerHTML =
  current == quiz.questions.length-1
  ? "Submit"
  : "Next";


}



function nextQuestion(){

  if(current < quiz.questions.length-1){

    current++;

    showQuestion();

  }
  else{

    alert("Quiz completed");

    location.href="student-dashboard.html";

  }

}

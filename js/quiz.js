const quizId = new URLSearchParams(window.location.search).get("id");

const quizTitle = document.getElementById("quiz-title");
const quizContainer = document.getElementById("quiz-container");

loadQuiz();

async function loadQuiz() {

  try {

    const doc = await db.collection("quizzes")
      .doc(quizId)
      .get();


    if (!doc.exists) {

      quizContainer.innerHTML =
      `<div class="empty">
        Quiz not found
      </div>`;

      return;
    }


    const quiz = doc.data();


    quizTitle.textContent = quiz.title;


    quizContainer.innerHTML =
    quiz.questions.map((q,index)=>{

      return `
      <div class="question">

        <h3>
        ${index + 1}. ${q.question}
        </h3>


        ${q.options.map(option=>`

          <label>
            <input 
            type="radio"
            name="q${index}"
            value="${option}">
            ${option}
          </label>

        `).join("")}


      </div>
      `;

    }).join("");


  }
  catch(error){

    console.error("QUIZ ERROR:", error);

    quizContainer.innerHTML =
    `<div class="empty">
      Unable to load quiz
    </div>`;

  }

}

requireRole(["student"]).then((profile) => {

  document.getElementById("student-name").textContent =
    profile.name.split(" ")[0];

  loadQuizzes();
  loadMyResults(profile.uid);

});


// Escape HTML
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}


// ==========================
// LOAD QUIZZES
// ==========================
async function loadQuizzes() {

  const listEl = document.getElementById("quiz-list");

  try {

    const snap = await db.collection("quizzes").get();


    if (snap.empty) {

      listEl.innerHTML =
      `<div class="empty">
        No quizzes are available yet.
      </div>`;

      return;
    }


    listEl.innerHTML = snap.docs.map((doc) => {

      const q = doc.data();


      return `
      <div class="item">

        <div>

          <div class="title">
            ${escapeHtml(q.title)}
          </div>


          <div class="meta">
            ${escapeHtml(q.description || "No description")}
            · ${q.durationMinutes || 0} min
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

    console.error("QUIZ LOAD ERROR:", error);


    listEl.innerHTML =
    `<div class="empty">
      Unable to load quizzes
    </div>`;

  }

}



// ==========================
// LOAD STUDENT RESULTS
// ==========================
async function loadMyResults(uid) {


  const listEl =
  document.getElementById("my-results");


  try {


    const snap = await db.collection("results")
      .where("studentId", "==", uid)
      .get();



    if (snap.empty) {


      listEl.innerHTML =
      `<div class="empty">
        You haven't taken any quizzes yet.
      </div>`;


      return;

    }



    let results =
    snap.docs.map(doc => doc.data());



    results.sort((a,b)=>{

      if(!a.submittedAt || !b.submittedAt)
      return 0;

      return b.submittedAt.seconds -
      a.submittedAt.seconds;

    });



    listEl.innerHTML =
    results.map((r)=>{


      const percentage =
      Math.round(
        (r.score / r.total) * 100
      );



      return `

      <div class="item">

        <div>

          <div class="title">
            ${escapeHtml(r.quizTitle)}
          </div>


          <div class="meta">
            ${r.score}/${r.total}
            correct (${percentage}%)
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
      Unable to load results
    </div>`;


  }

}



// Format time
function formatTime(sec) {

  sec = sec || 0;

  const m = Math.floor(sec / 60);
  const s = sec % 60;


  return `${m}m ${s}s`;

}

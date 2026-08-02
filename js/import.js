import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Load quizzes into dropdown
const quizSelect = document.getElementById("quizSelect");

async function loadQuizzes() {
    quizSelect.innerHTML = "<option value=''>Select a Quiz</option>";

    const snapshot = await getDocs(collection(db, "quizzes"));

    snapshot.forEach(doc => {
        const quiz = doc.data();

        const option = document.createElement("option");
        option.value = doc.id;
        option.textContent = quiz.title || doc.id;

        quizSelect.appendChild(option);
    });
}

loadQuizzes();

// Import Questions
window.importQuestions = async function () {

    const quizId = quizSelect.value;
    const file = document.getElementById("jsonFile").files[0];
    const status = document.getElementById("status");

    if (!quizId) {
        alert("Please select a quiz.");
        return;
    }

    if (!file) {
        alert("Please choose a JSON file.");
        return;
    }

    const text = await file.text();
    const questions = JSON.parse(text);

    status.textContent = "Uploading...";

    let count = 0;

    for (const q of questions) {

        await addDoc(
            collection(db, "quizzes", quizId, "questions"),
            {
                question: q.question,
                options: q.options,
                correctAnswer: q.correctAnswer
            }
        );

        count++;
        status.textContent = `Uploading ${count}/${questions.length}`;
    }

    status.textContent = `✅ Successfully imported ${count} questions!`;
};

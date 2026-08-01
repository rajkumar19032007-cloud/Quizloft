
const firebaseConfig = {
  apiKey: "AIzaSyC-fk1drCksqAHbRwVkz3MYXoSQdXGglnc",
  authDomain: "quizloft-71954.firebaseapp.com",
  projectId: "quizloft-71954",
  storageBucket: "quizloft-71954.firebasestorage.app",
  messagingSenderId: "198908320656",
  appId: "1:198908320656:web:f526a858b62b263b153115",
  measurementId: "G-5L7BPRWC47"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
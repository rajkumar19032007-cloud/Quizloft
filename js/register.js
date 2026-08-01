function setMsg(text, ok = false) {
  const el = document.getElementById("register-msg");
  el.textContent = text;
  el.className = "msg " + (ok ? "ok" : "err");
}

async function handleRegister() {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const role = document.getElementById("role").value;

  if (!name || !email || !password) {
    setMsg("Fill in every field.");
    return;
  }
  if (password.length < 6) {
    setMsg("Password must be at least 6 characters.");
    return;
  }

  setMsg("Creating your account…", true);

  try {
    const cred = await auth.createUserWithEmailAndPassword(email, password);

    await db.collection("users").doc(cred.user.uid).set({
      name,
      email,
      role,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    window.location.href = role === "admin" ? "admin-dashboard.html" : "student-dashboard.html";
  } catch (err) {
    setMsg(friendlyAuthError(err));
  }
}

function friendlyAuthError(err) {
  switch (err.code) {
    case "auth/email-already-in-use": return "An account with this email already exists.";
    case "auth/invalid-email": return "That email address doesn't look right.";
    case "auth/weak-password": return "Choose a stronger password (6+ characters).";
    default: return err.message || "Something went wrong. Try again.";
  }
}

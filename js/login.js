function setMsg(text, ok = false) {
  const el = document.getElementById("login-msg");
  el.textContent = text;
  el.className = "msg " + (ok ? "ok" : "err");
}

async function handleLogin() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    setMsg("Enter both email and password.");
    return;
  }

  setMsg("Signing in…", true);

  try {
    const cred = await auth.signInWithEmailAndPassword(email, password);

    const doc = await db.collection("users").doc(cred.user.uid).get();

    if (!doc.exists) {
      await auth.signOut();
      setMsg("No profile found for this account. Please register again.");
      return;
    }

    const role = doc.data().role;

    if (role === "admin") {
      window.location.href = "admin-dashboard.html";
    } else if (role === "student") {
      window.location.href = "student-dashboard.html";
    } else {
      await auth.signOut();
      setMsg("Invalid account role. Contact the administrator.");
    }

  } catch (err) {
    setMsg(friendlyAuthError(err));
  }
}

function friendlyAuthError(err) {
  switch (err.code) {
    case "auth/invalid-email":
      return "That email address doesn't look right.";

    case "auth/user-not-found":
      return "No account found with that email.";

    case "auth/wrong-password":
      return "Incorrect password.";

    case "auth/invalid-credential":
      return "Incorrect email or password.";

    case "auth/too-many-requests":
      return "Too many attempts. Try again in a minute.";

    default:
      return err.message || "Something went wrong. Try again.";
  }
}

// Allow pressing Enter to submit
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    handleLogin();
  }
});

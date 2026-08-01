// Shared helpers used by every protected page.
// requireRole(['admin']) redirects to index.html if not signed in,
// or to the correct dashboard if signed in with the wrong role.

function requireRole(allowedRoles) {
  return new Promise((resolve, reject) => {
    auth.onAuthStateChanged(async (user) => {
      if (!user) {
        window.location.href = "index.html";
        return reject();
      }
      try {
        const doc = await db.collection("users").doc(user.uid).get();
        if (!doc.exists) {
          window.location.href = "index.html";
          return reject();
        }
        const profile = { uid: user.uid, ...doc.data() };
        if (!allowedRoles.includes(profile.role)) {
          window.location.href = profile.role === "admin"
            ? "admin-dashboard.html"
            : "student-dashboard.html";
          return reject();
        }
        resolve(profile);
      } catch (err) {
        console.error("Auth guard error:", err);
        window.location.href = "index.html";
        reject(err);
      }
    });
  });
}

function logout() {
  auth.signOut().then(() => window.location.href = "index.html");
}

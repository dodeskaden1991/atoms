/* ===========================
   FIREBASE CONFIG
=========================== */

const firebaseConfig = {
  apiKey: "AIzaSyAGF9BsM0_OMADMYiTIpIFQ3rlWPQIcP-M",
  authDomain: "atoms-32b0d.firebaseapp.com",
  databaseURL: "https://atoms-32b0d-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "atoms-32b0d",
  storageBucket: "atoms-32b0d.appspot.com",
  messagingSenderId: "358321648052",
  appId: "1:358321648052:web:2f58f230f8b1384121c2e1",
  measurementId: "G-MFJNLQMEH2"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();

/* ===========================
   LOGIN
=========================== */

function adminLogin() {
  const email = document.getElementById("adminEmail").value;
  const pass = document.getElementById("adminPass").value;

  auth.signInWithEmailAndPassword(email, pass)
    .then(() => {
      document.getElementById("loginBox").style.display = "none";
      document.getElementById("adminPanel").style.display = "block";
      document.getElementById("loginStatus").textContent = "";
    })
    .catch(err => {
      document.getElementById("loginStatus").textContent = "Грешен email или парола.";
    });
}

/* ===========================
   DELETE ALL MESSAGES
=========================== */

function deleteAll() {
  db.ref("atmos_chat").remove()
    .then(() => {
      document.getElementById("adminStatus").textContent = "Всички съобщения са изтрити.";
    });
}

/* ===========================
   DELETE MESSAGES BEYOND 500
=========================== */

function deleteBeyond500() {
  db.ref("atmos_chat")
    .orderByKey()
    .limitToLast(500)
    .once("value", snapshot => {

      const keep = new Set(Object.keys(snapshot.val() || {}));

      db.ref("atmos_chat").once("value", allSnap => {
        allSnap.forEach(child => {
          if (!keep.has(child.key)) {
            child.ref.remove();
          }
        });

        document.getElementById("adminStatus").textContent =
          "Съобщенията над 500 са изтрити.";
      });

    });
}

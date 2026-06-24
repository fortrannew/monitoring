importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBbnHYVnH7Zv4P32lpW3Mk2cHBGxYCnqLY",
  authDomain: "svipa-88f79.firebaseapp.com",
  projectId: "svipa-88f79",
  messagingSenderId: "526519466018",
  appId: "1:526519466018:web:150649eb25e50f0861327b",
});

const messaging = firebase.messaging();
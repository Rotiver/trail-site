// db.js — Firebase Realtime Database helpers for Trail Team
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getDatabase, ref, push, set, remove, onValue } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDL-vMRBzAgXhtOXsdbycsms72ZrYHccNE",
  authDomain: "trail-team.firebaseapp.com",
  databaseURL: "https://trail-team-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "trail-team",
  storageBucket: "trail-team.appspot.com",
  messagingSenderId: "968392207074",
  appId: "1:968392207074:web:03e7f9f20cc2614b440cbb"
};

console.log("[db.js] carregado ✅");
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getDatabase(app);

try {
  await signInAnonymously(auth);
  console.log("[db.js] login anónimo OK");
  window.dispatchEvent(new CustomEvent('db:ready'));
} catch (e) {
  console.error("[db.js] falha login:", e);
  window.dispatchEvent(new CustomEvent('db:error', { detail: e }));
  throw e;
}

// ---- DATA MODEL ----
function provaPath(base, provaId) {
  if (!provaId) throw new Error("provaId em falta");
  return `${base}/${provaId}`;
}

async function addInscricao({ provaId, nome, modalidade, epoca }) {
  const listRef = ref(db, provaPath("inscricoes", provaId));
  const now = new Date().toISOString();
  const payload = { nome, modalidade, epoca, createdAt: now };
  const keyRef = await push(listRef);
  await set(keyRef, payload);
  return { key: keyRef.key, ...payload };
}

function onInscricoes(provaId, callback) {
  const pRef = ref(db, provaPath("inscricoes", provaId));
  onValue(pRef, snap => {
    const data = snap.val() || {};
    const arr = Object.entries(data).map(([key, v]) => ({ key, ...v }))
      .sort((a,b) => (a.createdAt||"") < (b.createdAt||"") ? 1 : -1);
    callback(arr);
  });
}

async function removeInscricao(provaId, key) {
  await remove(ref(db, `${provaPath("inscricoes", provaId)}/${key}`));
}

async function addClassificacao({ provaId, nome, tempo, posicao, escalao, epoca }) {
  const listRef = ref(db, provaPath("classificacoes", provaId));
  const now = new Date().toISOString();
  const payload = { nome, tempo, posicao, escalao, epoca, createdAt: now };
  const keyRef = await push(listRef);
  await set(keyRef, payload);
  return { key: keyRef.key, ...payload };
}

function onClassificacoes(provaId, callback) {
  const pRef = ref(db, provaPath("classificacoes", provaId));
  onValue(pRef, snap => {
    const data = snap.val() || {};
    const arr = Object.entries(data).map(([key, v]) => ({ key, ...v }))
      .sort((a,b) => (a.createdAt||"") < (b.createdAt||"") ? 1 : -1);
    callback(arr);
  });
}

async function removeClassificacao(provaId, key) {
  await remove(ref(db, `${provaPath("classificacoes", provaId)}/${key}`));
}

function provaIdFromStrings(prova, modalidade) {
  return `${String(prova||'').trim()}-${String(modalidade||'').trim()}`
    .toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9\-]/g,'');
}

window.DB = {
  addInscricao, onInscricoes, removeInscricao,
  addClassificacao, onClassificacoes, removeClassificacao,
  provaIdFromStrings
};

console.log("[db.js] API pronta: DB.addInscricao(), DB.onInscricoes(), DB.addClassificacao(), ...");

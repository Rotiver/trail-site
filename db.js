// db.js — sincroniza automaticamente todos os inputs com o Realtime Database
// v1.0 — com logs para validação

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

console.log("[db.js] carregado ✅ (a importar Firebase)");

// --- CONFIG DO TEU PROJETO ---
const firebaseConfig = {
  apiKey: "AIzaSyDL-vMRBzAgXhtOXsdbycsms72ZrYHccNE",
  authDomain: "trail-team.firebaseapp.com",
  databaseURL: "https://trail-team-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "trail-team",
  storageBucket: "trail-team.appspot.com",
  messagingSenderId: "968392207074",
  appId: "1:968392207074:web:03e7f9f20cc2614b440cbb"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getDatabase(app);

// Login anónimo para permitir leitura/escrita (segundo as Regras do RTDB)
try {
  await signInAnonymously(auth);
  console.log("[db.js] login anónimo OK");
} catch (e) {
  console.error("[db.js] falha no login anónimo:", e);
}

// 🔧 Utilitário: cria uma chave estável para cada elemento
function keyFor(el) {
  if (el.id)   return `id:${el.id}`;
  if (el.name) return `name:${el.name}`;
  const parts = [];
  let node = el;
  while (node && node.nodeType === 1 && node.tagName.toLowerCase() !== 'html') {
    const tag = node.tagName.toLowerCase();
    const siblings = Array.from(node.parentElement?.children || []).filter(n => n.tagName === node.tagName);
    const index = siblings.indexOf(node);
    parts.unshift(`${tag}[${index}]`);
    node = node.parentElement;
  }
  return `path:/${parts.join('/')}`;
}

async function restore() {
  const snap = await get(ref(db, "fields"));
  if (!snap.exists()) return;
  const data = snap.val();
  document.querySelectorAll("input, textarea, select").forEach(el => {
    const k = keyFor(el);
    const rec = data[k];
    if (!rec) return;
    if (el.type === "checkbox" || el.type === "radio") {
      el.checked = !!rec.value;
    } else {
      if (rec.value !== undefined) el.value = rec.value;
    }
  });
}

function save(el) {
  const k = keyFor(el);
  const value = (el.type === "checkbox" || el.type === "radio") ? el.checked : el.value;
  set(ref(db, `fields/${k}`), { value, updatedAt: new Date().toISOString() }).catch(console.error);
}

document.addEventListener("DOMContentLoaded", async () => {
  await restore();
  document.querySelectorAll("input, textarea, select").forEach(el => {
    el.addEventListener("input",  () => save(el));
    el.addEventListener("change", () => save(el));
  });
  console.log("[db.js] sincronização automática ON (inputs/textarea/select).");
});

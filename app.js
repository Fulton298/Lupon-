// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js');
  });
}

// Install prompt (A2HS) for Android Chrome
let deferredPrompt;
const installBtn = document.getElementById('installBtn');
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.hidden = false;
});
installBtn?.addEventListener('click', async () => {
  installBtn.hidden = true;
  if (deferredPrompt) {
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
  }
});

const listEl = document.getElementById('fileList');
const searchEl = document.getElementById('search');

let files = [];

async function loadFiles() {
  try {
    // Network-first for latest list, fallback to cache
    const res = await fetch('files/files.json', {cache: 'no-store'});
    files = await res.json();
  } catch (e) {
    // offline fallback
    const res = await fetch('files/files.json');
    files = await res.json();
  }
  render(files);
}

function iconFor(path) {
  const ext = path.split('.').pop().toLowerCase();
  if (ext === 'docx') return 'DOCX';
  if (ext === 'pdf') return 'PDF';
  return 'FILE';
}

function render(items) {
  listEl.innerHTML = '';
  if (!items.length) {
    listEl.innerHTML = '<li class="file-item">No files yet.</li>';
    return;
  }
  for (const f of items) {
    const li = document.createElement('li');
    li.className = 'file-item';
    const thumb = document.createElement('div');
    thumb.className = 'thumb';
    thumb.textContent = iconFor(f.path);
    const text = document.createElement('div');
    const a = document.createElement('a');
    a.href = f.path;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = f.title;
    const small = document.createElement('small');
    small.textContent = f.path.replace('files/', '');
    text.appendChild(a);
    text.appendChild(small);
    li.appendChild(thumb);
    li.appendChild(text);
    listEl.appendChild(li);
  }
}

searchEl.addEventListener('input', () => {
  const q = searchEl.value.toLowerCase().trim();
  if (!q) return render(files);
  render(files.filter(f => f.title.toLowerCase().includes(q) || f.path.toLowerCase().includes(q)));
});

loadFiles();

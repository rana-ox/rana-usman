// Simple utility: format year in footer
document.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});

// Fetch JSON data with fallback
async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

// Render notes on index.html
async function renderNotes() {
  const notesList = document.getElementById("notes-list");
  if (!notesList) return;

  const semesterSelect = document.getElementById("semester-select");
  const searchInput = document.getElementById("search-input");

  let data = [];
  try {
    data = await loadJSON("assets/data/notes.json");
  } catch (e) {
    notesList.innerHTML = `<p>Could not load notes. Please check assets/data/notes.json</p>`;
    return;
  }

  function filterAndRender() {
    const sem = semesterSelect.value;
    const q = (searchInput.value || "").toLowerCase().trim();

    const filtered = data.filter(item => {
      const matchesSemester = sem === "all" ? true : String(item.semester) === sem;
      const haystack = `${item.title} ${item.courseCode} ${item.instructor} ${item.description} ${item.tags.join(" ")}`.toLowerCase();
      const matchesQuery = q === "" ? true : haystack.includes(q);
      return matchesSemester && matchesQuery;
    });

    notesList.innerHTML = filtered.length
      ? filtered.map(item => noteCard(item)).join("")
      : `<p>No notes found. Try a different search or semester.</p>`;
  }

  function noteCard(item) {
    const tags = item.tags.map(t => `<span class="tag">${t}</span>`).join("");
    const fileLink = item.link ? `<a class="button" href="${item.link}" target="_blank" rel="noopener">View / Download</a>` : "";
    return `
      <article class="card">
        <h3>${item.title}</h3>
        <div class="meta">Course: ${item.courseCode} • Semester ${item.semester} • ${item.instructor}</div>
        <p>${item.description}</p>
        <div class="tags">${tags}</div>
        ${fileLink}
      </article>
    `;
  }

  semesterSelect.addEventListener("change", filterAndRender);
  searchInput.addEventListener("input", filterAndRender);
  filterAndRender();
}

// Render opportunities
async function renderOpportunities() {
  const el = document.getElementById("opportunities-list");
  if (!el) return;
  let data = [];
  try {
    data = await loadJSON("assets/data/opportunities.json");
  } catch (e) {
    el.innerHTML = `<p>Could not load opportunities. Please check assets/data/opportunities.json</p>`;
    return;
  }

  el.innerHTML = data.length
    ? data.map(op => `
      <article class="card">
        <h3>${op.title}</h3>
        <div class="meta">${op.type} • Deadline: ${op.deadline}</div>
        <p>${op.description}</p>
        <div class="tags">${op.tags.map(t => `<span class="tag">${t}</span>`).join("")}</div>
        ${op.link ? `<a class="button" href="${op.link}" target="_blank" rel="noopener">Apply / Details</a>` : ""}
      </article>
    `).join("")
    : `<p>No opportunities listed yet.</p>`;
}

// Render hacks
async function renderHacks() {
  const el = document.getElementById("hacks-list");
  if (!el) return;
  let data = [];
  try {
    data = await loadJSON("assets/data/hacks.json");
  } catch (e) {
    el.innerHTML = `<p>Could not load hacks. Please check assets/data/hacks.json</p>`;
    return;
  }

  el.innerHTML = data.length
    ? data.map(h => `
      <article class="card">
        <h3>${h.title}</h3>
        <div class="meta">${h.category} • Estimated time: ${h.time}</div>
        <p>${h.description}</p>
        <div class="tags">${h.tags.map(t => `<span class="tag">${t}</span>`).join("")}</div>
        ${h.link ? `<a class="button" href="${h.link}" target="_blank" rel="noopener">Resource</a>` : ""}
      </article>
    `).join("")
    : `<p>No hacks added yet.</p>`;
}

// Initialize correct page
document.addEventListener("DOMContentLoaded", () => {
  renderNotes();
  renderOpportunities();
  renderHacks();
});

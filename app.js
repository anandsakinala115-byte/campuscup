// CampusCup uses plain JavaScript and the browser's local storage.
// This keeps the project simple: it does not need a server or extra libraries.

const STORAGE_KEY = "campuscup-data";
const categories = ["Technology", "Cultural", "Sports", "Design", "Academic", "Other"];

// Sample competitions and teams are shown the first time the page is opened.
function makeDate(daysFromToday) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  return date.toISOString().slice(0, 10);
}

const sampleData = {
  competitions: [
    { id: "1", name: "CodeSprint 2026", category: "Technology", date: makeDate(4), time: "10:00", venue: "Innovation Hub", capacity: 30, teamSize: 4, fee: 0, registrations: 12 },
    { id: "2", name: "Battle of Bands", category: "Cultural", date: makeDate(8), time: "16:30", venue: "Open Air Theatre", capacity: 24, teamSize: 5, fee: 250, registrations: 18 },
    { id: "3", name: "Campus Cup Finals", category: "Sports", date: makeDate(12), time: "09:00", venue: "Main Ground", capacity: 32, teamSize: 8, fee: 100, registrations: 25 },
    { id: "4", name: "Design for Good", category: "Design", date: makeDate(17), time: "11:00", venue: "Studio 2", capacity: 40, teamSize: 3, fee: 0, registrations: 7 },
    { id: "5", name: "Quiz Quest", category: "Academic", date: makeDate(22), time: "14:00", venue: "Seminar Hall B", capacity: 36, teamSize: 3, fee: 50, registrations: 21 }
  ],
  registrations: [
    { id: "r1", competitionId: "1", team: "Byte Me", lead: "Aarav Sharma", email: "aarav@campus.edu", members: 4, department: "Computer Science", status: "Confirmed" },
    { id: "r2", competitionId: "2", team: "The Chords", lead: "Maya Iyer", email: "maya@campus.edu", members: 5, department: "Media Studies", status: "Confirmed" },
    { id: "r3", competitionId: "4", team: "Pixel Pioneers", lead: "Rohan Das", email: "rohan@campus.edu", members: 3, department: "Visual Arts", status: "Pending" },
    { id: "r4", competitionId: "3", team: "Goal Diggers", lead: "Ishita Rao", email: "ishita@campus.edu", members: 8, department: "Business", status: "Confirmed" }
  ]
};

let data = loadData();
let currentPage = "dashboard";
let registrationFilter = "All";
let eventBeingEdited = null;

// Return saved information, or sample information if this is a new visit.
function loadData() {
  const savedData = localStorage.getItem(STORAGE_KEY);
  if (savedData) {
    try {
      return JSON.parse(savedData);
    } catch (error) {
      console.log("Starting with sample data.");
    }
  }
  return JSON.parse(JSON.stringify(sampleData));
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  document.getElementById("navCount").textContent = data.competitions.length;
}

function safeText(text) {
  return String(text || "").replace(/[&<>"']/g, function (character) {
    const replacements = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return replacements[character];
  });
}

function getCompetition(id) {
  return data.competitions.find(function (event) { return event.id === id; });
}

function getStatus(event) {
  const today = new Date().toISOString().slice(0, 10);
  if (event.date < today) return "Closed";
  if (event.registrations >= event.capacity) return "Full";
  if (event.date === today) return "Closing soon";
  return "Open";
}

function showMessage(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(function () { toast.classList.remove("show"); }, 2500);
}

function changePage(page) {
  currentPage = page;
  document.querySelectorAll(".nav-item").forEach(function (button) {
    button.classList.toggle("active", button.dataset.view === page);
  });
  const pageNames = { dashboard: "Overview", competitions: "Competitions", registrations: "Registrations" };
  document.getElementById("crumb").textContent = pageNames[page];
  renderPage();
}

function heading(title, description, buttonText, action) {
  return `<div class="page-heading"><div><div class="eyebrow">CAMPUS EVENTS</div><h1>${title}</h1><p>${description}</p></div>
    <button class="button button-primary" data-action="${action}">${buttonText} <span>＋</span></button></div>`;
}

function makeStat(title, number, note, icon) {
  return `<article class="stat-card"><div class="stat-top"><span>${title}</span><span class="stat-icon">${icon}</span></div>
    <div class="stat-number">${number}<span class="stat-note">${note}</span></div></article>`;
}

function dashboardPage() {
  const teamCount = data.competitions.reduce(function (total, event) { return total + event.registrations; }, 0);
  const capacity = data.competitions.reduce(function (total, event) { return total + event.capacity; }, 0);
  const pendingCount = data.registrations.filter(function (team) { return team.status === "Pending"; }).length;
  const freeSpots = Math.max(0, capacity - teamCount);
  const upcoming = data.competitions.slice(0, 4);
  return `${heading("Welcome to CampusCup", "Manage campus competitions and team registrations.", "Add competition", "add-event")}
    <section class="stat-grid">
      ${makeStat("Competitions", data.competitions.length, "in this workspace", "▦")}
      ${makeStat("Teams registered", teamCount, "across all events", "♧")}
      ${makeStat("Waiting for review", pendingCount, "pending registrations", "◷")}
      ${makeStat("Available spots", freeSpots, "across all events", "◉")}
    </section>
    <section class="dashboard-grid">
      <article class="panel"><div class="panel-heading"><div><h2>Upcoming competitions</h2><p>Events coming up soon</p></div>
      <button class="text-link" data-view-link="competitions">See all →</button></div>
      <div class="event-list">${upcoming.map(function (event) { return eventRow(event); }).join("")}</div></article>
      <article class="panel"><div class="panel-heading"><div><h2>Quick summary</h2><p>Registration capacity</p></div></div>
      <div class="category-list"><div class="category-line"><div class="category-dot">✓</div><div><div class="category-label">Teams registered</div><div class="category-sub">${teamCount} of ${capacity} available spots</div></div><div class="category-count">${capacity ? Math.round(teamCount / capacity * 100) : 0}%</div></div></div></article>
    </section>
    <article class="panel" style="margin-top:16px"><div class="panel-heading"><div><h2>Recent registrations</h2><p>Latest teams to sign up</p></div>
    <button class="text-link" data-view-link="registrations">View all →</button></div>${registrationTable(data.registrations.slice(-4).reverse(), false)}</article>`;
}

function eventRow(event) {
  const date = new Date(event.date + "T12:00:00");
  return `<div class="event-row"><div class="event-date"><strong>${date.getDate()}</strong><span>${date.toLocaleDateString("en-US", { month: "short" })}</span></div>
    <div class="event-info"><strong>${safeText(event.name)}</strong><span>${safeText(event.category)} · ${safeText(event.time)} · ${safeText(event.venue)}</span></div>
    <div class="event-trailing"><strong>${event.registrations}/${event.capacity}</strong><span>teams</span></div></div>`;
}

function competitionsPage() {
  return `${heading("Competitions", "Add events and keep track of available team places.", "Add competition", "add-event")}
    <section class="panel table-panel"><div class="toolbar"><div class="toolbar-left">
    <label class="search-box"><span>⌕</span><input id="competitionSearch" placeholder="Search competitions…"></label>
    <select class="filter-select" id="categoryFilter"><option>All</option>${categories.map(function (category) { return `<option>${category}</option>`; }).join("")}</select></div>
    <div class="toolbar-right"><select class="filter-select" id="statusFilter"><option>All statuses</option><option>Open</option><option>Closing soon</option><option>Full</option><option>Closed</option></select></div></div>
    <div id="competitionTable"></div></section>`;
}

function renderCompetitionTable() {
  const search = (document.getElementById("competitionSearch").value || "").toLowerCase();
  const category = document.getElementById("categoryFilter").value;
  const status = document.getElementById("statusFilter").value;
  const matches = data.competitions.filter(function (event) {
    const matchesText = (event.name + " " + event.venue).toLowerCase().includes(search);
    const matchesCategory = category === "All" || event.category === category;
    const matchesStatus = status === "All statuses" || getStatus(event) === status;
    return matchesText && matchesCategory && matchesStatus;
  });
  const rows = matches.map(function (event) {
    const eventStatus = getStatus(event);
    return `<tr><td><strong>${safeText(event.name)}</strong><br><span class="muted">${safeText(event.category)}</span></td>
      <td>${event.date}<br><span class="muted">${safeText(event.time)} · ${safeText(event.venue)}</span></td>
      <td>${event.registrations} / ${event.capacity}</td><td><span class="status ${eventStatus.toLowerCase().replace(" ", "")}">${eventStatus}</span></td>
      <td><button class="small-action" data-action="edit-event" data-id="${event.id}">Edit</button>
      <button class="small-action" data-action="register" data-id="${event.id}" ${eventStatus === "Full" || eventStatus === "Closed" ? "disabled" : ""}>Register</button></td></tr>`;
  }).join("");
  document.getElementById("competitionTable").innerHTML = rows ? `<div class="table-wrap"><table><thead><tr><th>Competition</th><th>Date and venue</th><th>Teams</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<div class="no-results">No competitions found.</div>`;
}

function registrationsPage() {
  const teamCount = data.competitions.reduce(function (total, event) { return total + event.registrations; }, 0);
  const pendingCount = data.registrations.filter(function (team) { return team.status === "Pending"; }).length;
  return `${heading("Registrations", "Review team entries and confirmation status.", "Register a team", "register-team")}
    <section class="stat-grid">${makeStat("Total teams", teamCount, "across all events", "♧")}${makeStat("Pending", pendingCount, "awaiting review", "◷")}${makeStat("Competitions", data.competitions.length, "with events", "▦")}${makeStat("Confirmed", Math.max(0, teamCount - pendingCount), "ready to compete", "✓")}</section>
    <div class="view-tabs"><button class="tab-button active" data-reg-filter="All">All teams</button><button class="tab-button" data-reg-filter="Confirmed">Confirmed</button><button class="tab-button" data-reg-filter="Pending">Pending</button></div>
    <section class="panel table-panel"><div class="toolbar"><div class="toolbar-left"><label class="search-box"><span>⌕</span><input id="registrationSearch" placeholder="Search teams or students…"></label></div>
    <div class="toolbar-right"><select class="filter-select" id="registrationCompetition"><option value="All">All competitions</option>${data.competitions.map(function (event) { return `<option value="${event.id}">${safeText(event.name)}</option>`; }).join("")}</select></div></div><div id="registrationTable"></div></section>`;
}

function registrationTable(teams, showActions) {
  if (!teams.length) return `<div class="no-results">No registrations found.</div>`;
  const rows = teams.map(function (team) {
    const event = getCompetition(team.competitionId);
    const eventName = event ? event.name : "Competition removed";
    const buttons = showActions ? `<td>${team.status === "Pending" ? `<button class="small-action" data-action="confirm" data-id="${team.id}">Confirm</button>` : ""}
      <button class="small-action" data-action="remove" data-id="${team.id}">Remove</button></td>` : "";
    return `<tr><td><strong>${safeText(team.team)}</strong><br><span class="muted">${safeText(team.department)}</span></td>
      <td>${safeText(eventName)}</td><td>${safeText(team.lead)}<br><span class="muted">${safeText(team.email)}</span></td>
      <td>${team.members}</td><td><span class="status ${team.status.toLowerCase()}">${team.status}</span></td>${buttons}</tr>`;
  }).join("");
  return `<div class="table-wrap"><table><thead><tr><th>Team</th><th>Competition</th><th>Team lead</th><th>Members</th><th>Status</th>${showActions ? "<th>Actions</th>" : ""}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

function renderRegistrationTable() {
  const search = (document.getElementById("registrationSearch").value || "").toLowerCase();
  const competitionId = document.getElementById("registrationCompetition").value;
  const matches = data.registrations.filter(function (team) {
    const event = getCompetition(team.competitionId);
    const eventName = event ? event.name : "";
    const matchesText = (team.team + " " + team.lead + " " + team.email + " " + eventName).toLowerCase().includes(search);
    const matchesStatus = registrationFilter === "All" || team.status === registrationFilter;
    const matchesCompetition = competitionId === "All" || team.competitionId === competitionId;
    return matchesText && matchesStatus && matchesCompetition;
  });
  document.getElementById("registrationTable").innerHTML = registrationTable(matches, true);
}

function renderPage() {
  const content = document.getElementById("content");
  if (currentPage === "dashboard") content.innerHTML = dashboardPage();
  if (currentPage === "competitions") content.innerHTML = competitionsPage();
  if (currentPage === "registrations") content.innerHTML = registrationsPage();
  if (currentPage === "competitions") renderCompetitionTable();
  if (currentPage === "registrations") renderRegistrationTable();
}

// Create the fields used in the Add/Edit Competition and Register Team forms.
function showModal(type, record) {
  const isEvent = type === "event";
  eventBeingEdited = isEvent && record ? record.id : null;
  document.getElementById("modalTitle").textContent = isEvent ? (record ? "Edit competition" : "Add competition") : "Register a team";
  document.getElementById("modalEyebrow").textContent = record ? "UPDATE ENTRY" : "NEW ENTRY";
  document.getElementById("submitButton").textContent = isEvent ? (record ? "Save changes" : "Create competition") : "Submit registration";

  if (isEvent) {
    document.getElementById("formFields").innerHTML = `<div class="form-grid">
      ${inputField("Competition name", "name", record ? record.name : "", "text", true)}
      <div class="field"><label>Category</label><select name="category">${categories.map(function (item) { return `<option ${record && record.category === item ? "selected" : ""}>${item}</option>`; }).join("")}</select></div>
      ${inputField("Event date", "date", record ? record.date : "", "date", true)}${inputField("Start time", "time", record ? record.time : "10:00", "time", true)}
      ${inputField("Venue", "venue", record ? record.venue : "", "text", true)}${inputField("Team capacity", "capacity", record ? record.capacity : 30, "number", true)}
      ${inputField("Max team members", "teamSize", record ? record.teamSize : 4, "number", true)}${inputField("Entry fee (₹)", "fee", record ? record.fee : 0, "number", false)}</div>`;
  } else {
    const eventOptions = data.competitions.map(function (event) {
      const selected = record && record.competitionId === event.id ? "selected" : "";
      return `<option value="${event.id}" ${selected}>${safeText(event.name)}</option>`;
    }).join("");
    document.getElementById("formFields").innerHTML = `<div class="form-grid"><div class="field wide"><label>Competition</label><select name="competitionId" required><option value="">Choose an event</option>${eventOptions}</select></div>
      ${inputField("Team name", "team", "", "text", true)}${inputField("Team lead", "lead", "", "text", true)}
      ${inputField("Team lead email", "email", "", "email", true)}${inputField("Number of members", "members", 2, "number", true)}
      ${inputField("Department / course", "department", "", "text", true)}</div>`;
  }
  document.getElementById("formError").textContent = "";
  document.getElementById("recordForm").dataset.type = type;
  document.getElementById("modalBackdrop").classList.add("open");
}

function inputField(label, name, value, type, required) {
  const wide = name === "name" || name === "department" ? "wide" : "";
  return `<div class="field ${wide}"><label>${label}</label><input name="${name}" type="${type}" value="${safeText(value)}" ${required ? "required" : ""}></div>`;
}

function closeModal() {
  document.getElementById("modalBackdrop").classList.remove("open");
  eventBeingEdited = null;
}

function submitForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const values = Object.fromEntries(new FormData(form).entries());
  const error = document.getElementById("formError");

  if (form.dataset.type === "event") {
    values.capacity = Number(values.capacity);
    values.teamSize = Number(values.teamSize);
    values.fee = Number(values.fee || 0);
    const today = new Date().toISOString().slice(0, 10);
    if (values.date < today) { error.textContent = "Choose today or a future date."; return; }
    if (values.capacity < 1 || values.teamSize < 1 || values.fee < 0) {
      error.textContent = "Capacity and team size must be at least 1. Fee cannot be negative.";
      return;
    }
    if (eventBeingEdited) {
      const oldEvent = getCompetition(eventBeingEdited);
      if (values.capacity < oldEvent.registrations) {
        error.textContent = "Capacity cannot be lower than teams already registered.";
        return;
      }
      Object.assign(oldEvent, values);
      showMessage("Competition updated.");
    } else {
      values.id = String(Date.now());
      values.registrations = 0;
      data.competitions.push(values);
      showMessage("Competition added.");
    }
  } else {
    const chosenEvent = getCompetition(values.competitionId);
    values.members = Number(values.members);
    if (!chosenEvent) { error.textContent = "Please choose a competition."; return; }
    if (getStatus(chosenEvent) === "Full" || getStatus(chosenEvent) === "Closed") { error.textContent = "This competition is not accepting registrations."; return; }
    if (values.members > chosenEvent.teamSize) { error.textContent = "This team has too many members for the event."; return; }
    const duplicate = data.registrations.some(function (team) {
      return team.competitionId === chosenEvent.id && team.team.toLowerCase() === values.team.toLowerCase();
    });
    if (duplicate) { error.textContent = "This team is already registered for the event."; return; }
    values.id = String(Date.now());
    values.status = "Confirmed";
    data.registrations.push(values);
    chosenEvent.registrations++;
    showMessage("Registration confirmed.");
  }

  saveData();
  closeModal();
  renderPage();
}

// Buttons use data-action attributes so one click listener can handle them all.
document.addEventListener("click", function (event) {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.dataset.view) changePage(button.dataset.view);
  if (button.dataset.viewLink) changePage(button.dataset.viewLink);
  if (button.dataset.regFilter) {
    registrationFilter = button.dataset.regFilter;
    document.querySelectorAll(".tab-button").forEach(function (tab) { tab.classList.toggle("active", tab === button); });
    renderRegistrationTable();
  }
  if (button.dataset.action === "add-event") showModal("event");
  if (button.dataset.action === "register-team") showModal("registration");
  if (button.dataset.action === "register") showModal("registration", { competitionId: button.dataset.id });
  if (button.dataset.action === "edit-event") showModal("event", getCompetition(button.dataset.id));
  if (button.dataset.action === "confirm") {
    const team = data.registrations.find(function (item) { return item.id === button.dataset.id; });
    if (team) team.status = "Confirmed";
    saveData(); renderPage(); showMessage("Team confirmed.");
  }
  if (button.dataset.action === "remove") {
    const team = data.registrations.find(function (item) { return item.id === button.dataset.id; });
    if (team && confirm("Remove this team registration?")) {
      const event = getCompetition(team.competitionId);
      if (event) event.registrations = Math.max(0, event.registrations - 1);
      data.registrations = data.registrations.filter(function (item) { return item.id !== team.id; });
      saveData(); renderPage(); showMessage("Registration removed.");
    }
  }
});

document.addEventListener("input", function (event) {
  if (event.target.id === "competitionSearch") renderCompetitionTable();
  if (event.target.id === "registrationSearch") renderRegistrationTable();
});

document.addEventListener("change", function (event) {
  if (event.target.id === "categoryFilter" || event.target.id === "statusFilter") renderCompetitionTable();
  if (event.target.id === "registrationCompetition") renderRegistrationTable();
});

document.getElementById("recordForm").addEventListener("submit", submitForm);
document.getElementById("closeModal").addEventListener("click", closeModal);
document.getElementById("cancelModal").addEventListener("click", closeModal);
document.getElementById("modalBackdrop").addEventListener("click", function (event) {
  if (event.target.id === "modalBackdrop") closeModal();
});
document.getElementById("menuButton").addEventListener("click", function () {
  document.getElementById("sidebar").classList.toggle("open");
});
document.getElementById("helpButton").addEventListener("click", function () {
  showMessage("Add a competition first, then register teams.");
});
document.getElementById("bellButton").addEventListener("click", function () {
  const pending = data.registrations.filter(function (team) { return team.status === "Pending"; }).length;
  showMessage(pending + " registrations waiting for review.");
});

document.getElementById("todayLabel").textContent = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
document.getElementById("navCount").textContent = data.competitions.length;
renderPage();

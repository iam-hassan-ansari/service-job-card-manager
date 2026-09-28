/* =========================================================
   Service Job Card Manager (Demo)
   Vanilla JS, data kept in localStorage. No backend server.
   ========================================================= */

const KEYS = {
  jobs: "jcm_jobs",
  mechanics: "jcm_mechanics",
  counter: "jcm_counter",
};

function load(key, fallback) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : fallback;
}
function save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function money(n) { return "INR " + Number(n).toLocaleString("en-IN"); }

const STATUSES = ["Booked", "In Progress", "Ready for Delivery", "Delivered"];

let mechanics = load(KEYS.mechanics, null) || (save(KEYS.mechanics, [
  { id: uid(), name: "Iqbal Shaikh" },
  { id: uid(), name: "Ramesh Patil" },
  { id: uid(), name: "Farhan Qureshi" },
]), load(KEYS.mechanics, []));
let jobs = load(KEYS.jobs, []);
let counter = load(KEYS.counter, 500);

/* ---------------- tabs ---------------- */
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach((p) => (p.style.display = "none"));
    btn.classList.add("active");
    document.getElementById("tab-" + btn.dataset.tab).style.display = "block";
    if (btn.dataset.tab === "board") renderBoard();
    if (btn.dataset.tab === "mechanics") renderMechanics();
    if (btn.dataset.tab === "new") fillMechanicSelect();
  });
});

/* ---------------- mechanics ---------------- */
function fillMechanicSelect() {
  const sel = document.getElementById("jc-mechanic");
  sel.innerHTML = mechanics.map((m) => `<option value="${m.id}">${m.name}</option>`).join("");
}

function renderMechanics() {
  const tbody = document.querySelector("#mech-table tbody");
  tbody.innerHTML = "";
  mechanics.forEach((m) => {
    const active = jobs.filter((j) => j.mechanicId === m.id && j.status !== "Delivered").length;
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${m.name}</td><td>${active}</td>
      <td><button class="danger" data-id="${m.id}" data-action="del-mech">Remove</button></td>`;
    tbody.appendChild(tr);
  });
}
document.getElementById("btn-add-mech").addEventListener("click", () => {
  const name = document.getElementById("mech-name").value.trim();
  if (!name) return;
  mechanics.push({ id: uid(), name });
  save(KEYS.mechanics, mechanics);
  document.getElementById("mech-name").value = "";
  renderMechanics();
});
document.querySelector("#mech-table tbody").addEventListener("click", (e) => {
  if (e.target.dataset.action === "del-mech") {
    mechanics = mechanics.filter((m) => m.id !== e.target.dataset.id);
    save(KEYS.mechanics, mechanics);
    renderMechanics();
  }
});

/* ---------------- create job card ---------------- */
document.getElementById("btn-create-jc").addEventListener("click", () => {
  const customer = document.getElementById("jc-customer").value.trim();
  const phone = document.getElementById("jc-phone").value.trim();
  const vehicle = document.getElementById("jc-vehicle").value.trim();
  const reg = document.getElementById("jc-reg").value.trim();
  const mechanicId = document.getElementById("jc-mechanic").value;
  const date = document.getElementById("jc-date").value || new Date().toISOString().slice(0, 10);
  const issue = document.getElementById("jc-issue").value.trim();
  const msg = document.getElementById("jc-msg");

  if (!customer || !vehicle) { msg.textContent = "Customer name and vehicle are required."; return; }

  counter += 1;
  save(KEYS.counter, counter);
  jobs.push({
    id: uid(), jcNo: "JC-" + counter, customer, phone, vehicle, reg,
    mechanicId, date, issue, status: "Booked", parts: [], labour: [],
  });
  save(KEYS.jobs, jobs);

  msg.textContent = `Job card JC-${counter} created.`;
  ["jc-customer", "jc-phone", "jc-vehicle", "jc-reg", "jc-issue"].forEach((id) => (document.getElementById(id).value = ""));
});

/* ---------------- board ---------------- */
function mechName(id) {
  const m = mechanics.find((x) => x.id === id);
  return m ? m.name : "Unassigned";
}

function renderBoard() {
  STATUSES.forEach((status) => {
    const col = document.getElementById("col-" + status);
    col.innerHTML = "";
    jobs.filter((j) => j.status === status).forEach((j) => {
      const div = document.createElement("div");
      div.className = "jc-card";
      div.dataset.id = j.id;
      div.innerHTML = `
        <div class="jc-title">${j.jcNo} - ${j.vehicle}</div>
        <div class="jc-sub">${j.customer} - ${j.reg || "no reg"}</div>
        <div class="jc-mech">Mechanic: ${mechName(j.mechanicId)}</div>`;
      div.addEventListener("click", () => openModal(j.id));
      col.appendChild(div);
    });
  });
}

/* ---------------- job card detail modal ---------------- */
function jobTotal(job) {
  const partsTotal = job.parts.reduce((s, p) => s + p.qty * p.price, 0);
  const labourTotal = job.labour.reduce((s, l) => s + l.amount, 0);
  return partsTotal + labourTotal;
}

function openModal(jobId) {
  const job = jobs.find((j) => j.id === jobId);
  if (!job) return;
  const backdrop = document.getElementById("modal-backdrop");
  const content = document.getElementById("modal-content");

  function draw() {
    const partsRows = job.parts.map((p, i) =>
      `<tr><td>${p.name}</td><td>${p.qty}</td><td>${money(p.price)}</td><td>${money(p.qty * p.price)}</td>
       <td><button class="danger" data-action="del-part" data-idx="${i}">X</button></td></tr>`).join("");
    const labourRows = job.labour.map((l, i) =>
      `<tr><td>${l.desc}</td><td colspan="2"></td><td>${money(l.amount)}</td>
       <td><button class="danger" data-action="del-labour" data-idx="${i}">X</button></td></tr>`).join("");

    content.innerHTML = `
      <button class="close-btn" data-action="close">X Close</button>
      <h3>${job.jcNo} - ${job.vehicle} (${job.reg || "no reg"})</h3>
      <p class="muted">${job.customer} - ${job.phone} - Booked ${job.date}</p>
      <p>${job.issue ? job.issue : "<em>No issue description.</em>"}</p>

      <div class="status-row">
        ${STATUSES.map((s) => `<button data-action="set-status" data-status="${s}" class="secondary ${s === job.status ? "current" : ""}">${s}</button>`).join("")}
      </div>

      <h4>Parts</h4>
      <table><thead><tr><th>Part</th><th>Qty</th><th>Price</th><th>Total</th><th></th></tr></thead>
      <tbody>${partsRows || `<tr><td colspan="5" class="muted">No parts added.</td></tr>`}</tbody></table>
      <div class="line-form">
        <input type="text" id="part-name" placeholder="Part name" />
        <input type="number" id="part-qty" placeholder="Qty" value="1" min="1" />
        <input type="number" id="part-price" placeholder="Price INR " />
        <button data-action="add-part">Add Part</button>
      </div>

      <h4>Labour</h4>
      <table><thead><tr><th>Description</th><th></th><th></th><th>Amount</th><th></th></tr></thead>
      <tbody>${labourRows || `<tr><td colspan="5" class="muted">No labour charges added.</td></tr>`}</tbody></table>
      <div class="line-form">
        <input type="text" id="labour-desc" placeholder="e.g. Engine oil change" />
        <input type="number" id="labour-amount" placeholder="Amount INR " />
        <button data-action="add-labour">Add Labour</button>
      </div>

      <h3 style="text-align:right;color:var(--accent);">Total: ${money(jobTotal(job))}</h3>
    `;
  }

  draw();
  backdrop.style.display = "flex";

  content.onclick = (e) => {
    const action = e.target.dataset.action;
    if (action === "close") { backdrop.style.display = "none"; renderBoard(); return; }
    if (action === "set-status") { job.status = e.target.dataset.status; save(KEYS.jobs, jobs); draw(); return; }
    if (action === "add-part") {
      const name = document.getElementById("part-name").value.trim();
      const qty = Number(document.getElementById("part-qty").value) || 1;
      const price = Number(document.getElementById("part-price").value) || 0;
      if (!name || !price) { alert("Enter part name and price."); return; }
      job.parts.push({ name, qty, price });
      save(KEYS.jobs, jobs); draw(); return;
    }
    if (action === "del-part") { job.parts.splice(Number(e.target.dataset.idx), 1); save(KEYS.jobs, jobs); draw(); return; }
    if (action === "add-labour") {
      const desc = document.getElementById("labour-desc").value.trim();
      const amount = Number(document.getElementById("labour-amount").value) || 0;
      if (!desc || !amount) { alert("Enter labour description and amount."); return; }
      job.labour.push({ desc, amount });
      save(KEYS.jobs, jobs); draw(); return;
    }
    if (action === "del-labour") { job.labour.splice(Number(e.target.dataset.idx), 1); save(KEYS.jobs, jobs); draw(); return; }
  };
}

document.getElementById("modal-backdrop").addEventListener("click", (e) => {
  if (e.target.id === "modal-backdrop") { e.target.style.display = "none"; renderBoard(); }
});

/* ---------------- init ---------------- */
fillMechanicSelect();
renderBoard();
renderMechanics();
document.getElementById("jc-date").value = new Date().toISOString().slice(0, 10);

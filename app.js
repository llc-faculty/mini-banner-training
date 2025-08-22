(function(){
  "use strict";

  // ====== CONFIG / CONSTANTS =================================================
  const DEFAULT_TERM = "2025/26";

  // ====== HELPERS ============================================================
  const $  = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const setHidden = (el, v) => el && el.classList.toggle("hidden", !!v);

  const toast = (msg="Saved (demo only)") => {
    const t = $("#toast"); if (!t) return;
    t.textContent = msg; t.classList.add("show");
    setTimeout(()=>t.classList.remove("show"), 1600);
  };

  // Hide all dynamically-created stub pages (e.g., stub-SOAIDEN)
  function hideAllStubs(){
    document.querySelectorAll('[id^="stub-"]').forEach(el => el.classList.add('hidden'));
  }

  // normalize like "202122" -> "2021/22"; otherwise pass-through
  function normalizeTerm(s) {
    if (!s) return "";
    const t = String(s).trim();
    if (/^\d{6}$/.test(t)) return `${t.slice(0,4)}/${t.slice(4)}`;
    return t;
  }

  // Compute roster: people who have a section in term+crn
  function peopleInSection(term, crn, data) {
    const T = normalizeTerm(term);
    const out = [];
    (data||[]).forEach(p => {
      (p.schedule||[]).forEach(sec => {
        const secTerm = normalizeTerm(sec.term || DEFAULT_TERM);
        if (secTerm === T && String(sec.crn) === String(crn)) out.push({person:p, sec});
      });
    });
    return out;
  }

  // Build (or ensure) dynamic containers we need
  function ensureContainers(){
    const holder = document.querySelector(".main-area .container") || document.body;

    // Roster view (SFASLST) if missing
    if (!$("#view-roster")) {
      const div = document.createElement("div");
      div.id = "view-roster";
      div.className = "hidden";
      div.innerHTML = `
        <div class="toolbar">
          <div class="title">SFASLST — Class Roster</div>
          <div><button id="roster-start" class="btn">Start Over</button></div>
        </div>
        <div class="form">
          <div class="section">
            <h3>Roster</h3>
            <table class="table" id="roster-table">
              <thead><tr><th>ID</th><th>Name</th><th>Program</th><th>Term</th><th>CRN</th></tr></thead>
              <tbody></tbody>
            </table>
          </div>
        </div>`;
      holder.appendChild(div);
    }

    // Generic stub card (for all extra enquiry pages)
    if (!$("#view-stub")) {
      const div = document.createElement("div");
      div.id = "view-stub";
      div.className = "hidden";
      div.innerHTML = `
        <div class="toolbar">
          <div class="title" id="stub-title">Page</div>
          <div><button id="stub-start" class="btn">Start Over</button></div>
        </div>
        <div class="form">
          <div class="section">
            <div id="stub-content"></div>
          </div>
        </div>`;
      holder.appendChild(div);
    }

    // Start Over handlers (delegated each time)
    $("#roster-start")?.addEventListener("click", startOver);
    $("#stub-start")?.addEventListener("click", startOver);
  }

  function showStub(title, html){
    // always clear any previously-created stub sections
    hideAllStubs();

    setHidden($("#view-keyblock"), true);
    setHidden($("#view-form"), true);
    setHidden($("#view-swingenq"), true);
    setHidden($("#view-saaadms"), true);
    setHidden($("#view-roster"), true);

    $("#stub-title").textContent = title;
    $("#stub-content").innerHTML = html;
    setHidden($("#view-stub"), false);
  }

  function recentAdd(code, title){
    if (window.__recentAdd) window.__recentAdd(code, title);
  }

  // ====== DATA ==============================================================

  let dataset = [];
  let currentForm = null;
  let selectedPerson = null;

  // Minimal fallback if fetch fails (you’ll use data/students.json)
  const embedded = [
    {
      id: "T00031879",
      firstName: "Alex", middle:"R", lastName:"Green", dob:"2003-04-14",
      address:{type:"PH",line1:"12 Oakfield Road",line2:"",line3:"",city:"BRADCHESTER",county:"West Yorkshire",nation:"GB",stateProv:"",postal:"BD5 2XY",from:"2025-08-01",to:"",source:"TRNG"},
      phones:[{number:"+44 7700 900001", type:"M", primary:true}],
      emergency:{first:"Jamie", last:"Green", relationship:"Sibling", phone:"+44 7700 900011"},
      admissions:{term:"2025/26", program:"BSc Computer Science", status:"Admitted", decision:"Firm"},
      admissionsHistory:[{term:"2024/25", program:"BSc Computer Science", status:"Conditional", decision:"Offer Made"}],
      generalStudent:[{term:"2025/26", status:"Registered", level:"UG", class:"Y1", feeRate:"Home"}],
      schedule:[
        {term:"2025/26", crn:"22010", subject:"COMP", course:"101", title:"Programming I", days:"Tue/Thu", time:"09:00-10:30", room:"CS101"},
        {term:"2025/26", crn:"77007", subject:"MATH", course:"101", title:"Calculus I", days:"Mon/Wed/Fri", time:"09:00-09:50", room:"M1"}
      ],
      courseHistory:[{term:"2024/25", crn:"10021", subject:"COMP", course:"099", title:"Programming Prep", credits:10, grade:"A"}],
      registrationAudit:[{term:"2025/26", crn:"22010", subject:"COMP", course:"101", status:"Add", addDate:"2025-09-18", statusDate:"2025-09-18", message:"Added by student"}],
      degree:[],
      registration:{term:"2025/26", status:"In Progress", holds:[], fees:{tuition:9250, overdue:0}, steps:[{name:"Confirm Personal Details", confirmedAt:"2025-09-01T10:12:00Z"}]},
      footprint:{admissions:true, general:true, registration:true, housing:false, finAid:false, ar:true},
      photoUrl:""
    }
  ];

  async function loadData(){
    try {
      const res = await fetch("data/students.json", {cache:"no-store"});
      if(!res.ok) throw new Error("HTTP "+res.status);
      dataset = await res.json();
    } catch(e){
      console.warn("Using embedded dataset due to fetch error:", e);
      dataset = embedded;
    }
  }

  // ====== SEARCH / WELCOME ==================================================

  // === PAGE REGISTRY ===
  const pages = [
    // Core pages that show real forms in the mock
    { code: "SWADDER", name: "Address Information Form", open: () => showKeyBlock("SWADDER") },
    { code: "SPAIDEN", name: "General Person Identification", open: () => showKeyBlock("SPAIDEN") },
    { code: "SWIGENQ", name: "General Person Query", open: () => showKeyBlock("SWIGENQ") },
    { code: "SAAADMS", name: "Admissions Application", open: () => showKeyBlock("SAAADMS") },
    { code: "SFASLST", name: "Student Class Schedule (Roster)", open: () => showKeyBlock("SFASLST") },

    // Enquiry & Reporting stubs
    { code: "SOAIDEN", name: "Person Search", open: () => openStub("SOAIDEN", "Search for people across ID/Name; use wildcards like %SMI%") },
    { code: "GUIALTI", name: "Alternate ID Search", open: () => openStub("GUIALTI", "Search by alternate IDs (e.g., SSN/SIN/TIN) and names") },
    { code: "SOAIDNS", name: "Person Search Detail", open: () => openStub("SOAIDNS", "Dense person summary; collapse/expand sections; refine then select") },

    // Admin/reporting samples
    { code: "GUASYST", name: "System Control Maintenance", open: () => showKeyBlock("GUASYST") },
    { code: "SAASUMI", name: "Applicant Summary", open: () => showKeyBlock("SAASUMI") },
    { code: "SWASLST", name: "Section List", open: () => showKeyBlock("SWASLST") },
    { code: "SGASTDQ", name: "General Student Quick", open: () => showKeyBlock("SGASTDQ") },
    { code: "SHACRSE", name: "Course Summary", open: () => showKeyBlock("SHACRSE") },
    { code: "SFASTCA", name: "Registration Audit", open: () => showKeyBlock("SFASTCA") },
    { code: "SHADGMQ", name: "Degree Summary", open: () => showKeyBlock("SHADGMQ") },
    { code: "SWATRAC", name: "Tracking (Reg/Fees/Holds)", open: () => showKeyBlock("SWATRAC") },
  ];
  window.pages = pages;

  // === STUB PAGE HELPERS ===
  function ensureStub(code, title, blurb) {
    const id = `stub-${code}`;
    if (document.getElementById(id)) return id;

    const host = document.querySelector(".container");
    const card = document.createElement("section");
    card.id = id;
    card.className = "card hidden";
    card.setAttribute("role", "region");
    card.innerHTML = `
      <h2 style="margin-top:0">${code} — ${title}</h2>
      <p class="small" style="margin-bottom:.75rem">${blurb}</p>
      <div class="section">
        <div class="grid">
          <label>Quick search<input type="text" placeholder="Try %SMI% or T0003…" aria-label="Stub search"></label>
          <button class="btn" data-act="demo-search">Execute Query</button>
          <button class="btn" data-act="open-spaiden">Open SPAIDEN</button>
          <button class="btn" data-act="start-over">Start Over</button>
        </div>
      </div>
      <div class="section">
        <table class="table">
          <thead><tr><th>ID</th><th>Name</th><th>DOB</th><th>Program</th></tr></thead>
          <tbody></tbody>
        </table>
      </div>
    `;
    host.appendChild(card);

    // wire buttons
    card.querySelector('[data-act="start-over"]').addEventListener("click", startOver);
    card.querySelector('[data-act="open-spaiden"]').addEventListener("click", () => {
      // Open SPAIDEN with the first listed match if any; else fall back to key block
      const firstId = card.querySelector("tbody tr td")?.textContent?.trim();
      if (firstId) {
        const p = findById(firstId);
        if (p) return showForm("SPAIDEN", p);
      }
      showKeyBlock("SPAIDEN");
    });
    card.querySelector('[data-act="demo-search"]').addEventListener("click", () => {
      const q = card.querySelector('input[type="text"]').value.trim().toLowerCase();
      const rows = (dataset || []).filter(p =>
        p.id.toLowerCase().includes(q.replace(/%/g, "")) ||
        (p.firstName||"").toLowerCase().includes(q.replace(/%/g, "")) ||
        (p.lastName||"").toLowerCase().includes(q.replace(/%/g, ""))
      );
      const tb = card.querySelector("tbody"); tb.innerHTML = "";
      rows.forEach(p => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${p.id}</td><td>${p.lastName}, ${p.firstName}</td><td>${p.dob || ""}</td><td>${p.admissions?.program || ""}</td>`;
        tr.addEventListener("click", () => showForm("SPAIDEN", p));
        tb.appendChild(tr);
      });
    });

    return id;
  }

  function openStub(code, blurb = "Demo-only stub page") {
    const item = pages.find(p => p.code === code);
    const title = item?.name || "Page";
    const id = ensureStub(code, title, blurb);

    // always hide any other stub sections before showing this one
    hideAllStubs();

    // hide fixed views, then show this stub
    ["view-welcome","recent-panel","view-keyblock","view-form","view-swingenq","view-saaadms","view-roster"]
      .forEach(v => document.getElementById(v)?.classList.add("hidden"));
    document.getElementById(id)?.classList.remove("hidden");

    window.__recentAdd?.(code, title);
  }

  function setupWelcome(){
    const input = $("#search-input");
    const ac = $("#ac-list");
    const btn = $("#search-go");
    let currentIndex = -1;

    function getMatches(q){
      q = q.trim().toLowerCase();
      if(!q) return [];
      return pages.filter(p =>
        p.code.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q)
      );
    }

    function render(matches){
      ac.innerHTML = "";
      if(matches.length===0){ setHidden(ac,true); return; }
      matches.forEach((m)=>{
        const li = document.createElement("li");
        li.setAttribute("role","option");
        li.tabIndex = 0;
        li.innerHTML = `<strong>${m.code}</strong> — ${m.name}`;
        li.addEventListener("click", ()=>{ input.value = m.code; openSelected(m.code); });
        li.addEventListener("keydown", (ev)=>{
          if(ev.key==="Enter"){ input.value = m.code; openSelected(m.code); }
        });
        ac.appendChild(li);
      });
      setHidden(ac, false);
    }

    function openSelected(code){
      const p = pages.find(x => x.code.toLowerCase() === code.trim().toLowerCase());
      if(p){ p.open(); setHidden($("#view-welcome"), true); }
    }

    input.addEventListener("input", ()=>render(getMatches(input.value)));
    input.addEventListener("keydown", (ev)=>{
      const items = $$("#ac-list li");
      if(ev.key==="ArrowDown"){
        ev.preventDefault();
        currentIndex = Math.min(items.length-1, currentIndex+1);
        if(items[currentIndex]) items[currentIndex].focus();
      } else if(ev.key==="Enter"){
        openSelected(input.value);
      }
    });
    btn.addEventListener("click", ()=>openSelected(input.value));

    $("#tab-search").addEventListener("click", ()=>{
      $("#tab-search").classList.add("active");
      $("#tab-direct").classList.remove("active");
      input.placeholder="Pages, Menus, Jobs and Quickflows";
    });
    $("#tab-direct").addEventListener("click", ()=>{
      $("#tab-direct").classList.add("active");
      $("#tab-search").classList.remove("active");
      input.placeholder="Enter page acronym e.g., SWADDER";
      input.focus();
    });
  }

  function startOver(){
    setHidden($("#view-form"), true);
    setHidden($("#view-swingenq"), true);
    setHidden($("#view-saaadms"), true);
    setHidden($("#view-keyblock"), true);
    setHidden($("#view-roster"), true);
    setHidden($("#view-stub"), true);

    // also hide all dynamic stub cards
    hideAllStubs();

    setHidden($("#view-welcome"), false);
    $("#search-input") && ($("#search-input").value="");
    $("#ac-list") && ($("#ac-list").innerHTML="");
    currentForm = null;
    selectedPerson = null;
  }

  // ====== KEY BLOCK =========================================================

  function showKeyBlock(formCode){
    currentForm = formCode;

    // Hide any stub pages when entering a keyblock-driven page
    hideAllStubs();

    setHidden($("#view-welcome"), true);
    setHidden($("#view-swingenq"), true);
    setHidden($("#view-saaadms"), true);
    setHidden($("#view-form"), true);
    setHidden($("#view-stub"), true);
    setHidden($("#view-roster"), true);
    setHidden($("#view-keyblock"), false);

    // reset errors + base fields
    $("#kb-id").value = "";
    $("#kb-error").textContent = ""; setHidden($("#kb-error"), true);

    // dynamic extras
    const ex = $("#kb-extra"); ex.innerHTML = "";
    const idWrap = $("#kb-id-wrap");

    // default hint
    $("#kb-hint").innerHTML = `Enter the required fields, then press <strong>Go</strong> (or Enter).`;

    // Build per-form requirements
    if (formCode === "SFASLST") {
      // Term + CRN required; no ID
      idWrap.style.display = "none";
      ex.innerHTML = `
        <label>Term
          <input id="kb-term" type="text" placeholder="2025/26 or 202122">
        </label>
        <label>CRN
          <input id="kb-crn" type="text" placeholder="22010">
        </label>`;
      $("#kb-hint").innerHTML = `Enter <strong>Term</strong> and <strong>CRN</strong>, then Go.`;

    } else if (formCode === "SWIGENQ") {
      // ID + Term required
      idWrap.style.display = "";
      ex.innerHTML = `
        <label>Term
          <input id="kb-term" type="text" placeholder="2025/26">
        </label>`;
      $("#kb-hint").innerHTML = `Enter <strong>ID</strong> and <strong>Term</strong>, then Go.`;

    } else if (formCode === "SAAADMS" || formCode === "SAASUMI") {
      // ID required, Term optional
      idWrap.style.display = "";
      ex.innerHTML = `
        <label>Term (optional)
          <input id="kb-term" type="text" placeholder="2025/26">
        </label>`;
      $("#kb-hint").innerHTML = `Enter <strong>ID</strong> (and optional Term), then Go.`;

    } else if (formCode === "SGASTDQ" || formCode === "SHACRSE" || formCode === "SFASTCA") {
      // ID + Term required; SFASTCA CRN optional
      idWrap.style.display = "";
      ex.innerHTML = `
        <label>Term
          <input id="kb-term" type="text" placeholder="2025/26">
        </label>
        ${formCode==="SFASTCA" ? `
        <label>CRN (optional)
          <input id="kb-crn" type="text" placeholder="22010">
        </label>` : ``}
      `;
      $("#kb-hint").innerHTML = `Enter <strong>ID</strong> and <strong>Term</strong>${formCode==="SFASTCA"?" (CRN optional)":""}, then Go.`;

    } else if (formCode === "SWASLST") {
      // Term + Subject required; no ID
      idWrap.style.display = "none";
      ex.innerHTML = `
        <label>Term
          <input id="kb-term" type="text" placeholder="2025/26">
        </label>
        <label>Subject
          <input id="kb-subject" type="text" placeholder="COMP">
        </label>`;
      $("#kb-hint").innerHTML = `Enter <strong>Term</strong> and <strong>Subject</strong>, then Go.`;

    } else if (formCode === "GUASYST" || formCode === "SHADGMQ" || formCode === "SWATRAC") {
      // ID only
      idWrap.style.display = "";
      ex.innerHTML = ``;
      $("#kb-hint").innerHTML = `Enter <strong>ID</strong>, then Go.`;

    } else {
      // SWADDER / SPAIDEN default: ID only
      idWrap.style.display = "";
      ex.innerHTML = "";
      $("#kb-hint").innerHTML = `Enter <strong>ID</strong>, then Go. Example: <code>T00031879</code>`;
    }

    $("#kb-id").focus();
  }

  function findById(id){
    id = (id||"").trim();
    return dataset.find(p => p.id.toLowerCase()===id.toLowerCase());
  }

  function bindKeyBlock(){
    function fail(msg){
      $("#kb-error").textContent = msg;
      setHidden($("#kb-error"), false);
    }

    function go(){
      const id   = $("#kb-id")?.value.trim();
      const term = normalizeTerm($("#kb-term")?.value || "");
      const crn  = $("#kb-crn")?.value?.trim();
      const subj = $("#kb-subject")?.value?.trim().toUpperCase();

      setHidden($("#kb-error"), true);

      // SFASLST — Roster
      if (currentForm === "SFASLST") {
        if (!term || !crn) return fail("Please enter both Term and CRN.");
        const roster = peopleInSection(term, crn, dataset);
        if (roster.length === 0) return fail("No enrollments found for that Term/CRN (demo data).");
        showRoster(term, crn, roster);
        recentAdd("SFASLST", `Roster ${term} / ${crn}`);
        return;
      }

      // SWASLST — Section list by Term+Subject
      if (currentForm === "SWASLST") {
        if (!term || !subj) return fail("Please enter both Term and Subject.");
        showSWASLST(term, subj);
        recentAdd("SWASLST", `Sections ${term} / ${subj}`);
        return;
      }

      // Pages that require an ID
      const needsId = ["SWIGENQ","SAAADMS","SAASUMI","SGASTDQ","SHACRSE","SFASTCA","GUASYST","SHADGMQ","SWATRAC","SWADDER","SPAIDEN"].includes(currentForm);
      if (needsId && !id) return fail("Please enter an ID.");
      const person = needsId ? findById(id) : null;
      if (needsId && !person) return fail("No record found for that ID (demo data).");
      selectedPerson = person;

      // SWIGENQ — ID+Term required, then show SPAIDEN
      if (currentForm === "SWIGENQ") {
        if (!term) return fail("Please enter both ID and Term.");
        const hasTerm =
          normalizeTerm(person.admissions?.term || DEFAULT_TERM) === term ||
          (person.admissionsHistory||[]).some(h => normalizeTerm(h.term) === term) ||
          (person.schedule||[]).some(s => normalizeTerm(s.term||DEFAULT_TERM) === term);
        if (!hasTerm) return fail("This person has no data for that Term (demo data). Try 2025/26.");
        showForm("SPAIDEN", person);
        recentAdd("SWIGENQ", `Query ${id} @ ${term}`);
        return;
      }

      // SAAADMS — ID (term optional)
      if (currentForm === "SAAADMS") {
        if (term) {
          const hit = (person.admissionsHistory||[]).find(h => normalizeTerm(h.term) === term);
          person.___origAdms = person.___origAdms || person.admissions;
          if (hit) person.admissions = {...person.admissions, ...hit};
          else toast("No admissions for that term (showing default).");
        }
        showAdmissions(person);
        recentAdd("SAAADMS", `Admissions ${id}${term?` @ ${term}`:""}`);
        return;
      }

      // SAASUMI — Admissions Summary (stub)
      if (currentForm === "SAASUMI") {
        showSAASUMI(person, term);
        recentAdd("SAASUMI", `Admissions Summary ${id}${term?` @ ${term}`:""}`);
        return;
      }

      // SGASTDQ — General Student Quick by Term
      if (currentForm === "SGASTDQ") {
        if (!term) return fail("Please enter Term.");
        showSGASTDQ(person, term);
        recentAdd("SGASTDQ", `General Student ${id} @ ${term}`);
        return;
      }

      // SHACRSE — Course Summary by Term
      if (currentForm === "SHACRSE") {
        if (!term) return fail("Please enter Term.");
        showSHACRSE(person, term);
        recentAdd("SHACRSE", `Course Summary ${id} @ ${term}`);
        return;
      }

      // SFASTCA — Registration Audit by Term (CRN optional)
      if (currentForm === "SFASTCA") {
        if (!term) return fail("Please enter Term.");
        showSFASTCA(person, term, crn);
        recentAdd("SFASTCA", `Reg Audit ${id} @ ${term}${crn?` / ${crn}`:""}`);
        return;
      }

      // GUASYST — Student systems footprint
      if (currentForm === "GUASYST") {
        showGUASYST(person);
        recentAdd("GUASYST", `Footprint ${id}`);
        return;
      }

      // SHADGMQ — Degree Summary (stub)
      if (currentForm === "SHADGMQ") {
        showSHADGMQ(person);
        recentAdd("SHADGMQ", `Degree ${id}`);
        return;
      }

      // SWATRAC — Tracking
      if (currentForm === "SWATRAC") {
        showSWATRAC(person);
        recentAdd("SWATRAC", `Tracking ${id}`);
        return;
      }

      // SWADDER / SPAIDEN (ID only)
      if (currentForm==="SWADDER" || currentForm==="SPAIDEN"){
        showForm(currentForm, person);
        recentAdd(currentForm, `${currentForm} ${id}`);
      } else {
        showForm("SPAIDEN", person);
        recentAdd("SPAIDEN", `SPAIDEN ${id}`);
      }
    }

    $("#kb-go").addEventListener("click", go);

    // Press Enter on any KB input to Go (delegated)
    $("#view-keyblock").addEventListener("keydown", (ev)=>{
      const t = ev.target;
      if (ev.key === "Enter" && (t.matches("#kb-id") || t.matches("#kb-term") || t.matches("#kb-crn") || t.matches("#kb-subject"))) {
        ev.preventDefault();
        go();
      }
    });

    // Optional: Tab from a blank ID opens SOAIDEN
    const kbId = document.getElementById("kb-id");
    if (kbId) {
      kbId.addEventListener("keydown", (ev)=>{
        if (ev.key === "Tab" && !ev.shiftKey && !kbId.value.trim()) {
          ev.preventDefault();
          openStub("SOAIDEN", "Search for people across ID/Name; use wildcards like %SMI%");
        }
      });
    }

    $("#kb-cancel").addEventListener("click", startOver);
    // Options menu ("..." button) inside Key Block
    const kbOptions = document.getElementById("kb-options");
    const kbMenu = document.getElementById("kb-menu");
    const kbWrap = document.querySelector("#view-keyblock .keyblock");

    if (kbOptions && kbMenu && kbWrap) {
      // Ensure the keyblock is the positioning context
      kbWrap.style.position = kbWrap.style.position || "relative";

      const placeMenu = () => {
        const br = kbOptions.getBoundingClientRect();
        const cr = kbWrap.getBoundingClientRect();
        kbMenu.style.left = Math.max(0, br.left - cr.left) + "px";
        kbMenu.style.top  = (br.bottom - cr.top + 4) + "px";
      };

      kbOptions.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const open = kbOptions.getAttribute("aria-expanded") === "true";
        if (open) {
          kbMenu.classList.add("hidden");
          kbOptions.setAttribute("aria-expanded", "false");
        } else {
          placeMenu();
          kbMenu.classList.remove("hidden");
          kbOptions.setAttribute("aria-expanded", "true");
        }
      });

      // Click-away to close
      document.addEventListener("click", (ev) => {
        if (!kbMenu.classList.contains("hidden") &&
            !ev.target.closest("#kb-menu") &&
            !ev.target.closest("#kb-options")) {
          kbMenu.classList.add("hidden");
          kbOptions.setAttribute("aria-expanded", "false");
        }
      });

      // Menu actions
      kbMenu.querySelectorAll("[role='menuitem']").forEach(btn => {
        btn.addEventListener("click", () => {
          const code = btn.getAttribute("data-open");
          if (code) openStub(code, "Demo search page");
          kbMenu.classList.add("hidden");
          kbOptions.setAttribute("aria-expanded", "false");
        });
      });
    }

  }

  // ====== CORE FORMS ========================================================
  function showForm(formCode, person){
    // Hide any stub pages when entering a full form
    hideAllStubs();

    setHidden($("#view-keyblock"), true);
    setHidden($("#view-swingenq"), true);
    setHidden($("#view-saaadms"), true);
    setHidden($("#view-roster"), true);
    setHidden($("#view-stub"), true);
    setHidden($("#view-form"), false);
    const titleMap = {
      "SWADDER":"SWADDER — Address Information 9.0",
      "SPAIDEN":"SPAIDEN — General Person",
      "SFASLST":"SFASLST — Student Class Schedule"
    };
    $("#form-title").textContent = titleMap[formCode] || "Form";

    $("#f-id").value = person.id;
    $("#f-name").value = [person.lastName, person.firstName, person.middle].filter(Boolean).join(", ");
    $("#f-dob").value = person.dob || "";
    $("#f-program").value = person.admissions?.program || "";

    const a = person.address||{};
    $("#f-addr-type").value = a.type||"PH";
    $("#f-from").value = a.from||"";
    $("#f-a1").value = a.line1||"";
    $("#f-a2").value = a.line2||"";
    $("#f-a3").value = a.line3||"";
    $("#f-city").value = a.city||"";
    $("#f-county").value = a.county||"";
    $("#f-nation").value = a.nation||"";
    $("#f-postal").value = a.postal||"";
    $("#f-source").value = a.source||"";

    $("#f-ec-first").value = person.emergency?.first || "";
    $("#f-ec-last").value = person.emergency?.last || "";
    $("#f-ec-rel").value = person.emergency?.relationship || "";
    $("#f-ec-phone").value = person.emergency?.phone || "";

    const ptb = $("#phone-table tbody"); ptb.innerHTML = "";
    (person.phones||[]).forEach(ph=>{
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${ph.number}</td><td>${ph.type||""}</td><td>${ph.primary?"Yes":"No"}</td>`;
      ptb.appendChild(tr);
    });

    setHidden($("#spaid-extra"), formCode!=="SPAIDEN");
    $("#spaid-term").value = person.admissions?.term || "";

    setHidden($("#sfaslst"), formCode!=="SFASLST");
    const stb = $("#sched-table tbody"); stb.innerHTML="";
    (person.schedule||[]).forEach(c=>{
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${c.crn}</td><td>${c.subject}</td><td>${c.course}</td><td>${c.title}</td><td>${c.days}</td><td>${c.time}</td><td>${c.room}</td>`;
      stb.appendChild(tr);
    });
  }

  function showRoster(term, crn, rows){
    // Hide stubs when moving to roster
    hideAllStubs();

    setHidden($("#view-keyblock"), true);
    setHidden($("#view-form"), true);
    setHidden($("#view-swingenq"), true);
    setHidden($("#view-saaadms"), true);
    setHidden($("#view-stub"), true);
    setHidden($("#view-roster"), false);

    const T = normalizeTerm(term);
    $("#view-roster .title").textContent = `SFASLST — Class Roster (${T}, CRN ${crn})`;

    const tb = $("#roster-table tbody"); tb.innerHTML = "";
    rows.forEach(({person, sec})=>{
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${person.id}</td>
        <td>${person.lastName}, ${person.firstName}</td>
        <td>${person.admissions?.program || ""}</td>
        <td>${normalizeTerm(sec.term || DEFAULT_TERM)}</td>
        <td>${sec.crn}</td>`;
      tr.addEventListener("click", ()=> showForm("SPAIDEN", person));
      tb.appendChild(tr);
    });
    $("#roster-start")?.addEventListener("click", startOver, {once:true});
  }

  function showAdmissions(person){
    // Hide stubs when moving to admissions
    hideAllStubs();

    setHidden($("#view-keyblock"), true);
    setHidden($("#view-form"), true);
    setHidden($("#view-swingenq"), true);
    setHidden($("#view-stub"), true);
    setHidden($("#view-roster"), true);
    setHidden($("#view-saaadms"), false);
    $("#adms-id").value = person.id;
    $("#adms-name").value = `${person.lastName}, ${person.firstName}`;
    $("#adms-term").value = person.admissions?.term || "";
    $("#adms-program").value = person.admissions?.program || "";
    $("#adms-status").value = person.admissions?.status || "";
    $("#adms-decision").value = person.admissions?.decision || "";
  }

  // ====== SWIGENQ ===========================================================
  function showGQ(){
    currentForm = "SWIGENQ";

    // Hide stubs when moving to SWIGENQ table view
    hideAllStubs();

    setHidden($("#view-welcome"), true);
    setHidden($("#view-form"), true);
    setHidden($("#view-saaadms"), true);
    setHidden($("#view-keyblock"), true);
    setHidden($("#view-stub"), true);
    setHidden($("#view-roster"), true);
    setHidden($("#view-swingenq"), false);
    $("#gq-input").value="";
    renderGQRows(dataset);
    $("#gq-input").focus();
  }

  function renderGQRows(rows){
    const body = $("#gq-body"); body.innerHTML = "";
    rows.forEach(p => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${p.id}</td><td>${p.lastName}, ${p.firstName}</td><td>${p.dob||""}</td><td>${p.admissions?.program||""}</td><td><button class="btn btn-mini">Open</button></td>`;
      tr.addEventListener("click", ()=>{ showForm("SPAIDEN", p); });
      tr.querySelector("button").addEventListener("click",(e)=>{ e.stopPropagation(); showForm("SPAIDEN", p); });
      body.appendChild(tr);
    });
  }

  function bindGQ(){
    $("#gq-search").addEventListener("click", doSearch);
    $("#gq-input").addEventListener("keydown", (ev)=>{ if(ev.key==="Enter"){ doSearch(); } });
    function doSearch(){
      const q = $("#gq-input").value.trim().toLowerCase();
      if(!q){ renderGQRows(dataset); return; }
      const res = dataset.filter(p =>
        p.id.toLowerCase().includes(q) ||
        (p.firstName||"").toLowerCase().includes(q) ||
        (p.lastName||"").toLowerCase().includes(q)
      );
      renderGQRows(res);
    }
  }

  // ====== STUB PAGE RENDERERS ==============================================
  function showGUASYST(p){
    const fp = p.footprint || {};
    const row = (label,val)=>`<tr><td>${label}</td><td>${val? "✔︎" : "—"}</td></tr>`;
    showStub(
      `GUASYST — Student Systems Footprint (${p.id})`,
      `<div class="grid" style="grid-template-columns:1fr;max-width:520px">
        <table class="table">
          <thead><tr><th>System</th><th>Present</th></tr></thead>
          <tbody>
            ${row("Admissions", fp.admissions)}
            ${row("General Student", fp.general)}
            ${row("Registration/Records", fp.registration)}
            ${row("Housing", fp.housing)}
            ${row("Financial Aid", fp.finAid)}
            ${row("Accounts Receivable", fp.ar)}
          </tbody>
        </table>
        <p class="small">Tip: Use the search to jump to <strong>SAASUMI</strong>, <strong>SGASTDQ</strong>, or <strong>SHACRSE</strong> for detail.</p>
      </div>`
    );
  }

  function showSAASUMI(p, term){
    const T = term || normalizeTerm(p.admissions?.term || DEFAULT_TERM);
    const hitHist = (p.admissionsHistory||[]).find(h => normalizeTerm(h.term)===T);
    const active  = hitHist || (normalizeTerm(p.admissions?.term)===T ? p.admissions : null);

    showStub(
      `SAASUMI — Admissions Summary (${p.id}${T?` @ ${T}`:""})`,
      active ? `
        <div class="grid" style="grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem;max-width:780px">
          <div><label>Banner ID</label><div>${p.id}</div></div>
          <div><label>Name</label><div>${p.lastName}, ${p.firstName}</div></div>
          <div><label>Term</label><div>${normalizeTerm(active.term)}</div></div>
          <div><label>Programme</label><div>${active.program||""}</div></div>
          <div><label>Status</label><div>${active.status||""}</div></div>
          <div><label>Decision</label><div>${active.decision||""}</div></div>
        </div>
        <h3 style="margin-top:1.25rem">History</h3>
        <table class="table">
          <thead><tr><th>Term</th><th>Programme</th><th>Status</th><th>Decision</th></tr></thead>
          <tbody>
            ${[p.admissions, ...(p.admissionsHistory || [])]
              .filter(Boolean)
              .map(x=>`
                <tr><td>${normalizeTerm(x.term)}</td><td>${x.program||""}</td><td>${x.status||""}</td><td>${x.decision||""}</td></tr>
              `).join("")}
          </tbody>
        </table>
      ` : `<p>No admissions record found for ${T || "(no term provided)"} in demo data.</p>`
    );
  }

  function showSGASTDQ(p, term){
    const T = normalizeTerm(term);
    const rec = (p.generalStudent||[]).find(g => normalizeTerm(g.term)===T);
    showStub(
      `SGASTDQ — General Student (${p.id} @ ${T})`,
      rec ? `
        <div class="grid" style="grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem;max-width:900px">
          <div><label>Status</label><div>${rec.status||""}</div></div>
          <div><label>Level</label><div>${rec.level||""}</div></div>
          <div><label>Class</label><div>${rec.class||""}</div></div>
          <div><label>Fee Rate</label><div>${rec.feeRate||""}</div></div>
          <div><label>Programme</label><div>${p.admissions?.program||""}</div></div>
          <div><label>Term</label><div>${normalizeTerm(rec.term)}</div></div>
        </div>
      ` : `<p>No general student record found for ${T} in demo data.</p>`
    );
  }

  function showSHACRSE(p, term){
    const T = normalizeTerm(term);
    const current = (p.schedule||[]).filter(s => normalizeTerm(s.term||DEFAULT_TERM)===T);
    const prior   = (p.courseHistory||[]).filter(c => !T || normalizeTerm(c.term)===T);

    showStub(
      `SHACRSE — Course Summary (${p.id} @ ${T})`,
      `
      <h3>Current modules</h3>
      <table class="table">
        <thead><tr><th>CRN</th><th>Subj</th><th>Course</th><th>Title</th><th>Days</th><th>Time</th><th>Room</th></tr></thead>
        <tbody>
          ${current.length ? current.map(c=>`
            <tr><td>${c.crn}</td><td>${c.subject}</td><td>${c.course}</td><td>${c.title}</td><td>${c.days}</td><td>${c.time}</td><td>${c.room}</td></tr>
          `).join("") : `<tr><td colspan="7">No current modules in ${T}.</td></tr>`}
        </tbody>
      </table>

      <h3 style="margin-top:1rem">Prior completions</h3>
      <table class="table">
        <thead><tr><th>Term</th><th>CRN</th><th>Subj</th><th>Course</th><th>Title</th><th>Credits</th><th>Grade</th></tr></thead>
        <tbody>
          ${prior.length ? prior.map(c=>`
            <tr><td>${normalizeTerm(c.term)}</td><td>${c.crn}</td><td>${c.subject}</td><td>${c.course}</td><td>${c.title}</td><td>${c.credits??""}</td><td>${c.grade??""}</td></tr>
          `).join("") : `<tr><td colspan="7">No completions recorded for ${T}.</td></tr>`}
        </tbody>
      </table>
      `
    );
  }

  function showSFASTCA(p, term, crn){
    const T = normalizeTerm(term);
    let rows = (p.registrationAudit||[]).filter(r => normalizeTerm(r.term)===T);
    if (crn) rows = rows.filter(r => String(r.crn)===String(crn));

    showStub(
      `SFASTCA — Registration Audit (${p.id} @ ${T}${crn?` / ${crn}`:""})`,
      `
      <table class="table">
        <thead><tr><th>Date</th><th>Status</th><th>CRN</th><th>Subj</th><th>Course</th><th>Message</th></tr></thead>
        <tbody>
          ${rows.length ? rows.map(r=>`
            <tr><td>${r.statusDate||r.addDate||""}</td><td>${r.status||""}</td><td>${r.crn||""}</td><td>${r.subject||""}</td><td>${r.course||""}</td><td>${r.message||""}</td></tr>
          `).join("") : `<tr><td colspan="6">No registration audit entries for ${T}${crn?` / CRN ${crn}`:""}.</td></tr>`}
        </tbody>
      </table>
      `
    );
  }

  function showSWASLST(term, subject){
    const T = normalizeTerm(term);
    const SUBJ = (subject||"").toUpperCase();

    // Build unique sections in this term+subject
    const map = new Map(); // crn -> {sec, count}
    dataset.forEach(p=>{
      (p.schedule||[]).forEach(s=>{
        if (normalizeTerm(s.term||DEFAULT_TERM)===T && s.subject?.toUpperCase()===SUBJ) {
          const key = String(s.crn);
          if (!map.has(key)) map.set(key, {sec:s, count:0});
          map.get(key).count += 1;
        }
      });
    });
    const sections = Array.from(map.entries()).map(([crn, obj])=>({crn, ...obj}));

    showStub(
      `SWASLST — Sections (${SUBJ} @ ${T})`,
      `
      <p class="small">Click a row to view the roster (SFASLST).</p>
      <table class="table" id="swalst-table">
        <thead><tr><th>CRN</th><th>Subject</th><th>Course</th><th>Title</th><th>Enrolled (demo)</th></tr></thead>
        <tbody>
          ${sections.length ? sections.map(x=>`
            <tr data-crn="${x.crn}"><td>${x.crn}</td><td>${x.sec.subject}</td><td>${x.sec.course}</td><td>${x.sec.title}</td><td>${x.count}</td></tr>
          `).join("") : `<tr><td colspan="5">No sections for ${SUBJ} in ${T} (demo data).</td></tr>`}
        </tbody>
      </table>
      `
    );

    // Row click → roster
    $("#swalst-table tbody")?.addEventListener("click", (ev)=>{
      const tr = ev.target.closest("tr[data-crn]");
      if (!tr) return;
      const crn = tr.getAttribute("data-crn");
      const roster = peopleInSection(T, crn, dataset);
      if (!roster.length) { toast("No enrollments for that section (demo)"); return; }
      showRoster(T, crn, roster);
    });
  }

  function showSHADGMQ(p){
    const deg = p.degree||[];
    showStub(
      `SHADGMQ — Degree Summary (${p.id})`,
      deg.length ? `
        <table class="table">
          <thead><tr><th>Program</th><th>Catalog</th><th>Status</th><th>Expected Grad</th></tr></thead>
          <tbody>
            ${deg.map(d=>`
              <tr><td>${d.program||""}</td><td>${d.catalog||""}</td><td>${d.status||""}</td><td>${d.expectedGrad||""}</td></tr>
            `).join("")}
          </tbody>
        </table>
      ` : `<p>No degree records in demo data for ${p.id}.</p>`
    );
  }

  function showSWATRAC(p){
    const reg = p.registration || {};
    const holds = reg.holds || [];
    const steps = reg.steps || [];
    const fees  = reg.fees || {};

    showStub(
      `SWATRAC — Tracking (${p.id})`,
      `
      <div class="grid" style="grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem;max-width:1000px">
        <div>
          <h3>Registration</h3>
          <p><strong>Status:</strong> ${reg.status||"—"}</p>
          <p><strong>Term:</strong> ${normalizeTerm(reg.term||"")}</p>
        </div>
        <div>
          <h3>Fees</h3>
          <p><strong>Tuition:</strong> ${fees.tuition!=null ? `£${fees.tuition}`:"—"}</p>
          <p><strong>Overdue:</strong> ${fees.overdue!=null ? `£${fees.overdue}`:"—"}</p>
        </div>
        <div>
          <h3>Holds</h3>
          ${holds.length ? `<ul>${holds.map(h=>`<li>${h.type||"Hold"} — ${h.note||""}</li>`).join("")}</ul>` : `<p>None</p>`}
        </div>
      </div>

      <h3 style="margin-top:1rem">Steps</h3>
      <table class="table">
        <thead><tr><th>Step</th><th>Confirmed At</th></tr></thead>
        <tbody>
          ${steps.length ? steps.map(s=>`
            <tr><td>${s.name}</td><td>${s.confirmedAt ? new Date(s.confirmedAt).toLocaleString(): "—"}</td></tr>
          `).join("") : `<tr><td colspan="2">No steps recorded.</td></tr>`}
        </tbody>
      </table>
      `
    );
  }

  // ====== CHROME BUTTONS (existing) =========================================
  function bindChrome(){
    $("#btn-start")?.addEventListener("click", startOver);
    $("#btn-save")?.addEventListener("click", ()=>toast("Saved (demo only)"));
    $("#adms-start")?.addEventListener("click", startOver);
  }

  // ====== INIT ===============================================================

  document.addEventListener("DOMContentLoaded", async ()=>{
    ensureContainers();
    await loadData();
    setupWelcome();
    bindKeyBlock();
    bindGQ();
    bindChrome();
  });

})();


// ===== sidebar + recently-opened wiring (leave as-is) ========================
(function(){
  const VIEWS = ['view-welcome','recent-panel','view-keyblock','view-form','view-swingenq','view-saaadms','view-roster','view-stub'];
  const recent = [];

  function showView(id){
    VIEWS.forEach(v => document.getElementById(v)?.classList.add('hidden'));
    document.getElementById(id)?.classList.remove('hidden');
  }
  function setActive(btn){
    document.querySelectorAll('.nav-icon').forEach(b => b.removeAttribute('aria-current'));
    btn?.setAttribute('aria-current','page');
  }
  function recentAdd(code, title){
    recent.unshift({code, title}); while (recent.length > 8) recent.pop();
    const b = document.getElementById('badge-recent'); if (b) b.textContent = String(recent.length);
    const list = document.getElementById('recent-list');
    if (list){ list.innerHTML = recent.map(r => `<li><strong>${r.title}</strong> (${r.code})</li>`).join(''); }
  }
  // expose
  window.__recentAdd = recentAdd;

  document.getElementById('icon-home')?.addEventListener('click', e => {
    showView('view-welcome'); setActive(e.currentTarget);
  });

  document.getElementById('icon-search')?.addEventListener('click', e => {
    showView('view-welcome'); setActive(e.currentTarget);
    const inp = document.getElementById('search-input'); if (inp){ inp.focus(); inp.select?.(); }
  });

  document.getElementById('icon-recent')?.addEventListener('click', e => {
    showView('recent-panel'); setActive(e.currentTarget);
  });

  document.getElementById('icon-help')?.addEventListener('click', () => alert(
    'Keyboard shortcuts (mock):\n• Ctrl+M Applications\n• Ctrl+Y Recently Opened\n• Ctrl+Shift+X Dashboard\n• Ctrl+D Favorites\n• Ctrl+Shift+L Help\n• Ctrl+Shift+Y Search\n• Ctrl+Shift+F Sign Out'
  ));

  document.getElementById('icon-menu')?.addEventListener('click', () =>
    alert('Applications menu is not implemented in this mock.')
  );
  document.getElementById('icon-grid')?.addEventListener('click', () =>
    alert('Applications menu is not implemented in this mock.')
  );

  window.addEventListener('keydown', ev => { if (ev.key === 'Home') ev.preventDefault(); });
  setActive(document.getElementById('icon-home'));
})();

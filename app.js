(function () {
  "use strict";

  // -------------------------
  // PAGE REGISTRY (search bar)
  // -------------------------
  const pages = [
    { code: "SWADDER", name: "Address Information Form", open: () => showKeyBlock("SWADDER") },
    { code: "SPAIDEN", name: "General Person Identification", open: () => showKeyBlock("SPAIDEN") },
    // SWIGENQ opens the Key Block (ID + Term) to mimic real Banner, then lands on SPAIDEN
    { code: "SWIGENQ", name: "General Person Query", open: () => showKeyBlock("SWIGENQ") },
    { code: "SAAADMS", name: "Admissions Application", open: () => showKeyBlock("SAAADMS") },
    { code: "SFASLST", name: "Student Class Schedule", open: () => showKeyBlock("SFASLST") },
  ];

  // -------------------------
  // LITTLE DOM HELPERS
  // -------------------------
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const setHidden = (el, v) => el && el.classList && el.classList.toggle("hidden", !!v);

  const toast = (msg = "Saved (demo only)") => {
    const t = $("#toast"); if (!t) return;
    t.textContent = msg; t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 1600);
  };

  // --------------------------------
  // TERM/CRN HELPERS FOR SFASLST etc
  // --------------------------------
  const DEFAULT_TERM = "2025/26"; // fallback if schedules omit term

  // normalize "202122" -> "2021/22" else pass-through
  function normalizeTerm(s) {
    if (!s) return "";
    const t = String(s).trim();
    if (/^\d{6}$/.test(t)) return `${t.slice(0, 4)}/${t.slice(4)}`;
    return t;
  }

  // build roster list for a given term+crn
  function peopleInSection(term, crn, data) {
    const T = normalizeTerm(term);
    const out = [];
    (data || []).forEach((p) => {
      (p.schedule || []).forEach((sec) => {
        const secTerm = normalizeTerm(sec.term || DEFAULT_TERM);
        if (secTerm === T && String(sec.crn) === String(crn)) out.push({ person: p, sec });
      });
    });
    return out;
  }

  // -------------------------
  // STATE
  // -------------------------
  let dataset = [];
  let currentForm = null;
  let selectedPerson = null;

  // -------------------------
  // EMBEDDED DEMO DATA (fallback if /data/students.json not reachable)
  // -------------------------
  const embedded = [{"id":"T00031879","firstName":"Lucy","middle":"C","lastName":"Parkin","dob":"1999-06-14","address":{"type":"PH","line1":"1234 An address","line2":"","line3":"","city":"BRADCHESTER","county":"West Yorkshire","nation":"GB","stateProv":"","postal":"BD5 2XY","from":"2025-08-06","to":"","source":"TRNG"},"phones":[{"number":"07123 456789","type":"M","primary":true}],"emergency":{"first":"Alex","last":"Parkin","relationship":"Sibling","phone":"07111 222333"},"admissions":{"term":"2025/26","program":"BA Linguistics","status":"Admitted","decision":"Firm"},"schedule":[{"crn":"10021","subject":"LING","course":"101","title":"Intro to Linguistics","days":"Mon/Wed","time":"10:00-11:00","room":"B20"},{"crn":"10311","subject":"HIST","course":"120","title":"History of Language","days":"Fri","time":"13:00-15:00","room":"A14"}]},{"id":"T00042001","firstName":"Maya","middle":"","lastName":"Singh","dob":"2001-02-05","address":{"type":"PH","line1":"42 Oak Street","line2":"Flat 2","line3":"","city":"LEEDSBURY","county":"West Yorkshire","nation":"GB","stateProv":"","postal":"LS2 7AB","from":"2025-07-20","to":"","source":"TRNG"},"phones":[{"number":"07900 111222","type":"M","primary":true},{"number":"0113 555 0099","type":"H","primary":false}],"emergency":{"first":"Ravi","last":"Singh","relationship":"Parent","phone":"07900 000111"},"admissions":{"term":"2025/26","program":"BSc Computer Science","status":"Conditional","decision":"Offer Made"},"schedule":[{"crn":"22010","subject":"COMP","course":"101","title":"Programming I","days":"Tue/Thu","time":"09:00-10:30","room":"CS101"},{"crn":"22022","subject":"MATH","course":"140","title":"Discrete Maths","days":"Wed","time":"14:00-16:00","room":"M12"}]},{"id":"T00042002","firstName":"Owen","middle":"J","lastName":"Davies","dob":"2000-11-02","address":{"type":"PH","line1":"9 River Way","line2":"","line3":"","city":"EASTFORD","county":"North Yorkshire","nation":"GB","stateProv":"","postal":"YO10 3CD","from":"2025-07-30","to":"","source":"TRNG"},"phones":[{"number":"07877 123456","type":"M","primary":true}],"emergency":{"first":"Sara","last":"Davies","relationship":"Partner","phone":"07888 654321"},"admissions":{"term":"2025/26","program":"BA History","status":"Admitted","decision":"Firm"},"schedule":[{"crn":"33001","subject":"HIST","course":"101","title":"World History","days":"Mon","time":"12:00-14:00","room":"H3"},{"crn":"33015","subject":"ARCH","course":"110","title":"Intro Archaeology","days":"Thu","time":"10:00-12:00","room":"AR2"}]},{"id":"T00042003","firstName":"Aisha","middle":"M","lastName":"Hussain","dob":"1998-12-17","address":{"type":"PH","line1":"77 Meadow Close","line2":"","line3":"","city":"BRADCHESTER","county":"West Yorkshire","nation":"GB","stateProv":"","postal":"BD1 4XY","from":"2025-08-01","to":"","source":"TRNG"},"phones":[{"number":"07700 900123","type":"M","primary":true}],"emergency":{"first":"Imran","last":"Hussain","relationship":"Parent","phone":"07700 900124"},"admissions":{"term":"2025/26","program":"BSc Biology","status":"Admitted","decision":"Firm"},"schedule":[{"crn":"44002","subject":"BIOL","course":"100","title":"Cells & Molecules","days":"Tue","time":"11:00-13:00","room":"B1"},{"crn":"44018","subject":"CHEM","course":"101","title":"Chemistry Basics","days":"Fri","time":"10:00-12:00","room":"C2"}]},{"id":"T00042004","firstName":"James","middle":"R","lastName":"Nguyen","dob":"2002-03-22","address":{"type":"PH","line1":"11 Kingfisher Rd","line2":"","line3":"","city":"LEEDSBURY","county":"West Yorkshire","nation":"GB","stateProv":"","postal":"LS6 4AA","from":"2025-07-10","to":"","source":"TRNG"},"phones":[{"number":"07555 333444","type":"M","primary":true}],"emergency":{"first":"Trang","last":"Nguyen","relationship":"Parent","phone":"07555 222111"},"admissions":{"term":"2025/26","program":"MEng Mechanical Engineering","status":"Conditional","decision":"Offer Made"},"schedule":[{"crn":"55031","subject":"ENGR","course":"101","title":"Statics","days":"Mon/Wed","time":"09:30-10:30","room":"E201"},{"crn":"55048","subject":"COMP","course":"102","title":"Programming II","days":"Thu","time":"11:00-13:00","room":"CS102"}]},{"id":"T00042005","firstName":"Elena","middle":"","lastName":"Garcia","dob":"2001-08-09","address":{"type":"PH","line1":"3 Market Lane","line2":"","line3":"","city":"KIRKBY","county":"North Yorkshire","nation":"GB","stateProv":"","postal":"YO18 2HG","from":"2025-08-03","to":"","source":"TRNG"},"phones":[{"number":"07444 888999","type":"M","primary":true}],"emergency":{"first":"Luis","last":"Garcia","relationship":"Parent","phone":"07444 111222"},"admissions":{"term":"2025/26","program":"BA English Literature","status":"Admitted","decision":"Firm"},"schedule":[{"crn":"66012","subject":"ENGL","course":"101","title":"Poetry & Prose","days":"Tue","time":"15:00-17:00","room":"L2"},{"crn":"66021","subject":"ENGL","course":"115","title":"Shakespeare","days":"Thu","time":"10:00-12:00","room":"L4"}]},{"id":"T00042006","firstName":"Noah","middle":"K","lastName":"Baker","dob":"2000-01-28","address":{"type":"PH","line1":"19 Canal View","line2":"","line3":"","city":"RIVERDALE","county":"West Yorkshire","nation":"GB","stateProv":"","postal":"WF1 9ZZ","from":"2025-07-28","to":"","source":"TRNG"},"phones":[{"number":"07321 555666","type":"M","primary":true}],"emergency":{"first":"Kate","last":"Baker","relationship":"Spouse","phone":"07321 000111"},"admissions":{"term":"2025/26","program":"BSc Mathematics","status":"Admitted","decision":"Firm"},"schedule":[{"crn":"77007","subject":"MATH","course":"101","title":"Calculus I","days":"Mon/Wed/Fri","time":"09:00-09:50","room":"M1"},{"crn":"77044","subject":"PHYS","course":"120","title":"Mechanics","days":"Thu","time":"14:00-16:00","room":"P4"}]},{"id":"T00042007","firstName":"Zara","middle":"L","lastName":"Ahmed","dob":"2003-10-12","address":{"type":"PH","line1":"88 Hill Top","line2":"","line3":"","city":"BRADCHESTER","county":"West Yorkshire","nation":"GB","stateProv":"","postal":"BD7 1PQ","from":"2025-08-05","to":"","source":"TRNG"},"phones":[{"number":"07123 000777","type":"M","primary":true}],"emergency":{"first":"Nadia","last":"Ahmed","relationship":"Parent","phone":"07123 000778"},"admissions":{"term":"2025/26","program":"BSc Psychology","status":"Conditional","decision":"Offer Made"},"schedule":[{"crn":"88010","subject":"PSYC","course":"101","title":"Intro Psych","days":"Wed","time":"11:00-13:00","room":"P1"},{"crn":"88016","subject":"STAT","course":"110","title":"Stats for Psych","days":"Fri","time":"09:00-11:00","room":"S3"}]},{"id":"T00042008","firstName":"Ben","middle":"T","lastName":"Coleman","dob":"1999-04-30","address":{"type":"PH","line1":"21 Stonegate","line2":"","line3":"","city":"LEEDSBURY","county":"West Yorkshire","nation":"GB","stateProv":"","postal":"LS1 8PT","from":"2025-07-22","to":"","source":"TRNG"},"phones":[{"number":"07890 123123","type":"M","primary":true}],"emergency":{"first":"Hannah","last":"Coleman","relationship":"Sibling","phone":"07890 123124"},"admissions":{"term":"2025/26","program":"BBA Management","status":"Admitted","decision":"Firm"},"schedule":[{"crn":"99001","subject":"BUSI","course":"101","title":"Intro to Business","days":"Mon","time":"16:00-18:00","room":"B10"},{"crn":"99009","subject":"ECON","course":"105","title":"Microeconomics","days":"Thu","time":"09:00-11:00","room":"E2"}]},{"id":"T00042009","firstName":"Sophie","middle":"A","lastName":"Reid","dob":"2002-05-11","address":{"type":"PH","line1":"4 Mill Court","line2":"","line3":"","city":"FAIRVIEW","county":"North Yorkshire","nation":"GB","stateProv":"","postal":"YO1 1AA","from":"2025-07-18","to":"","source":"TRNG"},"phones":[{"number":"07222 555111","type":"M","primary":true}],"emergency":{"first":"Tom","last":"Reid","relationship":"Parent","phone":"07222 555112"},"admissions":{"term":"2025/26","program":"BSc Physics","status":"Admitted","decision":"Firm"},"schedule":[{"crn":"11101","subject":"PHYS","course":"101","title":"Waves & Optics","days":"Tue","time":"10:00-12:00","room":"P2"},{"crn":"11122","subject":"MATH","course":"130","title":"Linear Algebra","days":"Fri","time":"14:00-16:00","room":"M5"}]}];

  // -------------------------
  // BOOTSTRAP DATA
  // -------------------------
  async function loadData() {
    try {
      const res = await fetch("data/students.json", { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      dataset = await res.json();
    } catch (e) {
      console.warn("Using embedded dataset due to fetch error:", e);
      dataset = embedded;
    }
  }

  // -------------------------
  // DEFENSIVE SCAFFOLDING
  // -------------------------
  function ensureKeyblockScaffold() {
    const vk = $("#view-keyblock"); if (!vk) return;
    const kb = vk.querySelector(".keyblock") || vk;

    // Ensure kb-hint exists
    if (!$("#kb-hint")) {
      const hint = document.createElement("div");
      hint.id = "kb-hint";
      hint.className = "small";
      hint.style.marginTop = ".5rem";
      // place after the keyblock row
      kb.insertAdjacentElement("afterend", hint);
    }

    // Ensure kb-id-wrap id is present on the label that contains #kb-id
    const idInput = $("#kb-id");
    if (idInput) {
      const label = idInput.closest("label") || idInput.parentElement;
      if (label && !$("#kb-id-wrap")) label.id = "kb-id-wrap";
    }

    // Ensure kb-extra container exists (for Term/CRN)
    if (!$("#kb-extra")) {
      const ex = document.createElement("div");
      ex.id = "kb-extra";
      ex.className = "kb-extra";
      // place before Go/Cancel buttons
      const go = $("#kb-go");
      if (go && go.parentElement) go.parentElement.insertBefore(ex, go);
      else kb.appendChild(ex);
    }
  }

  function ensureRosterView() {
    if ($("#view-roster")) return;
    const cont = $(".container") || document.body;
    const view = document.createElement("div");
    view.id = "view-roster";
    view.className = "hidden";
    view.innerHTML = `
      <div class="toolbar">
        <div class="title">SFASLST — Class Roster</div>
        <div><button id="roster-start" class="btn">Start Over</button></div>
      </div>
      <div class="section">
        <table class="table" id="roster-table">
          <thead><tr><th>ID</th><th>Name</th><th>Program</th><th>Term</th><th>CRN</th></tr></thead>
          <tbody></tbody>
        </table>
      </div>`;
    cont.appendChild(view);
  }

  // -------------------------
  // WELCOME / SEARCH PAGE
  // -------------------------
  function setupWelcome() {
    const input = $("#search-input");
    const ac = $("#ac-list");
    const btn = $("#search-go");
    if (!input || !ac || !btn) return;

    let currentIndex = -1;

    function getMatches(q) {
      q = q.trim().toLowerCase();
      if (!q) return [];
      return pages.filter(
        (p) => p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
      );
    }

    function render(matches) {
      ac.innerHTML = "";
      if (matches.length === 0) { setHidden(ac, true); return; }
      matches.forEach((m) => {
        const li = document.createElement("li");
        li.setAttribute("role", "option");
        li.tabIndex = 0;
        li.innerHTML = `<strong>${m.code}</strong> — ${m.name}`;
        li.addEventListener("click", () => { input.value = m.code; openSelected(m.code); });
        li.addEventListener("keydown", (ev) => { if (ev.key === "Enter") { input.value = m.code; openSelected(m.code); } });
        ac.appendChild(li);
      });
      setHidden(ac, false);
    }

    function openSelected(code) {
      const p = pages.find((x) => x.code.toLowerCase() === code.trim().toLowerCase());
      if (p) { p.open(); setHidden($("#view-welcome"), true); }
    }

    input.addEventListener("input", () => render(getMatches(input.value)));
    input.addEventListener("keydown", (ev) => {
      const items = $$("#ac-list li");
      if (ev.key === "ArrowDown") {
        ev.preventDefault();
        currentIndex = Math.min(items.length - 1, currentIndex + 1);
        if (items[currentIndex]) items[currentIndex].focus();
      } else if (ev.key === "Enter") {
        openSelected(input.value);
      }
    });
    btn.addEventListener("click", () => openSelected(input.value));

    $("#tab-search")?.addEventListener("click", () => {
      $("#tab-search").classList.add("active");
      $("#tab-direct").classList.remove("active");
      input.placeholder = "Pages, Menus, Jobs and Quickflows";
    });
    $("#tab-direct")?.addEventListener("click", () => {
      $("#tab-direct").classList.add("active");
      $("#tab-search").classList.remove("active");
      input.placeholder = "Enter page acronym e.g., SWADDER";
      input.focus();
    });
  }

  // -------------------------
  // GLOBAL NAV / RESET
  // -------------------------
  function startOver() {
    setHidden($("#view-form"), true);
    setHidden($("#view-swingenq"), true);
    setHidden($("#view-saaadms"), true);
    setHidden($("#view-roster"), true);
    setHidden($("#view-keyblock"), true);
    setHidden($("#view-welcome"), false);
    const s = $("#search-input"); if (s) s.value = "";
    const ac = $("#ac-list"); if (ac) ac.innerHTML = "";
    currentForm = null;
    selectedPerson = null;
  }

  // -------------------------
  // KEY BLOCK (dynamic per form)
  // -------------------------
  function showKeyBlock(formCode) {
    currentForm = formCode;
    ensureKeyblockScaffold();

    setHidden($("#view-welcome"), true);
    setHidden($("#view-swingenq"), true);
    setHidden($("#view-saaadms"), true);
    setHidden($("#view-form"), true);
    setHidden($("#view-roster"), true);
    setHidden($("#view-keyblock"), false);

    // Reset base fields
    const idInput = $("#kb-id"); if (idInput) idInput.value = "";
    const err = $("#kb-error"); if (err) { err.textContent = ""; setHidden(err, true); }

    // Dynamic extras area
    const ex = $("#kb-extra");
    const idWrap = $("#kb-id-wrap") || $("#kb-id")?.closest("label") || $("#kb-id")?.parentElement;
    if (!ex) return; // cannot proceed if there's nowhere to write fields

    // Default hint
    if ($("#kb-hint")) $("#kb-hint").innerHTML = `Enter the required fields, then press <strong>Go</strong> (or Enter).`;

    // Build per-form requirements
    if (formCode === "SFASLST") {
      if (idWrap) idWrap.style.display = "none"; // No ID for roster lookup
      ex.innerHTML = `
        <label>Term
          <input id="kb-term" type="text" placeholder="2025/26 or 202122">
        </label>
        <label>CRN
          <input id="kb-crn" type="text" placeholder="10021">
        </label>
      `;
      if ($("#kb-hint")) $("#kb-hint").innerHTML = `Enter <strong>Term</strong> and <strong>CRN</strong>, then Go.`;
    } else if (formCode === "SWIGENQ") {
      if (idWrap) idWrap.style.display = ""; // ID + Term
      ex.innerHTML = `
        <label>Term
          <input id="kb-term" type="text" placeholder="2025/26">
        </label>
      `;
      if ($("#kb-hint")) $("#kb-hint").innerHTML = `Enter <strong>ID</strong> and <strong>Term</strong>, then Go.`;
    } else if (formCode === "SAAADMS") {
      if (idWrap) idWrap.style.display = ""; // ID required; Term optional
      ex.innerHTML = `
        <label>Term (optional)
          <input id="kb-term" type="text" placeholder="2025/26">
        </label>
      `;
      if ($("#kb-hint")) $("#kb-hint").innerHTML = `Enter <strong>ID</strong> (and optional Term), then Go.`;
    } else {
      // SWADDER / SPAIDEN default: ID only
      if (idWrap) idWrap.style.display = "";
      ex.innerHTML = "";
      if ($("#kb-hint")) $("#kb-hint").innerHTML = `Enter <strong>ID</strong>, then Go. Example: <code>T00031879</code>`;
    }

    // Focus ID (if visible) else first extra field
    if (idWrap && idWrap.style.display !== "none" && $("#kb-id")) {
      $("#kb-id").focus();
    } else if ($("#kb-term")) {
      $("#kb-term").focus();
    }
  }

  function findById(id) {
    id = (id || "").trim();
    return dataset.find((p) => p.id.toLowerCase() === id.toLowerCase());
  }

  function bindKeyBlock() {
    const kbView = $("#view-keyblock");
    if (!kbView) return;

    const go = () => {
      const id = $("#kb-id")?.value.trim();
      const term = normalizeTerm($("#kb-term")?.value || "");
      const crn = $("#kb-crn")?.value?.trim();

      const fail = (msg) => {
        const e = $("#kb-error"); if (!e) return;
        e.textContent = msg; setHidden(e, false);
      };
      setHidden($("#kb-error"), true);

      // SFASLST: requires Term + CRN, shows roster
      if (currentForm === "SFASLST") {
        if (!term || !crn) return fail("Please enter both Term and CRN.");
        ensureRosterView();
        const roster = peopleInSection(term, crn, dataset);
        if (roster.length === 0) return fail("No enrollments found for that Term/CRN (demo data).");
        showRoster(term, crn, roster);
        window.__recentAdd?.("SFASLST", `Class Roster (${term}, CRN ${crn})`);
        return;
      }

      // SWIGENQ: requires ID + Term, lands on SPAIDEN
      if (currentForm === "SWIGENQ") {
        if (!id || !term) return fail("Please enter both ID and Term.");
        const person = findById(id);
        if (!person) return fail("No record found for that ID (demo data).");
        const hasTerm =
          normalizeTerm(person.admissions?.term || DEFAULT_TERM) === term ||
          (person.admissionsHistory || []).some((h) => normalizeTerm(h.term) === term) ||
          (person.schedule || []).some((s) => normalizeTerm(s.term || DEFAULT_TERM) === term);
        if (!hasTerm) return fail("This person has no data for that Term (demo data). Try 2025/26.");
        selectedPerson = person;
        showForm("SPAIDEN", person);
        window.__recentAdd?.("SWIGENQ", `General Person Query (${person.lastName}, ${person.firstName})`);
        return;
      }

      // SAAADMS: ID required; Term optional (filters admissions if present)
      if (currentForm === "SAAADMS") {
        if (!id) return fail("Please enter an ID.");
        const person = findById(id);
        if (!person) return fail("No record found for that ID (demo data).");
        if (term) {
          const hit = (person.admissionsHistory || []).find((h) => normalizeTerm(h.term) === term);
          if (hit) {
            person.___origAdms = person.___origAdms || person.admissions;
            person.admissions = { ...person.admissions, ...hit };
          } else {
            toast("No admissions for that term (showing default).");
          }
        }
        selectedPerson = person;
        showAdmissions(person);
        window.__recentAdd?.("SAAADMS", `Admissions (${person.lastName}, ${person.firstName})`);
        return;
      }

      // SWADDER / SPAIDEN: ID only
      if (!id) return fail("Please enter an ID.");
      const person = findById(id);
      if (!person) return fail("No record found for that ID (demo data).");
      selectedPerson = person;
      showForm(currentForm === "SWADDER" ? "SWADDER" : "SPAIDEN", person);
      window.__recentAdd?.(currentForm || "SPAIDEN", `${currentForm || "SPAIDEN"} (${person.lastName}, ${person.firstName})`);
    };

    $("#kb-go")?.addEventListener("click", go);
    $("#kb-id")?.addEventListener("keydown", (ev) => { if (ev.key === "Enter") go(); });

    // Delegated Enter key for dynamic fields (term/crn)
    kbView.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" && ["kb-id", "kb-term", "kb-crn"].includes(ev.target.id)) {
        ev.preventDefault();
        go();
      }
    });

    $("#kb-cancel")?.addEventListener("click", startOver);
  }

  // -------------------------
  // FORMS / VIEWS
  // -------------------------
  function showForm(formCode, person) {
    setHidden($("#view-keyblock"), true);
    setHidden($("#view-swingenq"), true);
    setHidden($("#view-saaadms"), true);
    setHidden($("#view-roster"), true);
    setHidden($("#view-form"), false);

    const titleMap = {
      SWADDER: "SWADDER — Address Information 9.0",
      SPAIDEN: "SPAIDEN — General Person",
      SFASLST: "SFASLST — Student Class Schedule",
    };
    $("#form-title").textContent = titleMap[formCode] || "Form";

    // Person section
    $("#f-id").value = person.id || "";
    $("#f-name").value = [person.lastName, person.firstName, person.middle].filter(Boolean).join(", ");
    $("#f-dob").value = person.dob || "";
    $("#f-program").value = person.admissions?.program || "";

    // Address
    const a = person.address || {};
    $("#f-addr-type").value = a.type || "PH";
    $("#f-from").value = a.from || "";
    $("#f-a1").value = a.line1 || "";
    $("#f-a2").value = a.line2 || "";
    $("#f-a3").value = a.line3 || "";
    $("#f-city").value = a.city || "";
    $("#f-county").value = a.county || "";
    $("#f-nation").value = a.nation || "";
    $("#f-postal").value = a.postal || "";
    $("#f-source").value = a.source || "";

    // Emergency
    $("#f-ec-first").value = person.emergency?.first || "";
    $("#f-ec-last").value = person.emergency?.last || "";
    $("#f-ec-rel").value = person.emergency?.relationship || "";
    $("#f-ec-phone").value = person.emergency?.phone || "";

    // Phones
    const ptb = $("#phone-table tbody"); if (ptb) {
      ptb.innerHTML = "";
      (person.phones || []).forEach((ph) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${ph.number}</td><td>${ph.type || ""}</td><td>${ph.primary ? "Yes" : "No"}</td>`;
        ptb.appendChild(tr);
      });
    }

    // SPAIDEN extra area
    setHidden($("#spaid-extra"), formCode !== "SPAIDEN");
    $("#spaid-term").value = person.admissions?.term || "";

    // SFASLST schedule table (when showing SPAIDEN/SWADDER we still keep it hidden)
    setHidden($("#sfaslst"), formCode !== "SFASLST");
    const stb = $("#sched-table tbody"); if (stb) {
      stb.innerHTML = "";
      (person.schedule || []).forEach((c) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${c.crn}</td><td>${c.subject}</td><td>${c.course}</td><td>${c.title}</td><td>${c.days}</td><td>${c.time}</td><td>${c.room}</td>`;
        stb.appendChild(tr);
      });
    }
  }

  function showRoster(term, crn, rows) {
    ensureRosterView();
    setHidden($("#view-keyblock"), true);
    setHidden($("#view-form"), true);
    setHidden($("#view-swingenq"), true);
    setHidden($("#view-saaadms"), true);
    setHidden($("#view-roster"), false);

    const T = normalizeTerm(term);
    $("#view-roster .title").textContent = `SFASLST — Class Roster (${T}, CRN ${crn})`;

    const tb = $("#roster-table tbody");
    if (tb) {
      tb.innerHTML = "";
      rows.forEach(({ person, sec }) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${person.id}</td>
          <td>${person.lastName}, ${person.firstName}</td>
          <td>${person.admissions?.program || ""}</td>
          <td>${normalizeTerm(sec.term || DEFAULT_TERM)}</td>
          <td>${sec.crn}</td>`;
        tr.addEventListener("click", () => showForm("SPAIDEN", person)); // click to open SPAIDEN
        tb.appendChild(tr);
      });
    }

    $("#roster-start")?.addEventListener("click", startOver, { once: true });
  }

  function showAdmissions(person) {
    setHidden($("#view-keyblock"), true);
    setHidden($("#view-form"), true);
    setHidden($("#view-swingenq"), true);
    setHidden($("#view-roster"), true);
    setHidden($("#view-saaadms"), false);

    $("#adms-id").value = person.id || "";
    $("#adms-name").value = `${person.lastName || ""}, ${person.firstName || ""}`;
    $("#adms-term").value = person.admissions?.term || "";
    $("#adms-program").value = person.admissions?.program || "";
    $("#adms-status").value = person.admissions?.status || "";
    $("#adms-decision").value = person.admissions?.decision || "";
  }

  // -------------------------
  // SWIGENQ (table view variant) — still available via code if you want to link it
  // -------------------------
  function showGQ() {
    currentForm = "SWIGENQ";
    setHidden($("#view-welcome"), true);
    setHidden($("#view-form"), true);
    setHidden($("#view-saaadms"), true);
    setHidden($("#view-roster"), true);
    setHidden($("#view-keyblock"), true);
    setHidden($("#view-swingenq"), false);
    $("#gq-input").value = "";
    renderGQRows(dataset);
    $("#gq-input").focus();
  }

  function renderGQRows(rows) {
    const body = $("#gq-body"); if (!body) return;
    body.innerHTML = "";
    rows.forEach((p) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${p.id}</td><td>${p.lastName}, ${p.firstName}</td><td>${p.dob}</td><td>${p.admissions?.program || ""}</td><td><button class="btn btn-mini">Open</button></td>`;
      tr.addEventListener("click", () => { showForm("SPAIDEN", p); });
      tr.querySelector("button").addEventListener("click", (e) => { e.stopPropagation(); showForm("SPAIDEN", p); });
      body.appendChild(tr);
    });
  }

  function bindGQ() {
    $("#gq-search")?.addEventListener("click", doSearch);
    $("#gq-input")?.addEventListener("keydown", (ev) => { if (ev.key === "Enter") { doSearch(); } });

    function doSearch() {
      const q = $("#gq-input")?.value.trim().toLowerCase();
      if (!q) { renderGQRows(dataset); return; }
      const res = dataset.filter((p) =>
        p.id.toLowerCase().includes(q) ||
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q)
      );
      renderGQRows(res);
    }
  }

  // -------------------------
  // TOP CHROME BUTTONS
  // -------------------------
  function bindChrome() {
    $("#btn-start")?.addEventListener("click", startOver);
    $("#btn-save")?.addEventListener("click", () => toast("Saved (demo only)"));
    $("#adms-start")?.addEventListener("click", startOver);
  }

  // -------------------------
  // INIT
  // -------------------------
  document.addEventListener("DOMContentLoaded", async () => {
    ensureKeyblockScaffold();
    ensureRosterView();
    await loadData();
    setupWelcome();
    bindKeyBlock();
    bindGQ();
    bindChrome();
  });
})();

// ===============================
// SIDEBAR + RECENTLY-OPENED WIRING
// ===============================
(function () {
  "use strict";

  const VIEWS = [
    "view-welcome",
    "recent-panel",
    "view-keyblock",
    "view-form",
    "view-swingenq",
    "view-saaadms",
    "view-roster", // include roster so nav hides it properly
  ];
  const recent = [];

  function showView(id) {
    VIEWS.forEach((v) => document.getElementById(v)?.classList.add("hidden"));
    document.getElementById(id)?.classList.remove("hidden");
  }

  function setActive(btn) {
    document.querySelectorAll(".nav-icon").forEach((b) => b.removeAttribute("aria-current"));
    btn?.setAttribute("aria-current", "page");
  }

  function recentAdd(code, title) {
    recent.unshift({ code, title });
    while (recent.length > 8) recent.pop();
    const b = document.getElementById("badge-recent"); if (b) b.textContent = String(recent.length);
    const list = document.getElementById("recent-list");
    if (list) list.innerHTML = recent.map((r) => `<li><strong>${r.title}</strong> (${r.code})</li>`).join("");
  }
  // expose so app.js can log openings
  window.__recentAdd = recentAdd;

  document.getElementById("icon-home")?.addEventListener("click", (e) => {
    showView("view-welcome"); setActive(e.currentTarget);
  });

  document.getElementById("icon-search")?.addEventListener("click", (e) => {
    showView("view-welcome"); setActive(e.currentTarget);
    const inp = document.getElementById("search-input"); if (inp) { inp.focus(); inp.select?.(); }
  });

  document.getElementById("icon-recent")?.addEventListener("click", (e) => {
    showView("recent-panel"); setActive(e.currentTarget);
  });

  document.getElementById("icon-help")?.addEventListener("click", () =>
    alert(
      "Keyboard shortcuts (mock):\n• Ctrl+M Applications\n• Ctrl+Y Recently Opened\n• Ctrl+Shift+X Dashboard\n• Ctrl+D Favorites\n• Ctrl+Shift+L Help\n• Ctrl+Shift+Y Search\n• Ctrl+Shift+F Sign Out"
    )
  );

  document.getElementById("icon-menu")?.addEventListener("click", () =>
    alert("Applications menu is not implemented in this mock.")
  );
  document.getElementById("icon-grid")?.addEventListener("click", () =>
    alert("Applications menu is not implemented in this mock.")
  );

  // Avoid confusion: disable the real Home key in the mock
  window.addEventListener("keydown", (ev) => { if (ev.key === "Home") ev.preventDefault(); });

  // Optional: mark Home as active at start
  setActive(document.getElementById("icon-home"));
})();


(function(){
  const pages = [
    {code:"SWADDER", name:"Address Information Form", open:()=>showKeyBlock("SWADDER")},
    {code:"SPAIDEN", name:"General Person Identification", open:()=>showKeyBlock("SPAIDEN")},
    {code:"SWIGENQ", name:"General Person Query", open:()=>showGQ()},
    {code:"SAAADMS", name:"Admissions Application", open:()=>showKeyBlock("SAAADMS")},
    {code:"SFASLST", name:"Student Class Schedule", open:()=>showKeyBlock("SFASLST")},
  ];
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const setHidden = (el, v) => el.classList.toggle("hidden", !!v);
  const toast = (msg="Saved (demo only)") => {
    const t = $("#toast"); t.textContent = msg; t.classList.add("show");
    setTimeout(()=>t.classList.remove("show"), 1600);
  };
  let dataset = [];
  let currentForm = null;
  let selectedPerson = null;

  const embedded = [{"id": "T00031879", "firstName": "Lucy", "middle": "C", "lastName": "Parkin", "dob": "1999-06-14", "address": {"type": "PH", "line1": "1234 An address", "line2": "", "line3": "", "city": "BRADCHESTER", "county": "West Yorkshire", "nation": "GB", "stateProv": "", "postal": "BD5 2XY", "from": "2025-08-06", "to": "", "source": "TRNG"}, "phones": [{"number": "07123 456789", "type": "M", "primary": true}], "emergency": {"first": "Alex", "last": "Parkin", "relationship": "Sibling", "phone": "07111 222333"}, "admissions": {"term": "2025/26", "program": "BA Linguistics", "status": "Admitted", "decision": "Firm"}, "schedule": [{"crn": "10021", "subject": "LING", "course": "101", "title": "Intro to Linguistics", "days": "Mon/Wed", "time": "10:00-11:00", "room": "B20"}, {"crn": "10311", "subject": "HIST", "course": "120", "title": "History of Language", "days": "Fri", "time": "13:00-15:00", "room": "A14"}]}, {"id": "T00042001", "firstName": "Maya", "middle": "", "lastName": "Singh", "dob": "2001-02-05", "address": {"type": "PH", "line1": "42 Oak Street", "line2": "Flat 2", "line3": "", "city": "LEEDSBURY", "county": "West Yorkshire", "nation": "GB", "stateProv": "", "postal": "LS2 7AB", "from": "2025-07-20", "to": "", "source": "TRNG"}, "phones": [{"number": "07900 111222", "type": "M", "primary": true}, {"number": "0113 555 0099", "type": "H", "primary": false}], "emergency": {"first": "Ravi", "last": "Singh", "relationship": "Parent", "phone": "07900 000111"}, "admissions": {"term": "2025/26", "program": "BSc Computer Science", "status": "Conditional", "decision": "Offer Made"}, "schedule": [{"crn": "22010", "subject": "COMP", "course": "101", "title": "Programming I", "days": "Tue/Thu", "time": "09:00-10:30", "room": "CS101"}, {"crn": "22022", "subject": "MATH", "course": "140", "title": "Discrete Maths", "days": "Wed", "time": "14:00-16:00", "room": "M12"}]}, {"id": "T00042002", "firstName": "Owen", "middle": "J", "lastName": "Davies", "dob": "2000-11-02", "address": {"type": "PH", "line1": "9 River Way", "line2": "", "line3": "", "city": "EASTFORD", "county": "North Yorkshire", "nation": "GB", "stateProv": "", "postal": "YO10 3CD", "from": "2025-07-30", "to": "", "source": "TRNG"}, "phones": [{"number": "07877 123456", "type": "M", "primary": true}], "emergency": {"first": "Sara", "last": "Davies", "relationship": "Partner", "phone": "07888 654321"}, "admissions": {"term": "2025/26", "program": "BA History", "status": "Admitted", "decision": "Firm"}, "schedule": [{"crn": "33001", "subject": "HIST", "course": "101", "title": "World History", "days": "Mon", "time": "12:00-14:00", "room": "H3"}, {"crn": "33015", "subject": "ARCH", "course": "110", "title": "Intro Archaeology", "days": "Thu", "time": "10:00-12:00", "room": "AR2"}]}, {"id": "T00042003", "firstName": "Aisha", "middle": "M", "lastName": "Hussain", "dob": "1998-12-17", "address": {"type": "PH", "line1": "77 Meadow Close", "line2": "", "line3": "", "city": "BRADCHESTER", "county": "West Yorkshire", "nation": "GB", "stateProv": "", "postal": "BD1 4XY", "from": "2025-08-01", "to": "", "source": "TRNG"}, "phones": [{"number": "07700 900123", "type": "M", "primary": true}], "emergency": {"first": "Imran", "last": "Hussain", "relationship": "Parent", "phone": "07700 900124"}, "admissions": {"term": "2025/26", "program": "BSc Biology", "status": "Admitted", "decision": "Firm"}, "schedule": [{"crn": "44002", "subject": "BIOL", "course": "100", "title": "Cells & Molecules", "days": "Tue", "time": "11:00-13:00", "room": "B1"}, {"crn": "44018", "subject": "CHEM", "course": "101", "title": "Chemistry Basics", "days": "Fri", "time": "10:00-12:00", "room": "C2"}]}, {"id": "T00042004", "firstName": "James", "middle": "R", "lastName": "Nguyen", "dob": "2002-03-22", "address": {"type": "PH", "line1": "11 Kingfisher Rd", "line2": "", "line3": "", "city": "LEEDSBURY", "county": "West Yorkshire", "nation": "GB", "stateProv": "", "postal": "LS6 4AA", "from": "2025-07-10", "to": "", "source": "TRNG"}, "phones": [{"number": "07555 333444", "type": "M", "primary": true}], "emergency": {"first": "Trang", "last": "Nguyen", "relationship": "Parent", "phone": "07555 222111"}, "admissions": {"term": "2025/26", "program": "MEng Mechanical Engineering", "status": "Conditional", "decision": "Offer Made"}, "schedule": [{"crn": "55031", "subject": "ENGR", "course": "101", "title": "Statics", "days": "Mon/Wed", "time": "09:30-10:30", "room": "E201"}, {"crn": "55048", "subject": "COMP", "course": "102", "title": "Programming II", "days": "Thu", "time": "11:00-13:00", "room": "CS102"}]}, {"id": "T00042005", "firstName": "Elena", "middle": "", "lastName": "Garcia", "dob": "2001-08-09", "address": {"type": "PH", "line1": "3 Market Lane", "line2": "", "line3": "", "city": "KIRKBY", "county": "North Yorkshire", "nation": "GB", "stateProv": "", "postal": "YO18 2HG", "from": "2025-08-03", "to": "", "source": "TRNG"}, "phones": [{"number": "07444 888999", "type": "M", "primary": true}], "emergency": {"first": "Luis", "last": "Garcia", "relationship": "Parent", "phone": "07444 111222"}, "admissions": {"term": "2025/26", "program": "BA English Literature", "status": "Admitted", "decision": "Firm"}, "schedule": [{"crn": "66012", "subject": "ENGL", "course": "101", "title": "Poetry & Prose", "days": "Tue", "time": "15:00-17:00", "room": "L2"}, {"crn": "66021", "subject": "ENGL", "course": "115", "title": "Shakespeare", "days": "Thu", "time": "10:00-12:00", "room": "L4"}]}, {"id": "T00042006", "firstName": "Noah", "middle": "K", "lastName": "Baker", "dob": "2000-01-28", "address": {"type": "PH", "line1": "19 Canal View", "line2": "", "line3": "", "city": "RIVERDALE", "county": "West Yorkshire", "nation": "GB", "stateProv": "", "postal": "WF1 9ZZ", "from": "2025-07-28", "to": "", "source": "TRNG"}, "phones": [{"number": "07321 555666", "type": "M", "primary": true}], "emergency": {"first": "Kate", "last": "Baker", "relationship": "Spouse", "phone": "07321 000111"}, "admissions": {"term": "2025/26", "program": "BSc Mathematics", "status": "Admitted", "decision": "Firm"}, "schedule": [{"crn": "77007", "subject": "MATH", "course": "101", "title": "Calculus I", "days": "Mon/Wed/Fri", "time": "09:00-09:50", "room": "M1"}, {"crn": "77044", "subject": "PHYS", "course": "120", "title": "Mechanics", "days": "Thu", "time": "14:00-16:00", "room": "P4"}]}, {"id": "T00042007", "firstName": "Zara", "middle": "L", "lastName": "Ahmed", "dob": "2003-10-12", "address": {"type": "PH", "line1": "88 Hill Top", "line2": "", "line3": "", "city": "BRADCHESTER", "county": "West Yorkshire", "nation": "GB", "stateProv": "", "postal": "BD7 1PQ", "from": "2025-08-05", "to": "", "source": "TRNG"}, "phones": [{"number": "07123 000777", "type": "M", "primary": true}], "emergency": {"first": "Nadia", "last": "Ahmed", "relationship": "Parent", "phone": "07123 000778"}, "admissions": {"term": "2025/26", "program": "BSc Psychology", "status": "Conditional", "decision": "Offer Made"}, "schedule": [{"crn": "88010", "subject": "PSYC", "course": "101", "title": "Intro Psych", "days": "Wed", "time": "11:00-13:00", "room": "P1"}, {"crn": "88016", "subject": "STAT", "course": "110", "title": "Stats for Psych", "days": "Fri", "time": "09:00-11:00", "room": "S3"}]}, {"id": "T00042008", "firstName": "Ben", "middle": "T", "lastName": "Coleman", "dob": "1999-04-30", "address": {"type": "PH", "line1": "21 Stonegate", "line2": "", "line3": "", "city": "LEEDSBURY", "county": "West Yorkshire", "nation": "GB", "stateProv": "", "postal": "LS1 8PT", "from": "2025-07-22", "to": "", "source": "TRNG"}, "phones": [{"number": "07890 123123", "type": "M", "primary": true}], "emergency": {"first": "Hannah", "last": "Coleman", "relationship": "Sibling", "phone": "07890 123124"}, "admissions": {"term": "2025/26", "program": "BBA Management", "status": "Admitted", "decision": "Firm"}, "schedule": [{"crn": "99001", "subject": "BUSI", "course": "101", "title": "Intro to Business", "days": "Mon", "time": "16:00-18:00", "room": "B10"}, {"crn": "99009", "subject": "ECON", "course": "105", "title": "Microeconomics", "days": "Thu", "time": "09:00-11:00", "room": "E2"}]}, {"id": "T00042009", "firstName": "Sophie", "middle": "A", "lastName": "Reid", "dob": "2002-05-11", "address": {"type": "PH", "line1": "4 Mill Court", "line2": "", "line3": "", "city": "FAIRVIEW", "county": "North Yorkshire", "nation": "GB", "stateProv": "", "postal": "YO1 1AA", "from": "2025-07-18", "to": "", "source": "TRNG"}, "phones": [{"number": "07222 555111", "type": "M", "primary": true}], "emergency": {"first": "Tom", "last": "Reid", "relationship": "Parent", "phone": "07222 555112"}, "admissions": {"term": "2025/26", "program": "BSc Physics", "status": "Admitted", "decision": "Firm"}, "schedule": [{"crn": "11101", "subject": "PHYS", "course": "101", "title": "Waves & Optics", "days": "Tue", "time": "10:00-12:00", "room": "P2"}, {"crn": "11122", "subject": "MATH", "course": "130", "title": "Linear Algebra", "days": "Fri", "time": "14:00-16:00", "room": "M5"}]}];

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

  function setupWelcome(){
    const input = $("#search-input");
    const ac = $("#ac-list");
    const btn = $("#search-go");
    let currentIndex = -1;
    function getMatches(q){
      q = q.trim().toLowerCase();
      if(!q) return [];
      return pages.filter(p => p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q));
    }
    function render(matches){
      ac.innerHTML = "";
      if(matches.length===0){ setHidden(ac,true); return; }
      matches.forEach((m,i)=>{
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
    setHidden($("#view-welcome"), false);
    $("#search-input").value="";
    $("#ac-list").innerHTML="";
    currentForm = null;
    selectedPerson = null;
  }

  function showKeyBlock(formCode){
    currentForm = formCode;
    setHidden($("#view-welcome"), true);
    setHidden($("#view-swingenq"), true);
    setHidden($("#view-saaadms"), true);
    setHidden($("#view-form"), true);
    setHidden($("#view-keyblock"), false);
    $("#kb-id").value = "";
    $("#kb-error").textContent = "";
    setHidden($("#kb-error"), true);
    $("#kb-id").focus();
  }

  function findById(id){
    id = (id||"").trim();
    return dataset.find(p => p.id.toLowerCase()===id.toLowerCase());
  }

  function bindKeyBlock(){
    function go(){
      const id = $("#kb-id").value.trim();
      if(!id){
        $("#kb-error").textContent = "Please enter an ID.";
        setHidden($("#kb-error"), false);
        return;
      }
      const person = findById(id);
      if(!person){
        $("#kb-error").textContent = "No record found for that ID (demo data).";
        setHidden($("#kb-error"), false);
        return;
      }
      selectedPerson = person;
      setHidden($("#kb-error"), true);
      if(currentForm==="SWADDER" || currentForm==="SPAIDEN" || currentForm==="SFASLST"){
        showForm(currentForm, person);
      } else if(currentForm==="SAAADMS"){
        showAdmissions(person);
      } else {
        showForm("SPAIDEN", person);
      }
    }
    $("#kb-go").addEventListener("click", go);
    $("#kb-id").addEventListener("keydown", (ev)=>{ if(ev.key==="Enter"){ go(); }});
    $("#kb-cancel").addEventListener("click", startOver);
  }

  function showForm(formCode, person){
    setHidden($("#view-keyblock"), true);
    setHidden($("#view-swingenq"), true);
    setHidden($("#view-saaadms"), true);
    setHidden($("#view-form"), false);
    const titleMap = {
      "SWADDER":"SWADDER — Address Information 9.0",
      "SPAIDEN":"SPAIDEN — General Person",
      "SFASLST":"SFASLST — Student Class Schedule"
    };
    $("#form-title").textContent = titleMap[formCode] || "Form";
    $("#f-id").value = person.id;
    $("#f-name").value = [person.lastName, person.firstName, person.middle].filter(Boolean).join(", ");
    $("#f-dob").value = person.dob;
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

  function showAdmissions(person){
    setHidden($("#view-keyblock"), true);
    setHidden($("#view-form"), true);
    setHidden($("#view-swingenq"), true);
    setHidden($("#view-saaadms"), false);
    $("#adms-id").value = person.id;
    $("#adms-name").value = `${person.lastName}, ${person.firstName}`;
    $("#adms-term").value = person.admissions?.term || "";
    $("#adms-program").value = person.admissions?.program || "";
    $("#adms-status").value = person.admissions?.status || "";
    $("#adms-decision").value = person.admissions?.decision || "";
  }

  function showGQ(){
    currentForm = "SWIGENQ";
    setHidden($("#view-welcome"), true);
    setHidden($("#view-form"), true);
    setHidden($("#view-saaadms"), true);
    setHidden($("#view-keyblock"), true);
    setHidden($("#view-swingenq"), false);
    $("#gq-input").value="";
    renderGQRows(dataset);
    $("#gq-input").focus();
  }

  function renderGQRows(rows){
    const body = $("#gq-body"); body.innerHTML = "";
    rows.forEach(p => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${p.id}</td><td>${p.lastName}, ${p.firstName}</td><td>${p.dob}</td><td>${p.admissions?.program||""}</td><td><button class="btn btn-mini">Open</button></td>`;
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
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q)
      );
      renderGQRows(res);
    }
  }

  function bindChrome(){
    $("#btn-start").addEventListener("click", startOver);
    $("#btn-save").addEventListener("click", ()=>toast("Saved (demo only)"));
    $("#adms-start").addEventListener("click", startOver);
  }

  document.addEventListener("DOMContentLoaded", async ()=>{
    await loadData();
    setupWelcome();
    bindKeyBlock();
    bindGQ();
    bindChrome();
  });

})();

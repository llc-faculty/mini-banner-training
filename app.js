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
  const embedded = [{"id":"T00031879","firstName":"Lucy","middle":"C","lastName":"Parkin","dob":"1999-06-14","address":{"type":"PH","line1":"1234 An address","line2":"","line3":"","city":"BRADCHESTER","county":"West Yorkshire","nation":"GB","stateProv":"","postal":"BD5 2XY","from":"2025-08-06","to":"","source":"TRNG"},"phones":[{"number":"07123 456789","type":"M","primary":true}],"emergency":{"first":"Alex","last":"Parkin","relationship":"Sibling","phone":"07111 222333"},"admissions":{"term":"2025/26","program":"BA Linguistics","status":"Admitted","decision":"Firm"},"schedule":[{"crn":"10021","subject":"LING","course":"101","title":"Intro to Linguistics","days":"Mon/Wed","time":"10:00-11:00","room":"B20"},{"crn":"10311","subject":"HIST","course":"120","title":"History of Language","days":"Fri","time":"13:00-15:00","room":"A14"}]},{"id":"T00042001","firstName":"Maya","middle":"","lastName":"Singh","dob":"2001-02-05","address":{"type":"PH","line1":"42 Oak Street","line2":"Flat 2","line3":"","city":"LEEDSBURY","county":"West Yorkshire","nation":"GB","stateProv":"","postal":"LS2 7AB","from":"2025-07-20","to":"","source":"TRNG"},"phones":[{"number":"07900 111222","type":"M","primary":true},{"number":"0113 555 0099","type":"H","primary":false}],"emergency":{"first":"Ravi","last":"Singh","relationship":"Parent","phone":"07900 000111"},"admissions":{"term":"2025/26","program":"BSc Computer Science","status":"Conditional","decision":"Offer Made"},"schedule":[{"crn":"22010","subject":"COMP","course":"101","title":"Programming I","days":"Tue/Thu","time":"09:00-10:30","room":"CS101"},{"crn":"22022","subject":"MATH","course":"140","title":"Discrete Maths","days":"Wed","time":"14:00-16:00","room":"M12"}]},{"id":"T00042002","firstName":"Owen","middle":"J","lastName":"Davies","dob":"2000-11-02","address":{"type":"PH","line1":"9 River Way","line2":"","line3":"","city":"EASTFORD","county":"North Yorkshire","nation":"GB","stateProv":"","postal":"YO10 3CD","from":"2025-07-30","to":"","source":"TRNG"},"phones":[{"number":"07877 123456","type":"M","primary":true}],"emergency":{"first":"Sara","last":"Davies","relationship":"Partner","phone":"07888 654321"},"admissions":{"term":"2025/26","program":"BA History","status":"Admitted","decision":"Firm"},"schedule":[{"crn":"33001","subject":"HIST","course":"101","title":"World History","days":"Mon","time":"12:00-14:00","room":"H3"},{"crn":"33015","subject":"ARCH","course":"110","title":"Intro Archaeology","days":"Thu","time":"10:00-12:00","room":"AR2"}]},{"id":"T00042003","firstName":"Aisha","middle":"M","la]()

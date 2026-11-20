/*
  Checker trained on correct-submissions.csv (synthetic data).
  Validates against ICA requirements including photo guidelines from ica.gov.sg/photo-guidelines.
  Expand prompt: Singpass MyInfo pre-fill, officer vetting tab, identity mismatch detection.
  All data is synthetic and made up.
*/

var RULES = {
  nameFormat: /^[A-Z][A-Z\s'@\-\/(),]{1,60}$/,
  nameHasLowerCase: /[a-z]/,
  nricFormat: /^[STFGM]\d{7}[A-Z]$/i,
  childNricPrefix: /^[T]\d{7}[A-Z]$/i,
  adultNricPrefix: /^[STFG]\d{7}[A-Z]$/i,
  emailFormat: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phoneFormat: /^[689]\d{7}$/,
  photoFormats: ["jpg", "jpeg", "png", "heic", "heif"],
  photoMaxBytes: 8 * 1024 * 1024,
  photoWidth: 400,
  photoHeight: 514,
  acceptedRelationships: ["mother", "father", "legal_guardian"],
  rejectedRelationships: ["sibling", "grandparent", "other"],
  childAppTypes: ["new_child", "renew_child"],
  adultAppTypes: ["new_adult", "renew_adult"]
};

// --- Singpass mock data (all synthetic and made up) ---
var SINGPASS_PROFILES = {
  adult: { fullName: "TAN MEI LING", nric: "S8345678E", dob: "1983-07-14" },
  child: { fullName: "TAN JUN HAO", nric: "T2345678B", dob: "2019-03-22" }
};

var singpassData = null;

function singpassRetrieve() {
  var appType = document.getElementById("appType").value;
  if (!appType) {
    alert("Please select an application type first, so Singpass can retrieve the correct profile.");
    return;
  }

  var profile = RULES.childAppTypes.includes(appType) ? SINGPASS_PROFILES.child : SINGPASS_PROFILES.adult;
  singpassData = { fullName: profile.fullName, nric: profile.nric, dob: profile.dob };

  document.getElementById("fullName").value = profile.fullName;
  document.getElementById("fullName").classList.add("singpass-filled");
  document.getElementById("fullName").disabled = true;

  document.getElementById("nric").value = profile.nric;
  document.getElementById("nric").classList.add("singpass-filled");
  document.getElementById("nric").disabled = true;

  document.getElementById("dob").value = profile.dob;
  document.getElementById("dob").classList.add("singpass-filled");
  document.getElementById("dob").disabled = true;

  document.getElementById("singpassStatus").style.display = "block";

  checkFullName();
  checkNric();
  checkDob();
  updateProgress();
}

// --- Mismatch detection (edge case: info that is not mine) ---
function checkMismatch(fieldId) {
  if (!singpassData) return false;
  var mismatchEl = document.getElementById("mismatch-" + fieldId);
  if (!mismatchEl) return false;

  var currentVal = document.getElementById(fieldId).value.trim();
  var singpassVal = singpassData[fieldId];
  if (!singpassVal || !currentVal) { mismatchEl.classList.remove("visible"); return false; }

  if (currentVal.toUpperCase() !== singpassVal.toUpperCase()) {
    mismatchEl.textContent = "This value differs from Singpass MyInfo (\"" + singpassVal + "\"). If you changed this, the officer will be notified of the mismatch.";
    mismatchEl.classList.add("visible");
    return true;
  }
  mismatchEl.classList.remove("visible");
  return false;
}

// --- Tabs ---
function switchTab(tab) {
  document.querySelectorAll(".tab").forEach(function (t) { t.classList.remove("active"); });
  document.querySelectorAll(".tab-content").forEach(function (c) { c.classList.remove("active"); });
  if (tab === "officer") {
    document.querySelectorAll(".tab")[1].classList.add("active");
    document.getElementById("tab-officer").classList.add("active");
  } else {
    document.querySelectorAll(".tab")[0].classList.add("active");
    document.getElementById("tab-applicant").classList.add("active");
  }
}

// --- Progress bar ---
function getVisibleFields() {
  var base = [
    { id: "appType", type: "select" },
    { id: "fullName", type: "text" },
    { id: "nric", type: "text" },
    { id: "dob", type: "date" },
    { id: "email", type: "text" },
    { id: "phone", type: "text" },
    { id: "photoFile", type: "file" },
    { id: "photoRecent", type: "checkbox" },
    { id: "photoUnedited", type: "checkbox" },
    { id: "docType", type: "select" },
    { id: "declare", type: "checkbox" }
  ];
  if (isChildApp()) {
    base.splice(6, 0, { id: "parentNric", type: "text" }, { id: "relationship", type: "select" });
    if (document.getElementById("relationship").value === "legal_guardian") {
      base.splice(8, 0, { id: "guardianProof", type: "select" });
    }
  }
  var docVal = document.getElementById("docType").value;
  if (docVal === "deed_poll" || docVal === "marriage_cert") {
    base.push({ id: "deedPollText", type: "text" });
  }
  return base;
}

function getFieldState(f) {
  var warnEl = document.getElementById("warn-" + f.id);
  var hasFlagVisible = warnEl && warnEl.classList.contains("visible");
  if (f.type === "checkbox") {
    var checked = document.getElementById(f.id).checked;
    if (!checked) return "empty";
    if (hasFlagVisible) return "flagged";
    return "valid";
  }
  if (f.type === "file") {
    var fileInput = document.getElementById(f.id);
    if (!fileInput.files || !fileInput.files[0]) return "empty";
    if (hasFlagVisible) return "flagged";
    return "valid";
  }
  var val = document.getElementById(f.id).value;
  if (!val) return "empty";
  if (hasFlagVisible) return "flagged";
  return "valid";
}

function updateProgress() {
  var fields = getVisibleFields();
  var track = document.getElementById("progressTrack");
  var text = document.getElementById("progressText");
  track.innerHTML = "";
  var complete = 0;
  fields.forEach(function (f) {
    var state = getFieldState(f);
    var seg = document.createElement("div");
    seg.className = "progress-seg " + state;
    track.appendChild(seg);
    if (state === "valid") complete++;
  });
  text.textContent = complete + " of " + fields.length + " fields complete";
}

// --- Helpers ---
// confidence: "high" (format/exact), "medium" (cross-field), "low" (heuristic, not sure)
function warn(fieldId, msg, confidence) {
  confidence = confidence || "high";
  var el = document.getElementById("warn-" + fieldId);
  var ok = document.getElementById("ok-" + fieldId);
  var input = document.getElementById(fieldId);
  if (!el) return;
  var tag = '<span class="confidence-tag ' + confidence + '">' + confidence + '</span>';
  el.innerHTML = tag + " " + msg;
  el.classList.add("visible");
  el.classList.remove("low-confidence");
  if (confidence === "low") el.classList.add("low-confidence");
  el.dataset.confidence = confidence;
  if (ok) ok.classList.remove("visible");
  if (input && input.classList) input.classList.add("has-warning");
  updateProgress();
}

function clearWarn(fieldId) {
  var el = document.getElementById("warn-" + fieldId);
  var ok = document.getElementById("ok-" + fieldId);
  var input = document.getElementById(fieldId);
  if (!el) return;
  el.innerHTML = "";
  el.classList.remove("visible", "low-confidence");
  delete el.dataset.confidence;
  if (input && input.classList) input.classList.remove("has-warning");
}

function markOk(fieldId) {
  clearWarn(fieldId);
  var ok = document.getElementById("ok-" + fieldId);
  if (ok) ok.classList.add("visible");
  updateProgress();
}

function isChildApp() {
  return RULES.childAppTypes.includes(document.getElementById("appType").value);
}

function show(id) { document.getElementById(id).classList.add("visible"); }
function hide(id) { document.getElementById(id).classList.remove("visible"); }

// --- Validators ---
function checkAppType() {
  var val = document.getElementById("appType").value;
  if (!val) { clearWarn("appType"); hide("childSection"); updateProgress(); return; }
  if (isChildApp()) { show("childSection"); } else {
    hide("childSection"); hide("guardianProofField");
    clearWarn("parentNric"); clearWarn("relationship"); clearWarn("guardianProof");
  }
  clearWarn("appType");
  updateProgress();
}

function checkFullName() {
  var val = document.getElementById("fullName").value.trim();
  if (!val) { clearWarn("fullName"); updateProgress(); return; }
  if (val.length < 2) { warn("fullName", "Name seems too short. Enter the full name as printed on your NRIC."); return; }
  if (RULES.nameHasLowerCase.test(val)) { warn("fullName", "Name should be in BLOCK LETTERS (all uppercase), matching your NRIC."); return; }
  if (/\d/.test(val)) { warn("fullName", "Name should not contain numbers. Enter letters only, as printed on your NRIC."); return; }
  if (!RULES.nameFormat.test(val)) { warn("fullName", "Name format does not match expected pattern. Use the full name as printed on your NRIC, in BLOCK LETTERS."); return; }
  markOk("fullName");
  checkMismatch("fullName");
}

function checkNric() {
  var val = document.getElementById("nric").value.trim().toUpperCase();
  if (!val) { clearWarn("nric"); updateProgress(); return; }
  if (val.length !== 9) { warn("nric", "NRIC must be exactly 9 characters (e.g. S8234567A)."); return; }
  if (!RULES.nricFormat.test(val)) { warn("nric", "Format does not match. Expected: one letter, 7 digits, one letter (e.g. S8234567A)."); return; }
  var appType = document.getElementById("appType").value;
  if (RULES.childAppTypes.includes(appType) && !RULES.childNricPrefix.test(val)) {
    warn("nric", "For a child born in Singapore, NRIC typically starts with T. Foreign-born children may have other prefixes. The AI is not confident about this flag.", "low");
    return;
  }
  markOk("nric");
  checkMismatch("nric");
}

function checkDob() {
  var val = document.getElementById("dob").value;
  if (!val) { clearWarn("dob"); updateProgress(); return; }
  var dob = new Date(val);
  var today = new Date();
  var ageYears = (today - dob) / (365.25 * 24 * 60 * 60 * 1000);
  if (ageYears < 0) { warn("dob", "Date of birth cannot be in the future."); return; }
  var appType = document.getElementById("appType").value;
  if (RULES.childAppTypes.includes(appType) && ageYears >= 16) {
    warn("dob", "You selected a child application but this date of birth makes the applicant 16 or older. Use an adult application instead.");
    return;
  }
  if (RULES.adultAppTypes.includes(appType) && ageYears < 16) {
    warn("dob", "You selected an adult application but this date of birth makes the applicant below 16. Use a child application instead.");
    return;
  }
  markOk("dob");
  checkMismatch("dob");
}

function checkEmail() {
  var val = document.getElementById("email").value.trim();
  if (!val) { clearWarn("email"); updateProgress(); return; }
  if (!RULES.emailFormat.test(val)) { warn("email", "Email format looks incorrect. Expected: name@example.com"); return; }
  markOk("email");
}

function checkPhone() {
  var val = document.getElementById("phone").value.trim();
  if (!val) { clearWarn("phone"); updateProgress(); return; }
  if (!RULES.phoneFormat.test(val)) { warn("phone", "Singapore mobile numbers are 8 digits starting with 6, 8, or 9."); return; }
  markOk("phone");
}

function checkParentNric() {
  if (!isChildApp()) return;
  var val = document.getElementById("parentNric").value.trim().toUpperCase();
  if (!val) { clearWarn("parentNric"); updateProgress(); return; }
  if (val.length !== 9) { warn("parentNric", "NRIC must be exactly 9 characters."); return; }
  if (!RULES.adultNricPrefix.test(val)) { warn("parentNric", "NRIC format does not match. Expected: S, T, F, or G followed by 7 digits and one letter."); return; }
  var childVal = document.getElementById("nric").value.trim().toUpperCase();
  if (childVal && val === childVal) { warn("parentNric", "Parent/guardian NRIC is the same as the applicant's. These should be different.", "medium"); return; }
  markOk("parentNric");
}

function checkRelationship() {
  if (!isChildApp()) return;
  var val = document.getElementById("relationship").value;
  if (!val) { clearWarn("relationship"); hide("guardianProofField"); updateProgress(); return; }
  if (RULES.rejectedRelationships.includes(val)) {
    warn("relationship", "Only a parent or legal guardian can apply on behalf of a child below 16.", "high");
    hide("guardianProofField"); return;
  }
  if (val === "legal_guardian") { show("guardianProofField"); } else { hide("guardianProofField"); clearWarn("guardianProof"); }
  markOk("relationship");
}

function checkGuardianProof() {
  if (!isChildApp()) return;
  if (document.getElementById("relationship").value !== "legal_guardian") return;
  var val = document.getElementById("guardianProof").value;
  if (!val) { clearWarn("guardianProof"); updateProgress(); return; }
  if (val === "none") { warn("guardianProof", "Legal guardians must provide proof. Without it, the application will be returned."); }
  else { clearWarn("guardianProof"); updateProgress(); }
}

function checkPhoto() {
  var input = document.getElementById("photoFile");
  if (!input.files || !input.files[0]) { clearWarn("photoFile"); updateProgress(); return; }
  var file = input.files[0];
  var ext = file.name.split(".").pop().toLowerCase();
  if (!RULES.photoFormats.includes(ext)) { warn("photoFile", "Accepted formats: JPG, JPEG, PNG, HEIC, HEIF. Your file is ." + ext + "."); return; }
  if (file.size > RULES.photoMaxBytes) {
    warn("photoFile", "Maximum file size is 8 MB. Your file is " + (file.size / (1024 * 1024)).toFixed(1) + " MB."); return;
  }
  if (ext === "heic" || ext === "heif") { markOk("photoFile"); return; }
  var img = new Image();
  img.onload = function () {
    if (img.width !== RULES.photoWidth || img.height !== RULES.photoHeight) {
      warn("photoFile", "Must be 400 x 514 px. Your photo is " + img.width + " x " + img.height + " px.");
    } else { markOk("photoFile"); }
    URL.revokeObjectURL(img.src);
  };
  img.onerror = function () { warn("photoFile", "Could not read image."); URL.revokeObjectURL(img.src); };
  img.src = URL.createObjectURL(file);
}

function checkPhotoRecent() {
  if (!document.getElementById("photoRecent").checked) { warn("photoRecent", "You must confirm the photo was taken within the last 3 months."); }
  else { clearWarn("photoRecent"); updateProgress(); }
}

function checkPhotoUnedited() {
  if (!document.getElementById("photoUnedited").checked) { warn("photoUnedited", "ICA requires photos with no filters, enhancements, or altered facial features."); }
  else { clearWarn("photoUnedited"); updateProgress(); }
}

function checkDocType() {
  var val = document.getElementById("docType").value;
  var deedField = document.getElementById("deedPollReason");
  if (!val) { clearWarn("docType"); deedField.classList.remove("visible"); updateProgress(); return; }
  if (val === "unsure") {
    warn("docType", "For standard renewals with no name change, select 'No additional documents needed'. For name changes, you need a deed poll or marriage certificate. For child apps, a birth certificate is required.");
    deedField.classList.remove("visible"); return;
  }
  if (val === "deed_poll" || val === "marriage_cert") { deedField.classList.add("visible"); markOk("docType"); return; }
  if (RULES.childAppTypes.includes(document.getElementById("appType").value) && val === "none_needed") {
    warn("docType", "Child applications require a birth certificate."); deedField.classList.remove("visible"); return;
  }
  deedField.classList.remove("visible"); clearWarn("deedPollText"); markOk("docType");
}

function checkDeedPollText() {
  var docVal = document.getElementById("docType").value;
  if (docVal !== "deed_poll" && docVal !== "marriage_cert") return;
  var val = document.getElementById("deedPollText").value.trim();
  if (!val) { warn("deedPollText", "Please explain why the name differs."); }
  else { clearWarn("deedPollText"); updateProgress(); }
}

// --- Event listeners ---
document.getElementById("appType").addEventListener("change", function () { checkAppType(); checkDob(); checkNric(); checkDocType(); });
document.getElementById("fullName").addEventListener("blur", checkFullName);
document.getElementById("nric").addEventListener("blur", checkNric);
document.getElementById("dob").addEventListener("change", checkDob);
document.getElementById("email").addEventListener("blur", checkEmail);
document.getElementById("phone").addEventListener("blur", checkPhone);
document.getElementById("parentNric").addEventListener("blur", checkParentNric);
document.getElementById("relationship").addEventListener("change", checkRelationship);
document.getElementById("guardianProof").addEventListener("change", checkGuardianProof);
document.getElementById("photoFile").addEventListener("change", checkPhoto);
document.getElementById("photoRecent").addEventListener("change", checkPhotoRecent);
document.getElementById("photoUnedited").addEventListener("change", checkPhotoUnedited);
document.getElementById("docType").addEventListener("change", checkDocType);
document.getElementById("deedPollText").addEventListener("blur", checkDeedPollText);
document.getElementById("declare").addEventListener("change", function () { updateProgress(); });

document.getElementById("appForm").addEventListener("reset", function () {
  var allFields = ["appType","fullName","nric","dob","email","phone","parentNric","relationship","guardianProof","photoFile","photoRecent","photoUnedited","docType","deedPollText","declare"];
  allFields.forEach(function (id) {
    clearWarn(id);
    var ok = document.getElementById("ok-" + id);
    if (ok) ok.classList.remove("visible");
    var mm = document.getElementById("mismatch-" + id);
    if (mm) mm.classList.remove("visible");
    var inp = document.getElementById(id);
    if (inp) { inp.classList.remove("singpass-filled"); inp.disabled = false; }
  });
  singpassData = null;
  document.getElementById("singpassStatus").style.display = "none";
  hide("childSection"); hide("guardianProofField");
  document.getElementById("deedPollReason").classList.remove("visible");
  document.getElementById("officerReport").style.display = "none";
  setTimeout(updateProgress, 10);
});

// --- Officer queue ---
var officerQueue = [];

function addToOfficerQueue(submission) {
  officerQueue.push(submission);
  renderOfficerQueue();
}

function renderOfficerQueue() {
  var container = document.getElementById("officerQueue");
  if (officerQueue.length === 0) {
    container.innerHTML = '<div class="officer-empty">No submissions yet.</div>';
    return;
  }
  container.innerHTML = "";
  officerQueue.forEach(function (sub, idx) {
    var div = document.createElement("div");
    div.className = "officer-submission";
    div.id = "officer-sub-" + idx;

    var highMedFlags = sub.flags.filter(function (f) { return f.confidence !== "low"; });
    var lowConfFlags = sub.flags.filter(function (f) { return f.confidence === "low"; });

    var flagsHtml = "";
    if (highMedFlags.length > 0) {
      flagsHtml = '<div class="officer-flags"><h4>Checker flags (' + highMedFlags.length + ')</h4><ul>' +
        highMedFlags.map(function (f) { return "<li>" + f.label + ": " + f.reason + "</li>"; }).join("") +
        "</ul></div>";
    }

    var lowConfHtml = "";
    if (lowConfFlags.length > 0) {
      lowConfHtml = '<div class="officer-low-confidence"><h4>AI not confident — manual review required (' + lowConfFlags.length + ')</h4><ul>' +
        lowConfFlags.map(function (f) { return "<li>" + f.label + ": " + f.reason + " (the AI is not sure this is wrong)</li>"; }).join("") +
        "</ul></div>";
    }

    var mismatchHtml = "";
    if (sub.mismatches.length > 0) {
      mismatchHtml = '<div class="officer-mismatch-flags"><h4>Singpass mismatch (' + sub.mismatches.length + ')</h4><ul>' +
        sub.mismatches.map(function (m) { return "<li>" + m.label + ": submitted \"" + m.submitted + "\", Singpass says \"" + m.singpass + "\"</li>"; }).join("") +
        "</ul></div>";
    }

    var fieldsHtml = sub.fields.map(function (f) {
      var cls = "ok";
      if (f.flagged) cls = "flagged";
      if (f.mismatch) cls = "mismatch";
      return '<div class="officer-field"><span class="label">' + f.label + '</span><span class="value ' + cls + '">' + f.value + (f.flagged ? " (flagged)" : "") + (f.mismatch ? " (mismatch)" : "") + '</span></div>';
    }).join("");

    div.innerHTML =
      '<h3>Submission #' + (idx + 1) + ' — ' + sub.appType + '</h3>' +
      '<div>' + fieldsHtml + '</div>' +
      flagsHtml + lowConfHtml + mismatchHtml +
      '<div class="officer-actions">' +
        '<button class="btn-approve" onclick="officerDecision(' + idx + ', \'approve\')">Approve</button>' +
        '<button class="btn-return" onclick="officerDecision(' + idx + ', \'return\')">Return to applicant</button>' +
      '</div>' +
      '<div class="officer-verdict" id="verdict-' + idx + '"></div>';

    container.appendChild(div);
  });
}

function officerDecision(idx, decision) {
  var verdictEl = document.getElementById("verdict-" + idx);
  if (decision === "approve") {
    verdictEl.style.color = "#16a34a";
    verdictEl.textContent = "Approved by officer.";
  } else {
    verdictEl.style.color = "#dc2626";
    verdictEl.textContent = "Returned to applicant for corrections.";
  }
  var btns = document.getElementById("officer-sub-" + idx).querySelectorAll("button");
  btns.forEach(function (b) { b.disabled = true; b.style.opacity = "0.5"; });
}

// --- Submit ---
function submitForm() {
  checkAppType(); checkFullName(); checkNric(); checkDob(); checkEmail(); checkPhone();
  if (isChildApp()) { checkParentNric(); checkRelationship(); checkGuardianProof(); }
  checkDocType(); checkDeedPollText(); checkPhotoRecent(); checkPhotoUnedited();

  if (!document.getElementById("declare").checked) { warn("declare", "You must tick the declaration before submitting."); }
  else { clearWarn("declare"); }
  if (!document.getElementById("appType").value) { warn("appType", "Please select an application type."); }

  var fields = [
    { id: "appType", label: "Application type" },
    { id: "fullName", label: "Full name" },
    { id: "nric", label: "NRIC" },
    { id: "dob", label: "Date of birth" },
    { id: "email", label: "Email" },
    { id: "phone", label: "Contact number" },
    { id: "parentNric", label: "Parent/guardian NRIC", conditional: isChildApp },
    { id: "relationship", label: "Relationship", conditional: isChildApp },
    { id: "guardianProof", label: "Guardianship proof", conditional: function () { return isChildApp() && document.getElementById("relationship").value === "legal_guardian"; } },
    { id: "photoFile", label: "Photo file", isFile: true },
    { id: "photoRecent", label: "Photo recency", isCheckbox: true },
    { id: "photoUnedited", label: "Photo unedited", isCheckbox: true },
    { id: "docType", label: "Supporting document" },
    { id: "deedPollText", label: "Name change reason", conditional: function () { var d = document.getElementById("docType").value; return d === "deed_poll" || d === "marriage_cert"; } },
    { id: "declare", label: "Declaration", isCheckbox: true }
  ];

  var reportBody = document.getElementById("reportBody");
  var reportBadge = document.getElementById("reportBadge");
  var reportStats = document.getElementById("reportStats");
  var reportVerdict = document.getElementById("reportVerdict");
  reportBody.innerHTML = "";

  var okCount = 0; var flagCount = 0; var totalCount = 0;
  var submissionFields = [];
  var submissionFlags = [];
  var submissionMismatches = [];

  fields.forEach(function (f) {
    if (f.conditional && !f.conditional()) return;
    totalCount++;

    var warnEl = document.getElementById("warn-" + f.id);
    var tr = document.createElement("tr");
    var isFlagged = false;
    var statusHtml = "";
    var fieldValue = "";

    if (warnEl && warnEl.classList.contains("visible")) {
      isFlagged = true;
      var conf = warnEl.dataset.confidence || "high";
      var warnText = warnEl.textContent.replace(/^(high|medium|low)\s*/i, "");
      if (conf === "low") {
        statusHtml = '<span class="status-icon">&#9888;</span><span class="status-low-conf"><span class="confidence-tag low">LOW</span> ' + warnText + '</span>';
      } else {
        statusHtml = '<span class="status-icon">&#10007;</span><span class="status-flag"><span class="confidence-tag ' + conf + '">' + conf.toUpperCase() + '</span> ' + warnText + '</span>';
      }
      fieldValue = document.getElementById(f.id).value || "(empty)";
      submissionFlags.push({ label: f.label, reason: warnText, confidence: conf });
    } else if (f.isFile) {
      var fileInput = document.getElementById(f.id);
      if (!fileInput.files || !fileInput.files[0]) {
        isFlagged = true;
        statusHtml = '<span class="status-icon">&#10007;</span><span class="status-flag">No file uploaded</span>';
        fieldValue = "(no file)";
        submissionFlags.push({ label: f.label, reason: "No file uploaded" });
      } else { fieldValue = fileInput.files[0].name; }
    } else if (f.isCheckbox) {
      if (!document.getElementById(f.id).checked) {
        isFlagged = true;
        statusHtml = '<span class="status-icon">&#10007;</span><span class="status-flag">Not confirmed</span>';
        fieldValue = "Not confirmed";
        submissionFlags.push({ label: f.label, reason: "Not confirmed" });
      } else { fieldValue = "Confirmed"; }
    } else {
      var val = document.getElementById(f.id).value;
      if (!val) {
        isFlagged = true;
        statusHtml = '<span class="status-icon">&#10007;</span><span class="status-flag">Empty, needs input</span>';
        fieldValue = "(empty)";
        submissionFlags.push({ label: f.label, reason: "Empty, needs input" });
      } else { fieldValue = val; }
    }

    // Check Singpass mismatch
    var hasMismatch = false;
    if (singpassData && (f.id === "fullName" || f.id === "nric" || f.id === "dob")) {
      var mismatchEl = document.getElementById("mismatch-" + f.id);
      if (mismatchEl && mismatchEl.classList.contains("visible")) {
        hasMismatch = true;
        if (!isFlagged) {
          statusHtml = '<span class="status-icon">&#9888;</span><span class="status-mismatch">Differs from Singpass: "' + singpassData[f.id] + '"</span>';
        }
        submissionMismatches.push({ label: f.label, submitted: fieldValue, singpass: singpassData[f.id] });
      }
    }

    if (!isFlagged && !hasMismatch) {
      okCount++;
      statusHtml = '<span class="status-icon">&#10003;</span><span class="status-ok">OK</span>';
    } else {
      flagCount++;
    }

    submissionFields.push({ label: f.label, value: fieldValue, flagged: isFlagged, mismatch: hasMismatch });
    tr.innerHTML = '<td>' + f.label + '</td><td>' + statusHtml + '</td>';
    reportBody.appendChild(tr);
  });

  if (flagCount === 0) {
    reportBadge.className = "report-badge pass";
    reportBadge.textContent = "All clear";
    reportVerdict.innerHTML = '<span class="stat ok">Ready for review</span>';
  } else {
    reportBadge.className = "report-badge fail";
    reportBadge.textContent = flagCount + " issue" + (flagCount > 1 ? "s" : "");
    reportVerdict.innerHTML = '<span class="stat flagged">Needs applicant action</span>';
  }
  reportStats.innerHTML = '<span class="stat ok">' + okCount + ' OK</span> &middot; <span class="stat flagged">' + flagCount + ' flagged</span> &middot; ' + totalCount + ' total';

  document.getElementById("officerReport").style.display = "block";

  // Add to officer queue
  var appTypeLabel = document.getElementById("appType").value || "Unknown";
  addToOfficerQueue({
    appType: appTypeLabel,
    fields: submissionFields,
    flags: submissionFlags,
    mismatches: submissionMismatches
  });

  updateProgress();
}

updateProgress();

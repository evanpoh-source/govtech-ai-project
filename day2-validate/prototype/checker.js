/*
  Checker trained on correct-submissions.csv (synthetic data).
  Validates against ICA requirements including photo guidelines from ica.gov.sg/photo-guidelines.
  All data is synthetic and made up.
*/

var RULES = {
  nameFormat: /^[A-Z][A-Z\s'@\-]{1,60}$/,
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

function warn(fieldId, msg) {
  var el = document.getElementById("warn-" + fieldId);
  var ok = document.getElementById("ok-" + fieldId);
  var input = document.getElementById(fieldId);
  if (!el) return;
  el.textContent = msg;
  el.classList.add("visible");
  if (ok) ok.classList.remove("visible");
  if (input && input.classList) input.classList.add("has-warning");
}

function clearWarn(fieldId) {
  var el = document.getElementById("warn-" + fieldId);
  var ok = document.getElementById("ok-" + fieldId);
  var input = document.getElementById(fieldId);
  if (!el) return;
  el.textContent = "";
  el.classList.remove("visible");
  if (input && input.classList) input.classList.remove("has-warning");
}

function markOk(fieldId) {
  clearWarn(fieldId);
  var ok = document.getElementById("ok-" + fieldId);
  if (ok) ok.classList.add("visible");
}

function isChildApp() {
  return RULES.childAppTypes.includes(document.getElementById("appType").value);
}

function show(id) { document.getElementById(id).classList.add("visible"); }
function hide(id) { document.getElementById(id).classList.remove("visible"); }

// --- Application type ---
function checkAppType() {
  var val = document.getElementById("appType").value;
  if (!val) { clearWarn("appType"); hide("childSection"); return; }
  if (isChildApp()) {
    show("childSection");
  } else {
    hide("childSection");
    hide("guardianProofField");
    clearWarn("parentNric");
    clearWarn("relationship");
    clearWarn("guardianProof");
  }
  clearWarn("appType");
}

// --- Name ---
function checkFullName() {
  var val = document.getElementById("fullName").value.trim();
  if (!val) { clearWarn("fullName"); return; }
  if (val.length < 2) {
    warn("fullName", "Name seems too short. Enter the full name as printed on your NRIC.");
    return;
  }
  if (RULES.nameHasLowerCase.test(val)) {
    warn("fullName", "Name should be in BLOCK LETTERS (all uppercase), matching your NRIC. All correct submissions in the database are uppercase.");
    return;
  }
  if (/\d/.test(val)) {
    warn("fullName", "Name should not contain numbers. Enter letters only, as printed on your NRIC.");
    return;
  }
  if (!RULES.nameFormat.test(val)) {
    warn("fullName", "Name format does not match expected pattern. Use the full name as printed on your NRIC, in BLOCK LETTERS.");
    return;
  }
  markOk("fullName");
}

// --- NRIC ---
function checkNric() {
  var val = document.getElementById("nric").value.trim().toUpperCase();
  if (!val) { clearWarn("nric"); return; }
  if (val.length !== 9) {
    warn("nric", "NRIC must be exactly 9 characters (e.g. S8234567A).");
    return;
  }
  if (!RULES.nricFormat.test(val)) {
    warn("nric", "Format does not match. Expected: one letter, 7 digits, one letter (e.g. S8234567A).");
    return;
  }
  var appType = document.getElementById("appType").value;
  if (RULES.childAppTypes.includes(appType) && !RULES.childNricPrefix.test(val)) {
    warn("nric", "For a child born in Singapore, NRIC typically starts with T. Check the birth certificate or NRIC card.");
    return;
  }
  markOk("nric");
}

// --- Date of birth ---
function checkDob() {
  var val = document.getElementById("dob").value;
  if (!val) { clearWarn("dob"); return; }
  var dob = new Date(val);
  var today = new Date();
  var ageYears = (today - dob) / (365.25 * 24 * 60 * 60 * 1000);
  if (ageYears < 0) {
    warn("dob", "Date of birth cannot be in the future.");
    return;
  }
  var appType = document.getElementById("appType").value;
  if (RULES.childAppTypes.includes(appType) && ageYears >= 16) {
    warn("dob", "You selected a child application but this date of birth makes the applicant 16 or older. Use an adult application instead. Child passports are valid for 5 years; adult passports for 10.");
    return;
  }
  if (RULES.adultAppTypes.includes(appType) && ageYears < 16) {
    warn("dob", "You selected an adult application but this date of birth makes the applicant below 16. Use a child application instead, and a parent or guardian must apply.");
    return;
  }
  markOk("dob");
}

// --- Email ---
function checkEmail() {
  var val = document.getElementById("email").value.trim();
  if (!val) { clearWarn("email"); return; }
  if (!RULES.emailFormat.test(val)) {
    warn("email", "Email format looks incorrect. Expected format: name@example.com");
    return;
  }
  markOk("email");
}

// --- Phone ---
function checkPhone() {
  var val = document.getElementById("phone").value.trim();
  if (!val) { clearWarn("phone"); return; }
  if (!RULES.phoneFormat.test(val)) {
    warn("phone", "Singapore mobile numbers are 8 digits starting with 6, 8, or 9 (e.g. 91234567).");
    return;
  }
  markOk("phone");
}

// --- Parent NRIC ---
function checkParentNric() {
  if (!isChildApp()) return;
  var val = document.getElementById("parentNric").value.trim().toUpperCase();
  if (!val) { clearWarn("parentNric"); return; }
  if (val.length !== 9) {
    warn("parentNric", "NRIC must be exactly 9 characters (e.g. S8234567A).");
    return;
  }
  if (!RULES.adultNricPrefix.test(val)) {
    warn("parentNric", "NRIC format does not match. Expected: S, T, F, or G followed by 7 digits and one letter.");
    return;
  }
  var childVal = document.getElementById("nric").value.trim().toUpperCase();
  if (childVal && val === childVal) {
    warn("parentNric", "Parent/guardian NRIC is the same as the applicant's. These should be different.");
    return;
  }
  markOk("parentNric");
}

// --- Relationship ---
function checkRelationship() {
  if (!isChildApp()) return;
  var val = document.getElementById("relationship").value;
  if (!val) { clearWarn("relationship"); hide("guardianProofField"); return; }
  if (RULES.rejectedRelationships.includes(val)) {
    warn("relationship", "Only a parent or legal guardian can apply on behalf of a child below 16. Siblings, grandparents, and others are not accepted in correct submissions.");
    hide("guardianProofField");
    return;
  }
  if (val === "legal_guardian") {
    show("guardianProofField");
  } else {
    hide("guardianProofField");
    clearWarn("guardianProof");
  }
  markOk("relationship");
}

// --- Guardian proof ---
function checkGuardianProof() {
  if (!isChildApp()) return;
  var relVal = document.getElementById("relationship").value;
  if (relVal !== "legal_guardian") return;
  var val = document.getElementById("guardianProof").value;
  if (!val) { clearWarn("guardianProof"); return; }
  if (val === "none") {
    warn("guardianProof", "Legal guardians must provide proof (court order or letter of guardianship). Without it, the application will be returned.");
  } else {
    clearWarn("guardianProof");
  }
}

// --- Photo file (ICA photo guidelines) ---
function checkPhoto() {
  var input = document.getElementById("photoFile");
  if (!input.files || !input.files[0]) { clearWarn("photoFile"); return; }
  var file = input.files[0];
  var ext = file.name.split(".").pop().toLowerCase();

  if (!RULES.photoFormats.includes(ext)) {
    warn("photoFile", "Accepted formats: JPG, JPEG, PNG, HEIC, HEIF (per ICA photo guidelines). Your file is ." + ext + ".");
    return;
  }
  if (file.size > RULES.photoMaxBytes) {
    var sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    warn("photoFile", "Maximum file size is 8 MB (per ICA guidelines). Your file is " + sizeMB + " MB.");
    return;
  }

  if (ext === "heic" || ext === "heif") {
    markOk("photoFile");
    return;
  }

  var img = new Image();
  img.onload = function () {
    if (img.width !== RULES.photoWidth || img.height !== RULES.photoHeight) {
      warn("photoFile", "Online upload must be 400 x 514 pixels (per ICA guidelines). Your photo is " + img.width + " x " + img.height + " px. Resize using image editing software without enhancements.");
    } else {
      markOk("photoFile");
    }
    URL.revokeObjectURL(img.src);
  };
  img.onerror = function () {
    warn("photoFile", "Could not read image dimensions. Make sure the file is a valid image.");
    URL.revokeObjectURL(img.src);
  };
  img.src = URL.createObjectURL(file);
}

// --- Photo checkboxes ---
function checkPhotoRecent() {
  if (!document.getElementById("photoRecent").checked) {
    warn("photoRecent", "You must confirm the photo was taken within the last 3 months. Older photos will be rejected (ICA requirement).");
  } else {
    clearWarn("photoRecent");
  }
}

function checkPhotoUnedited() {
  if (!document.getElementById("photoUnedited").checked) {
    warn("photoUnedited", "ICA requires photos with no filters, enhancements, or altered facial features. Edited photos will be rejected.");
  } else {
    clearWarn("photoUnedited");
  }
}

// --- Document type ---
function checkDocType() {
  var val = document.getElementById("docType").value;
  var deedField = document.getElementById("deedPollReason");
  if (!val) { clearWarn("docType"); deedField.classList.remove("visible"); return; }

  if (val === "unsure") {
    warn("docType", "Not sure which documents you need? For standard renewals with no name change, select 'No additional documents needed'. For name changes, you need a deed poll or marriage certificate. For child applications, a birth certificate is required.");
    deedField.classList.remove("visible");
    return;
  }

  if (val === "deed_poll" || val === "marriage_cert") {
    deedField.classList.add("visible");
    markOk("docType");
    return;
  }

  var appType = document.getElementById("appType").value;
  if (RULES.childAppTypes.includes(appType) && val === "none_needed") {
    warn("docType", "Child applications require a birth certificate. Select 'Birth certificate' or the appropriate document for your situation.");
    deedField.classList.remove("visible");
    return;
  }

  deedField.classList.remove("visible");
  clearWarn("deedPollText");
  markOk("docType");
}

// --- Deed poll reason ---
function checkDeedPollText() {
  var docVal = document.getElementById("docType").value;
  if (docVal !== "deed_poll" && docVal !== "marriage_cert") return;
  var val = document.getElementById("deedPollText").value.trim();
  if (!val) {
    warn("deedPollText", "Please explain why the name differs. Officers need this to process the application.");
  } else {
    clearWarn("deedPollText");
  }
}

// --- Event listeners ---
document.getElementById("appType").addEventListener("change", function () {
  checkAppType();
  checkDob();
  checkNric();
  checkDocType();
});
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

// --- Reset ---
document.getElementById("appForm").addEventListener("reset", function () {
  var allFields = ["appType","fullName","nric","dob","email","phone","parentNric","relationship","guardianProof","photoFile","photoRecent","photoUnedited","docType","deedPollText","declare"];
  allFields.forEach(function (id) {
    clearWarn(id);
    var ok = document.getElementById("ok-" + id);
    if (ok) ok.classList.remove("visible");
  });
  hide("childSection");
  hide("guardianProofField");
  document.getElementById("deedPollReason").classList.remove("visible");
  document.getElementById("officerReport").style.display = "none";
});

// --- Submit ---
function submitForm() {
  checkAppType();
  checkFullName();
  checkNric();
  checkDob();
  checkEmail();
  checkPhone();
  if (isChildApp()) {
    checkParentNric();
    checkRelationship();
    checkGuardianProof();
  }
  checkDocType();
  checkDeedPollText();
  checkPhotoRecent();
  checkPhotoUnedited();

  if (!document.getElementById("declare").checked) {
    warn("declare", "You must tick the declaration before submitting.");
  } else {
    clearWarn("declare");
  }

  if (!document.getElementById("appType").value) {
    warn("appType", "Please select an application type.");
  }

  var fields = [
    { id: "appType", label: "Application type" },
    { id: "fullName", label: "Full name" },
    { id: "nric", label: "NRIC" },
    { id: "dob", label: "Date of birth" },
    { id: "email", label: "Email" },
    { id: "phone", label: "Contact number" },
    { id: "parentNric", label: "Parent/guardian NRIC", conditional: isChildApp },
    { id: "relationship", label: "Relationship to applicant", conditional: isChildApp },
    { id: "guardianProof", label: "Guardianship proof", conditional: function () { return isChildApp() && document.getElementById("relationship").value === "legal_guardian"; } },
    { id: "photoFile", label: "Photo file", isFile: true },
    { id: "photoRecent", label: "Photo recency", isCheckbox: true },
    { id: "photoUnedited", label: "Photo unedited", isCheckbox: true },
    { id: "docType", label: "Supporting document" },
    { id: "deedPollText", label: "Name change reason", conditional: function () { var d = document.getElementById("docType").value; return d === "deed_poll" || d === "marriage_cert"; } },
    { id: "declare", label: "Declaration", isCheckbox: true }
  ];

  var reportEl = document.getElementById("officerReport");
  var listEl = document.getElementById("reportList");
  listEl.innerHTML = "";

  fields.forEach(function (f) {
    if (f.conditional && !f.conditional()) return;

    var warnEl = document.getElementById("warn-" + f.id);
    var li = document.createElement("li");

    if (warnEl && warnEl.classList.contains("visible")) {
      li.className = "flagged";
      li.textContent = f.label + ": " + warnEl.textContent;
    } else if (f.isFile) {
      var fileInput = document.getElementById(f.id);
      if (!fileInput.files || !fileInput.files[0]) {
        li.className = "flagged";
        li.textContent = f.label + ": no file uploaded";
      } else {
        li.className = "clean";
        li.textContent = f.label + ": OK";
      }
    } else if (f.isCheckbox) {
      if (!document.getElementById(f.id).checked) {
        li.className = "flagged";
        li.textContent = f.label + ": not confirmed";
      } else {
        li.className = "clean";
        li.textContent = f.label + ": OK";
      }
    } else {
      var val = document.getElementById(f.id).value;
      if (!val) {
        li.className = "flagged";
        li.textContent = f.label + ": empty, needs input";
      } else {
        li.className = "clean";
        li.textContent = f.label + ": OK";
      }
    }
    listEl.appendChild(li);
  });

  reportEl.style.display = "block";
}

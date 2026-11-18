/*
  Checker trained on correct-submissions.csv (synthetic data).
  Learns valid patterns from the dataset and flags deviations.
  All data is synthetic and made up.
*/

var CORRECT_PATTERNS = {
  nameFormat: /^[A-Z][A-Z\s'-]{2,60}$/,
  nameHasLowerCase: /[a-z]/,
  minChildAge: 0,
  maxChildAge: 16,
  childNricPrefix: /^[T]\d{7}[A-Z]$/i,
  parentNricPrefix: /^[STFG]\d{7}[A-Z]$/i,
  nricFormat: /^[STFGM]\d{7}[A-Z]$/i,
  photoFormats: ["jpg", "jpeg"],
  photoWidth: 400,
  photoHeight: 514,
  validDocTypes: ["birth_certificate", "deed_poll", "adoption_order"],
  acceptedRelationships: ["mother", "father", "legal_guardian"],
  needsGuardianProof: ["legal_guardian"],
  rejectedRelationships: ["sibling", "grandparent", "other"]
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

function checkChildName() {
  var val = document.getElementById("childName").value.trim();
  if (!val) { clearWarn("childName"); return; }

  if (val.length < 2) {
    warn("childName", "Name seems too short. Enter the full name as printed on the birth certificate.");
    return;
  }
  if (CORRECT_PATTERNS.nameHasLowerCase.test(val)) {
    warn("childName", "Name should be in BLOCK LETTERS (all uppercase), matching the birth certificate. In the correct submissions database, all names are uppercase.");
    return;
  }
  if (/\d/.test(val)) {
    warn("childName", "Name should not contain numbers. Check the birth certificate and enter letters only.");
    return;
  }
  if (!CORRECT_PATTERNS.nameFormat.test(val)) {
    warn("childName", "Name format does not match the pattern from correct submissions. Use the full name as printed on the birth certificate, in BLOCK LETTERS.");
    return;
  }
  markOk("childName");
}

function checkChildDob() {
  var val = document.getElementById("childDob").value;
  if (!val) { clearWarn("childDob"); return; }
  var dob = new Date(val);
  var today = new Date();
  var ageYears = (today - dob) / (365.25 * 24 * 60 * 60 * 1000);
  if (ageYears < 0) {
    warn("childDob", "Date of birth cannot be in the future.");
    return;
  }
  if (ageYears > CORRECT_PATTERNS.maxChildAge) {
    warn("childDob", "This form is for children below 16. If the child is 16 or older, use the standard adult application instead. Child passports are valid for 5 years.");
    return;
  }
  markOk("childDob");
}

function checkChildNric() {
  var val = document.getElementById("childNric").value.trim().toUpperCase();
  if (!val) { clearWarn("childNric"); return; }
  if (val.length !== 9) {
    warn("childNric", "NRIC / birth certificate number must be exactly 9 characters (e.g. T1234567A).");
    return;
  }
  if (!CORRECT_PATTERNS.nricFormat.test(val)) {
    warn("childNric", "Format does not match. Expected pattern: one letter, 7 digits, one letter (e.g. T1234567A).");
    return;
  }
  if (!CORRECT_PATTERNS.childNricPrefix.test(val)) {
    warn("childNric", "Children born in Singapore typically have NRIC starting with T. Check the birth certificate or NRIC card.");
    return;
  }
  markOk("childNric");
}

function checkPhoto() {
  var input = document.getElementById("photoFile");
  if (!input.files || !input.files[0]) { clearWarn("photoFile"); return; }
  var file = input.files[0];
  var ext = file.name.split(".").pop().toLowerCase();
  if (!CORRECT_PATTERNS.photoFormats.includes(ext)) {
    warn("photoFile", "Photo must be JPG format. PNG, BMP, and other formats are not accepted. All correct submissions use JPG.");
    return;
  }
  var img = new Image();
  img.onload = function () {
    if (img.width !== CORRECT_PATTERNS.photoWidth || img.height !== CORRECT_PATTERNS.photoHeight) {
      warn("photoFile", "Photo should be exactly " + CORRECT_PATTERNS.photoWidth + " x " + CORRECT_PATTERNS.photoHeight + " px. Your photo is " + img.width + " x " + img.height + " px. Resize before uploading.");
    } else {
      markOk("photoFile");
    }
    URL.revokeObjectURL(img.src);
  };
  img.src = URL.createObjectURL(file);
}

function checkPhotoRecent() {
  var checked = document.getElementById("photoRecent").checked;
  if (!checked) {
    warn("photoRecent", "You must confirm the photo was taken within the last 3 months. Older photos will be rejected by ICA.");
  } else {
    clearWarn("photoRecent");
  }
}

function checkDocType() {
  var val = document.getElementById("docType").value;
  var deedField = document.getElementById("deedPollReason");
  if (!val) { clearWarn("docType"); deedField.style.display = "none"; return; }

  if (val === "none") {
    warn("docType", "A supporting document is required. For most child renewals, the birth certificate is needed. Without it, your application will be returned.");
    deedField.style.display = "none";
    return;
  }
  if (val === "deed_poll") {
    deedField.style.display = "block";
    markOk("docType");
    return;
  }
  deedField.style.display = "none";
  clearWarn("deedPollText");
  markOk("docType");
}

function checkDeedPollText() {
  var docVal = document.getElementById("docType").value;
  if (docVal !== "deed_poll") return;
  var val = document.getElementById("deedPollText").value.trim();
  if (!val) {
    warn("deedPollText", "Please explain why the child's name differs from the birth certificate. Officers need this to process the deed poll.");
  } else {
    clearWarn("deedPollText");
  }
}

function checkParentNric() {
  var val = document.getElementById("parentNric").value.trim().toUpperCase();
  if (!val) { clearWarn("parentNric"); return; }
  if (val.length !== 9) {
    warn("parentNric", "NRIC must be exactly 9 characters (e.g. S8234567A).");
    return;
  }
  if (!CORRECT_PATTERNS.parentNricPrefix.test(val)) {
    warn("parentNric", "NRIC format does not match. Expected: one letter (S/T/F/G), 7 digits, one letter. Check your NRIC card.");
    return;
  }

  var childVal = document.getElementById("childNric").value.trim().toUpperCase();
  if (childVal && val === childVal) {
    warn("parentNric", "Parent NRIC is the same as the child's. These should be different.");
    return;
  }
  markOk("parentNric");
}

function checkRelationship() {
  var val = document.getElementById("relationship").value;
  var guardianField = document.getElementById("guardianProofField");
  if (!val) { clearWarn("relationship"); guardianField.style.display = "none"; return; }

  if (CORRECT_PATTERNS.rejectedRelationships.includes(val)) {
    warn("relationship", "Only a parent or legal guardian can apply on behalf of a child. Siblings, grandparents, and others are not accepted. In all correct submissions, the applicant is the mother, father, or legal guardian.");
    guardianField.style.display = "none";
    return;
  }
  if (CORRECT_PATTERNS.needsGuardianProof.includes(val)) {
    guardianField.style.display = "block";
    markOk("relationship");
    return;
  }
  guardianField.style.display = "none";
  clearWarn("guardianProof");
  markOk("relationship");
}

function checkGuardianProof() {
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

document.getElementById("childName").addEventListener("blur", checkChildName);
document.getElementById("childDob").addEventListener("change", checkChildDob);
document.getElementById("childNric").addEventListener("blur", checkChildNric);
document.getElementById("photoFile").addEventListener("change", checkPhoto);
document.getElementById("photoRecent").addEventListener("change", checkPhotoRecent);
document.getElementById("docType").addEventListener("change", checkDocType);
document.getElementById("deedPollText").addEventListener("blur", checkDeedPollText);
document.getElementById("parentNric").addEventListener("blur", checkParentNric);
document.getElementById("relationship").addEventListener("change", checkRelationship);
document.getElementById("guardianProof").addEventListener("change", checkGuardianProof);

document.getElementById("appForm").addEventListener("reset", function () {
  var fields = ["childName","childDob","childNric","photoFile","photoRecent","docType","deedPollText","parentNric","relationship","guardianProof","declare"];
  fields.forEach(function (id) {
    clearWarn(id);
    var ok = document.getElementById("ok-" + id);
    if (ok) ok.classList.remove("visible");
  });
  document.getElementById("deedPollReason").style.display = "none";
  document.getElementById("guardianProofField").style.display = "none";
  document.getElementById("officerReport").style.display = "none";
});

function submitForm() {
  checkChildName();
  checkChildDob();
  checkChildNric();
  checkDocType();
  checkDeedPollText();
  checkParentNric();
  checkRelationship();
  checkGuardianProof();
  checkPhotoRecent();

  if (!document.getElementById("declare").checked) {
    warn("declare", "You must tick the declaration before submitting.");
  } else {
    clearWarn("declare");
  }

  var fields = [
    { id: "childName", label: "Child's name" },
    { id: "childDob", label: "Child's date of birth" },
    { id: "childNric", label: "Child's NRIC / BC number" },
    { id: "photoFile", label: "Photo file", isFile: true },
    { id: "photoRecent", label: "Photo recency confirmation", isCheckbox: true },
    { id: "docType", label: "Supporting document" },
    { id: "deedPollText", label: "Deed poll reason", conditional: function() { return document.getElementById("docType").value === "deed_poll"; } },
    { id: "parentNric", label: "Parent's NRIC" },
    { id: "relationship", label: "Relationship to child" },
    { id: "guardianProof", label: "Guardianship proof", conditional: function() { return document.getElementById("relationship").value === "legal_guardian"; } },
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

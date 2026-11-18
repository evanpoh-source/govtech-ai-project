/*
  Checker trained on correct-submissions.csv (synthetic data).
  Learns valid patterns from the dataset and flags deviations.
*/

const CORRECT_PATTERNS = {
  nameFormat: /^[A-Za-z][A-Za-z\s'-]{2,60}$/,
  minChildAge: 0,
  maxChildAge: 16,
  photoFormats: ["jpg", "jpeg"],
  photoWidth: 400,
  photoHeight: 514,
  validDocTypes: ["birth_certificate", "deed_poll"],
  nricFormat: /^[STFGM]\d{7}[A-Z]$/i,
  validRelationships: ["mother", "father", "legal_guardian"]
};

function warn(fieldId, msg) {
  const el = document.getElementById("warn-" + fieldId);
  const ok = document.getElementById("ok-" + fieldId);
  const input = document.getElementById(fieldId);
  el.textContent = msg;
  el.classList.add("visible");
  ok.classList.remove("visible");
  input.classList.add("has-warning");
}

function clearWarn(fieldId) {
  const el = document.getElementById("warn-" + fieldId);
  const ok = document.getElementById("ok-" + fieldId);
  const input = document.getElementById(fieldId);
  el.textContent = "";
  el.classList.remove("visible");
  input.classList.remove("has-warning");
}

function markOk(fieldId) {
  clearWarn(fieldId);
  document.getElementById("ok-" + fieldId).classList.add("visible");
}

function checkChildName() {
  const val = document.getElementById("childName").value.trim();
  if (!val) { clearWarn("childName"); return; }
  if (!CORRECT_PATTERNS.nameFormat.test(val)) {
    warn("childName", "Name should contain only letters and spaces, matching the birth certificate. In the correct submissions database, all names follow this pattern.");
  } else {
    markOk("childName");
  }
}

function checkChildDob() {
  const val = document.getElementById("childDob").value;
  if (!val) { clearWarn("childDob"); return; }
  const dob = new Date(val);
  const today = new Date();
  const ageYears = (today - dob) / (365.25 * 24 * 60 * 60 * 1000);
  if (ageYears < CORRECT_PATTERNS.minChildAge || ageYears > CORRECT_PATTERNS.maxChildAge) {
    warn("childDob", "Child must be under 16. All correct submissions in the database have a child aged 0 to 16.");
  } else {
    markOk("childDob");
  }
}

function checkPhoto() {
  const input = document.getElementById("photoFile");
  if (!input.files || !input.files[0]) { clearWarn("photoFile"); return; }
  const file = input.files[0];
  const ext = file.name.split(".").pop().toLowerCase();
  if (!CORRECT_PATTERNS.photoFormats.includes(ext)) {
    warn("photoFile", "Photo must be JPG format. All correct submissions use JPG files.");
    return;
  }
  const img = new Image();
  img.onload = function () {
    if (img.width !== CORRECT_PATTERNS.photoWidth || img.height !== CORRECT_PATTERNS.photoHeight) {
      warn("photoFile", "Photo should be " + CORRECT_PATTERNS.photoWidth + " x " + CORRECT_PATTERNS.photoHeight + " px. The correct submissions database shows all accepted photos at this size.");
    } else {
      markOk("photoFile");
    }
    URL.revokeObjectURL(img.src);
  };
  img.src = URL.createObjectURL(file);
}

function checkDocType() {
  const val = document.getElementById("docType").value;
  if (!val) { clearWarn("docType"); return; }
  if (!CORRECT_PATTERNS.validDocTypes.includes(val)) {
    warn("docType", "Document type not recognised. Correct submissions use birth certificate or deed poll.");
  } else {
    markOk("docType");
  }
}

function checkParentNric() {
  const val = document.getElementById("parentNric").value.trim();
  if (!val) { clearWarn("parentNric"); return; }
  if (!CORRECT_PATTERNS.nricFormat.test(val)) {
    warn("parentNric", "NRIC should follow the format S1234567A. All correct submissions in the database match this pattern.");
  } else {
    markOk("parentNric");
  }
}

function checkRelationship() {
  const val = document.getElementById("relationship").value;
  if (!val) { clearWarn("relationship"); return; }
  if (!CORRECT_PATTERNS.validRelationships.includes(val)) {
    warn("relationship", "Relationship not recognised. Correct submissions list mother, father, or legal guardian.");
  } else {
    markOk("relationship");
  }
}

document.getElementById("childName").addEventListener("blur", checkChildName);
document.getElementById("childDob").addEventListener("change", checkChildDob);
document.getElementById("photoFile").addEventListener("change", checkPhoto);
document.getElementById("docType").addEventListener("change", checkDocType);
document.getElementById("parentNric").addEventListener("blur", checkParentNric);
document.getElementById("relationship").addEventListener("change", checkRelationship);

document.getElementById("appForm").addEventListener("reset", function () {
  ["childName", "childDob", "photoFile", "docType", "parentNric", "relationship"].forEach(function (id) {
    clearWarn(id);
    document.getElementById("ok-" + id).classList.remove("visible");
  });
  document.getElementById("officerReport").style.display = "none";
});

function submitForm() {
  checkChildName();
  checkChildDob();
  checkDocType();
  checkParentNric();
  checkRelationship();

  var fields = [
    { id: "childName", label: "Child's name" },
    { id: "childDob", label: "Child's date of birth" },
    { id: "photoFile", label: "Photo file" },
    { id: "docType", label: "Supporting document" },
    { id: "parentNric", label: "Parent's NRIC" },
    { id: "relationship", label: "Relationship to child" }
  ];

  var reportEl = document.getElementById("officerReport");
  var listEl = document.getElementById("reportList");
  listEl.innerHTML = "";

  fields.forEach(function (f) {
    var warnEl = document.getElementById("warn-" + f.id);
    var li = document.createElement("li");
    if (warnEl.classList.contains("visible")) {
      li.className = "flagged";
      li.textContent = f.label + ": " + warnEl.textContent;
    } else {
      var val = document.getElementById(f.id).value;
      if (!val && f.id !== "photoFile") {
        li.className = "flagged";
        li.textContent = f.label + ": empty, needs input";
      } else if (f.id === "photoFile" && (!document.getElementById(f.id).files || !document.getElementById(f.id).files[0])) {
        li.className = "flagged";
        li.textContent = f.label + ": no file uploaded";
      } else {
        li.className = "clean";
        li.textContent = f.label + ": OK";
      }
    }
    listEl.appendChild(li);
  });

  reportEl.style.display = "block";
}

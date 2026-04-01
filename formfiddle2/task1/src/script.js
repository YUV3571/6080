const prefName = document.getElementById("preferredName");
const famName = document.getElementById("familyName");
const email = document.getElementById("unswEmail");
const wam = document.getElementById("wam");
const options = document.getElementById("specialisation");
const selectAll = document.getElementById("selectAll");
const studyLocations = [
document.getElementById("mainLibrary"),
document.getElementById("lawLibrary"),
document.getElementById("scienceEngineeringBuilding"),
];
const resetBtn = document.getElementById("resetButton");
const outputArea = document.getElementById("outputText");

// adding form functions
function checkName(value) {
  const pattern = /^[a-zA-Z]{3,50}$/;
  return pattern.test(value);
}

function checkZEmail(value) {
  const pattern = /^z[0-9]{7}@unsw\.edu\.au$/;
  return pattern.test(value);
}

function checkNameEmail(value) {
  const p = prefName.value.toLowerCase();
  const f = famName.value.toLowerCase();
  return value === p + "." + f + "@unsw.edu.au";
}


function checkWam(value) {
  const pattern = /^(\d{1,3})(\.\d{1,2})?$/;
  if (!pattern.test(value)) return false;
  const num = parseFloat(value);
  return num >= 0 && num <= 100;
}

// wam to grade relations
function academicStandings(w) {
  const num = parseFloat(w);
  if (num < 50) return "Fail";
  if (num < 65) return "Pass";
  if (num < 75) return "Credit";
  if (num < 85) return "Distinction";
  return "High Distinction";
}

// fetching locations
function collectLocations() {
  const locationNames = {
    mainLibrary: "Main Library",
    lawLibrary: "Law Library",
    scienceEngineeringBuilding: "Science and Engineering Building",
  };
  const selected = [];
  studyLocations.forEach(function (box) {
    if (box.checked) {
      selected.push(locationNames[box.id]);
    }
  });
  return selected;
}

// generate location message
function locationMessage(list) {
  if (list.length === 0) {
    return "and I have no favourite study location";
  }
  if (list.length === 1) {
    return "and my favourite study location is " + list[0];
  }
  const last = list[list.length - 1];
  const rest = list.slice(0, list.length - 1).join(", ");
  return "and my favourite study locations are " + rest + ", and " + last;
}

// fixed output for constraints for prefname, lastname, email, wam
function updateOutput() {
  const pref = prefName.value;
  const fam = famName.value;
  const emailVal = email.value;
  const wamVal = wam.value;

  if (!checkName(pref)) {
    outputArea.value = "Please input a valid preferred name";
    return;
  }
  if (!checkName(fam)) {
    outputArea.value = "Please input a valid family name";
    return;
  }
  if (!checkZEmail(emailVal) && !checkNameEmail(emailVal)) {
    outputArea.value = "Please input a valid UNSW email";
    return;
  }
  if (!checkWam(wamVal)) {
    outputArea.value = "Please input a valid WAM";
    return;
  }

  let displayName = "";
  if (checkZEmail(emailVal)) {
    const zid = emailVal.split("@")[0];
    displayName = pref + " " + fam + " (" + zid + ")";
  } else {
    displayName = pref.toLowerCase() + " " + fam.toLowerCase();
  }

  const standing = academicStandings(wamVal);
  const spec = options.value;
  const chosenLocations = collectLocations();
  const locationSentence = locationMessage(chosenLocations);

  outputArea.value =
    "My name is " + displayName + "," +
    " my academic standing is " + standing + "." +
    " I specialise in " + spec + ", " +
    locationSentence + ".";
}

// checkbox
function updateSelectAll() {
  const allChecked = studyLocations.every(function (cb) {
    return cb.checked;
  });
  selectAll.checked = allChecked;
}


selectAll.addEventListener("change", function () {
  studyLocations.forEach(function (cb) {
    cb.checked = selectAll.checked;
  });
  updateOutput();
});

studyLocations.forEach(function (cb) {
  cb.addEventListener("change", function () {
    updateSelectAll();
    updateOutput();
  });
});

// blur for output
[prefName, famName, email, wam].forEach(function (field) {
  field.addEventListener("blur", updateOutput);
});

options.addEventListener("change", updateOutput);


// reset button
resetBtn.addEventListener("click", function () {
  prefName.value = "";
  famName.value = "";
  email.value = "";
  wam.value = "";
  options.selectedIndex = 0;
  studyLocations.forEach(function (cb) {
    cb.checked = false;
  });
  selectAll.checked = false;
  outputArea.value = "";
});
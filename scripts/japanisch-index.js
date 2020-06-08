// User set preferences
let preferences = {
  // Active lesson numbers
  "lessons": [2, 3],
  // Active suffix indices
  "suffixes": [1, 2, 3, 4],
}

// Remembers the correct answer
let correct;

// Remembers amount of right/wrong questions
let score = {
  "right": 0,
  "wrong": 0,
  "skipped": 0
};

// Keeps track of asked questions & translations
let hadRandom = {
  // Asked question go here first, so they can be skipped
  "temp": [],
  "verbs": [],
  "translations": []
};

// Constant DOM Elements
const actionButton = document.querySelector(".action-button");
const buttons = document.querySelectorAll(".guess-button");
const overlay = document.querySelector(".overlay");

// Returns an object parsed respecting the given preferences from the given json
const assignJSONObject = (assignPreferences, jsonObject) => {
  let _object = {};

  for (let i of assignPreferences) {
    _object = Object.assign(_object, jsonObject[i.toString()]);
  }

  return _object;
}

// Parses JSON & sets globals;
const parseJSON = (string) => {
  const _json = JSON.parse(string);

  suffixes = assignJSONObject(preferences.suffixes, _json.suffixes);
  verbs = assignJSONObject(preferences.lessons, _json.lessons);

  return true;
}

// Loads JSON from file
const loadJSON = (callback) => {
  const _xobj = new XMLHttpRequest();

  _xobj.overrideMimeType("application/json");
  _xobj.open("GET", "../assets/verben.json", true);
  _xobj.onreadystatechange = () => {
    if (_xobj.readyState == 4 && _xobj.status == "200") {
      callback(_xobj.responseText);
    }
  };

  _xobj.send(null);

  return true;
}

// Removes all state from buttons
const clearButtons = () => {
  buttons.forEach((element) => {
    const elementClasses = element.classList;

    if (elementClasses.contains("right")) elementClasses.remove("right");
    if (elementClasses.contains("wrong")) elementClasses.remove("wrong");

    overlay.style.display = "none";
  });

  return true;
}

// Updates the progress bar
const updateProgress = (percent) => {
  let _customStyleTag = document.querySelector("#customStyleTag");

  if (!_customStyleTag) {
    _customStyleTag = document.createElement("style");
    _customStyleTag.id = "customStyleTag";
  }

  _customStyleTag.innerHTML = `.progress:after {width: ${percent}%;}`;
  document.head.appendChild(_customStyleTag);

  if (percent == 100) document.querySelector(".progress").style.boxShadow = `0 0 10px 0 var(--primary)`;
  if (percent == 0) document.querySelector(".progress").style.boxShadow = `0 0 10px 0 var(--disabled)`;

  return true;
}

// Checks if the clicked button is the correct answer
const submit = (element) => {
  const _percent = (hadRandom["verbs"].length + hadRandom["temp"].length) * 100 / getNumberOfKeys(verbs);

  if (correct == element.innerText) {
    element.classList.toggle("right");
    score.right++;
  } else {
    element.classList.toggle("wrong");
    score.wrong++;

    buttons.forEach((element) => {
      if (element.innerText == correct) element.classList.toggle("right");
    });
  }

  updateProgress(_percent);

  if (_percent == 100) return showResults();

  overlay.style.display = "block";

  return _percent;
}

// Resets the quiz
const resetQuiz = () => {
  hadRandom = {
    "temp": [],
    "verbs": [],
    "translations": []
  };

  score = {
    "right": 0,
    "wrong": 0,
    "skipped": 0
  };

  actionButton.innerText = "Überspringen";

  document.querySelector(".result").style.display = "none";
  document.querySelector(".verb").style.display = "block";

  updateProgress(0);
}

// Pushes temporary verb on list with had verbs
const pushTempVerb = () => {
  hadRandom.verbs.push(hadRandom.temp[0]);
  hadRandom.temp = [];
}

// Handles the click event of .action-button
const actionButtonClick = () => {
  if (actionButton.innerText == "Überspringen") {
    const _percent = (hadRandom["verbs"].length + hadRandom["temp"].length) * 100 / getNumberOfKeys(verbs);

    pushTempVerb();
    score.skipped++;
    updateProgress(_percent);
  } else {
    resetQuiz();
  }

  clearButtons();
  randomQuiz();

  return true;
}

// Handles the click event of .overlay
const overlayClick = () => {
  pushTempVerb();
  clearButtons();
  randomQuiz();
}

// Entry point
window.onload = () => {
  buttons.forEach((element) => {
    element.addEventListener("click", (event) => {
      submit(event.target);
    });
  });

  overlay.addEventListener("click", overlayClick);
  actionButton.addEventListener("click", actionButtonClick);

  loadJSON((string) => {
    parseJSON(string);

    // Starts quiz
    return randomQuiz();
  });

  return true;
}

// Returns random number between min and max
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min)) + min;

// Returns all the keys of an object
const getKeys = (object) => Object.keys(object);

// Returns the amount of keys of an object
const getNumberOfKeys = (object) => getKeys(object).length;

// Returns random values to construct a verb
const getRandomKeys = () => {
  const _verbKeys = getKeys(verbs);
  const _verbRandom = getRandomInt(0, getNumberOfKeys(verbs));

  const _suffixKeys = getKeys(suffixes);
  const _suffixRandom = getRandomInt(0, getNumberOfKeys(suffixes));

  return {
    "verbKeys": _verbKeys,
    "verbRandom": _verbRandom,
    "suffixKeys": _suffixKeys,
    "suffixRandom": _suffixRandom
  };
}

// Checks if an item was already used
const checkRepetition = (category, callback) => {
  const _hadRandomOfCategory = hadRandom[category];
  let _object = callback();
  let _item = _object.item;

  while (_hadRandomOfCategory.includes(_item) || _item == correct) {
    _object = callback();
    _item = _object.item;
  }

  if (category == "verbs") {
    hadRandom.temp.push(_item);
  } else {
    _hadRandomOfCategory.push(_item);
  }

  return _object;
}

// Returns random question
const getRandomQuestion = () => {
  _verb = checkRepetition("verbs", () => {
    const _randomKeys = getRandomKeys();
    let _verbStem = _randomKeys.verbKeys[_randomKeys.verbRandom];
    let _verb = `${_verbStem}${_randomKeys.suffixKeys[_randomKeys.suffixRandom]}`;

    return {
      "item": _verbStem,
      "verb": _verb,
      "randomKeys": _randomKeys
    };
  });

  return {
    "verb": _verb.verb,
    "translation": `${verbs[_verb.randomKeys.verbKeys[_verb.randomKeys.verbRandom]]}\n(${suffixes[_verb.randomKeys.suffixKeys[_verb.randomKeys.suffixRandom]]})`
  };
}

// Returns random answer
const getRandomTranslation = () => {
  _translation = checkRepetition("translations", () => {
    const _randomKeys = getRandomKeys();
    let _translation = `${verbs[_randomKeys.verbKeys[_randomKeys.verbRandom]]}\n(${suffixes[_randomKeys.suffixKeys[_randomKeys.suffixRandom]]})`;

    return {
      "item": _translation
    };
  });

  return _translation.item;
}

// Enables / disabled all .guess-buttons
const toggleButtons = ({ disabled } = {}) => {
  buttons.forEach((element) => {
    element.disabled = disabled;
  });

  actionButton.innerText = "Neue Runde";

  return true;
}

// Asks verb & translation
const randomQuiz = () => {
  if (hadRandom.verbs.length == getNumberOfKeys(verbs)) return showResults();

  const _verb = document.querySelector(".verb");
  const _randomTranslation = getRandomInt(0, 4);

  toggleButtons({ disabled: false });

  _question = getRandomQuestion();

  correct = _question.translation;
  _verb.innerText = _question.verb;
  actionButton.innerText = "Überspringen";


  hadRandom.translations = [];

  buttons.forEach((element, index) => {
    if (_randomTranslation == index) {
      element.innerText = _question.translation;
      return;
    }
    element.innerText = getRandomTranslation();
  });

  return true;
}

// Shows results
const showResults = () => {
  const _result = document.querySelector(".result");
  const _timesSkipped = score.skipped;
  const _timesRight = score.right;

  toggleButtons({ disabled: true });

  document.querySelector(".verb").style.display = "none";

  _result.style.display = "block";
  // TODO: Optimize string
  _result.innerText = `Sie haben ${_timesRight} von ${getNumberOfKeys(verbs)} Fragen richtig beantwortet.\nEs ${_timesSkipped <= 1 ? "wurde" : "wurden"} ${_timesSkipped == 0 ? "kein einziges" : _timesSkipped == getNumberOfKeys(verbs) ? "alle" : _timesSkipped} ${_timesSkipped <= 1 ? "Verb" : "Verben"} ausgelassen.`;

  return true;
}

// TODO: Add features
// - Settings
//   - Timer (to be saved with localstorage -> highscores)
// - Better verbs (no brackets)
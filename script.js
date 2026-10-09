
const screen = document.querySelector("#screen");
const status = document.querySelector("#status");
const startButton = document.querySelector("#start-btn");

const birthdayMessage =
  "HAPPY BIRTHDAY JONNY! 🎉 You hacked the mainframe. Love you and Hope you have an awesome day! Now keep practicing your coding skills (:";

let stage = 0;
let hintsUsed = 0;
let pyodide = null;
let running = false;

const challenges = [
  {
    title: "01 // BROKEN AUTHENTICATION",
    description:
      "The security system rejects a valid access code. Find and repair the faulty condition.",
    code: `access_code = 7

if access_code < 5:
    print("ACCESS DENIED")
elif access_code == 5:
    print("ACCESS DENIED")
else:
    print("ACCESS DENIED")`,
    expected: "ACCESS GRANTED",
    hint:
      "Trace each condition with access_code equal to 7. What should happen when the correct code is detected? (ANSWERS can BE case SENSITIVE!)"
  },
  {
    title: "02 // COUNTDOWN FAILURE",
    description:
      "The launch sequence is skipping a number. Repair the loop so the countdown is correct.",
    code: `count = 3

while count > 1:
    print(count)
    count -= 1

print("LAUNCH!")`,
    expected: "3\n2\n1\nLAUNCH!",
    hint:
      "Check the loop condition. Which values of count are allowed to enter the loop?"
  },
  {
    title: "03 // DATA EXTRACTION",
    description:
      "The data processor is calculating the wrong total. Fix the logic to extract the intended values.",
    code: `numbers = [2, 3, 4, 6]
total = 0

for number in numbers:
    if number - 2 != 0:
        total += number

print(f"TOTAL: {total}")`,
    expected: "TOTAL: 12",
    hint:
      "the if statment is checking if the answer is zero when a number is taken away, if it is then its not added to the total."
  }
];

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function render(html) {
  screen.innerHTML = html;
}

function showStatus(message) {
  status.textContent = message;
}

function showIntro() {
  stage = 0;
  hintsUsed = 0;
  showStatus("SYSTEM ONLINE");

  render(`
    <p class="muted">SECURE TERMINAL // VERSION 2.0</p>
    <h1>WELCOME, AGENT.</h1>
    <p>Three corrupted Python programs are blocking access to a classified file.</p>
    <p>Inspect the code, repair the logic and run your solution.</p>
    <p class="muted">The terminal will only accept the required output.</p>
    <button id="begin-btn">BEGIN MISSION</button>
  `);

  document.querySelector("#begin-btn")
    .addEventListener("click", () => showChallenge(0));
}

function showChallenge(index) {
  stage = index + 1;

  const challenge = challenges[index];

  showStatus(`SECURITY LAYER ${stage}/3`);

  render(`
    <p class="muted">FILE: encrypted_${stage}.py</p>
    <h1>${challenge.title}</h1>
    <p>${challenge.description}</p>

    <p class="muted">REQUIRED OUTPUT</p>
    <div class="expected-output">${escapeHTML(challenge.expected)}</div>

    <p class="muted">EDIT THE PYTHON CODE BELOW</p>
    <textarea id="code-editor" class="code-editor"
      spellcheck="false" autocapitalize="off"
      autocomplete="off" autocorrect="off"
      aria-label="Python code editor">${escapeHTML(challenge.code)}</textarea>

    <button id="run-btn">▶ RUN CODE</button>
    <button id="hint-btn">REQUEST HINT</button>

    <div class="output-box">
      <p class="muted">TERMINAL OUTPUT</p>
      <pre id="output" style="white-space:pre-wrap;overflow-wrap:anywhere">Awaiting execution...</pre>
    </div>

    <p id="feedback" aria-live="polite"></p>
  `);

  document.querySelector("#run-btn")
    .addEventListener("click", runChallenge);

  document.querySelector("#hint-btn")
    .addEventListener("click", () => {
      hintsUsed++;

      document.querySelector("#feedback").textContent =
        "HINT: " + challenge.hint;
    });
}

async function runChallenge() {
  if (running) return;

  running = true;

  const button = document.querySelector("#run-btn");
  const output = document.querySelector("#output");
  const feedback = document.querySelector("#feedback");
  const code = document.querySelector("#code-editor").value;
  const challenge = challenges[stage - 1];

  button.disabled = true;
  button.textContent = "EXECUTING...";
  output.textContent = "Running Python...";
  feedback.textContent = "";

  try {
    if (!pyodide) {
      showStatus("LOADING PYTHON...");

      pyodide = await loadPyodide();

      showStatus(`SECURITY LAYER ${stage}/3`);
    }

    // Pass the editor contents into the real Python runtime.
    pyodide.globals.set("user_code", code);

    const result = pyodide.runPython(`
import io
import contextlib

_output = io.StringIO()

try:
    with contextlib.redirect_stdout(_output):
        exec(user_code, {})
    _result = _output.getvalue().rstrip()
except Exception as error:
    _result = f"{type(error).__name__}: {error}"

_result
`);

    const actual = String(result);

    output.textContent = actual || "(no output)";

    if (actual.trim() === challenge.expected.trim()) {
      feedback.innerHTML =
        '<span class="success">OUTPUT MATCHED. ACCESS APPROVED.</span>';

      button.textContent =
        stage === challenges.length
          ? "UNLOCK FINAL FILE"
          : "CONTINUE TO NEXT LAYER";

      // Only advance after the correct output is produced.
      button.onclick = () => {
        if (stage < challenges.length) {
          showChallenge(stage);
        } else {
          showFinalMessage();
        }
      };

      button.onclick = button.onclick.bind(null);
    } else {
      feedback.innerHTML =
        '<span class="error">OUTPUT INCORRECT. REVIEW YOUR CODE AND TRY AGAIN.</span>';
    }
  } catch (error) {
    output.textContent = String(error);
    feedback.innerHTML =
      '<span class="error">RUNTIME ERROR. CHECK YOUR CODE.</span>';
  } finally {
    running = false;
    button.disabled = false;

    if (button.textContent === "EXECUTING...") {
      button.textContent = "▶ RUN CODE";
    }
  }
}

function showFinalMessage() {
  stage = 4;
  showStatus("ACCESS GRANTED");

  render(`
    <p class="muted">ALL SECURITY LAYERS BYPASSED</p>
    <h1 class="success">FILE DECRYPTED ✓</h1>
    <p>${escapeHTML(birthdayMessage)}</p>
    <p class="muted">HINTS USED: ${hintsUsed}</p>
    <p>Mission complete, agent.</p>
    <button id="restart-btn">REPLAY MISSION</button>
  `);

  document.querySelector("#restart-btn")
    .addEventListener("click", showIntro);
}

startButton.addEventListener("click", showIntro);
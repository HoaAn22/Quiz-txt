/* ================= DATA ================= */
let allQuestions = {};
let questions = [];
let current = 0;
let score = 0;

/* ================= ELEMENTS ================= */
const questionEl = document.getElementById("question");
const answersDiv = document.querySelector(".answers");
const topicTitle = document.getElementById("topicName");
const scoreEl = document.getElementById("score");
const nextBtn = document.getElementById("nextBtn");
const explanationBox = document.getElementById("explanationBox");

/* ================= INIT ================= */
init();

async function init() {
    await loadAllTXT();
    renderTopics(Object.keys(allQuestions));
}

/* ================= LOAD ALL TXT ================= */
async function loadAllTXT() {
    const index = await fetch("questions/topic.txt").then(r => r.text());

    const files = index
        .split("\n")
        .map(f => f.trim())
        .filter(Boolean);

    for (const file of files) {
        const txt = await fetch(`questions/${file}`).then(r => r.text());
        const parsed = parseTXT(txt);

        for (const topic in parsed) {
            allQuestions[topic] = parsed[topic];
        }
    }
}

/* ================= PARSE TXT (ROBUST) ================= */
function parseTXT(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim());
    let result = {};
    let topic = null;
    let q = null;
    let mode = null; // options | explain

    const save = () => {
        if (topic && q) {
            result[topic].push(q);
            q = null;
            mode = null;
        }
    };

    for (const line of lines) {

        if (!line) continue;

        if (line.startsWith("TOPIC:")) {
            save();
            topic = line.slice(6).trim();
            result[topic] = [];
        }

        else if (line.startsWith("Q:")) {
            save();
            q = {
                question: line.slice(2).trim(),
                options: [],
                answer: "",
                explanation: {}
            };
            mode = "options";
        }

        else if (line.startsWith("ANS:")) {
            q.answer = line.slice(4).trim();
            mode = null;
        }

        else if (line.startsWith("EXPLAIN:")) {
            mode = "explain";
        }

        else if (line === "---") {
            save();
        }

        else if (mode === "options" && line.startsWith("- ")) {
            q.options.push(line.slice(2).trim());
        }

        else if (mode === "explain" && line.startsWith("-")) {
            const parts = line.slice(1).split(">");
            if (parts.length === 2) {
                q.explanation[parts[0].trim()] = parts[1].trim();
            }
        }
    }
    save();

    return result;
}

/* ================= RENDER TOPICS ================= */
function renderTopics(topics) {
    const sidebar = document.getElementById("topicList");
    sidebar.innerHTML = "";

    topics.forEach(topic => {
        const btn = document.createElement("button");
        btn.textContent = topic;
        btn.onclick = () => startTopic(topic);
        sidebar.appendChild(btn);
    });
}

/* ================= START TOPIC ================= */
function startTopic(topic) {
    topicTitle.textContent = topic;
    score = 0;
    scoreEl.textContent = score;

    questions = [...allQuestions[topic]];
    shuffle(questions);

    current = 0;
    loadQuestion();
}

/* ================= LOAD QUESTION ================= */
function loadQuestion() {
    if (current >= questions.length) {
        questionEl.textContent = "🎉 Finished!";
        answersDiv.innerHTML = "";
        nextBtn.style.display = "none";

        explanationBox.style.display = "block";
        explanationBox.className = "";
        explanationBox.innerHTML = `🏆 Final score: <b>${score}</b>`;
        return;
    }

    const q = questions[current];

    questionEl.textContent = q.question;
    answersDiv.innerHTML = "";

    explanationBox.style.display = "none";
    explanationBox.className = "";
    explanationBox.innerHTML = "";

    const opts = [...q.options];
    shuffle(opts);

    opts.forEach(opt => {
        const btn = document.createElement("button");
        btn.textContent = opt;
        btn.onclick = () => checkAnswer(btn, opt);
        answersDiv.appendChild(btn);
    });

    nextBtn.style.display = "none";
}

/* ================= CHECK ANSWER ================= */
function checkAnswer(btn, selected) {
    const q = questions[current];
    const correct = q.answer;

    document.querySelectorAll(".answers button")
        .forEach(b => b.disabled = true);

    explanationBox.style.display = "block";

    if (selected === correct) {
        btn.classList.add("correct");
        score += 10;
        scoreEl.textContent = score;

        explanationBox.className = "correct";
        explanationBox.innerHTML =
            `<b>Correct.</b><br>${q.explanation[selected] || ""}`;
    } else {
        btn.classList.add("wrong");

        document.querySelectorAll(".answers button").forEach(b => {
            if (b.textContent === correct) b.classList.add("correct");
        });

        explanationBox.className = "wrong";
        explanationBox.innerHTML =
            `<b>Wrong.</b><br>
             ${q.explanation[selected] || ""}`;
    }

    nextBtn.style.display = "inline-block";
}

/* ================= NEXT ================= */
nextBtn.onclick = () => {
    current++;
    loadQuestion();
};

/* ================= SHUFFLE ================= */
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

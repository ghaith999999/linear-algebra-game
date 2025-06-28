const questionEl = document.getElementById('question');
const answersEl = document.getElementById('answers');
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const timeEl = document.getElementById('time');
const nextBtn = document.getElementById('nextBtn');
const highScoresEl = document.getElementById('highScores');

let score = 0;
let level = 1;
let time = 120; // وقت البداية 120 ثانية (دقيقتان)
let timerInterval = null;

const sounds = {
  correct: new Audio('https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg'),
  wrong: new Audio('https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg'),
  next: new Audio('https://actions.google.com/sounds/v1/ui/button_click.ogg')
};

// --- Helper Functions ---

function randomInt(max, min=0) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray(arr) {
  let array = arr.slice();
  for (let i = array.length - 1; i > 0; i--) {
    const j = randomInt(i);
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// --- Question Generators ---

function generateVectorAdd(level) {
  const maxNum = level * 7;
  const v1 = [randomInt(maxNum), randomInt(maxNum)];
  const v2 = [randomInt(maxNum), randomInt(maxNum)];
  const correct = [v1[0] + v2[0], v1[1] + v2[1]];
  const answers = [
    `(${correct[0]}, ${correct[1]})`,
    `(${correct[0]+1}, ${correct[1]})`,
    `(${correct[0]}, ${correct[1]+1})`,
    `(${correct[0]-1}, ${correct[1]-1})`
  ];
  return {question: `ما هو ناتج جمع المتجهين (${v1[0]}, ${v1[1]}) و (${v2[0]}, ${v2[1]})؟`, answers, correctIndex: 0};
}

function generateScalarMultiply(level) {
  const maxNum = level * 7;
  const scalar = randomInt(maxNum) || 1;
  const v = [randomInt(maxNum), randomInt(maxNum)];
  const correct = [v[0]*scalar, v[1]*scalar];
  const answers = [
    `(${correct[0]}, ${correct[1]})`,
    `(${correct[0]+scalar}, ${correct[1]})`,
    `(${correct[0]}, ${correct[1]+scalar})`,
    `(${correct[0]-scalar}, ${correct[1]-scalar})`
  ];
  return {question: `ما هو ناتج ضرب المتجه (${v[0]}, ${v[1]}) في العدد ${scalar}؟`, answers, correctIndex: 0};
}

function generateMatrixDeterminant(level) {
  if(level < 4){
    const maxNum = level * 7;
    const a = randomInt(maxNum);
    const b = randomInt(maxNum);
    const c = randomInt(maxNum);
    const d = randomInt(maxNum);
    const det = a*d - b*c;
    const question = `إذا كانت المصفوفة A = [[${a}, ${b}], [${c}, ${d}]]، ما هو محدد المصفوفة A؟`;
    const answers = [
      det.toString(),
      (det + 1).toString(),
      (det - 1).toString(),
      (det + 2).toString(),
    ];
    return {question, answers, correctIndex: 0};
  } else {
    const maxNum = level * 5;
    const m = [];
    for(let i=0;i<9;i++) m.push(randomInt(maxNum));
    const det = m[0]*m[4]*m[8] + m[1]*m[5]*m[6] + m[2]*m[3]*m[7] - m[2]*m[4]*m[6] - m[0]*m[5]*m[7] - m[1]*m[3]*m[8];
    const question = `إذا كانت المصفوفة A = [[${m[0]}, ${m[1]}, ${m[2]}], [${m[3]}, ${m[4]}, ${m[5]}], [${m[6]}, ${m[7]}, ${m[8]}]]، ما هو محدد المصفوفة A؟`;
    const answers = [
      det.toString(),
      (det + 3).toString(),
      (det - 2).toString(),
      (det + 1).toString(),
    ];
    return {question, answers, correctIndex: 0};
  }
}

function generateEigenRelation(level) {
  const lambda = randomInt(level * 5) || 1;
  const question = `إذا كان λ = ${lambda} هو قيمة ذاتية وv متجه ذاتي، فما العلاقة الصحيحة؟`;
  const answers = [
    `A v = λ v`,
    `A + v = λ`,
    `A - v = 0`,
    `λ v = 0`
  ];
  return {question, answers, correctIndex: 0};
}

function generateQuestion(level) {
  const types = ['vector_add', 'scalar_multiply', 'matrix_determinant', 'eigen_relation'];
  const type = types[randomInt(types.length - 1)];

  switch(type){
    case 'vector_add': return generateVectorAdd(level);
    case 'scalar_multiply': return generateScalarMultiply(level);
    case 'matrix_determinant': return generateMatrixDeterminant(level);
    case 'eigen_relation': return generateEigenRelation(level);
  }
}

// --- Game Logic ---

let currentQuestion = null;

function startTimer() {
  clearInterval(timerInterval);
  time = 120; // reset الوقت لكل سؤال لدقيقتين
  updateTimerDisplay(time);
  timerInterval = setInterval(() => {
    time--;
    updateTimerDisplay(time);
    if(time <= 0){
      clearInterval(timerInterval);
      disableAnswers();
      sounds.wrong.play();
      questionEl.style.color = '#f44336';
      nextBtn.disabled = false;
      nextBtn.style.display = 'inline-block';
    }
  }, 1000);
}

function updateTimerDisplay(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  timeEl.textContent = `${min}:${sec.toString().padStart(2, '0')}`;
}

function showQuestion() {
  answersEl.innerHTML = '';
  nextBtn.style.display = 'none';
  nextBtn.disabled = true;
  questionEl.style.color = '#fff';

  currentQuestion = generateQuestion(level);

  questionEl.textContent = currentQuestion.question;

  // ربط كل جواب مع علامة إذا كان هو الصحيح
  let answersWithFlag = currentQuestion.answers.map((answer, idx) => ({
    text: answer,
    isCorrect: idx === currentQuestion.correctIndex
  }));

  // خلط الإجابات
  answersWithFlag = shuffleArray(answersWithFlag);

  // عرض الإجابات بعد الخلط
  answersWithFlag.forEach((answerObj, idx) => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.textContent = answerObj.text;
    btn.addEventListener('click', () => selectAnswer(idx));
    answersEl.appendChild(btn);
  });

  // تحديث correctIndex بعد الخلط
  currentQuestion.correctIndex = answersWithFlag.findIndex(ans => ans.isCorrect);

  startTimer();
  sounds.next.play();
}

function disableAnswers() {
  [...answersEl.children].forEach(btn => btn.disabled = true);
}

function selectAnswer(selectedIndex) {
  clearInterval(timerInterval);
  const correctIndex = currentQuestion.correctIndex;

  disableAnswers();

  if(selectedIndex === correctIndex){
    score++;
    scoreEl.textContent = score;
    sounds.correct.play();
    questionEl.style.color = '#4caf50';
  } else {
    sounds.wrong.play();
    questionEl.style.color = '#f44336';
  }

  nextBtn.disabled = false;
  nextBtn.style.display = 'inline-block';

  updateLevel();
}

function updateLevel() {
  const newLevel = Math.floor(score / 5) + 1;
  if(newLevel !== level){
    level = newLevel;
    levelEl.textContent = level;
  }
}

// --- High Scores ---

function loadHighScores() {
  const stored = localStorage.getItem('linearAlgebraHighScores');
  if(stored){
    return JSON.parse(stored);
  }
  return [];
}

function saveHighScores(scores) {
  localStorage.setItem('linearAlgebraHighScores', JSON.stringify(scores));
}

function addHighScore(score) {
  let scores = loadHighScores();
  scores.push(score);
  scores.sort((a,b) => b - a);
  if(scores.length > 5) scores = scores.slice(0,5);
  saveHighScores(scores);
  displayHighScores();
}

function displayHighScores() {
  const scores = loadHighScores();
  highScoresEl.innerHTML = '';
  if(scores.length === 0){
    highScoresEl.innerHTML = '<li>لا توجد نتائج بعد</li>';
    return;
  }
  scores.forEach((s, i) => {
    const li = document.createElement('li');
    li.textContent = `${i+1}. ${s} نقطة`;
    highScoresEl.appendChild(li);
  });
}

// --- Next Button Handler ---

nextBtn.addEventListener('click', () => {
  nextBtn.disabled = true;
  nextBtn.style.display = 'none';
  questionEl.style.color = '#fff';
  showQuestion();
});

// --- Window unload (نهاية اللعبة) ---

window.addEventListener('beforeunload', () => {
  addHighScore(score);
});

// --- بدء اللعبة ---

displayHighScores();
showQuestion();

// F45 Workout Timer - F45 Style

// Config - will be updated from inputs
let WORKOUT_CONFIG = {
workTime: 40,
restTime: 20,
sets: 4,
exercisesPerSet: 6,
restBetweenSets: 120,
countdown: 3
};

let state = {
phase: ‘countdown’,
isRunning: false,
currentExercise: 0,
currentSet: 0,
timeRemaining: WORKOUT_CONFIG.countdown,
intervalId: null,
exercises: [],
exerciseLibrary: null,
// FIX 2: Cache exercises per even set so odd sets can repeat them.
// setCache[0] = exercises for Set 1 (reused by Set 2)
// setCache[2] = exercises for Set 3 (reused by Set 4)
setCache: {}
};

// Load exercises from JSON
async function loadExercises() {
try {
const response = await fetch(‘js/exercises.json’);
state.exerciseLibrary = await response.json();
} catch (e) {
console.error(‘Failed to load exercises:’, e);
state.exerciseLibrary = { pull: [], push: [], squat: [], hinge: [] };
}
}

// Select exercises with rotation - different for Sets 1-2 vs 3-4
function selectRandomExercises(count, setNumber) {
if (!state.exerciseLibrary) return [];

```
const rotations = {
    0: ['push', 'pull', 'hinge', 'squat'],
    1: ['pull', 'hinge', 'squat', 'push'],
    2: ['squat', 'push', 'pull', 'hinge'],
    3: ['hinge', 'squat', 'push', 'pull']
};

const rotation = rotations[setNumber] || rotations[0];
const selected = [];

for (let i = 0; i < count; i++) {
    const category = rotation[i % 4];
    const exercises = state.exerciseLibrary[category];
    if (!exercises || exercises.length === 0) continue;

    const exercise = exercises[Math.floor(Math.random() * exercises.length)];
    if (exercise && !selected.find(e => e.name === exercise.name)) {
        selected.push(exercise);
    }
}

return selected;
```

}

// FIX 2: Get exercises for a set, reusing the cache so that:
//   Set 2 (index 1) mirrors Set 1 (index 0)
//   Set 4 (index 3) mirrors Set 3 (index 2)
function getExercisesForSet(setIndex) {
// Odd sets (1, 3) reuse the previous even set’s exercises
const cacheKey = setIndex % 2 === 1 ? setIndex - 1 : setIndex;

```
if (state.setCache[cacheKey]) {
    return state.setCache[cacheKey];
}

// Generate and cache for even sets
const exercises = selectRandomExercises(WORKOUT_CONFIG.exercisesPerSet, setIndex);
state.setCache[cacheKey] = exercises;
return exercises;
```

}

// DOM Elements
const timerPhase = document.querySelector(’.timer-phase’);
const timerTime = document.querySelector(’.timer-time’);
const progressBar = document.querySelector(’.progress-bar’);
const startBtn = document.getElementById(‘startBtn’);
const resetBtn = document.getElementById(‘resetBtn’);
const exerciseNumber = document.querySelector(’.exercise-number’);
const exerciseName = document.querySelector(’.exercise-name’);
const exerciseCues = document.querySelector(’.exercise-cues’);
const exerciseEquip = document.querySelector(’.equip-value’);
const exerciseList = document.querySelector(’.exercise-list’);
const setIndicator = document.querySelector(’.set-indicator’);
const nextBtn = document.getElementById(‘nextBtn’);
const prevBtn = document.getElementById(‘prevBtn’);
const allExerciseList = document.querySelector(’.all-exercise-list’);

// LocalStorage
function saveExercises() {
const data = {
exercises: state.exercises,
currentExercise: state.currentExercise,
currentSet: state.currentSet,
setCache: state.setCache,
date: new Date().toDateString()
};
localStorage.setItem(‘f45-workout’, JSON.stringify(data));
}

function loadSavedExercises() {
const saved = localStorage.getItem(‘f45-workout’);
if (saved) {
const data = JSON.parse(saved);
if (data.date === new Date().toDateString()) {
return data;
}
}
return null;
}

async function init() {
await loadExercises();

```
// Read work/rest from inputs
const workInput = document.getElementById('workTime');
const restInput = document.getElementById('restTime');
if (workInput && workInput.value) WORKOUT_CONFIG.workTime = parseInt(workInput.value) || 40;
if (restInput && restInput.value) WORKOUT_CONFIG.restTime = parseInt(restInput.value) || 20;

state.timeRemaining = WORKOUT_CONFIG.countdown;

const saved = loadSavedExercises();
if (saved && saved.exercises) {
    state.exercises = saved.exercises;
    state.currentExercise = saved.currentExercise;
    state.currentSet = saved.currentSet;
    // FIX 2: Restore set cache so repeat-set logic survives page reload
    if (saved.setCache) state.setCache = saved.setCache;
} else {
    // FIX 2: Use getExercisesForSet instead of selectRandomExercises directly
    state.exercises = getExercisesForSet(state.currentSet);
}

renderExercise();
renderUpNext();
renderAllExercises();
updateSetIndicator();
updateTimerDisplay();

startBtn.addEventListener('click', toggleTimer);
resetBtn.addEventListener('click', resetWorkout);
nextBtn.addEventListener('click', skipToNext);
prevBtn.addEventListener('click', prevExercise);
```

}

// FIX 1: showNext = true renders the *upcoming* exercise (used during rest phase)
function renderExercise(showNext = false) {
if (state.exercises.length === 0) return;

```
let exercise;
let displayNumber;

if (showNext) {
    const nextIndex = state.currentExercise + 1;

    if (nextIndex < state.exercises.length) {
        // Next exercise is in the same set
        exercise = state.exercises[nextIndex];
        displayNumber = nextIndex + 1;
    } else {
        // Next exercise is the first exercise of the next set
        const nextSetIndex = state.currentSet + 1;
        if (nextSetIndex < WORKOUT_CONFIG.sets) {
            // FIX 2: Peek at the next set's exercises using the cache/generator
            const nextSetExercises = getExercisesForSet(nextSetIndex);
            exercise = nextSetExercises[0];
            displayNumber = 1;
        } else {
            // No next exercise — last exercise of last set; show a done placeholder
            exerciseNumber.textContent = 'Last Exercise';
            exerciseName.textContent = 'Almost done!';
            exerciseCues.textContent = 'Final rest — finish strong.';
            exerciseEquip.textContent = '-';
            return;
        }
    }
} else {
    exercise = state.exercises[state.currentExercise];
    displayNumber = state.currentExercise + 1;
}

exerciseNumber.textContent = (showNext ? 'Up Next — Exercise ' : 'Exercise ') + displayNumber;
exerciseName.textContent = exercise.name;
exerciseCues.textContent = exercise.cues;
exerciseEquip.textContent = exercise.equip;

exerciseName.classList.add('switch');
setTimeout(() => exerciseName.classList.remove('switch'), 300);
```

}

function renderUpNext() {
exerciseList.innerHTML = ‘’;
for (let i = state.currentExercise + 1; i < state.exercises.length; i++) {
const li = document.createElement(‘li’);
li.className = ‘exercise-item’;
li.innerHTML =
‘<span class="item-number">’ + (i + 1) + ‘</span>’ +
‘<span class="item-name">’ + state.exercises[i].name + ‘</span>’;
exerciseList.appendChild(li);
}
}

function renderAllExercises() {
if (!allExerciseList) return;
allExerciseList.innerHTML = ‘’;
state.exercises.forEach((exercise, i) => {
const li = document.createElement(‘li’);
let classes = ‘all-exercise-item’;
if (i < state.currentExercise) classes += ’ done’;
if (i === state.currentExercise) classes += ’ active’;
li.className = classes;
li.innerHTML =
‘<span class="all-item-number">’ + (i + 1) + ‘</span>’ +
‘<span class="all-item-name">’ + exercise.name + ‘</span>’ +
‘<span class="all-item-equip">’ + exercise.equip + ‘</span>’;
allExerciseList.appendChild(li);
});
}

function updateSetIndicator() {
setIndicator.textContent = ’Set ’ + (state.currentSet + 1) + ’ of ’ + WORKOUT_CONFIG.sets;
}

function toggleTimer() {
if (state.isRunning) pauseTimer();
else startTimer();
}

function startTimer() {
state.isRunning = true;
startBtn.textContent = ‘Pause’;
startBtn.classList.add(‘primary’);

```
state.intervalId = setInterval(() => {
    state.timeRemaining--;
    updateTimerDisplay();

    if (state.timeRemaining <= 3 && state.timeRemaining > 0) {
        playBeep();
    }

    if (state.timeRemaining <= 0) {
        handlePhaseChange();
    }
}, 1000);
```

}

function pauseTimer() {
state.isRunning = false;
startBtn.textContent = ‘Resume’;
startBtn.classList.remove(‘primary’);
if (state.intervalId) clearInterval(state.intervalId);
}

function updateTimerDisplay() {
timerTime.textContent = state.timeRemaining;
timerTime.classList.add(‘tick’);
setTimeout(() => timerTime.classList.remove(‘tick’), 100);

```
let total;
if (state.phase === 'countdown') total = WORKOUT_CONFIG.countdown;
else if (state.phase === 'work') total = WORKOUT_CONFIG.workTime;
else if (state.phase === 'rest') {
    total = state.currentExercise >= state.exercises.length - 1 &&
        (state.currentSet + 1) % 2 === 0 &&
        state.currentSet < WORKOUT_CONFIG.sets - 1
        ? WORKOUT_CONFIG.restBetweenSets
        : WORKOUT_CONFIG.restTime;
}

const percentage = (state.timeRemaining / total) * 100;
progressBar.style.width = percentage + '%';
```

}

function playBeep() {
try {
const ctx = new (window.AudioContext || window.webkitAudioContext)();
const osc = ctx.createOscillator();
const gain = ctx.createGain();
osc.connect(gain);
gain.connect(ctx.destination);
osc.frequency.value = 800;
gain.gain.value = 0.1;
osc.start();
osc.stop(ctx.currentTime + 0.1);
} catch (e) {}
}

function playAlert() {
try {
const ctx = new (window.AudioContext || window.webkitAudioContext)();
const osc = ctx.createOscillator();
const gain = ctx.createGain();
osc.connect(gain);
gain.connect(ctx.destination);
osc.frequency.value = 1000;
gain.gain.value = 0.2;
osc.start();
osc.stop(ctx.currentTime + 0.3);
} catch (e) {}
}

function handlePhaseChange() {
if (state.phase === ‘countdown’) {
state.phase = ‘work’;
state.timeRemaining = WORKOUT_CONFIG.workTime;
playAlert();

```
} else if (state.phase === 'work') {
    state.phase = 'rest';
    playAlert();

    if (
        state.currentExercise >= state.exercises.length - 1 &&
        (state.currentSet + 1) % 2 === 0 &&
        state.currentSet < WORKOUT_CONFIG.sets - 1
    ) {
        state.timeRemaining = WORKOUT_CONFIG.restBetweenSets;
    } else {
        state.timeRemaining = WORKOUT_CONFIG.restTime;
    }

    // FIX 1: Show the NEXT exercise in the display during rest
    renderExercise(true);
    renderUpNext();
    renderAllExercises();

} else if (state.phase === 'rest') {
    state.phase = 'work';
    playAlert();

    state.currentExercise++;

    if (state.currentExercise >= state.exercises.length) {
        state.currentExercise = 0;
        state.currentSet++;

        if (state.currentSet >= WORKOUT_CONFIG.sets) {
            completeWorkout();
            return;
        }

        // FIX 2: Use getExercisesForSet for set repeat logic
        state.exercises = getExercisesForSet(state.currentSet);
        updateSetIndicator();
    }

    state.timeRemaining = WORKOUT_CONFIG.workTime;
    // Back to current exercise display
    renderExercise(false);
    renderUpNext();
    renderAllExercises();
    saveExercises();
}

updatePhaseDisplay();
```

}

function updatePhaseDisplay() {
if (state.phase === ‘countdown’) {
timerPhase.textContent = ‘GET READY’;
timerPhase.classList.remove(‘rest’);
progressBar.classList.remove(‘rest’);
} else if (state.phase === ‘work’) {
timerPhase.textContent = ‘WORK’;
timerPhase.classList.remove(‘rest’);
progressBar.classList.remove(‘rest’);
} else if (state.phase === ‘rest’) {
timerPhase.textContent = ‘REST’;
timerPhase.classList.add(‘rest’);
progressBar.classList.add(‘rest’);
} else if (state.phase === ‘done’) {
timerPhase.textContent = ‘DONE’;
}
}

function completeWorkout() {
state.phase = ‘done’;
pauseTimer();
timerPhase.textContent = ‘DONE’;
timerTime.textContent = ‘✓’;
startBtn.textContent = ‘Complete’;
startBtn.disabled = true;
}

function prevExercise() {
if (state.phase === ‘rest’) {
if (state.currentExercise > 0) {
state.currentExercise–;
} else if (state.currentSet > 0) {
state.currentSet–;
state.exercises = getExercisesForSet(state.currentSet); // FIX 2
state.currentExercise = state.exercises.length - 1;
}

```
    state.phase = 'work';
    state.timeRemaining = WORKOUT_CONFIG.workTime;

} else if (state.phase === 'work') {
    state.phase = 'rest';
    state.timeRemaining = WORKOUT_CONFIG.restTime;
    // FIX 1: Show next exercise when jumping back into rest
    renderExercise(true);
    renderUpNext();
    renderAllExercises();
    updatePhaseDisplay();
    updateTimerDisplay();
    if (state.isRunning) { pauseTimer(); startTimer(); }
    saveExercises();
    return; // renderExercise already called above
}

if (state.isRunning) { pauseTimer(); startTimer(); }

renderExercise(false);
renderUpNext();
renderAllExercises();
updatePhaseDisplay();
updateTimerDisplay();
saveExercises();
```

}

function skipToNext() {
if (state.intervalId) {
clearInterval(state.intervalId);
state.intervalId = null;
}

```
if (state.phase === 'rest') {
    state.currentExercise++;

    if (state.currentExercise >= state.exercises.length) {
        state.currentExercise = 0;
        state.currentSet++;

        if (state.currentSet >= WORKOUT_CONFIG.sets) {
            completeWorkout();
            return;
        }

        // FIX 2: Use getExercisesForSet for set repeat logic
        state.exercises = getExercisesForSet(state.currentSet);
        updateSetIndicator();
    }

    state.phase = 'work';
    state.timeRemaining = WORKOUT_CONFIG.workTime;

    if (state.isRunning) startTimer();

    renderExercise(false);
    renderUpNext();
    renderAllExercises();

} else {
    state.phase = 'rest';

    if (
        state.currentExercise >= state.exercises.length - 1 &&
        (state.currentSet + 1) % 2 === 0 &&
        state.currentSet < WORKOUT_CONFIG.sets - 1
    ) {
        state.timeRemaining = WORKOUT_CONFIG.restBetweenSets;
    } else {
        state.timeRemaining = WORKOUT_CONFIG.restTime;
    }

    if (state.isRunning) startTimer();

    // FIX 1: Show next exercise when skipping into rest
    renderExercise(true);
    renderUpNext();
    renderAllExercises();
}

updatePhaseDisplay();
updateTimerDisplay();
saveExercises();
```

}

function resetWorkout() {
pauseTimer();
localStorage.removeItem(‘f45-workout’);
state.phase = ‘countdown’;
state.currentExercise = 0;
state.currentSet = 0;
state.timeRemaining = WORKOUT_CONFIG.countdown;
// FIX 2: Clear cache on reset so a fresh workout is generated
state.setCache = {};
state.exercises = getExercisesForSet(0);
startBtn.textContent = ‘Start Workout’;
startBtn.disabled = false;
updateTimerDisplay();
updatePhaseDisplay();
renderExercise(false);
renderUpNext();
renderAllExercises();
updateSetIndicator();
}

document.addEventListener(‘DOMContentLoaded’, init);
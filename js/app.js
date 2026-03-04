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
    phase: 'countdown',
    isRunning: false,
    currentExercise: 0,
    currentSet: 0,
    timeRemaining: WORKOUT_CONFIG.countdown,
    intervalId: null,
    exercises: [],
    exerciseLibrary: null
};

// Load exercises from JSON
async function loadExercises() {
    try {
        const response = await fetch('js/exercises.json');
        state.exerciseLibrary = await response.json();
    } catch (e) {
        console.error('Failed to load exercises:', e);
        state.exerciseLibrary = { pull: [], push: [], squat: [], hinge: [] };
    }
}

// Select exercises with rotation - different for Sets 1-2 vs 3-4
function selectRandomExercises(count, setNumber) {
    if (!state.exerciseLibrary) return [];
    
    // Different rotation for Set 1-2 vs Set 3-4
    const rotations = {
        0: ['push', 'pull', 'hinge', 'squat'],      // Set 1
        1: ['pull', 'hinge', 'squat', 'push'],      // Set 2
        2: ['squat', 'push', 'pull', 'hinge'],      // Set 3
        3: ['hinge', 'squat', 'push', 'pull']       // Set 4
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
}

// DOM Elements
const timerPhase = document.querySelector('.timer-phase');
const timerTime = document.querySelector('.timer-time');
const progressBar = document.querySelector('.progress-bar');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const exerciseNumber = document.querySelector('.exercise-number');
const exerciseName = document.querySelector('.exercise-name');
const exerciseCues = document.querySelector('.exercise-cues');
const exerciseEquip = document.querySelector('.equip-value');
const exerciseList = document.querySelector('.exercise-list');
const setIndicator = document.querySelector('.set-indicator');
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');
const allExerciseList = document.querySelector('.all-exercise-list');

// LocalStorage
function saveExercises() {
    const data = {
        exercises: state.exercises,
        currentExercise: state.currentExercise,
        currentSet: state.currentSet,
        date: new Date().toDateString()
    };
    localStorage.setItem('f45-workout', JSON.stringify(data));
}

function loadSavedExercises() {
    const saved = localStorage.getItem('f45-workout');
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
    } else {
        // Generate fresh exercises for all 4 sets (12 total)
        state.exercises = selectRandomExercises(WORKOUT_CONFIG.exercisesPerSet, state.currentSet);
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
}

function renderExercise() {
    if (state.exercises.length === 0) return;
    const exercise = state.exercises[state.currentExercise];
    exerciseNumber.textContent = 'Exercise ' + (state.currentExercise + 1);
    exerciseName.textContent = exercise.name;
    exerciseCues.textContent = exercise.cues;
    exerciseEquip.textContent = exercise.equip;
    
    exerciseName.classList.add('switch');
    setTimeout(() => exerciseName.classList.remove('switch'), 300);
}

function renderUpNext() {
    exerciseList.innerHTML = '';
    for (let i = state.currentExercise + 1; i < state.exercises.length; i++) {
        const li = document.createElement('li');
        li.className = 'exercise-item';
        li.innerHTML = '<span class="item-number">' + (i + 1) + '</span><span class="item-name">' + state.exercises[i].name + '</span>';
        exerciseList.appendChild(li);
    }
}

function renderAllExercises() {
    if (!allExerciseList) return;
    allExerciseList.innerHTML = '';
    state.exercises.forEach((exercise, i) => {
        const li = document.createElement('li');
        let classes = 'all-exercise-item';
        if (i < state.currentExercise) classes += ' done';
        if (i === state.currentExercise) classes += ' active';
        li.className = classes;
        li.innerHTML = '<span class="all-item-number">' + (i + 1) + '</span><span class="all-item-name">' + exercise.name + '</span><span class="all-item-equip">' + exercise.equip + '</span>';
        allExerciseList.appendChild(li);
    });
}

function updateSetIndicator() {
    setIndicator.textContent = 'Set ' + (state.currentSet + 1) + ' of ' + WORKOUT_CONFIG.sets;
}

function toggleTimer() {
    if (state.isRunning) pauseTimer();
    else startTimer();
}

function startTimer() {
    state.isRunning = true;
    startBtn.textContent = 'Pause';
    startBtn.classList.add('primary');
    
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
}

function pauseTimer() {
    state.isRunning = false;
    startBtn.textContent = 'Resume';
    startBtn.classList.remove('primary');
    if (state.intervalId) clearInterval(state.intervalId);
}

function updateTimerDisplay() {
    timerTime.textContent = state.timeRemaining;
    timerTime.classList.add('tick');
    setTimeout(() => timerTime.classList.remove('tick'), 100);
    
    let total;
    if (state.phase === 'countdown') total = WORKOUT_CONFIG.countdown;
    else if (state.phase === 'work') total = WORKOUT_CONFIG.workTime;
    else if (state.phase === 'rest') {
        total = state.currentExercise >= state.exercises.length - 1 && (state.currentSet + 1) % 2 === 0 && state.currentSet < WORKOUT_CONFIG.sets - 1 
            ? WORKOUT_CONFIG.restBetweenSets : WORKOUT_CONFIG.restTime;
    }
    
    const percentage = (state.timeRemaining / total) * 100;
    progressBar.style.width = percentage + '%';
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
    if (state.phase === 'countdown') {
        state.phase = 'work';
        state.timeRemaining = WORKOUT_CONFIG.workTime;
        playAlert();
    } else if (state.phase === 'work') {
        state.phase = 'rest';
        playAlert();
        
        if (state.currentExercise >= state.exercises.length - 1) {
            if ((state.currentSet + 1) % 2 === 0 && state.currentSet < WORKOUT_CONFIG.sets - 1) {
                state.timeRemaining = WORKOUT_CONFIG.restBetweenSets;
            } else {
                state.timeRemaining = WORKOUT_CONFIG.restTime;
            }
        } else {
            state.timeRemaining = WORKOUT_CONFIG.restTime;
        }
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
            
            // Generate new exercises for new set
            state.exercises = selectRandomExercises(WORKOUT_CONFIG.exercisesPerSet, state.currentSet);
            updateSetIndicator();
        }
        
        state.timeRemaining = WORKOUT_CONFIG.workTime;
        renderExercise();
        renderUpNext();
        renderAllExercises();
        saveExercises();
    }
    
    updatePhaseDisplay();
}

function updatePhaseDisplay() {
    if (state.phase === 'countdown') {
        timerPhase.textContent = 'GET READY';
        timerPhase.classList.remove('rest');
        progressBar.classList.remove('rest');
    } else if (state.phase === 'work') {
        timerPhase.textContent = 'WORK';
        timerPhase.classList.remove('rest');
        progressBar.classList.remove('rest');
    } else if (state.phase === 'rest') {
        timerPhase.textContent = 'REST';
        timerPhase.classList.add('rest');
        progressBar.classList.add('rest');
    } else if (state.phase === 'done') {
        timerPhase.textContent = 'DONE';
    }
}

function completeWorkout() {
    state.phase = 'done';
    pauseTimer();
    timerPhase.textContent = 'DONE';
    timerTime.textContent = '✓';
    startBtn.textContent = 'Complete';
    startBtn.disabled = true;
}

function prevExercise() {
    // Go back to previous exercise
    
    if (state.phase === 'rest') {
        // If in rest, go back to previous exercise (work)
        if (state.currentExercise > 0) {
            state.currentExercise--;
        } else if (state.currentSet > 0) {
            // Go to previous set
            state.currentSet--;
            state.currentExercise = state.exercises.length - 1;
        }
        
        state.phase = 'work';
        state.timeRemaining = WORKOUT_CONFIG.workTime;
        
    } else if (state.phase === 'work') {
        // If in work, go to previous exercise (rest)
        state.phase = 'rest';
        state.timeRemaining = WORKOUT_CONFIG.restTime;
    }
    
    if (state.isRunning) {
        pauseTimer();
        startTimer();
    }
    
    renderExercise();
    renderUpNext();
    renderAllExercises();
    updatePhaseDisplay();
    updateTimerDisplay();
    saveExercises();
}

function skipToNext() {
    // Clear interval first
    if (state.intervalId) {
        clearInterval(state.intervalId);
        state.intervalId = null;
    }
    
    if (state.phase === 'rest') {
        // Skip from rest to next exercise
        state.currentExercise++;
        
        if (state.currentExercise >= state.exercises.length) {
            state.currentExercise = 0;
            state.currentSet++;
            
            if (state.currentSet >= WORKOUT_CONFIG.sets) {
                completeWorkout();
                return;
            }
            
            state.exercises = selectRandomExercises(WORKOUT_CONFIG.exercisesPerSet, state.currentSet);
            updateSetIndicator();
        }
        
        state.phase = 'work';
        state.timeRemaining = WORKOUT_CONFIG.workTime;
        
        if (state.isRunning) startTimer();
        
        renderExercise();
        renderUpNext();
        renderAllExercises();
        
    } else {
        // Skip from work to rest
        state.phase = 'rest';
        
        if (state.currentExercise >= state.exercises.length - 1) {
            if ((state.currentSet + 1) % 2 === 0 && state.currentSet < WORKOUT_CONFIG.sets - 1) {
                state.timeRemaining = WORKOUT_CONFIG.restBetweenSets;
            } else {
                state.timeRemaining = WORKOUT_CONFIG.restTime;
            }
        } else {
            state.timeRemaining = WORKOUT_CONFIG.restTime;
        }
        
        if (state.isRunning) startTimer();
    }
    
    updatePhaseDisplay();
    updateTimerDisplay();
    saveExercises();
}

function resetWorkout() {
    pauseTimer();
    localStorage.removeItem('f45-workout');
    state.phase = 'countdown';
    state.currentExercise = 0;
    state.currentSet = 0;
    state.timeRemaining = WORKOUT_CONFIG.countdown;
    state.exercises = selectRandomExercises(WORKOUT_CONFIG.exercisesPerSet, 0);
    startBtn.textContent = 'Start Workout';
    startBtn.disabled = false;
    updateTimerDisplay();
    updatePhaseDisplay();
    renderExercise();
    renderUpNext();
    renderAllExercises();
    updateSetIndicator();
}

document.addEventListener('DOMContentLoaded', init);

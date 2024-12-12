// Глобальные переменные
let data = null;
let userProgress = {
    currentLesson: 0,
    currentStep: 0,
    points: 0,
    completedLessons: [],
    badges: []
};

// Инициализация приложения
async function initApp() {
    data = await loadData();
    if (!data) return;
    loadProgress();
    setupEventListeners();
    showWelcomeScreen();
}

// Загрузка данных
async function loadData() {
    try {
        const response = await fetch('data.json');
        return await response.json();
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        showError('Не удалось загрузить данные. Попробуйте обновить страницу.');
        return null;
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    document.getElementById('lessonsBtn').addEventListener('click', () => showSection('lessonsSection'));
    document.getElementById('gamesBtn').addEventListener('click', () => showSection('gamesSection'));
    document.getElementById('achievementsBtn').addEventListener('click', () => showSection('achievementsSection'));
}

// Управление прогрессом
function loadProgress() {
    const savedProgress = localStorage.getItem('userProgress');
    if (savedProgress) {
        userProgress = JSON.parse(savedProgress);
        updateProgressDisplay();
    }
}

function saveProgress() {
    localStorage.setItem('userProgress', JSON.stringify(userProgress));
    updateProgressDisplay();
}

function updateProgressDisplay() {
    const progressElement = document.getElementById('progressDisplay');
    if (progressElement) {
        progressElement.innerHTML = `
            <div class="progress-info">
                <p>Очки: ${userProgress.points} 🌟</p>
                <p>Пройдено уроков: ${userProgress.completedLessons.length}</p>
                <div class="badges">
                    ${userProgress.badges.map(badge => `<span class="badge">${badge}</span>`).join('')}
                </div>
            </div>
        `;
    }
}

// Управление разделами
function showWelcomeScreen() {
    const mainContent = document.querySelector('main');
    mainContent.innerHTML = `
        <div class="welcome-screen">
            <h1>Добро пожаловать в мир программирования! 👋</h1>
            <div class="character">
                <img src="/api/placeholder/200/200" alt="Учитель">
                <p>Привет! Я буду твоим учителем программирования!</p>
            </div>
            <button onclick="showSection('lessonsSection')" class="start-btn">
                Начать обучение
            </button>
        </div>
    `;
}

function showSection(sectionId) {
    document.querySelectorAll('section').forEach(section => {
        section.classList.add('hidden');
        section.classList.remove('active-section');
    });
    
    const section = document.getElementById(sectionId);
    section.classList.remove('hidden');
    section.classList.add('active-section');

    switch(sectionId) {
        case 'lessonsSection':
            populateLessons();
            break;
        case 'gamesSection':
            populateGames();
            break;
        case 'achievementsSection':
            populateAchievements();
            break;
    }
}

// Управление уроками
function populateLessons() {
    const lessonsContainer = document.getElementById('lessonsList');
    lessonsContainer.innerHTML = '';

    data.lessons.forEach(lesson => {
        const isCompleted = userProgress.completedLessons.includes(lesson.id);
        const lessonCard = createLessonCard(lesson, isCompleted);
        lessonsContainer.appendChild(lessonCard);
    });
}

function createLessonCard(lesson, isCompleted) {
    const card = document.createElement('div');
    card.className = `lesson-card ${isCompleted ? 'completed' : ''}`;
    card.innerHTML = `
        <div class="lesson-icon">${isCompleted ? '✅' : '📚'}</div>
        <h3>${lesson.title}</h3>
        <p>${lesson.description}</p>
        <div class="lesson-difficulty">Сложность: ${lesson.difficulty}</div>
        <button onclick="startLesson(${lesson.id})" class="start-btn">
            ${isCompleted ? 'Повторить' : 'Начать'}
        </button>
    `;
    return card;
}

// Управление играми
function populateGames() {
    const gamesContainer = document.getElementById('gamesList');
    gamesContainer.innerHTML = '';

    data.games.forEach(game => {
        const gameCard = createGameCard(game);
        gamesContainer.appendChild(gameCard);
    });
}

function createGameCard(game) {
    const card = document.createElement('div');
    card.className = 'game-card';
    card.innerHTML = `
        <div class="game-icon">🎮</div>
        <h3>${game.title}</h3>
        <p>${game.description}</p>
        <div class="game-points">Очки: ${game.points}</div>
        <button onclick="startGame(${game.id})" class="start-btn">Играть</button>
    `;
    return card;
}

// Управление достижениями
function populateAchievements() {
    const achievementsContainer = document.getElementById('achievementsList');
    achievementsContainer.innerHTML = '';

    data.achievements.forEach(achievement => {
        const achievementCard = createAchievementCard(achievement);
        achievementsContainer.appendChild(achievementCard);
    });
}

function createAchievementCard(achievement) {
    const isUnlocked = userProgress.badges.includes(achievement.badge);
    const card = document.createElement('div');
    card.className = `achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`;
    card.innerHTML = `
        <div class="achievement-icon">${isUnlocked ? achievement.icon : '🔒'}</div>
        <h3>${achievement.title}</h3>
        <p>${achievement.description}</p>
        <div class="achievement-points">Очки: ${achievement.points}</div>
    `;
    return card;
}

// Управление уроками
async function startLesson(lessonId) {
    const lesson = data.lessons.find(l => l.id === lessonId);
    if (!lesson) return;

    userProgress.currentLesson = lessonId;
    userProgress.currentStep = 0;
    saveProgress();

    showLesson(lesson);
}

function showLesson(lesson) {
    const mainContent = document.querySelector('main');
    mainContent.innerHTML = `
        <div class="lesson-container">
            <h2>${lesson.title}</h2>
            <div class="progress-bar">
                ${lesson.steps.map((_, index) => `
                    <div class="progress-step ${index <= userProgress.currentStep ? 'active' : ''}"></div>
                `).join('')}
            </div>
            <div class="step-content"></div>
            <div class="lesson-navigation">
                <button onclick="previousStep()" class="nav-btn" 
                    ${userProgress.currentStep === 0 ? 'disabled' : ''}>
                    ⬅️ Назад
                </button>
                <button onclick="nextStep()" class="nav-btn">
                    Дальше ➡️
                </button>
            </div>
        </div>
    `;

    showStep(lesson, userProgress.currentStep);
}

function showStep(lesson, stepIndex) {
    const step = lesson.steps[stepIndex];
    const stepContent = document.querySelector('.step-content');

    switch (step.type) {
        case 'explanation':
            showExplanationStep(step, stepContent);
            break;
        case 'interactive':
            showInteractiveStep(step, stepContent);
            break;
        case 'quiz':
            showQuizStep(step, stepContent);
            break;
        case 'code':
            showCodeStep(step, stepContent);
            break;
    }
}

// Шаги урока
function showExplanationStep(step, container) {
    container.innerHTML = `
        <div class="explanation">
            <img src="${step.image}" alt="Иллюстрация" class="step-image">
            <p>${step.content}</p>
            <button onclick="nextStep()" class="continue-btn">Понятно!</button>
        </div>
    `;
}

function showInteractiveStep(step, container) {
    container.innerHTML = `
        <div class="interactive-task">
            <p>${step.content}</p>
            ${createInteractiveElement(step.task)}
            <button onclick="checkAnswer()" class="check-btn">Проверить</button>
        </div>
    `;
    initializeInteractiveTask(step.task);
}

function showQuizStep(step, container) {
    container.innerHTML = `
        <div class="quiz">
            <p class="question">${step.question}</p>
            <div class="options">
                ${step.options.map((option, index) => `
                    <label class="option">
                        <input type="radio" name="quiz" value="${index}">
                        ${option}
                    </label>
                `).join('')}
            </div>
            <button onclick="checkQuizAnswer(${step.correct})" class="check-btn">
                Проверить
            </button>
        </div>
    `;
}

function showCodeStep(step, container) {
    container.innerHTML = `
        <div class="code-task">
            <p>${step.content}</p>
            <div class="code-editor">
                <div class="editor-toolbar">
                    <button onclick="runCode()" class="run-btn">▶ Запустить</button>
                    <button onclick="resetCode()" class="reset-btn">↺ Сбросить</button>
                </div>
                <textarea class="code-input" spellcheck="false">${step.template || ''}</textarea>
                <div class="output-area">
                    <h4>Вывод программы:</h4>
                    <pre class="code-output"></pre>
                </div>
            </div>
            <div class="test-cases">
                <h4>Тестовые случаи:</h4>
                ${step.test_cases.map(test => `
                    <div class="test-case">
                        <div>Ввод: <code>${test.input}</code></div>
                        <div>Ожидаемый вывод: <code>${test.output}</code></div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Интерактивные элементы
function createInteractiveElement(task) {
    switch (task.type) {
        case 'sequence':
            return createSequenceTask(task);
        case 'matching':
            return createMatchingTask(task);
        case 'condition':
            return createConditionTask(task);
        default:
            return '<p>Неизвестный тип задания</p>';
    }
}

function createSequenceTask(task) {
    const blocks = shuffleArray([...task.options]);
    return `
        <div class="sequence-container">
            <div class="blocks-available">
                ${blocks.map(block => `
                    <div class="sequence-item" draggable="true" data-value="${block}">
                        ${block}
                    </div>
                `).join('')}
            </div>
            <div class="sequence-solution">
                <p>Перетащи блоки сюда:</p>
                <div class="drop-zone"></div>
            </div>
        </div>
    `;
}

function createMatchingTask(task) {
    const boxes = shuffleArray([...task.pairs]);
    const values = shuffleArray(task.pairs.map(p => p.value));
    return `
        <div class="matching-container">
            <div class="boxes-container">
                ${boxes.map(pair => `
                    <div class="matching-box" data-value="${pair.box}">
                        ${pair.box}
                    </div>
                `).join('')}
            </div>
            <div class="values-container">
                ${values.map(value => `
                    <div class="matching-value" draggable="true" data-value="${value}">
                        ${value}
                    </div>
                `).join('')}
            </div>
            <div class="matching-pairs"></div>
        </div>
    `;
}

function createConditionTask(task) {
    return `
        <div class="condition-container">
            ${task.scenarios.map(scenario => `
                <div class="scenario">
                    <p>Если ${scenario.situation}:</p>
                    <select class="condition-answer" data-situation="${scenario.situation}">
                        <option value="">Выбери действие...</option>
                        ${task.options.map(option => `
                            <option value="${option}">${option}</option>
                        `).join('')}
                    </select>
                </div>
            `).join('')}
        </div>
    `;
}

// Обработка действий пользователя
function checkAnswer() {
    const step = getCurrentStep();
    let isCorrect = false;

    switch (step.task.type) {
        case 'sequence':
            isCorrect = checkSequence();
            break;
        case 'matching':
            isCorrect = checkMatching();
            break;
        case 'condition':
            isCorrect = checkCondition();
            break;
    }

    if (isCorrect) {
        showSuccess("Правильно! 🎉");
        nextStep();
    } else {
        showError("Попробуй еще раз! 💪");
    }
}

function checkSequence() {
    const sequence = Array.from(document.querySelectorAll('.drop-zone .sequence-item'))
        .map(item => item.dataset.value);
    const step = getCurrentStep();
    return compareArrays(sequence, step.task.correct);
}

function checkMatching() {
    const matches = Array.from(document.querySelectorAll('.matching-pair'))
        .map(pair => ({
            box: pair.querySelector('.box').dataset.value,
            value: pair.querySelector('.value').dataset.value
        }));
    const step = getCurrentStep();
    return compareMatches(matches, step.task.pairs);
}

function checkCondition() {
    const answers = Array.from(document.querySelectorAll('.condition-answer'))
        .map(answer => ({
            situation: answer.dataset.situation,
            response: answer.value
        }));
    const step = getCurrentStep();
    return compareConditions(answers, step.task.scenarios);
}

// Выполнение кода
function runCode() {
    const codeInput = document.querySelector('.code-input');
    const outputArea = document.querySelector('.code-output');
    const code = codeInput.value;
    const result = evaluateCode(code);

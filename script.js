// Глобальные переменные состояния
let data = null;
let userProgress = {
    currentLesson: 0,
    currentStep: 0,
    points: 0,
    completedLessons: [],
    badges: [],
    codeSubmissions: 0
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
    document.getElementById('achievementsBtn').addEventListener('click', () => showSection('achievementsSection'));
    document.addEventListener('keydown', handleEditorKeyPress);
}

// Обработка клавиш в редакторе
function handleEditorKeyPress(e) {
    if (e.target.classList.contains('code-input')) {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = e.target.selectionStart;
            const end = e.target.selectionEnd;
            e.target.value = e.target.value.substring(0, start) + '    ' + e.target.value.substring(end);
            e.target.selectionStart = e.target.selectionEnd = start + 4;
        }
    }
}

// Работа с прогрессом
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
    checkAchievements();
}

function updateProgressDisplay() {
    const progressElement = document.getElementById('progressDisplay');
    if (progressElement) {
        progressElement.innerHTML = `
            <div class="progress-info">
                <p>Очки: ${userProgress.points} 🌟</p>
                <p>Пройдено уроков: ${userProgress.completedLessons.length}</p>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${calculateProgress()}%"></div>
                </div>
                <div class="badges">
                    ${userProgress.badges.map(badge => `
                        <span class="badge" title="Получено достижение!">${badge}</span>
                    `).join('')}
                </div>
            </div>
        `;
    }
}

function calculateProgress() {
    const totalLessons = data.lessons.length;
    return (userProgress.completedLessons.length / totalLessons) * 100;
}

// Показ экранов
function showWelcomeScreen() {
    const mainContent = document.querySelector('main');
    mainContent.innerHTML = `
        <div class="welcome-screen">
            <h1 class="welcome-title">Добро пожаловать в мир программирования! 👋</h1>
            <div class="character animated">
                <img src="/api/placeholder/200/200" alt="Учитель">
                <p class="speech-bubble">Привет! Я буду твоим учителем программирования!</p>
            </div>
            <div class="welcome-info">
                <h2>Что тебя ждёт:</h2>
                <ul>
                    <li>💡 Интересные задания</li>
                    <li>🏆 Крутые достижения</li>
                    <li>📚 Новые знания</li>
                    <li>⭐ Награды за успехи</li>
                </ul>
            </div>
            <button onclick="showSection('lessonsSection')" class="start-btn animated">
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

    if (sectionId === 'lessonsSection') {
        populateLessons();
    } else if (sectionId === 'achievementsSection') {
        populateAchievements();
    }
}

// Работа с уроками
function populateLessons() {
    const lessonsContainer = document.getElementById('lessonsList');
    lessonsContainer.innerHTML = '';

    data.lessons.forEach(lesson => {
        const isCompleted = userProgress.completedLessons.includes(lesson.id);
        const isLocked = shouldLockLesson(lesson.id);
        const lessonCard = createLessonCard(lesson, isCompleted, isLocked);
        lessonsContainer.appendChild(lessonCard);
    });
}

function shouldLockLesson(lessonId) {
    if (lessonId === 1) return false;
    return !userProgress.completedLessons.includes(lessonId - 1);
}

function createLessonCard(lesson, isCompleted, isLocked) {
    const card = document.createElement('div');
    card.className = `lesson-card ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''}`;
    
    card.innerHTML = `
        <div class="lesson-icon">
            ${isCompleted ? '✅' : isLocked ? '🔒' : '📚'}
        </div>
        <h3>${lesson.title}</h3>
        <p>${lesson.description}</p>
        <div class="lesson-difficulty">
            Сложность: ${getDifficultyStars(lesson.difficulty)}
        </div>
        <button onclick="${isLocked ? 'showLockedMessage()' : `startLesson(${lesson.id})`}" 
                class="start-btn ${isLocked ? 'locked' : ''}">
            ${isCompleted ? 'Повторить' : isLocked ? 'Заблокировано' : 'Начать'}
        </button>
    `;
    
    return card;
}

function getDifficultyStars(difficulty) {
    switch(difficulty.toLowerCase()) {
        case 'легкий': return '⭐';
        case 'средний': return '⭐⭐';
        case 'сложный': return '⭐⭐⭐';
        default: return '⭐';
    }
}

function showLockedMessage() {
    showError("Сначала пройди предыдущие уроки! 🔒");
}

// Работа с достижениями
function populateAchievements() {
    const achievementsContainer = document.getElementById('achievementsList');
    achievementsContainer.innerHTML = '';

    data.achievements.forEach(achievement => {
        const isUnlocked = userProgress.badges.includes(achievement.icon);
        const achievementCard = createAchievementCard(achievement, isUnlocked);
        achievementsContainer.appendChild(achievementCard);
    });
}

function createAchievementCard(achievement, isUnlocked) {
    const card = document.createElement('div');
    card.className = `achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`;
    
    card.innerHTML = `
        <div class="achievement-icon">
            ${isUnlocked ? achievement.icon : '?'}
        </div>
        <h3>${isUnlocked ? achievement.title : 'Скрытое достижение'}</h3>
        <p>${isUnlocked ? achievement.description : 'Продолжай обучение, чтобы открыть!'}</p>
        <div class="achievement-points">
            ${isUnlocked ? `+${achievement.points} очков` : ''}
        </div>
    `;
    
    return card;
}

// Запуск урока
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
            <div class="lesson-header">
                <h2>${lesson.title}</h2>
                <button onclick="returnToLessons()" class="back-btn">
                    ← К урокам
                </button>
            </div>
            <div class="progress-bar">
                ${lesson.steps.map((_, index) => `
                    <div class="progress-step ${index <= userProgress.currentStep ? 'active' : ''}"
                         onclick="jumpToStep(${index})"
                         title="Шаг ${index + 1}"></div>
                `).join('')}
            </div>
            <div class="step-content"></div>
            <div class="lesson-navigation">
                <button onclick="previousStep()" class="nav-btn" 
                    ${userProgress.currentStep === 0 ? 'disabled' : ''}>
                    ⬅️ Назад
                </button>
                <button onclick="nextStep()" class="nav-btn">
                    ${userProgress.currentStep === lesson.steps.length - 1 ? 'Завершить' : 'Дальше ➡️'}
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

function showExplanationStep(step, container) {
    container.innerHTML = `
        <div class="explanation animated">
            <img src="${step.image}" alt="Иллюстрация" class="step-image">
            <div class="explanation-content">
                <p>${step.content}</p>
                ${step.examples ? `
                    <div class="examples">
                        <h4>Примеры:</h4>
                        ${step.examples.map(example => `
                            <div class="example">
                                <pre>${example}</pre>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
            <button onclick="nextStep()" class="continue-btn">
                Понятно! Идём дальше
            </button>
        </div>
    `;
}

function showInteractiveStep(step, container) {
    container.innerHTML = `
        <div class="interactive-task animated">
            <div class="task-description">${step.content}</div>
            ${createInteractiveElement(step.task)}
            <div class="task-controls">
                <button onclick="checkAnswer()" class="check-btn">
                    Проверить
                </button>
                <button onclick="resetTask()" class="reset-btn">
                    Начать заново
                </button>
            </div>
        </div>
    `;
    initializeInteractiveTask(step.task);
}

function showQuizStep(step, container) {
    container.innerHTML = `
        <div class="quiz animated">
            <p class="question">${step.question}</p>
            <div class="options">
                ${step.options.map((option, index) => `
                    <label class="option">
                        <input type="radio" name="quiz" value="${index}">
                        <span class="option-text">${option}</span>
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
        <div class="code-task animated">
            <div class="task-description">
                <p>${step.content}</p>
                ${step.hints ? `
                    <div class="hints">
                        <h4>Подсказки:</h4>
                        <ul>
                            ${step.hints.map(hint => `
                                <li>${hint}</li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
            <div class="code-editor">
                <div class="editor-toolbar">
                    <button onclick="runCode()" class="run-btn">
                        ▶ Запустить
                    </button>
                    <button onclick="resetCode()" class="reset-btn">
                        ↺ Сбросить
                    </button>
                </div>
                <textarea class="code-input" spellcheck="false">${step.template || ''}</textarea>
                <div class="output-area">
                    <h4>Результат:</h4>
                    <pre class="code-output"></pre>
                </div>
            </div>
            ${step.test_cases ? `
                <div class="test-cases">
                    <h4>Тестовые случаи:</h4>
                    ${step.test_cases.map(test => `
                        <div class="test-case">
                            <div>Ввод: <code>${test.input}</code></div>
                            <div>Ожидаемый вывод: <code>${test.output}</code></div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `;
}

// Проверка ответов и навигация
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

// Проверка последовательности команд
function checkSequence() {
    const sequence = Array.from(document.querySelectorAll('.sequence-item'))
        .map(item => item.dataset.value);
    const step = getCurrentStep();
    return compareArrays(sequence, step.task.correct);
}

// Проверка сопоставления пар
function checkMatching() {
    const matches = Array.from(document.querySelectorAll('.matching-pair'))
        .map(pair => ({
            box: pair.querySelector('.box').dataset.value,
            value: pair.querySelector('.value').dataset.value
        }));
    const step = getCurrentStep();
    return compareMatches(matches, step.task.pairs);
}

// Проверка условных заданий
function checkCondition() {
    const answers = Array.from(document.querySelectorAll('.condition-answer'))
        .map(answer => ({
            situation: answer.dataset.situation,
            response: answer.value
        }));
    const step = getCurrentStep();
    return compareConditions(answers, step.task.scenarios);
}

// Проверка ответов в викторине
function checkQuizAnswer(correctIndex) {
    const selected = document.querySelector('input[name="quiz"]:checked');
    if (!selected) {
        showError("Выбери ответ!");
        return;
    }

    if (parseInt(selected.value) === correctIndex) {
        showSuccess("Правильно! 🎉");
        nextStep();
    } else {
        showError("Попробуй еще раз! 💪");
    }
}

// Выполнение кода
function runCode() {
    const codeInput = document.querySelector('.code-input');
    const outputArea = document.querySelector('.code-output');
    const code = codeInput.value;
    const step = getCurrentStep();

    try {
        const result = evaluateCode(code);
        if (result.success) {
            outputArea.innerHTML = result.output;
            outputArea.classList.remove('error');
            
            if (checkCodeResult(result, step.test_cases)) {
                userProgress.codeSubmissions++;
                showSuccess("Код работает правильно! 🎉");
                nextStep();
            } else {
                showError("Код работает не так, как ожидается. Проверь результаты!");
            }
        } else {
            outputArea.innerHTML = `Ошибка: ${result.error}`;
            outputArea.classList.add('error');
            showError("В коде есть ошибка!");
        }
    } catch (error) {
        outputArea.innerHTML = `Ошибка: ${error.message}`;
        outputArea.classList.add('error');
        showError("Произошла ошибка при выполнении кода!");
    }
}

// Сброс кода к начальному состоянию
function resetCode() {
    const step = getCurrentStep();
    const codeInput = document.querySelector('.code-input');
    const outputArea = document.querySelector('.code-output');
    
    codeInput.value = step.template || '';
    outputArea.innerHTML = '';
    outputArea.classList.remove('error');
}

// Сброс интерактивного задания
function resetTask() {
    const step = getCurrentStep();
    showInteractiveStep(step, document.querySelector('.step-content'));
}

// Навигация по шагам урока
function nextStep() {
    const lesson = getCurrentLesson();
    if (userProgress.currentStep < lesson.steps.length - 1) {
        userProgress.currentStep++;
        saveProgress();
        showLesson(lesson);
    } else {
        completeLessonAndShowReward(lesson);
    }
}

function previousStep() {
    if (userProgress.currentStep > 0) {
        userProgress.currentStep--;
        saveProgress();
        showLesson(getCurrentLesson());
    }
}

function jumpToStep(stepIndex) {
    const lesson = getCurrentLesson();
    if (stepIndex <= userProgress.currentStep) {
        userProgress.currentStep = stepIndex;
        showLesson(lesson);
    }
}

// Завершение урока
function completeLessonAndShowReward(lesson) {
    if (!userProgress.completedLessons.includes(lesson.id)) {
        userProgress.completedLessons.push(lesson.id);
        userProgress.points += lesson.reward.points;
        userProgress.badges.push(lesson.reward.badge);
        saveProgress();
    }

    showReward(lesson.reward);
}

function showReward(reward) {
    const mainContent = document.querySelector('main');
    mainContent.innerHTML = `
        <div class="reward-screen animated">
            <h2>Поздравляем! 🎉</h2>
            <div class="reward-content">
                <p>Ты заработал ${reward.points} очков!</p>
                <div class="new-badge animated">${reward.badge}</div>
                <p>Новое достижение!</p>
            </div>
            <button onclick="returnToLessons()" class="continue-btn">
                Продолжить обучение
            </button>
        </div>
    `;
}

// Вспомогательные функции
function getCurrentLesson() {
    return data.lessons.find(l => l.id === userProgress.currentLesson);
}

function getCurrentStep() {
    const lesson = getCurrentLesson();
    return lesson.steps[userProgress.currentStep];
}

function compareArrays(arr1, arr2) {
    return arr1.length === arr2.length && 
           arr1.every((item, index) => item === arr2[index]);
}

function showSuccess(message) {
    const notification = document.createElement('div');
    notification.className = 'notification success animated';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

function showError(message) {
    const notification = document.createElement('div');
    notification.className = 'notification error animated';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

function returnToLessons() {
    showSection('lessonsSection');
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', initApp);

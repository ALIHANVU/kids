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
    try {
        data = await loadData();
        if (!data) return;
        
        loadProgress();
        setupEventListeners();
        setupModalHandlers();
        showWelcomeScreen();
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        showError('Не удалось загрузить приложение');
    }
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
    const lessonsBtn = document.getElementById('lessonsBtn');
    const achievementsBtn = document.getElementById('achievementsBtn');

    if (lessonsBtn) {
        lessonsBtn.addEventListener('click', function() {
            hideAllSections();
            showLessonsSection();
        });
    }

    if (achievementsBtn) {
        achievementsBtn.addEventListener('click', function() {
            hideAllSections();
            showAchievementsSection();
        });
    }

    document.addEventListener('keydown', handleEditorKeyPress);
}

// Настройка модальных окон
function setupModalHandlers() {
    const helpBtn = document.querySelector('.help-btn');
    const aboutBtn = document.querySelector('.about-btn');

    if (helpBtn) {
        helpBtn.addEventListener('click', () => showModal('helpModal'));
    }
    if (aboutBtn) {
        aboutBtn.addEventListener('click', () => showModal('aboutModal'));
    }

    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.closest('.modal').id;
            closeModal(modalId);
        });
    });

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
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

// Проверка достижений
function checkAchievements() {
    data.achievements.forEach(achievement => {
        if (!userProgress.badges.includes(achievement.icon)) {
            let achieved = false;
            
            switch (achievement.condition) {
                case 'complete_lesson_1':
                    achieved = userProgress.completedLessons.includes(1);
                    break;
                case 'complete_lessons_3':
                    achieved = userProgress.completedLessons.length >= 3;
                    break;
                case 'write_5_programs':
                    achieved = userProgress.codeSubmissions >= 5;
                    break;
            }
            
            if (achieved) {
                userProgress.badges.push(achievement.icon);
                userProgress.points += achievement.points;
                showAchievementNotification(achievement);
            }
        }
    });
}

function showLessonsSection() {
    // Скрываем все секции
    hideAllSections();
    
    // Показываем секцию уроков
    const lessonsSection = document.getElementById('lessonsSection');
    if (lessonsSection) {
        lessonsSection.classList.remove('hidden');
        lessonsSection.classList.add('active-section');
        
        // Заполняем секцию уроками
        populateLessons();
    }
}

function showAchievementsSection() {
    // Скрываем все секции
    hideAllSections();
    
    // Показываем секцию достижений
    const achievementsSection = document.getElementById('achievementsSection');
    if (achievementsSection) {
        achievementsSection.classList.remove('hidden');
        achievementsSection.classList.add('active-section');
        
        // Заполняем секцию достижениями
        populateAchievements();
    }
}

// Обновите функцию setupEventListeners
function setupEventListeners() {
    const lessonsBtn = document.getElementById('lessonsBtn');
    const achievementsBtn = document.getElementById('achievementsBtn');

    if (lessonsBtn) {
        lessonsBtn.addEventListener('click', showLessonsSection);
    }

    if (achievementsBtn) {
        achievementsBtn.addEventListener('click', showAchievementsSection);
    }

    document.addEventListener('keydown', handleEditorKeyPress);
}
// Показ достижения
function showAchievementNotification(achievement) {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification animated';
    notification.innerHTML = `
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-info">
            <h3>Новое достижение!</h3>
            <p>${achievement.title}</p>
            <p>+${achievement.points} очков</p>
        </div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
}

// Управление секциями
function hideAllSections() {
    document.querySelectorAll('section').forEach(section => {
        section.classList.add('hidden');
        section.classList.remove('active-section');
    });
}

function showSection(sectionId) {
    hideAllSections();
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.remove('hidden');
        section.classList.add('active-section');
    }
}

// Модальные окна
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Работа с уроками
function showWelcomeScreen() {
    const mainContent = document.querySelector('main');
    mainContent.innerHTML = `
        <div class="welcome-screen">
            <h1 class="welcome-title">Добро пожаловать в мир программирования! 👋</h1>
            <div class="character animated">
                <svg width="200" height="200" viewBox="0 0 200 200">
                    <circle cx="100" cy="80" r="50" fill="#FFD93D"/>
                    <circle cx="80" cy="70" r="5" fill="#333"/>
                    <circle cx="120" cy="70" r="5" fill="#333"/>
                    <path d="M 70 100 Q 100 130 130 100" stroke="#333" stroke-width="3" fill="none"/>
                </svg>
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
            <button class="start-btn animated">Начать обучение</button>
        </div>
    `;

    const startBtn = mainContent.querySelector('.start-btn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            hideAllSections();
            showLessonsSection();
        });
    }
}

function populateLessons() {
    const lessonsContainer = document.getElementById('lessonsList');
    if (!lessonsContainer) return;

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
        <button class="start-btn ${isLocked ? 'locked' : ''}">
            ${isCompleted ? 'Повторить' : isLocked ? 'Заблокировано' : 'Начать'}
        </button>
    `;

    const startBtn = card.querySelector('.start-btn');
    startBtn.addEventListener('click', () => {
        if (isLocked) {
            showLockedMessage();
        } else {
            startLesson(lesson.id);
        }
    });
    
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
                <button class="back-btn">← К урокам</button>
            </div>
            <div class="step-container">
                <div class="step-progress">
                    ${lesson.steps.map((_, index) => `
                        <div class="step-dot ${index <= userProgress.currentStep ? 'active' : ''}"
                             onclick="jumpToStep(${index})"
                             title="Шаг ${index + 1}"></div>
                    `).join('')}
                </div>
                <div class="step-content"></div>
                <div class="step-navigation">
                    <button class="prev-btn" ${userProgress.currentStep === 0 ? 'disabled' : ''}>
                        ⬅️ Назад
                    </button>
                    <button class="next-btn">
                        ${userProgress.currentStep === lesson.steps.length - 1 ? 'Завершить' : 'Вперёд ➡️'}
                    </button>
                </div>
            </div>
        </div>
    `;

    // Добавляем обработчики
    const backBtn = mainContent.querySelector('.back-btn');
    const prevBtn = mainContent.querySelector('.prev-btn');
    const nextBtn = mainContent.querySelector('.next-btn');

    backBtn.addEventListener('click', returnToLessons);
    prevBtn.addEventListener('click', previousStep);
    nextBtn.addEventListener('click', nextStep);

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
            <div class="explanation-content">
                <p>${step.content}</p>
                ${step.examples ? `
                    <div class="examples">
                        ${step.examples.map(example => `
                            <div class="example">
                                <pre>${example}</pre>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
            <button class="continue-btn">Понятно! Идём дальше</button>
        </div>
    `;

    container.querySelector('.continue-btn').addEventListener('click', nextStep);
}

function showInteractiveStep(step, container) {
    container.innerHTML = `
        <div class="interactive-task animated">
            <div class="task-description">${step.content}</div>
            ${createInteractiveElement(step.task)}
            <div class="task-controls">
                <button class="check-btn">Проверить</button>
                <button class="reset-btn">Начать заново</button>
            </div>
        </div>
    `;

    container.querySelector('.check-btn').addEventListener('click', checkAnswer);
    container.querySelector('.reset-btn').addEventListener('click', resetTask);
    
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
            <button class="check-btn">Проверить</button>
        </div>
    `;

    container.querySelector('.check-btn').addEventListener('click', () => checkQuizAnswer(step.correct));
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
                            ${step.hints.map(hint => `<li>${hint}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
            <div class="code-editor">
                <div class="editor-toolbar">
                    <button class="run-btn">▶ Запустить</button>
                    <button class="reset-btn">↺ Сбросить</button>
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

    const runBtn = container.querySelector('.run-btn');
    const resetBtn = container.querySelector('.reset-btn');

    runBtn.addEventListener('click', runCode);
    resetBtn.addEventListener('click', resetCode);
    initializeCodeEditor(container.querySelector('.code-input'));
}

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

function initializeInteractiveTask(task) {
    switch (task.type) {
        case 'sequence':
            initDragAndDrop();
            break;
        case 'matching':
            initMatchingDragAndDrop();
            break;
    }
}

function initDragAndDrop() {
    const items = document.querySelectorAll('.sequence-item');
    const dropZone = document.querySelector('.drop-zone');

    items.forEach(item => {
        item.addEventListener('dragstart', dragStart);
        item.addEventListener('dragend', dragEnd);
    });

    dropZone.addEventListener('dragover', dragOver);
    dropZone.addEventListener('drop', drop);
}

function dragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.value);
    e.target.classList.add('dragging');
}

function dragEnd(e) {
    e.target.classList.remove('dragging');
}

function dragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function drop(e) {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
    const item = document.createElement('div');
    item.className = 'sequence-item';
    item.dataset.value = data;
    item.textContent = data;
    item.draggable = true;
    
    item.addEventListener('dragstart', dragStart);
    item.addEventListener('dragend', dragEnd);
    
    e.target.appendChild(item);
}

// Проверка ответов
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

function checkSequence() {
    const sequence = Array.from(document.querySelectorAll('.sequence-item'))
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

// Работа с кодом
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

function evaluateCode(code) {
    try {
        const sandbox = {
            print: (text) => sandbox.output.push(text),
            output: [],
            console: {
                log: (text) => sandbox.output.push(text)
            }
        };

        const wrappedCode = `
            ${code}
            return output;
        `;

        const fn = new Function('print', 'output', 'console', wrappedCode);
        const result = fn.call(sandbox, sandbox.print, sandbox.output, sandbox.console);
        
        return {
            success: true,
            output: sandbox.output.join('\n')
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

function resetCode() {
    const step = getCurrentStep();
    const codeInput = document.querySelector('.code-input');
    const outputArea = document.querySelector('.code-output');
    
    codeInput.value = step.template || '';
    outputArea.innerHTML = '';
    outputArea.classList.remove('error');
}

// Навигация
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

// Вспомогательные функции
function getCurrentLesson() {
    return data.lessons.find(l => l.id === userProgress.currentLesson);
}

function getCurrentStep() {
    const lesson = getCurrentLesson();
    return lesson.steps[userProgress.currentStep];
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

function showLockedMessage() {
    showError("Сначала пройди предыдущие уроки! 🔒");
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function compareArrays(arr1, arr2) {
    return arr1.length === arr2.length && 
           arr1.every((item, index) => item === arr2[index]);
}

function compareMatches(userMatches, correctPairs) {
    return correctPairs.every(pair => {
        const userMatch = userMatches.find(m => m.box === pair.box);
        return userMatch && userMatch.value === pair.value;
    });
}

function compareConditions(userAnswers, correctScenarios) {
    return correctScenarios.every(scenario => {
        const userAnswer = userAnswers.find(a => a.situation === scenario.situation);
        return userAnswer && userAnswer.response === scenario.correct;
    });
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', initApp);

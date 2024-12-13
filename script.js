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

// Управление секциями
function hideAllSections() {
    document.querySelectorAll('section').forEach(section => {
        section.classList.add('hidden');
        section.classList.remove('active-section');
    });
}

function showLessonsSection() {
    hideAllSections();
    const lessonsSection = document.getElementById('lessonsSection');
    if (lessonsSection) {
        lessonsSection.classList.remove('hidden');
        lessonsSection.classList.add('active-section');
        populateLessons();
    }
}

function showAchievementsSection() {
    hideAllSections();
    const achievementsSection = document.getElementById('achievementsSection');
    if (achievementsSection) {
        achievementsSection.classList.remove('hidden');
        achievementsSection.classList.add('active-section');
        populateAchievements();
    }
}

// Настройка обработчиков событий
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

// Показ/скрытие модальных окон
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
        startBtn.addEventListener('click', showLessonsSection);
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

function populateAchievements() {
    const achievementsContainer = document.getElementById('achievementsList');
    if (!achievementsContainer) return;

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
        <div class="achievement-content">
            <h3>${isUnlocked ? achievement.title : 'Скрытое достижение'}</h3>
            <p>${isUnlocked ? achievement.description : 'Продолжай обучение, чтобы открыть!'}</p>
            <div class="achievement-points">
                ${isUnlocked ? `+${achievement.points} очков` : ''}
            </div>
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

    const continueBtn = container.querySelector('.continue-btn');
    if (continueBtn) {
        continueBtn.addEventListener('click', nextStep);
    }
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

    const checkBtn = container.querySelector('.check-btn');
    const resetBtn = container.querySelector('.reset-btn');

    if (checkBtn) {
        checkBtn.addEventListener('click', () => checkAnswer(step));
    }
    if (resetBtn) {
        resetBtn.addEventListener('click', () => resetTask(step));
    }

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

    const checkBtn = container.querySelector('.check-btn');
    if (checkBtn) {
        checkBtn.addEventListener('click', () => checkQuizAnswer(step.correct));
    }
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
    
    if (runBtn) {
        runBtn.addEventListener('click', () => runCode(step));
    }
    if (resetBtn) {
        resetBtn.addEventListener('click', () => resetCode(step));
    }

    // Инициализация редактора кода
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

    if (dropZone) {
        dropZone.addEventListener('dragover', dragOver);
        dropZone.addEventListener('drop', drop);
    }
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
    
    // Добавляем те же обработчики для возможности перемещения
    item.addEventListener('dragstart', dragStart);
    item.addEventListener('dragend', dragEnd);
    
    const dropZone = e.target.closest('.drop-zone') || e.target;
    dropZone.appendChild(item);
}

function returnToLessons() {
    showLessonsSection();
}

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

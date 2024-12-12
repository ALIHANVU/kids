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

    // Добавляем обработчики для модальных окон
    document.querySelectorAll('.modal .close-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const modalId = this.closest('.modal').id;
            closeModal(modalId);
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

// Управление секциями
function hideAllSections() {
    document.querySelectorAll('section').forEach(section => {
        section.classList.add('hidden');
        section.classList.remove('active-section');
    });
}

function showLessonsSection() {
    const lessonsSection = document.getElementById('lessonsSection');
    if (lessonsSection) {
        lessonsSection.classList.remove('hidden');
        lessonsSection.classList.add('active-section');
        populateLessons();
    }
}

function showAchievementsSection() {
    const achievementsSection = document.getElementById('achievementsSection');
    if (achievementsSection) {
        achievementsSection.classList.remove('hidden');
        achievementsSection.classList.add('active-section');
        populateAchievements();
    }
}

// Работа с уроками
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
            <button class="start-btn animated">Начать обучение</button>
        </div>
    `;

    // Добавляем обработчик для кнопки начала обучения
    const startBtn = mainContent.querySelector('.start-btn');
    if (startBtn) {
        startBtn.addEventListener('click', function() {
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

// Достижения
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

// Вспомогательные функции
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

// Запуск приложения
document.addEventListener('DOMContentLoaded', initApp);

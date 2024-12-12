// Загрузка данных из JSON
async function loadData() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        return null;
    }
}

// Инициализация приложения
async function initApp() {
    const data = await loadData();
    if (!data) return;

    // Обработчики кнопок навигации
    document.getElementById('lessonsBtn').addEventListener('click', () => showSection('lessonsSection'));
    document.getElementById('gamesBtn').addEventListener('click', () => showSection('gamesSection'));
    document.getElementById('achievementsBtn').addEventListener('click', () => showSection('achievementsSection'));

    // Заполнение секций данными
    populateLessons(data.lessons);
    populateGames(data.games);
    populateAchievements(data.achievements);
}

// Показать выбранную секцию
function showSection(sectionId) {
    document.querySelectorAll('section').forEach(section => {
        section.classList.add('hidden');
        section.classList.remove('active-section');
    });
    document.getElementById(sectionId).classList.remove('hidden');
    document.getElementById(sectionId).classList.add('active-section');
}

// Заполнение уроков
function populateLessons(lessons) {
    const lessonsContainer = document.getElementById('lessonsList');
    lessons.forEach(lesson => {
        const lessonCard = document.createElement('div');
        lessonCard.className = 'lesson-card';
        lessonCard.innerHTML = `
            <h3>${lesson.title}</h3>
            <p>${lesson.description}</p>
            <div>Сложность: ${lesson.difficulty}</div>
        `;
        lessonCard.addEventListener('click', () => startLesson(lesson));
        lessonsContainer.appendChild(lessonCard);
    });
}

// Заполнение игр
function populateGames(games) {
    const gamesContainer = document.getElementById('gamesList');
    games.forEach(game => {
        const gameCard = document.createElement('div');
        gameCard.className = 'game-card';
        gameCard.innerHTML = `
            <h3>${game.title}</h3>
            <p>${game.description}</p>
            <div>Очки: ${game.points}</div>
        `;
        gameCard.addEventListener('click', () => startGame(game));
        gamesContainer.appendChild(gameCard);
    });
}

// Заполнение достижений
function populateAchievements(achievements) {
    const achievementsContainer = document.getElementById('achievementsList');
    achievements.forEach(achievement => {
        const achievementCard = document.createElement('div');
        achievementCard.className = 'achievement-card';
        achievementCard.innerHTML = `
            <h3>${achievement.title}</h3>
            <p>${achievement.description}</p>
            <div>Прогресс: ${achievement.progress}%</div>
        `;
        achievementsContainer.appendChild(achievementCard);
    });
}

// Запуск урока
function startLesson(lesson) {
    alert(`Начинаем урок: ${lesson.title}`);
    // Здесь будет логика запуска урока
}

// Запуск игры
function startGame(game) {
    alert(`Запускаем игру: ${game.title}`);
    // Здесь будет логика запуска игры
}

// Запуск приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', initApp);

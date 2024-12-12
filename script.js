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
            <button onclick="startLesson(${lesson.id})" class="start-btn">Начать урок</button>
        `;
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
            <button onclick="startGame(${game.id})" class="start-btn">Играть</button>
        `;
        gamesContainer.appendChild(gameCard);
    });
}

// Обработка задач
function checkTask(taskId, userAnswer) {
    const tasks = JSON.parse(localStorage.getItem('currentTasks') || '[]');
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) return false;

    let isCorrect = false;
    switch (task.type) {
        case 'sequence':
            isCorrect = userAnswer.join(',') === task.correctAnswer.join(',');
            break;
        case 'quiz':
            isCorrect = userAnswer === task.correctAnswer;
            break;
        case 'code':
            isCorrect = evaluateCode(userAnswer, task.tests);
            break;
    }

    if (isCorrect) {
        updateAchievements(task.points);
        showSuccess('Правильно! Молодец! 🎉');
    } else {
        showError('Попробуй еще раз! 💪');
    }

    return isCorrect;
}

// Запуск урока
async function startLesson(lessonId) {
    const data = await loadData();
    const lesson = data.lessons.find(l => l.id === lessonId);
    
    if (!lesson) return;

    const lessonContainer = document.createElement('div');
    lessonContainer.className = 'lesson-content';
    lessonContainer.innerHTML = `
        <h2>${lesson.title}</h2>
        <div class="lesson-explanation">${lesson.explanation}</div>
        <div class="task-container"></div>
    `;

    // Создаем интерфейс в зависимости от типа задачи
    const taskContainer = lessonContainer.querySelector('.task-container');
    
    switch (lesson.taskType) {
        case 'sequence':
            createSequenceTask(taskContainer, lesson.task);
            break;
        case 'quiz':
            createQuizTask(taskContainer, lesson.task);
            break;
        case 'code':
            createCodeTask(taskContainer, lesson.task);
            break;
    }

    // Показываем урок
    const mainSection = document.querySelector('main');
    mainSection.innerHTML = '';
    mainSection.appendChild(lessonContainer);
}

// Создание задачи на последовательность
function createSequenceTask(container, task) {
    const blocks = task.blocks.sort(() => Math.random() - 0.5);
    
    container.innerHTML = `
        <div class="task-description">${task.description}</div>
        <div class="blocks-container">
            ${blocks.map(block => `
                <div class="code-block" draggable="true" data-block="${block}">
                    ${block}
                </div>
            `).join('')}
        </div>
        <div class="solution-container"></div>
        <button onclick="checkSequenceTask()" class="check-btn">Проверить</button>
    `;

    // Добавляем функционал drag and drop
    setupDragAndDrop(container);
}

// Создание задачи-викторины
function createQuizTask(container, task) {
    container.innerHTML = `
        <div class="task-description">${task.question}</div>
        <div class="options-container">
            ${task.options.map((option, index) => `
                <label class="quiz-option">
                    <input type="radio" name="quiz" value="${index}">
                    ${option}
                </label>
            `).join('')}
        </div>
        <button onclick="checkQuizTask()" class="check-btn">Проверить</button>
    `;
}

// Создание задачи на программирование
function createCodeTask(container, task) {
    container.innerHTML = `
        <div class="task-description">${task.description}</div>
        <div class="code-editor">
            <textarea class="code-input" placeholder="Напиши свой код здесь...">${task.template || ''}</textarea>
        </div>
        <div class="test-cases">
            <h4>Примеры:</h4>
            ${task.examples.map(example => `
                <div class="example">
                    <div>Ввод: ${example.input}</div>
                    <div>Вывод: ${example.output}</div>
                </div>
            `).join('')}
        </div>
        <button onclick="checkCodeTask()" class="check-btn">Запустить</button>
    `;
}

// Функции проверки задач
function checkSequenceTask() {
    const blocks = Array.from(document.querySelectorAll('.solution-container .code-block'))
        .map(block => block.dataset.block);
    return checkTask(getCurrentTaskId(), blocks);
}

function checkQuizTask() {
    const selected = document.querySelector('input[name="quiz"]:checked');
    if (!selected) {
        showError('Выбери ответ!');
        return;
    }
    return checkTask(getCurrentTaskId(), parseInt(selected.value));
}

function checkCodeTask() {
    const code = document.querySelector('.code-input').value;
    return checkTask(getCurrentTaskId(), code);
}

// Вспомогательные функции
function showSuccess(message) {
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

function showError(message) {
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

function updateAchievements(points) {
    let achievements = JSON.parse(localStorage.getItem('achievements') || '[]');
    achievements.push({
        points: points,
        timestamp: Date.now()
    });
    localStorage.setItem('achievements', JSON.stringify(achievements));
    updateAchievementsDisplay();
}

// Запуск приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', initApp);

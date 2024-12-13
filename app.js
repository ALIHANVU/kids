// Глобальное состояние приложения
const App = {
    state: {
        lessons: null,
        currentLesson: 1,
        loading: true,
        progress: []
    },

    // Инициализация приложения
    async init() {
        try {
            // Загружаем сохраненный прогресс
            this.loadProgress();
            
            // Загружаем уроки
            await this.loadLessons();
            
            // Инициализируем интерфейс
            this.initUI();
            
            // Скрываем экран загрузки
            this.hideLoading();
            
        } catch (error) {
            this.handleError('Ошибка инициализации приложения', error);
        }
    },

    // Загрузка уроков
    async loadLessons() {
        try {
            const response = await fetch('data/lessons.json');
            if (!response.ok) throw new Error('Ошибка загрузки уроков');
            
            const data = await response.json();
            this.state.lessons = data.lessons;
            
            return data.lessons;
        } catch (error) {
            this.handleError('Не удалось загрузить уроки', error);
        }
    },

    // Инициализация интерфейса
    initUI() {
        // Показываем приложение
        document.querySelector('.app-container').style.display = 'block';
        
        // Создаем навигацию
        this.createNavigation();
        
        // Загружаем первый урок
        this.loadLesson(this.state.currentLesson);
        
        // Обновляем прогресс
        this.updateProgress();
    },

    // Создание навигации
    createNavigation() {
        const nav = document.getElementById('lesson-nav');
        if (!nav || !this.state.lessons) return;

        nav.innerHTML = this.state.lessons.map(lesson => `
            <button class="nav-button" data-lesson="${lesson.id}">
                Урок ${lesson.id}
            </button>
        `).join('');

        nav.addEventListener('click', e => {
            if (e.target.matches('.nav-button')) {
                this.loadLesson(parseInt(e.target.dataset.lesson));
            }
        });
    },

    // Загрузка урока
    loadLesson(lessonId) {
        const lesson = this.state.lessons.find(l => l.id === lessonId);
        if (!lesson) {
            this.showNotification('Урок не найден', 'error');
            return;
        }

        this.state.currentLesson = lessonId;
        this.displayLesson(lesson);
    },

    // Отображение урока
    displayLesson(lesson) {
        const content = document.getElementById('content');
        if (!content) return;

        // Очищаем контент
        content.innerHTML = '';

        // Создаем контейнер урока
        const lessonContent = document.createElement('div');
        lessonContent.className = 'lesson';

        // Добавляем содержимое в зависимости от типа урока
        switch (lesson.type) {
            case 'theory':
                lessonContent.innerHTML = lesson.content;
                break;
            case 'quiz':
                this.createQuiz(lessonContent, lesson);
                break;
            case 'coding':
                this.createCodingTask(lessonContent, lesson);
                break;
        }

        content.appendChild(lessonContent);
    },

    // Сохранение прогресса
    saveProgress() {
        try {
            localStorage.setItem('progress', JSON.stringify(this.state.progress));
        } catch (error) {
            console.warn('Не удалось сохранить прогресс', error);
        }
    },

    // Загрузка прогресса
    loadProgress() {
        try {
            const saved = localStorage.getItem('progress');
            if (saved) {
                this.state.progress = JSON.parse(saved);
            }
        } catch (error) {
            console.warn('Не удалось загрузить прогресс', error);
        }
    },

    // Обновление прогресса
    updateProgress() {
        const progressBar = document.querySelector('.progress');
        if (!progressBar || !this.state.lessons) return;

        const progress = (this.state.progress.length / this.state.lessons.length) * 100;
        progressBar.style.width = `${progress}%`;
    },

    // Показ уведомлений
    showNotification(message, type = 'info') {
        const container = document.getElementById('notifications');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        container.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    },

    // Обработка ошибок
    handleError(message, error) {
        console.error(message, error);
        this.showNotification(message, 'error');
        this.hideLoading();
    },

    // Скрытие экрана загрузки
    hideLoading() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 300);
        }
    }
};

// Запуск приложения
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
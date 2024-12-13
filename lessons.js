// Модуль для работы с уроками
const LessonsModule = {
    // Создание теста
    createQuiz(container, lesson) {
        container.innerHTML = `
            <div class="quiz">
                <h2>${lesson.title}</h2>
                <div class="questions">
                    ${lesson.questions.map((q, index) => `
                        <div class="question" data-question="${index}">
                            <p>${q.question}</p>
                            <div class="options">
                                ${q.options.map((option, optIndex) => `
                                    <label class="option">
                                        <input type="checkbox" name="q${index}" value="${optIndex}">
                                        <span>${option}</span>
                                    </label>
                                `).join('')}
                            </div>
                            <div class="feedback"></div>
                        </div>
                    `).join('')}
                </div>
                <button class="submit-button" onclick="LessonsModule.checkQuiz(${lesson.id})">
                    Проверить
                </button>
            </div>
        `;
    },

    // Проверка ответов теста
    checkQuiz(lessonId) {
        const lesson = App.state.lessons.find(l => l.id === lessonId);
        if (!lesson) return;

        let correct = 0;
        const questions = document.querySelectorAll('.question');

        questions.forEach((questionEl, index) => {
            const question = lesson.questions[index];
            const selectedAnswers = Array.from(questionEl.querySelectorAll('input:checked'))
                .map(input => parseInt(input.value))
                .sort();
            
            const correctAnswers = [...question.correctAnswers].sort();
            const isCorrect = this.arraysEqual(selectedAnswers, correctAnswers);

            const feedback = questionEl.querySelector('.feedback');
            questionEl.classList.remove('correct', 'incorrect');
            questionEl.classList.add(isCorrect ? 'correct' : 'incorrect');

            feedback.innerHTML = isCorrect 
                ? '<span class="success">✓ Правильно!</span>'
                : `<span class="error">✗ Попробуй ещё раз</span>
                   <p class="hint">${question.explanation}</p>`;

            if (isCorrect) correct++;
        });

        if (correct === lesson.questions.length) {
            this.completeLesson(lessonId);
        }
    },

    // Создание задания по программированию
    createCodingTask(container, lesson) {
        container.innerHTML = `
            <div class="coding-task">
                <h2>${lesson.title}</h2>
                <p class="task-description">${lesson.description}</p>
                <div class="editor-container">
                    <div class="editor-buttons">
                        <button onclick="EditorModule.resetCode()">↺ Сбросить</button>
                        <button onclick="EditorModule.showHint('${lesson.hint}')">💡 Подсказка</button>
                    </div>
                    <div class="editor">
                        <div class="line-numbers"></div>
                        <textarea id="code-editor" spellcheck="false">${lesson.startingCode || ''}</textarea>
                    </div>
                    <button onclick="EditorModule.runCode()" class="run-button">▶ Запустить</button>
                </div>
                <div id="output" class="output"></div>
            </div>
        `;

        EditorModule.init();
    },

    // Завершение урока
    completeLesson(lessonId) {
        if (!App.state.progress.includes(lessonId)) {
            App.state.progress.push(lessonId);
            App.saveProgress();
            App.updateProgress();
            App.showNotification('Урок пройден! 🎉', 'success');
        }

        // Показываем кнопку следующего урока
        const nextButton = document.createElement('button');
        nextButton.className = 'next-lesson-button';
        nextButton.textContent = 'Следующий урок →';
        nextButton.onclick = () => App.loadLesson(lessonId + 1);

        const container = document.querySelector('.quiz, .coding-task');
        if (container && !container.querySelector('.next-lesson-button')) {
            container.appendChild(nextButton);
        }
    },

    // Вспомогательные функции
    arraysEqual(arr1, arr2) {
        if (arr1.length !== arr2.length) return false;
        return arr1.every((val, idx) => val === arr2[idx]);
    }
};

// Добавляем модуль в глобальную область видимости
window.LessonsModule = LessonsModule;
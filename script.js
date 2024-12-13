// Глобальные переменные
let lessons = null;
let currentLessonId = 1;

// Загрузка и отображение урока
function loadLesson(lessonNumber) {
    fetch('lessons.json')
        .then(response => response.json())
        .then(data => {
            lessons = data.lessons;
            const lesson = lessons.find(l => l.id === lessonNumber);
            if (lesson) {
                displayLesson(lesson);
                currentLessonId = lessonNumber;
                updateProgress(lessonNumber);
            } else {
                showError('Урок не найден');
            }
        })
        .catch(error => showError('Ошибка загрузки урока'));
}

// Отображение урока в зависимости от типа
function displayLesson(lesson) {
    const content = document.getElementById('content');
    
    switch(lesson.type) {
        case 'theory':
            content.innerHTML = `
                <div class="lesson">
                    <h2>${lesson.title}</h2>
                    ${lesson.content}
                </div>
            `;
            break;
            
        case 'quiz':
            let quizHTML = `
                <div class="lesson">
                    <h2>${lesson.title}</h2>
                    <div class="quiz">
                        ${lesson.questions.map((q, index) => `
                            <div class="quiz-question" id="question-${index}">
                                <p>${q.question}</p>
                                ${q.options.map((option, optIndex) => `
                                    <label class="quiz-option">
                                        <input type="checkbox" name="q${index}" value="${optIndex}">
                                        ${option}
                                    </label>
                                `).join('<br>')}
                                <div class="feedback" id="feedback-${index}"></div>
                            </div>
                        `).join('')}
                        <button onclick="checkQuiz(${lesson.id})" class="check-button">Проверить ответы</button>
                    </div>
                </div>
            `;
            content.innerHTML = quizHTML;
            break;
            
        case 'coding':
            content.innerHTML = `
                <div class="lesson">
                    <h2>${lesson.title}</h2>
                    <p class="task-description">${lesson.description}</p>
                    <div class="coding-area">
                        <div class="editor-toolbar">
                            <button onclick="resetCode()" class="toolbar-button">🔄 Сбросить</button>
                            <button onclick="showHint()" class="toolbar-button">💡 Подсказка</button>
                        </div>
                        <textarea id="code-editor" class="code-editor" 
                            placeholder="Напиши свой код здесь..."
                            spellcheck="false">${lesson.startingCode || ''}</textarea>
                        <button onclick="runCode()" class="run-button">▶️ Запустить код</button>
                    </div>
                    <div id="code-output" class="code-output"></div>
                </div>
            `;
            initializeCodeEditor();
            break;
    }
}

// Функция проверки кода
function runCode() {
    const code = document.getElementById('code-editor').value;
    const output = document.getElementById('code-output');
    const currentLesson = lessons.find(l => l.id === currentLessonId);
    
    try {
        // Создаем изолированную среду выполнения
        const sandbox = function(userCode, testCases, lessonData) {
            let results = [];
            let variables = {};
            let errors = [];
            
            // Функция для вывода
            const print = (...args) => {
                results.push(args.map(arg => String(arg)).join(' '));
            };

            // Функция для проверки типов
            const checkType = (value, expectedType) => {
                if (expectedType === 'number') return typeof value === 'number' && !isNaN(value);
                if (expectedType === 'string') return typeof value === 'string';
                if (expectedType === 'array') return Array.isArray(value);
                if (expectedType === 'boolean') return typeof value === 'boolean';
                return true;
            };

            // Функция для сравнения значений
            const compareValues = (actual, expected, type = 'strict') => {
                if (Array.isArray(expected)) {
                    if (!Array.isArray(actual)) return false;
                    if (actual.length !== expected.length) return false;
                    return actual.every((val, idx) => compareValues(val, expected[idx], type));
                }
                
                if (type === 'numeric') {
                    return Math.abs(Number(actual) - Number(expected)) < 0.0001;
                }
                
                if (type === 'string-ignore-case') {
                    return String(actual).toLowerCase() === String(expected).toLowerCase();
                }
                
                if (type === 'whitespace-tolerant') {
                    return String(actual).replace(/\s+/g, ' ').trim() === 
                           String(expected).replace(/\s+/g, ' ').trim();
                }
                
                return actual === expected;
            };

            // Проходим по всем тестовым случаям
            for (let test of testCases) {
                results = [];
                variables = { ...test.variables };
                let context = {
                    print: print,
                    ...variables
                };

                try {
                    // Проверяем наличие запрещенных конструкций
                    if (lessonData.restrictions) {
                        for (let restriction of lessonData.restrictions) {
                            if (userCode.includes(restriction)) {
                                throw new Error(`Использование '${restriction}' запрещено в этом задании`);
                            }
                        }
                    }

                    // Проверяем обязательные конструкции
                    if (lessonData.required) {
                        for (let required of lessonData.required) {
                            if (!userCode.includes(required)) {
                                throw new Error(`В решении должно использоваться '${required}'`);
                            }
                        }
                    }

                    // Выполняем код пользователя
                    let userFunction = new Function(...Object.keys(context), userCode);
                    let result = userFunction(...Object.values(context));

                    // Проверяем результат в зависимости от типа теста
                    switch (test.type) {
                        case 'output':
                            let output = results.join('\n');
                            if (!compareValues(output, test.expected, test.compareMode)) {
                                throw new Error(`Ожидался вывод: ${test.expected}\nПолучено: ${output}`);
                            }
                            break;

                        case 'value':
                            if (!compareValues(result, test.expected, test.compareMode)) {
                                throw new Error(`Ожидалось значение: ${test.expected}\nПолучено: ${result}`);
                            }
                            break;

                        case 'variables':
                            for (let varName of Object.keys(test.expectedVariables)) {
                                if (!compareValues(variables[varName], test.expectedVariables[varName], test.compareMode)) {
                                    throw new Error(`Переменная ${varName} имеет неверное значение.\nОжидалось: ${test.expectedVariables[varName]}\nПолучено: ${variables[varName]}`);
                                }
                            }
                            break;

                        case 'type':
                            if (!checkType(result, test.expectedType)) {
                                throw new Error(`Ожидался тип: ${test.expectedType}\nПолучен: ${typeof result}`);
                            }
                            break;
                    }

                } catch (e) {
                    errors.push(`Тест "${test.name}": ${e.message}`);
                }
            }

            if (errors.length > 0) {
                throw new Error(errors.join('\n\n'));
            }

            return {
                success: true,
                message: "Все тесты пройдены успешно! 🎉",
                details: testCases.map(test => ({
                    name: test.name,
                    status: 'passed'
                }))
            };
        };

        // Запускаем проверку
        const result = sandbox(code, currentLesson.testCases, currentLesson);
        
        // Отображаем результат
        output.innerHTML = `
            <div class="code-result success">
                <h3>🚀 Результат:</h3>
                <pre>${result.message}</pre>
                <div class="test-details">
                    ${result.details.map(detail => `
                        <div class="test-case ${detail.status}">
                            ✅ ${detail.name}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Если все тесты пройдены, разблокируем следующий урок
        if (result.success) {
            enableNextLesson();
            updateProgress(currentLessonId);
            saveProgress();
        }

    } catch (error) {
        output.innerHTML = `
            <div class="code-result error">
                <h3>❌ Ошибка:</h3>
                <pre>${error.message}</pre>
                <div class="hint">
                    <p>💡 Подсказка:</p>
                    <p>${currentLesson.hint || 'Проверь свой код и попробуй еще раз!'}</p>
                </div>
            </div>
        `;
    }
}

// Функция проверки теста
function checkQuiz(lessonId) {
    const currentLesson = lessons.find(l => l.id === lessonId);
    const questions = document.querySelectorAll('.quiz-question');
    let score = 0;
    let total = questions.length;
    
    questions.forEach((question, index) => {
        const questionElement = document.getElementById(`question-${index}`);
        const feedbackElement = document.getElementById(`feedback-${index}`);
        
        // Получаем выбранные ответы
        const selectedAnswers = Array.from(question.querySelectorAll('input:checked'))
            .map(input => parseInt(input.value))
            .sort();
            
        // Получаем правильные ответы
        const correctAnswers = currentLesson.questions[index].correctAnswers.sort();
        
        // Проверяем правильность ответов
        const isCorrect = arraysEqual(selectedAnswers, correctAnswers);
        
        // Обновляем стили и отображаем обратную связь
        questionElement.classList.remove('correct-answer', 'wrong-answer');
        questionElement.classList.add(isCorrect ? 'correct-answer' : 'wrong-answer');
        
        if (isCorrect) {
            score++;
            feedbackElement.innerHTML = `
                <div class="feedback correct">
                    <p>✨ Правильно!</p>
                </div>
            `;
        } else {
            feedbackElement.innerHTML = `
                <div class="feedback incorrect">
                    <p>🤔 Попробуй еще раз!</p>
                </div>
            `;
        }
    });
    
    // Показываем общий результат
    const resultHTML = `
        <div class="quiz-result">
            <h3>Твой результат: ${score} из ${total}</h3>
            ${score === total ? 
                `<div class="success-message">
                    <p>🎉 Отлично! Ты можешь перейти к следующему уроку!</p>
                    <button onclick="loadLesson(${lessonId + 1})" class="next-button">Следующий урок</button>
                </div>` 
                : 
                '<p>🎯 Исправь ошибки и попробуй снова!</p>'
            }
        </div>
    `;
    
    // Добавляем результат
    const quizElement = document.querySelector('.quiz');
    const existingResult = document.querySelector('.quiz-result');
    if (existingResult) {
        existingResult.remove();
    }
    quizElement.insertAdjacentHTML('beforeend', resultHTML);
    
    // Если все ответы правильные, обновляем прогресс
    if (score === total) {
        updateProgress(lessonId);
        saveProgress();
    }
}

// Вспомогательные функции
function arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((val, idx) => val === arr2[idx]);
}

function enableNextLesson() {
    const nextButton = document.createElement('button');
    nextButton.className = 'next-button';
    nextButton.textContent = 'Следующий урок';
    nextButton.onclick = () => loadLesson(currentLessonId + 1);
    
    const nextLessonDiv = document.createElement('div');
    nextLessonDiv.className = 'next-lesson';
    nextLessonDiv.appendChild(nextButton);
    
    const output = document.getElementById('code-output');
    if (!output.querySelector('.next-lesson')) {
        output.appendChild(nextLessonDiv);
    }
}

function showError(message) {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="error-message">
            <h3>❌ Ошибка</h3>
            <p>${message}</p>
        </div>
    `;
}

function resetCode() {
    const currentLesson = lessons.find(l => l.id === currentLessonId);
    const editor = document.getElementById('code-editor');
    editor.value = currentLesson.startingCode || '';
}

function showHint() {
    const currentLesson = lessons.find(l => l.id === currentLessonId);
    const output = document.getElementById('code-output');
    output.innerHTML = `
        <div class="hint-box">
            <h3>💡 Подсказка:</h3>
            <p>${currentLesson.hint}</p>
        </div>
    `;
}

// Функции для работы с прогрессом
function updateProgress(lessonId) {
    const progress = getProgress();
    if (!progress.includes(lessonId)) {
        progress.push(lessonId);
    }
    localStorage.setItem('lessonProgress', JSON.stringify(progress));
    updateProgressUI();
}

function getProgress() {
    const progress = localStorage.getItem('lessonProgress');
    return progress ? JSON.parse(progress) : [];
}

function updateProgressUI() {
    const progress = getProgress();
    document.querySelectorAll('.lesson-link').forEach(link => {
        const lessonId = parseInt(link.dataset.lessonId);
        if (progress.includes(lessonId)) {
            link.classList.add('completed');
        }
    });
}

function saveProgress() {
    const progress = getProgress();
    localStorage.setItem('lessonProgress', JSON.stringify(progress));
}

// Функции инициализации редактора кода
function initializeCodeEditor() {
    const editor = document.getElementById('code-editor');
    if (editor) {
        // Добавляем подсветку текущей строки
        editor.addEventListener('keyup', () => {
            highlightCurrentLine(editor);
        });

        // Добавляем автоматические отступы
        editor.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                insertTab(editor);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                insertNewLineWithIndent(editor);
            }
        });

        // Включаем автосохранение
        editor.addEventListener('input', debounce(() => {
            saveCodeToLocalStorage(editor.value);
        }, 1000));

        // Восстанавливаем сохраненный код
        const savedCode = loadCodeFromLocalStorage();
        if (savedCode) {
            editor.value = savedCode;
        }
    }
}

// Функции для работы с редактором кода
function highlightCurrentLine(editor) {
    const lines = editor.value.substr(0, editor.selectionStart).split('\n').length;
    const totalLines = editor.value.split('\n').length;
    editor.style.backgroundImage = `linear-gradient(transparent ${(lines-1)*24}px, #f0f0f0 ${(lines-1)*24}px, #f0f0f0 ${lines*24}px, transparent ${lines*24}px)`;
}

function insertTab(editor) {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const spaces = '    '; // 4 пробела для отступа
    editor.value = editor.value.substring(0, start) + spaces + editor.value.substring(end);
    editor.selectionStart = editor.selectionEnd = start + spaces.length;
}

function insertNewLineWithIndent(editor) {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const lines = editor.value.substr(0, start).split('\n');
    const currentLine = lines[lines.length - 1];
    const indent = currentLine.match(/^\s*/)[0];
    const newLine = '\n' + indent;
    editor.value = editor.value.substring(0, start) + newLine + editor.value.substring(end);
    editor.selectionStart = editor.selectionEnd = start + newLine.length;
}

// Функции для работы с локальным хранилищем
function saveCodeToLocalStorage(code) {
    localStorage.setItem(`code_lesson_${currentLessonId}`, code);
}

function loadCodeFromLocalStorage() {
    return localStorage.getItem(`code_lesson_${currentLessonId}`);
}

// Вспомогательные функции
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Функции для анимаций и визуальных эффектов
function showSuccessAnimation() {
    const container = document.createElement('div');
    container.className = 'success-animation';
    container.innerHTML = `
        <div class="success-circle">
            <div class="success-tick"></div>
        </div>
        <p>Отлично!</p>
    `;
    document.body.appendChild(container);
    setTimeout(() => {
        container.classList.add('fade-out');
        setTimeout(() => container.remove(), 500);
    }, 1500);
}

function showErrorAnimation() {
    const container = document.createElement('div');
    container.className = 'error-animation';
    container.innerHTML = `
        <div class="error-circle">
            <div class="error-x"></div>
        </div>
        <p>Попробуй еще раз!</p>
    `;
    document.body.appendChild(container);
    setTimeout(() => {
        container.classList.add('fade-out');
        setTimeout(() => container.remove(), 500);
    }, 1500);
}

// Функции для отслеживания прогресса выполнения
function trackProgress() {
    const progress = {
        lessonId: currentLessonId,
        attempts: getAttempts() + 1,
        timeSpent: getTimeSpent(),
        timestamp: new Date().toISOString()
    };
    saveProgressData(progress);
}

function getAttempts() {
    const attempts = localStorage.getItem(`attempts_lesson_${currentLessonId}`);
    return attempts ? parseInt(attempts) : 0;
}

function getTimeSpent() {
    const startTime = localStorage.getItem(`start_time_lesson_${currentLessonId}`);
    if (!startTime) return 0;
    return Math.floor((new Date() - new Date(startTime)) / 1000);
}

function saveProgressData(progress) {
    let allProgress = JSON.parse(localStorage.getItem('lesson_progress_data') || '[]');
    allProgress.push(progress);
    localStorage.setItem('lesson_progress_data', JSON.stringify(allProgress));
}

// Функции для подсказок и помощи
function showContextHelp(element) {
    const helpText = element.dataset.help;
    if (!helpText) return;

    const helpBox = document.createElement('div');
    helpBox.className = 'context-help';
    helpBox.textContent = helpText;
    
    const rect = element.getBoundingClientRect();
    helpBox.style.top = `${rect.bottom + 5}px`;
    helpBox.style.left = `${rect.left}px`;
    
    document.body.appendChild(helpBox);
    
    element.addEventListener('mouseleave', () => helpBox.remove());
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    loadLesson(1);
    updateProgressUI();
    
    // Добавляем обработчики контекстной помощи
    document.querySelectorAll('[data-help]').forEach(element => {
        element.addEventListener('mouseenter', () => showContextHelp(element));
    });
    
    // Устанавливаем время начала урока
    if (!localStorage.getItem(`start_time_lesson_${currentLessonId}`)) {
        localStorage.setItem(`start_time_lesson_${currentLessonId}`, new Date().toISOString());
    }
});

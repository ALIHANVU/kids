// Глобальные переменные
let lessons = null;
let currentLessonId = 1;

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    // Загружаем уроки при старте
    fetchLessons().then(() => {
        loadLesson(1);
        updateProgressUI();
    }).catch(error => {
        showError('Не удалось загрузить уроки. Пожалуйста, обновите страницу.');
        console.error('Error loading lessons:', error);
    });
});

// Функция загрузки всех уроков
async function fetchLessons() {
    try {
        const response = await fetch('lessons.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        lessons = data.lessons;
        return lessons;
    } catch (error) {
        console.error('Error fetching lessons:', error);
        throw error;
    }
}

// Функция загрузки конкретного урока
function loadLesson(lessonNumber) {
    if (!lessons) {
        // Если уроки еще не загружены, пробуем загрузить их снова
        fetchLessons().then(() => {
            displayLesson(lessons.find(l => l.id === lessonNumber));
            currentLessonId = lessonNumber;
        }).catch(error => {
            showError('Не удалось загрузить урок. Пожалуйста, обновите страницу.');
        });
        return;
    }

    const lesson = lessons.find(l => l.id === lessonNumber);
    if (lesson) {
        displayLesson(lesson);
        currentLessonId = lessonNumber;
        updateProgress(lessonNumber);
    } else {
        showError('Урок не найден');
    }
}

// Функция отображения урока
function displayLesson(lesson) {
    const content = document.getElementById('content');
    if (!content) {
        console.error('Content element not found');
        return;
    }

    try {
        switch(lesson.type) {
            case 'theory':
                content.innerHTML = `
                    <div class="lesson">
                        <h2>${lesson.title}</h2>
                        ${lesson.content}
                        <div class="navigation-buttons">
                            ${currentLessonId > 1 ? 
                                `<button onclick="loadLesson(${currentLessonId - 1})" class="nav-button prev">⬅️ Предыдущий урок</button>` 
                                : ''}
                            <button onclick="loadLesson(${currentLessonId + 1})" class="nav-button next">Следующий урок ➡️</button>
                        </div>
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
                                    `).join('')}
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
                
            default:
                throw new Error('Неизвестный тип урока');
        }
    } catch (error) {
        console.error('Error displaying lesson:', error);
        showError('Произошла ошибка при отображении урока');
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
        const correctAnswers = [...currentLesson.questions[index].correctAnswers].sort();
        
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
                    <div class="feedback-details">Отличная работа!</div>
                </div>
            `;
            showSuccessAnimation();
        } else {
            feedbackElement.innerHTML = `
                <div class="feedback incorrect">
                    <p>🤔 Попробуй еще раз!</p>
                    <div class="feedback-details">
                        Подумай внимательнее над этим вопросом.
                    </div>
                </div>
            `;
        }
    });
    
    // Показываем общий результат
    const resultHTML = `
        <div class="quiz-result">
            <h3>Твой результат: ${score} из ${total}</h3>
            <div class="result-details">
                <div class="progress-bar">
                    <div class="progress" style="width: ${(score/total) * 100}%"></div>
                </div>
                ${score === total ? 
                    `<div class="success-message">
                        <p>🎉 Отлично! Ты справился со всеми заданиями!</p>
                        <button onclick="loadLesson(${lessonId + 1})" class="next-button">
                            Перейти к следующему уроку
                        </button>
                    </div>` 
                    : 
                    `<div class="retry-message">
                        <p>🎯 Почти получилось! Исправь ошибки и попробуй снова.</p>
                        <button onclick="checkQuiz(${lessonId})" class="retry-button">
                            Проверить снова
                        </button>
                    </div>`
                }
            </div>
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

    // Анимируем прокрутку к результатам
    document.querySelector('.quiz-result').scrollIntoView({ behavior: 'smooth' });
}

// Функции для работы с редактором кода
function initializeCodeEditor() {
    const editor = document.getElementById('code-editor');
    if (editor) {
        // Добавляем подсветку текущей строки
        editor.addEventListener('keyup', () => {
            highlightCurrentLine(editor);
        });

        // Автоматические отступы
        editor.addEventListener('keydown', (e) => {
            handleEditorKeydown(e, editor);
        });

        // Автосохранение
        editor.addEventListener('input', debounce(() => {
            saveCodeToLocalStorage(editor.value);
        }, 1000));

        // Восстанавливаем сохраненный код
        const savedCode = loadCodeFromLocalStorage();
        if (savedCode) {
            editor.value = savedCode;
        }

        // Добавляем нумерацию строк
        updateLineNumbers(editor);
    }
}

function handleEditorKeydown(e, editor) {
    if (e.key === 'Tab') {
        e.preventDefault();
        insertTab(editor);
    } else if (e.key === 'Enter') {
        e.preventDefault();
        insertNewLineWithIndent(editor);
    } else if (e.key === '}') {
        handleClosingBrace(e, editor);
    }
}

function insertTab(editor) {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    
    if (start === end) {
        // Если нет выделения, просто вставляем отступ
        const spaces = '    ';
        editor.value = editor.value.substring(0, start) + spaces + editor.value.substring(end);
        editor.selectionStart = editor.selectionEnd = start + spaces.length;
    } else {
        // Если есть выделение, добавляем отступы к каждой строке
        const lines = editor.value.substring(start, end).split('\n');
        const indentedLines = lines.map(line => '    ' + line);
        const newText = indentedLines.join('\n');
        
        editor.value = editor.value.substring(0, start) + newText + editor.value.substring(end);
        editor.selectionStart = start;
        editor.selectionEnd = start + newText.length;
    }
    
    updateLineNumbers(editor);
}

function insertNewLineWithIndent(editor) {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const text = editor.value;
    
    // Находим текущую строку
    const lines = text.substr(0, start).split('\n');
    const currentLine = lines[lines.length - 1];
    
    // Получаем текущий отступ
    const indent = currentLine.match(/^\s*/)[0];
    
    // Проверяем, нужно ли добавить дополнительный отступ
    const needsExtraIndent = currentLine.trim().endsWith('{');
    const newIndent = needsExtraIndent ? indent + '    ' : indent;
    
    // Вставляем новую строку с отступом
    const newText = '\n' + newIndent;
    editor.value = text.substring(0, start) + newText + text.substring(end);
    editor.selectionStart = editor.selectionEnd = start + newText.length;
    
    updateLineNumbers(editor);
}

function updateLineNumbers(editor) {
    const lineNumbersElement = document.getElementById('line-numbers');
    if (!lineNumbersElement) {
        return;
    }

    const lines = editor.value.split('\n').length;
    const lineNumbers = Array.from({ length: lines }, (_, i) => i + 1).join('\n');
    lineNumbersElement.textContent = lineNumbers;
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

function arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) return false;
    }
    return true;
}

// Функции для анимаций
function showSuccessAnimation() {
    const container = document.createElement('div');
    container.className = 'success-animation';
    container.innerHTML = `
        <div class="success-icon">✨</div>
        <div class="success-message">Отлично!</div>
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
        <div class="error-icon">❌</div>
        <div class="error-message">Попробуй еще раз!</div>
    `;
    
    document.body.appendChild(container);
    
    setTimeout(() => {
        container.classList.add('fade-out');
        setTimeout(() => container.remove(), 500);
    }, 1500);
}

// Функции для отображения подсказок
function showHint() {
    const currentLesson = lessons.find(l => l.id === currentLessonId);
    const output = document.getElementById('code-output');
    if (!currentLesson || !output) return;

    output.innerHTML = `
        <div class="hint-box">
            <h3>💡 Подсказка:</h3>
            <p>${currentLesson.hint || 'Для этого задания подсказка не предусмотрена.'}</p>
        </div>
    `;
}

function resetCode() {
    const currentLesson = lessons.find(l => l.id === currentLessonId);
    const editor = document.getElementById('code-editor');
    if (!currentLesson || !editor) return;

    if (confirm('Ты уверен, что хочешь сбросить код? Весь твой текущий код будет удален.')) {
        editor.value = currentLesson.startingCode || '';
        updateLineNumbers(editor);
    }
}

// Функции для отображения ошибок
function showError(message) {
    const content = document.getElementById('content');
    if (!content) return;

    content.innerHTML = `
        <div class="error-message">
            <h3>❌ Ошибка</h3>
            <p>${message}</p>
            <button onclick="location.reload()" class="retry-button">
                🔄 Попробовать снова
            </button>
        </div>
    `;
}

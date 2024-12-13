let currentLesson = 1;
let lessons = null;

function loadLesson(lessonNumber) {
    fetch('lessons.json')
        .then(response => response.json())
        .then(data => {
            lessons = data.lessons;
            const lesson = lessons.find(l => l.id === lessonNumber);
            displayLesson(lesson);
            currentLesson = lessonNumber;
        });
}

function displayLesson(lesson) {
    const content = document.getElementById('content');
    
    switch(lesson.type) {
        case 'theory':
            content.innerHTML = `
                <div class="lesson">
                    <h2>${lesson.title}</h2>
                    ${lesson.content}
                    <button onclick="loadLesson(${currentLesson + 1})">Следующий урок</button>
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
                        <button onclick="checkQuiz(${lesson.id})">Проверить ответы</button>
                    </div>
                </div>
            `;
            content.innerHTML = quizHTML;
            break;
            
        case 'coding':
            content.innerHTML = `
                <div class="lesson">
                    <h2>${lesson.title}</h2>
                    <p>${lesson.description}</p>
                    <div class="coding-area">
                        <textarea id="code-editor" placeholder="Напиши свой код здесь...">${lesson.startingCode}</textarea>
                        <button onclick="runCode()">Запустить код</button>
                    </div>
                    <div id="code-output"></div>
                </div>
            `;
            break;
    }
}

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
            .map(input => parseInt(input.value));
        
        // Получаем правильные ответы из JSON
        const correctAnswers = currentLesson.questions[index].correctAnswers;
        
        // Сравниваем массивы ответов
        const isCorrect = arraysEqual(selectedAnswers.sort(), correctAnswers.sort());
        
        // Обновляем стили и отображаем обратную связь
        questionElement.classList.remove('correct-answer', 'wrong-answer');
        questionElement.classList.add(isCorrect ? 'correct-answer' : 'wrong-answer');
        
        // Детальная обратная связь
        if (isCorrect) {
            score++;
            feedbackElement.innerHTML = `
                <div class="feedback correct">
                    <p>✨ Правильно! Молодец!</p>
                </div>
            `;
        } else {
            feedbackElement.innerHTML = `
                <div class="feedback incorrect">
                    <p>🤔 Попробуй еще раз!</p>
                    <p class="hint">Подсказка: проверь, все ли правильные варианты ты выбрал</p>
                </div>
            `;
        }
    });
    
    // Показываем общий результат
    const resultHTML = `
        <div class="quiz-result">
            <h3>Твой результат: ${score} из ${total}</h3>
            ${score === total ? 
                `<p>🎉 Отлично! Ты можешь перейти к следующему уроку!</p>
                 <button onclick="loadLesson(${lessonId + 1})">Следующий урок</button>` 
                : 
                '<p>🎯 Попробуй исправить ошибки и проверь снова!</p>'
            }
        </div>
    `;
    
    // Добавляем результат в конец квиза
    const quizElement = document.querySelector('.quiz');
    const existingResult = document.querySelector('.quiz-result');
    if (existingResult) {
        existingResult.remove();
    }
    quizElement.insertAdjacentHTML('beforeend', resultHTML);
    
    // Анимация для обратной связи
    document.querySelectorAll('.feedback').forEach(el => {
        el.style.animation = 'fadeIn 0.5s ease-out';
    });
}

function arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) return false;
    }
    return true;
}

function runCode() {
    const code = document.getElementById('code-editor').value;
    const output = document.getElementById('code-output');
    
    try {
        // Создаем безопасную среду выполнения
        const sandbox = new Function('console', `
            let output = [];
            console.log = (...args) => output.push(args.join(' '));
            try {
                ${code}
                return output.join('\\n');
            } catch (e) {
                throw e;
            }
        `);
        
        // Выполняем код и получаем результат
        const result = sandbox(console);
        
        output.innerHTML = `
            <div class="code-result success">
                <h3>🚀 Результат выполнения:</h3>
                <pre>${result}</pre>
            </div>
        `;
    } catch (error) {
        output.innerHTML = `
            <div class="code-result error">
                <h3>❌ Ошибка:</h3>
                <pre>${error.message}</pre>
                <p class="hint">Проверь свой код и попробуй еще раз!</p>
            </div>
        `;
    }
}

// Загрузка первого урока при открытии страницы
document.addEventListener('DOMContentLoaded', () => {
    loadLesson(1);
});

// Анимация появления элементов
function animateElement(element) {
    element.style.animation = 'none';
    element.offsetHeight; // Перезапуск анимации
    element.style.animation = null;
}

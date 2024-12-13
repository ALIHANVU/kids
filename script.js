let currentLesson = 1;

function loadLesson(lessonNumber) {
    fetch('lessons.json')
        .then(response => response.json())
        .then(data => {
            const lesson = data.lessons.find(l => l.id === lessonNumber);
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
                            <div class="quiz-question">
                                <p>${q.question}</p>
                                ${q.options.map((option, optIndex) => `
                                    <label>
                                        <input type="checkbox" name="q${index}" value="${optIndex}">
                                        ${option}
                                    </label>
                                `).join('<br>')}
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
    const questions = document.querySelectorAll('.quiz-question');
    let score = 0;
    let total = questions.length;
    
    questions.forEach((question, index) => {
        const selectedAnswers = Array.from(question.querySelectorAll('input:checked'))
            .map(input => parseInt(input.value));
        
        // Проверка правильности ответов будет происходить при сравнении с данными из JSON
        // Здесь можно добавить более сложную логику проверки
    });
    
    alert(`Вы ответили правильно на ${score} из ${total} вопросов!`);
    if (score === total) {
        loadLesson(lessonId + 1);
    }
}

function runCode() {
    const code = document.getElementById('code-editor').value;
    const output = document.getElementById('code-output');
    
    try {
        // Здесь можно добавить безопасное выполнение кода
        // Например, через iframe или WebAssembly
        output.innerHTML = `<p>Результат выполнения:</p>
                          <pre>${code}</pre>`;
    } catch (error) {
        output.innerHTML = `<p class="error">Ошибка: ${error.message}</p>`;
    }
}

// Загрузка первого урока при открытии страницы
document.addEventListener('DOMContentLoaded', () => {
    loadLesson(1);
});

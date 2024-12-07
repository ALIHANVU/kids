document.addEventListener('DOMContentLoaded', () => {
    // Загрузка уроков из lessons.json
    fetch('lessons.json')
        .then(response => response.json())
        .then(lessons => {
            const lessonList = document.getElementById('lesson-list');
            lessons.forEach(lesson => {
                const li = document.createElement('li');
                li.innerHTML = `<h3>${lesson.title}</h3><p>${lesson.description}</p>`;
                lessonList.appendChild(li);
            });
        })
        .catch(error => console.error('Ошибка загрузки уроков:', error));

    // Загрузка вопросов из questions.json
    fetch('questions.json')
        .then(response => response.json())
        .then(questions => {
            const quizForm = document.getElementById('quiz-form');
            if (questions.length === 0) {
                quizForm.innerHTML = '<p>Вопросы не найдены.</p>';
            } else {
                questions.forEach((question, index) => {
                    const questionEl = document.createElement('p');
                    questionEl.innerText = `Вопрос ${index + 1}: ${question.question}`;
                    quizForm.appendChild(questionEl);

                    question.answers.forEach(answer => {
                        const label = document.createElement('label');
                        label.innerHTML = `<input type="checkbox" name="question${index + 1}" value="${answer.text}"> ${answer.text}<br>`;
                        quizForm.appendChild(label);
                    });
                });

                const submitButton = document.createElement('button');
                submitButton.type = 'submit';
                submitButton.innerText = 'Отправить ответы';
                quizForm.appendChild(submitButton);

                const resultElement = document.createElement('p');
                resultElement.id = 'quiz-result';
                resultElement.style.display = 'none';
                quizForm.appendChild(resultElement);
            }
        })
        .catch(error => console.error('Ошибка загрузки вопросов:', error));

    // Загрузка задач из tasks.json
    fetch('tasks.json')
        .then(response => response.json())
        .then(tasks => {
            const codingForm = document.getElementById('coding-form');
            if (tasks.length === 0) {
                codingForm.innerHTML = '<p>Задачи не найдены.</p>';
            } else {
                tasks.forEach((task, index) => {
                    const taskEl = document.createElement('p');
                    taskEl.innerText = `Задача ${index + 1}: ${task.question}`;
                    codingForm.appendChild(taskEl);

                    const textarea = document.createElement('textarea');
                    textarea.name = `task${index + 1}`;
                    textarea.rows = 4;
                    textarea.cols = 50;
                    codingForm.appendChild(textarea);
                });

                const submitButton = document.createElement('button');
                submitButton.type = 'submit';
                submitButton.innerText = 'Отправить решения';
                codingForm.appendChild(submitButton);

                const resultElement = document.createElement('p');
                resultElement.id = 'coding-result';
                resultElement.style.display = 'none';
                codingForm.appendChild(resultElement);
            }
        })
        .catch(error => console.error('Ошибка загрузки задач:', error));

    // Обработчики для модальных окон
    const quizButton = document.getElementById('quiz-button');
    const codingButton = document.getElementById('coding-button');
    const quizModal = document.getElementById('quiz-modal');
    const codingModal = document.getElementById('coding-modal');
    const closeButtons = document.querySelectorAll('.close-button');

    quizButton.addEventListener('click', () => {
        quizModal.style.display = 'block';
    });

    codingButton.addEventListener('click', () => {
        codingModal.style.display = 'block';
    });

    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            quizModal.style.display = 'none';
            codingModal.style.display = 'none';
        });
    });

    window.addEventListener('click', (event) => {
        if (event.target == quizModal) {
            quizModal.style.display = 'none';
        }
        if (event.target == codingModal) {
            codingModal.style.display = 'none';
        }
    });

    document.getElementById('quiz-form').addEventListener('submit', (event) => {
        event.preventDefault();

        fetch('questions.json')
            .then(response => response.json())
            .then(questions => {
                let score = 0;
                let total = questions.length;

                questions.forEach((question, index) => {
                    const selected = Array.from(document.querySelectorAll(`input[name="question${index + 1}"]:checked`)).map(el => el.value);
                    let correctAnswers = question.answers.filter(answer => answer.correct).map(answer => answer.text);

                    selected.forEach(answer => {
                        const label = document.querySelector(`input[name="question${index + 1}"][value="${answer}"]`).parentNode;
                        if (correctAnswers.includes(answer)) {
                            label.classList.add('correct');
                        } else {
                            label.classList.add('incorrect');
                        }
                    });

                    if (JSON.stringify(selected.sort()) === JSON.stringify(correctAnswers.sort())) {
                        score++;
                    }
                });

                const resultElement = document.getElementById('quiz-result');
                resultElement.style.display = 'block';
                resultElement.innerHTML = `Вы ответили правильно на ${score} из ${total} вопросов.`;
            })
            .catch(error => console.error('Ошибка проверки ответов:', error));
    });

    document.getElementById('coding-form').addEventListener('submit', (event) => {
        event.preventDefault();

        fetch('tasks.json')
            .then(response => response.json())
            .then(tasks => {
                let correct = 0;
                let total = tasks.length;

                tasks.forEach((task, index) => {
                    const userCode = document.querySelector(`textarea[name="task${index + 1}"]`).value;
                    // Здесь можно добавить логику проверки правильности кода пользователя
                    if (userCode.trim() !== "") {
                        correct++; // Предположим, что каждый непустой ответ верный для простоты
                    }
                });

                const resultElement = document.getElementById('coding-result');
                resultElement.style.display = 'block';
                resultElement.innerHTML = `Вы правильно решили ${correct} из ${total} задач.`;
            })
            .catch(error => console.error('Ошибка проверки решений:', error));
    });
});

const taskInput = document.getElementById('taskInput');
const dueDateInput = document.getElementById('dueDate');
const categoryInput = document.getElementById('category');
const addBtn = document.getElementById('addBtn');
const filterCategory = document.getElementById('filterCategory');
const taskList = document.getElementById('taskList');
const stats = document.getElementById('stats');

let tasks = [];
let dragSrcEl = null;

// 擬似APIで初期タスク取得
async function fetchTodos() {
    return new Promise((resolve) => {
        setTimeout(() => {
            const saved = JSON.parse(localStorage.getItem('tasks')) || [];
            resolve(saved);
        }, 500);
    });
}

// localStorage保存
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// タスク描画
function renderTasks() {
    taskList.innerHTML = '';

    let filteredTasks = tasks;
    const filterValue = filterCategory.value;
    if (filterValue !== 'すべて') {
        filteredTasks = tasks.filter(t => t.category === filterValue);
    }

    // 未完了→完了、期限順でソート
    const sortedTasks = filteredTasks.slice().sort((a, b) => {
        if (a.completed !== b.completed) return a.completed - b.completed;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
    });

    sortedTasks.forEach((task, index) => {
        const li = document.createElement('li');
        li.classList.toggle('completed', task.completed);

        // 期限切れ判定
        if (task.dueDate && !task.completed && new Date(task.dueDate) < new Date()) {
            li.classList.add('overdue');
        }

        li.setAttribute('draggable', true);
        li.dataset.id = task.id;

        const content = document.createElement('span');
        content.textContent = task.text;

        const categorySpan = document.createElement('span');
        categorySpan.textContent = task.category;
        categorySpan.classList.add('category', task.category);

        const dueSpan = document.createElement('span');
        dueSpan.textContent = task.dueDate ? `締切: ${task.dueDate}` : '';
        dueSpan.classList.add('due-date');

        li.appendChild(content);
        li.appendChild(categorySpan);
        li.appendChild(dueSpan);

        // 完了切替
        li.addEventListener('click', () => {
            task.completed = !task.completed;
            saveTasks();
            renderTasks();
        });

        // 削除ボタン
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '削除';
        deleteBtn.classList.add('deleteBtn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            tasks = tasks.filter(t => t.id !== task.id);
            saveTasks();
            renderTasks();
        });

        li.appendChild(deleteBtn);

        // ドラッグ＆ドロップイベント
        li.addEventListener('dragstart', handleDragStart);
        li.addEventListener('dragover', handleDragOver);
        li.addEventListener('drop', handleDrop);
        li.addEventListener('dragend', handleDragEnd);

        taskList.appendChild(li);
    });

    const completedCount = tasks.reduce((acc, t) => t.completed ? acc + 1 : acc, 0);
    stats.textContent = `完了: ${completedCount} / 合計: ${tasks.length}`;
}

// ドラッグ＆ドロップ処理
function handleDragStart(e) {
    dragSrcEl = e.currentTarget;
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDrop(e) {
    e.stopPropagation();
    if (dragSrcEl !== e.currentTarget) {
        const fromId = parseInt(dragSrcEl.dataset.id);
        const toId = parseInt(e.currentTarget.dataset.id);

        const fromIndex = tasks.findIndex(t => t.id === fromId);
        const toIndex = tasks.findIndex(t => t.id === toId);

        // 配列の並び替え
        const [movedTask] = tasks.splice(fromIndex, 1);
        tasks.splice(toIndex, 0, movedTask);

        saveTasks();
        renderTasks();
    }
}

function handleDragEnd() {
    dragSrcEl = null;
}

// タスク追加
addBtn.addEventListener('click', () => {
    const text = taskInput.value.trim();
    const dueDate = dueDateInput.value;
    const category = categoryInput.value;

    if (!text) return;

    const newTask = { id: Date.now(), text, dueDate, category, completed: false };
    tasks.push(newTask);
    saveTasks();
    renderTasks();

    taskInput.value = '';
    dueDateInput.value = '';
});

// Enterキーでも追加
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addBtn.click();
});

// カテゴリーフィルタ変更時
filterCategory.addEventListener('change', renderTasks);

// 初期化
async function init() {
    tasks = await fetchTodos();
    renderTasks();
}

init();
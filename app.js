// ===== DOM要素の取得 =====
// タスク入力欄
const taskInput = document.getElementById('taskInput');
// 期限入力欄
const dueDateInput = document.getElementById('dueDate');
// カテゴリー選択
const categoryInput = document.getElementById('category');
// 追加ボタン
const addBtn = document.getElementById('addBtn');
// カテゴリーフィルタ用セレクト
const filterCategory = document.getElementById('filterCategory');
// タスクリスト表示用UL
const taskList = document.getElementById('taskList');
// 統計表示（完了数 / 合計）
const stats = document.getElementById('stats');

// ===== アプリの状態管理 =====
// タスク一覧を保持する配列
let tasks = [];
// ドラッグ中の要素を保持
let dragSrcEl = null;

// ===== 擬似API：非同期で初期タスクを取得 =====
async function fetchTodos() {
    return new Promise((resolve) => {
        setTimeout(() => {
            // localStorageから保存済みタスクを取得
            // なければ空配列
            const saved = JSON.parse(localStorage.getItem('tasks')) || [];
            resolve(saved);
        }, 500); // API通信を想定した遅延
    });
}

// ===== localStorageへ保存 =====
function saveTasks() {
    // tasks配列をJSON文字列に変換して保存
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// ===== タスク描画処理 =====
function renderTasks() {
    // 一旦リストを全削除（再描画のため）
    taskList.innerHTML = '';

    // --- カテゴリーフィルタ処理 ---
    let filteredTasks = tasks;
    const filterValue = filterCategory.value;

    // 「すべて」以外が選ばれている場合のみ絞り込み
    if (filterValue !== 'すべて') {
        filteredTasks = tasks.filter(t => t.category === filterValue);
    }

    // --- ソート処理 ---
    // ① 未完了 → 完了
    // ② 期限が近い順
    const sortedTasks = filteredTasks.slice().sort((a, b) => {
        // 完了状態が異なる場合は未完了を先に
        if (a.completed !== b.completed) return a.completed - b.completed;

        // 期限なしは後ろへ
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;

        // 期限が近い順
        return new Date(a.dueDate) - new Date(b.dueDate);
    });

    // --- タスクを1件ずつ描画 ---
    sortedTasks.forEach((task) => {
        const li = document.createElement('li');

        // 完了済みタスクならクラス付与
        li.classList.toggle('completed', task.completed);

        // --- 期限切れ判定 ---
        if (
            task.dueDate &&                 // 期限が設定されていて
            !task.completed &&              // 未完了で
            new Date(task.dueDate) < new Date() // 今日より前なら
        ) {
            li.classList.add('overdue');     // 赤色表示
        }

        // ドラッグ可能に設定
        li.setAttribute('draggable', true);
        // タスクIDをdata属性として保持
        li.dataset.id = task.id;

        // --- 表示要素作成 ---
        const content = document.createElement('span');
        content.textContent = task.text;

        const categorySpan = document.createElement('span');
        categorySpan.textContent = task.category;
        categorySpan.classList.add('category', task.category);

        const dueSpan = document.createElement('span');
        dueSpan.textContent = task.dueDate ? `締切: ${task.dueDate}` : '';
        dueSpan.classList.add('due-date');

        // 要素をliに追加
        li.appendChild(content);
        li.appendChild(categorySpan);
        li.appendChild(dueSpan);

        // --- 完了切替処理 ---
        li.addEventListener('click', () => {
            task.completed = !task.completed; // true / false を反転
            saveTasks();
            renderTasks();
        });

        // --- 削除ボタン ---
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '削除';
        deleteBtn.classList.add('deleteBtn');

        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // 親(li)のクリックイベントを防止
            tasks = tasks.filter(t => t.id !== task.id);
            saveTasks();
            renderTasks();
        });

        li.appendChild(deleteBtn);

        // --- ドラッグ＆ドロップイベント登録 ---
        li.addEventListener('dragstart', handleDragStart);
        li.addEventListener('dragover', handleDragOver);
        li.addEventListener('drop', handleDrop);
        li.addEventListener('dragend', handleDragEnd);

        taskList.appendChild(li);
    });

    // --- 統計表示 ---
    const completedCount = tasks.reduce(
        (acc, t) => t.completed ? acc + 1 : acc,
        0
    );
    stats.textContent = `完了: ${completedCount} / 合計: ${tasks.length}`;
}

// ===== ドラッグ＆ドロップ処理 =====

// ドラッグ開始
function handleDragStart(e) {
    dragSrcEl = e.currentTarget; // 移動元を保持
    e.dataTransfer.effectAllowed = 'move';
}

// ドラッグ中（ドロップを許可）
function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

// ドロップ時
function handleDrop(e) {
    e.stopPropagation();

    if (dragSrcEl !== e.currentTarget) {
        const fromId = parseInt(dragSrcEl.dataset.id);
        const toId = parseInt(e.currentTarget.dataset.id);

        // 移動元・移動先のインデックス取得
        const fromIndex = tasks.findIndex(t => t.id === fromId);
        const toIndex = tasks.findIndex(t => t.id === toId);

        // 配列内の並び替え
        const [movedTask] = tasks.splice(fromIndex, 1);
        tasks.splice(toIndex, 0, movedTask);

        saveTasks();
        renderTasks();
    }
}

// ドラッグ終了
function handleDragEnd() {
    dragSrcEl = null;
}

// ===== タスク追加処理 =====
addBtn.addEventListener('click', () => {
    const text = taskInput.value.trim();
    const dueDate = dueDateInput.value;
    const category = categoryInput.value;

    if (!text) return;

    const newTask = {
        id: Date.now(),      // 一意なID
        text,
        dueDate,
        category,
        completed: false
    };

    tasks.push(newTask);
    saveTasks();
    renderTasks();

    // 入力欄リセット
    taskInput.value = '';
    dueDateInput.value = '';
});

// Enterキーでも追加
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addBtn.click();
});

// フィルタ変更時に再描画
filterCategory.addEventListener('change', renderTasks);

// ===== 初期化処理 =====
async function init() {
    tasks = await fetchTodos(); // 非同期で取得
    renderTasks();
}

init();
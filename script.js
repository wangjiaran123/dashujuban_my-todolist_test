// To-Do List 应用
class TodoApp {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('todos')) || [];
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.bindEvents();
        this.render();
        this.updateStats();
    }

    bindEvents() {
        // 添加任务事件
        document.getElementById('addBtn').addEventListener('click', () => this.addTodo());
        document.getElementById('todoInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });

        // 筛选事件
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
        });

        // 清除已完成事件
        document.getElementById('clearCompleted').addEventListener('click', () => this.clearCompleted());
    }

    addTodo() {
        const input = document.getElementById('todoInput');
        const text = input.value.trim();

        if (text === '') {
            this.showMessage('请输入任务内容！', 'error');
            return;
        }

        if (text.length > 100) {
            this.showMessage('任务内容不能超过100个字符！', 'error');
            return;
        }

        const todo = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.todos.unshift(todo);
        input.value = '';
        this.saveToLocalStorage();
        this.render();
        this.updateStats();
        this.showMessage('任务添加成功！', 'success');
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveToLocalStorage();
            this.render();
            this.updateStats();
        }
    }

    editTodo(id, newText) {
        const todo = this.todos.find(t => t.id === id);
        if (todo && newText.trim() !== '') {
            todo.text = newText.trim();
            this.saveToLocalStorage();
            this.render();
            this.showMessage('任务更新成功！', 'success');
        }
    }

    deleteTodo(id) {
        const todoIndex = this.todos.findIndex(t => t.id === id);
        if (todoIndex !== -1) {
            // 添加删除动画
            const todoElement = document.querySelector(`[data-id="${id}"]`);
            if (todoElement) {
                todoElement.classList.add('removing');
                setTimeout(() => {
                    this.todos.splice(todoIndex, 1);
                    this.saveToLocalStorage();
                    this.render();
                    this.updateStats();
                    this.showMessage('任务已删除！', 'success');
                }, 300);
            }
        }
    }

    clearCompleted() {
        const completedCount = this.todos.filter(t => t.completed).length;
        if (completedCount === 0) {
            this.showMessage('没有已完成的任务可清除！', 'info');
            return;
        }

        if (confirm(`确定要清除 ${completedCount} 个已完成的任务吗？`)) {
            this.todos = this.todos.filter(t => !t.completed);
            this.saveToLocalStorage();
            this.render();
            this.updateStats();
            this.showMessage(`已清除 ${completedCount} 个已完成任务！`, 'success');
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // 更新筛选按钮状态
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        this.render();
    }

    getFilteredTodos() {
        switch (this.currentFilter) {
            case 'active':
                return this.todos.filter(t => !t.completed);
            case 'completed':
                return this.todos.filter(t => t.completed);
            default:
                return this.todos;
        }
    }

    render() {
        const todoList = document.getElementById('todoList');
        const emptyState = document.getElementById('emptyState');
        const filteredTodos = this.getFilteredTodos();

        if (filteredTodos.length === 0) {
            todoList.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        todoList.style.display = 'block';
        emptyState.style.display = 'none';

        todoList.innerHTML = filteredTodos.map(todo => `
            <li class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} 
                       onchange="app.toggleTodo(${todo.id})">
                <span class="todo-text">${this.escapeHtml(todo.text)}</span>
                <div class="todo-actions">
                    <button class="edit-btn" onclick="app.startEdit(${todo.id})">
                        <i class="fas fa-edit"></i> 编辑
                    </button>
                    <button class="delete-btn" onclick="app.deleteTodo(${todo.id})">
                        <i class="fas fa-trash"></i> 删除
                    </button>
                </div>
            </li>
        `).join('');
    }

    startEdit(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;

        const todoElement = document.querySelector(`[data-id="${id}"]`);
        const textElement = todoElement.querySelector('.todo-text');
        const currentText = textElement.textContent;

        // 创建编辑界面
        textElement.innerHTML = `
            <input type="text" class="edit-input" value="${this.escapeHtml(currentText)}" 
                   style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 4px;">
            <div style="margin-top: 5px;">
                <button class="save-btn" style="padding: 5px 10px; background: #4CAF50; color: white; border: none; border-radius: 4px; margin-right: 5px;">保存</button>
                <button class="cancel-btn" style="padding: 5px 10px; background: #999; color: white; border: none; border-radius: 4px;">取消</button>
            </div>
        `;

        const input = textElement.querySelector('.edit-input');
        input.focus();
        input.select();

        // 保存事件
        textElement.querySelector('.save-btn').addEventListener('click', () => {
            this.editTodo(id, input.value);
        });

        // 取消事件
        textElement.querySelector('.cancel-btn').addEventListener('click', () => {
            this.render();
        });

        // 回车保存
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.editTodo(id, input.value);
            }
        });

        // 点击外部取消
        const cancelEdit = (e) => {
            if (!todoElement.contains(e.target)) {
                this.render();
                document.removeEventListener('click', cancelEdit);
            }
        };
        setTimeout(() => document.addEventListener('click', cancelEdit), 100);
    }

    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(t => t.completed).length;
        const active = total - completed;

        let countText = `${total} 个任务`;
        if (total > 0) {
            countText += ` (${active} 待完成, ${completed} 已完成)`;
        }

        document.getElementById('taskCount').textContent = countText;
    }

    saveToLocalStorage() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showMessage(message, type) {
        // 移除现有的消息
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // 创建新消息
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">×</button>
        `;

        // 添加样式
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
        `;

        // 根据类型设置背景色
        const colors = {
            success: '#4CAF50',
            error: '#f44336',
            info: '#2196F3'
        };
        messageDiv.style.background = colors[type] || '#666';

        // 关闭按钮样式
        messageDiv.querySelector('button').style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 18px;
            cursor: pointer;
            padding: 0;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        document.body.appendChild(messageDiv);

        // 3秒后自动消失
        setTimeout(() => {
            if (messageDiv.parentElement) {
                messageDiv.style.animation = 'slideOutRight 0.3s ease forwards';
                setTimeout(() => messageDiv.remove(), 300);
            }
        }, 3000);

        // 添加动画样式
        if (!document.querySelector('#messageStyles')) {
            const style = document.createElement('style');
            style.id = 'messageStyles';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// 初始化应用
const app = new TodoApp();

// 添加一些示例数据（首次使用时）
if (app.todos.length === 0) {
    const sampleTodos = [
        { id: 1, text: '欢迎使用 To-Do List 应用！', completed: false, createdAt: new Date().toISOString() },
        { id: 2, text: '点击复选框标记任务完成', completed: false, createdAt: new Date().toISOString() },
        { id: 3, text: '使用筛选功能查看不同状态的任务', completed: true, createdAt: new Date().toISOString() }
    ];
    app.todos = sampleTodos;
    app.saveToLocalStorage();
    app.render();
    app.updateStats();
}
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
        this.startReminderCheck();
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

        // 获取新的可选字段值
        const startTimeInput = document.getElementById('startTimeInput');
        const deadlineInput = document.getElementById('deadlineInput');
        const reminderInput = document.getElementById('reminderInput');
        const locationInput = document.getElementById('locationInput');
        const starredInput = document.getElementById('starredInput');
        
        const startTime = startTimeInput.value ? new Date(startTimeInput.value).toISOString() : null;
        const deadline = deadlineInput.value ? new Date(deadlineInput.value).toISOString() : null;
        const reminder = reminderInput.value ? new Date(reminderInput.value).toISOString() : null;
        const location = locationInput.value.trim() || null;
        const starred = starredInput.checked;

        // 如果指定了开始时间，则任务状态为未开始，否则为进行中
        const isNotStarted = startTime && new Date(startTime) > new Date();
        
        const todo = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString(),
            startedAt: isNotStarted ? null : new Date().toISOString(), // 未开始任务没有开始时间
            completedAt: null, // 任务完成时间
            startTime: startTime, // 计划开始时间
            deadline: deadline,
            reminder: reminder, // 提醒时间
            location: location,
            starred: starred, // 星标标记
            timeUsed: '00:00:00' // 初始化为00:00:00，完成时自动计算
        };

        this.todos.unshift(todo);
        
        // 清空所有输入字段
        input.value = '';
        startTimeInput.value = '';
        deadlineInput.value = '';
        reminderInput.value = '';
        locationInput.value = '';
        starredInput.checked = false;
        
        this.saveToLocalStorage();
        this.render();
        this.updateStats();
        this.showMessage('任务添加成功！', 'success');
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            // 如果是未开始任务，点击时开始任务
            if (!todo.completed && !todo.startedAt && todo.startTime && new Date(todo.startTime) <= new Date()) {
                todo.startedAt = new Date().toISOString();
                this.saveToLocalStorage();
                this.render();
                this.updateStats();
                this.showMessage('任务已开始！', 'success');
                return;
            }
            
            todo.completed = !todo.completed;
            
            if (todo.completed) {
                // 任务完成时记录完成时间并计算已用时间
                todo.completedAt = new Date().toISOString();
                const startTime = todo.startedAt ? new Date(todo.startedAt) : new Date();
                const endTime = new Date(todo.completedAt);
                const timeDiff = endTime.getTime() - startTime.getTime();
                
                // 计算时分秒
                const hours = Math.floor(timeDiff / (1000 * 60 * 60));
                const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
                
                // 存储为时分秒格式的字符串
                todo.timeUsed = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            } else {
                // 任务重新激活时重置完成时间和开始时间
                todo.completedAt = null;
                todo.startedAt = new Date().toISOString(); // 重置开始时间为当前时间
                todo.timeUsed = '00:00:00';
            }
            
            this.saveToLocalStorage();
            this.render();
            this.updateStats();
        }
    }

    editTodo(id, newText, startTimeValue, deadlineValue, reminderValue, locationValue, starredValue) {
        const todo = this.todos.find(t => t.id === id);
        if (todo && newText.trim() !== '') {
            todo.text = newText.trim();
            todo.startTime = startTimeValue ? new Date(startTimeValue).toISOString() : null;
            todo.deadline = deadlineValue ? new Date(deadlineValue).toISOString() : null;
            todo.reminder = reminderValue ? new Date(reminderValue).toISOString() : null;
            todo.location = locationValue.trim() || null;
            todo.starred = starredValue === 'true';
            
            // 如果任务未开始但开始时间已到，自动开始任务
            if (!todo.startedAt && todo.startTime && new Date(todo.startTime) <= new Date()) {
                todo.startedAt = new Date().toISOString();
            }
            
            this.saveToLocalStorage();
            this.render();
            this.showMessage('任务更新成功！', 'success');
        }
    }

    toggleStar(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.starred = !todo.starred;
            this.saveToLocalStorage();
            this.render();
            this.updateStats();
            this.showMessage(todo.starred ? '任务已标记为重要！' : '任务已取消重要标记！', 'success');
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
            case 'starred':
                return this.todos.filter(t => t.starred);
            case 'not-started':
                return this.todos.filter(t => !t.completed && !t.startedAt && t.startTime && new Date(t.startTime) > new Date());
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
            <li class="todo-item ${todo.completed ? 'completed' : ''} ${todo.starred ? 'starred' : ''} ${!todo.completed && !todo.startedAt && todo.startTime && new Date(todo.startTime) > new Date() ? 'not-started' : ''}" data-id="${todo.id}">
                <div class="todo-header">
                    <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} 
                           onchange="app.toggleTodo(${todo.id})">
                    <button class="star-btn ${todo.starred ? 'starred' : ''}" onclick="app.toggleStar(${todo.id})">
                        <i class="${todo.starred ? 'fas' : 'far'} fa-star"></i>
                    </button>
                </div>
                <div class="todo-content">
                    <span class="todo-text">${this.escapeHtml(todo.text)}</span>
                    <div class="todo-details">
                        ${todo.startTime ? `<div class="todo-detail"><i class="fas fa-play-circle"></i> 开始: ${this.formatDate(todo.startTime)}</div>` : ''}
                        ${todo.deadline ? `<div class="todo-detail"><i class="fas fa-calendar-alt"></i> 截止: ${this.formatDate(todo.deadline)}</div>` : ''}
                        ${todo.reminder ? `<div class="todo-detail"><i class="fas fa-bell"></i> 提醒: ${this.formatDate(todo.reminder)}</div>` : ''}
                        ${todo.location ? `<div class="todo-detail"><i class="fas fa-map-marker-alt"></i> 地点: ${this.escapeHtml(todo.location)}</div>` : ''}
                        ${todo.completed ? `<div class="todo-detail"><i class="fas fa-clock"></i> 已用: ${todo.timeUsed}</div>` : ''}
                        ${!todo.completed && !todo.startedAt && todo.startTime && new Date(todo.startTime) > new Date() ? '<div class="todo-detail status-not-started"><i class="fas fa-clock"></i> 未开始</div>' : ''}
                        ${!todo.completed && todo.startedAt ? '<div class="todo-detail status-in-progress"><i class="fas fa-spinner"></i> 进行中</div>' : ''}
                    </div>
                </div>
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
        const contentElement = todoElement.querySelector('.todo-content');
        
        // 格式化日期用于输入框
        const formatDateForInput = (dateString) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toISOString().slice(0, 16);
        };

        // 创建编辑界面
        contentElement.innerHTML = `
            <div class="edit-form">
                <div class="edit-field">
                    <label>任务内容:</label>
                    <input type="text" class="edit-input" value="${this.escapeHtml(todo.text)}" 
                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 10px;">
                </div>
                <div class="edit-field">
                    <label>开始时间:</label>
                    <input type="datetime-local" class="edit-start-time" value="${formatDateForInput(todo.startTime)}" 
                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 10px;">
                </div>
                <div class="edit-field">
                    <label>截止时间:</label>
                    <input type="datetime-local" class="edit-deadline" value="${formatDateForInput(todo.deadline)}" 
                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 10px;">
                </div>
                <div class="edit-field">
                    <label>提醒时间:</label>
                    <input type="datetime-local" class="edit-reminder" value="${formatDateForInput(todo.reminder)}" 
                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 10px;">
                </div>
                <div class="edit-field">
                    <label>交付地点:</label>
                    <input type="text" class="edit-location" value="${this.escapeHtml(todo.location || '')}" 
                           placeholder="输入交付地点..."
                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 10px;">
                </div>
                <div class="edit-field">
                    <label>重要任务:</label>
                    <div class="edit-starred">
                        <input type="checkbox" class="edit-starred-checkbox" ${todo.starred ? 'checked' : ''}>
                        <label class="edit-starred-label">标记为重要任务</label>
                    </div>
                </div>
                <div class="edit-field">
                    <label>已用时间:</label>
                    <input type="text" class="edit-time-used" value="${todo.completed ? todo.timeUsed + ' (自动计算)' : '未完成'}" 
                           readonly
                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 10px; background-color: #f5f5f5; color: #666;">
                </div>
                <div class="edit-actions" style="margin-top: 10px;">
                    <button class="save-btn" style="padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; margin-right: 10px;">保存</button>
                    <button class="cancel-btn" style="padding: 8px 16px; background: #999; color: white; border: none; border-radius: 4px;">取消</button>
                </div>
            </div>
        `;

        const textInput = contentElement.querySelector('.edit-input');
        textInput.focus();
        textInput.select();

        // 保存事件
        contentElement.querySelector('.save-btn').addEventListener('click', () => {
            this.editTodo(id, textInput.value, 
                         contentElement.querySelector('.edit-start-time').value,
                         contentElement.querySelector('.edit-deadline').value, 
                         contentElement.querySelector('.edit-reminder').value,
                         contentElement.querySelector('.edit-location').value,
                         contentElement.querySelector('.edit-starred-checkbox').checked.toString());
        });

        // 取消事件
        contentElement.querySelector('.cancel-btn').addEventListener('click', () => {
            this.render();
        });

        // 回车保存
        textInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.editTodo(id, textInput.value, 
                             contentElement.querySelector('.edit-start-time').value,
                             contentElement.querySelector('.edit-deadline').value, 
                             contentElement.querySelector('.edit-reminder').value,
                             contentElement.querySelector('.edit-location').value,
                             contentElement.querySelector('.edit-starred-checkbox').checked.toString());
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

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = date.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // 如果是今天，显示时间
        if (date.toDateString() === now.toDateString()) {
            return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        }
        
        // 如果是明天
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (date.toDateString() === tomorrow.toDateString()) {
            return `明天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        }
        
        // 如果是昨天
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        }
        
        // 显示相对天数
        if (diffDays > 0 && diffDays <= 7) {
            return `${diffDays}天后 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        }
        
        // 默认格式
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
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

    startReminderCheck() {
        // 每分钟检查一次提醒
        setInterval(() => {
            this.checkReminders();
        }, 60000); // 1分钟
        
        // 立即检查一次
        this.checkReminders();
    }

    checkReminders() {
        const now = new Date();
        const remindedTasks = JSON.parse(localStorage.getItem('remindedTasks') || '[]');
        
        this.todos.forEach(todo => {
            if (todo.reminder && !todo.completed) {
                const reminderTime = new Date(todo.reminder);
                const timeDiff = reminderTime.getTime() - now.getTime();
                
                // 如果提醒时间在5分钟内且尚未提醒过
                if (timeDiff <= 300000 && timeDiff > 0 && !remindedTasks.includes(todo.id)) {
                    this.showReminder(todo);
                    remindedTasks.push(todo.id);
                    localStorage.setItem('remindedTasks', JSON.stringify(remindedTasks));
                }
            }
            
            // 检查截止时间提醒（提前1小时）
            if (todo.deadline && !todo.completed) {
                const deadlineTime = new Date(todo.deadline);
                const timeDiff = deadlineTime.getTime() - now.getTime();
                
                // 如果截止时间在1小时内且尚未提醒过
                if (timeDiff <= 3600000 && timeDiff > 0 && !remindedTasks.includes(`deadline-${todo.id}`)) {
                    this.showDeadlineReminder(todo);
                    remindedTasks.push(`deadline-${todo.id}`);
                    localStorage.setItem('remindedTasks', JSON.stringify(remindedTasks));
                }
            }
        });
    }

    showReminder(todo) {
        const reminderDiv = document.createElement('div');
        reminderDiv.className = 'reminder-message';
        reminderDiv.innerHTML = `
            <div class="reminder-content">
                <i class="fas fa-bell"></i>
                <div class="reminder-text">
                    <strong>提醒：${this.escapeHtml(todo.text)}</strong>
                    <p>提醒时间：${this.formatDate(todo.reminder)}</p>
                </div>
                <button class="reminder-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        reminderDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
            color: #8b6914;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(255, 215, 0, 0.3);
            z-index: 1001;
            max-width: 400px;
            animation: slideInDown 0.5s ease;
            border-left: 4px solid #ffa500;
        `;

        document.body.appendChild(reminderDiv);

        // 添加动画样式
        if (!document.querySelector('#reminderStyles')) {
            const style = document.createElement('style');
            style.id = 'reminderStyles';
            style.textContent = `
                @keyframes slideInDown {
                    from { transform: translate(-50%, -100%); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }

        // 10秒后自动消失
        setTimeout(() => {
            if (reminderDiv.parentElement) {
                reminderDiv.style.animation = 'slideOutUp 0.5s ease forwards';
                setTimeout(() => reminderDiv.remove(), 500);
            }
        }, 10000);
    }

    showDeadlineReminder(todo) {
        const reminderDiv = document.createElement('div');
        reminderDiv.className = 'deadline-reminder';
        reminderDiv.innerHTML = `
            <div class="reminder-content">
                <i class="fas fa-exclamation-triangle"></i>
                <div class="reminder-text">
                    <strong>截止提醒：${this.escapeHtml(todo.text)}</strong>
                    <p>截止时间：${this.formatDate(todo.deadline)}</p>
                    <p class="warning">距离截止时间还有不到1小时！</p>
                </div>
                <button class="reminder-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        reminderDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(255, 107, 107, 0.3);
            z-index: 1001;
            max-width: 400px;
            animation: slideInDown 0.5s ease;
            border-left: 4px solid #ff4757;
        `;

        document.body.appendChild(reminderDiv);

        // 10秒后自动消失
        setTimeout(() => {
            if (reminderDiv.parentElement) {
                reminderDiv.style.animation = 'slideOutUp 0.5s ease forwards';
                setTimeout(() => reminderDiv.remove(), 500);
            }
        }, 10000);
    }
}

// 初始化应用
const app = new TodoApp();

// 只在首次访问且本地无数据时添加示例数据
if (!localStorage.getItem('hasSeenDemo')) {
    if (app.todos.length === 0) {
        const sampleTodos = [
            { id: 1, text: '欢迎使用 To-Do List 应用！', completed: false, createdAt: new Date().toISOString(), startedAt: new Date().toISOString(), completedAt: null, deadline: null, location: null, timeUsed: '00:00:00' },
            { id: 2, text: '点击复选框标记任务完成', completed: false, createdAt: new Date().toISOString(), startedAt: new Date().toISOString(), completedAt: null, deadline: null, location: null, timeUsed: '00:00:00' },
            { id: 3, text: '使用筛选功能查看不同状态的任务', completed: true, createdAt: new Date().toISOString(), startedAt: new Date().toISOString(), completedAt: new Date().toISOString(), deadline: null, location: null, timeUsed: '00:00:00' }
        ];
        app.todos = sampleTodos;
        app.saveToLocalStorage();
        app.render();
        app.updateStats();
    }
    localStorage.setItem('hasSeenDemo', 'true');
}
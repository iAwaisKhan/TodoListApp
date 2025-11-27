let todos = [];
let currentFilter = 'all';
let currentPriority = 'low';
let searchQuery = '';
let currentSort = 'date'; // date, priority, alphabetical
let undoStack = [];
let redoStack = [];
const MAX_UNDO_STACK = 50;
let userName = '';

// Initialize app
function initializeApp() {
    loadUserName();
    updateClock();
    loadTodos();
    updateGreeting();
    
    // Update clock every second
    setInterval(updateClock, 1000);
    
    // Update greeting every minute
    setInterval(updateGreeting, 60000);
}

// Load user name from localStorage
function loadUserName() {
    userName = localStorage.getItem('userName') || '';
    updateUserDisplay();
}

// Save user name to localStorage
function saveUserName(name) {
    userName = name.trim();
    localStorage.setItem('userName', userName);
    updateUserDisplay();
    updateGreeting();
}

// Update user display
function updateUserDisplay() {
    const userNameElement = document.getElementById('userName');
    if (userName) {
        userNameElement.textContent = userName;
        userNameElement.style.cursor = 'pointer';
    } else {
        userNameElement.textContent = 'Click to set name';
        userNameElement.style.cursor = 'pointer';
    }
}

// Edit user name
function editUserName() {
    const userNameElement = document.getElementById('userName');
    const currentName = userName || '';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'user-name-input';
    input.value = currentName;
    input.placeholder = 'Enter your name';
    
    userNameElement.replaceWith(input);
    input.focus();
    input.select();
    
    const saveEdit = () => {
        const newName = input.value.trim();
        const newElement = document.createElement('div');
        newElement.id = 'userName';
        newElement.className = 'user-name';
        newElement.onclick = editUserName;
        
        input.replaceWith(newElement);
        
        if (newName) {
            saveUserName(newName);
            showNotification('Name updated!', 'success');
        } else {
            updateUserDisplay();
        }
    };
    
    input.addEventListener('blur', saveEdit);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveEdit();
        }
    });
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const newElement = document.createElement('div');
            newElement.id = 'userName';
            newElement.className = 'user-name';
            newElement.onclick = editUserName;
            input.replaceWith(newElement);
            updateUserDisplay();
        }
    });
}

// Update digital clock
function updateClock() {
    const now = new Date();
    
    // Update time
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeString = `${hours}:${minutes}:${seconds}`;
    
    const clockElement = document.getElementById('digitalClock');
    if (clockElement) {
        clockElement.textContent = timeString;
    }
    
    // Update date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateString = now.toLocaleDateString('en-US', options);
    
    const dateElement = document.getElementById('clockDate');
    if (dateElement) {
        dateElement.textContent = dateString;
    }
}

// Update greeting based on time of day
function updateGreeting() {
    const now = new Date();
    const hour = now.getHours();
    let greeting = '';
    
    if (hour >= 5 && hour < 12) {
        greeting = 'Good Morning';
    } else if (hour >= 12 && hour < 17) {
        greeting = 'Good Afternoon';
    } else if (hour >= 17 && hour < 22) {
        greeting = 'Good Evening';
    } else {
        greeting = 'Good Night';
    }
    
    if (userName) {
        greeting += `, ${userName}!`;
    } else {
        greeting += '!';
    }
    
    const greetingElement = document.getElementById('userGreeting');
    if (greetingElement) {
        greetingElement.textContent = greeting;
    }
}

// Load todos from localStorage on page load
function loadTodos() {
    const saved = localStorage.getItem('todos');
    if (saved) {
        try {
            todos = JSON.parse(saved);
            renderTodos();
        } catch (e) {
            console.error('Error loading todos:', e);
            todos = [];
        }
    }
}

// Save todos to localStorage
function saveTodos() {
    try {
        localStorage.setItem('todos', JSON.stringify(todos));
    } catch (e) {
        console.error('Error saving todos:', e);
    }
}

// Save state for undo functionality
function saveState() {
    undoStack.push(JSON.stringify(todos));
    if (undoStack.length > MAX_UNDO_STACK) {
        undoStack.shift();
    }
    redoStack = []; // Clear redo stack on new action
}

// Undo last action
function undo() {
    if (undoStack.length === 0) return;
    
    redoStack.push(JSON.stringify(todos));
    const previousState = undoStack.pop();
    todos = JSON.parse(previousState);
    saveTodos();
    renderTodos();
    showNotification('Action undone', 'info');
}

// Redo last undone action
function redo() {
    if (redoStack.length === 0) return;
    
    undoStack.push(JSON.stringify(todos));
    const nextState = redoStack.pop();
    todos = JSON.parse(nextState);
    saveTodos();
    renderTodos();
    showNotification('Action redone', 'info');
}

// Show notification toast
function showNotification(message, type = 'success') {
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Sort todos
function sortTodos(todos) {
    const sorted = [...todos];
    
    switch (currentSort) {
        case 'priority':
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            sorted.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
            break;
        case 'alphabetical':
            sorted.sort((a, b) => a.text.localeCompare(b.text));
            break;
        case 'date':
        default:
            sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
    }
    
    return sorted;
}

// Change sort order
function changeSort(sortType) {
    currentSort = sortType;
    document.querySelectorAll('.sort-option').forEach(opt => {
        opt.classList.remove('active');
    });
    document.querySelector(`[data-sort="${sortType}"]`)?.classList.add('active');
    renderTodos();
    showNotification(`Sorted by ${sortType}`, 'info');
}

// Select priority
function selectPriority(priority) {
    currentPriority = priority;
    document.querySelectorAll('.priority-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    document.querySelector(`[data-priority="${priority}"]`).classList.add('selected');
}

// Add new task
function addTask() {
    const input = document.getElementById('taskInput');
    const text = input.value.trim();

    if (text === '') {
        input.style.borderColor = 'var(--color-danger)';
        input.animate([
            { transform: 'translateX(-10px)' },
            { transform: 'translateX(10px)' },
            { transform: 'translateX(-10px)' },
            { transform: 'translateX(10px)' },
            { transform: 'translateX(0)' }
        ], {
            duration: 400,
            easing: 'ease-in-out'
        });
        setTimeout(() => {
            input.style.borderColor = '';
        }, 500);
        return;
    }

    saveState();

    const todo = {
        id: Date.now(),
        text: text,
        completed: false,
        priority: currentPriority,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    todos.unshift(todo);
    input.value = '';
    selectPriority('low'); // Reset to low priority
    saveTodos();
    renderTodos();

    // Show success feedback
    input.style.borderColor = 'var(--color-success)';
    setTimeout(() => {
        input.style.borderColor = '';
    }, 500);
    
    showNotification('Task added successfully!', 'success');
}

// Toggle task completion
function toggleTask(id) {
    saveState();
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        todo.updatedAt = new Date().toISOString();
        saveTodos();
        renderTodos();
        showNotification(todo.completed ? 'Task completed!' : 'Task reopened', 'success');
    }
}

// Delete task with animation
function deleteTask(id) {
    const element = document.querySelector(`[data-id="${id}"]`);
    if (!element) return;
    
    saveState();
    element.classList.add('removing');
    
    setTimeout(() => {
        todos = todos.filter(t => t.id !== id);
        saveTodos();
        renderTodos();
        showNotification('Task deleted', 'info');
    }, 300);
}

// Duplicate task
function duplicateTask(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    
    saveState();
    const newTodo = {
        ...todo,
        id: Date.now(),
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        text: `${todo.text} (Copy)`
    };
    
    todos.unshift(newTodo);
    saveTodos();
    renderTodos();
    showNotification('Task duplicated', 'success');
}

// Edit task
function editTask(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    const element = document.querySelector(`[data-id="${id}"]`);
    element.classList.add('editing');
    
    const input = element.querySelector('.edit-input');
    input.value = todo.text;
    input.focus();
    input.select();
    
    // Save on Enter, cancel on Escape
    input.onkeydown = (e) => {
        if (e.key === 'Enter') {
            saveEdit(id, input.value);
        } else if (e.key === 'Escape') {
            element.classList.remove('editing');
        }
    };
    
    // Save on blur
    input.onblur = () => {
        saveEdit(id, input.value);
    };
}

// Save edited task
function saveEdit(id, newText) {
    const text = newText.trim();
    if (text === '') return;

    saveState();
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.text = text;
        todo.updatedAt = new Date().toISOString();
        saveTodos();
        renderTodos();
        showNotification('Task updated', 'success');
    }
}

// Change task priority
function changePriority(id) {
    saveState();
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    const priorities = ['low', 'medium', 'high'];
    const currentIndex = priorities.indexOf(todo.priority);
    const nextIndex = (currentIndex + 1) % priorities.length;
    todo.priority = priorities[nextIndex];
    todo.updatedAt = new Date().toISOString();
    
    saveTodos();
    renderTodos();
    showNotification(`Priority changed to ${todo.priority}`, 'info');
}

// Clear completed tasks
function clearCompleted() {
    if (todos.filter(t => t.completed).length === 0) {
        showNotification('No completed tasks to clear', 'info');
        return;
    }

    saveState();
    const completedElements = document.querySelectorAll('.todo-item.completed');
    completedElements.forEach(el => el.classList.add('removing'));
    
    setTimeout(() => {
        const count = todos.filter(t => t.completed).length;
        todos = todos.filter(t => !t.completed);
        saveTodos();
        renderTodos();
        showNotification(`${count} completed task${count > 1 ? 's' : ''} cleared`, 'success');
    }, 300);
}

// Delete all tasks
function deleteAllTasks() {
    if (todos.length === 0) {
        showNotification('No tasks to delete', 'info');
        return;
    }

    if (!confirm('Are you sure you want to delete all tasks? This cannot be undone.')) {
        return;
    }

    saveState();
    const count = todos.length;
    todos = [];
    saveTodos();
    renderTodos();
    showNotification(`All ${count} task${count > 1 ? 's' : ''} deleted`, 'info');
}

// Export todos to JSON
function exportTodos() {
    if (todos.length === 0) {
        showNotification('No tasks to export', 'info');
        return;
    }

    const dataStr = JSON.stringify(todos, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `todos-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification('Tasks exported successfully', 'success');
}

// Import todos from JSON
function importTodos(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedTodos = JSON.parse(e.target.result);
            if (!Array.isArray(importedTodos)) {
                throw new Error('Invalid format');
            }

            saveState();
            todos = [...todos, ...importedTodos];
            saveTodos();
            renderTodos();
            showNotification(`${importedTodos.length} task${importedTodos.length > 1 ? 's' : ''} imported`, 'success');
        } catch (error) {
            showNotification('Failed to import tasks. Invalid file format.', 'error');
        }
    };
    reader.readAsText(file);
}

// Set filter
function setFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
    renderTodos();
}

// Filter todos based on search and filter
function filterTodos() {
    searchQuery = document.getElementById('searchInput').value.toLowerCase();
    renderTodos();
}

// Debounce function for search
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

// Get filtered todos
function getFilteredTodos() {
    let filtered = [...todos];

    // Apply filter
    if (currentFilter === 'active') {
        filtered = filtered.filter(t => !t.completed);
    } else if (currentFilter === 'completed') {
        filtered = filtered.filter(t => t.completed);
    } else if (currentFilter === 'high' || currentFilter === 'medium' || currentFilter === 'low') {
        filtered = filtered.filter(t => t.priority === currentFilter);
    }

    // Apply search
    if (searchQuery) {
        filtered = filtered.filter(t => t.text.toLowerCase().includes(searchQuery));
    }

    // Apply sort
    filtered = sortTodos(filtered);

    return filtered;
}

// Update statistics
function updateStats() {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const active = total - completed;
    const high = todos.filter(t => t.priority === 'high').length;
    const medium = todos.filter(t => t.priority === 'medium').length;
    const low = todos.filter(t => t.priority === 'low').length;

    document.getElementById('totalTasks').textContent = total;
    document.getElementById('activeTasks').textContent = active;
    document.getElementById('completedTasks').textContent = completed;
    
    // Update progress bar if exists
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        const percentage = total > 0 ? (completed / total) * 100 : 0;
        progressBar.style.width = `${percentage}%`;
    }
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
}

// Render all todos
function renderTodos() {
    const todoList = document.getElementById('todoList');
    const filteredTodos = getFilteredTodos();
    
    if (todos.length === 0) {
        todoList.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 11l3 3L22 4"></path>
                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
                </svg>
                <p>No tasks yet. Add one to get started!</p>
            </div>
        `;
        updateStats();
        return;
    }

    if (filteredTodos.length === 0) {
        todoList.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="M21 21l-4.35-4.35"></path>
                </svg>
                <p>No tasks match your filter or search.</p>
            </div>
        `;
        updateStats();
        return;
    }

    todoList.innerHTML = filteredTodos.map(todo => `
        <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}" draggable="true">
            <div class="drag-handle" title="Drag to reorder">⋮⋮</div>
            <div class="checkbox-wrapper">
                <div class="checkbox ${todo.completed ? 'checked' : ''}" onclick="toggleTask(${todo.id})"></div>
            </div>
            <div class="todo-content">
                <div class="todo-text">${escapeHtml(todo.text)}</div>
                <div class="todo-meta">
                    <span class="todo-date">${formatDate(todo.createdAt)}</span>
                </div>
            </div>
            <input type="text" class="edit-input" value="${escapeHtml(todo.text)}">
            <span class="priority-badge priority-${todo.priority}">${todo.priority}</span>
            <div class="action-buttons">
                <button class="edit-btn" onclick="editTask(${todo.id})" title="Edit task">✏️</button>
                <button class="duplicate-btn" onclick="duplicateTask(${todo.id})" title="Duplicate task">📋</button>
                <button class="priority-btn" onclick="changePriority(${todo.id})" title="Change priority">🔄</button>
                <button class="delete-btn" onclick="deleteTask(${todo.id})" title="Delete task">🗑️</button>
            </div>
        </div>
    `).join('');

    updateStats();
    initDragAndDrop();
}

// Initialize drag and drop
function initDragAndDrop() {
    const todoItems = document.querySelectorAll('.todo-item');
    let draggedItem = null;

    todoItems.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragend', handleDragEnd);
    });
}

function handleDragStart(e) {
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    
    const draggingItem = document.querySelector('.dragging');
    const siblings = [...this.parentNode.children].filter(child => 
        child !== draggingItem && child.classList.contains('todo-item')
    );
    
    const nextSibling = siblings.find(sibling => {
        const box = sibling.getBoundingClientRect();
        const offset = e.clientY - box.top - box.height / 2;
        return offset < 0;
    });
    
    this.parentNode.insertBefore(draggingItem, nextSibling);
    
    return false;
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    return false;
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    
    // Update todos array based on new order
    const todoList = document.getElementById('todoList');
    const items = [...todoList.querySelectorAll('.todo-item')];
    const newOrder = items.map(item => parseInt(item.dataset.id));
    
    todos.sort((a, b) => newOrder.indexOf(a.id) - newOrder.indexOf(b.id));
    saveTodos();
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Z for undo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
    }
    // Ctrl/Cmd + Shift + Z for redo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
    }
    // Ctrl/Cmd + K for search focus
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('searchInput').focus();
    }
    // Ctrl/Cmd + N for new task
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        document.getElementById('taskInput').focus();
    }
});

// Allow adding task with Enter key
document.getElementById('taskInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});

// Debounced search
const debouncedFilter = debounce(filterTodos, 300);
document.getElementById('searchInput').addEventListener('input', debouncedFilter);

// Auto-save functionality
setInterval(() => {
    saveTodos();
}, 30000); // Auto-save every 30 seconds

// Create shooting stars
function createShootingStar() {
    const star = document.createElement('div');
    star.className = 'shooting-star';
    star.style.top = Math.random() * 50 + '%';
    star.style.left = Math.random() * 100 + '%';
    star.style.animationDelay = Math.random() * 3 + 's';
    document.body.appendChild(star);
    
    setTimeout(() => star.remove(), 3000);
}

// Generate shooting stars periodically
setInterval(createShootingStar, 4000);

// Initialize app on page load
initializeApp();

// Create initial shooting stars
for (let i = 0; i < 3; i++) {
    setTimeout(() => createShootingStar(), i * 1000);
}

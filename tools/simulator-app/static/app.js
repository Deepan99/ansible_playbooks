let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  fetchStats();
  fetchItems();

  const form = document.getElementById('createForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await createItem();
  });
});

async function fetchStats() {
  try {
    const res = await fetch('/api/stats');
    if (!res.ok) return;
    const stats = await res.json();
    document.getElementById('stat-total').innerText = stats.total_items;
    document.getElementById('stat-completed').innerText = stats.completed_items;
    document.getElementById('stat-pending').innerText = stats.pending_items;
  } catch (err) {
    console.error('Failed to fetch stats:', err);
  }
}

async function fetchItems() {
  try {
    let url = '/api/items';
    if (currentFilter === 'pending') url += '?completed=false';
    if (currentFilter === 'completed') url += '?completed=true';

    const res = await fetch(url);
    if (!res.ok) throw new Error('Network response was not ok');
    const items = await res.json();
    renderItems(items);
  } catch (err) {
    console.error('Failed to fetch items:', err);
    document.getElementById('itemList').innerHTML = `
      <div class="empty-state">Failed to connect to FastAPI backend. Ensure server is running on http://localhost:8000</div>
    `;
  }
}

function renderItems(items) {
  const container = document.getElementById('itemList');
  document.getElementById('items-count').innerText = `${items.length} items shown`;

  if (items.length === 0) {
    container.innerHTML = `<div class="empty-state">No items found for this filter.</div>`;
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="item-card ${item.completed ? 'completed' : ''}" id="item-${item.id}">
      <input 
        type="checkbox" 
        class="checkbox-custom" 
        ${item.completed ? 'checked' : ''} 
        onchange="toggleItemStatus(${item.id}, this.checked)"
      />
      <div class="item-content">
        <div class="item-header">
          <span class="item-title">${escapeHtml(item.title)}</span>
          <button class="btn-delete" onclick="deleteItem(${item.id})" title="Delete item">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
        ${item.description ? `<div class="item-desc">${escapeHtml(item.description)}</div>` : ''}
        <div class="item-meta">
          <span class="badge badge-priority-${item.priority}">${item.priority}</span>
          <span class="badge badge-cat">${escapeHtml(item.category)}</span>
          <span style="color: var(--text-muted); margin-left: auto;">ID: #${item.id} • ${item.created_at}</span>
        </div>
      </div>
    </div>
  `).join('');
}

async function createItem() {
  const title = document.getElementById('title').value.trim();
  const description = document.getElementById('description').value.trim();
  const category = document.getElementById('category').value;
  const priority = document.getElementById('priority').value;

  if (!title) return;

  try {
    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, category, priority, completed: false })
    });

    if (res.ok) {
      document.getElementById('createForm').reset();
      fetchItems();
      fetchStats();
    }
  } catch (err) {
    console.error('Error creating item:', err);
  }
}

async function toggleItemStatus(id, completed) {
  try {
    const res = await fetch(`/api/items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed })
    });

    if (res.ok) {
      fetchItems();
      fetchStats();
    }
  } catch (err) {
    console.error('Error updating item:', err);
  }
}

async function deleteItem(id) {
  if (!confirm('Are you sure you want to delete this item?')) return;

  try {
    const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchItems();
      fetchStats();
    }
  } catch (err) {
    console.error('Error deleting item:', err);
  }
}

function setFilter(filter) {
  currentFilter = filter;
  document.querySelectorAll('.filter-chip').forEach(btn => {
    btn.classList.toggle('active', btn.innerText.toLowerCase() === filter);
  });
  fetchItems();
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

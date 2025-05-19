document.addEventListener('DOMContentLoaded', () => {
	const loadQueues = async (page = 1, q = '') => {
		const errorMessage = document.getElementById('errorMessage');
		const queueList = document.getElementById('queueList');
		const pagination = document.getElementById('pagination');
		try {
			console.log(`Fetching queues: page=${page}, q=${q}`); // Debug log
			const response = await fetch(`/queues?page=${page}&limit=10&q=${encodeURIComponent(q)}`);
			console.log('Response status:', response.status); // Debug log
			const data = await response.json();
			console.log('API response:', data); // Debug log
	
			if (!data.success) throw new Error(data.error || 'Failed to fetch queues');
	
			queueList.innerHTML = '';
			if (data.data.queues.length === 0) {
			queueList.innerHTML = '<li class="empty-state">Немає черг для відображення</li>';
			} else {
			data.data.queues.forEach(queue => {
				const li = document.createElement('li');
				const a = document.createElement('a');
				a.href = `/queue.html?id=${queue.id}`;
				a.textContent = queue.name;
				li.appendChild(a);
				queueList.appendChild(li);
			});
			}
	
			pagination.innerHTML = '';
			if (data.data.totalPages > 1) {
			const prev = document.createElement('a');
			prev.href = '#';
			prev.textContent = 'Попередня';
			prev.className = page === 1 ? 'disabled' : '';
			prev.addEventListener('click', (e) => {
				e.preventDefault();
				if (page > 1) loadQueues(page - 1, q);
			});
			pagination.appendChild(prev);
	
			for (let i = Math.max(1, page - 2); i <= Math.min(data.data.totalPages, page + 2); i++) {
				const a = document.createElement('a');
				a.href = '#';
				a.textContent = i;
				a.className = i === page ? 'active' : '';
				a.addEventListener('click', (e) => {
				e.preventDefault();
				loadQueues(i, q);
				});
				pagination.appendChild(a);
			}
	
			const next = document.createElement('a');
			next.href = '#';
			next.textContent = 'Наступна';
			next.className = page === data.data.totalPages ? 'disabled' : '';
			next.addEventListener('click', (e) => {
				e.preventDefault();
				if (page < data.data.totalPages) loadQueues(page + 1, q);
			});
			pagination.appendChild(next);
			}
		} catch (error) {
			console.error('Error in loadQueues:', error); // Debug log
			errorMessage.textContent = error.message;
		}
		};
	
		const searchForm = document.getElementById('searchForm');
		if (searchForm) {
		searchForm.addEventListener('submit', (e) => {
			e.preventDefault();
			const q = document.getElementById('searchInput').value;
			loadQueues(1, q);
		});
		}
	
		const createForm = document.getElementById('createForm');
		if (createForm) {
		createForm.addEventListener('submit', async (e) => {
			e.preventDefault();
			const name = e.target.name.value;
			const ownerId = e.target.ownerId.value;
			const errorMessage = document.getElementById('errorMessage');
			try {
			const response = await fetch('/queues', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, ownerId }),
			});
			const data = await response.json();
			if (data.success) {
				alert('Чергу створено успішно');
				e.target.name.value = '';
				e.target.ownerId.value = '';
				loadQueues();
			} else {
				throw new Error(data.error);
			}
			} catch (error) {
			errorMessage.textContent = error.message;
			}
		});
		}
	
		const loadQueue = async (id) => {
		const errorMessage = document.getElementById('errorMessage');
		const queueName = document.getElementById('queueName');
		const ownerInfo = document.getElementById('ownerInfo');
		const statusInfo = document.getElementById('statusInfo');
		const queueList = document.getElementById('queueList');
		const joinForm = document.getElementById('joinForm');
		const closeForm = document.getElementById('closeForm');
		const moveForm = document.getElementById('moveForm');
		try {
			const response = await fetch(`/queues/${id}`);
			const data = await response.json();
			if (!data.success) throw new Error(data.error);
	
			const queue = data.data.queue;
			const owner = data.data.owner;
			const queueListData = data.data.queue_list;
	
			queueName.textContent = queue.name;
			ownerInfo.textContent = `Власник: ${owner?.name || 'Невідомо'}`;
			statusInfo.textContent = `Статус: ${queue.is_closed ? 'Закрита' : 'Відкрита'}`;
			queueList.innerHTML = '';
			queueListData.forEach(user => {
			const li = document.createElement('li');
			li.textContent = user.name;
			queueList.appendChild(li);
			});
	
			if (!queue.is_closed) {
			joinForm.style.display = 'flex';
			closeForm.style.display = 'flex';
			moveForm.style.display = 'flex';
			} else {
			joinForm.style.display = 'none';
			closeForm.style.display = 'none';
			moveForm.style.display = 'none';
			}
		} catch (error) {
			errorMessage.textContent = error.message;
		}
		};
	
		const joinForm = document.getElementById('joinForm');
		if (joinForm) {
		joinForm.addEventListener('submit', async (e) => {
			e.preventDefault();
			const urlParams = new URLSearchParams(window.location.search);
			const id = urlParams.get('id');
			const userId = e.target.userId.value;
			const errorMessage = document.getElementById('errorMessage');
			try {
			const response = await fetch(`/queues/${id}/join`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId }),
			});
			const data = await response.json();
			if (data.success) {
				alert('Успішно приєднано до черги');
				window.location.reload();
			} else {
				throw new Error(data.error);
			}
			} catch (error) {
			errorMessage.textContent = error.message;
			}
		});
		}
	
		const nextForm = document.getElementById('nextForm');
		if (nextForm) {
		nextForm.addEventListener('submit', async (e) => {
			e.preventDefault();
			const urlParams = new URLSearchParams(window.location.search);
			const id = urlParams.get('id');
			const ownerId = e.target.ownerId.value;
			const errorMessage = document.getElementById('errorMessage');
			try {
			const response = await fetch(`/queues/${id}/next`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ownerId }),
			});
			const data = await response.json();
			if (data.success) {
				alert('Наступний користувач просунений');
				window.location.reload();
			} else {
				throw new Error(data.error);
			}
			} catch (error) {
			errorMessage.textContent = error.message;
			}
		});
		}
	
		const closeForm = document.getElementById('closeForm');
		if (closeForm) {
		closeForm.addEventListener('submit', async (e) => {
			e.preventDefault();
			const urlParams = new URLSearchParams(window.location.search);
			const id = urlParams.get('id');
			const ownerId = e.target.ownerId.value;
			const errorMessage = document.getElementById('errorMessage');
			try {
			const response = await fetch(`/queues/${id}/close`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ownerId }),
			});
			const data = await response.json();
			if (data.success) {
				alert('Чергу закрито');
				window.location.reload();
			} else {
				throw new Error(data.error);
			}
			} catch (error) {
			errorMessage.textContent = error.message;
			}
		});
		}
	
		const moveForm = document.getElementById('moveForm');
		if (moveForm) {
		moveForm.addEventListener('submit', async (e) => {
			e.preventDefault();
			const urlParams = new URLSearchParams(window.location.search);
			const id = urlParams.get('id');
			const ownerId = e.target.ownerId.value;
			const userId = e.target.userId.value;
			const errorMessage = document.getElementById('errorMessage');
			try {
			const response = await fetch(`/queues/${id}/move-to-front`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ownerId, userId }),
			});
			const data = await response.json();
			if (data.success) {
				alert('Користувача переміщено на початок');
				window.location.reload();
			} else {
				throw new Error(data.error);
			}
			} catch (error) {
			errorMessage.textContent = error.message;
			}
		});
		}
	
		const deleteForm = document.getElementById('deleteForm');
		if (deleteForm) {
		deleteForm.addEventListener('submit', async (e) => {
			e.preventDefault();
			const urlParams = new URLSearchParams(window.location.search);
			const id = urlParams.get('id');
			const ownerId = e.target.ownerId.value;
			const errorMessage = document.getElementById('errorMessage');
			try {
			const response = await fetch(`/queues/${id}/delete`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ownerId }),
			});
			const data = await response.json();
			if (data.success) {
				alert('Чергу видалено');
				window.location.href = '/';
			} else {
				throw new Error(data.error);
			}
			} catch (error) {
			errorMessage.textContent = error.message;
			}
		});
		}
	
		const loadPosition = async (queueId, userId) => {
		const errorMessage = document.getElementById('errorMessage');
		const positionInfo = document.getElementById('positionInfo');
		try {
			const response = await fetch(`/queues/${queueId}/my-position?userId=${userId}`);
			const data = await response.json();
			if (!data.success) throw new Error(data.error);
			positionInfo.textContent = `Ваша позиція: ${data.data.position}`;
		} catch (error) {
			errorMessage.textContent = error.message;
		}
		};
	
		const urlParams = new URLSearchParams(window.location.search);
		const queueId = urlParams.get('id');
		const userId = urlParams.get('userId');
	
		if (queueId && userId && document.getElementById('positionInfo')) {
		loadPosition(queueId, userId);
		} else if (queueId && document.getElementById('queueName')) {
		loadQueue(queueId);
		} else if (document.getElementById('queueList')) {
		loadQueues();
		}
});
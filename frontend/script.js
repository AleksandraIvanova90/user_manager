document.addEventListener('DOMContentLoaded', () => {
    const userTableBody = document.getElementById('userTableBody');
    const addUserForm = document.getElementById('addUserForm');
    const formMessage = document.getElementById('formMessage');
    const API_URL = 'http://127.0.0.1:5000'; 

    let userDetailModalInstance = null; 

    function showMessage(message, isError = false) {
        formMessage.innerHTML = `<div class="alert ${isError ? 'alert-danger' : 'alert-success'}" role="alert">${message}</div>`;
        setTimeout(() => {
            formMessage.innerHTML = '';
        }, 5000);
    }

    async function fetchUsers() {
        try {
            const response = await fetch(`${API_URL}/users`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const users = await response.json();
            renderUsers(users);
        } catch (error) {
            console.error('Ошибка при загрузке пользователей:', error);
            userTableBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Не удалось загрузить пользователей. ${error.message}</td></tr>`;
        }
    }

    function renderUsers(users) {
        userTableBody.innerHTML = ''; 
        if (users.length === 0) {
            userTableBody.innerHTML = '<tr><td colspan="4" class="text-center">Список пользователей пуст.</td></tr>';
            return;
        }

        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>
                    <button class="btn btn-sm btn-info view-details-btn"
                            data-bs-toggle="modal"
                            data-bs-target="#userDetailModal"
                            data-user-id="${user.id}">
                        Просмотр
                    </button>
                </td>
            `;
            userTableBody.appendChild(row);
        });
    }


    addUserForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const nameInput = document.getElementById('userName');
        const emailInput = document.getElementById('userEmail');

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();

        if (name && email) {
            try {
                const response = await fetch(`${API_URL}/users`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ name: name, email: email }),
                });

                const result = await response.json();

                if (!response.ok) {
                    const errorMessage = result.error || `HTTP error! status: ${response.status}`;
                    showMessage(errorMessage, true);
                    return;
                }

                showMessage(`Пользователь "${name}" успешно добавлен!`, false);
                nameInput.value = '';
                emailInput.value = '';
                fetchUsers();

            } catch (error) {
                console.error('Ошибка при добавлении пользователя:', error);
                showMessage(`Произошла ошибка: ${error.message}`, true);
            }
        } else {
            showMessage("Пожалуйста, заполните все поля.", true);
        }
    });

    async function fetchAndShowUserDetails(userId) {
        try {
            const response = await fetch(`${API_URL}/users/${userId}`);
            if (!response.ok) {
                 if (response.status === 404) {
                    throw new Error(`Пользователь с ID ${userId} не найден.`);
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const user = await response.json();

            const modalTitle = document.getElementById('userDetailModalLabel');
            const modalBodyContent = document.getElementById('modalBodyContent');

            modalTitle.textContent = `Детали пользователя: ${user.name}`;
            modalBodyContent.innerHTML = `
                <p><strong>ID:</strong> ${user.id}</p>
                <p><strong>Имя:</strong> ${user.name}</p>
                <p><strong>Email:</strong> ${user.email}</p>
            `;

        } catch (error) {
            console.error('Ошибка при загрузке деталей пользователя:', error);
            alert(`Ошибка: ${error.message}`);
        }
    }

    userTableBody.addEventListener('click', (event) => {
        if (event.target.classList.contains('view-details-btn')) {
            const userId = event.target.dataset.userId;
            fetchAndShowUserDetails(userId);
        }
    });

    fetchUsers(); 
});
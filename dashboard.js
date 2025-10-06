let currentUserRole = 'unauthorized';
let currentPermissions = [];

// التحقق من المستخدم وصلاحياته
fetch('/api/user')
  .then(res => res.json())
  .then(user => {
    document.getElementById('auth-status').innerText = `مرحباً ${user.username}`;
    fetch('/api/role')
      .then(res => res.json())
      .then(roleData => {
        currentUserRole = roleData.role;

        fetch('/api/permissions')
          .then(res => res.json())
          .then(data => {
            currentPermissions = data.permissions || [];

            if (currentUserRole !== 'unauthorized') {
              document.getElementById('welcome').style.display = 'block';
              document.getElementById('manual-login')?.style.display = 'none';
              document.getElementById('password-change')?.style.display = 'block';
            } else {
              document.getElementById('auth-status').innerText += ' | 🚫 لا تملك صلاحية الدخول';
            }
          });
      });
  });

// زر دخول إلى لوحة التحكم بعد الترحيب
function enterDashboard() {
  document.getElementById('welcome').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';

  loadDashboard();
  loadModules();
  if (currentPermissions.includes('view_ratings')) loadRatingChart();
  if (currentPermissions.includes('edit_config')) loadConfig();
  if (currentPermissions.includes('view_logs')) {
    loadStaffRatings();
    loadChangeLog();
  }
  if (currentPermissions.includes('manage_users')) {
    loadRoles();
    loadManualUsers();
  }
}

// تسجيل دخول يدوي
function manualLogin() {
  const username = document.getElementById('manualUsername').value.trim();
  const password = document.getElementById('manualPassword').value;
  fetch('/api/manual-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
    .then(res => res.json())
    .then(user => {
      document.getElementById('auth-status').innerText = `✅ مرحباً ${user.username}`;
      currentUserRole = user.role;
      document.getElementById('welcome').style.display = 'block';
      document.getElementById('manual-login').style.display = 'none';
      document.getElementById('password-change').style.display = 'block';
    })
    .catch(() => alert('❌ اسم المستخدم أو كلمة السر غير صحيحة'));
}

// تغيير كلمة السر
function changePassword() {
  const oldPassword = document.getElementById('oldPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  if (!oldPassword || !newPassword) return alert("⚠️ أدخل كل الحقول");

  fetch('/api/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oldPassword, newPassword })
  })
    .then(res => {
      if (res.status === 200) {
        alert('✅ تم تغيير كلمة السر بنجاح');
        document.getElementById('oldPassword').value = '';
        document.getElementById('newPassword').value = '';
      } else {
        alert('❌ كلمة السر الحالية غير صحيحة');
      }
    });
}

function loadModules() {
  fetch('/api/modules')
    .then(res => res.json())
    .then(modules => {
      const container = document.getElementById('modules');
      container.innerHTML = Object.entries(modules).map(([name, enabled]) => `
        <div class="card">
          🧩 <strong>${name}</strong>: 
          <select onchange="toggleModule('${name}', this.value)">
            <option value="true" ${enabled ? 'selected' : ''}>✅ مفعّل</option>
            <option value="false" ${!enabled ? 'selected' : ''}>❌ غير مفعّل</option>
          </select>
        </div>
      `).join('');
    });
}

function toggleModule(name, value) {
  fetch('/api/modules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ [name]: value === 'true' })
  }).then(() => {
    alert(`🔄 تم تحديث حالة ${name}`);
    loadModules();
  });
}


// تبديل الوضع المظلم/الفاتح
function toggleTheme() {
  document.body.classList.toggle('dark');
  localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
}

window.onload = () => {
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
  }
};

// إدارة المستخدمين اليدويين
function loadManualUsers() {
  fetch('/api/manual-users')
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById('manualUsersList');
      container.innerHTML = Object.entries(data.users).map(([username, info]) => `
        <div class="card">
          👤 <strong>${username}</strong><br>
          🛡️ الرتبة: ${info.role}<br>
          <button onclick="deleteManualUser('${username}')">🗑️ حذف</button>
        </div>
      `).join('');
    });
}

function addManualUser() {
  const username = document.getElementById('newUsername').value.trim();
  const password = document.getElementById('newPassword').value;
  const role = document.getElementById('newRole').value;
  if (!username || !password) return alert("⚠️ أدخل اسم وكلمة سر");

  fetch('/api/manual-users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, role })
  }).then(() => {
    alert('✅ تم إضافة المستخدم');
    loadManualUsers();
  });
}

function deleteManualUser(username) {
  fetch(`/api/manual-users/${username}`, { method: 'DELETE' })
    .then(() => {
      alert('🗑️ تم حذف المستخدم');
      loadManualUsers();
    });
}

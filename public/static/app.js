// Smart City BMS v4.0 - Modern Frontend
// Handles authentication, data persistence, and real-time updates

const API_BASE = '/api';
let currentUser = null;
let authToken = null;
let systemState = {
  time: 720,
  weather: 'sunny',
  windFlux: 0.5,
  bessMode: 'AUTO',
  bessCurrent: 2500,
  hospital: {
    gridActive: true,
    genActive: false,
    upsLevel: 100,
    upsState: 'STANDBY'
  },
  isPlaying: true,
  speed: 1
};

// Authentication functions
async function attemptLogin() {
  const username = document.getElementById('login-user').value;
  const password = document.getElementById('login-pass').value;
  
  if (!username || !password) {
    alert('Please enter both username and password');
    return;
  }
  
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      username,
      password
    });
    
    if (response.data.success) {
      currentUser = response.data.user;
      authToken = response.data.token;
      
      // Store token in localStorage for persistence
      localStorage.setItem('auth-token', authToken);
      
      // Hide login screen and show app
      document.getElementById('login-screen').classList.add('hidden');
      document.getElementById('app').classList.remove('hidden');
      
      // Update UI
      document.getElementById('user-display-name').textContent = currentUser.name;
      document.getElementById('user-role-badge').textContent = currentUser.role.toUpperCase();
      
      // Initialize the application
      initializeApp();
    }
  } catch (error) {
    console.error('Login error:', error);
    alert(error.response?.data?.error || 'Login failed');
  }
}

async function loginAsGuest() {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      username: 'guest',
      password: 'guest123'
    });
    
    if (response.data.success) {
      currentUser = response.data.user;
      authToken = response.data.token;
      
      // Store token in localStorage for persistence
      localStorage.setItem('auth-token', authToken);
      
      // Hide login screen and show app
      document.getElementById('login-screen').classList.add('hidden');
      document.getElementById('app').classList.remove('hidden');
      
      // Update UI
      document.getElementById('user-display-name').textContent = currentUser.name;
      document.getElementById('user-role-badge').textContent = currentUser.role.toUpperCase();
      
      // Initialize the application
      initializeApp();
    }
  } catch (error) {
    console.error('Guest login error:', error);
    alert('Guest login failed');
  }
}

async function logout() {
  try {
    await axios.post(`${API_BASE}/auth/logout`);
  } catch (error) {
    console.error('Logout error:', error);
  }
  
  // Clear local storage
  localStorage.removeItem('auth-token');
  
  // Reset state
  currentUser = null;
  authToken = null;
  
  // Show login screen
  document.getElementById('app').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
  
  // Clear form
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value = '';
}

async function checkExistingAuth() {
  const token = localStorage.getItem('auth-token');
  if (token) {
    try {
      const response = await axios.get(`${API_BASE}/auth/verify`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        currentUser = response.data.user;
        authToken = token;
        
        // Hide login screen and show app
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        
        // Update UI
        document.getElementById('user-display-name').textContent = currentUser.name;
        document.getElementById('user-role-badge').textContent = currentUser.role.toUpperCase();
        
        // Initialize the application
        initializeApp();
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('auth-token');
    }
  }
}

// System state management
async function loadSystemState() {
  try {
    const response = await axios.get(`${API_BASE}/system/state`);
    if (response.data.success) {
      systemState = response.data.state;
      updateSystemUI();
    }
  } catch (error) {
    console.error('Load system state error:', error);
  }
}

async function updateSystemState(updates) {
  try {
    const response = await axios.put(`${API_BASE}/system/state`, {
      ...systemState,
      ...updates
    });
    
    if (response.data.success) {
      systemState = { ...systemState, ...updates };
      updateSystemUI();
    }
  } catch (error) {
    console.error('Update system state error:', error);
  }
}

function updateSystemUI() {
  // Update time display
  const hours = Math.floor(systemState.time / 60);
  const minutes = Math.floor(systemState.time % 60);
  const timeDisplay = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  
  // Update weather display
  const weatherIcon = getWeatherIcon(systemState.weather);
  
  // Update battery display
  const batteryPercent = (systemState.bessCurrent / 5000) * 100;
  
  // Update hospital status
  const hospitalStatus = getHospitalStatus(systemState.hospital);
  
  // These elements would be created dynamically in a real app
  console.log('System state updated:', {
    time: timeDisplay,
    weather: systemState.weather,
    battery: `${batteryPercent.toFixed(1)}%`,
    hospital: hospitalStatus
  });
}

function getWeatherIcon(weather) {
  const icons = {
    sunny: '☀️',
    cloudy: '☁️',
    rainy: '🌧️',
    stormy: '⛈️'
  };
  return icons[weather] || '🌤️';
}

function getHospitalStatus(hospital) {
  if (!hospital.gridActive) return 'Grid Offline';
  if (hospital.upsState === 'DISCHARGING') return 'On Battery Power';
  if (hospital.upsState === 'CHARGING') return 'Charging UPS';
  return 'Normal Operation';
}

// Application initialization
async function initializeApp() {
  console.log('Initializing Smart City BMS v4.0...');
  
  // Load system state
  await loadSystemState();
  
  // Start real-time updates
  startRealTimeUpdates();
  
  // Load initial data
  await loadEnergyData();
  await loadBuildingData();
  
  console.log('Application initialized successfully');
}

function startRealTimeUpdates() {
  // Simulate real-time updates every 30 seconds
  setInterval(async () => {
    if (systemState.isPlaying) {
      // Update time
      const newTime = (systemState.time + 1) % 1440; // 24 hours in minutes
      
      // Simulate minor changes in energy production
      const windVariation = (Math.random() - 0.5) * 0.1;
      const newWindFlux = Math.max(0, Math.min(1, systemState.windFlux + windVariation));
      
      await updateSystemState({
        time: newTime,
        windFlux: newWindFlux
      });
    }
  }, 30000); // 30 seconds
}

async function loadEnergyData() {
  try {
    const response = await axios.get(`${API_BASE}/energy/stats`);
    if (response.data.success) {
      console.log('Energy stats loaded:', response.data.stats);
      // Update energy UI components
    }
  } catch (error) {
    console.error('Load energy data error:', error);
  }
}

async function loadBuildingData() {
  try {
    const response = await axios.get(`${API_BASE}/system/buildings`);
    if (response.data.success) {
      console.log('Building data loaded:', response.data.buildings);
      // Update building UI components
    }
  } catch (error) {
    console.error('Load building data error:', error);
  }
}

// Admin functions (if user is admin)
async function addMember(username, password, name, assignedUnitId) {
  if (!currentUser || currentUser.role !== 'admin') {
    alert('Admin privileges required');
    return;
  }
  
  try {
    const response = await axios.post(`${API_BASE}/auth/register`, {
      username,
      password,
      name,
      assignedUnitId,
      role: 'member'
    });
    
    if (response.data.success) {
      alert('Member added successfully');
      return response.data.userId;
    }
  } catch (error) {
    console.error('Add member error:', error);
    alert(error.response?.data?.error || 'Failed to add member');
  }
}

async function removeMember(userId) {
  if (!currentUser || currentUser.role !== 'admin') {
    alert('Admin privileges required');
    return;
  }
  
  try {
    const response = await axios.delete(`${API_BASE}/users/${userId}`);
    if (response.data.success) {
      alert('Member removed successfully');
    }
  } catch (error) {
    console.error('Remove member error:', error);
    alert('Failed to remove member');
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Check for existing authentication
  checkExistingAuth();
  
  // Add login form listeners
  const loginForm = document.querySelector('#login-user');
  if (loginForm) {
    loginForm.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        document.getElementById('login-pass').focus();
      }
    });
  }
  
  const passwordInput = document.querySelector('#login-pass');
  if (passwordInput) {
    passwordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        attemptLogin();
      }
    });
  }
});

// Export functions for global access
window.attemptLogin = attemptLogin;
window.loginAsGuest = loginAsGuest;
window.logout = logout;
window.addMember = addMember;
window.removeMember = removeMember;
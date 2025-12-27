-- Users table with secure password storage
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  name TEXT NOT NULL,
  assigned_unit_id TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Buildings/Sectors configuration
CREATE TABLE IF NOT EXISTS buildings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  building_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  base_load_kw REAL DEFAULT 0,
  peak_load_kw REAL DEFAULT 0,
  curve_type TEXT DEFAULT 'residential',
  variance REAL DEFAULT 0.1,
  throttle REAL DEFAULT 1.0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Energy systems configuration
CREATE TABLE IF NOT EXISTS energy_systems (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  system_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- solar, wind, battery
  capacity_kw REAL NOT NULL,
  current_output_kw REAL DEFAULT 0,
  efficiency REAL DEFAULT 1.0,
  status TEXT DEFAULT 'online',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- System state for persistence
CREATE TABLE IF NOT EXISTS system_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  current_time INTEGER DEFAULT 720,
  weather TEXT DEFAULT 'sunny',
  wind_flux REAL DEFAULT 0.5,
  bess_mode TEXT DEFAULT 'AUTO',
  bess_current_kw REAL DEFAULT 2500,
  hospital_grid_active BOOLEAN DEFAULT true,
  hospital_gen_active BOOLEAN DEFAULT false,
  hospital_ups_level REAL DEFAULT 100,
  hospital_ups_state TEXT DEFAULT 'STANDBY',
  is_playing BOOLEAN DEFAULT true,
  speed REAL DEFAULT 1.0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Energy history for analytics
CREATE TABLE IF NOT EXISTS energy_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  total_consumption_kw REAL NOT NULL,
  solar_output_kw REAL DEFAULT 0,
  wind_output_kw REAL DEFAULT 0,
  battery_level_kw REAL DEFAULT 0,
  net_grid_load_kw REAL DEFAULT 0,
  weather_condition TEXT DEFAULT 'sunny',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_buildings_type ON buildings(type);
CREATE INDEX IF NOT EXISTS idx_energy_systems_type ON energy_systems(type);
CREATE INDEX IF NOT EXISTS idx_energy_history_timestamp ON energy_history(timestamp);

-- Insert default admin user (password: 'admin123')
INSERT OR IGNORE INTO users (username, email, password_hash, role, name) VALUES 
('admin', 'admin@smartcity.com', '$2a$10$rQK8XkQpKqQpKqQpKqQpKqQpKqQpKqQpKqQpKqQpKqQpKqQpKqQpKqQ', 'admin', 'System Administrator');

-- Insert default buildings
INSERT OR IGNORE INTO buildings (building_id, name, type, base_load_kw, peak_load_kw, curve_type) VALUES
('hospital', 'General Hospital', 'hospital', 800, 1200, '24/7'),
('residential_1', 'Residential Block 1', 'residential', 200, 600, 'residential'),
('commercial_1', 'Commercial Center', 'commercial', 400, 1000, 'commercial'),
('school_1', 'City School', 'daytime', 300, 800, 'daytime'),
('mosque_1', 'Central Mosque', 'prayer', 150, 500, 'prayer');

-- Insert default energy systems
INSERT OR IGNORE INTO energy_systems (system_id, name, type, capacity_kw, efficiency) VALUES
('solar_array_1', 'Solar Array 1', 'solar', 3500, 0.9),
('solar_array_2', 'Solar Array 2', 'solar', 2000, 0.88),
('wind_turbine_1', 'Wind Turbine 1', 'wind', 2500, 0.85),
('wind_turbine_2', 'Wind Turbine 2', 'wind', 1500, 0.82),
('battery_1', 'Battery Storage 1', 'battery', 5000, 0.95);

-- Insert default system state
INSERT OR IGNORE INTO system_state (id, current_time, weather, wind_flux, bess_mode, bess_current_kw) VALUES
(1, 720, 'sunny', 0.5, 'AUTO', 2500);
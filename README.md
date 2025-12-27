# Smart City BMS v4.0

A modern, cloud-native Building Management System for smart cities with persistent data storage, real-time energy monitoring, and comprehensive admin controls.

## 🚀 Features

### ✅ **Fixed Issues**
- **Data Persistence**: All admin data (users, system state, energy history) is now permanently stored in Cloudflare D1 database
- **Secure Authentication**: JWT-based authentication with HTTP-only cookies and password hashing
- **Modern Architecture**: Separated frontend/backend with proper API design

### 🏗️ **Core Features**
- **Real-time Energy Management**: Monitor solar, wind, battery, and grid systems
- **Smart Building Controls**: Manage hospital, residential, commercial, and institutional buildings
- **Weather Integration**: Dynamic energy production based on weather conditions
- **Admin Dashboard**: User management, system configuration, and analytics
- **Data Analytics**: Energy efficiency tracking and historical reporting

### 🔧 **Technical Features**
- **Cloudflare D1 Database**: SQLite-based persistent storage
- **Cloudflare KV Cache**: High-performance caching for frequently accessed data
- **Cloudflare R2 Storage**: File storage for reports and exports
- **JWT Authentication**: Secure token-based authentication
- **RESTful API**: Clean API design with proper HTTP methods
- **Real-time Updates**: Live dashboard with automatic refresh
- **Responsive Design**: Mobile-first design with Tailwind CSS

## 🛠️ **Installation & Setup**

### Prerequisites
- Node.js 18+ 
- Cloudflare account
- Wrangler CLI

### Local Development
```bash
# Clone the repository
git clone https://github.com/your-username/smart-city-bms.git
cd smart-city-bms

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Update JWT_SECRET in .env.local with a secure random string

# Apply database migrations
npm run db:migrate

# Start development server
npm run dev:sandbox
```

### Production Deployment
```bash
# Build the application
npm run build

# Create Cloudflare resources
npx wrangler d1 create smart-city-db
npx wrangler kv:namespace create smart-city-cache
npx wrangler r2 bucket create smart-city-storage

# Update wrangler.jsonc with your resource IDs

# Deploy to Cloudflare Pages
npm run deploy
```

## 🔗 **API Endpoints**

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user (admin only)
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify JWT token

### Users (Protected)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `POST /api/users/:id/password` - Change password

### System (Protected)
- `GET /api/system/state` - Get current system state
- `PUT /api/system/state` - Update system state
- `GET /api/system/buildings` - Get all buildings
- `PUT /api/system/buildings/:id` - Update building
- `GET /api/system/settings` - Get system settings

### Energy (Protected)
- `GET /api/energy/systems` - Get energy systems
- `PUT /api/energy/systems/:id` - Update energy system
- `GET /api/energy/history` - Get energy history
- `POST /api/energy/record` - Record energy data point
- `GET /api/energy/stats` - Get current energy statistics
- `GET /api/energy/efficiency` - Get efficiency metrics

## 📊 **Data Models**

### Users
```typescript
{
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'member' | 'guest';
  name: string;
  assignedUnitId?: string;
  isActive: boolean;
  createdAt: Date;
}
```

### System State
```typescript
{
  currentTime: number;        // Minutes since midnight
  weather: string;          // sunny, cloudy, rainy, stormy
  windFlux: number;           // 0-1 wind intensity
  bessMode: string;            // AUTO, SAVE, DUMP
  bessCurrent: number;        // Battery current in kW
  hospital: {
    gridActive: boolean;
    genActive: boolean;
    upsLevel: number;
    upsState: string;
  };
  isPlaying: boolean;
  speed: number;
}
```

### Energy Systems
```typescript
{
  systemId: string;
  name: string;
  type: 'solar' | 'wind' | 'battery';
  capacityKw: number;
  currentOutputKw: number;
  efficiency: number;
  status: 'online' | 'offline' | 'maintenance';
}
```

## 🏗️ **Architecture**

### Backend Structure
```
src/
├── index.tsx              # Main Hono application
├── routes/
│   ├── auth.tsx          # Authentication endpoints
│   ├── users.tsx         # User management
│   ├── system.tsx        # System state and buildings
│   └── energy.tsx        # Energy systems and analytics
└── types/
    └── index.ts          # TypeScript definitions
```

### Frontend Structure
```
public/
└── static/
    └── app.js            # Main frontend application
```

### Database Schema
```
migrations/
└── 0001_initial_schema.sql  # Database schema and default data
```

## 🔐 **Security Features**

- **Password Hashing**: bcrypt with 10 salt rounds
- **JWT Tokens**: Secure token-based authentication
- **HTTP-only Cookies**: Protection against XSS attacks
- **CORS Protection**: Configured for specific origins
- **Input Validation**: Server-side validation for all inputs
- **Role-based Access**: Admin, member, and guest roles
- **HTTPS Only**: Secure transmission enforced

## 📈 **Performance Features**

- **Database Indexing**: Optimized queries with proper indexes
- **KV Caching**: High-performance caching for frequently accessed data
- **Lazy Loading**: Components load only when needed
- **Compression**: Gzip compression for API responses
- **Edge Computing**: Global distribution via Cloudflare
- **Real-time Updates**: Efficient polling with state management

## 🚀 **Deployment Options**

### Cloudflare Pages (Recommended)
- Automatic deployments from Git
- Global CDN distribution
- Integrated with Cloudflare services
- Zero-config HTTPS

### Custom Server
- Docker containerization
- Environment-based configuration
- Horizontal scaling support
- Monitoring and logging

## 📊 **Monitoring & Analytics**

- **System Health**: Real-time system status monitoring
- **Energy Analytics**: Historical energy consumption tracking
- **User Activity**: Admin and user action logging
- **Performance Metrics**: Response times and error rates
- **Efficiency Reports**: Energy efficiency calculations

## 🔧 **Configuration**

### Environment Variables
```env
JWT_SECRET=your-super-secure-jwt-secret-key-here
```

### System Constants
```typescript
const SOLAR_INSTALLED_CAPACITY = 3500;  // kW
const WIND_INSTALLED_CAPACITY = 2500;  // kW
const BESS_CAPACITY = 5000;              // kWh
const MAX_GRID_CAPACITY = 10000;       // kW
```

## 🐛 **Development & Debugging**

### Local Development
```bash
# Start with hot reload
npm run dev

# Check database
npm run db:console:local

# View logs
npm run logs
```

### Testing
```bash
# Run tests
npm test

# Test API endpoints
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## 📚 **Documentation**

- **API Documentation**: Auto-generated OpenAPI spec
- **Code Comments**: Comprehensive inline documentation
- **TypeScript Types**: Full type safety
- **Examples**: Usage examples in README

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 **License**

MIT License - see LICENSE file for details

## 🆘 **Support**

- **GitHub Issues**: Report bugs and request features
- **Documentation**: Comprehensive setup and usage guides
- **Community**: Join discussions and get help

---

**Smart City BMS v4.0** - Building the future of sustainable urban energy management.
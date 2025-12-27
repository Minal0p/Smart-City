import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { jwt } from 'hono/jwt'
import { serveStatic } from 'hono/cloudflare-workers'
import { authRoutes } from './routes/auth'
import { userRoutes } from './routes/users'
import { systemRoutes } from './routes/system'
import { energyRoutes } from './routes/energy'

export type Bindings = {
  DB: D1Database
  CACHE: KVNamespace
  STORAGE: R2Bucket
  JWT_SECRET: string
}

const app = new Hono<{ Bindings: Bindings }>()

// Global middleware
app.use('*', logger())
app.use('*', cors({
  origin: ['http://localhost:3000', 'https://smart-city-bms.pages.dev'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// Health check
app.get('/api/health', (c) => {
  return c.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '4.0.0'
  })
})

// Public routes (no auth required)
app.route('/api/auth', authRoutes)

// Protected routes (JWT required)
app.use('/api/users/*', async (c, next) => {
  const jwtMiddleware = jwt({
    secret: c.env.JWT_SECRET,
    cookie: 'auth-token'
  })
  return jwtMiddleware(c, next)
})

app.use('/api/system/*', async (c, next) => {
  const jwtMiddleware = jwt({
    secret: c.env.JWT_SECRET,
    cookie: 'auth-token'
  })
  return jwtMiddleware(c, next)
})

app.use('/api/energy/*', async (c, next) => {
  const jwtMiddleware = jwt({
    secret: c.env.JWT_SECRET,
    cookie: 'auth-token'
  })
  return jwtMiddleware(c, next)
})

// API routes
app.route('/api/users', userRoutes)
app.route('/api/system', systemRoutes)
app.route('/api/energy', energyRoutes)

// Main application route
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Smart City BMS v4.0 - Modern Energy Management</title>
        
        <!-- Tailwind CSS -->
        <script src="https://cdn.tailwindcss.com"></script>
        
        <!-- Lucide Icons -->
        <script src="https://unpkg.com/lucide@latest"></script>
        
        <!-- Google Fonts -->
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">

        <style>
            body { font-family: 'Inter', sans-serif; }
            .font-mono { font-family: 'JetBrains Mono', monospace; }
            
            /* Range Slider Styling */
            input[type=range] {
                -webkit-appearance: none; 
                background: transparent; 
            }
            input[type=range]:focus {
                outline: none;
            }
            input[type=range]::-webkit-slider-thumb {
                -webkit-appearance: none;
                height: 12px;
                width: 12px;
                border-radius: 50%;
                background: #3b82f6; 
                cursor: pointer;
                margin-top: -3px; 
            }
            input[type=range]:disabled::-webkit-slider-thumb {
                background: #475569; 
                cursor: not-allowed;
            }
            input[type=range]::-webkit-slider-runnable-track {
                width: 100%;
                height: 6px;
                cursor: pointer;
                background: #334155; 
                border-radius: 3px;
            }
            
            /* Animations */
            @keyframes pulse-flow {
                0% { opacity: 0.3; }
                50% { opacity: 1; }
                100% { opacity: 0.3; }
            }
            .animate-spin-slow {
                animation: spin 8s linear infinite;
            }
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            
            /* Scrollbar */
            ::-webkit-scrollbar { width: 6px; }
            ::-webkit-scrollbar-track { background: #0f172a; }
            ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
            ::-webkit-scrollbar-thumb:hover { background: #475569; }
        </style>
    </head>
    <body class="bg-slate-950 text-slate-100 min-h-screen selection:bg-blue-500/30 overflow-x-hidden">
        <!-- Modern Smart City BMS Application -->
        <div id="app" class="hidden">
            <!-- Header -->
            <header class="bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 sticky top-0 z-50">
                <div class="container mx-auto px-4 py-3">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                            <div class="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-900/30">
                                <i data-lucide="building-2" class="text-white w-6 h-6"></i>
                            </div>
                            <div>
                                <h1 class="text-xl font-bold text-white">Smart City BMS</h1>
                                <p class="text-slate-400 text-xs">v4.0 Modern Energy Management</p>
                            </div>
                        </div>
                        
                        <div class="flex items-center space-x-4">
                            <div class="text-right">
                                <div id="user-display-name" class="text-white font-medium">Guest</div>
                                <div id="user-role-badge" class="text-slate-400 text-xs">GUEST</div>
                            </div>
                            <button id="logout-btn" onclick="logout()" class="bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm transition-colors">
                                <i data-lucide="log-out" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Main Content -->
            <main class="container mx-auto px-4 py-6">
                <div id="dashboard-content">
                    <!-- Dashboard will be rendered here -->
                    <div class="text-center py-12">
                        <i data-lucide="activity" class="w-16 h-16 text-slate-600 mx-auto mb-4"></i>
                        <h2 class="text-2xl font-bold text-white mb-2">Smart City Dashboard</h2>
                        <p class="text-slate-400">Loading energy management system...</p>
                    </div>
                </div>
            </main>
        </div>

        <!-- Login Screen -->
        <div id="login-screen" class="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-4">
            <div class="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md">
                <div class="flex flex-col items-center mb-8">
                    <div class="bg-blue-600 p-3 rounded-xl mb-4 shadow-lg shadow-blue-900/30">
                        <i data-lucide="shield-check" class="text-white w-8 h-8"></i>
                    </div>
                    <h1 class="text-2xl font-bold text-white">Smart City BMS</h1>
                    <p class="text-slate-400 text-sm">Sustainable Energy Grid</p>
                </div>

                <div class="space-y-4">
                    <div>
                        <label class="block text-xs font-medium text-slate-400 mb-1">Username</label>
                        <input id="login-user" type="text" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="Enter username">
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-400 mb-1">Password</label>
                        <input id="login-pass" type="password" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="••••••••">
                    </div>
                    
                    <button onclick="attemptLogin()" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg transition-all shadow-lg shadow-blue-900/20 mt-2">
                        Sign In
                    </button>
                    
                    <div class="relative py-2">
                        <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-800"></div></div>
                        <div class="relative flex justify-center text-xs uppercase"><span class="bg-slate-900 px-2 text-slate-500">Or</span></div>
                    </div>
                    
                    <button onclick="loginAsGuest()" class="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2.5 rounded-lg transition-colors">
                        <i data-lucide="eye" class="inline w-4 h-4 mr-2"></i>
                        Monitor as Guest
                    </button>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app
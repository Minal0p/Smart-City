import { Hono } from 'hono'
import { SignJWT, jwtVerify } from 'jose'
import { bcrypt } from 'bcryptjs'

const auth = new Hono<{ Bindings: Bindings }>()

// Login endpoint
auth.post('/login', async (c) => {
  const { username, password } = await c.req.json()
  
  if (!username || !password) {
    return c.json({ error: 'Username and password required' }, 400)
  }
  
  try {
    // Get user from database
    const result = await c.env.DB.prepare(
      'SELECT id, username, email, password_hash, role, name FROM users WHERE username = ? AND is_active = 1'
    ).bind(username).first()
    
    if (!result) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }
    
    // Verify password
    const isValid = await bcrypt.compare(password, result.password_hash)
    if (!isValid) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }
    
    // Generate JWT token
    const token = await new SignJWT({
      sub: result.id.toString(),
      username: result.username,
      role: result.role
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(new TextEncoder().encode(c.env.JWT_SECRET))
    
    // Set HTTP-only cookie
    c.header('Set-Cookie', `auth-token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=86400; Path=/`)
    
    return c.json({
      success: true,
      user: {
        id: result.id,
        username: result.username,
        email: result.email,
        role: result.role,
        name: result.name
      },
      token
    })
    
  } catch (error) {
    console.error('Login error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Register endpoint (admin only)
auth.post('/register', async (c) => {
  const { username, email, password, role = 'member', name, assignedUnitId } = await c.req.json()
  
  if (!username || !password || !name) {
    return c.json({ error: 'Username, password, and name are required' }, 400)
  }
  
  try {
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)
    
    // Insert user
    const result = await c.env.DB.prepare(`
      INSERT INTO users (username, email, password_hash, role, name, assigned_unit_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(username, email, passwordHash, role, name, assignedUnitId).run()
    
    return c.json({
      success: true,
      message: 'User created successfully',
      userId: result.meta.last_row_id
    })
    
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return c.json({ error: 'Username or email already exists' }, 409)
    }
    console.error('Registration error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Logout endpoint
auth.post('/logout', async (c) => {
  // Clear the cookie
  c.header('Set-Cookie', 'auth-token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/')
  return c.json({ success: true, message: 'Logged out successfully' })
})

// Verify token endpoint
auth.get('/verify', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return c.json({ error: 'No token provided' }, 401)
  }
  
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(c.env.JWT_SECRET))
    
    // Get user details
    const user = await c.env.DB.prepare(
      'SELECT id, username, email, role, name FROM users WHERE id = ? AND is_active = 1'
    ).bind(payload.sub).first()
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }
    
    return c.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        name: user.name
      }
    })
    
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401)
  }
})

export { auth as authRoutes }
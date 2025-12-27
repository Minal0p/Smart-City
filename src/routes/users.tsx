import { Hono } from 'hono'
import { bcrypt } from 'bcryptjs'

const users = new Hono<{ Bindings: Bindings }>()

// Get all users (admin only)
users.get('/', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT id, username, email, role, name, assigned_unit_id, is_active, created_at
      FROM users 
      ORDER BY created_at DESC
    `).all()
    
    return c.json({
      success: true,
      users: result.results,
      total: result.results.length
    })
    
  } catch (error) {
    console.error('Get users error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Get user by ID
users.get('/:id', async (c) => {
  const id = c.req.param('id')
  
  try {
    const user = await c.env.DB.prepare(`
      SELECT id, username, email, role, name, assigned_unit_id, is_active, created_at
      FROM users 
      WHERE id = ?
    `).bind(id).first()
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }
    
    return c.json({
      success: true,
      user
    })
    
  } catch (error) {
    console.error('Get user error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Update user
users.put('/:id', async (c) => {
  const id = c.req.param('id')
  const { email, role, name, assignedUnitId, isActive } = await c.req.json()
  
  try {
    await c.env.DB.prepare(`
      UPDATE users 
      SET email = ?, role = ?, name = ?, assigned_unit_id = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(email, role, name, assignedUnitId, isActive, id).run()
    
    return c.json({
      success: true,
      message: 'User updated successfully'
    })
    
  } catch (error) {
    console.error('Update user error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Delete user
users.delete('/:id', async (c) => {
  const id = c.req.param('id')
  
  try {
    await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run()
    
    return c.json({
      success: true,
      message: 'User deleted successfully'
    })
    
  } catch (error) {
    console.error('Delete user error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Change password
users.post('/:id/password', async (c) => {
  const id = c.req.param('id')
  const { currentPassword, newPassword } = await c.req.json()
  
  if (!currentPassword || !newPassword) {
    return c.json({ error: 'Current and new passwords are required' }, 400)
  }
  
  try {
    // Verify current password
    const user = await c.env.DB.prepare('SELECT password_hash FROM users WHERE id = ?').bind(id).first()
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }
    
    const isValid = await bcrypt.compare(currentPassword, user.password_hash)
    if (!isValid) {
      return c.json({ error: 'Current password is incorrect' }, 401)
    }
    
    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10)
    
    // Update password
    await c.env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(newPasswordHash, id).run()
    
    return c.json({
      success: true,
      message: 'Password changed successfully'
    })
    
  } catch (error) {
    console.error('Change password error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export { users as userRoutes }
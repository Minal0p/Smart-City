import { Hono } from 'hono'

const energy = new Hono<{ Bindings: Bindings }>()

// Get energy systems
energy.get('/systems', async (c) => {
  try {
    const systems = await c.env.DB.prepare(`
      SELECT system_id, name, type, capacity_kw, current_output_kw, efficiency, status
      FROM energy_systems 
      ORDER BY type, name
    `).all()
    
    return c.json({
      success: true,
      systems: systems.results,
      total: systems.results.length
    })
    
  } catch (error) {
    console.error('Get energy systems error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Update energy system
energy.put('/systems/:id', async (c) => {
  const systemId = c.req.param('id')
  const { currentOutputKw, efficiency, status } = await c.req.json()
  
  try {
    await c.env.DB.prepare(`
      UPDATE energy_systems 
      SET current_output_kw = ?, efficiency = ?, status = ?
      WHERE system_id = ?
    `).bind(currentOutputKw, efficiency, status, systemId).run()
    
    return c.json({
      success: true,
      message: 'Energy system updated successfully'
    })
    
  } catch (error) {
    console.error('Update energy system error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Get energy history
energy.get('/history', async (c) => {
  const limit = parseInt(c.req.query('limit') || '50')
  const hours = parseInt(c.req.query('hours') || '24')
  
  try {
    const history = await c.env.DB.prepare(`
      SELECT timestamp, total_consumption_kw, solar_output_kw, wind_output_kw,
             battery_level_kw, net_grid_load_kw, weather_condition, created_at
      FROM energy_history 
      WHERE timestamp >= ?
      ORDER BY timestamp DESC
      LIMIT ?
    `).bind(Date.now() - (hours * 3600000), limit).all()
    
    return c.json({
      success: true,
      history: history.results,
      total: history.results.length
    })
    
  } catch (error) {
    console.error('Get energy history error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Record energy data point
energy.post('/record', async (c) => {
  const { timestamp, consumption, solar, wind, battery, netGrid, weather } = await c.req.json()
  
  try {
    await c.env.DB.prepare(`
      INSERT INTO energy_history (timestamp, total_consumption_kw, solar_output_kw, wind_output_kw, battery_level_kw, net_grid_load_kw, weather_condition)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(timestamp, consumption, solar, wind, battery, netGrid, weather).run()
    
    return c.json({
      success: true,
      message: 'Energy data recorded successfully'
    })
    
  } catch (error) {
    console.error('Record energy data error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Get current energy statistics
energy.get('/stats', async (c) => {
  try {
    // Get current system state
    const state = await c.env.DB.prepare(`
      SELECT current_time, weather, bess_current_kw
      FROM system_state 
      WHERE id = 1
    `).first()
    
    // Get latest energy data
    const latest = await c.env.DB.prepare(`
      SELECT total_consumption_kw, solar_output_kw, wind_output_kw, net_grid_load_kw
      FROM energy_history 
      ORDER BY timestamp DESC 
      LIMIT 1
    `).first()
    
    // Get system totals
    const totals = await c.env.DB.prepare(`
      SELECT 
        SUM(capacity_kw) as total_capacity,
        SUM(current_output_kw) as total_output,
        type
      FROM energy_systems 
      WHERE status = 'online'
      GROUP BY type
    `).all()
    
    return c.json({
      success: true,
      stats: {
        current: {
          time: state?.current_time || 720,
          weather: state?.weather || 'sunny',
          batteryLevel: state?.bess_current_kw || 2500
        },
        latest: latest || {
          total_consumption_kw: 0,
          solar_output_kw: 0,
          wind_output_kw: 0,
          net_grid_load_kw: 0
        },
        capacity: totals.results
      }
    })
    
  } catch (error) {
    console.error('Get energy stats error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Get energy efficiency metrics
energy.get('/efficiency', async (c) => {
  const days = parseInt(c.req.query('days') || '7')
  
  try {
    const efficiency = await c.env.DB.prepare(`
      SELECT 
        DATE(created_at) as date,
        AVG(solar_output_kw) as avg_solar,
        AVG(wind_output_kw) as avg_wind,
        AVG(total_consumption_kw) as avg_consumption,
        AVG(net_grid_load_kw) as avg_net_load,
        COUNT(*) as data_points
      FROM energy_history 
      WHERE created_at >= datetime('now', '-' || ? || ' days')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `).bind(days).all()
    
    return c.json({
      success: true,
      efficiency: efficiency.results,
      period: `${days} days`
    })
    
  } catch (error) {
    console.error('Get efficiency metrics error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export { energy as energyRoutes }
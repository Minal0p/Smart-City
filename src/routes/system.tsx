import { Hono } from 'hono'

const system = new Hono<{ Bindings: Bindings }>()

// Get current system state
system.get('/state', async (c) => {
  try {
    const state = await c.env.DB.prepare(`
      SELECT current_time, weather, wind_flux, bess_mode, bess_current_kw,
             hospital_grid_active, hospital_gen_active, hospital_ups_level,
             hospital_ups_state, is_playing, speed
      FROM system_state 
      WHERE id = 1
    `).first()
    
    if (!state) {
      return c.json({ error: 'System state not found' }, 404)
    }
    
    return c.json({
      success: true,
      state: {
        time: state.current_time,
        weather: state.weather,
        windFlux: state.wind_flux,
        bessMode: state.bess_mode,
        bessCurrent: state.bess_current_kw,
        hospital: {
          gridActive: Boolean(state.hospital_grid_active),
          genActive: Boolean(state.hospital_gen_active),
          upsLevel: state.hospital_ups_level,
          upsState: state.hospital_ups_state
        },
        isPlaying: Boolean(state.is_playing),
        speed: state.speed
      }
    })
    
  } catch (error) {
    console.error('Get system state error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Update system state
system.put('/state', async (c) => {
  const { time, weather, windFlux, bessMode, bessCurrent, hospital, isPlaying, speed } = await c.req.json()
  
  try {
    await c.env.DB.prepare(`
      UPDATE system_state 
      SET current_time = ?, weather = ?, wind_flux = ?, bess_mode = ?, bess_current_kw = ?,
          hospital_grid_active = ?, hospital_gen_active = ?, hospital_ups_level = ?,
          hospital_ups_state = ?, is_playing = ?, speed = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).bind(
      time, weather, windFlux, bessMode, bessCurrent,
      hospital?.gridActive, hospital?.genActive, hospital?.upsLevel,
      hospital?.upsState, isPlaying, speed
    ).run()
    
    return c.json({
      success: true,
      message: 'System state updated successfully'
    })
    
  } catch (error) {
    console.error('Update system state error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Get buildings
system.get('/buildings', async (c) => {
  try {
    const buildings = await c.env.DB.prepare(`
      SELECT building_id, name, type, base_load_kw, peak_load_kw, 
             curve_type, variance, throttle, is_active
      FROM buildings 
      WHERE is_active = 1
      ORDER BY name
    `).all()
    
    return c.json({
      success: true,
      buildings: buildings.results,
      total: buildings.results.length
    })
    
  } catch (error) {
    console.error('Get buildings error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Update building
system.put('/buildings/:id', async (c) => {
  const buildingId = c.req.param('id')
  const { baseLoadKw, peakLoadKw, variance, throttle, isActive } = await c.req.json()
  
  try {
    await c.env.DB.prepare(`
      UPDATE buildings 
      SET base_load_kw = ?, peak_load_kw = ?, variance = ?, throttle = ?, is_active = ?
      WHERE building_id = ?
    `).bind(baseLoadKw, peakLoadKw, variance, throttle, isActive, buildingId).run()
    
    return c.json({
      success: true,
      message: 'Building updated successfully'
    })
    
  } catch (error) {
    console.error('Update building error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Get all system settings
system.get('/settings', async (c) => {
  try {
    const settings = await c.env.DB.prepare(`
      SELECT 'buildings' as type, COUNT(*) as count FROM buildings WHERE is_active = 1
      UNION ALL
      SELECT 'energy_systems' as type, COUNT(*) as count FROM energy_systems WHERE status = 'online'
      UNION ALL
      SELECT 'users' as type, COUNT(*) as count FROM users WHERE is_active = 1
    `).all()
    
    return c.json({
      success: true,
      settings: settings.results
    })
    
  } catch (error) {
    console.error('Get settings error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export { system as systemRoutes }
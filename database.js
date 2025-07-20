const { Pool } = require('pg');

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Optional: configure pool settings
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Initialize database using migrations
async function initializeDatabase() {
  const { runMigrations } = require('./migrations');
  try {
    await runMigrations();
    console.log('Database migrations completed successfully');
  } catch (error) {
    console.error('Error running database migrations:', error);
    throw error;
  }
}

// Goal data operations
async function createGoal(userId, name, description = null, goalType = 'completion', unit = null) {
  const id = "goal_" + Math.random().toString(36).substr(2, 9);
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      'INSERT INTO goals (id, user_id, name, description, goal_type, unit) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [id, userId, name, description, goalType, unit]
    );
    
    return result.rows[0];
  } catch (error) {
    console.error('Error creating goal:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function getGoalsByUser(userId) {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      'SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    return result.rows;
  } catch (error) {
    console.error('Error fetching goals:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function getGoalsByUserPaginated(userId, limit = 10, offset = 0) {
  const client = await pool.connect();
  
  try {
    // Get total count
    const countResult = await client.query(
      'SELECT COUNT(*) FROM goals WHERE user_id = $1',
      [userId]
    );
    const totalCount = parseInt(countResult.rows[0].count);
    
    // Get paginated results ordered by name
    const result = await client.query(
      'SELECT * FROM goals WHERE user_id = $1 ORDER BY name ASC LIMIT $2 OFFSET $3',
      [userId, limit, offset]
    );
    
    return {
      goals: result.rows,
      totalCount: totalCount,
      hasMore: offset + limit < totalCount,
      currentPage: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(totalCount / limit)
    };
  } catch (error) {
    console.error('Error fetching paginated goals:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function getGoalById(goalId) {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      'SELECT * FROM goals WHERE id = $1',
      [goalId]
    );
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching goal:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Goal report operations
async function createGoalReport(goalId, userId, completionStatus = null, numericValue = null, notes = null) {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      'INSERT INTO goal_reports (goal_id, user_id, completion_status, numeric_value, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [goalId, userId, completionStatus, numericValue, notes]
    );
    
    return result.rows[0];
  } catch (error) {
    console.error('Error creating goal report:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function getGoalReportsByUser(userId, goalId = null, limit = 50) {
  const client = await pool.connect();
  
  try {
    let query = `
      SELECT gr.*, g.name as goal_name, g.goal_type, g.unit 
      FROM goal_reports gr 
      JOIN goals g ON gr.goal_id = g.id 
      WHERE gr.user_id = $1
    `;
    const params = [userId];
    
    if (goalId) {
      query += ' AND gr.goal_id = $2';
      params.push(goalId);
    }
    
    query += ' ORDER BY gr.report_time DESC LIMIT $' + (params.length + 1);
    params.push(limit);
    
    const result = await client.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error fetching goal reports:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function searchGoalsByUserForAutocomplete(userId, query = '') {
  const client = await pool.connect();
  
  try {
    const searchQuery = `
      SELECT id, name, goal_type, unit 
      FROM goals 
      WHERE user_id = $1 
      AND status = 'active'
      AND (name ILIKE $2 OR $2 = '')
      ORDER BY name ASC 
      LIMIT 25
    `;
    
    const result = await client.query(searchQuery, [userId, `%${query}%`]);
    return result.rows;
  } catch (error) {
    console.error('Error searching goals for autocomplete:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Gracefully close database connections
async function closeDatabase() {
  await pool.end();
}

module.exports = {
  initializeDatabase,
  createGoal,
  getGoalsByUser,
  getGoalsByUserPaginated,
  getGoalById,
  createGoalReport,
  getGoalReportsByUser,
  searchGoalsByUserForAutocomplete,
  closeDatabase
};
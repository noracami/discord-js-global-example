const { Pool } = require('pg');

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Optional: configure pool settings
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Initialize database tables
async function initializeDatabase() {
  const client = await pool.connect();
  try {
    // Create goals table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS goals (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        goal_type VARCHAR(20) DEFAULT 'completion',
        unit VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        status VARCHAR(20) DEFAULT 'active'
      )
    `);
    
    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
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
  closeDatabase
};
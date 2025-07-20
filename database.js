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
    // Calculate report_date using 8:00 AM Taiwan time logic
    const now = new Date();
    const taiwanTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
    const hour = taiwanTime.getHours();
    
    // If current time is before 8:00 AM, consider it as previous day
    const reportDate = new Date(taiwanTime);
    if (hour < 8) {
      reportDate.setDate(reportDate.getDate() - 1);
    }
    
    const reportDateString = reportDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const result = await client.query(
      'INSERT INTO goal_reports (goal_id, user_id, completion_status, numeric_value, notes, report_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [goalId, userId, completionStatus, numericValue, notes, reportDateString]
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

async function getTodayProgressByUser(userId) {
  const client = await pool.connect();
  
  try {
    // Get all active goals for the user
    const goalsQuery = `
      SELECT id, name, goal_type, unit 
      FROM goals 
      WHERE user_id = $1 AND status = 'active'
      ORDER BY name ASC
    `;
    const goalsResult = await client.query(goalsQuery, [userId]);
    const goals = goalsResult.rows;

    // Calculate "today" as 8:00 AM Taiwan time to 8:00 AM next day Taiwan time
    // This means if current time is before 8:00 AM, we look at previous calendar day
    const now = new Date();
    const taiwanTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
    const hour = taiwanTime.getHours();
    
    // If current time is before 8:00 AM, consider it as previous day
    const reportDate = new Date(taiwanTime);
    if (hour < 8) {
      reportDate.setDate(reportDate.getDate() - 1);
    }
    
    const reportDateString = reportDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Get today's reports for these goals (8:00 AM to 8:00 AM cycle)
    const reportsQuery = `
      SELECT goal_id, completion_status, numeric_value, notes, report_time
      FROM goal_reports 
      WHERE user_id = $1 
      AND report_date = $2
      ORDER BY report_time DESC
    `;
    const reportsResult = await client.query(reportsQuery, [userId, reportDateString]);
    const reports = reportsResult.rows;

    // Create a map of goal_id to latest report for today
    const todayReports = new Map();
    reports.forEach(report => {
      if (!todayReports.has(report.goal_id)) {
        todayReports.set(report.goal_id, report);
      }
    });

    // Categorize goals
    const completed = [];
    const notCompleted = [];
    const numeric = [];
    const notReported = [];

    goals.forEach(goal => {
      const report = todayReports.get(goal.id);
      
      if (!report) {
        notReported.push(goal);
      } else if (goal.goal_type === 'completion') {
        if (report.completion_status) {
          completed.push({ goal, report });
        } else {
          notCompleted.push({ goal, report });
        }
      } else if (goal.goal_type === 'numeric') {
        numeric.push({ goal, report });
      }
    });

    return {
      goals,
      completed,
      notCompleted,
      numeric,
      notReported,
      totalGoals: goals.length,
      reportedGoals: completed.length + notCompleted.length + numeric.length,
      completedGoals: completed.length + numeric.length // Numeric goals are considered "completed" if reported
    };
  } catch (error) {
    console.error('Error fetching today progress:', error);
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
  getTodayProgressByUser,
  closeDatabase
};
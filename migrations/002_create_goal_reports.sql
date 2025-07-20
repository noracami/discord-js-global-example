-- Migration: 002_create_goal_reports
-- Description: Create goal_reports table for tracking daily progress
-- Created: 2025-07-20

-- Up migration
CREATE TABLE goal_reports (
  id SERIAL PRIMARY KEY,
  goal_id VARCHAR(50) REFERENCES goals(id) ON DELETE CASCADE,
  user_id VARCHAR(50) NOT NULL,
  report_date DATE DEFAULT CURRENT_DATE,
  report_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completion_status BOOLEAN,
  numeric_value DECIMAL(10,2),
  notes TEXT
);

-- Create indexes for better query performance
CREATE INDEX idx_goal_reports_goal_id ON goal_reports(goal_id);
CREATE INDEX idx_goal_reports_user_id ON goal_reports(user_id);
CREATE INDEX idx_goal_reports_date ON goal_reports(report_date);
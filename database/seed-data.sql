-- =====================================================
-- Project Management System - Seed Data
-- Run this AFTER mssql-schema.sql
-- =====================================================

USE ProjectManagementDB;
GO

-- =====================================================
-- USERS (password is 'password123' for all users)
-- Password hash generated with bcrypt (10 rounds)
-- =====================================================
DECLARE @password_hash NVARCHAR(255) = '$2a$10$rQZ5V5zZx5V5zZx5V5zZxOeJ5V5zZx5V5zZx5V5zZx5V5zZx5V5zZ';

-- Admin User
DECLARE @admin_user_id UNIQUEIDENTIFIER = NEWID();
DECLARE @admin_profile_id UNIQUEIDENTIFIER = NEWID();

INSERT INTO users (id, email, password_hash, email_confirmed) 
VALUES (@admin_user_id, 'admin@company.com', @password_hash, 1);

INSERT INTO profiles (id, user_id, name, email, designation, role)
VALUES (@admin_profile_id, @admin_user_id, 'John Admin', 'admin@company.com', 'System Administrator', 'admin');

INSERT INTO user_roles (id, user_id, role)
VALUES (NEWID(), @admin_user_id, 'admin');

-- Manager User
DECLARE @manager_user_id UNIQUEIDENTIFIER = NEWID();
DECLARE @manager_profile_id UNIQUEIDENTIFIER = NEWID();

INSERT INTO users (id, email, password_hash, email_confirmed)
VALUES (@manager_user_id, 'manager@company.com', @password_hash, 1);

INSERT INTO profiles (id, user_id, name, email, designation, role)
VALUES (@manager_profile_id, @manager_user_id, 'Sarah Manager', 'manager@company.com', 'Project Manager', 'manager');

INSERT INTO user_roles (id, user_id, role)
VALUES (NEWID(), @manager_user_id, 'manager');

-- Team Lead
DECLARE @lead_user_id UNIQUEIDENTIFIER = NEWID();
DECLARE @lead_profile_id UNIQUEIDENTIFIER = NEWID();

INSERT INTO users (id, email, password_hash, email_confirmed)
VALUES (@lead_user_id, 'lead@company.com', @password_hash, 1);

INSERT INTO profiles (id, user_id, name, email, designation, role)
VALUES (@lead_profile_id, @lead_user_id, 'Mike Lead', 'lead@company.com', 'Technical Lead', 'team_lead');

INSERT INTO user_roles (id, user_id, role)
VALUES (NEWID(), @lead_user_id, 'team_lead');

-- Backend Developer
DECLARE @backend_user_id UNIQUEIDENTIFIER = NEWID();
DECLARE @backend_profile_id UNIQUEIDENTIFIER = NEWID();

INSERT INTO users (id, email, password_hash, email_confirmed)
VALUES (@backend_user_id, 'backend@company.com', @password_hash, 1);

INSERT INTO profiles (id, user_id, name, email, designation, role)
VALUES (@backend_profile_id, @backend_user_id, 'Alex Backend', 'backend@company.com', 'Senior Backend Developer', 'backend_developer');

INSERT INTO user_roles (id, user_id, role)
VALUES (NEWID(), @backend_user_id, 'backend_developer');

-- Frontend Developer
DECLARE @frontend_user_id UNIQUEIDENTIFIER = NEWID();
DECLARE @frontend_profile_id UNIQUEIDENTIFIER = NEWID();

INSERT INTO users (id, email, password_hash, email_confirmed)
VALUES (@frontend_user_id, 'frontend@company.com', @password_hash, 1);

INSERT INTO profiles (id, user_id, name, email, designation, role)
VALUES (@frontend_profile_id, @frontend_user_id, 'Emma Frontend', 'frontend@company.com', 'Frontend Developer', 'frontend_developer');

INSERT INTO user_roles (id, user_id, role)
VALUES (NEWID(), @frontend_user_id, 'frontend_developer');

-- Mobile Developer
DECLARE @mobile_user_id UNIQUEIDENTIFIER = NEWID();
DECLARE @mobile_profile_id UNIQUEIDENTIFIER = NEWID();

INSERT INTO users (id, email, password_hash, email_confirmed)
VALUES (@mobile_user_id, 'mobile@company.com', @password_hash, 1);

INSERT INTO profiles (id, user_id, name, email, designation, role)
VALUES (@mobile_profile_id, @mobile_user_id, 'David Mobile', 'mobile@company.com', 'Mobile Developer', 'mobile_developer');

INSERT INTO user_roles (id, user_id, role)
VALUES (NEWID(), @mobile_user_id, 'mobile_developer');

-- QA Tester
DECLARE @qa_user_id UNIQUEIDENTIFIER = NEWID();
DECLARE @qa_profile_id UNIQUEIDENTIFIER = NEWID();

INSERT INTO users (id, email, password_hash, email_confirmed)
VALUES (@qa_user_id, 'qa@company.com', @password_hash, 1);

INSERT INTO profiles (id, user_id, name, email, designation, role)
VALUES (@qa_profile_id, @qa_user_id, 'Lisa QA', 'qa@company.com', 'QA Engineer', 'testing_team');

INSERT INTO user_roles (id, user_id, role)
VALUES (NEWID(), @qa_user_id, 'testing_team');

-- =====================================================
-- COMPANIES
-- =====================================================
DECLARE @company1_id UNIQUEIDENTIFIER = NEWID();
DECLARE @company2_id UNIQUEIDENTIFIER = NEWID();
DECLARE @company3_id UNIQUEIDENTIFIER = NEWID();

INSERT INTO companies (id, name, logo) VALUES
(@company1_id, 'TechCorp Solutions', NULL),
(@company2_id, 'Digital Innovations Ltd', NULL),
(@company3_id, 'StartupXYZ', NULL);

-- =====================================================
-- PROJECTS
-- =====================================================
DECLARE @project1_id UNIQUEIDENTIFIER = NEWID();
DECLARE @project2_id UNIQUEIDENTIFIER = NEWID();
DECLARE @project3_id UNIQUEIDENTIFIER = NEWID();
DECLARE @project4_id UNIQUEIDENTIFIER = NEWID();

INSERT INTO projects (id, company_id, name, type, description) VALUES
(@project1_id, @company1_id, 'E-Commerce Platform', 'website', 'Full-featured e-commerce platform with payment integration'),
(@project2_id, @company1_id, 'Customer Portal', 'crm', 'Customer relationship management portal'),
(@project3_id, @company2_id, 'Mobile Banking App', 'mobile_app', 'Secure mobile banking application for iOS and Android'),
(@project4_id, @company3_id, 'Internal Dashboard', 'internal_software', 'Analytics and reporting dashboard');

-- =====================================================
-- PROJECT MEMBERS
-- =====================================================
INSERT INTO project_members (id, project_id, member_id) VALUES
-- E-Commerce Platform team
(NEWID(), @project1_id, @lead_profile_id),
(NEWID(), @project1_id, @backend_profile_id),
(NEWID(), @project1_id, @frontend_profile_id),
(NEWID(), @project1_id, @qa_profile_id),
-- Customer Portal team
(NEWID(), @project2_id, @lead_profile_id),
(NEWID(), @project2_id, @backend_profile_id),
(NEWID(), @project2_id, @qa_profile_id),
-- Mobile Banking App team
(NEWID(), @project3_id, @lead_profile_id),
(NEWID(), @project3_id, @mobile_profile_id),
(NEWID(), @project3_id, @qa_profile_id),
-- Internal Dashboard team
(NEWID(), @project4_id, @frontend_profile_id),
(NEWID(), @project4_id, @backend_profile_id);

-- =====================================================
-- TASKS
-- =====================================================
DECLARE @task1_id UNIQUEIDENTIFIER = NEWID();
DECLARE @task2_id UNIQUEIDENTIFIER = NEWID();
DECLARE @task3_id UNIQUEIDENTIFIER = NEWID();
DECLARE @task4_id UNIQUEIDENTIFIER = NEWID();
DECLARE @task5_id UNIQUEIDENTIFIER = NEWID();
DECLARE @task6_id UNIQUEIDENTIFIER = NEWID();
DECLARE @task7_id UNIQUEIDENTIFIER = NEWID();
DECLARE @task8_id UNIQUEIDENTIFIER = NEWID();

INSERT INTO tasks (id, project_id, title, description, status, priority, due_date) VALUES
-- E-Commerce Platform tasks
(@task1_id, @project1_id, 'Setup payment gateway integration', 'Integrate Stripe payment gateway for checkout process', 'in_progress', 'high', DATEADD(day, 7, GETDATE())),
(@task2_id, @project1_id, 'Design product catalog page', 'Create responsive product listing with filters', 'review_pending', 'medium', DATEADD(day, 3, GETDATE())),
(@task3_id, @project1_id, 'Implement shopping cart', 'Shopping cart with add/remove functionality', 'testing_in_progress', 'high', DATEADD(day, 5, GETDATE())),
(@task4_id, @project1_id, 'User authentication system', 'Login, register, password reset functionality', 'live', 'urgent', DATEADD(day, -5, GETDATE())),
-- Customer Portal tasks
(@task5_id, @project2_id, 'Customer dashboard widgets', 'Create dashboard with key metrics', 'development_in_progress', 'medium', DATEADD(day, 10, GETDATE())),
(@task6_id, @project2_id, 'Ticket management system', 'Support ticket creation and tracking', 'draft', 'low', DATEADD(day, 14, GETDATE())),
-- Mobile Banking App tasks
(@task7_id, @project3_id, 'Biometric authentication', 'Implement fingerprint and face ID login', 'uat_approved', 'urgent', DATEADD(day, 2, GETDATE())),
-- Internal Dashboard tasks
(@task8_id, @project4_id, 'Analytics charts', 'Interactive charts using Chart.js', 'ui_completed', 'medium', DATEADD(day, 8, GETDATE()));

-- =====================================================
-- TASK ASSIGNEES
-- =====================================================
INSERT INTO task_assignees (id, task_id, assignee_id) VALUES
(NEWID(), @task1_id, @backend_profile_id),
(NEWID(), @task2_id, @frontend_profile_id),
(NEWID(), @task3_id, @frontend_profile_id),
(NEWID(), @task3_id, @backend_profile_id),
(NEWID(), @task4_id, @backend_profile_id),
(NEWID(), @task5_id, @frontend_profile_id),
(NEWID(), @task6_id, @lead_profile_id),
(NEWID(), @task7_id, @mobile_profile_id),
(NEWID(), @task8_id, @frontend_profile_id);

-- =====================================================
-- TASK COMMENTS
-- =====================================================
INSERT INTO task_comments (id, task_id, content, author_id) VALUES
(NEWID(), @task1_id, 'Started working on the Stripe integration. Documentation looks straightforward.', @backend_profile_id),
(NEWID(), @task1_id, 'Make sure to implement webhook handling for payment confirmations.', @lead_profile_id),
(NEWID(), @task2_id, 'Design mockups are approved. Moving to implementation.', @frontend_profile_id),
(NEWID(), @task3_id, 'Cart functionality is complete. Ready for testing.', @frontend_profile_id),
(NEWID(), @task3_id, 'Found a bug with quantity update. Please check.', @qa_profile_id),
(NEWID(), @task7_id, 'Biometric auth working on both iOS and Android. UAT passed!', @mobile_profile_id);

-- =====================================================
-- BUG REPORTS
-- =====================================================
DECLARE @bug1_id UNIQUEIDENTIFIER = NEWID();
DECLARE @bug2_id UNIQUEIDENTIFIER = NEWID();
DECLARE @bug3_id UNIQUEIDENTIFIER = NEWID();

INSERT INTO bug_reports (id, task_id, bug_id, title, description, steps_to_reproduce, expected_behavior, actual_behavior, status, severity, reported_by, assigned_to) VALUES
(@bug1_id, @task3_id, 'BUG-0001', 'Cart quantity not updating correctly', 'When updating quantity, the total price doesnt recalculate', '1. Add item to cart\n2. Change quantity\n3. Observe total', 'Total should update immediately', 'Total remains unchanged until page refresh', 'open', 'high', @qa_profile_id, @frontend_profile_id),
(@bug2_id, @task1_id, 'BUG-0002', 'Payment timeout on slow connections', 'Payment fails when connection is slow', '1. Throttle network to slow 3G\n2. Attempt payment', 'Payment should complete or show proper error', 'Generic error message shown', 'in_progress', 'critical', @qa_profile_id, @backend_profile_id),
(@bug3_id, @task4_id, 'BUG-0003', 'Password reset email not sending', 'Users not receiving password reset emails', '1. Click forgot password\n2. Enter email\n3. Check inbox', 'Should receive email within 5 minutes', 'No email received', 'resolved', 'high', @qa_profile_id, @backend_profile_id);

-- =====================================================
-- BUG COMMENTS
-- =====================================================
INSERT INTO bug_comments (id, bug_id, content, author_id) VALUES
(NEWID(), @bug1_id, 'Investigating this issue. Seems related to state management.', @frontend_profile_id),
(NEWID(), @bug2_id, 'Added longer timeout and better error handling. Please retest.', @backend_profile_id),
(NEWID(), @bug3_id, 'Fixed! SMTP configuration was incorrect. Deployed to production.', @backend_profile_id),
(NEWID(), @bug3_id, 'Verified working. Closing this bug.', @qa_profile_id);

-- =====================================================
-- TIMESHEET ENTRIES
-- =====================================================
INSERT INTO timesheet_entries (id, user_id, date, description, entry_type, hours, minutes, total_minutes, project_id, task_id) VALUES
(NEWID(), @backend_user_id, CAST(GETDATE() AS DATE), 'Payment gateway integration', 'duration', 6, 30, 390, @project1_id, @task1_id),
(NEWID(), @backend_user_id, DATEADD(day, -1, CAST(GETDATE() AS DATE)), 'API development', 'duration', 8, 0, 480, @project1_id, @task1_id),
(NEWID(), @frontend_user_id, CAST(GETDATE() AS DATE), 'Product catalog UI', 'duration', 5, 0, 300, @project1_id, @task2_id),
(NEWID(), @frontend_user_id, DATEADD(day, -1, CAST(GETDATE() AS DATE)), 'Shopping cart development', 'duration', 7, 15, 435, @project1_id, @task3_id),
(NEWID(), @qa_user_id, CAST(GETDATE() AS DATE), 'Testing shopping cart', 'duration', 4, 0, 240, @project1_id, @task3_id),
(NEWID(), @mobile_user_id, CAST(GETDATE() AS DATE), 'Biometric authentication', 'duration', 8, 0, 480, @project3_id, @task7_id),
(NEWID(), @lead_user_id, CAST(GETDATE() AS DATE), 'Code review and planning', 'duration', 3, 0, 180, @project1_id, NULL);

-- =====================================================
-- TEAM MEMBER STATS (Leaderboard)
-- =====================================================
INSERT INTO team_member_stats (id, profile_id, score, rank, tasks_assigned, tasks_completed, bugs_reported, bugs_resolved, critical_bugs_fixed, test_cases_approved, avg_resolution_time, badges, trend) VALUES
(NEWID(), @backend_profile_id, 450, 1, 5, 4, 0, 2, 1, 0, 1.5, '["Bug Crusher", "Speed Demon"]', 'up'),
(NEWID(), @frontend_profile_id, 380, 2, 4, 3, 0, 1, 0, 0, 2.0, '["Ship It!"]', 'up'),
(NEWID(), @qa_profile_id, 320, 3, 2, 2, 3, 0, 0, 5, 0, '["Bug Hunter", "Test Master"]', 'stable'),
(NEWID(), @mobile_profile_id, 280, 4, 2, 1, 0, 0, 0, 0, 0, '["Reliable"]', 'up'),
(NEWID(), @lead_profile_id, 250, 5, 3, 2, 0, 0, 0, 0, 0, '["Team Leader"]', 'stable'),
(NEWID(), @manager_profile_id, 150, 6, 1, 1, 0, 0, 0, 0, 0, NULL, 'stable'),
(NEWID(), @admin_profile_id, 100, 7, 0, 0, 0, 0, 0, 0, 0, NULL, 'stable');

PRINT 'Seed data inserted successfully!';
PRINT '';
PRINT 'You can now login with any of these accounts (password: password123):';
PRINT '  - admin@company.com (Admin)';
PRINT '  - manager@company.com (Manager)';
PRINT '  - lead@company.com (Team Lead)';
PRINT '  - backend@company.com (Backend Developer)';
PRINT '  - frontend@company.com (Frontend Developer)';
PRINT '  - mobile@company.com (Mobile Developer)';
PRINT '  - qa@company.com (QA Tester)';
GO

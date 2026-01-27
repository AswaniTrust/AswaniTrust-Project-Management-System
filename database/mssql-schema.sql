-- =====================================================
-- Project Management System - MSSQL Database Schema
-- =====================================================
-- Run: sqlcmd -S localhost -d master -i mssql-schema.sql
-- Or execute in SQL Server Management Studio

-- Create Database
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'ProjectManagementDB')
BEGIN
    CREATE DATABASE ProjectManagementDB;
END
GO

USE ProjectManagementDB;
GO

-- =====================================================
-- DROP EXISTING TABLES (for clean migration)
-- =====================================================
IF OBJECT_ID('dbo.bug_comments', 'U') IS NOT NULL DROP TABLE dbo.bug_comments;
IF OBJECT_ID('dbo.bug_attachments', 'U') IS NOT NULL DROP TABLE dbo.bug_attachments;
IF OBJECT_ID('dbo.bug_reports', 'U') IS NOT NULL DROP TABLE dbo.bug_reports;
IF OBJECT_ID('dbo.comment_attachments', 'U') IS NOT NULL DROP TABLE dbo.comment_attachments;
IF OBJECT_ID('dbo.task_comments', 'U') IS NOT NULL DROP TABLE dbo.task_comments;
IF OBJECT_ID('dbo.task_assignees', 'U') IS NOT NULL DROP TABLE dbo.task_assignees;
IF OBJECT_ID('dbo.test_case_documents', 'U') IS NOT NULL DROP TABLE dbo.test_case_documents;
IF OBJECT_ID('dbo.documents', 'U') IS NOT NULL DROP TABLE dbo.documents;
IF OBJECT_ID('dbo.timesheet_entries', 'U') IS NOT NULL DROP TABLE dbo.timesheet_entries;
IF OBJECT_ID('dbo.team_member_stats', 'U') IS NOT NULL DROP TABLE dbo.team_member_stats;
IF OBJECT_ID('dbo.tasks', 'U') IS NOT NULL DROP TABLE dbo.tasks;
IF OBJECT_ID('dbo.project_members', 'U') IS NOT NULL DROP TABLE dbo.project_members;
IF OBJECT_ID('dbo.projects', 'U') IS NOT NULL DROP TABLE dbo.projects;
IF OBJECT_ID('dbo.companies', 'U') IS NOT NULL DROP TABLE dbo.companies;
IF OBJECT_ID('dbo.role_permissions', 'U') IS NOT NULL DROP TABLE dbo.role_permissions;
IF OBJECT_ID('dbo.user_roles', 'U') IS NOT NULL DROP TABLE dbo.user_roles;
IF OBJECT_ID('dbo.profiles', 'U') IS NOT NULL DROP TABLE dbo.profiles;
IF OBJECT_ID('dbo.users', 'U') IS NOT NULL DROP TABLE dbo.users;
GO

-- =====================================================
-- USERS TABLE (replaces Supabase Auth)
-- =====================================================
CREATE TABLE dbo.users (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    email NVARCHAR(255) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    email_confirmed BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    last_sign_in_at DATETIME2 NULL
);
GO

-- =====================================================
-- PROFILES TABLE
-- =====================================================
CREATE TABLE dbo.profiles (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL UNIQUE,
    name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) NOT NULL,
    avatar_url NVARCHAR(500) NULL,
    designation NVARCHAR(100) NULL,
    role NVARCHAR(50) NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT FK_profiles_users FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE
);
GO

-- =====================================================
-- USER ROLES TABLE
-- =====================================================
CREATE TABLE dbo.user_roles (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL,
    role NVARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'team_lead', 'backend_developer', 'frontend_developer', 'mobile_developer', 'testing_team')),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT FK_user_roles_users FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE
);
GO

-- =====================================================
-- ROLE PERMISSIONS TABLE
-- =====================================================
CREATE TABLE dbo.role_permissions (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    role NVARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'team_lead', 'backend_developer', 'frontend_developer', 'mobile_developer', 'testing_team')),
    permission_key NVARCHAR(100) NOT NULL,
    can_view BIT DEFAULT 0,
    can_edit BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_role_permissions UNIQUE (role, permission_key)
);
GO

-- =====================================================
-- COMPANIES TABLE
-- =====================================================
CREATE TABLE dbo.companies (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    logo NVARCHAR(500) NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);
GO

-- =====================================================
-- PROJECTS TABLE
-- =====================================================
CREATE TABLE dbo.projects (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    company_id UNIQUEIDENTIFIER NOT NULL,
    name NVARCHAR(255) NOT NULL,
    type NVARCHAR(50) NOT NULL CHECK (type IN ('crm', 'website', 'mobile_app', 'internal_software')),
    description NVARCHAR(MAX) NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT FK_projects_companies FOREIGN KEY (company_id) REFERENCES dbo.companies(id) ON DELETE CASCADE
);
GO

-- =====================================================
-- PROJECT MEMBERS TABLE
-- =====================================================
CREATE TABLE dbo.project_members (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    project_id UNIQUEIDENTIFIER NOT NULL,
    member_id UNIQUEIDENTIFIER NOT NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT FK_project_members_projects FOREIGN KEY (project_id) REFERENCES dbo.projects(id) ON DELETE CASCADE,
    CONSTRAINT FK_project_members_profiles FOREIGN KEY (member_id) REFERENCES dbo.profiles(id),
    CONSTRAINT UQ_project_members UNIQUE (project_id, member_id)
);
GO

-- =====================================================
-- TASKS TABLE
-- =====================================================
CREATE TABLE dbo.tasks (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    project_id UNIQUEIDENTIFIER NOT NULL,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX) NULL,
    status NVARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'backlog', 'in_progress', 'development_in_progress', 'review_pending', 'testing_in_progress', 'testing_failed', 'ui_completed', 'uat_approved', 'live')),
    priority NVARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date DATE NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT FK_tasks_projects FOREIGN KEY (project_id) REFERENCES dbo.projects(id) ON DELETE CASCADE
);
GO

-- =====================================================
-- TASK ASSIGNEES TABLE
-- =====================================================
CREATE TABLE dbo.task_assignees (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    task_id UNIQUEIDENTIFIER NOT NULL,
    assignee_id UNIQUEIDENTIFIER NOT NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT FK_task_assignees_tasks FOREIGN KEY (task_id) REFERENCES dbo.tasks(id) ON DELETE CASCADE,
    CONSTRAINT FK_task_assignees_profiles FOREIGN KEY (assignee_id) REFERENCES dbo.profiles(id),
    CONSTRAINT UQ_task_assignees UNIQUE (task_id, assignee_id)
);
GO

-- =====================================================
-- TASK COMMENTS TABLE
-- =====================================================
CREATE TABLE dbo.task_comments (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    task_id UNIQUEIDENTIFIER NOT NULL,
    content NVARCHAR(MAX) NOT NULL,
    author_id UNIQUEIDENTIFIER NOT NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT FK_task_comments_tasks FOREIGN KEY (task_id) REFERENCES dbo.tasks(id) ON DELETE CASCADE,
    CONSTRAINT FK_task_comments_profiles FOREIGN KEY (author_id) REFERENCES dbo.profiles(id)
);
GO

-- =====================================================
-- COMMENT ATTACHMENTS TABLE
-- =====================================================
CREATE TABLE dbo.comment_attachments (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    comment_id UNIQUEIDENTIFIER NOT NULL,
    name NVARCHAR(255) NOT NULL,
    url NVARCHAR(500) NOT NULL,
    type NVARCHAR(100) NULL,
    size BIGINT NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT FK_comment_attachments_comments FOREIGN KEY (comment_id) REFERENCES dbo.task_comments(id) ON DELETE CASCADE
);
GO

-- =====================================================
-- BUG REPORTS TABLE
-- =====================================================
CREATE TABLE dbo.bug_reports (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    task_id UNIQUEIDENTIFIER NOT NULL,
    bug_id NVARCHAR(50) NOT NULL,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX) NULL,
    steps_to_reproduce NVARCHAR(MAX) NULL,
    expected_behavior NVARCHAR(MAX) NULL,
    actual_behavior NVARCHAR(MAX) NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'reopened')),
    severity NVARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    reported_by UNIQUEIDENTIFIER NOT NULL,
    assigned_to UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT FK_bug_reports_tasks FOREIGN KEY (task_id) REFERENCES dbo.tasks(id) ON DELETE CASCADE,
    CONSTRAINT FK_bug_reports_reported_by FOREIGN KEY (reported_by) REFERENCES dbo.profiles(id),
    CONSTRAINT FK_bug_reports_assigned_to FOREIGN KEY (assigned_to) REFERENCES dbo.profiles(id)
);
GO

-- =====================================================
-- BUG ATTACHMENTS TABLE
-- =====================================================
CREATE TABLE dbo.bug_attachments (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    bug_id UNIQUEIDENTIFIER NOT NULL,
    name NVARCHAR(255) NOT NULL,
    url NVARCHAR(500) NOT NULL,
    type NVARCHAR(100) NULL,
    size BIGINT NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT FK_bug_attachments_bugs FOREIGN KEY (bug_id) REFERENCES dbo.bug_reports(id) ON DELETE CASCADE
);
GO

-- =====================================================
-- BUG COMMENTS TABLE
-- =====================================================
CREATE TABLE dbo.bug_comments (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    bug_id UNIQUEIDENTIFIER NOT NULL,
    content NVARCHAR(MAX) NOT NULL,
    author_id UNIQUEIDENTIFIER NOT NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT FK_bug_comments_bugs FOREIGN KEY (bug_id) REFERENCES dbo.bug_reports(id) ON DELETE CASCADE,
    CONSTRAINT FK_bug_comments_profiles FOREIGN KEY (author_id) REFERENCES dbo.profiles(id)
);
GO

-- =====================================================
-- DOCUMENTS TABLE
-- =====================================================
CREATE TABLE dbo.documents (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    url NVARCHAR(500) NOT NULL,
    type NVARCHAR(100) NULL,
    size BIGINT NULL,
    uploaded_by UNIQUEIDENTIFIER NOT NULL,
    project_id UNIQUEIDENTIFIER NULL,
    task_id UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT FK_documents_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES dbo.profiles(id),
    CONSTRAINT FK_documents_projects FOREIGN KEY (project_id) REFERENCES dbo.projects(id),
    CONSTRAINT FK_documents_tasks FOREIGN KEY (task_id) REFERENCES dbo.tasks(id)
);
GO

-- =====================================================
-- TEST CASE DOCUMENTS TABLE
-- =====================================================
CREATE TABLE dbo.test_case_documents (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    task_id UNIQUEIDENTIFIER NOT NULL,
    document_name NVARCHAR(255) NOT NULL,
    document_url NVARCHAR(500) NOT NULL,
    document_type NVARCHAR(100) NULL,
    document_size BIGINT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    submitted_by UNIQUEIDENTIFIER NOT NULL,
    submitted_at DATETIME2 DEFAULT GETUTCDATE(),
    reviewed_by UNIQUEIDENTIFIER NULL,
    reviewed_at DATETIME2 NULL,
    review_notes NVARCHAR(MAX) NULL,
    CONSTRAINT FK_test_case_documents_tasks FOREIGN KEY (task_id) REFERENCES dbo.tasks(id) ON DELETE CASCADE,
    CONSTRAINT FK_test_case_documents_submitted_by FOREIGN KEY (submitted_by) REFERENCES dbo.profiles(id),
    CONSTRAINT FK_test_case_documents_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES dbo.profiles(id)
);
GO

-- =====================================================
-- TIMESHEET ENTRIES TABLE
-- =====================================================
CREATE TABLE dbo.timesheet_entries (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL,
    date DATE NOT NULL,
    description NVARCHAR(MAX) NULL,
    entry_type NVARCHAR(50) NULL,
    start_time TIME NULL,
    end_time TIME NULL,
    hours INT NULL,
    minutes INT NULL,
    total_minutes INT NULL,
    project_id UNIQUEIDENTIFIER NULL,
    task_id UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT FK_timesheet_entries_users FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE,
    CONSTRAINT FK_timesheet_entries_projects FOREIGN KEY (project_id) REFERENCES dbo.projects(id),
    CONSTRAINT FK_timesheet_entries_tasks FOREIGN KEY (task_id) REFERENCES dbo.tasks(id)
);
GO

-- =====================================================
-- TEAM MEMBER STATS TABLE
-- =====================================================
CREATE TABLE dbo.team_member_stats (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    profile_id UNIQUEIDENTIFIER NOT NULL UNIQUE,
    score INT DEFAULT 0,
    rank INT NULL,
    tasks_assigned INT DEFAULT 0,
    tasks_completed INT DEFAULT 0,
    bugs_reported INT DEFAULT 0,
    bugs_resolved INT DEFAULT 0,
    critical_bugs_fixed INT DEFAULT 0,
    test_cases_approved INT DEFAULT 0,
    avg_resolution_time DECIMAL(10, 2) NULL,
    badges NVARCHAR(MAX) NULL,
    trend NVARCHAR(20) NULL CHECK (trend IN ('up', 'down', 'stable')),
    calculated_at DATETIME2 DEFAULT GETUTCDATE(),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT FK_team_member_stats_profiles FOREIGN KEY (profile_id) REFERENCES dbo.profiles(id) ON DELETE CASCADE
);
GO

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IX_profiles_user_id ON dbo.profiles(user_id);
CREATE INDEX IX_user_roles_user_id ON dbo.user_roles(user_id);
CREATE INDEX IX_projects_company_id ON dbo.projects(company_id);
CREATE INDEX IX_tasks_project_id ON dbo.tasks(project_id);
CREATE INDEX IX_tasks_status ON dbo.tasks(status);
CREATE INDEX IX_task_assignees_task_id ON dbo.task_assignees(task_id);
CREATE INDEX IX_task_assignees_assignee_id ON dbo.task_assignees(assignee_id);
CREATE INDEX IX_task_comments_task_id ON dbo.task_comments(task_id);
CREATE INDEX IX_bug_reports_task_id ON dbo.bug_reports(task_id);
CREATE INDEX IX_bug_reports_status ON dbo.bug_reports(status);
CREATE INDEX IX_timesheet_entries_user_id ON dbo.timesheet_entries(user_id);
CREATE INDEX IX_timesheet_entries_date ON dbo.timesheet_entries(date);
GO

-- =====================================================
-- DEFAULT ROLE PERMISSIONS
-- =====================================================
INSERT INTO dbo.role_permissions (role, permission_key, can_view, can_edit) VALUES
('admin', 'companies', 1, 1), ('admin', 'projects', 1, 1), ('admin', 'tasks', 1, 1), ('admin', 'bugs', 1, 1), ('admin', 'team_members', 1, 1), ('admin', 'timesheets', 1, 1), ('admin', 'settings', 1, 1), ('admin', 'leaderboard', 1, 1),
('manager', 'companies', 1, 1), ('manager', 'projects', 1, 1), ('manager', 'tasks', 1, 1), ('manager', 'bugs', 1, 1), ('manager', 'team_members', 1, 0), ('manager', 'timesheets', 1, 1), ('manager', 'settings', 1, 0), ('manager', 'leaderboard', 1, 0),
('team_lead', 'companies', 1, 0), ('team_lead', 'projects', 1, 0), ('team_lead', 'tasks', 1, 1), ('team_lead', 'bugs', 1, 1), ('team_lead', 'team_members', 1, 0), ('team_lead', 'timesheets', 1, 1), ('team_lead', 'settings', 0, 0), ('team_lead', 'leaderboard', 1, 0),
('backend_developer', 'companies', 1, 0), ('backend_developer', 'projects', 1, 0), ('backend_developer', 'tasks', 1, 1), ('backend_developer', 'bugs', 1, 1), ('backend_developer', 'team_members', 1, 0), ('backend_developer', 'timesheets', 1, 1), ('backend_developer', 'settings', 0, 0), ('backend_developer', 'leaderboard', 1, 0),
('frontend_developer', 'companies', 1, 0), ('frontend_developer', 'projects', 1, 0), ('frontend_developer', 'tasks', 1, 1), ('frontend_developer', 'bugs', 1, 1), ('frontend_developer', 'team_members', 1, 0), ('frontend_developer', 'timesheets', 1, 1), ('frontend_developer', 'settings', 0, 0), ('frontend_developer', 'leaderboard', 1, 0),
('mobile_developer', 'companies', 1, 0), ('mobile_developer', 'projects', 1, 0), ('mobile_developer', 'tasks', 1, 1), ('mobile_developer', 'bugs', 1, 1), ('mobile_developer', 'team_members', 1, 0), ('mobile_developer', 'timesheets', 1, 1), ('mobile_developer', 'settings', 0, 0), ('mobile_developer', 'leaderboard', 1, 0),
('testing_team', 'companies', 1, 0), ('testing_team', 'projects', 1, 0), ('testing_team', 'tasks', 1, 0), ('testing_team', 'bugs', 1, 1), ('testing_team', 'team_members', 1, 0), ('testing_team', 'timesheets', 1, 1), ('testing_team', 'settings', 0, 0), ('testing_team', 'leaderboard', 1, 0);
GO

PRINT 'MSSQL Database schema created successfully!';
GO

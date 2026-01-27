# Project Management System - Backend API

This is the Node.js/Express backend API that connects to Microsoft SQL Server.

## Prerequisites

1. **SQL Server** installed and running (local or remote)
2. **Node.js** v18 or higher
3. **npm** or **yarn**

## Setup Instructions

### 1. Create the Database

Run the SQL schema in SQL Server Management Studio or via command line:

```bash
sqlcmd -S localhost -U sa -P YourPassword -i ../database/mssql-schema.sql
```

Or open `../database/mssql-schema.sql` in SSMS and execute it.

### 2. Configure Environment Variables

Copy the `.env` file and update the database credentials:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# MSSQL Database Configuration
DB_SERVER=localhost
DB_NAME=ProjectManagementDB
DB_USER=sa
DB_PASSWORD=YourActualPassword
DB_PORT=1433

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

### 3. Install Dependencies

```bash
cd server
npm install
```

### 4. Start the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The API will be available at `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/signin` - Sign in
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password
- `PUT /api/auth/profile` - Update profile

### Companies
- `GET /api/companies` - List all companies
- `GET /api/companies/:id` - Get company by ID
- `POST /api/companies` - Create company
- `PUT /api/companies/:id` - Update company
- `DELETE /api/companies/:id` - Delete company

### Projects
- `GET /api/projects` - List all projects
- `GET /api/projects/:id` - Get project with members
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/members` - Add member
- `DELETE /api/projects/:id/members/:memberId` - Remove member

### Tasks
- `GET /api/tasks` - List tasks (filterable by project_id, status)
- `GET /api/tasks/:id` - Get task with assignees and comments
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/comments` - Add comment

### Bugs
- `GET /api/bugs` - List bugs (filterable by task_id, status)
- `GET /api/bugs/:id` - Get bug with attachments and comments
- `POST /api/bugs` - Report bug
- `PUT /api/bugs/:id` - Update bug
- `DELETE /api/bugs/:id` - Delete bug
- `POST /api/bugs/:id/comments` - Add comment

### Team
- `GET /api/team/members` - List team members
- `GET /api/team/stats` - Get leaderboard stats
- `POST /api/team/members` - Create team member
- `PUT /api/team/members/:id/role` - Update member role
- `GET /api/team/permissions` - Get role permissions
- `PUT /api/team/permissions` - Update permission

### Timesheets
- `GET /api/timesheets` - List all timesheets
- `GET /api/timesheets/my` - List current user's timesheets
- `POST /api/timesheets` - Create entry
- `PUT /api/timesheets/:id` - Update entry
- `DELETE /api/timesheets/:id` - Delete entry

### Uploads
- `POST /api/uploads` - Upload file
- `GET /api/uploads` - List documents
- `DELETE /api/uploads/:id` - Delete document

## Database Tables

The MSSQL database includes the following tables:
- `users` - User authentication
- `profiles` - User profiles
- `user_roles` - Role assignments
- `role_permissions` - Permission configuration
- `companies` - Companies/organizations
- `projects` - Projects
- `project_members` - Project membership
- `tasks` - Tasks
- `task_assignees` - Task assignments
- `task_comments` - Task comments
- `comment_attachments` - Comment files
- `bug_reports` - Bug reports
- `bug_attachments` - Bug files
- `bug_comments` - Bug comments
- `documents` - General documents
- `test_case_documents` - Test case files
- `timesheet_entries` - Time tracking
- `team_member_stats` - Leaderboard stats

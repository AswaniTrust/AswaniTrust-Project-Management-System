/**
 * Database Seed Script
 * Run: node src/seed.js
 * 
 * This will populate the database with sample data.
 * All users will have password: password123
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getPool, sql, closePool } = require('./config/database');

const DEFAULT_PASSWORD = 'password123';

async function seed() {
  console.log('Starting database seed...\n');
  
  try {
    const pool = await getPool();
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    // Clear existing data (in reverse order of dependencies)
    console.log('Clearing existing data...');
    await pool.request().query('DELETE FROM team_member_stats');
    await pool.request().query('DELETE FROM timesheet_entries');
    await pool.request().query('DELETE FROM bug_comments');
    await pool.request().query('DELETE FROM bug_attachments');
    await pool.request().query('DELETE FROM bug_reports');
    await pool.request().query('DELETE FROM comment_attachments');
    await pool.request().query('DELETE FROM task_comments');
    await pool.request().query('DELETE FROM task_assignees');
    await pool.request().query('DELETE FROM test_case_documents');
    await pool.request().query('DELETE FROM documents');
    await pool.request().query('DELETE FROM tasks');
    await pool.request().query('DELETE FROM project_members');
    await pool.request().query('DELETE FROM projects');
    await pool.request().query('DELETE FROM companies');
    await pool.request().query('DELETE FROM user_roles');
    await pool.request().query('DELETE FROM profiles');
    await pool.request().query('DELETE FROM users');

    // =====================================================
    // CREATE USERS
    // =====================================================
    console.log('Creating users...');
    
    const users = [
      { email: 'admin@company.com', name: 'John Admin', designation: 'System Administrator', role: 'admin' },
      { email: 'manager@company.com', name: 'Sarah Manager', designation: 'Project Manager', role: 'manager' },
      { email: 'lead@company.com', name: 'Mike Lead', designation: 'Technical Lead', role: 'team_lead' },
      { email: 'backend@company.com', name: 'Alex Backend', designation: 'Senior Backend Developer', role: 'backend_developer' },
      { email: 'frontend@company.com', name: 'Emma Frontend', designation: 'Frontend Developer', role: 'frontend_developer' },
      { email: 'mobile@company.com', name: 'David Mobile', designation: 'Mobile Developer', role: 'mobile_developer' },
      { email: 'qa@company.com', name: 'Lisa QA', designation: 'QA Engineer', role: 'testing_team' },
    ];

    const createdUsers = [];
    
    for (const user of users) {
      const userId = uuidv4();
      const profileId = uuidv4();
      
      await pool.request()
        .input('id', sql.UniqueIdentifier, userId)
        .input('email', sql.NVarChar, user.email)
        .input('password_hash', sql.NVarChar, passwordHash)
        .query('INSERT INTO users (id, email, password_hash, email_confirmed) VALUES (@id, @email, @password_hash, 1)');
      
      await pool.request()
        .input('id', sql.UniqueIdentifier, profileId)
        .input('user_id', sql.UniqueIdentifier, userId)
        .input('name', sql.NVarChar, user.name)
        .input('email', sql.NVarChar, user.email)
        .input('designation', sql.NVarChar, user.designation)
        .input('role', sql.NVarChar, user.role)
        .query('INSERT INTO profiles (id, user_id, name, email, designation, role) VALUES (@id, @user_id, @name, @email, @designation, @role)');
      
      await pool.request()
        .input('id', sql.UniqueIdentifier, uuidv4())
        .input('user_id', sql.UniqueIdentifier, userId)
        .input('role', sql.NVarChar, user.role)
        .query('INSERT INTO user_roles (id, user_id, role) VALUES (@id, @user_id, @role)');
      
      createdUsers.push({ ...user, userId, profileId });
      console.log(`  Created: ${user.name} (${user.email})`);
    }

    const getProfile = (role) => createdUsers.find(u => u.role === role);
    const adminProfile = getProfile('admin');
    const managerProfile = getProfile('manager');
    const leadProfile = getProfile('team_lead');
    const backendProfile = getProfile('backend_developer');
    const frontendProfile = getProfile('frontend_developer');
    const mobileProfile = getProfile('mobile_developer');
    const qaProfile = getProfile('testing_team');

    // =====================================================
    // CREATE COMPANIES
    // =====================================================
    console.log('\nCreating companies...');
    
    const companies = [
      { name: 'TechCorp Solutions' },
      { name: 'Digital Innovations Ltd' },
      { name: 'StartupXYZ' },
    ];

    const createdCompanies = [];
    
    for (const company of companies) {
      const companyId = uuidv4();
      await pool.request()
        .input('id', sql.UniqueIdentifier, companyId)
        .input('name', sql.NVarChar, company.name)
        .query('INSERT INTO companies (id, name) VALUES (@id, @name)');
      createdCompanies.push({ ...company, id: companyId });
      console.log(`  Created: ${company.name}`);
    }

    // =====================================================
    // CREATE PROJECTS
    // =====================================================
    console.log('\nCreating projects...');
    
    const projects = [
      { companyIndex: 0, name: 'E-Commerce Platform', type: 'website', description: 'Full-featured e-commerce platform with payment integration' },
      { companyIndex: 0, name: 'Customer Portal', type: 'crm', description: 'Customer relationship management portal' },
      { companyIndex: 1, name: 'Mobile Banking App', type: 'mobile_app', description: 'Secure mobile banking application for iOS and Android' },
      { companyIndex: 2, name: 'Internal Dashboard', type: 'internal_software', description: 'Analytics and reporting dashboard' },
    ];

    const createdProjects = [];
    
    for (const project of projects) {
      const projectId = uuidv4();
      await pool.request()
        .input('id', sql.UniqueIdentifier, projectId)
        .input('company_id', sql.UniqueIdentifier, createdCompanies[project.companyIndex].id)
        .input('name', sql.NVarChar, project.name)
        .input('type', sql.NVarChar, project.type)
        .input('description', sql.NVarChar, project.description)
        .query('INSERT INTO projects (id, company_id, name, type, description) VALUES (@id, @company_id, @name, @type, @description)');
      createdProjects.push({ ...project, id: projectId });
      console.log(`  Created: ${project.name}`);
    }

    // =====================================================
    // ADD PROJECT MEMBERS
    // =====================================================
    console.log('\nAdding project members...');
    
    const projectMembers = [
      { projectIndex: 0, profileId: leadProfile.profileId },
      { projectIndex: 0, profileId: backendProfile.profileId },
      { projectIndex: 0, profileId: frontendProfile.profileId },
      { projectIndex: 0, profileId: qaProfile.profileId },
      { projectIndex: 1, profileId: leadProfile.profileId },
      { projectIndex: 1, profileId: backendProfile.profileId },
      { projectIndex: 1, profileId: qaProfile.profileId },
      { projectIndex: 2, profileId: leadProfile.profileId },
      { projectIndex: 2, profileId: mobileProfile.profileId },
      { projectIndex: 2, profileId: qaProfile.profileId },
      { projectIndex: 3, profileId: frontendProfile.profileId },
      { projectIndex: 3, profileId: backendProfile.profileId },
    ];

    for (const pm of projectMembers) {
      await pool.request()
        .input('id', sql.UniqueIdentifier, uuidv4())
        .input('project_id', sql.UniqueIdentifier, createdProjects[pm.projectIndex].id)
        .input('member_id', sql.UniqueIdentifier, pm.profileId)
        .query('INSERT INTO project_members (id, project_id, member_id) VALUES (@id, @project_id, @member_id)');
    }
    console.log(`  Added ${projectMembers.length} project memberships`);

    // =====================================================
    // CREATE TASKS
    // =====================================================
    console.log('\nCreating tasks...');
    
    const tasks = [
      { projectIndex: 0, title: 'Setup payment gateway integration', description: 'Integrate Stripe payment gateway for checkout process', status: 'in_progress', priority: 'high', daysUntilDue: 7 },
      { projectIndex: 0, title: 'Design product catalog page', description: 'Create responsive product listing with filters', status: 'review_pending', priority: 'medium', daysUntilDue: 3 },
      { projectIndex: 0, title: 'Implement shopping cart', description: 'Shopping cart with add/remove functionality', status: 'testing_in_progress', priority: 'high', daysUntilDue: 5 },
      { projectIndex: 0, title: 'User authentication system', description: 'Login, register, password reset functionality', status: 'live', priority: 'urgent', daysUntilDue: -5 },
      { projectIndex: 1, title: 'Customer dashboard widgets', description: 'Create dashboard with key metrics', status: 'development_in_progress', priority: 'medium', daysUntilDue: 10 },
      { projectIndex: 1, title: 'Ticket management system', description: 'Support ticket creation and tracking', status: 'draft', priority: 'low', daysUntilDue: 14 },
      { projectIndex: 2, title: 'Biometric authentication', description: 'Implement fingerprint and face ID login', status: 'uat_approved', priority: 'urgent', daysUntilDue: 2 },
      { projectIndex: 3, title: 'Analytics charts', description: 'Interactive charts using Chart.js', status: 'ui_completed', priority: 'medium', daysUntilDue: 8 },
    ];

    const createdTasks = [];
    
    for (const task of tasks) {
      const taskId = uuidv4();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + task.daysUntilDue);
      
      await pool.request()
        .input('id', sql.UniqueIdentifier, taskId)
        .input('project_id', sql.UniqueIdentifier, createdProjects[task.projectIndex].id)
        .input('title', sql.NVarChar, task.title)
        .input('description', sql.NVarChar, task.description)
        .input('status', sql.NVarChar, task.status)
        .input('priority', sql.NVarChar, task.priority)
        .input('due_date', sql.Date, dueDate)
        .query('INSERT INTO tasks (id, project_id, title, description, status, priority, due_date) VALUES (@id, @project_id, @title, @description, @status, @priority, @due_date)');
      
      createdTasks.push({ ...task, id: taskId });
      console.log(`  Created: ${task.title}`);
    }

    // =====================================================
    // ADD TASK ASSIGNEES
    // =====================================================
    console.log('\nAdding task assignees...');
    
    const taskAssignees = [
      { taskIndex: 0, profileId: backendProfile.profileId },
      { taskIndex: 1, profileId: frontendProfile.profileId },
      { taskIndex: 2, profileId: frontendProfile.profileId },
      { taskIndex: 2, profileId: backendProfile.profileId },
      { taskIndex: 3, profileId: backendProfile.profileId },
      { taskIndex: 4, profileId: frontendProfile.profileId },
      { taskIndex: 5, profileId: leadProfile.profileId },
      { taskIndex: 6, profileId: mobileProfile.profileId },
      { taskIndex: 7, profileId: frontendProfile.profileId },
    ];

    for (const ta of taskAssignees) {
      await pool.request()
        .input('id', sql.UniqueIdentifier, uuidv4())
        .input('task_id', sql.UniqueIdentifier, createdTasks[ta.taskIndex].id)
        .input('assignee_id', sql.UniqueIdentifier, ta.profileId)
        .query('INSERT INTO task_assignees (id, task_id, assignee_id) VALUES (@id, @task_id, @assignee_id)');
    }
    console.log(`  Added ${taskAssignees.length} task assignments`);

    // =====================================================
    // ADD TASK COMMENTS
    // =====================================================
    console.log('\nAdding task comments...');
    
    const taskComments = [
      { taskIndex: 0, content: 'Started working on the Stripe integration. Documentation looks straightforward.', authorProfileId: backendProfile.profileId },
      { taskIndex: 0, content: 'Make sure to implement webhook handling for payment confirmations.', authorProfileId: leadProfile.profileId },
      { taskIndex: 1, content: 'Design mockups are approved. Moving to implementation.', authorProfileId: frontendProfile.profileId },
      { taskIndex: 2, content: 'Cart functionality is complete. Ready for testing.', authorProfileId: frontendProfile.profileId },
      { taskIndex: 2, content: 'Found a bug with quantity update. Please check.', authorProfileId: qaProfile.profileId },
      { taskIndex: 6, content: 'Biometric auth working on both iOS and Android. UAT passed!', authorProfileId: mobileProfile.profileId },
    ];

    for (const comment of taskComments) {
      await pool.request()
        .input('id', sql.UniqueIdentifier, uuidv4())
        .input('task_id', sql.UniqueIdentifier, createdTasks[comment.taskIndex].id)
        .input('content', sql.NVarChar, comment.content)
        .input('author_id', sql.UniqueIdentifier, comment.authorProfileId)
        .query('INSERT INTO task_comments (id, task_id, content, author_id) VALUES (@id, @task_id, @content, @author_id)');
    }
    console.log(`  Added ${taskComments.length} comments`);

    // =====================================================
    // ADD BUG REPORTS
    // =====================================================
    console.log('\nAdding bug reports...');
    
    const bugReports = [
      { 
        taskIndex: 2, 
        bugId: 'BUG-0001', 
        title: 'Cart quantity not updating correctly',
        description: 'When updating quantity, the total price doesnt recalculate',
        stepsToReproduce: '1. Add item to cart\n2. Change quantity\n3. Observe total',
        expectedBehavior: 'Total should update immediately',
        actualBehavior: 'Total remains unchanged until page refresh',
        status: 'open',
        severity: 'high',
        reportedBy: qaProfile.profileId,
        assignedTo: frontendProfile.profileId
      },
      { 
        taskIndex: 0, 
        bugId: 'BUG-0002', 
        title: 'Payment timeout on slow connections',
        description: 'Payment fails when connection is slow',
        stepsToReproduce: '1. Throttle network to slow 3G\n2. Attempt payment',
        expectedBehavior: 'Payment should complete or show proper error',
        actualBehavior: 'Generic error message shown',
        status: 'in_progress',
        severity: 'critical',
        reportedBy: qaProfile.profileId,
        assignedTo: backendProfile.profileId
      },
      { 
        taskIndex: 3, 
        bugId: 'BUG-0003', 
        title: 'Password reset email not sending',
        description: 'Users not receiving password reset emails',
        stepsToReproduce: '1. Click forgot password\n2. Enter email\n3. Check inbox',
        expectedBehavior: 'Should receive email within 5 minutes',
        actualBehavior: 'No email received',
        status: 'resolved',
        severity: 'high',
        reportedBy: qaProfile.profileId,
        assignedTo: backendProfile.profileId
      },
    ];

    const createdBugs = [];

    for (const bug of bugReports) {
      const bugUuid = uuidv4();
      await pool.request()
        .input('id', sql.UniqueIdentifier, bugUuid)
        .input('task_id', sql.UniqueIdentifier, createdTasks[bug.taskIndex].id)
        .input('bug_id', sql.NVarChar, bug.bugId)
        .input('title', sql.NVarChar, bug.title)
        .input('description', sql.NVarChar, bug.description)
        .input('steps_to_reproduce', sql.NVarChar, bug.stepsToReproduce)
        .input('expected_behavior', sql.NVarChar, bug.expectedBehavior)
        .input('actual_behavior', sql.NVarChar, bug.actualBehavior)
        .input('status', sql.NVarChar, bug.status)
        .input('severity', sql.NVarChar, bug.severity)
        .input('reported_by', sql.UniqueIdentifier, bug.reportedBy)
        .input('assigned_to', sql.UniqueIdentifier, bug.assignedTo)
        .query(`INSERT INTO bug_reports (id, task_id, bug_id, title, description, steps_to_reproduce, expected_behavior, actual_behavior, status, severity, reported_by, assigned_to) 
                VALUES (@id, @task_id, @bug_id, @title, @description, @steps_to_reproduce, @expected_behavior, @actual_behavior, @status, @severity, @reported_by, @assigned_to)`);
      
      createdBugs.push({ ...bug, id: bugUuid });
      console.log(`  Created: ${bug.bugId} - ${bug.title}`);
    }

    // =====================================================
    // ADD BUG COMMENTS
    // =====================================================
    console.log('\nAdding bug comments...');
    
    const bugComments = [
      { bugIndex: 0, content: 'Investigating this issue. Seems related to state management.', authorProfileId: frontendProfile.profileId },
      { bugIndex: 1, content: 'Added longer timeout and better error handling. Please retest.', authorProfileId: backendProfile.profileId },
      { bugIndex: 2, content: 'Fixed! SMTP configuration was incorrect. Deployed to production.', authorProfileId: backendProfile.profileId },
      { bugIndex: 2, content: 'Verified working. Closing this bug.', authorProfileId: qaProfile.profileId },
    ];

    for (const comment of bugComments) {
      await pool.request()
        .input('id', sql.UniqueIdentifier, uuidv4())
        .input('bug_id', sql.UniqueIdentifier, createdBugs[comment.bugIndex].id)
        .input('content', sql.NVarChar, comment.content)
        .input('author_id', sql.UniqueIdentifier, comment.authorProfileId)
        .query('INSERT INTO bug_comments (id, bug_id, content, author_id) VALUES (@id, @bug_id, @content, @author_id)');
    }
    console.log(`  Added ${bugComments.length} bug comments`);

    // =====================================================
    // ADD TIMESHEET ENTRIES
    // =====================================================
    console.log('\nAdding timesheet entries...');
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const timesheetEntries = [
      { userId: backendProfile.userId, date: today, description: 'Payment gateway integration', hours: 6, minutes: 30, projectIndex: 0, taskIndex: 0 },
      { userId: backendProfile.userId, date: yesterday, description: 'API development', hours: 8, minutes: 0, projectIndex: 0, taskIndex: 0 },
      { userId: frontendProfile.userId, date: today, description: 'Product catalog UI', hours: 5, minutes: 0, projectIndex: 0, taskIndex: 1 },
      { userId: frontendProfile.userId, date: yesterday, description: 'Shopping cart development', hours: 7, minutes: 15, projectIndex: 0, taskIndex: 2 },
      { userId: qaProfile.userId, date: today, description: 'Testing shopping cart', hours: 4, minutes: 0, projectIndex: 0, taskIndex: 2 },
      { userId: mobileProfile.userId, date: today, description: 'Biometric authentication', hours: 8, minutes: 0, projectIndex: 2, taskIndex: 6 },
      { userId: leadProfile.userId, date: today, description: 'Code review and planning', hours: 3, minutes: 0, projectIndex: 0, taskIndex: null },
    ];

    for (const entry of timesheetEntries) {
      await pool.request()
        .input('id', sql.UniqueIdentifier, uuidv4())
        .input('user_id', sql.UniqueIdentifier, entry.userId)
        .input('date', sql.Date, entry.date)
        .input('description', sql.NVarChar, entry.description)
        .input('entry_type', sql.NVarChar, 'duration')
        .input('hours', sql.Int, entry.hours)
        .input('minutes', sql.Int, entry.minutes)
        .input('total_minutes', sql.Int, entry.hours * 60 + entry.minutes)
        .input('project_id', sql.UniqueIdentifier, createdProjects[entry.projectIndex].id)
        .input('task_id', sql.UniqueIdentifier, entry.taskIndex !== null ? createdTasks[entry.taskIndex].id : null)
        .query(`INSERT INTO timesheet_entries (id, user_id, date, description, entry_type, hours, minutes, total_minutes, project_id, task_id) 
                VALUES (@id, @user_id, @date, @description, @entry_type, @hours, @minutes, @total_minutes, @project_id, @task_id)`);
    }
    console.log(`  Added ${timesheetEntries.length} timesheet entries`);

    // =====================================================
    // ADD TEAM MEMBER STATS
    // =====================================================
    console.log('\nAdding team member stats...');
    
    const teamStats = [
      { profileId: backendProfile.profileId, score: 450, rank: 1, tasksAssigned: 5, tasksCompleted: 4, bugsReported: 0, bugsResolved: 2, criticalBugsFixed: 1, badges: '["Bug Crusher", "Speed Demon"]', trend: 'up' },
      { profileId: frontendProfile.profileId, score: 380, rank: 2, tasksAssigned: 4, tasksCompleted: 3, bugsReported: 0, bugsResolved: 1, criticalBugsFixed: 0, badges: '["Ship It!"]', trend: 'up' },
      { profileId: qaProfile.profileId, score: 320, rank: 3, tasksAssigned: 2, tasksCompleted: 2, bugsReported: 3, bugsResolved: 0, criticalBugsFixed: 0, testCasesApproved: 5, badges: '["Bug Hunter", "Test Master"]', trend: 'stable' },
      { profileId: mobileProfile.profileId, score: 280, rank: 4, tasksAssigned: 2, tasksCompleted: 1, bugsReported: 0, bugsResolved: 0, criticalBugsFixed: 0, badges: '["Reliable"]', trend: 'up' },
      { profileId: leadProfile.profileId, score: 250, rank: 5, tasksAssigned: 3, tasksCompleted: 2, bugsReported: 0, bugsResolved: 0, criticalBugsFixed: 0, badges: '["Team Leader"]', trend: 'stable' },
      { profileId: managerProfile.profileId, score: 150, rank: 6, tasksAssigned: 1, tasksCompleted: 1, bugsReported: 0, bugsResolved: 0, criticalBugsFixed: 0, badges: null, trend: 'stable' },
      { profileId: adminProfile.profileId, score: 100, rank: 7, tasksAssigned: 0, tasksCompleted: 0, bugsReported: 0, bugsResolved: 0, criticalBugsFixed: 0, badges: null, trend: 'stable' },
    ];

    for (const stat of teamStats) {
      await pool.request()
        .input('id', sql.UniqueIdentifier, uuidv4())
        .input('profile_id', sql.UniqueIdentifier, stat.profileId)
        .input('score', sql.Int, stat.score)
        .input('rank', sql.Int, stat.rank)
        .input('tasks_assigned', sql.Int, stat.tasksAssigned)
        .input('tasks_completed', sql.Int, stat.tasksCompleted)
        .input('bugs_reported', sql.Int, stat.bugsReported)
        .input('bugs_resolved', sql.Int, stat.bugsResolved)
        .input('critical_bugs_fixed', sql.Int, stat.criticalBugsFixed)
        .input('test_cases_approved', sql.Int, stat.testCasesApproved || 0)
        .input('badges', sql.NVarChar, stat.badges)
        .input('trend', sql.NVarChar, stat.trend)
        .query(`INSERT INTO team_member_stats (id, profile_id, score, rank, tasks_assigned, tasks_completed, bugs_reported, bugs_resolved, critical_bugs_fixed, test_cases_approved, badges, trend) 
                VALUES (@id, @profile_id, @score, @rank, @tasks_assigned, @tasks_completed, @bugs_reported, @bugs_resolved, @critical_bugs_fixed, @test_cases_approved, @badges, @trend)`);
    }
    console.log(`  Added ${teamStats.length} team stats entries`);

    // =====================================================
    // DONE
    // =====================================================
    console.log('\n========================================');
    console.log('Seed completed successfully!');
    console.log('========================================\n');
    console.log('You can now login with any of these accounts:');
    console.log('Password for all accounts: password123\n');
    console.log('  - admin@company.com     (Admin)');
    console.log('  - manager@company.com   (Manager)');
    console.log('  - lead@company.com      (Team Lead)');
    console.log('  - backend@company.com   (Backend Developer)');
    console.log('  - frontend@company.com  (Frontend Developer)');
    console.log('  - mobile@company.com    (Mobile Developer)');
    console.log('  - qa@company.com        (QA Tester)');
    console.log('');

  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

seed();

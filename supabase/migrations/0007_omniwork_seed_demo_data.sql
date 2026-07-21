-- Demo data, ported from the old project's supabase/seed.sql (a direct
-- translation of lib/initialData.ts), tagged with the single seeded
-- business_id from 0001. Wrapped in a `do` block so that id isn't repeated
-- as a literal on every row.
--
-- Unlike the old project's link-accounts.sql step, none of these demo users
-- get `auth_id` pre-linked — there's no manual UUID copy-paste step here.
-- Sign up through the app's normal signup flow to get a real, logged-in
-- account (0006's trigger provisions it); these rows exist purely as
-- pre-populated department members / task assignees to look at.

do $$
declare
  biz uuid := '4cfd5f44-1ce8-45fb-af17-82c7b84a04eb'; -- '9 Gens Group', matches 0001's seed
begin

-- ============================================================================
-- DEPARTMENTS
-- ============================================================================
insert into omniwork.departments (id, business_id, name, icon, code, description, status) values
  ('dept-webdev', biz, 'Web Development', 'Code', 'WEBDEV', 'Full-stack engineering, web application development, and e-commerce architectures.', 'Active'),
  ('dept-uiux', biz, 'UI/UX Design', 'Palette', 'UIUX', 'User research, wireframing, high-fidelity prototypes, and design systems.', 'Active'),
  ('dept-qa', biz, 'QA Testing', 'ShieldCheck', 'QA', 'Manual and automated testing, bug hunting, security audits, and performance scaling.', 'Active'),
  ('dept-marketing', biz, 'Digital Marketing', 'Megaphone', 'MKT', 'SEO optimization, paid campaigns, social media growth, and content strategy.', 'Active');

-- ============================================================================
-- USERS (auth_id stays null - link a real account via signup, see note above)
-- ============================================================================
insert into omniwork.users (id, business_id, name, email, role, department_id, status, avatar, title, performance_score, phone, team_leader_id) values
  ('user-admin', biz, 'Sarah Connor', 'admin@enterprise.com', 'Admin', 'dept-webdev', 'Active', 'https://picsum.photos/seed/sarah/100/100', 'Principal Operations Officer', 98, '+1 (555) 019-2831', null),
  ('user-leader-web', biz, 'Alex Rivera', 'alex@enterprise.com', 'Team Leader', 'dept-webdev', 'Active', 'https://picsum.photos/seed/alex/100/100', 'Engineering Director', 94, '+1 (555) 014-9921', null),
  ('user-leader-design', biz, 'Elena Rostova', 'elena@enterprise.com', 'Team Leader', 'dept-uiux', 'Active', 'https://picsum.photos/seed/elena/100/100', 'Design Director', 96, '+1 (555) 018-4491', null),
  ('user-leader-qa', biz, 'Marcus Vance', 'marcus@enterprise.com', 'Team Leader', 'dept-qa', 'Active', 'https://picsum.photos/seed/marcus/100/100', 'Quality Assurance Head', 92, '+1 (555) 011-3329', null),
  ('user-member-david', biz, 'David Kim', 'david@enterprise.com', 'Team Member', 'dept-webdev', 'Active', 'https://picsum.photos/seed/david/100/100', 'Senior Frontend Engineer', 91, '+1 (555) 015-8822', 'user-leader-web'),
  ('user-member-chloe', biz, 'Chloe Chen', 'chloe@enterprise.com', 'Team Member', 'dept-webdev', 'Active', 'https://picsum.photos/seed/chloe/100/100', 'Backend Engineer', 89, '+1 (555) 012-7744', 'user-leader-web'),
  ('user-member-liam', biz, 'Liam O''Connor', 'liam@enterprise.com', 'Team Member', 'dept-uiux', 'Active', 'https://picsum.photos/seed/liam/100/100', 'Product Designer', 95, '+1 (555) 017-3311', 'user-leader-design'),
  ('user-member-sophia', biz, 'Sophia Patel', 'sophia@enterprise.com', 'Team Member', 'dept-uiux', 'Active', 'https://picsum.photos/seed/sophia/100/100', 'UI Visual Specialist', 88, '+1 (555) 016-5599', 'user-leader-design'),
  ('user-member-jaxon', biz, 'Jaxon Reed', 'jaxon@enterprise.com', 'Team Member', 'dept-qa', 'Active', 'https://picsum.photos/seed/jaxon/100/100', 'SDET Automation Engineer', 87, '+1 (555) 013-1122', 'user-leader-qa');

-- ============================================================================
-- PROJECTS
-- ============================================================================
insert into omniwork.projects (id, business_id, name, department_id, description, start_date, deadline, status, progress, leader_id, assignee_id, notes) values
  ('proj-portal', biz, 'Company Website Redesign', 'dept-webdev', 'Transforming the corporate portal into an interactive, lightning-fast showcase using Next.js, Framer Motion, and global CDN caching.', '2026-06-01', '2026-08-15', 'In Progress', 68, 'user-leader-web', 'user-member-david',
    array['Frontend uses standard Tailwind and Framer Motion.', 'API routing must have a rate-limiter setup.', 'Target performance score of 95+ on Lighthouse.']),
  ('proj-ecom', biz, 'E-commerce Checkout Core', 'dept-webdev', 'Re-engineering the checkout engine to support local payment gateways, sub-second latency, and advanced cart abandon mechanisms.', '2026-07-01', '2026-09-30', 'Planning', 25, 'user-leader-web', 'user-member-chloe',
    array['Compliance with PCI-DSS Level 1 is mandatory.', 'Stripe & PayPal API configurations are finalized.']),
  ('proj-designsys', biz, 'Atlas Enterprise Design System', 'dept-uiux', 'Constructing the standard component libraries, color palettes, spacing hierarchies, and interactions for all enterprise platforms.', '2026-05-15', '2026-07-25', 'In Progress', 85, 'user-leader-design', 'user-member-liam',
    array['Tailwind CSS v4 config template is completed.', 'Accessibility review is scheduled for mid-July.']);

insert into omniwork.project_members (business_id, project_id, user_id) values
  (biz, 'proj-portal', 'user-member-david'),
  (biz, 'proj-portal', 'user-member-chloe'),
  (biz, 'proj-portal', 'user-member-liam'),
  (biz, 'proj-ecom', 'user-member-david'),
  (biz, 'proj-ecom', 'user-member-chloe'),
  (biz, 'proj-ecom', 'user-member-jaxon'),
  (biz, 'proj-designsys', 'user-member-liam'),
  (biz, 'proj-designsys', 'user-member-sophia');

-- ============================================================================
-- MEDIA FILES
-- ============================================================================
insert into omniwork.media_files (id, business_id, name, type, url, size, extension, uploaded_by, date_added, project_id, department_id) values
  ('media-1', biz, 'Brand Identity Design System.pdf', 'document', '#', '14.2 MB', 'PDF', 'Elena Rostova', '2026-07-01', 'proj-designsys', 'dept-uiux'),
  ('media-2', biz, 'Homepage Hero Interaction.mp4', 'video', 'https://www.w3schools.com/html/mov_bbb.mp4', '48.5 MB', 'MP4', 'Liam O''Connor', '2026-07-04', 'proj-portal', 'dept-uiux'),
  ('media-3', biz, 'Mobile App Mockups Showcase.jpg', 'image', 'https://picsum.photos/seed/showcase/800/600', '4.8 MB', 'JPG', 'Sophia Patel', '2026-07-05', 'proj-portal', 'dept-uiux'),
  ('media-4', biz, 'Database Schema Architectural Diagram.png', 'image', 'https://picsum.photos/seed/schema/800/600', '2.1 MB', 'PNG', 'Chloe Chen', '2026-07-02', 'proj-portal', 'dept-webdev'),
  ('media-5', biz, 'Load Testing Report V1.0.docx', 'document', '#', '1.8 MB', 'DOCX', 'Jaxon Reed', '2026-07-06', 'proj-ecom', 'dept-qa');

-- ============================================================================
-- TASKS
-- ============================================================================
insert into omniwork.tasks (id, business_id, name, project_id, department_id, category, description, priority, status, progress, due_date, assigned_to, milestones, position) values
  ('task-1', biz, 'Refactor Checkout Payment Interface', 'proj-ecom', 'dept-webdev', 'continuous', 'Implement a highly secure payment routing client component with multi-currency selector and instant error bounds.', 'High', 'In Progress', 40, '2026-07-15', 'user-member-david',
    '[{"id":"m-1","title":"Layout Construction","completed":true,"dueDate":"2026-07-08"},{"id":"m-2","title":"Stripe Gateway Testing","completed":false,"dueDate":"2026-07-12"},{"id":"m-3","title":"QA Verification","completed":false,"dueDate":"2026-07-15"}]'::jsonb, 0),
  ('task-2', biz, 'Assemble Component Token Registry', 'proj-designsys', 'dept-uiux', 'continuous', 'Generate JSON files with token names and hex keys, exporting them directly to CSS variables for light/dark templates.', 'Medium', 'Review', 100, '2026-07-10', 'user-member-liam',
    '[{"id":"m-4","title":"Define Colors","completed":true,"dueDate":"2026-07-03"},{"id":"m-5","title":"Write Compiler Script","completed":true,"dueDate":"2026-07-07"}]'::jsonb, 1),
  ('task-3', biz, 'Verify API Rate-Limiting Protocol', 'proj-portal', 'dept-webdev', 'daily', 'Construct Redis-based rate limiting tests, simulating 10,000 requests per minute. Report the breakdown of HTTP 429 anomalies.', 'High', 'Todo', 0, '2026-07-07', 'user-member-chloe', '[]'::jsonb, 2),
  ('task-4', biz, 'Construct Design System Accent Layouts', 'proj-designsys', 'dept-uiux', 'daily', 'Design dark-mode variants for the dashboard sidebar rails, project timelines, and bento grids.', 'Low', 'Completed', 100, '2026-07-06', 'user-member-sophia', '[]'::jsonb, 3),
  ('task-5', biz, 'Automate E-commerce End-to-End Cart Flow', 'proj-ecom', 'dept-qa', 'continuous', 'Construct automated Playwright scripts ensuring cart persistence across page refreshes and multi-tab sessions.', 'High', 'In Progress', 60, '2026-07-20', 'user-member-jaxon',
    '[{"id":"m-6","title":"Write selectors mapping","completed":true,"dueDate":"2026-07-12"},{"id":"m-7","title":"Run local test harness","completed":false,"dueDate":"2026-07-20"}]'::jsonb, 4);

insert into omniwork.task_comments (id, business_id, task_id, user_name, user_avatar, text, "timestamp") values
  ('c-1', biz, 'task-1', 'Alex Rivera', 'https://picsum.photos/seed/alex/100/100', 'Make sure to validate the token payload server-side using cryptographic guards.', '2026-07-05 10:14'),
  ('c-2', biz, 'task-4', 'Elena Rostova', 'https://picsum.photos/seed/elena/100/100', 'This looks stunningly clean! Approved, let us transition this directly to the main system repo.', '2026-07-06 14:15');

insert into omniwork.task_submissions (id, business_id, task_id, user_id, user_name, date, work_done, notes, status) values
  ('sub-2', biz, 'task-2', 'user-member-liam', 'Liam O''Connor', '2026-07-06 17:30', 'Successfully exported color token libraries and completed automated validation scripts. All tests are positive.', 'Files uploaded to the design system media archive.', 'Pending');

insert into omniwork.task_submission_attachments (business_id, task_submission_id, media_file_id) values
  (biz, 'sub-2', 'media-1');

-- ============================================================================
-- ATTENDANCE
-- ============================================================================
insert into omniwork.attendance (id, business_id, user_id, date, check_in_time, check_out_time, status, working_hours) values
  ('att-1', biz, 'user-member-david', '2026-07-06', '08:52:11', '17:34:25', 'Present', 8.7),
  ('att-2', biz, 'user-member-chloe', '2026-07-06', '09:12:05', '18:02:14', 'Present', 8.8),
  ('att-3', biz, 'user-member-liam', '2026-07-06', '09:48:22', '17:15:30', 'Late', 7.45),
  ('att-4', biz, 'user-member-sophia', '2026-07-06', '08:44:11', '17:00:00', 'Present', 8.25),
  ('att-5', biz, 'user-leader-web', '2026-07-06', '08:31:04', '18:15:44', 'Present', 9.75),
  ('att-6', biz, 'user-member-david', '2026-07-07', '08:58:34', null, 'Present', null),
  ('att-7', biz, 'user-member-liam', '2026-07-07', '10:02:44', null, 'Late', null);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================
insert into omniwork.notifications (id, business_id, user_id, title, message, type, time, read) values
  ('not-1', biz, 'all', 'New System Portal Released', 'The Enterprise Project Redesign is officially in transition. Check out details.', 'new_project', '2 hours ago', false),
  ('not-2', biz, 'user-member-david', 'High Priority Task Assigned', 'Alex Rivera assigned: "Refactor Checkout Payment Interface"', 'task_assigned', '1 day ago', false),
  ('not-3', biz, 'user-leader-design', 'Task Submission for Review', 'Liam O''Connor submitted work for "Assemble Component Token Registry"', 'task_completed', '1 day ago', false),
  ('not-4', biz, 'user-member-sophia', 'Task Approved', 'Elena Rostova approved: "Construct Design System Accent Layouts"', 'task_approved', 'Yesterday', true);

-- ============================================================================
-- DAILY WORKLOGS
-- ============================================================================
insert into omniwork.daily_worklogs (id, business_id, user_id, user_name, date, tasks_done, problems, notes) values
  ('log-1', biz, 'user-member-sophia', 'Sophia Patel', '2026-07-06', 'Finished high-fidelity dark variants for bento widgets, projects timelines and dashboard components.', 'Need clarifications on brand styling standards for specific analytics sliders.', 'Uploaded visual deliverables to the shared cloud folders.');

insert into omniwork.daily_worklog_attachments (business_id, daily_worklog_id, media_file_id) values
  (biz, 'log-1', 'media-3');

end $$;

-- In-app notification when a task/subtask is assigned, edited, or has its
-- status changed, so the assignee sees it via the existing notification
-- bell — no email involved (email stays opt-in via "Email Task Summary").
-- Reuses the existing 'task_assigned' value for new/reassigned tasks and
-- subtasks; adds 'task_updated' for edits and status changes.

alter type pm.notification_type add value 'task_updated';

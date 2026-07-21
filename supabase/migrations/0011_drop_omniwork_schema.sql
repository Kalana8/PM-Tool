-- This app's tables have been recreated in the shared `pm` schema (see 0008-0010:
-- pm_employee_schema, pm_employee_helpers_rls, pm_employee_privilege_guard).
-- The old dedicated `omniwork` schema and everything in it (types, tables,
-- functions) is no longer needed.

drop schema omniwork cascade;

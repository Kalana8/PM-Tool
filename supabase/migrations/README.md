# Migration rules

1. Every table/column change = a NEW numbered file here: `0001_xxx.sql`, `0002_xxx.sql`
2. NEVER edit a file that already exists — always add a new one
3. Only YOUR schema — never `public.`, `auth.`, `storage.`, or another tool's schema
4. Use the table template from BEGINNER_DEV_GUIDE.md for EVERY new table
   (business_id FK + RLS enabled + member policies)
5. No file here = your change never reaches production
6. Run your SQL on the shared dev database via your Supabase MCP / SQL editor,
   then save the exact same SQL as a file here, in the same commit as your code.

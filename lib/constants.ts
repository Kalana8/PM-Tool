// The single business every row belongs to today. Every insert in
// lib/supabase/mutations.ts and the admin API routes tags its row with this
// id since there's no business-selection UI yet (see
// supabase/migrations/0001_lobby_stub.sql and 0006_omniwork_signup_trigger.sql,
// which seed/default new signups into the same id). Once real multi-business
// support exists, this constant is what gets replaced by "the current user's
// selected business."
export const CURRENT_BUSINESS_ID = '4cfd5f44-1ce8-45fb-af17-82c7b84a04eb';

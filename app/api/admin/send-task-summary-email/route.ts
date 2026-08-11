import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/get-active-business";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

interface SubtaskRow {
  id: string;
  name: string;
  status: string;
  priority: string;
  progress: number;
  due_date: string | null;
  task_id: string;
  assigned_to: string | null;
}

interface TaskRow {
  id: string;
  name: string;
  category: string;
  status: string;
  priority: string;
  progress: number;
  due_date: string;
  employee_projects: { name: string } | null;
  departments: { name: string } | null;
  subtasks: SubtaskRow[];
}

interface ExtraSubtaskRow {
  id: string;
  name: string;
  status: string;
  priority: string;
  progress: number;
  due_date: string | null;
  task_id: string;
  employee_tasks: {
    name: string;
    category: string;
    employee_projects: { name: string } | null;
    departments: { name: string } | null;
  } | null;
}

/**
 * Emails an employee a full summary of every task assigned to them (any
 * status, per the requested scope) plus its subtasks, and any additional
 * subtasks assigned to them under tasks owned by someone else. Restricted
 * to Admin/Team Leader (who can already manage tasks) — checked via the
 * caller's own RLS-respecting session, same pattern as the other admin
 * routes in this app. Only the Brevo API call itself needs a secret, so
 * unlike create-employee/reset-employee-password this route never touches
 * the Supabase service-role client.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const userId = body?.userId as string | undefined;
  if (!userId) {
    return NextResponse.json({ error: "Missing userId." }, { status: 400 });
  }

  const ctx = await getActiveBusiness();
  if (!ctx?.businessId) {
    return NextResponse.json({ error: "No active business for this session." }, { status: 401 });
  }

  const supabase = (await createClient()) as unknown as SupabaseClient<Database, "pm">;

  const { data: baseLevel } = await supabase.rpc("current_app_base_level");
  if (baseLevel !== "admin" && baseLevel !== "team_leader") {
    return NextResponse.json({ error: "Not authorized to send task summary emails." }, { status: 403 });
  }

  const { data: target } = await supabase
    .from("users")
    .select("id, name, email, business_id")
    .eq("id", userId)
    .maybeSingle();
  if (!target || target.business_id !== ctx.businessId) {
    return NextResponse.json({ error: "Employee not found." }, { status: 404 });
  }

  const { data: myTasksData } = await supabase
    .from("employee_tasks")
    .select(
      "id, name, category, status, priority, progress, due_date, employee_projects(name), departments(name), subtasks(id, name, status, priority, progress, due_date, task_id, assigned_to)"
    )
    .eq("assigned_to", userId)
    .order("due_date");
  const myTasks = (myTasksData ?? []) as unknown as TaskRow[];

  const { data: otherSubtasksData } = await supabase
    .from("subtasks")
    .select(
      "id, name, status, priority, progress, due_date, task_id, assigned_to, employee_tasks(name, category, employee_projects(name), departments(name))"
    )
    .eq("assigned_to", userId);
  const myTaskIds = new Set(myTasks.map((t) => t.id));
  const extraSubtasks = ((otherSubtasksData ?? []) as unknown as ExtraSubtaskRow[]).filter(
    (s) => !myTaskIds.has(s.task_id)
  );

  if (myTasks.length === 0 && extraSubtasks.length === 0) {
    return NextResponse.json({ error: `${target.name} has no tasks or subtasks assigned.` }, { status: 400 });
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Email sending isn't configured yet (missing BREVO_API_KEY)." }, { status: 500 });
  }

  const html = buildEmailHtml(target.name, myTasks, extraSubtasks);

  const emailRes = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({
      sender: {
        name: process.env.EMAIL_SENDER_NAME || "BizYep",
        email: process.env.EMAIL_SENDER_ADDRESS
      },
      to: [{ email: target.email, name: target.name }],
      subject: "Your Task Summary",
      htmlContent: html
    })
  });

  if (!emailRes.ok) {
    const errBody = await emailRes.json().catch(() => ({}));
    return NextResponse.json({ error: errBody.message || "Failed to send email." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}

function esc(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function categoryLabel(category: string): string {
  return category === "continuous" ? "Continuous Task" : "Daily Task";
}

function subtaskItem(s: { name: string; status: string; priority: string; progress: number; due_date: string | null }): string {
  return `
        <div style="padding:6px 0 6px 18px;border-top:1px solid #f1f5f9;">
          <span style="color:#0f172a;">↳ ${esc(s.name)}</span>
          <div style="color:#94a3b8;font-size:11px;margin-top:2px;">
            ${esc(s.priority)} priority &middot; ${esc(s.status)} &middot; ${s.progress}% complete${s.due_date ? ` &middot; Due ${esc(s.due_date)}` : ''}
          </div>
        </div>`;
}

function taskBlock(t: TaskRow): string {
  const subItems = (t.subtasks ?? []).map(subtaskItem).join("");
  return `
    <div style="border:1px solid #e2e8f0;border-radius:10px;padding:12px 14px;margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;">
        <span style="font-weight:700;color:#0f172a;">${esc(t.name)}</span>
        <span style="color:#94a3b8;font-size:11px;">Due ${esc(t.due_date)}</span>
      </div>
      <div style="color:#64748b;font-size:11px;margin-top:2px;">
        ${t.departments ? esc(t.departments.name) : 'No Department'} &middot; ${t.employee_projects ? esc(t.employee_projects.name) : 'No Project'}
      </div>
      <div style="color:#94a3b8;font-size:11px;margin-top:2px;">
        ${esc(t.priority)} priority &middot; ${esc(t.status)} &middot; ${t.progress}% complete
      </div>
      ${subItems}
    </div>`;
}

function buildEmailHtml(name: string, tasks: TaskRow[], extraSubtasks: ExtraSubtaskRow[]): string {
  const dailyTasks = tasks.filter((t) => t.category !== "continuous");
  const continuousTasks = tasks.filter((t) => t.category === "continuous");

  const dailyBlocks = dailyTasks.map(taskBlock).join("");
  const continuousBlocks = continuousTasks.map(taskBlock).join("");

  const extraBlocks = extraSubtasks
    .map((s) => {
      const parent = s.employee_tasks;
      return `
    <div style="border:1px solid #e2e8f0;border-radius:10px;padding:12px 14px;margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;">
        <span style="font-weight:700;color:#0f172a;">${esc(s.name)}</span>
        <span style="color:#94a3b8;font-size:11px;">${s.due_date ? `Due ${esc(s.due_date)}` : ''}</span>
      </div>
      <div style="color:#64748b;font-size:11px;margin-top:2px;">
        ${parent?.departments ? esc(parent.departments.name) : 'No Department'} &middot; ${parent?.employee_projects ? esc(parent.employee_projects.name) : 'No Project'} &middot; under "${esc(parent?.name ?? 'Unknown Task')}" (${categoryLabel(parent?.category ?? 'daily')})
      </div>
      <div style="color:#94a3b8;font-size:11px;margin-top:2px;">
        ${esc(s.priority)} priority &middot; ${esc(s.status)} &middot; ${s.progress}% complete
      </div>
    </div>`;
    })
    .join("");

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;max-width:640px;margin:0 auto;">
    <h2 style="margin-bottom:4px;">Hi ${esc(name)},</h2>
    <p style="color:#475569;margin-top:0;">Here is a summary of all your assigned tasks and subtasks.</p>

    ${dailyTasks.length > 0 ? `
    <h3 style="margin:20px 0 10px;">Daily Tasks</h3>
    ${dailyBlocks}` : ''}

    ${continuousTasks.length > 0 ? `
    <h3 style="margin:20px 0 10px;">Continuous Tasks</h3>
    ${continuousBlocks}` : ''}

    ${extraSubtasks.length > 0 ? `
    <h3 style="margin:20px 0 10px;">Additional Subtasks Assigned to You</h3>
    ${extraBlocks}` : ''}

    <p style="color:#94a3b8;font-size:11px;margin-top:24px;">This is an automated summary from your workspace.</p>
  </div>`;
}

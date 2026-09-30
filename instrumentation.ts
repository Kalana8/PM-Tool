import type { Instrumentation } from "next";

// Every uncaught server error (server actions, pages, API routes) is reported
// to the BizYep Monitor. redirect() and notFound() are control flow, not errors.
export const onRequestError: Instrumentation.onRequestError = async (error, _request, context) => {
  const digest = (error as { digest?: unknown } | null)?.digest;
  if (typeof digest === "string" && digest.startsWith("NEXT_")) return;
  const { reportServerError } = await import("./lib/report-server-error");
  await reportServerError(`${context.routeType} ${context.routePath}`, error);
};

export const dynamic = "force-dynamic";

export function GET() {
  const mode = process.env.ATLASPAY_API_BASE_URL ? "atlaspay-live" : "fixture-demo";
  return Response.json({ status: "ok", mode });
}

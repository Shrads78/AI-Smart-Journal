import { parseHealthData, generateHealthInsights } from "../../src/utils/healthParser";

export default async function handler(_req: Request): Promise<Response> {
  try {
    const snapshot = parseHealthData();
    const insights = generateHealthInsights(snapshot);
    return Response.json({ insights, snapshot });
  } catch (err: any) {
    return Response.json({ error: "Failed to generate health insights: " + err.message }, { status: 500 });
  }
}

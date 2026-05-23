import { parseHealthData } from "../../src/utils/healthParser";

export default async function handler(_req: Request): Promise<Response> {
  try {
    const snapshot = parseHealthData();
    return Response.json(snapshot);
  } catch (err: any) {
    return Response.json({ error: "Failed to parse health data: " + err.message }, { status: 500 });
  }
}

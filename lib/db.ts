import { neon, NeonQueryFunction } from "@neondatabase/serverless";

declare global {
  var _sql: NeonQueryFunction<false, false> | undefined;
}

export function getSql(): NeonQueryFunction<false, false> {
  if (!global._sql) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }
    global._sql = neon(connectionString);
  }
  return global._sql;
}

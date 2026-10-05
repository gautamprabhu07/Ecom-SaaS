//Path: packages/utils/kafka/health.ts
//readiness helpers shared by the services that consume from Kafka
import { kafka } from "./index";

export interface CheckResult {
  ok: boolean;
  detail?: string;
  ms: number;
}

export interface ReadinessReport {
  ok: boolean;
  checks: Record<string, CheckResult>;
}

//runs every check in parallel; one failing or hanging dependency doesn't hide the state of the others
export async function runChecks(
  checks: Record<string, () => Promise<string | void>>,
  timeoutMs = 4000,
): Promise<ReadinessReport> {
  const entries = await Promise.all(
    Object.entries(checks).map(async ([name, check]): Promise<[string, CheckResult]> => {
      const started = Date.now();
      let timer: NodeJS.Timeout | undefined;
      try {
        const detail = await Promise.race([
          check(),
          new Promise<never>((_, reject) => {
            timer = setTimeout(() => reject(new Error(`timed out after ${timeoutMs}ms`)), timeoutMs);
          }),
        ]);
        return [name, { ok: true, detail: detail || undefined, ms: Date.now() - started }];
      } catch (error) {
        return [name, { ok: false, detail: (error as Error)?.message ?? String(error), ms: Date.now() - started }];
      } finally {
        //don't leave a pending timer behind once the check has finished
        if (timer) clearTimeout(timer);
      }
    }),
  );
  const checksByName = Object.fromEntries(entries);
  return { ok: entries.every(([, result]) => result.ok), checks: checksByName };
}

//the broker is reachable AND this consumer group is alive. A group with no members means the consumer isn't running.
export async function checkConsumerGroup(groupId: string): Promise<string> {
  const admin = kafka.admin();
  await admin.connect();
  try {
    const { groups } = await admin.describeGroups([groupId]);
    const group = groups[0];
    if (!group || group.members.length === 0) throw new Error(`consumer group "${groupId}" has no active members (state ${group?.state ?? "unknown"})`);
    return `group ${groupId}: ${group.state}, ${group.members.length} member(s)`;
  } finally {
    await admin.disconnect().catch(() => undefined);
  }
}

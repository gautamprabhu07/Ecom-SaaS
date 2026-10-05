//Path: packages/utils/kafka/shutdown.ts
//graceful shutdown: on SIGTERM/SIGINT run each registered cleanup step (flush buffers, commit offsets, disconnect),
//then exit 0. A service that is killed mid-buffer would otherwise lose whatever it had not yet written.
//(Windows only delivers SIGINT, i.e. Ctrl+C; SIGTERM is what Docker, Kubernetes and most process managers send.)

export interface ShutdownOptions {
  //overall budget for all cleanup steps; a hung step must not keep the process alive forever
  timeoutMs?: number;
  exit?: (code: number) => void;
  log?: (message: string) => void;
}

type Step = { name: string; run: () => Promise<void> };

export const createShutdownManager = (options: ShutdownOptions = {}) => {
  const { timeoutMs = 15_000, exit = (code: number) => process.exit(code), log = console.log } = options;
  const steps: Step[] = [];
  let listening = false;
  let running: Promise<void> | null = null;

  //runs the steps in the order they were registered; safe to call more than once (a second signal is ignored)
  const shutdown = (signal: string): Promise<void> => {
    if (running) return running;
    running = (async () => {
      log(`${signal} received, shutting down gracefully`);
      let timer: NodeJS.Timeout | undefined;
      const timedOut = new Promise<"timeout">((resolve) => {
        timer = setTimeout(() => resolve("timeout"), timeoutMs);
      });

      const work = (async () => {
        for (const step of steps) {
          try {
            await step.run();
            log(`shutdown step done: ${step.name}`);
          } catch (error) {
            //keep going: one failing step must not stop the others (e.g. the buffer flush) from running
            console.error(`shutdown step failed: ${step.name}`, error);
          }
        }
        return "done" as const;
      })();

      const outcome = await Promise.race([work, timedOut]);
      if (timer) clearTimeout(timer);
      if (outcome === "timeout") {
        console.error(`shutdown did not finish within ${timeoutMs}ms, exiting anyway`);
        exit(1);
        return;
      }
      exit(0);
    })();
    return running;
  };

  const onShutdown = (name: string, run: () => Promise<void>): void => {
    steps.push({ name, run });
    if (listening) return;
    listening = true;
    for (const signal of ["SIGTERM", "SIGINT"] as const) {
      process.on(signal, () => void shutdown(signal));
    }
  };

  return { onShutdown, shutdown };
};

//the manager each service uses
export const { onShutdown, shutdown } = createShutdownManager();

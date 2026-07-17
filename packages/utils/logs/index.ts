// Path: packages/utils/logs/index.ts

type LogType = "success" | "error" | "info" | "warning";

interface LogPayload {
  type: LogType;
  message: string;
  source: string;
}

export const sendLog = ({ type, message, source }: LogPayload) => {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${source}] [${type.toUpperCase()}]`;

  if (type === "error") {
    console.error(`${prefix} ${message}`);
  } else {
    console.log(`${prefix} ${message}`);
  }
};

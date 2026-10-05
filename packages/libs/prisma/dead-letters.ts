//Path: packages/libs/prisma/dead-letters.ts
//durable fallback for dead letters that could not be published to their Kafka DLQ topic (see utils/kafka/dlq.ts).
//Written with a raw insert so the collection needs no Prisma model. Inspect with: db.deadLetters.find({status: "unprocessed"})
import prisma from "./index";
import type { DeadLetter } from "../../utils/kafka/dlq";

export const DEAD_LETTER_COLLECTION = "deadLetters";

export const saveDeadLetter = async (letter: DeadLetter): Promise<void> => {
  await prisma.$runCommandRaw({
    insert: DEAD_LETTER_COLLECTION,
    documents: [{ ...letter, failedAt: { $date: letter.failedAt }, status: "unprocessed" }],
  });
};

import { prisma } from "../db";
import { logger } from "../logger";

const INDONESIAN_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

export function fmtDate(d: Date): string {
  const day = d.getDate();
  const month = INDONESIAN_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export function fmtDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} detik`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours} jam ${mins} menit`;
  return `${mins} menit`;
}

export function modeLabel(mode: number): string {
  return mode === 1 ? "Intermiten" : "Kontinyu";
}

interface TherapyPayload {
  start: number;
  end: number;
  mode: number;
}

export async function createTherapySession(payload: TherapyPayload) {
  const startDate = new Date(payload.start * 1000);
  const durationSecs = payload.end - payload.start;
  const count = await prisma.therapySession.count();
  const title = `Terapi #${count + 1}`;

  const session = await prisma.therapySession.create({
    data: {
      sessionDate: startDate.toISOString(),
      title,
      date: fmtDate(startDate),
      mode: modeLabel(payload.mode),
      duration: fmtDuration(durationSecs),
    },
  });

  logger.info({ sessionId: session.id, title }, "Therapy session created");
  return session;
}

export async function getTherapySessions(year?: string) {
  const where = year
    ? { sessionDate: { startsWith: year } }
    : {};

  return prisma.therapySession.findMany({
    where,
    orderBy: { sessionDate: "desc" },
  });
}
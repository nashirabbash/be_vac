import { describe, expect, it } from "bun:test";
import { fmtDate, fmtDuration, modeLabel } from "../../src/services/therapy";

describe("fmtDate", () => {
  it("formats January 1st", () => {
    expect(fmtDate(new Date("2026-01-01T00:00:00"))).toBe("1 Jan 2026");
  });

  it("formats December 31st", () => {
    expect(fmtDate(new Date("2026-12-31T00:00:00"))).toBe("31 Des 2026");
  });

  it("formats July 15th", () => {
    expect(fmtDate(new Date("2026-07-15T12:30:00"))).toBe("15 Jul 2026");
  });

  it("formats single-digit day", () => {
    expect(fmtDate(new Date("2026-03-05T00:00:00"))).toBe("5 Mar 2026");
  });
});

describe("fmtDuration", () => {
  it("formats seconds only", () => {
    expect(fmtDuration(0)).toBe("0 detik");
    expect(fmtDuration(1)).toBe("1 detik");
    expect(fmtDuration(59)).toBe("59 detik");
  });

  it("formats minutes only", () => {
    expect(fmtDuration(60)).toBe("1 menit");
    expect(fmtDuration(120)).toBe("2 menit");
    expect(fmtDuration(3599)).toBe("59 menit");
  });

  it("formats hours and minutes", () => {
    expect(fmtDuration(3600)).toBe("1 jam 0 menit");
    expect(fmtDuration(3660)).toBe("1 jam 1 menit");
    expect(fmtDuration(7200)).toBe("2 jam 0 menit");
    expect(fmtDuration(9000)).toBe("2 jam 30 menit");
  });

  it("formats large durations", () => {
    expect(fmtDuration(86400)).toBe("24 jam 0 menit");
  });
});

describe("modeLabel", () => {
  it('returns "Intermiten" for mode 1', () => {
    expect(modeLabel(1)).toBe("Intermiten");
  });

  it('returns "Kontinyu" for mode 0', () => {
    expect(modeLabel(0)).toBe("Kontinyu");
  });

  it('returns "Kontinyu" for mode 2', () => {
    expect(modeLabel(2)).toBe("Kontinyu");
  });

  it('returns "Kontinyu" for any non-1 value', () => {
    expect(modeLabel(99)).toBe("Kontinyu");
    expect(modeLabel(-1)).toBe("Kontinyu");
  });
});
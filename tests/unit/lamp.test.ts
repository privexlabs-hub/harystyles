import { describe, expect, it } from "vitest";
import { eveningDate, geohashCentroid, geohashEncode, lampAt, lampLocalTime, nextLamp, type LampPrefs } from "@/server/modules/ration/domain/lamp";
import { localTime, zonedToInstant } from "@/server/modules/ration/domain/time";

const sunset = (tz: string, lat: number, lon: number): LampPrefs => ({
  lampMode: "sunset",
  lampFixedTime: null,
  timezone: tz,
  geoCell: geohashEncode(lat, lon, 4),
});
const minutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));

describe("BR-RA-01 lamp time", () => {
  it("defaults to 18:00 local without a location", () => {
    const p: LampPrefs = { lampMode: "sunset", lampFixedTime: null, timezone: "Europe/Lisbon", geoCell: null };
    expect(lampLocalTime(p, "2026-06-21")).toBe("18:00");
    expect(lampAt(p, "2026-06-21").toISOString()).toBe("2026-06-21T17:00:00.000Z"); // WEST = UTC+1
  });

  it("uses the fixed time in fixed mode", () => {
    const p: LampPrefs = { lampMode: "fixed", lampFixedTime: "22:15", timezone: "America/New_York", geoCell: "dr5r" };
    expect(lampLocalTime(p, "2026-01-10")).toBe("22:15");
  });

  it.each([
    // [tz, lat, lon, date, published sunset (local), tolerance minutes — precision-4 cell ≈ ±20 km]
    ["America/New_York", 40.71, -74.0, "2026-06-21", "20:31", 6],
    ["Europe/Lisbon", 38.72, -9.14, "2026-06-21", "21:05", 6],
    ["Australia/Sydney", -33.87, 151.21, "2026-12-21", "20:05", 6],
    ["America/Los_Angeles", 34.05, -118.24, "2026-09-22", "18:57", 6],
  ])("NOAA sunset in %s on %s ≈ %s", (tz, lat, lon, date, expected, tol) => {
    const got = lampLocalTime(sunset(tz, lat, lon), date);
    expect(Math.abs(minutes(got) - minutes(expected))).toBeLessThanOrEqual(tol);
  });

  it("clamps early winter sunsets to 17:00 and late summer ones to 21:30 (EX-03)", () => {
    expect(lampLocalTime(sunset("Europe/London", 51.5, -0.12), "2026-12-21")).toBe("17:00");
    expect(lampLocalTime(sunset("Atlantic/Reykjavik", 64.15, -21.94), "2026-06-21")).toBe("21:30");
    expect(lampLocalTime(sunset("Europe/Oslo", 69.65, 18.96), "2026-06-21")).toBe("21:30"); // polar day (Tromsø)
    expect(lampLocalTime(sunset("Europe/Oslo", 69.65, 18.96), "2026-12-21")).toBe("17:00"); // polar night
  });

  it("geohash round-trips to a nearby centroid", () => {
    const c = geohashCentroid(geohashEncode(38.72, -9.14, 4));
    expect(Math.abs(c.lat - 38.72)).toBeLessThan(0.2);
    expect(Math.abs(c.lon + 9.14)).toBeLessThan(0.2);
  });
});

describe("BR-RA-02 evening date", () => {
  const p: LampPrefs = { lampMode: "fixed", lampFixedTime: "19:00", timezone: "America/New_York", geoCell: null };
  it("is yesterday before lamp time and today after it", () => {
    expect(eveningDate(p, new Date("2026-03-14T22:59:00Z"))).toBe("2026-03-13"); // 18:59 EDT
    expect(eveningDate(p, new Date("2026-03-14T23:00:00Z"))).toBe("2026-03-14"); // 19:00 EDT
    expect(eveningDate(p, new Date("2026-03-15T03:00:00Z"))).toBe("2026-03-14"); // 23:00 local, still the 14th's evening
  });
  it("nextLamp is the following evening's lamp", () => {
    const n = nextLamp(p, new Date("2026-03-14T23:30:00Z"));
    expect(n.eveningDate).toBe("2026-03-15");
    expect(n.at.toISOString()).toBe("2026-03-15T23:00:00.000Z");
  });
  it("crossing the date line never yields two rations for one evening (EX-01/FX-13 basis)", () => {
    const auckland = { ...p, timezone: "Pacific/Auckland" };
    const instant = new Date("2026-03-14T10:00:00Z");
    expect(eveningDate(auckland, instant)).toBe("2026-03-14"); // 23:00 NZDT
    expect(eveningDate(p, instant)).toBe("2026-03-13"); // 06:00 EDT
  });
});

describe("EX-02 DST disambiguation", () => {
  it("moves a nonexistent local time forward", () => {
    const t = zonedToInstant("2026-03-08", "02:30", "America/New_York");
    expect(localTime(t, "America/New_York")).toBe("03:30");
  });
  it("uses the first occurrence of an ambiguous time", () => {
    const t = zonedToInstant("2026-11-01", "01:30", "America/New_York");
    expect(t.toISOString()).toBe("2026-11-01T05:30:00.000Z"); // EDT occurrence
  });
});

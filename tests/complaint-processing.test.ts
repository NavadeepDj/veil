import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { emptyProcessedComplaint, processComplaint } from "@/lib/complaint-processing";

describe("processComplaint", () => {
  it("redacts high-risk student, staff, contact, class, and residence identifiers", async () => {
    const complaint = [
      "I'm Priya Nair, roll number CSE-22-104.",
      "My email is priya.nair@college.edu and phone is 9876543210.",
      "Professor Kumar and Mr Sharma from CSE-A threatened me near Hostel B room 214.",
      "Kumar sir said he would fail my internal marks if I reported this.",
    ].join(" ");

    const processed = await processComplaint(complaint);

    expect(processed.sanitized).toContain("[student identity redacted]");
    expect(processed.sanitized).toContain("[student identifier redacted]");
    expect(processed.sanitized).toContain("[school email redacted]");
    expect(processed.sanitized).toContain("[phone redacted]");
    expect(processed.sanitized).toContain("faculty member");
    expect(processed.sanitized).toContain("staff member");
    expect(processed.sanitized).toContain("[department section redacted]");
    expect(processed.sanitized).toContain("[residence detail redacted]");

    for (const sensitive of [
      "Priya",
      "Nair",
      "CSE-22-104",
      "priya.nair@college.edu",
      "9876543210",
      "Professor Kumar",
      "Mr Sharma",
      "CSE-A",
      "Hostel B",
      "room 214",
    ]) {
      expect(processed.sanitized).not.toContain(sensitive);
    }
  });

  it("handles common alternate identity formats", async () => {
    const complaint =
      "I am Aarav Mehta, reg no. 21BCE1234, email aarav [at] school [dot] edu. Warden Rao made threats in room no. 302.";

    const processed = await processComplaint(complaint);

    expect(processed.sanitized).not.toContain("Aarav");
    expect(processed.sanitized).not.toContain("21BCE1234");
    expect(processed.sanitized).not.toContain("aarav [at] school [dot] edu");
    expect(processed.sanitized).not.toContain("Warden Rao");
    expect(processed.sanitized).not.toContain("room no. 302");
    expect(processed.redactions).toEqual(
      expect.arrayContaining([
        "student name",
        "roll number",
        "school email",
        "staff name",
        "residence detail",
      ]),
    );
  });

  it("produces a stable SHA-256 complaint hash", async () => {
    const complaint = "My name is Test Student. A faculty member threatened my grades after class.";
    const processed = await processComplaint(complaint);
    const expectedHash = `0x${createHash("sha256").update(complaint).digest("hex")}`;

    expect(processed.complaintHash).toBe(expectedHash);
    expect(processed.complaintHash).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it("returns a safe empty state for UI initialization", () => {
    const empty = emptyProcessedComplaint();

    expect(empty.complaintHash).toBe("pending");
    expect(empty.category).toBe("Pending");
    expect(empty.sanitized).not.toContain("undefined");
  });
});

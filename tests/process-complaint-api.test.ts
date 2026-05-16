import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/process-complaint/route";

function requestWithComplaint(complaint: string) {
  return new Request("http://localhost/api/process-complaint", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ complaint }),
  });
}

describe("POST /api/process-complaint", () => {
  it("rejects complaints that are too short", async () => {
    const response = await POST(requestWithComplaint("too short"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("enough detail");
  });

  it("rejects complaints that are too long", async () => {
    const response = await POST(requestWithComplaint("a".repeat(5001)));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("5000");
  });

  it("returns only sanitized processing output for valid complaints", async () => {
    const response = await POST(
      requestWithComplaint(
        "My name is Priya Nair, roll number CSE-22-104. Professor Kumar from CSE-A threatened my grades after class.",
      ),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.privacyBoundary).toContain("Only sanitized complaint data");
    expect(body.processed.sanitized).not.toContain("Priya");
    expect(body.processed.sanitized).not.toContain("CSE-22-104");
    expect(body.processed.sanitized).not.toContain("Professor Kumar");
    expect(body.processed.complaintHash).toMatch(/^0x[0-9a-f]{64}$/);
  });
});

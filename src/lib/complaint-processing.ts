export type ProcessedComplaint = {
  sanitized: string;
  category: string;
  severity: string;
  summary: string;
  redactions: string[];
  complaintHash: string;
  nextAction: string;
};

type CategoryRule = {
  category: string;
  words: string[];
};

const categoryRules: CategoryRule[] = [
  { category: "Harassment", words: ["harass", "threat", "alone", "scared", "faculty member"] },
  { category: "Safety Risk", words: ["violence", "unsafe", "attack", "stalk", "threat"] },
  { category: "Discrimination", words: ["caste", "religion", "gender", "race", "discrimination"] },
  { category: "Academic Abuse", words: ["fail", "grades", "marks", "attendance", "internal"] },
  { category: "Bullying", words: ["bully", "ragging", "humiliate", "mock", "group"] },
];

const fallbackComplaint =
  "Complaint will appear here after the student submits sensitive details for private processing.";

async function hashText(text: string) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");

  return `0x${hash}`;
}

function addRedaction(redactions: Set<string>, label: string) {
  redactions.add(label);
}

export async function processComplaint(rawComplaint: string): Promise<ProcessedComplaint> {
  const redactions = new Set<string>();
  let sanitized = rawComplaint.trim();

  const replacements: Array<{ label: string; pattern: RegExp; value: string }> = [
    {
      label: "student name",
      pattern: /\b(my name is|i am|i['\u2019]m|this is)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?/gi,
      value: "$1 [student identity redacted]",
    },
    {
      label: "roll number",
      pattern: /\b(?:roll(?:\s+number|\s+no\.?|\s+id)?|student\s+id\b|registration\s+number|reg\.?\s*no\.?|admission\s+number|usn|prn)\s*[:#-]?\s*[A-Z0-9]{2,6}[-/ ]?[A-Z0-9]{2,6}[-/ ]?[A-Z0-9]{2,8}\b/gi,
      value: "[student identifier redacted]",
    },
    {
      label: "school email",
      pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
      value: "[school email redacted]",
    },
    {
      label: "school email",
      pattern: /\b[A-Z0-9._%+-]+\s*(?:\[at\]|\(at\)| at )\s*[A-Z0-9.-]+\s*(?:\[dot\]|\(dot\)| dot )\s*[A-Z]{2,}\b/gi,
      value: "[school email redacted]",
    },
    {
      label: "phone number",
      pattern: /(?:\+?91[-\s]?)?[6-9]\d{9}\b/g,
      value: "[phone redacted]",
    },
    {
      label: "faculty name",
      pattern: /\b(?:professor|prof\.?|dr\.?)\s+[A-Z][a-z]+\b/gi,
      value: "faculty member",
    },
    {
      label: "staff name",
      pattern: /\b(?:mr\.?|ms\.?|mrs\.?|miss|teacher|warden|staff|lab\s+assistant)\s+(?:named\s+)?[A-Z][a-z]+\b/gi,
      value: "staff member",
    },
    {
      label: "staff name",
      pattern: /\bfaculty\s+(?!member\b)[A-Z][a-z]+\b/gi,
      value: "staff member",
    },
    {
      label: "staff name",
      pattern: /\b[A-Z][a-z]+\s+(?:sir|ma['\u2019]?am|mam)\b/g,
      value: "staff member",
    },
    {
      label: "section detail",
      pattern: /\b(?:CSE|ECE|EEE|ME|IT|AIML|DS)[-\s]?[A-Z]\b/g,
      value: "[department section redacted]",
    },
    {
      label: "residence detail",
      pattern: /\b(?:hostel|dorm|block)\s+[A-Z0-9]+(?:\s+(?:room|floor)\s*\d{1,4})?\b/gi,
      value: "[residence detail redacted]",
    },
    {
      label: "residence detail",
      pattern: /\broom\s*(?:no\.?\s*)?\d{1,4}\b/gi,
      value: "[room detail redacted]",
    },
  ];

  replacements.forEach(({ label, pattern, value }) => {
    if (pattern.test(sanitized)) {
      addRedaction(redactions, label);
      sanitized = sanitized.replace(pattern, value);
    }
  });

  const lower = sanitized.toLowerCase();
  const matches = categoryRules
    .map((rule) => ({
      category: rule.category,
      score: rule.words.filter((word) => lower.includes(word)).length,
    }))
    .sort((left, right) => right.score - left.score);

  const category = matches[0]?.score ? matches[0].category : "General Complaint";
  const urgentWords = ["threat", "unsafe", "attack", "scared", "violence", "alone"];
  const highWords = ["fail", "harass", "blackmail", "retaliation", "pressure"];
  const urgentScore = urgentWords.filter((word) => lower.includes(word)).length;
  const highScore = highWords.filter((word) => lower.includes(word)).length;
  const severity = urgentScore >= 2 ? "Urgent" : highScore >= 1 ? "High" : "Medium";
  const nextAction =
    severity === "Urgent"
      ? "Route to protected committee review within 24 hours."
      : "Route to confidential student grievance review.";

  const summary =
    category === "Harassment"
      ? "Verified student reports possible harassment and retaliation risk involving a faculty member."
      : `Verified student reports a ${category.toLowerCase()} concern requiring confidential review.`;

  return {
    sanitized: sanitized || fallbackComplaint,
    category,
    severity,
    summary,
    redactions: Array.from(redactions),
    complaintHash: await hashText(rawComplaint || "empty complaint"),
    nextAction,
  };
}

export function emptyProcessedComplaint(): ProcessedComplaint {
  return {
    sanitized: fallbackComplaint,
    category: "Pending",
    severity: "Pending",
    summary: "Submit after proof verification to generate a sanitized summary.",
    redactions: [],
    complaintHash: "pending",
    nextAction: "Submit to route case",
  };
}

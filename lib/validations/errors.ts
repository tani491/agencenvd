export function getValidationIssues(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "issues" in error &&
    Array.isArray((error as { issues?: unknown }).issues)
  ) {
    return (error as { issues: unknown[] }).issues;
  }

  return null;
}

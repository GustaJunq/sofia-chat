export function getUserPlan(): string {
  try {
    const token = localStorage.getItem("sof_token");
    if (!token) return "free";
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.plan || "free";
  } catch {
    return "free";
  }
}

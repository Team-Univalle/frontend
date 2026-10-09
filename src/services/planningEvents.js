export const PLANNING_UPDATED = 'planning:updated';
export function notifyPlanningUpdated() {
  window.dispatchEvent(new Event(PLANNING_UPDATED));
}

export const event = {
  name: 'CONVENE',
  timezone: 'America/New_York',
  dates: 'May 20–21, 2027',
  venue: 'The Foundry, Brooklyn',
  demoNow: '2027-05-20T12:00:00Z',
};
export const tracks = ['Engineering', 'AI & Data', 'Design & Product', 'Leadership'];
export function time(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: event.timezone,
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}
export function day(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: event.timezone,
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}
export function overlaps(a: { start: string; end: string }, b: { start: string; end: string }) {
  return a.start < b.end && b.start < a.end;
}
export function trackClass(track: string) {
  return ['engineering', 'ai', 'design', 'leadership'][tracks.indexOf(track)] ?? 'engineering';
}

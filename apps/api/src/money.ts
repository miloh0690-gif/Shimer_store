export function bobToCents(bob: number): number {
  return Math.round(bob * 100);
}

export function centsToBob(cents: number): number {
  return cents / 100;
}

export function formatBob(cents: number): string {
  const bob = (cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `Bs. ${bob}`;
}
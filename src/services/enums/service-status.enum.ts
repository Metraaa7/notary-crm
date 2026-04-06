export enum ServiceStatus {
  PENDING = 'PENDING',         // Created, awaiting notary review
  IN_PROGRESS = 'IN_PROGRESS', // Notary has started working on it
  COMPLETED = 'COMPLETED',     // Confirmed and signed off by notary
  CANCELLED = 'CANCELLED',     // Cancelled before completion
}

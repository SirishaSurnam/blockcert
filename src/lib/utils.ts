import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Tailwind class merger
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  });
}

// Format date with time
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Format relative time
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 30) return formatDate(d);
  if (days > 1) return `${days} days ago`;
  if (days === 1) return 'Yesterday';
  if (hours > 1) return `${hours} hours ago`;
  if (hours === 1) return '1 hour ago';
  if (minutes > 1) return `${minutes} minutes ago`;
  if (minutes === 1) return '1 minute ago';
  return 'Just now';
}

// Truncate address
export function truncateAddress(address: string, startChars = 6, endChars = 4): string {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

// Truncate text
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

// Generate random ID
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Validate email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate Ethereum address
export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Calculate percentage
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

// Get initials from name
export function getInitials(name: string): string {
  if (!name) return '';
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Capitalize first letter
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Get tier from score
export function getTierFromScore(score: number): { tier: string; color: string; label: string } {
  if (score >= 90) return { tier: 'diamond', color: '#B9F2FF', label: 'Diamond' };
  if (score >= 75) return { tier: 'platinum', color: '#E5E4E2', label: 'Platinum' };
  if (score >= 60) return { tier: 'gold', color: '#FFD700', label: 'Gold' };
  if (score >= 40) return { tier: 'silver', color: '#C0C0C0', label: 'Silver' };
  return { tier: 'bronze', color: '#CD7F32', label: 'Bronze' };
}

// Get skill level from count
export function getSkillLevel(count: number): { level: string; color: string } {
  if (count >= 5) return { level: 'Expert', color: '#EF4444' };
  if (count >= 3) return { level: 'Advanced', color: '#8B5CF6' };
  if (count >= 2) return { level: 'Intermediate', color: '#3B82F6' };
  return { level: 'Beginner', color: '#9CA3AF' };
}

// Format number with commas
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Delay function
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Copy to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// Generate verification URL
export function generateVerificationUrl(credentialId: string, baseUrl?: string): string {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/verify/${credentialId}`;
}

// Parse QR data
export function parseQRData(qrData: string): { type: string; id: string } | null {
  try {
    const data = JSON.parse(qrData);
    return {
      type: data.type || 'credential',
      id: data.id || data.credentialId,
    };
  } catch {
    // If not JSON, treat as URL
    const urlMatch = qrData.match(/\/verify\/([a-fA-F0-9-]+)/);
    if (urlMatch) {
      return { type: 'credential', id: urlMatch[1] };
    }
    return null;
  }
}

// Get status color class
export function getStatusColor(status: string): { bg: string; text: string; border: string } {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-600', border: 'border-yellow-500' },
    verified: { bg: 'bg-green-500/10', text: 'text-green-600', border: 'border-green-500' },
    rejected: { bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500' },
    revoked: { bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500' },
    valid: { bg: 'bg-green-500/10', text: 'text-green-600', border: 'border-green-500' },
    invalid: { bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500' },
  };
  return colors[status] || colors.pending;
}

// Download file
export function downloadFile(data: Blob | string, filename: string, mimeType?: string): void {
  const blob = typeof data === 'string' 
    ? new Blob([data], { type: mimeType || 'text/plain' }) 
    : data;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Calculate XP for level
export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

// Calculate level from XP
export function calculateLevelFromXP(xp: number): number {
  let level = 1;
  let xpRequired = 100;
  let totalXp = xp;
  
  while (totalXp >= xpRequired) {
    totalXp -= xpRequired;
    level++;
    xpRequired = xpForLevel(level);
  }
  
  return level;
}

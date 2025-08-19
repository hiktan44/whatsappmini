import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it starts with country code
  if (cleaned.startsWith('90')) {
    return `+${cleaned}`;
  } else if (cleaned.startsWith('0')) {
    return `+90${cleaned.slice(1)}`;
  } else {
    return `+90${cleaned}`;
  }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{10,14}$/;
  const cleaned = phone.replace(/\s/g, '');
  return phoneRegex.test(cleaned);
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
}

export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function isValidImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return validTypes.includes(file.type);
}

export function isValidVideoFile(file: File): boolean {
  const validTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/mkv'];
  return validTypes.includes(file.type);
}

export function isValidAudioFile(file: File): boolean {
  const validTypes = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'];
  return validTypes.includes(file.type);
}

export function isValidDocumentFile(file: File): boolean {
  const validTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];
  return validTypes.includes(file.type);
}

export function replaceVariables(text: string, variables: Record<string, string>): string {
  let result = text;
  
  // Replace custom variables
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`%${key}%`, 'g');
    result = result.replace(regex, value);
  });
  
  // Replace built-in date variables
  const now = new Date();
  result = result.replace(/%tarih%/g, now.toLocaleDateString('tr-TR'));
  result = result.replace(/%gun%/g, now.getDate().toString());
  result = result.replace(/%ay%/g, (now.getMonth() + 1).toString());
  result = result.replace(/%yil%/g, now.getFullYear().toString());
  
  // Replace greeting variables
  result = result.replace(/%sayın%/g, 'Sayın');
  result = result.replace(/%değerli%/g, 'Değerli');
  result = result.replace(/%kıymetli%/g, 'Kıymetli');
  result = result.replace(/%sevgili%/g, 'Sevgili');
  
  return result;
}

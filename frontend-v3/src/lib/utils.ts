// ============================================
// Utils — SumaryJP
// ============================================

/** Trả về chuỗi "X phút trước", "3 giờ trước"... */
export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1)  return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24)   return `${hours} giờ trước`;

  const days = Math.floor(hours / 24);
  if (days === 1)   return 'Hôm qua';
  if (days < 7)     return `${days} ngày trước`;

  return date.toLocaleDateString('vi-VN');
}

/** Escape HTML để tránh XSS */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Chào buổi sáng / chiều / tối */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Chào buổi sáng';
  if (hour < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

/** Format số với dấu phẩy */
export function formatNumber(n: number): string {
  return n.toLocaleString('vi-VN');
}

/** Tính phần trăm an toàn */
export function calcPercent(current: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(Math.round((current / total) * 100), 100);
}

/** Decode JWT payload */
export function decodeJWT<T = Record<string, unknown>>(token: string): T | null {
  try {
    return JSON.parse(atob(token.split('.')[1])) as T;
  } catch {
    return null;
  }
}

/** Clamp giá trị trong khoảng [min, max] */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

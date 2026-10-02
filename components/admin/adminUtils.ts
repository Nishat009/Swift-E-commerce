import apiClient from '@/lib/apiClient';

/** Turn any axios/validation error into a short human readable message. */
export function errMsg(err: any, fallback = 'Something went wrong. Please try again.'): string {
  if (!err?.response) {
    return err?.message && err.message !== 'Network Error'
      ? err.message
      : 'Cannot reach the server. Check that the backend is running and try again.';
  }
  const data = err.response.data;
  if (data?.errors && typeof data.errors === 'object') {
    const first = Object.values(data.errors)[0];
    if (typeof first === 'string') return first;
  }
  return data?.message || fallback;
}

/** Upload one image to the backend (/api/uploads) and return its public URL. */
export async function uploadImage(file: File): Promise<string> {
  if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) {
    throw new Error('Choose a JPG, PNG, WebP or GIF image.');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image must be under 5 MB.');
  }
  const body = new FormData();
  body.append('image', file);
  try {
    const res = await apiClient.post('/uploads', body, { headers: { 'Content-Type': 'multipart/form-data' } });
    const url = res.data?.data?.url;
    if (!url) throw new Error('Upload succeeded but no image URL was returned.');
    return url;
  } catch (err: any) {
    throw new Error(errMsg(err, 'Image upload failed.'));
  }
}

/** Download rows as a CSV file (Excel friendly, UTF-8 BOM). */
export function downloadCsv(filename: string, rows: (string | number | boolean | null | undefined)[][]): void {
  const escape = (v: any) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = '﻿' + rows.map((r) => r.map(escape).join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

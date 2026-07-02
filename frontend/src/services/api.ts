import type { Collection } from '../types';

export const API_BASE_URL = 'http://localhost:8000';

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/`);
    return res.ok;
  } catch {
    return false;
  }
}

export async function createCollection(
  name: string,
  description: string
): Promise<Collection | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/collections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    });
    if (res.ok) {
      const data = await res.json();
      return {
        id: data.id,
        name: data.name,
        description: data.description,
        created_at: data.created_at,
        status: data.status,
        photos: [],
        duplicate_groups: [],
        albums: [],
      };
    }
  } catch (e) {
    console.error('API Error creating collection:', e);
  }
  return null;
}

export async function registerUrls(
  collectionId: string,
  urls: string[]
): Promise<boolean> {
  const res = await fetch(
    `${API_BASE_URL}/collections/${collectionId}/photos/register`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls }),
    }
  );
  return res.ok;
}

export async function uploadFiles(
  collectionId: string,
  files: File[]
): Promise<{ ok: boolean; error?: string }> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  const res = await fetch(
    `${API_BASE_URL}/collections/${collectionId}/photos/upload`,
    { method: 'POST', body: formData }
  );
  if (res.ok) return { ok: true };
  const errData = await res.json().catch(() => ({}));
  return { ok: false, error: errData.detail || 'Unknown error' };
}

export async function fetchCollectionResults(collectionId: string) {
  const res = await fetch(`${API_BASE_URL}/collections/${collectionId}/results`);
  if (res.ok) return res.json();
  return null;
}

export async function triggerAnalysis(collectionId: string): Promise<boolean> {
  const res = await fetch(
    `${API_BASE_URL}/collections/${collectionId}/analyze`,
    { method: 'POST' }
  );
  return res.ok;
}

export async function askQuestion(
  collectionId: string,
  question: string
): Promise<{ answer: string; sources: { id: string; name: string; url: string; caption: string }[] } | null> {
  const res = await fetch(`${API_BASE_URL}/collections/${collectionId}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  if (res.ok) return res.json();
  return null;
}

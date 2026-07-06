import React from 'react';
import type { TabId } from '../types';

interface TabNavProps {
  activeTab: TabId;
  dupsCount: number;
  onTabChange: (tab: TabId) => void;
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'gallery',    label: '🖼️ Photos & Quality' },
  { id: 'albums',     label: '🗂️ Smart Albums' },
  { id: 'duplicates', label: '👯 Duplicates' },
  { id: 'reel',       label: '🎬 Reel Plan' },
  { id: 'ask',        label: '💬 Ask Agent' },
];

export default function TabNav({ activeTab, dupsCount, onTabChange }: TabNavProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '4px',
      }}
    >
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === tab.id ? '#0a1392ff' : '#6b7280',
            fontSize: '14px',
            fontWeight: '600',
            padding: '8px 12px',
            cursor: 'pointer',
            borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : 'none',
          }}
        >
          {tab.id === 'duplicates' ? `👯 Duplicates (${dupsCount})` : tab.label}
        </button>
      ))}
    </div>
  );
}

import React from 'react';
import type { PipelineLog } from '../types';

interface PipelinePanelProps {
  collectionStatus: string;
  isAnalyzing: boolean;
  activeAgent: string | null;
  analysisLogs: PipelineLog[];
  onAnalyze: () => void;
}

const AGENTS = [
  { key: 'CoordinatorAgent', label: 'Coordinator', emoji: '👑', activeColor: 'rgba(168, 85, 247, 0.2)', activeBorder: 'var(--secondary)', activeText: 'var(--secondary)', lineColor: 'var(--secondary)' },
  { key: 'QualityAgent',     label: 'QualityAgent', emoji: '✨', activeColor: 'rgba(99, 102, 241, 0.2)',  activeBorder: 'var(--primary)',   activeText: 'var(--primary)',   lineColor: 'var(--primary)' },
  { key: 'CaptionAgent',     label: 'CaptionAgent', emoji: '📝', activeColor: 'rgba(20, 184, 166, 0.2)',  activeBorder: 'var(--accent)',    activeText: 'var(--accent)',    lineColor: 'var(--accent)' },
  { key: 'DuplicateAgent',   label: 'DuplicateAgent',emoji: '👯', activeColor: 'rgba(245, 158, 11, 0.2)', activeBorder: 'var(--warning)',  activeText: 'var(--warning)',   lineColor: 'var(--warning)' },
  { key: 'AlbumAgent',       label: 'AlbumAgent',   emoji: '🗂️', activeColor: 'rgba(16, 185, 129, 0.2)', activeBorder: 'var(--success)',  activeText: 'var(--success)',   lineColor: 'var(--warning)' },
];

export default function PipelinePanel({
  collectionStatus,
  isAnalyzing,
  activeAgent,
  analysisLogs,
  onAnalyze,
}: PipelinePanelProps) {
  const isCompleted = collectionStatus === 'completed';
  const canRun = !isAnalyzing && (
    collectionStatus === 'idle' ||
    collectionStatus === 'completed' ||
    collectionStatus === 'failed'
  );

  return (
    <div className="glass-panel" style={{ padding: '16px' }}>
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div>
          <h4 className="font-outfit" style={{ fontSize: '14px', color: '#fff' }}>
            Agentic Indexing Pipeline
          </h4>
          <p style={{ fontSize: '11px', color: '#9ca3af' }}>
            Runs coordinator and specialized agents sequentially
          </p>
        </div>

        {canRun && (
          <button
            onClick={onAnalyze}
            className="glass-panel"
            style={{
              background: 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)',
              border: 'none',
              color: '#fff',
              padding: '8px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              whiteSpace: 'nowrap',
            }}
          >
            {isCompleted ? '🔄 Re-analyze' : '🔮 Run AI Analysis'}
          </button>
        )}
        {isAnalyzing && (
          <span
            style={{
              fontSize: '12px',
              color: 'var(--secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span className="spinner" style={{ display: 'inline-block' }}>⚙️</span> Analyzing…
          </span>
        )}
      </div>

      {/* Agent flow map */}
      <div className="pipeline-agent-row">
        {AGENTS.map((agent, idx) => {
          const isActive = activeAgent === agent.key;
          return (
            <React.Fragment key={agent.key}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  zIndex: 2,
                  minWidth: '90px',
                }}
              >
                <div
                  className={`glass-panel ${isActive ? 'glow-active' : ''}`}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    background: isCompleted
                      ? 'rgba(16, 185, 129, 0.15)'
                      : isActive
                      ? agent.activeColor
                      : 'rgba(255, 255, 255, 0.05)',
                    borderColor: isCompleted
                      ? 'var(--success)'
                      : isActive
                      ? agent.activeBorder
                      : 'var(--border-color)',
                  }}
                >
                  {agent.emoji}
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    marginTop: '6px',
                    fontWeight: '600',
                    color: isActive ? agent.activeText : '#fff',
                  }}
                >
                  {agent.label}
                </span>
              </div>

              {/* Connector line between agents */}
              {idx < AGENTS.length - 1 && (
                <svg style={{ flex: 1, height: '4px', minWidth: '40px' }}>
                  <line
                    x1="0%"
                    y1="50%"
                    x2="100%"
                    y2="50%"
                    stroke={isAnalyzing ? agent.lineColor : 'var(--border-color)'}
                    strokeWidth="2"
                    className={isAnalyzing ? 'flow-line' : ''}
                  />
                </svg>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Terminal logs */}
      {(isAnalyzing || analysisLogs.length > 0) && (
        <div
          style={{
            marginTop: '12px',
            background: '#090d16',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '8px',
            padding: '10px 14px',
            maxHeight: '100px',
            overflowY: 'auto',
            fontFamily: 'monospace',
            fontSize: '11px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          {analysisLogs.map((log, index) => (
            <div
              key={index}
              style={{
                color:
                  log.status === 'running'
                    ? 'var(--secondary)'
                    : log.status === 'warning'
                    ? 'var(--warning)'
                    : '#10b981',
              }}
            >
              <span>[{log.agent}]</span> {log.message}{' '}
              {isAnalyzing && log.status === 'running' && (
                <span className="spinner" style={{ display: 'inline-block' }}>⚙️</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

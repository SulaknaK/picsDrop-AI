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
  { key: 'CoordinatorAgent', label: 'CoordinatorAgent', emoji: '👑', activeColor: 'rgba(168, 85, 247, 0.2)', activeBorder: 'var(--secondary)', activeText: 'var(--secondary)', lineColor: 'var(--secondary)' },
  { key: 'QualityCheckerAgent', label: 'QualityCheckerAgent', emoji: '✨', activeColor: 'rgba(99, 102, 241, 0.2)', activeBorder: 'var(--primary)', activeText: 'var(--primary)', lineColor: 'var(--primary)' },
  { key: 'CaptionGeneratorAgent', label: 'CaptionGeneratorAgent', emoji: '📝', activeColor: 'rgba(20, 184, 166, 0.2)', activeBorder: 'var(--accent)', activeText: 'var(--accent)', lineColor: 'var(--accent)' },
  { key: 'DuplicateFinderAgent', label: 'DuplicateFinderAgent', emoji: '👯', activeColor: 'rgba(245, 158, 11, 0.2)', activeBorder: 'var(--warning)', activeText: 'var(--warning)', lineColor: 'var(--warning)' },
  { key: 'AlbumCreatorAgent', label: 'AlbumCreatorAgent', emoji: '🗂️', activeColor: 'rgba(16, 185, 129, 0.2)', activeBorder: 'var(--success)', activeText: 'var(--success)', lineColor: 'var(--warning)' },
  { key: 'ReelPlannerAgent', label: 'Reel Planner', emoji: '🎬', activeColor: 'rgba(236, 72, 153, 0.2)', activeBorder: '#ec4899', activeText: '#ec4899', lineColor: '#ec4899' },
];

// Keywords that indicate a Gemini quota / API key error in the log message
const QUOTA_KEYWORDS = [
  'quota',
  'rate limit',
  'rate_limit',
  'resource_exhausted',
  'resourceexhausted',
  'quota exceeded',
  'too many requests',
  '429',
  'api key not valid',
  'api_key_invalid',
  'invalid api key',
];

function detectFailureType(logs: PipelineLog[]): 'quota' | 'generic' | null {
  if (logs.length === 0) return null;
  const lastMsg = logs[logs.length - 1].message.toLowerCase();
  if (QUOTA_KEYWORDS.some((kw) => lastMsg.includes(kw))) return 'quota';
  return 'generic';
}

export default function PipelinePanel({
  collectionStatus,
  isAnalyzing,
  activeAgent,
  analysisLogs,
  onAnalyze,
}: PipelinePanelProps) {
  const isCompleted = collectionStatus === 'completed';
  const isFailed = collectionStatus === 'failed';
  const failureType = isFailed ? detectFailureType(analysisLogs) : null;
  const canRun = !isAnalyzing && (
    collectionStatus === 'idle' ||
    collectionStatus === 'completed' ||
    collectionStatus === 'failed'
  );

  return (
    <div className="glass-panel" style={{ padding: '16px', marginTop: '15px' }}>
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
          <h4 className="font-outfit" style={{ fontSize: '16px', color: '#262627ff', padding: '3px' }}>
            Agentic Indexing Pipeline
          </h4>
          <p style={{ fontSize: '14px', color: '#262627ff', padding: '2px' }}>
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
              color: '#ffffffff',
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
      <div className="pipeline-agent-row" style={{ backgroundColor: 'pink' }}>
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
                      : log.status === 'failed'
                        ? 'var(--danger)'
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

      {/* Failure alert banner */}
      {failureType === 'quota' && (
        <div
          style={{
            marginTop: '12px',
            padding: '12px 16px',
            borderRadius: '8px',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
          }}
        >
          <span style={{ fontSize: '18px', flexShrink: 0 }}>⚠️</span>
          <div>
            <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--warning)', marginBottom: '4px' }}>
              Gemini API quota reached
            </p>
            <p style={{ fontSize: '12px', color: '#2f3031ff', lineHeight: '1.5' }}>
              Your Gemini API quota has been exhausted. Please wait a few minutes and try again,
              or check your API key limits in the{' '}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--warning)', textDecoration: 'underline' }}
              >
                Google AI Studio
              </a>
              .
            </p>
          </div>
        </div>
      )}

      {failureType === 'generic' && (
        <div
          style={{
            marginTop: '12px',
            padding: '12px 16px',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
          }}
        >
          <span style={{ fontSize: '18px', flexShrink: 0 }}>❌</span>
          <div>
            <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--danger)', marginBottom: '4px' }}>
              Analysis failed
            </p>
            <p style={{ fontSize: '12px', color: '#d1d5db', lineHeight: '1.5' }}>
              Something went wrong during the AI pipeline. Check the logs above for details, then click Re-analyze to try again.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useRef, useEffect } from 'react';
import type { ChatMessage, Photo } from '../types';

interface AskAgentProps {
  chatHistory: ChatMessage[];
  question: string;
  isAsking: boolean;
  photos: Photo[];
  onQuestionChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onSelectPhoto: (photo: Photo) => void;
  onSuggestQuestion: (q: string) => void;
}

const SUGGESTED_QUESTIONS = [
  'Show me sunset photos',
  'Which photos are blurry?',
  'Do I have duplicates?',
  'What smart albums were created?',
];

export default function AskAgent({
  chatHistory,
  question,
  isAsking,
  photos,
  onQuestionChange,
  onSubmit,
  onSelectPhoto,
  onSuggestQuestion,
}: AskAgentProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  return (
    <div
      style={{
        height: '450px',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(179, 169, 169, 0.15)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
      }}
    >
      {/* Messages panel */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {chatHistory.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              color: '#6b7280',
              fontSize: '12px',
              gap: '8px',
              textAlign: 'center',
            }}
          >
            <span>💬 Ask questions like:</span>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                maxWidth: '400px',
                justifyContent: 'center',
              }}
            >
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => onSuggestQuestion(q)}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    color: '#aaa',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '20px',
                    padding: '4px 10px',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  "{q}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          chatHistory.map((msg, index) => (
            <div
              key={index}
              style={{
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                background:
                  msg.sender === 'user' ? 'var(--primary)' : 'rgba(74, 185, 103, 1)',
                borderRadius: '12px',
                padding: '10px 14px',
                border: msg.sender === 'user' ? 'none' : '1px solid var(--border-color)',
              }}
            >
              <p style={{ fontSize: '13px', color: '#fff', whiteSpace: 'pre-wrap' }}>{msg.text}</p>

              {msg.sources && msg.sources.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap',
                    marginTop: '10px',
                    paddingTop: '8px',
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {msg.sources.map((src) => {
                    const fullPhoto = photos.find((x) => x.id === src.id);
                    return (
                      <div
                        key={src.id}
                        className="glass-panel"
                        onClick={() => { if (fullPhoto) onSelectPhoto(fullPhoto); }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          background: 'rgba(0,0,0,0.2)',
                        }}
                      >
                        <img
                          src={src.url}
                          alt={src.name}
                          style={{ width: '20px', height: '20px', borderRadius: '3px', objectFit: 'cover' }}
                        />
                        <span style={{ fontSize: '10px', color: '#bbb' }}>
                          {src.name.split('/').pop()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
              <span
                style={{
                  display: 'block',
                  fontSize: '9px',
                  color: '#9ca3af',
                  textAlign: 'right',
                  marginTop: '4px',
                }}
              >
                {msg.timestamp}
              </span>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input form */}
      <form
        onSubmit={onSubmit}
        style={{ display: 'flex', borderTop: '1px solid var(--border-color)', padding: '8px' }}
      >
        <input
          type="text"
          value={question}
          onChange={(e) => onQuestionChange(e.target.value)}
          placeholder="Ask a question about this collection..."
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            color: '#121111ff',
            padding: '8px 12px',
            fontSize: '13px',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={isAsking || !question.trim()}
          className="glass-panel"
          style={{
            background: 'var(--primary)',
            color: '#fff',
            border: 'none',
            padding: '6px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600',
          }}
        >
          {isAsking ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
}

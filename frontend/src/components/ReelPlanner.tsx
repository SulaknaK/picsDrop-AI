import React from 'react';
import type { ReelPlan, Photo } from '../types';

interface ReelPlannerProps {
  reelPlan?: ReelPlan | null;
  photos: Photo[];
}

export default function ReelPlanner({ reelPlan, photos }: ReelPlannerProps) {
  if (!reelPlan) {
    return (
      <section className="glass-panel" style={{ padding: '20px' }}>
        <h3>🎬 AI Highlight Reel Plan</h3>
        <p style={{ color: '#6b7280' }}>
          Run the analysis pipeline to generate an AI-planned event reel.
        </p>
      </section>
    );
  }

  const getPhoto = (photoId: string) => photos.find((p) => p.id === photoId);

  return (
    <section className="glass-panel" style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <p style={{ color: '#ec4899', fontWeight: 700, marginBottom: '6px' }}>
          ReelPlannerAgent
        </p>

        <h2 style={{ margin: 0 }}>🎬 {reelPlan.reel_title}</h2>

        <p style={{ color: '#6b7280', marginTop: '8px' }}>
          {reelPlan.reel_theme}
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div className="glass-panel" style={{ padding: '14px' }}>
          <strong>Music Mood</strong>
          <p>{reelPlan.music_mood}</p>
        </div>

        <div className="glass-panel" style={{ padding: '14px' }}>
          <strong>Duration</strong>
          <p>{reelPlan.estimated_duration_seconds} seconds</p>
        </div>

        <div className="glass-panel" style={{ padding: '14px' }}>
          <strong>Closing Caption</strong>
          <p>{reelPlan.closing_caption}</p>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h3>Story Arc</h3>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {reelPlan.story_arc.map((step, index) => (
            <span
              key={index}
              style={{
                padding: '8px 12px',
                borderRadius: '999px',
                background: '#fce7f3',
                color: '#9d174d',
                fontWeight: 600,
              }}
            >
              {index + 1}. {step}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h3>Selected Reel Photos</h3>

        <div style={{ display: 'grid', gap: '14px' }}>
          {reelPlan.selected_photos
            .sort((a, b) => a.order - b.order)
            .map((item) => {
              const photo = getPhoto(item.photo_id);

              return (
                <div
                  key={`${item.photo_id}-${item.order}`}
                  className="glass-panel"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '90px 1fr',
                    gap: '14px',
                    padding: '12px',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '90px',
                      height: '90px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      background: '#f3f4f6',
                    }}
                  >
                    {photo?.url ? (
                      <img
                        src={photo.url}
                        alt={photo.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <div style={{ padding: '12px', fontSize: '12px' }}>
                        No image
                      </div>
                    )}
                  </div>

                  <div>
                    <p style={{ margin: 0, fontWeight: 700 }}>
                      Scene {item.order}: {item.overlay_text}
                    </p>

                    <p style={{ margin: '6px 0', color: '#6b7280' }}>
                      {item.reason}
                    </p>

                    <p style={{ margin: 0, fontSize: '13px' }}>
                      {item.duration_seconds}s • {item.transition}
                    </p>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </section>
  );
}
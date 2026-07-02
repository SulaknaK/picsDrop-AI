export interface Photo {
  id: string;
  name: string;
  url: string;
  type: string;
  registered_at: string;
  status: string;
  quality_score: number;
  quality_details: {
    sharpness: number;
    composition: number;
    lighting: number;
    issues: string[];
  };
  caption: string;
  tags: string[];
}

export interface Album {
  id: string;
  title: string;
  description: string;
  cover_photo_id: string;
  photo_ids: string[];
}

export interface PipelineLog {
  agent: string;
  message: string;
  status: string;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  created_at: string;
  status: string;
  photos: Photo[];
  duplicate_groups: string[][];
  albums: Album[];
  logs?: PipelineLog[];
}

export interface ChatMessage {
  sender: 'user' | 'agent';
  text: string;
  sources?: { id: string; name: string; url: string; caption: string }[];
  timestamp: string;
}

export type TabId = 'gallery' | 'albums' | 'duplicates' | 'ask';

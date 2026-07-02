# PicsDrop AI 📸🤖

PicsDrop AI is an API-first AI Event Memory Agent. It accepts external image URLs or local photo uploads, analyzes the photos, and extracts rich memory metadata, including:
- **Quality Score & Insights** (Image sharpness, composition, lighting)
- **Duplicate & Near-Duplicate Grouping** (Perceptual-hash-like similarities)
- **Smart Albums** (Theme, event, location, and chronological grouping)
- **Automatic Captions & Searchable Tags**
- **Natural Language Querying** (Ask questions about your photos)

The system is storage-agnostic, handling both remote assets and local multi-part file uploads.

---

## 🏗️ Project Architecture

```
/picsDrop-AI
  ├── README.md             # This file
  ├── .gitignore            # Git exclusion rules
  ├── .env.example          # Environment variables template
  ├── /backend              # FastAPI backend application
  │    ├── Dockerfile       # Container definition
  │    ├── requirements.txt # Python dependencies
  │    └── /app             # Backend source code
  │         ├── main.py     # FastAPI entry point
  │         ├── /api        # API Routers & Schemas
  │         ├── /core       # Configuration settings
  │         ├── /models     # In-memory mock database
  │         ├── /agents     # Coordinator & worker agent implementations
  │         └── /tools      # Specialized agent utility tools
  ├── /frontend             # React + TypeScript + Vanilla CSS Frontend Demo
  └── /docs                 # Technical documentation
```

---

## 🛠️ Backend Architecture

PicsDrop AI uses an **Agentic Workflow** coordinates by a `CoordinatorAgent`:
1. **PhotoSourceTool**: Downloads or loads the target images into standard memory formats.
2. **QualityAgent** + **ImageQualityTool**: Scores the aesthetic and technical quality of images.
3. **DuplicateAgent** + **DuplicateDetectionTool**: Groups near-identical pictures to help prune clutter.
4. **CaptionAgent** + **CaptionGenerationTool**: Captions images and generates highly relevant keyword tags.
5. **AlbumAgent** + **AlbumCreationTool**: Clusters the photos into structured event albums.
6. **CoordinatorAgent**: Orchestrates this execution pipeline, aggregates results, and handles user questions using the generated metadata index.

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+ (with npm)

### Running the Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # macOS/Linux:
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy environment file and start the server:
   ```bash
   copy .env.example .env
   uvicorn app.main:app --reload --port 8000
   ```
5. Interactive API docs will be available at: http://localhost:8000/docs

### Running the Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Run dev server:
   ```bash
   npm run dev
   ```
4. Open the app in your browser (usually http://localhost:5173).

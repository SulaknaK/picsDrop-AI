from typing import List, Dict, Any, Optional

from pydantic import BaseModel, Field


class CollectionCreate(BaseModel):
    name: str = Field(..., example="Vacation Memories 2026")
    description: Optional[str] = Field(None, example="My summer vacation photos from the beach.")


class CollectionResponse(BaseModel):
    id: str
    name: str
    description: str
    created_at: str
    status: str


class PhotoRegisterRequest(BaseModel):
    urls: List[str] = Field(..., example=["https://images.unsplash.com/photo-1507525428034-b723cf961d3e"])


class QualityDetails(BaseModel):
    sharpness: float
    composition: float
    lighting: float
    issues: List[str]


class PhotoResponse(BaseModel):
    id: str
    name: str
    url: str
    type: str
    source_type: Optional[str] = None
    source_url: Optional[str] = None
    local_path: Optional[str] = None
    registered_at: str
    status: str
    analysis_json: Optional[Dict[str, Any]] = None
    image_hash: Optional[str] = None
    quality_score: float
    quality_details: QualityDetails
    caption: str
    tags: List[str]


class AlbumResponse(BaseModel):
    id: str
    title: str
    description: str
    cover_photo_id: str
    photo_ids: List[str]


class PipelineLog(BaseModel):
    agent: str
    message: str
    status: str


class CollectionResultsResponse(BaseModel):
    id: str
    name: str
    description: str
    status: str
    created_at: str
    photos: List[PhotoResponse]
    duplicate_groups: List[List[str]]
    albums: List[AlbumResponse]
    logs: Optional[List[PipelineLog]] = None
    reel_plan: Optional[Dict[str, Any]] = None


class AnalysisResponse(BaseModel):
    collection_id: str
    status: str
    message: str


class AskRequest(BaseModel):
    question: str = Field(..., example="How many blurry photos are in this collection?")


class AskSource(BaseModel):
    id: str
    name: str
    url: str
    caption: str


class AskResponse(BaseModel):
    answer: str
    sources: List[AskSource]
from fastapi import APIRouter, HTTPException, UploadFile, File, BackgroundTasks, status
from typing import List
from app.models.database import db
from app.api.schemas import (
    CollectionCreate,
    CollectionResponse,
    PhotoRegisterRequest,
    PhotoResponse,
    AnalysisResponse,
    CollectionResultsResponse,
    AskRequest,
    AskResponse
)
from app.agents.coordinator import CoordinatorAgent

router = APIRouter()
coordinator = CoordinatorAgent()

@router.post(
    "/collections",
    response_model=CollectionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new collection"
)
def create_collection(payload: CollectionCreate):
    collection = db.create_collection(payload.name, payload.description)
    return CollectionResponse(
        id=collection["id"],
        name=collection["name"],
        description=collection["description"],
        created_at=collection["created_at"],
        status=collection["status"]
    )

@router.post(
    "/collections/{collection_id}/photos/register",
    response_model=List[PhotoResponse],
    summary="Register external photo URLs into a collection"
)
def register_photos(collection_id: str, payload: PhotoRegisterRequest):
    collection = db.get_collection(collection_id)
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
        
    registered = db.register_photos(collection_id, payload.urls)
    if registered is None:
        raise HTTPException(status_code=404, detail="Collection not found")
        
    return [PhotoResponse(**p) for p in registered]

@router.post(
    "/collections/{collection_id}/photos/upload",
    response_model=List[PhotoResponse],
    summary="Upload image files directly into a collection"
)
async def upload_photos(collection_id: str, files: List[UploadFile] = File(...)):
    collection = db.get_collection(collection_id)
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
        
    uploaded_photos = []
    for file in files:
        # Standard validation
        if not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400, 
                detail=f"File {file.filename} is not an image. Only image files are supported."
            )
        
        # In a real storage-agnostic app, we'd upload the bytes to S3/Cloud Storage here.
        # For mock execution, we save filename metadata in database.
        photo = db.upload_photo(collection_id, file.filename, file.content_type)
        if photo is None:
            raise HTTPException(status_code=404, detail="Collection not found")
        uploaded_photos.append(photo)
        
    return [PhotoResponse(**p) for p in uploaded_photos]

@router.post(
    "/collections/{collection_id}/analyze",
    response_model=AnalysisResponse,
    summary="Trigger the AI analysis pipeline using CoordinatorAgent"
)
def analyze_collection(collection_id: str, background_tasks: BackgroundTasks):
    collection = db.get_collection(collection_id)
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
        
    # Check if already analyzing
    if collection["status"] == "analyzing":
        return AnalysisResponse(
            collection_id=collection_id,
            status="analyzing",
            message="Analysis is already in progress."
        )

    # Reset logs & run background agent pipeline
    collection["logs"] = []
    background_tasks.add_task(coordinator.analyze_collection, collection_id)
    
    return AnalysisResponse(
        collection_id=collection_id,
        status="analyzing",
        message="Analysis started in the background using the CoordinatorAgent pipeline."
    )

@router.get(
    "/collections/{collection_id}/results",
    response_model=CollectionResultsResponse,
    summary="Get collection metadata, smart albums, duplicate clusters, and agent logs"
)
def get_results(collection_id: str):
    collection = db.get_collection(collection_id)
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
        
    photos_list = list(collection.get("photos", {}).values())
    
    return CollectionResultsResponse(
        id=collection["id"],
        name=collection["name"],
        description=collection["description"],
        status=collection["status"],
        created_at=collection["created_at"],
        photos=[PhotoResponse(**p) for p in photos_list],
        duplicate_groups=collection.get("duplicate_groups", []),
        albums=collection.get("albums", []),
        logs=collection.get("logs", [])
    )

@router.post(
    "/collections/{collection_id}/ask",
    response_model=AskResponse,
    summary="Ask natural language questions about the photo memories"
)
def ask_question(collection_id: str, payload: AskRequest):
    collection = db.get_collection(collection_id)
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
        
    # Check if analysis has run at least once
    if collection["status"] == "idle" and not collection.get("photos"):
        raise HTTPException(
            status_code=400, 
            detail="No photos in this collection. Please upload or register photos first."
        )
        
    qa_result = coordinator.ask_question(collection_id, payload.question)
    return AskResponse(**qa_result)

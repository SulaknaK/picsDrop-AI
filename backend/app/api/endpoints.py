from pathlib import Path
import shutil
import uuid
from typing import List

from fastapi import APIRouter, HTTPException, UploadFile, File, BackgroundTasks, status

from app.models.database import db
from app.api.schemas import (
    CollectionCreate,
    CollectionResponse,
    PhotoRegisterRequest,
    PhotoResponse,
    AnalysisResponse,
    CollectionResultsResponse,
    AskRequest,
    AskResponse,
)
from app.agents.coordinator import CoordinatorAgent

router = APIRouter()
coordinator = CoordinatorAgent()

BASE_DIR = Path(__file__).resolve().parents[2]
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post(
    "/collections",
    response_model=CollectionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new collection",
)
def create_collection(payload: CollectionCreate):
    collection = db.create_collection(payload.name, payload.description)
    return CollectionResponse(
        id=collection["id"],
        name=collection["name"],
        description=collection["description"],
        created_at=collection["created_at"],
        status=collection["status"],
    )


@router.post(
    "/collections/{collection_id}/photos/register",
    response_model=List[PhotoResponse],
    summary="Register external photo URLs into a collection",
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
    summary="Upload image files directly into a collection",
)
async def upload_photos(collection_id: str, files: List[UploadFile] = File(...)):
    collection = db.get_collection(collection_id)
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    uploaded_photos = []

    for file in files:
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400,
                detail=f"File {file.filename} is not an image. Only image files are supported.",
            )

        original_name = Path(file.filename or "upload.jpg").name
        extension = Path(original_name).suffix or ".jpg"
        stored_filename = f"{uuid.uuid4().hex}{extension}"
        destination = UPLOAD_DIR / stored_filename

        with destination.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        photo = db.upload_photo(
            collection_id=collection_id,
            original_filename=original_name,
            stored_filename=stored_filename,
            content_type=file.content_type,
            local_path=str(destination),
        )

        if photo is None:
            raise HTTPException(status_code=404, detail="Collection not found")

        uploaded_photos.append(photo)

    return [PhotoResponse(**p) for p in uploaded_photos]


@router.post(
    "/collections/{collection_id}/analyze",
    response_model=AnalysisResponse,
    summary="Trigger the AI analysis pipeline using CoordinatorAgent",
)
def analyze_collection(collection_id: str, background_tasks: BackgroundTasks):
    collection = db.get_collection(collection_id)
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    if collection["status"] == "analyzing":
        return AnalysisResponse(
            collection_id=collection_id,
            status="analyzing",
            message="Analysis is already in progress.",
        )

    collection["logs"] = []
    background_tasks.add_task(coordinator.analyze_collection, collection_id)

    return AnalysisResponse(
        collection_id=collection_id,
        status="analyzing",
        message="Analysis started in the background using the CoordinatorAgent pipeline.",
    )


@router.get(
    "/collections/{collection_id}/results",
    response_model=CollectionResultsResponse,
    summary="Get collection metadata, smart albums, duplicate clusters, and agent logs",
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
        reel_plan=collection.get("reel_plan"),
        logs=collection.get("logs", []),
    )


@router.post(
    "/collections/{collection_id}/ask",
    response_model=AskResponse,
    summary="Ask natural language questions about the photo memories",
)
def ask_question(collection_id: str, payload: AskRequest):
    collection = db.get_collection(collection_id)

    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    if collection["status"] == "idle" and not collection.get("photos"):
        raise HTTPException(
            status_code=400,
            detail="No photos in this collection. Please upload or register photos first.",
        )

    qa_result = coordinator.ask_question(collection_id, payload.question)
    return AskResponse(**qa_result)
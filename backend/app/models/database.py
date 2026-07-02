import uuid
from datetime import datetime
from typing import Dict, List, Any, Optional
import threading

class Database:
    def __init__(self):
        self._collections: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()

    def create_collection(self, name: str, description: Optional[str] = None) -> Dict[str, Any]:
        with self._lock:
            collection_id = str(uuid.uuid4())
            collection = {
                "id": collection_id,
                "name": name,
                "description": description or "",
                "created_at": datetime.utcnow().isoformat(),
                "status": "idle",  # idle, analyzing, completed, failed
                "photos": {},  # photo_id -> photo_details
                "albums": [],  # list of created albums
                "duplicate_groups": []  # list of duplicate groups (list of photo IDs)
            }
            self._collections[collection_id] = collection
            return collection

    def get_collection(self, collection_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            return self._collections.get(collection_id)

    def register_photos(self, collection_id: str, urls: List[str]) -> Optional[List[Dict[str, Any]]]:
        with self._lock:
            if collection_id not in self._collections:
                return None
            
            registered = []
            for url in urls:
                photo_id = str(uuid.uuid4())
                photo = {
                    "id": photo_id,
                    "name": url.split("/")[-1] or f"photo_{photo_id[:8]}",
                    "url": url,
                    "type": "url",
                    "registered_at": datetime.utcnow().isoformat(),
                    "status": "registered",  # registered, analyzing, analyzed
                    # Placeholder metadata, populated during analysis
                    "quality_score": 0.0,
                    "quality_details": {"sharpness": 0.0, "composition": 0.0, "lighting": 0.0, "issues": []},
                    "caption": "",
                    "tags": []
                }
                self._collections[collection_id]["photos"][photo_id] = photo
                registered.append(photo)
            
            # Reset status if new photos are registered
            self._collections[collection_id]["status"] = "idle"
            return registered

    def upload_photo(self, collection_id: str, filename: str, content_type: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            if collection_id not in self._collections:
                return None
            
            photo_id = str(uuid.uuid4())
            # storage-agnostic simulation: mock url
            mock_url = f"http://localhost:8000/static/uploads/{collection_id}/{photo_id}_{filename}"
            photo = {
                "id": photo_id,
                "name": filename,
                "url": mock_url,
                "type": "upload",
                "registered_at": datetime.utcnow().isoformat(),
                "status": "uploaded",
                "quality_score": 0.0,
                "quality_details": {"sharpness": 0.0, "composition": 0.0, "lighting": 0.0, "issues": []},
                "caption": "",
                "tags": []
            }
            self._collections[collection_id]["photos"][photo_id] = photo
            # Reset status
            self._collections[collection_id]["status"] = "idle"
            return photo

    def update_collection_status(self, collection_id: str, status: str) -> bool:
        with self._lock:
            if collection_id in self._collections:
                self._collections[collection_id]["status"] = status
                return True
            return False

    def update_photo_analysis(self, collection_id: str, photo_id: str, analysis_data: Dict[str, Any]) -> bool:
        with self._lock:
            if collection_id not in self._collections or photo_id not in self._collections[collection_id]["photos"]:
                return False
            
            photo = self._collections[collection_id]["photos"][photo_id]
            photo.update(analysis_data)
            photo["status"] = "analyzed"
            return True

    def set_duplicate_groups(self, collection_id: str, groups: List[List[str]]) -> bool:
        with self._lock:
            if collection_id in self._collections:
                self._collections[collection_id]["duplicate_groups"] = groups
                return True
            return False

    def set_albums(self, collection_id: str, albums: List[Dict[str, Any]]) -> bool:
        with self._lock:
            if collection_id in self._collections:
                self._collections[collection_id]["albums"] = albums
                return True
            return False

db = Database()

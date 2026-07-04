from typing import List, Dict, Any
import uuid

from app.tools.album_creation import AlbumCreationTool


class AlbumCreatorAgent:
    def __init__(self):
        self.album_tool = AlbumCreationTool()

    def organize_collection(self, photos: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        if not any(p.get("analysis_json") for p in photos):
            return self.album_tool.create_albums(photos)

        groups: Dict[str, List[Dict[str, Any]]] = {}

        for photo in photos:
            album_key = self._choose_album_key(photo)
            groups.setdefault(album_key, []).append(photo)

        albums = []

        for album_key, album_photos in groups.items():
            if not album_photos:
                continue

            albums.append({
                "id": f"album-{album_key}-{uuid.uuid4().hex[:8]}",
                "title": self._title_for_album(album_key),
                "description": self._description_for_album(album_key),
                "cover_photo_id": self._pick_cover_photo(album_photos),
                "photo_ids": [p["id"] for p in album_photos],
            })

        return albums

    def _choose_album_key(self, photo: Dict[str, Any]) -> str:
        analysis = photo.get("analysis_json") or {}
        scene = str(analysis.get("scene", "general")).lower()
        tags = [str(t).lower() for t in analysis.get("tags", [])]
        event = analysis.get("event") or {}
        photo_type = str(event.get("photo_type", "")).lower()
        people = analysis.get("people") or {}

        if photo_type == "ceremony":
            return "ceremony"

        if photo_type == "dance_floor":
            return "dance_floor"

        if photo_type == "food" or scene == "food":
            return "food"

        if photo_type in ["group", "couple"] or people.get("group_photo"):
            return "people"

        if photo_type == "portrait" or people.get("portrait"):
            return "portraits"

        if photo_type == "travel" or scene in ["beach", "mountain", "city", "nature", "sunset"]:
            return "travel"

        if "sunset" in tags:
            return "sunsets"

        if "coffee" in tags or scene == "coffee":
            return "coffee"

        return scene or "general"

    def _pick_cover_photo(self, photos: List[Dict[str, Any]]) -> str:
        best = max(photos, key=lambda p: p.get("quality_score", 0.0))
        return best["id"]

    def _title_for_album(self, key: str) -> str:
        titles = {
            "ceremony": "Ceremony Highlights",
            "dance_floor": "Dance Floor Moments",
            "food": "Food & Dining",
            "people": "People & Group Photos",
            "portraits": "Portraits",
            "travel": "Travel & Scenic Memories",
            "sunsets": "Sunset Highlights",
            "coffee": "Cafe Moments",
            "beach": "Beach Memories",
            "mountain": "Mountain Views",
            "city": "City Moments",
            "nature": "Nature Moments",
            "general": "General Memories",
        }
        return titles.get(key, key.replace("_", " ").title())

    def _description_for_album(self, key: str) -> str:
        descriptions = {
            "ceremony": "Important ceremony moments and formal event highlights.",
            "dance_floor": "Fun movement, celebration, and dance floor energy.",
            "food": "Meals, drinks, restaurants, and dining memories.",
            "people": "Photos focused on friends, family, guests, and groups.",
            "portraits": "Close-up and person-focused portrait photos.",
            "travel": "Scenic views, travel moments, and outdoor memories.",
            "sunsets": "Golden hour, evening skies, and sunset scenes.",
            "coffee": "Coffee, cafes, and cozy drink moments.",
            "beach": "Ocean, sand, summer, and beach memories.",
            "mountain": "Hiking, mountains, landscapes, and outdoor views.",
            "city": "Urban scenes, streets, buildings, and city life.",
            "nature": "Plants, landscapes, animals, and natural scenery.",
            "general": "Photos that do not fit a specific smart category yet.",
        }
        return descriptions.get(key, f"Photos grouped under {key}.")
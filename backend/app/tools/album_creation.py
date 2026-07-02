import uuid
from typing import List, Dict, Any

class AlbumCreationTool:
    """
    Groups analyzed photos into smart themed albums based on tags, metadata, and quality.
    """
    def __init__(self):
        pass

    def create_albums(self, photos: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Organize photos into smart albums using their tags and attributes.
        Each album has: id, title, description, cover_photo_id, and photo_ids.
        """
        if not photos:
            return []

        # Tag categories to cluster photos
        categories = {
            "nature": {
                "title": "Scenic Nature",
                "description": "Breathtaking landscapes, outdoor views, and natural beauty.",
                "keywords": ["nature", "mountain", "forest", "tree", "river", "lake", "landscape", "sky", "hiking"],
                "photo_ids": []
            },
            "beach": {
                "title": "Ocean Breeze & Beach Days",
                "description": "Sun, sand, waves, and coastal memories.",
                "keywords": ["beach", "ocean", "sea", "sand", "sunset", "coast", "summer", "swimming"],
                "photo_ids": []
            },
            "food": {
                "title": "Culinary Explorations",
                "description": "Delicious meals, drinks, cafes, and foodie adventures.",
                "keywords": ["food", "beverage", "coffee", "restaurant", "dinner", "breakfast", "lunch", "cake", "dessert"],
                "photo_ids": []
            },
            "city": {
                "title": "Urban Wandering",
                "description": "Cityscapes, architecture, streets, and night lights.",
                "keywords": ["city", "street", "building", "architecture", "urban", "skyline", "traffic"],
                "photo_ids": []
            },
            "social": {
                "title": "Friends & Family",
                "description": "Cherished moments with friends, family, and group celebrations.",
                "keywords": ["people", "person", "friend", "family", "party", "gathering", "smile", "portrait"],
                "photo_ids": []
            }
        }

        uncategorized_ids = []

        for photo in photos:
            photo_id = photo["id"]
            tags = [t.lower() for t in photo.get("tags", [])]
            name = photo["name"].lower()
            
            matched = False
            for cat_key, cat_info in categories.items():
                # Check if any keyword matches tags or filename
                if any(kw in tags for kw in cat_info["keywords"]) or any(kw in name for kw in cat_info["keywords"]):
                    cat_info["photo_ids"].append(photo_id)
                    matched = True
            
            if not matched:
                uncategorized_ids.append(photo_id)

        albums = []
        for cat_key, cat_info in categories.items():
            photo_ids = cat_info["photo_ids"]
            if photo_ids:
                # Select cover photo: pick the one with highest quality score
                best_cover = self._find_best_cover(photos, photo_ids)
                albums.append({
                    "id": f"album_{cat_key}_{str(uuid.uuid4())[:8]}",
                    "title": cat_info["title"],
                    "description": cat_info["description"],
                    "cover_photo_id": best_cover,
                    "photo_ids": photo_ids
                })

        # Add uncategorized photos to a "Highlights" or "Timeline" album if there are any
        if uncategorized_ids:
            best_cover = self._find_best_cover(photos, uncategorized_ids)
            albums.append({
                "id": f"album_highlights_{str(uuid.uuid4())[:8]}",
                "title": "Moments & Highlights",
                "description": "A collection of beautiful captured moments.",
                "cover_photo_id": best_cover,
                "photo_ids": uncategorized_ids
            })

        return albums

    def _find_best_cover(self, photos: List[Dict[str, Any]], photo_ids: List[str]) -> str:
        # Find the photo in photo_ids with the highest quality score
        id_to_photo = {p["id"]: p for p in photos}
        best_id = photo_ids[0]
        best_score = -1.0
        
        for pid in photo_ids:
            p = id_to_photo.get(pid)
            if p:
                q_score = p.get("quality_score", 0.0)
                if q_score > best_score:
                    best_score = q_score
                    best_id = pid
        return best_id

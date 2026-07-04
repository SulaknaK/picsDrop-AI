from typing import List, Dict, Any

from app.tools.duplicate_detection import DuplicateDetectionTool
from app.tools.image_hash_tool import ImageHashTool


class DuplicateFinderAgent:
    def __init__(self):
        self.duplicate_tool = DuplicateDetectionTool()
        self.hash_tool = ImageHashTool()

    def find_duplicates(self, photos: List[Dict[str, Any]]) -> List[List[str]]:
        photos_with_hash = [p for p in photos if p.get("image_hash")]

        if photos_with_hash:
            return self._find_duplicates_by_hash(photos_with_hash)

        return self.duplicate_tool.find_duplicates(photos)

    def _find_duplicates_by_hash(self, photos: List[Dict[str, Any]]) -> List[List[str]]:
        threshold = 5
        groups: List[List[str]] = []
        used = set()

        for i, photo_a in enumerate(photos):
            if photo_a["id"] in used:
                continue

            group = [photo_a["id"]]

            for photo_b in photos[i + 1:]:
                if photo_b["id"] in used:
                    continue

                distance = self.hash_tool.compare_hashes(
                    photo_a.get("image_hash"),
                    photo_b.get("image_hash"),
                )

                if distance <= threshold:
                    group.append(photo_b["id"])

            if len(group) > 1:
                best_photo_id = self._pick_best_photo(group, photos)

                ordered_group = [best_photo_id] + [
                    pid for pid in group if pid != best_photo_id
                ]

                groups.append(ordered_group)
                used.update(group)

        return groups

    def _pick_best_photo(self, group: List[str], photos: List[Dict[str, Any]]) -> str:
        photo_lookup = {p["id"]: p for p in photos}

        best = max(
            group,
            key=lambda pid: photo_lookup.get(pid, {}).get("quality_score", 0.0),
        )

        return best
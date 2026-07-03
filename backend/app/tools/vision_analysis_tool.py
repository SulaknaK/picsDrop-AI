from typing import Dict, Any

from app.tools.gemini_vision_client import GeminiVisionClient


class VisionAnalysisTool:
    def __init__(self):
        self.gemini_client = GeminiVisionClient()

    def analyze(self, photo: Dict[str, Any]) -> Dict[str, Any]:
        local_path = photo.get("local_path")

        if local_path:
            return self.gemini_client.analyze_local_image(local_path)

        return self._mock_url_analysis(photo)

    def _mock_url_analysis(self, photo: Dict[str, Any]) -> Dict[str, Any]:
        name = photo.get("name", "").lower()
        url = photo.get("source_url") or photo.get("url") or ""
        text = f"{name} {url}".lower()

        scene = "general"
        tags = ["photo"]
        caption = "A general photo."

        if "beach" in text:
            scene = "beach"
            tags = ["beach", "ocean", "summer"]
            caption = "A sunny beach scene with ocean waves."
        elif "food" in text:
            scene = "food"
            tags = ["food", "meal", "restaurant"]
            caption = "A plated food image."
        elif "coffee" in text:
            scene = "coffee"
            tags = ["coffee", "cafe", "drink"]
            caption = "A cup of coffee in a cafe setting."
        elif "mountain" in text:
            scene = "mountain"
            tags = ["mountain", "nature", "hiking"]
            caption = "A scenic mountain landscape."
        elif "sunset" in text:
            scene = "sunset"
            tags = ["sunset", "sky", "nature"]
            caption = "A warm sunset with colorful evening sky."

        return {
            "description": caption,
            "caption": caption,
            "scene": scene,
            "objects": tags,
            "people": {"count": 0},
            "quality": {
                "score": 0.85,
                "blur": "blur" in text,
                "lighting": "good",
                "composition": "good",
            },
            "colors": [],
            "ocr": [],
            "tags": tags,
        }
from typing import Dict, Any

from app.tools.vision_analysis_tool import VisionAnalysisTool
from app.tools.image_hash_tool import ImageHashTool


class ImageAnalysisAgent:
    def __init__(self):
        self.vision_tool = VisionAnalysisTool()
        self.hash_tool = ImageHashTool()

    def analyze_photo(self, photo: Dict[str, Any]) -> Dict[str, Any]:
        analysis = self.vision_tool.analyze(photo)

        image_hash = None
        local_path = photo.get("local_path")

        if local_path:
            image_hash = self.hash_tool.generate_hash(local_path)

        return {
            "analysis_json": analysis,
            "image_hash": image_hash,
            "status": "analyzed",
        }
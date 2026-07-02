from typing import Dict, Any
from app.tools.image_quality import ImageQualityTool

class QualityAgent:
    """
    Agent responsible for evaluating and filtering image files based on quality metrics.
    """
    def __init__(self):
        self.quality_tool = ImageQualityTool()

    def process_photo(self, photo_name: str, photo_id: str) -> Dict[str, Any]:
        """
        Runs quality evaluation on a photo.
        """
        # Call the ImageQualityTool
        result = self.quality_tool.evaluate(photo_name, photo_id)
        return result

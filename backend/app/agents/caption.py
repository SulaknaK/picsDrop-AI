from typing import Dict, Any
from app.tools.caption_generation import CaptionGenerationTool

class CaptionAgent:
    """
    Agent responsible for generating search tags, descriptions, and captions for photos.
    """
    def __init__(self):
        self.caption_tool = CaptionGenerationTool()

    def describe_photo(self, photo_name: str) -> Dict[str, Any]:
        """
        Generates caption and tags for a photo.
        """
        return self.caption_tool.generate(photo_name)

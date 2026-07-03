from typing import Dict, Any

from app.tools.caption_generation import CaptionGenerationTool


class CaptionAgent:
    """
    Reads captions/tags from analysis_json when available.
    Falls back to old CaptionGenerationTool if analysis_json is missing.
    """

    def __init__(self):
        self.caption_tool = CaptionGenerationTool()

    def describe_photo(self, photo: Dict[str, Any]) -> Dict[str, Any]:
        analysis = photo.get("analysis_json")

        if analysis:
            return {
                "caption": analysis.get("caption", ""),
                "tags": analysis.get("tags", []),
            }

        return self.caption_tool.generate(photo.get("name", ""))
from typing import Dict, Any

from app.tools.caption_generation import CaptionGenerationTool


class CaptionGeneratorAgent:
    """
    Agent responsible for exposing captions and tags from analysis_json.
    Future work: this agent can enhance captions into different styles.
    """

    def __init__(self):
        self.caption_tool = CaptionGenerationTool()

    def describe_photo(self, photo: Dict[str, Any]) -> Dict[str, Any]:
        analysis = photo.get("analysis_json") or {}

        if analysis:
            return {
                "caption": analysis.get("caption", ""),
                "tags": analysis.get("tags", []),
            }

        return self.caption_tool.generate(photo.get("name", ""))
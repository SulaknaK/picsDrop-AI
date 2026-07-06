from typing import Dict, Any, List
import os
import json
import logging

from google import genai

logger = logging.getLogger("ReelPlannerAgent")


class ReelPlannerAgent:
    """
    AI agent that creates a highlight reel plan from analyzed photos.

    This agent does not send images to Gemini again.
    It only sends lightweight text metadata from analysis_json.
    """

    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        self.client = genai.Client(api_key=api_key) if api_key else None
        self.model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    def plan_reel(self, collection: Dict[str, Any], max_photos: int = 15) -> Dict[str, Any]:
        photos = list(collection.get("photos", {}).values())

        if not photos:
            return self._fallback_plan(collection, [])

        selected_photos = self._select_best_photos(photos, max_photos)

        if not self.client:
            logger.warning("Gemini API key missing. Using fallback reel plan.")
            return self._fallback_plan(collection, selected_photos)

        prompt = self._build_prompt(collection, selected_photos)

        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
            )

            text = response.text.strip()
            return self._parse_response(text, selected_photos)

        except Exception as error:
            logger.exception("Reel planning failed: %s", error)
            return self._fallback_plan(collection, selected_photos)

    def _select_best_photos(self, photos: List[Dict[str, Any]], max_photos: int) -> List[Dict[str, Any]]:
        usable_photos = [
            photo for photo in photos
            if photo.get("analysis_json")
        ]

        usable_photos.sort(
            key=lambda p: p.get("quality_score", 0),
            reverse=True,
        )

        return usable_photos[:max_photos]

    def _build_prompt(self, collection: Dict[str, Any], photos: List[Dict[str, Any]]) -> str:
        photo_summaries = []

        for index, photo in enumerate(photos, start=1):
            analysis = photo.get("analysis_json") or {}

            photo_summaries.append({
                "photo_id": photo.get("id"),
                "file_name": photo.get("name"),
                "caption": photo.get("caption") or analysis.get("caption") or analysis.get("description", ""),
                "scene": analysis.get("scene", ""),
                "tags": analysis.get("tags", []),
                "objects": analysis.get("objects", []),
                "quality_score": photo.get("quality_score", 0),
            })

        skill_instructions = self._load_skill_instructions()

        return f"""
{skill_instructions}

Collection name:
{collection.get("name", "")}

Collection description:
{collection.get("description", "")}

Photo summaries:
{json.dumps(photo_summaries, indent=2)}

Return ONLY valid JSON using this exact structure:

{{
  "reel_title": "Short title for the reel",
  "reel_theme": "Overall emotional theme",
  "music_mood": "Suggested music mood",
  "estimated_duration_seconds": 30,
  "story_arc": [
    "opening",
    "middle",
    "ending"
  ],
  "selected_photos": [
    {{
      "photo_id": "photo id from input",
      "order": 1,
      "reason": "Why this photo belongs here",
      "overlay_text": "Short text to show on the reel",
      "duration_seconds": 3,
      "transition": "fade"
    }}
  ],
  "closing_caption": "Short closing line for the reel"
}}
"""

    def _load_skill_instructions(self) -> str:
        skill_path = os.path.join(
            os.path.dirname(__file__),
            "..",
            "..",
            "skills",
            "reel_planning",
            "instructions.md",
        )

        skill_path = os.path.abspath(skill_path)

        try:
            with open(skill_path, "r", encoding="utf-8") as file:
                return file.read()
        except FileNotFoundError:
            return """
You are the Reel Planning Skill for PicsDrop AI.
Create a short, emotional event highlight reel from photo metadata.
Choose the best photos, arrange them into a story, and suggest overlay text.
Do not invent details that are not present in the photo metadata.
"""

    def _parse_response(self, text: str, selected_photos: List[Dict[str, Any]]) -> Dict[str, Any]:
        try:
            cleaned = text.replace("```json", "").replace("```", "").strip()
            data = json.loads(cleaned)
            data["agent"] = "ReelPlannerAgent"
            return data

        except Exception:
            logger.warning("Could not parse Gemini reel JSON response.")

            return {
                "agent": "ReelPlannerAgent",
                "reel_title": "Event Highlights",
                "reel_theme": "Memorable moments from the event",
                "music_mood": "warm and uplifting",
                "estimated_duration_seconds": min(len(selected_photos) * 3, 45),
                "story_arc": ["opening moment", "main memories", "closing highlight"],
                "selected_photos": [
                    {
                        "photo_id": photo.get("id"),
                        "order": index + 1,
                        "reason": "Selected as a high-quality event memory.",
                        "overlay_text": photo.get("caption", "Memorable moment"),
                        "duration_seconds": 3,
                        "transition": "fade",
                    }
                    for index, photo in enumerate(selected_photos)
                ],
                "closing_caption": "A day to remember.",
            }

    def _fallback_plan(self, collection: Dict[str, Any], photos: List[Dict[str, Any]]) -> Dict[str, Any]:
        return {
            "agent": "ReelPlannerAgent",
            "reel_title": f"{collection.get('name', 'Event')} Highlights",
            "reel_theme": "Best moments from the photo collection",
            "music_mood": "warm and uplifting",
            "estimated_duration_seconds": min(len(photos) * 3, 45),
            "story_arc": ["opening", "celebration", "closing memory"],
            "selected_photos": [
                {
                    "photo_id": photo.get("id"),
                    "order": index + 1,
                    "reason": "Selected based on quality score and available analysis.",
                    "overlay_text": photo.get("caption", "Memorable moment"),
                    "duration_seconds": 3,
                    "transition": "fade",
                }
                for index, photo in enumerate(photos)
            ],
            "closing_caption": "A day to remember.",
        }
import json
import os
from pathlib import Path
from typing import Any, Dict

from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()


class GeminiVisionClient:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY is missing from .env")

        self.client = genai.Client(api_key=api_key)
        self.model = "gemini-2.5-flash"

    def analyze_local_image(self, image_path: str) -> Dict[str, Any]:
        path = Path(image_path)

        if not path.exists():
            raise FileNotFoundError(f"Image not found: {image_path}")

        # Upload the file using the new SDK
        uploaded_file = self.client.files.upload(file=str(path))

        prompt = """
Analyze this image and return ONLY valid JSON.

Use this exact structure:
{
  "description": "",
  "caption": "",
  "scene": "",
  "objects": [],
  "people": {
    "count": 0,
    "faces_visible": true,
    "looking_at_camera": true,
    "eyes_open": true,
    "happy": true,
    "smiling": true,
    "group_photo": true
    "portrait": false
  },
  "info": {
    "photo_type": "candid",
    "indoor": false,
    "outdoor": false
  }
  "quality": {
    "blur": false,
    "lighting": "good",
    "composition": "good",
    "exposure": "good",
    "noise": "low",
    "quality_reason": "Sharp image with balanced lighting."
  },
  "colors": [],
  "ocr": [],
  "tags": []
}

Rules:
- score must be between 0 and 1
- caption should be short, fun and social-media friendly.
- people.count should be the estimated number of visible people.
- If no people are present, people.count must be 0 and all other people fields must be false.
- blur must be true or false
- looking_at_camera should be true only if the main visible people are looking toward the camera.
- smiling should be true only if visible people appear to be smiling.
- group_photo should be true for group photos with 3 or more people.
- portrait should be true for close-up/person-focused portraits.
- event.photo_type should be one of: group, couple, portrait, candid, selfie, landscape, food, stage, decoration, ceremony, dance_floor, travel, general.
- indoor and outdoor must be true/false
- lighting should be one of: good, dark, overexposed
- composition should be one of: good, average, poor
- exposure must be one of: good, underexposed, overexposed.
- faces_visible must be true if clear faces are visible, otherwise false.
- noise must be one of: low, medium, high.
- quality_reason should briefly explain the quality decision.
- colors should list 2-5 dominant colors.
- tags should include 3-8 useful search tags.
- return JSON only
"""

        response = self.client.models.generate_content(
            model=self.model,
            contents=[prompt, uploaded_file],
        )
        text = response.text.strip()

        if text.startswith("```json"):
            text = text.replace("```json", "").replace("```", "").strip()
        elif text.startswith("```"):
            text = text.replace("```", "").strip()

        return json.loads(text)

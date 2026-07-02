from typing import Dict, List, Any

class CaptionGenerationTool:
    """
    Generates semantic descriptions, captions, and search tags for images.
    """
    def __init__(self):
        # Database of keyword triggers for mock captions/tags
        self.trigger_database = {
            "sunset": {
                "caption": "A stunning, vibrant sunset casting warm orange and pink hues across the sky.",
                "tags": ["sunset", "sky", "dusk", "landscape", "nature", "orange", "scenic"]
            },
            "beach": {
                "caption": "Calm ocean waves washing onto a pristine sandy beach under a clear blue sky.",
                "tags": ["beach", "ocean", "sea", "sand", "summer", "nature", "coast"]
            },
            "food": {
                "caption": "A beautifully plated, delicious gourmet meal featuring fresh ingredients.",
                "tags": ["food", "dinner", "delicious", "restaurant", "culinary", "lunch"]
            },
            "coffee": {
                "caption": "A freshly brewed cup of hot coffee with intricate latte art on a wooden table.",
                "tags": ["coffee", "beverage", "cafe", "latte", "breakfast", "morning"]
            },
            "mountain": {
                "caption": "Majestic snow-capped mountain peaks rising above a lush green pine forest.",
                "tags": ["mountain", "hiking", "forest", "nature", "adventure", "landscape", "snow"]
            },
            "city": {
                "caption": "A bustling city street flanked by towering skyscrapers under a twilight sky.",
                "tags": ["city", "urban", "street", "architecture", "skyline", "traffic", "building"]
            },
            "friend": {
                "caption": "A candid shot of a happy group of friends laughing and enjoying their time together.",
                "tags": ["people", "person", "friends", "gathering", "smile", "social", "party"]
            },
            "party": {
                "caption": "Lively party atmosphere with people celebrating, warm lighting, and festive decorations.",
                "tags": ["party", "celebration", "gathering", "social", "event", "people"]
            },
            "dog": {
                "caption": "A cheerful dog sitting in the park with its tongue out, looking directly at the camera.",
                "tags": ["dog", "pet", "animal", "nature", "cute", "park"]
            },
            "cat": {
                "caption": "A cute cat curled up on a soft blanket, taking a peaceful afternoon nap.",
                "tags": ["cat", "pet", "animal", "cute", "furry", "indoor"]
            }
        }

    def generate(self, photo_name: str) -> Dict[str, Any]:
        """
        Scans photo_name for trigger words and returns matching caption/tags.
        Falls back to a default memory caption if no keywords match.
        """
        name_lower = photo_name.lower()
        
        # Look for keyword match
        for key, value in self.trigger_database.items():
            if key in name_lower:
                return {
                    "caption": value["caption"],
                    "tags": value["tags"]
                }
        
        # Default fallback
        return {
            "caption": f"A beautiful photograph of {photo_name.split('.')[0].replace('_', ' ').replace('-', ' ')}.",
            "tags": ["photo", "memory", "event", "general"]
        }
ClassInstance = CaptionGenerationTool()

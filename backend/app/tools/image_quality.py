from typing import Dict, Any, List

class ImageQualityTool:
    """
    Analyzes visual quality: sharpness, lighting, composition.
    Returns scores and recommendations.
    """
    def __init__(self):
        pass

    def evaluate(self, photo_name: str, photo_id: str) -> Dict[str, Any]:
        """
        Mock quality evaluation. Returns deterministic values based on photo_name and photo_id.
        """
        # Lower case for checking key words
        name_lower = photo_name.lower()
        
        # Default scores
        sharpness = 0.85
        composition = 0.82
        lighting = 0.80
        issues = []

        # Simulate low quality for specific names to make the demo realistic
        if any(w in name_lower for w in ["blur", "shaky", "outfocus"]):
            sharpness = 0.35
            issues.append("Motion blur or out of focus")
        if any(w in name_lower for w in ["dark", "night", "shadow", "underexposed"]):
            lighting = 0.40
            issues.append("Underexposed image")
        if any(w in name_lower for w in ["bright", "sun", "glare", "overexposed"]):
            lighting = 0.45
            issues.append("Overexposed areas")
        if any(w in name_lower for w in ["bad", "crop", "tilt"]):
            composition = 0.42
            issues.append("Tilted horizon or poor composition framing")

        # Let's add some pseudo-randomness using photo_id hash
        id_hash = sum(ord(c) for c in photo_id)
        if not issues:
            # Shift scores slightly
            sharpness = round(min(1.0, max(0.5, sharpness + (id_hash % 20 - 10) / 100.0)), 2)
            composition = round(min(1.0, max(0.5, composition + (id_hash % 15 - 7) / 100.0)), 2)
            lighting = round(min(1.0, max(0.5, lighting + (id_hash % 25 - 12) / 100.0)), 2)
            
            # 10% chance of a minor issue
            if id_hash % 10 == 0:
                issues.append("Slight lens flare detected")

        # Overall score is simple average
        score = round((sharpness + composition + lighting) / 3.0, 2)
        
        return {
            "quality_score": score,
            "quality_details": {
                "sharpness": sharpness,
                "composition": composition,
                "lighting": lighting,
                "issues": issues
            }
        }

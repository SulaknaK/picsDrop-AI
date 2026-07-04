from typing import Dict, Any

from app.tools.image_quality import ImageQualityTool


class QualityCheckerAgent:
    def __init__(self):
        self.quality_tool = ImageQualityTool()

    def process_photo(self, photo: Dict[str, Any]) -> Dict[str, Any]:
        analysis = photo.get("analysis_json")

        if not analysis:
            return self.quality_tool.evaluate(photo.get("name", ""), photo.get("id", ""))

        quality = analysis.get("quality", {})

        blur = bool(quality.get("blur", False))
        lighting_label = str(quality.get("lighting", "good")).lower()
        composition_label = str(quality.get("composition", "good")).lower()
        exposure_label = str(quality.get("exposure", "good")).lower()
        noise_label = str(quality.get("noise", "low")).lower()

        score = 1.0
        issues = []

        if blur:
            score -= 0.40
            issues.append("Image appears blurry or out of focus")

        if lighting_label == "dark":
            score -= 0.20
            issues.append("Image is too dark")

        if lighting_label == "overexposed":
            score -= 0.15
            issues.append("Lighting appears overexposed")

        if composition_label == "average":
            score -= 0.10

        if composition_label == "poor":
            score -= 0.20
            issues.append("Composition could be improved")

        if exposure_label == "underexposed":
            score -= 0.15
            issues.append("Image is underexposed")

        if exposure_label == "overexposed":
            score -= 0.15
            issues.append("Image is overexposed")

        if noise_label == "medium":
            score -= 0.05

        if noise_label == "high":
            score -= 0.10
            issues.append("Image has noticeable noise/grain")

        score = max(0.0, min(1.0, round(score, 2)))

        sharpness = 0.35 if blur else 0.9

        if lighting_label == "dark":
            lighting = 0.45
        elif lighting_label == "overexposed":
            lighting = 0.55
        else:
            lighting = 0.9

        if composition_label == "poor":
            composition = 0.45
        elif composition_label == "average":
            composition = 0.7
        else:
            composition = 0.9

        return {
            "quality_score": score,
            "quality_details": {
                "sharpness": sharpness,
                "composition": composition,
                "lighting": lighting,
                "issues": issues,
            },
        }
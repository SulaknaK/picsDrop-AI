from typing import Dict, Any
import logging

from app.models.database import db
from app.tools.photo_source import PhotoSourceTool
from app.agents.image_analysis import ImageAnalysisAgent
from app.agents.quality_checker import QualityCheckerAgent
from app.agents.duplicate_finder import DuplicateFinderAgent
from app.agents.album_creator import AlbumCreatorAgent
from app.agents.caption_generator import CaptionGeneratorAgent

logger = logging.getLogger("coordinator")


class CoordinatorAgent:
    """
    Main orchestrator that coordinates analysis using sub-agents and tools.
    """

    def __init__(self):
        self.photo_source_tool = PhotoSourceTool()
        self.image_analysis_agent = ImageAnalysisAgent()
        self.quality_agent = QualityCheckerAgent()
        self.caption_agent = CaptionGeneratorAgent()
        self.duplicate_agent = DuplicateFinderAgent()
        self.album_agent = AlbumCreatorAgent()

    def analyze_collection(self, collection_id: str) -> bool:
        collection = db.get_collection(collection_id)

        if not collection:
            return False

        collection["logs"] = []

        def log_step(agent: str, message: str, status: str = "success"):
            collection["logs"].append(
                {
                    "agent": agent,
                    "message": message,
                    "status": status,
                }
            )

        try:
            db.update_collection_status(collection_id, "analyzing")
            log_step(
                "CoordinatorAgent",
                f"Starting analysis pipeline for collection '{collection['name']}'.",
                "running",
            )

            photos_dict = collection.get("photos", {})

            if not photos_dict:
                log_step("CoordinatorAgent", "No photos found in collection to analyze.", "warning")
                db.update_collection_status(collection_id, "completed")
                return True

            photo_list = list(photos_dict.values())
            total = len(photo_list)

            log_step("PhotoSourceTool", f"Validating metadata for {total} photo(s)...", "running")
            for photo in photo_list:
                src_meta = self.photo_source_tool.process(photo)
                photo.update(src_meta)
            log_step("PhotoSourceTool", "Metadata validation complete.", "success")

            log_step(
                "ImageAnalysisAgent",
                "Creating structured analysis_json for each image...",
                "running",
            )
            for photo in photo_list:
                analysis_meta = self.image_analysis_agent.analyze_photo(photo)
                photo.update(analysis_meta)
            log_step("ImageAnalysisAgent", "Image analysis JSON created.", "success")

            log_step("QualityAgent", "Reading quality details from analysis_json...", "running")
            for photo in photo_list:
                q_meta = self.quality_agent.process_photo(photo)
                photo.update(q_meta)
            log_step("QualityAgent", "Quality grading complete.", "success")

            log_step("CaptionAgent", "Reading captions and tags from analysis_json...", "running")
            for photo in photo_list:
                cap_meta = self.caption_agent.describe_photo(photo)
                photo.update(cap_meta)
            log_step("CaptionAgent", "Caption and tag generation complete.", "success")

            updated_photos = list(collection["photos"].values())

            log_step("DuplicateAgent", "Finding duplicate or near-duplicate photos...", "running")
            dup_groups = self.duplicate_agent.find_duplicates(updated_photos)
            db.set_duplicate_groups(collection_id, dup_groups)
            log_step(
                "DuplicateAgent",
                f"Deduplication complete. Found {len(dup_groups)} duplicate group(s).",
                "success",
            )

            log_step("AlbumAgent", "Creating smart albums from analysis_json scene/tags...", "running")
            albums = self.album_agent.organize_collection(updated_photos)
            db.set_albums(collection_id, albums)
            log_step(
                "AlbumAgent",
                f"Smart albums created: {len(albums)} category folder(s) generated.",
                "success",
            )

            db.update_collection_status(collection_id, "completed")
            log_step("CoordinatorAgent", "Analysis workflow finished. Collection results compiled.", "completed")
            return True

        except Exception as e:
            logger.error(f"Analysis failed for collection {collection_id}: {str(e)}")
            db.update_collection_status(collection_id, "failed")
            log_step("CoordinatorAgent", f"Analysis failed: {str(e)}", "failed")
            return False

    def ask_question(self, collection_id: str, question: str) -> Dict[str, Any]:
        collection = db.get_collection(collection_id)

        if not collection:
            return {"answer": "Collection not found.", "sources": []}

        photos = list(collection.get("photos", {}).values())
        q = question.lower()

        matches = []

        for photo in photos:
            analysis = photo.get("analysis_json") or {}

            searchable_text = " ".join([
                photo.get("name", ""),
                photo.get("caption", ""),
                analysis.get("description", ""),
                analysis.get("caption", ""),
                analysis.get("scene", ""),
                " ".join(analysis.get("objects", [])),
                " ".join(analysis.get("tags", [])),
                str(analysis.get("event", {}).get("photo_type", "")),
                str(analysis.get("quality", {}).get("quality_reason", "")),
            ]).lower()

            quality = analysis.get("quality", {})
            people = analysis.get("people", {})
            event = analysis.get("event", {})

            is_match = False

            if "blurry" in q or "blur" in q:
                is_match = quality.get("blur") is True

            elif "dark" in q:
                is_match = quality.get("lighting") == "dark" or quality.get("exposure") == "underexposed"

            elif "best" in q or "high quality" in q:
                is_match = photo.get("quality_score", 0) >= 0.85

            elif "people" in q or "person" in q:
                is_match = people.get("count", 0) > 0

            elif "group" in q:
                is_match = people.get("group_photo") is True or event.get("photo_type") == "group"

            elif "smiling" in q or "smile" in q:
                is_match = people.get("smiling") is True

            elif "portrait" in q:
                is_match = people.get("portrait") is True or event.get("photo_type") == "portrait"

            elif "indoor" in q:
                is_match = event.get("indoor") is True

            elif "outdoor" in q:
                is_match = event.get("outdoor") is True

            else:
                words = [word for word in q.split() if len(word) > 2]
                is_match = any(word in searchable_text for word in words)

            if is_match:
                matches.append(photo)

        if matches:
            answer = f"I found {len(matches)} photo(s) matching your question:\n"
            for photo in matches[:8]:
                answer += f"- {photo.get('name')}: {photo.get('caption', '')}\n"
        else:
            answer = f"I couldn't find any photos matching: {question}"

        return {
            "answer": answer,
            "sources": [
                {
                    "id": photo["id"],
                    "name": photo["name"],
                    "url": photo["url"],
                    "caption": photo.get("caption", ""),
                }
                for photo in matches[:8]
            ],
        }
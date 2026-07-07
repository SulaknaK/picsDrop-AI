from typing import Dict, Any
import logging

from app.models.database import db
from app.tools.photo_source import PhotoSourceTool
from app.agents.image_analysis import ImageAnalysisAgent
from app.agents.quality_checker import QualityCheckerAgent
from app.agents.duplicate_finder import DuplicateFinderAgent
from app.agents.album_creator import AlbumCreatorAgent
from app.agents.caption_generator import CaptionGeneratorAgent
from app.agents.reel_planner import ReelPlannerAgent

logger = logging.getLogger("Coordinator")


class CoordinatorAgent:
    """
    Coordinator Agent.

    Coordinates the full photo indexing pipeline and handles
    knowledge retrieval for user questions using stored analysis_json.
    """

    def __init__(self):
        self.photo_source_tool = PhotoSourceTool()
        self.image_analysis_agent = ImageAnalysisAgent()
        self.quality_agent = QualityCheckerAgent()
        self.caption_agent = CaptionGeneratorAgent()
        self.duplicate_agent = DuplicateFinderAgent()
        self.album_agent = AlbumCreatorAgent()
        self.reel_planner_agent = ReelPlannerAgent()

    def analyze_collection(self, collection_id: str) -> bool:
        collection = db.get_collection(collection_id)

        if not collection:
            return False

        collection["logs"] = []

        def log_step(agent: str, message: str, status: str = "success"):
            collection["logs"].append({
                "agent": agent,
                "message": message,
                "status": status,
            })

        try:
            db.update_collection_status(collection_id, "analyzing")

            log_step(
                "Coordinator Agent",
                f"Starting analysis pipeline for collection '{collection['name']}'.",
                "running",
            )

            photos_dict = collection.get("photos", {})

            if not photos_dict:
                log_step(
                    "Coordinator Agent",
                    "No photos found in collection to analyze.",
                    "warning",
                )
                db.update_collection_status(collection_id, "completed")
                return True

            photo_list = list(photos_dict.values())
            total = len(photo_list)

            log_step(
                "Photo Source Tool",
                f"Validating metadata for {total} photo(s)...",
                "running",
            )
            for photo in photo_list:
                src_meta = self.photo_source_tool.process(photo)
                photo.update(src_meta)
            log_step("Photo Source Tool", "Metadata validation complete.", "success")

            log_step(
                "Vision Analysis Agent",
                "Analyzing images with Gemini Vision and creating analysis_json...",
                "running",
            )
            for photo in photo_list:
                analysis_meta = self.image_analysis_agent.analyze_photo(photo)
                photo.update(analysis_meta)
            log_step(
                "Vision Analysis Agent",
                "Structured image analysis completed.",
                "success",
            )

            log_step(
                "Quality Scoring Agent",
                "Calculating quality scores from analysis_json...",
                "running",
            )
            for photo in photo_list:
                q_meta = self.quality_agent.process_photo(photo)
                photo.update(q_meta)
            log_step("Quality Scoring Agent", "Quality scoring complete.", "success")

            log_step(
                "Caption Agent",
                "Extracting captions and tags from analysis_json...",
                "running",
            )
            for photo in photo_list:
                cap_meta = self.caption_agent.describe_photo(photo)
                photo.update(cap_meta)
            log_step("Caption Agent", "Caption and tag extraction complete.", "success")

            updated_photos = list(collection["photos"].values())

            log_step(
                "Duplicate Detection Agent",
                "Finding duplicate or near-duplicate photos using image hashes...",
                "running",
            )
            dup_groups = self.duplicate_agent.find_duplicates(updated_photos)
            db.set_duplicate_groups(collection_id, dup_groups)
            log_step(
                "Duplicate Detection Agent",
                f"Duplicate detection complete. Found {len(dup_groups)} duplicate group(s).",
                "success",
            )

            log_step(
                "Smart Album Agent",
                "Creating smart albums from scene, tag, and event metadata...",
                "running",
            )
            albums = self.album_agent.organize_collection(updated_photos)
            db.set_albums(collection_id, albums)
            log_step(
                "Smart Album Agent",
                f"Smart album creation complete. Generated {len(albums)} album(s).",
                "success",
            )

            log_step(
                "Reel Planner Agent",
                "Creating AI highlight reel plan from analyzed photo descriptions...",
                "running",
            )

            reel_plan = self.reel_planner_agent.plan_reel(collection)
            db.set_reel_plan(collection_id, reel_plan)

            log_step(
                "Reel Planner Agent",
                "AI highlight reel plan created.",
                "success",
            )

            db.update_collection_status(collection_id, "completed")
            log_step(
                "Coordinator Agent",
                "Analysis workflow finished. Collection results compiled.",
                "completed",
            )
            return True

        except Exception as e:
            logger.error(f"Analysis failed for collection {collection_id}: {str(e)}")
            db.update_collection_status(collection_id, "failed")
            log_step("Coordinator Agent", f"Analysis failed: {str(e)}", "failed")
            return False

    def ask_question(self, collection_id: str, question: str) -> Dict[str, Any]:
        """
        Knowledge retrieval behavior inside the Coordinator Agent.

        Searches stored photo metadata and analysis_json to answer natural
        language questions without calling Gemini again.
        """
        collection = db.get_collection(collection_id)

        if not collection:
            return {"answer": "Collection not found.", "sources": []}

        photos = list(collection.get("photos", {}).values())
        q = question.lower()
        matches = []

        for photo in photos:
            analysis = photo.get("analysis_json") or {}
            quality = analysis.get("quality", {})
            people = analysis.get("people", {})
            info = analysis.get("info", {})

            searchable_text = " ".join([
                photo.get("name", ""),
                photo.get("caption", ""),
                analysis.get("description", ""),
                analysis.get("caption", ""),
                analysis.get("scene", ""),
                " ".join(analysis.get("objects", [])),
                " ".join(analysis.get("tags", [])),
                str(info.get("photo_type", "")),
                str(quality.get("quality_reason", "")),
            ]).lower()

            is_match = False

            if "blurry" in q or "blur" in q:
                is_match = quality.get("blur") is True

            elif "dark" in q:
                is_match = (
                    quality.get("lighting") == "dark"
                    or quality.get("exposure") == "underexposed"
                )

            elif "best" in q or "high quality" in q:
                is_match = photo.get("quality_score", 0) >= 0.85

            elif "people" in q or "person" in q:
                is_match = people.get("count", 0) > 0

            elif "group" in q:
                is_match = (
                    people.get("group_photo") is True
                    or event.get("photo_type") == "group"
                )

            elif "smiling" in q or "smile" in q:
                is_match = people.get("smiling") is True

            elif "portrait" in q:
                is_match = (
                    people.get("portrait") is True
                    or event.get("photo_type") == "portrait"
                )

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
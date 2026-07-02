from typing import Dict, Any, List
from app.models.database import db
from app.tools.photo_source import PhotoSourceTool
from app.agents.quality import QualityAgent
from app.agents.duplicate import DuplicateAgent
from app.agents.album import AlbumAgent
from app.agents.caption import CaptionAgent
import logging

logger = logging.getLogger("coordinator")

class CoordinatorAgent:
    """
    Main orchestrator that coordinates analysis using sub-agents and tools.
    Also handles chatbot QA queries by matching natural language to index.
    """
    def __init__(self):
        self.photo_source_tool = PhotoSourceTool()
        self.quality_agent = QualityAgent()
        self.caption_agent = CaptionAgent()
        self.duplicate_agent = DuplicateAgent()
        self.album_agent = AlbumAgent()

    def analyze_collection(self, collection_id: str) -> bool:
        """
        Synchronously runs the analysis workflow.
        Appends pipeline logs to the database so the frontend can display live pipeline status.
        """
        collection = db.get_collection(collection_id)
        if not collection:
            return False

        # Initialize workflow logs
        collection["logs"] = []
        
        def log_step(agent: str, message: str, status: str = "success"):
            collection["logs"].append({
                "agent": agent,
                "message": message,
                "status": status
            })

        try:
            db.update_collection_status(collection_id, "analyzing")
            log_step("CoordinatorAgent", f"Starting analysis pipeline for collection '{collection['name']}'.", "running")

            photos_dict = collection.get("photos", {})
            if not photos_dict:
                log_step("CoordinatorAgent", "No photos found in collection to analyze.", "warning")
                db.update_collection_status(collection_id, "completed")
                return True

            photo_list = list(photos_dict.values())
            total = len(photo_list)

            # Step 1: Source Validation
            log_step("PhotoSourceTool", f"Validating and fetching metadata for {total} photo(s)...", "running")
            for p in photo_list:
                src_meta = self.photo_source_tool.process(p)
                p.update(src_meta)
            log_step("PhotoSourceTool", "Metadata validation complete.", "success")

            # Step 2: Quality Inspection
            log_step("QualityAgent", "Assessing visual quality metrics (sharpness, lighting, composition)...", "running")
            for p in photo_list:
                q_meta = self.quality_agent.process_photo(p["name"], p["id"])
                p.update(q_meta)
            log_step("QualityAgent", "Quality grading complete.", "success")

            # Step 3: Caption & Tag Generation
            log_step("CaptionAgent", "Generating descriptive captions and search keywords...", "running")
            for p in photo_list:
                cap_meta = self.caption_agent.describe_photo(p["name"])
                p.update(cap_meta)
            log_step("CaptionAgent", "Image captioning complete.", "success")

            # Step 4: Duplicate Grouping
            log_step("DuplicateAgent", "Analyzing visual hashes to locate duplicate/near-duplicate photos...", "running")
            # Need to get updated photos with the details we just populated
            updated_photos = list(collection["photos"].values())
            dup_groups = self.duplicate_agent.find_duplicates(updated_photos)
            db.set_duplicate_groups(collection_id, dup_groups)
            log_step("DuplicateAgent", f"Deduplication complete. Found {len(dup_groups)} duplicate group(s).", "success")

            # Step 5: Smart Album Clustering
            log_step("AlbumAgent", "Clustering memories into smart themed albums...", "running")
            albums = self.album_agent.organize_collection(updated_photos)
            db.set_albums(collection_id, albums)
            log_step("AlbumAgent", f"Smart albums created: {len(albums)} category folder(s) generated.", "success")

            # Finalize
            db.update_collection_status(collection_id, "completed")
            log_step("CoordinatorAgent", "Analysis workflow finished. Collection results compiled.", "completed")
            return True

        except Exception as e:
            logger.error(f"Analysis failed for collection {collection_id}: {str(e)}")
            db.update_collection_status(collection_id, "failed")
            log_step("CoordinatorAgent", f"Analysis failed: {str(e)}", "failed")
            return False

    def ask_question(self, collection_id: str, question: str) -> Dict[str, Any]:
        """
        Parses questions and queries the in-memory metadata.
        """
        collection = db.get_collection(collection_id)
        if not collection:
            return {"answer": "Collection not found.", "sources": []}

        q_lower = question.lower()
        photos = list(collection.get("photos", {}).values())
        albums = collection.get("albums", [])
        dup_groups = collection.get("duplicate_groups", [])

        # Match queries
        sources = []
        answer = ""

        # Check for count queries
        if "how many" in q_lower or "count" in q_lower:
            if "album" in q_lower:
                answer = f"There are {len(albums)} smart albums in this collection: " + ", ".join([a['title'] for a in albums]) + "."
            elif "duplicate" in q_lower or "near-duplicate" in q_lower:
                num_dups = sum(len(g) for g in dup_groups)
                answer = f"I found {num_dups} duplicate photos clustered in {len(dup_groups)} distinct groups."
            elif "blur" in q_lower or "poor quality" in q_lower or "bad" in q_lower:
                blurry = [p for p in photos if p.get("quality_score", 1.0) < 0.5]
                answer = f"There are {len(blurry)} photos identified with visual issues."
                sources = blurry
            else:
                answer = f"This collection contains a total of {len(photos)} photos."
        
        # Check for quality/blurry queries
        elif "blur" in q_lower or "quality" in q_lower or "bad" in q_lower:
            blurry = [p for p in photos if p.get("quality_score", 1.0) < 0.5]
            if blurry:
                answer = f"Yes, I detected {len(blurry)} lower-quality photos:\n" + \
                         "\n".join([f"- **{p['name']}** (Quality: {p['quality_score']}): {', '.join(p['quality_details']['issues'])}" for p in blurry])
                sources = blurry
            else:
                answer = "Great news! All photos in this collection meet the high quality threshold (score >= 0.5)."

        # Check for duplicates queries
        elif "duplicate" in q_lower or "same" in q_lower or "repeat" in q_lower:
            if dup_groups:
                answer = f"I detected {len(dup_groups)} duplicate clusters:\n"
                for idx, group in enumerate(dup_groups):
                    group_photos = [collection["photos"][pid]["name"] for pid in group if pid in collection["photos"]]
                    answer += f"- Group {idx+1}: {', '.join(group_photos)}\n"
                    # Add to sources
                    for pid in group:
                        if pid in collection["photos"]:
                            sources.append(collection["photos"][pid])
            else:
                answer = "No visual duplicates were detected in this collection."

        # Check for album/theme queries
        elif "album" in q_lower or "category" in q_lower or "folder" in q_lower:
            if albums:
                answer = "I have automatically generated the following smart albums for you:\n"
                for alb in albums:
                    answer += f"- **{alb['title']}**: {alb['description']} (contains {len(alb['photo_ids'])} photos)\n"
            else:
                answer = "No smart albums have been created yet. Please make sure to run /analyze first."

        # Search matching photos by tags / captions / names
        else:
            matching_photos = []
            for p in photos:
                tags = [t.lower() for t in p.get("tags", [])]
                caption = p.get("caption", "").lower()
                name = p["name"].lower()
                
                # Check for query words in tags, caption or filename
                words = [w for w in q_lower.split() if len(w) > 3] # filter short words
                if not words:
                    words = [q_lower]
                
                match = False
                for w in words:
                    if w in name or w in caption or any(w in t for t in tags):
                        match = True
                        break
                
                if match:
                    matching_photos.append(p)
            
            if matching_photos:
                answer = f"I found {len(matching_photos)} photos related to your query:\n"
                for p in matching_photos:
                    answer += f"- **{p['name']}**: \"{p['caption']}\" (Tags: {', '.join(p['tags'])})\n"
                sources = matching_photos
            else:
                answer = f"I couldn't find any photos directly matching \"{question}\" in the captions or tags. Could you try a different term (e.g., sunset, beach, food, people)?"

        return {
            "answer": answer,
            "sources": [{"id": p["id"], "name": p["name"], "url": p["url"], "caption": p.get("caption", "")} for p in sources]
        }

from typing import List, Dict, Any
from app.tools.duplicate_detection import DuplicateDetectionTool

class DuplicateAgent:
    """
    Agent responsible for finding visual duplicates or near-duplicates in a collection.
    """
    def __init__(self):
        self.duplicate_tool = DuplicateDetectionTool()

    def find_duplicates(self, photos: List[Dict[str, Any]]) -> List[List[str]]:
        """
        Processes a list of photos and returns duplicate groups.
        Each group is a list of photo IDs.
        """
        return self.duplicate_tool.detect(photos)

from typing import List, Dict, Any
from app.tools.album_creation import AlbumCreationTool

class AlbumAgent:
    """
    Agent responsible for organizing photos in a collection into logical albums (events, themes).
    """
    def __init__(self):
        self.album_tool = AlbumCreationTool()

    def organize_collection(self, photos: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Organizes the provided photos into albums.
        """
        return self.album_tool.create_albums(photos)

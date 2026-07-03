from pathlib import Path
import imagehash
from PIL import Image


class ImageHashTool:

    def generate_hash(self, image_path: str) -> str:
        """
        Generate a perceptual hash (pHash) for an image.
        Returns a hexadecimal string.
        """

        path = Path(image_path)

        if not path.exists():
            return None

        image = Image.open(path)

        return str(imagehash.phash(image))

    def compare_hashes(self, hash1: str, hash2: str) -> int:
        """
        Returns the Hamming distance between two hashes.
        Smaller = more similar.
        0 means identical.
        """

        if not hash1 or not hash2:
            return 999

        return imagehash.hex_to_hash(hash1) - imagehash.hex_to_hash(hash2)
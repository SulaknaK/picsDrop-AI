import time
import io
from fastapi.testclient import TestClient
from app.main import app
from app.models.database import db

client = TestClient(app)

def test_picsdrop_ai_pipeline():
    print("\n--- Starting PicsDrop AI Pipeline Tests ---")
    
    # 1. Create Collection
    print("\nStep 1: Creating a collection...")
    response = client.post("/collections", json={
        "name": "Test Sunset & Beach",
        "description": "Integration test collection"
      })
    assert response.status_code == 201, f"Failed: {response.text}"
    col_data = response.json()
    assert "id" in col_data
    assert col_data["name"] == "Test Sunset & Beach"
    assert col_data["status"] == "idle"
    col_id = col_data["id"]
    print(f"Success: Collection created with ID {col_id}")

    # 2. Register Remote URLs
    print("\nStep 2: Registering remote image URLs...")
    urls = [
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600#/sunset.jpg",
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600#/sunset_dup.jpg"
    ]
    response = client.post(f"/collections/{col_id}/photos/register", json={
        "urls": urls
    })
    assert response.status_code == 200, f"Failed: {response.text}"
    registered_photos = response.json()
    assert len(registered_photos) == 2
    assert registered_photos[0]["status"] == "registered"
    assert registered_photos[0]["name"] == "sunset.jpg"
    print("Success: Registered 2 remote image URLs successfully.")

    # 3. Simulate Photo Upload
    print("\nStep 3: Uploading photo files directly...")
    mock_file1 = (io.BytesIO(b"dummy image data 1"), "beach_paradise.jpg", "image/jpeg")
    mock_file2 = (io.BytesIO(b"dummy image data 2"), "beach_blurry.jpg", "image/jpeg")
    
    response = client.post(
        f"/collections/{col_id}/photos/upload",
        files=[("files", mock_file1), ("files", mock_file2)]
    )
    assert response.status_code == 200, f"Failed: {response.text}"
    uploaded_photos = response.json()
    assert len(uploaded_photos) == 2
    assert uploaded_photos[0]["name"] == "beach_paradise.jpg"
    assert uploaded_photos[1]["name"] == "beach_blurry.jpg"
    print("Success: Uploaded 2 mock files successfully.")

    # 4. Trigger Analysis
    print("\nStep 4: Triggering Agentic analysis pipeline...")
    response = client.post(f"/collections/{col_id}/analyze")
    assert response.status_code == 200, f"Failed: {response.text}"
    analysis_data = response.json()
    assert analysis_data["status"] == "analyzing"
    print("Success: Analysis pipeline triggered.")

    # 5. Poll Results (Since it runs in BackgroundTasks, let's wait a moment and poll)
    print("\nStep 5: Polling results and agent logs...")
    completed = False
    for attempt in range(15):
        time.sleep(0.5)
        response = client.get(f"/collections/{col_id}/results")
        assert response.status_code == 200, f"Failed: {response.text}"
        results = response.json()
        
        print(f"  Attempt {attempt + 1} Status: {results['status']}")
        if results["status"] == "completed":
            completed = True
            
            # Print execution logs from the agents
            print("\n  --- Pipeline Agent Log Trace ---")
            for log in results.get("logs", []):
                print(f"  [{log['agent']}] {log['message']} ({log['status']})")
            print("  -------------------------------\n")
            
            # Basic validation
            assert len(results["photos"]) == 4
            assert len(results["duplicate_groups"]) == 1  # sunset.jpg and sunset_dup.jpg should be duplicates
            assert len(results["albums"]) > 0  # Should group some albums (e.g. Scenic Nature, Ocean Breeze)
            
            # Check Quality Agent evaluated a blurry photo
            blurry = next(p for p in results["photos"] if p["name"] == "beach_blurry.jpg")
            assert blurry["quality_score"] < 0.5
            assert "Motion blur" in blurry["quality_details"]["issues"][0]
            
            # Check Caption Agent captioned sunset photo
            sunset = next(p for p in results["photos"] if p["name"] == "sunset.jpg")
            assert "sunset" in sunset["tags"]
            assert "sunset" in sunset["caption"].lower()
            
            break
            
    assert completed, "Analysis pipeline failed to complete in time."
    print("Success: Pipeline indexing validated successfully.")

    # 6. Ask Question Q&A Chatbot Test
    print("\nStep 6: Testing Q&A Chatbot...")
    
    # Test 1: Duplicates
    response = client.post(f"/collections/{col_id}/ask", json={
        "question": "Show me duplicate photos"
    })
    assert response.status_code == 200
    answer_data = response.json()
    assert "duplicate" in answer_data["answer"].lower()
    assert len(answer_data["sources"]) == 2  # sunset.jpg and sunset_dup.jpg
    print(f"  Q: Show me duplicate photos")
    print(f"  A: {answer_data['answer']}")
    
    # Test 2: Blurry
    response = client.post(f"/collections/{col_id}/ask", json={
        "question": "Which photos are blurry or poor quality?"
    })
    assert response.status_code == 200
    answer_data = response.json()
    assert "beach_blurry.jpg" in answer_data["answer"]
    print(f"  Q: Which photos are blurry?")
    print(f"  A: {answer_data['answer']}")
    
    # Test 3: Beach search
    response = client.post(f"/collections/{col_id}/ask", json={
        "question": "Find photos from the beach"
    })
    assert response.status_code == 200
    answer_data = response.json()
    assert "beach_paradise.jpg" in answer_data["answer"]
    print(f"  Q: Find photos from the beach")
    print(f"  A: {answer_data['answer']}")

    print("\n--- All PicsDrop AI Tests Passed Successfully! ---")

if __name__ == "__main__":
    import pytest
    pytest.main(["-v", __file__])

import requests
import time

BASE_URL = "http://127.0.0.1:8000/api"

def test_api():
    # Wait for server to start
    time.sleep(2)
    
    try:
        # Check health
        response = requests.get(f"{BASE_URL}/health")
        print(f"Health Check: {response.json()}")
        assert response.status_code == 200

        # Create Board
        board_data = {"title": "Test Board"}
        response = requests.post(f"{BASE_URL}/boards/", json=board_data)
        print(f"Create Board: {response.json()}")
        assert response.status_code == 200
        board_id = response.json()["id"]

        # Create List
        list_data = {"title": "To Do", "position": 0}
        response = requests.post(f"{BASE_URL}/boards/{board_id}/lists/", json=list_data)
        print(f"Create List: {response.json()}")
        assert response.status_code == 200
        list_id = response.json()["id"]

        # Create Card
        card_data = {"title": "Test Card", "description": "This is a test card", "position": 0}
        response = requests.post(f"{BASE_URL}/lists/{list_id}/cards/", json=card_data)
        print(f"Create Card: {response.json()}")
        assert response.status_code == 200
        card_id = response.json()["id"]

        # Move Card (Update position)
        move_data = {"new_list_id": list_id, "new_position": 1}
        # Note: PUT request params are query params in my implementation? 
        # Let's check main.py: 
        # @app.put("/api/cards/{card_id}/move")
        # def move_card(card_id: int, new_list_id: int, new_position: int, ...):
        # These are query parameters by default in FastAPI if not specified as Body.
        response = requests.put(f"{BASE_URL}/cards/{card_id}/move", params=move_data)
        print(f"Move Card: {response.json()}")
        assert response.status_code == 200

        print("\nAPI Verification Successful!")

    except Exception as e:
        print(f"\nAPI Verification Failed: {e}")

if __name__ == "__main__":
    test_api()

import requests
try:
    response = requests.get('http://127.0.0.1:8000/api/accounts/users/?ordering=-followers_count')
    print(f"Status Code: {response.status_code}")
    print(response.text[:500])
except Exception as e:
    print(f"Error: {e}")

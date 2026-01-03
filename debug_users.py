import requests
try:
    response = requests.get('http://127.0.0.1:8000/api/accounts/users/')
    if response.status_code != 200:
        print(f"Status: {response.status_code}")
        print(response.text)
        exit()

    data = response.json()
    # Handle list vs dict (paginated)
    results = data.get('results', []) if isinstance(data, dict) else data
    
    print(f"Found {len(results)} users.")
    for u in results:
        uname = u.get('username')
        print(f"User: '{uname}' (ID: {u.get('id')})")
        if not uname:
            print("WARNING: User has empty username!")
except Exception as e:
    print(f"Error: {e}")

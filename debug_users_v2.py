import requests
try:
    response = requests.get('http://127.0.0.1:8000/api/accounts/users/')
    data = response.json()
    results = data.get('results', []) if isinstance(data, dict) else data
    
    print(f"Total users: {len(results)}")
    for u in results:
        if not u.get('username'):
            print(f"Found INVALID user: ID={u.get('id')}, Name='{u.get('first_name')} {u.get('last_name')}', Username='{u.get('username')}'")
        else:
            print(f"Valid user: {u.get('username')}")

except Exception as e:
    print(e)

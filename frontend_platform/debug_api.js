
const axios = require('axios');

async function check() {
    try {
        // 1. Check Users
        console.log("Checking Users...");
        const usersRes = await axios.get('http://127.0.0.1:8000/api/accounts/users/');
        const users = usersRes.data.results || usersRes.data;
        users.slice(0, 5).forEach(u => {
            console.log(`User: id=${u.id}, username=${u.username} (Type: ${typeof u.username})`);
            if (!u.username) console.error("!!! Missing username for user", u.id);
        });

        // 2. Check Articles
        console.log("\nChecking Articles...");
        const artsRes = await axios.get('http://127.0.0.1:8000/api/content/articles/');
        const articles = artsRes.data.results || artsRes.data;
        articles.slice(0, 5).forEach(a => {
            console.log(`Article: id=${a.id}, author=${a.author} (Type: ${typeof a.author})`);
            if (!a.author) console.warn("!!! Missing author for article", a.id);
        });

    } catch (err) {
        console.error("Error:", err.message);
        if (err.response) console.error("Data:", err.response.data);
    }
}

check();

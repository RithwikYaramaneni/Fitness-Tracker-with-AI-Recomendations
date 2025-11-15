// Simple test script to register/login two users and exercise friends endpoints
// Usage: node backend/scripts/testFriendsFlow.js

const fetch = global.fetch || require('node-fetch');
const API_BASE = process.env.API_BASE || 'http://localhost:5001/api';

async function post(path, body, token) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function get(path, token) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function put(path, token) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function del(path, token) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function ensureUser(email, password, name) {
  // Try register; if 400 with existing user, login
  console.log(`Registering ${email}`);
  const reg = await post('/auth/register', { email, password, name });
  if (reg.status === 201 && reg.data.success) {
    console.log('Registered:', email);
    return reg.data.data.token;
  }
  if (reg.status === 400) {
    console.log('User exists, logging in:', email);
    const login = await post('/auth/login', { email, password });
    if (login.status === 200 && login.data.success) {
      return login.data.data.token;
    }
  }
  throw new Error(`Failed to create/login ${email}: ${JSON.stringify(reg.data)}`);
}

(async () => {
  try {
    // Test users
    const userA = { email: 'alice.test@example.com', password: 'password123', name: 'Alice Test' };
    const userB = { email: 'bob.test@example.com', password: 'password123', name: 'Bob Test' };

    const tokenA = await ensureUser(userA.email, userA.password, userA.name);
    const tokenB = await ensureUser(userB.email, userB.password, userB.name);

    console.log('\n--- Tokens obtained ---');
    console.log('Alice token (first 20 chars):', tokenA.slice(0, 20));
    console.log('Bob token   (first 20 chars):', tokenB.slice(0, 20));

    // Alice sends friend request to Bob
    console.log('\nAlice sends friend request to Bob');
    // Need Bob's user id. Use friends search to find Bob's id
    const searchRes = await get(`/friends/search?query=${encodeURIComponent('bob.test@example.com')}`, tokenA);
    if (!searchRes.data?.data || searchRes.data.data.length === 0) {
      console.log('Could not find Bob via search, falling back to user listing');
    }
    const bobEntry = (searchRes.data.data || [])[0];
    const bobId = bobEntry?._id;
    if (!bobId) {
      console.error('Failed to find Bob id, aborting. Search response:', searchRes.data);
      return;
    }

    const sendReq = await post('/friends/request', { friendId: bobId }, tokenA);
    console.log('Send request response:', sendReq.status, sendReq.data);

    // Bob checks requests
    const bobRequests = await get('/friends/requests', tokenB);
    console.log('Bob requests:', bobRequests.status, bobRequests.data);
    const reqId = bobRequests.data?.data?.[0]?._id;
    if (!reqId) {
      console.error('No request id found for Bob to accept. Aborting.');
      return;
    }

    // Bob accepts
    const accept = await put(`/friends/request/${reqId}/accept`, tokenB);
    console.log('Bob accepted:', accept.status, accept.data);

    // Check friends lists for both
    const friendsA = await get('/friends', tokenA);
    const friendsB = await get('/friends', tokenB);
    console.log('Alice friends:', friendsA.status, friendsA.data);
    console.log('Bob friends:  ', friendsB.status, friendsB.data);

    // Cleanup: Alice removes Bob
    const bobIdFromList = friendsA.data?.data?.[0]?._id || bobId;
    const remove = await del(`/friends/${bobIdFromList}`, tokenA);
    console.log('Remove friend response:', remove.status, remove.data);

    // Verify removal
    const friendsA2 = await get('/friends', tokenA);
    const friendsB2 = await get('/friends', tokenB);
    console.log('After removal - Alice friends:', friendsA2.status, friendsA2.data);
    console.log('After removal - Bob friends:', friendsB2.status, friendsB2.data);

    console.log('\nTest flow complete.');
  } catch (err) {
    console.error('Error during test flow:', err);
  }
})();

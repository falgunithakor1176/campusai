const http = require('http');

function get(path, token = null) {
  return new Promise((resolve, reject) => {
    const headers = { 'Accept': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    http.get({ hostname: 'localhost', port: 5000, path, headers }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(d) }));
    }).on('error', reject);
  });
}

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost', port: 5000, path, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(d) }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function inspect() {
  const login = await post('/api/auth/login', { email: 'superadmin@campusai.edu.in', password: 'Admin@123' });
  const token = login.body.data.accessToken;

  const users = await get('/api/users?limit=5', token);
  console.log('USERS status:', users.status, 'body keys:', Object.keys(users.body));
  if (users.body.data) {
    console.log('USERS body.data type:', Array.isArray(users.body.data) ? 'Array' : typeof users.body.data);
    console.log('USERS body.data keys:', Object.keys(users.body.data));
    if (users.body.data.users) console.log('USERS count:', users.body.data.users.length);
    else if (Array.isArray(users.body.data)) console.log('USERS array count:', users.body.data.length);
  } else {
    console.log('USERS raw body:', users.body);
  }

  const depts = await get('/api/departments');
  console.log('DEPTS status:', depts.status, 'body keys:', Object.keys(depts.body));
  if (depts.body.data) {
    console.log('DEPTS body.data type:', Array.isArray(depts.body.data) ? 'Array' : typeof depts.body.data);
    console.log('DEPTS body.data keys:', Object.keys(depts.body.data));
    if (depts.body.data.departments) console.log('DEPTS count:', depts.body.data.departments.length);
    else if (Array.isArray(depts.body.data)) console.log('DEPTS array count:', depts.body.data.length);
  } else {
    console.log('DEPTS raw body:', depts.body);
  }

  const courses = await get('/api/courses');
  console.log('COURSES status:', courses.status, 'body keys:', Object.keys(courses.body));
  if (courses.body.data) {
    console.log('COURSES body.data type:', Array.isArray(courses.body.data) ? 'Array' : typeof courses.body.data);
    console.log('COURSES body.data keys:', Object.keys(courses.body.data));
    if (courses.body.data.courses) console.log('COURSES count:', courses.body.data.courses.length);
    else if (Array.isArray(courses.body.data)) console.log('COURSES array count:', courses.body.data.length);
  } else {
    console.log('COURSES raw body:', courses.body);
  }
}

inspect().catch(console.error);

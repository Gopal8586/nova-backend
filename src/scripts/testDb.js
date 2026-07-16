import pkg from 'pg';
const { Client } = pkg;

const testConnection = async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const res = await client.query('SELECT NOW()');
    console.log('Connected successfully via IPv4 Pooler!', res.rows[0]);
  } catch (err) {
    console.error('Connection failed', err);
  } finally {
    await client.end();
  }
};

testConnection();

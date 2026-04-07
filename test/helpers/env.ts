// This file runs before any test module is loaded (jest setupFiles).
// Setting env vars here guarantees AppModule picks up the test DB.
process.env.MONGODB_URI = 'mongodb://localhost:27017/notary-crm-test';
process.env.JWT_SECRET = 'test_secret_key';
process.env.JWT_EXPIRES_IN = '1h';
process.env.PORT = '3099';

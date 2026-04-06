export interface AppConfig {
  port: number;
  nodeEnv: string;
  mongodb: {
    uri: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
}

export default (): AppConfig => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  mongodb: {
    uri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/notary-crm',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'fallback_secret',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
});

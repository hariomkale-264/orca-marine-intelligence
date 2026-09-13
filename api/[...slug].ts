import { createApp } from '../server/createApp.js';

const app = createApp();

export default function handler(req: any, res: any) {
  return app(req, res);
}

export { app };

import { TokenPayload } from '../auth/utils';

declare global {
  namespace Express {
    interface Request {
      auth?: TokenPayload;
    }
  }
}

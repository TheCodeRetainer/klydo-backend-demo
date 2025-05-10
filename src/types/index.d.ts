// Type declarations for modules without type definitions
declare module 'express' {
  interface Express {
    (): any;
    json: any;
    Router: () => Router;
    static: any;
    urlencoded: any;
  }

  interface Router {
    get(path: string, handler: (req: Request, res: Response) => void): Router;
    post(path: string, handler: (req: Request, res: Response) => void): Router;
    put(path: string, handler: (req: Request, res: Response) => void): Router;
    delete(path: string, handler: (req: Request, res: Response) => void): Router;
    use(path: string, router: Router): Router;
    use(middleware: any): Router;
  }

  interface Request {
    params: any;
    body: any;
    query: any;
  }

  interface Response {
    status(code: number): Response;
    json(data: any): void;
    redirect(url: string): void;
    send(body: any): void;
  }

  const express: Express;
  
  namespace express {
    export type Request = Request;
    export type Response = Response;
  }
  
  export = express;
}

declare module 'cors' {
  import { RequestHandler } from 'express';
  
  function cors(options?: cors.CorsOptions): RequestHandler;
  
  namespace cors {
    interface CorsOptions {
      origin?: boolean | string | string[] | RegExp | RegExp[] | ((origin: string, callback: (err: Error | null, allow?: boolean) => void) => void);
      methods?: string | string[];
      allowedHeaders?: string | string[];
      exposedHeaders?: string | string[];
      credentials?: boolean;
      maxAge?: number;
      preflightContinue?: boolean;
      optionsSuccessStatus?: number;
    }
  }
  
  export = cors;
}

// Fix mongoose Connection type
declare module 'mongoose' {
  interface Connection {
    on(event: string, callback: Function): void;
  }
}

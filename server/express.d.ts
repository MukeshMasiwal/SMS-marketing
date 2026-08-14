declare module "express" {
  export interface Request {
    user?: {
      userId: string;
      role: "user" | "admin" | "USER" | "ADMIN";
    };
    body: any;
    query: any;
    params: any;
    headers: any;
    cookies: any;
  }
  export interface Response {
    status(code: number): this;
    json(data: any): this;
    send(data: any): this;
  }
  export interface NextFunction {
    (err?: any): void;
  }
  export function Router(): any;
  const express: any;
  export default express;
}

declare module "cors" {
  const cors: any;
  export default cors;
}

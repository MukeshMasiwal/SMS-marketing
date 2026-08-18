declare module "express" {
  export interface Request {
    user?: {
      userId: string;
      role: "USER" | "ADMIN" | "SUPER_ADMIN" | "user" | "admin" | "super_admin";
      email?: string;
    };
    body: any;
    query: any;
    params: any;
    headers: any;
    cookies: any;
    ip?: string;
  }
  export interface Response {
    status(code: number): this;
    json(data: any): this;
    send(data: any): this;
    cookie(name: string, value: string, options?: any): this;
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

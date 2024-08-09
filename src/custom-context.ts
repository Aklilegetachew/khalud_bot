import { Context } from "telegraf";

interface Session {
  state?: any;
  productDescription?: any;
  model?: any;
}

export interface CustomContext extends Context {
  session: Session;
}

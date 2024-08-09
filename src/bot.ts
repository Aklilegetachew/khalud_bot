import { Telegraf, session } from "telegraf";
import { CustomContext } from "./custom-context";
import { handleAdminCommands } from "./commands/admin";
import { handleCustomerCommands } from "./commands/customer";

// Initialize bot
const bot = new Telegraf<any>("");

bot.use(session());
bot.use((ctx, next) => {
  if (!ctx.session) {
    ctx.session = {};
  }
  return next();
});
const ADMIN_ID = 243386163;
bot.use((ctx, next) => {
  if (ctx.from?.id == ADMIN_ID) {
    handleAdminCommands(bot);
  } else {
    console.log("not admin");
    handleCustomerCommands(bot);
  }
  return next();
});

// Launch the bot
bot
  .launch()
  .then(() => {
    console.log("Telegram bot is running");
  })
  .catch((err) => {
    console.error("Error launching bot:", err);
  });

process.on("SIGINT", () => {
  bot.stop("SIGINT");
});

process.on("SIGTERM", () => {
  bot.stop("SIGTERM");
});

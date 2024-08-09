import { Telegraf, Markup } from "telegraf";
import { CustomContext } from "../custom-context";
import pool from "../database";
import mysql from "mysql2/promise";

const ADMIN_ID = 243386163;

const isAdmin = (ctx: CustomContext) => ctx.from?.id === ADMIN_ID;

export const handleAdminCommands = (bot: Telegraf<CustomContext>) => {
  bot.command("submitproduct", async (ctx) => {
    ctx.session.state = null;
    ctx.session.productDescription = null;
    ctx.session.model = null;
    if (!isAdmin(ctx)) {
      return ctx.reply("You are not authorized to use this command.");
    }

    ctx.session.state = "waiting_model";
    ctx.reply("Please send the product model.");
  });

  bot.on("text", async (ctx) => {
    if (ctx.session.state === "waiting_description") {
      const description = ctx.message.text;

      ctx.session.productDescription = description;
      ctx.session.state = "waiting_photo";
      ctx.reply("Please send the product photo.");
    } else if (ctx.session.state === "waiting_model") {
      const description = ctx.message.text;

      ctx.session.model = description;
      ctx.session.state = "waiting_description";
      ctx.reply("Please send the description.");
    }
  });

  bot.on("photo", async (ctx) => {
    if (ctx.session.state === "waiting_photo") {
      try {
        const photoId = ctx.message.photo[0].file_id;

        const [result] = await pool.query(
          "INSERT INTO products (productDesc, imageUrl, modelName) VALUES (?, ?, ?)",
          [ctx.session.productDescription, photoId, ctx.session.model]
        );
        const productId = (result as mysql.ResultSetHeader).insertId;

        const channelId = "@SinoGNNSethiopia";
        const productLink = `https://t.me/Khuludimportbot?start=${productId}`;

        await bot.telegram.sendPhoto(channelId, photoId, {
          caption: ctx.session.productDescription,
          reply_markup: Markup.inlineKeyboard([
            Markup.button.url(ctx.session.model, productLink),
          ]).reply_markup,
        });

        ctx.reply("Product submitted and posted to the channel.");

        // Clear session
        ctx.session.state = null;
        ctx.session.productDescription = null;
      } catch (error) {
        console.error("Error handling product photo:", error);
        ctx.reply(
          "An error occurred while processing the photo. Please try again."
        );
      }
    }
  });
};

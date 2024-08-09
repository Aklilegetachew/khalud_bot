import { Telegraf, Markup } from "telegraf";
import { CustomContext } from "../custom-context";
import pool from "../database";

export const handleCustomerCommands = (bot: Telegraf<CustomContext>) => {
  console.log("Bot management for customer");
  const channelUrl = "https://t.me/+Al1i1Vf1x1ZkODA8";
  const phoneNumberRegex =
    /^(\+?\d{1,4}[\s-]?)?(\(?\d{1,3}\)?[\s-]?)?\d{1,4}[\s-]?\d{1,4}[\s-]?\d{1,9}$/;

  bot.command("start", async (ctx) => {
    ctx.session.state = null;
    ctx.session.productDescription = null;
    ctx.session.model = null;

    const startPayload = ctx.payload;
    const userId = ctx.from.id;
    console.log(ctx);
    if (startPayload) {
      await pool.query(
        "INSERT INTO customers (productId, step, userId) VALUES (?, ?, ?)",
        [startPayload, "start", userId]
      );
      ctx.reply(
        `Welcome to our bot! Your number is ${startPayload}. Please share your phone number to continue.`,
        Markup.keyboard([
          [Markup.button.contactRequest("Share phone number")],
        ]).resize()
      );
    } else {
      const inlineKeyboard = Markup.inlineKeyboard([
        Markup.button.url("Select items from the channel", channelUrl),
      ]);
      ctx.reply(
        "Welcome to our bot! Please select items from the channel.",
        inlineKeyboard
      );
    }
  });

  bot.on("contact", async (ctx) => {
    const contact = ctx.message.contact;

    if (contact) {
      const { phone_number, first_name, last_name } = contact;
      const userId = ctx.from.id;
      await pool.query(
        `
            UPDATE customers
            SET phoneNumber = ?, firstName = ?, lastName = ?, step = ?
            WHERE id = (SELECT id FROM customers WHERE userId = ? ORDER BY id DESC LIMIT 1)
          `,
        [phone_number, first_name, last_name, "phone_number", userId]
      );
      const inlineKeyboard = Markup.keyboard([
        Markup.button.text("Skip Email"),
        Markup.button.text("Provide Email"),
      ]);
      ctx.reply(
        `Thank you! We received your phone number: ${phone_number}. \nWould you like to provide an email address?`,
        inlineKeyboard
      );
    }
  });

  bot.on("text", async (ctx) => {
    const text = ctx.message.text;
    const userId = ctx.from.id;
    console.log("is it here");
    // Handle email input or skip
    if (text.toLowerCase() === "skip email") {
      await pool.query(
        "UPDATE customers SET email = ? WHERE userId = ? ORDER BY id DESC LIMIT 1",
        ["none", userId]
      );
      const inlineKeyboard = Markup.inlineKeyboard([
        Markup.button.url("Back to Channel", channelUrl),
      ]);
      ctx.reply(
        `Thank you! We received your phone number and opted to skip email submission. We will contact you soon.`,
        inlineKeyboard
      );
    } else if (text.toLowerCase() === "provide email") {
      ctx.reply(
        "Please send your email address or type 'skip' to skip this step."
      );
      ctx.session.state = "waiting_email";
    } else if (ctx.session.state === "waiting_email") {
      // Save the email address
      await pool.query(
        "UPDATE customers SET email = ? WHERE userId = ? ORDER BY id DESC LIMIT 1",
        [text, userId]
      );
      const inlineKeyboard = Markup.inlineKeyboard([
        Markup.button.url("Back to Channel", channelUrl),
      ]);
      ctx.reply(
        `Thank you! We received your email address: ${text}. We will contact you soon.`,
        inlineKeyboard
      );
      ctx.session.state = ""; // Clear session state
    } else if (phoneNumberRegex.test(text)) {
      await pool.query(
        "UPDATE customers SET phoneNumber = ?, step = ? WHERE userId = ? ORDER BY id DESC LIMIT 1",
        [text, "phone_number", userId]
      );
      const inlineKeyboard = Markup.keyboard([
        Markup.button.text("Skip Email"),
        Markup.button.text("Provide Email"),
      ]);
      ctx.reply(
        `Thank you! We received your phone number: ${text}. \nWould you like to provide an email address?`,
        inlineKeyboard
      );

      ctx.session.state = null;
      ctx.session.productDescription = null;
      ctx.session.model = null;
    } else {
      ctx.reply(
        'Please send a valid phone number or use the "Share phone number" button.'
      );
    }
  });
};

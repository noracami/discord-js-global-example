const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("create")
    .setDescription("建立新目標")
    .addSubcommand((subcommand) =>
      subcommand.setName("goal").setDescription("建立新的挑戰目標")
    ),

  async execute(interaction) {
    if (interaction.options.getSubcommand() !== "goal") return;

    // 建立目標類型選擇按鈕
    const completionTypeButton = new ButtonBuilder()
      .setCustomId("create_completion_goal")
      .setLabel("📋 完成型")
      .setStyle(ButtonStyle.Primary);

    const numericTypeButton = new ButtonBuilder()
      .setCustomId("create_numeric_goal")
      .setLabel("📊 數值型")
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(completionTypeButton, numericTypeButton);

    await interaction.reply({
      content: "請選擇要建立的目標類型：\n\n📋 **完成型**：用於是/否類型的目標（如每日閱讀、運動習慣）\n📊 **數值型**：用於需要記錄數值的目標（如跑步距離、學習時間）",
      components: [row],
      ephemeral: true,
    });
  },
};
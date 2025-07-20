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

    // 建立「輸入目標」按鈕
    const goalInputButton = new ButtonBuilder()
      .setCustomId("input_goal_name")
      .setLabel("輸入目標")
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(goalInputButton);

    await interaction.reply({
      content: "點擊下方按鈕開始建立您的目標：",
      components: [row],
      ephemeral: true,
    });
  },
};
const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require("discord.js");
const { searchGoalsByUserForAutocomplete, getGoalById } = require("../../database");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("r")
    .setDescription("回報目標進度")
    .addStringOption((option) =>
      option
        .setName("goal")
        .setDescription("選擇要回報的目標")
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    const userId = interaction.user.id;

    try {
      const goals = await searchGoalsByUserForAutocomplete(userId, focusedValue);
      
      const choices = goals.map(goal => {
        let displayName = goal.name;
        if (goal.goal_type === "numeric" && goal.unit) {
          displayName += ` (${goal.unit})`;
        }
        
        return {
          name: displayName,
          value: goal.id
        };
      });

      await interaction.respond(choices.slice(0, 25));
    } catch (error) {
      console.error('Error in autocomplete:', error);
      await interaction.respond([]);
    }
  },

  async execute(interaction) {
    const goalId = interaction.options.getString("goal");
    const userId = interaction.user.id;

    try {
      const goal = await getGoalById(goalId);
      
      if (!goal) {
        await interaction.reply({
          content: "❌ 找不到指定的目標。",
          ephemeral: true,
        });
        return;
      }

      if (goal.user_id !== userId) {
        await interaction.reply({
          content: "❌ 您只能回報自己的目標。",
          ephemeral: true,
        });
        return;
      }

      // 根據目標類型顯示不同的 Modal
      if (goal.goal_type === "completion") {
        // 完成型目標 Modal
        const modal = new ModalBuilder()
          .setCustomId(`completion_report_modal_${goalId}`)
          .setTitle(`回報：${goal.name}`);

        const completionInput = new TextInputBuilder()
          .setCustomId("completion_status_input")
          .setLabel("是否完成？")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setPlaceholder("輸入 是 或 否");

        const notesInput = new TextInputBuilder()
          .setCustomId("notes_input")
          .setLabel("備註（可選）")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false)
          .setPlaceholder("今天的心得或備註...");

        const completionRow = new ActionRowBuilder().addComponents(completionInput);
        const notesRow = new ActionRowBuilder().addComponents(notesInput);
        modal.addComponents(completionRow, notesRow);

        await interaction.showModal(modal);
      } else if (goal.goal_type === "numeric") {
        // 數值型目標 Modal
        const modal = new ModalBuilder()
          .setCustomId(`numeric_report_modal_${goalId}`)
          .setTitle(`回報：${goal.name}`);

        const valueLabel = goal.unit ? `數值（${goal.unit}）` : "數值";
        const valuePlaceholder = goal.unit ? `例如：30（${goal.unit}）` : "例如：30";

        const valueInput = new TextInputBuilder()
          .setCustomId("numeric_value_input")
          .setLabel(valueLabel)
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setPlaceholder(valuePlaceholder);

        const notesInput = new TextInputBuilder()
          .setCustomId("notes_input")
          .setLabel("備註（可選）")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false)
          .setPlaceholder("今天的心得或備註...");

        const valueRow = new ActionRowBuilder().addComponents(valueInput);
        const notesRow = new ActionRowBuilder().addComponents(notesInput);
        modal.addComponents(valueRow, notesRow);

        await interaction.showModal(modal);
      }
    } catch (error) {
      console.error('Error in report command:', error);
      await interaction.reply({
        content: "❌ 處理回報時發生錯誤，請稍後再試。",
        ephemeral: true,
      });
    }
  },
};
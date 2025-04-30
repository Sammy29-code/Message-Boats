require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  Events,
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

client.once('ready', () => {
  console.log(`✅ Bot Curhat Yuk aktif sebagai ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isButton() && interaction.customId === 'open_form') {
    const modal = new ModalBuilder()
      .setCustomId('curhat_modal')
      .setTitle('Curhat Anonim')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('pesan_curhat')
            .setLabel('Tulis isi curhatmu')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
        )
      );

    await interaction.showModal(modal);
  }

  if (interaction.isModalSubmit() && interaction.customId === 'curhat_modal') {
    const pesan = interaction.fields.getTextInputValue('pesan_curhat');
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();

    const embed = new EmbedBuilder()
      .setTitle('📨 Pesan Curhat')
      .setDescription(`${pesan}\n\n**Curhat ID: ${id}**`)
      .setColor(0x5865f2)
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`reply_${id}`).setLabel('Balas').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('open_form').setLabel('🌟 Curhat Yuk').setStyle(ButtonStyle.Primary)
    );

    const msg = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
    await msg.startThread({ name: `Balasan – ${id}`, autoArchiveDuration: 60 });
  }

  if (interaction.isButton() && interaction.customId.startsWith('reply_')) {
    const messageId = interaction.message.id;

    const modal = new ModalBuilder()
      .setCustomId(`modal_reply_${messageId}`)
      .setTitle('Balas Anonim')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('pesan_balasan')
            .setLabel('Isi balasanmu secara anonim')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
        )
      );

    await interaction.showModal(modal);
  }

  if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_reply_')) {
    const messageId = interaction.customId.split('_')[2];
    const balasan = interaction.fields.getTextInputValue('pesan_balasan');

    try {
      const originalMsg = await interaction.channel.messages.fetch(messageId);
      const thread = originalMsg.hasThread ? originalMsg.thread : await originalMsg.startThread({
        name: `Balasan untuk Curhat`,
        autoArchiveDuration: 60,
      });

      const replyEmbed = new EmbedBuilder()
        .setTitle('💬 Balasan Anonim')
        .setDescription(balasan)
        .setColor(0x2ecc71)
        .setTimestamp();

      await thread.send({ embeds: [replyEmbed] });
      await interaction.reply({ content: '✅ Balasan anonim kamu sudah dikirim ke thread!', ephemeral: true });
    } catch (err) {
      console.error('Gagal mengirim balasan ke thread:', err);
      await interaction.reply({ content: '❌ Gagal mengirim balasan ke thread.', ephemeral: true });
    }
  }
});

client.on('messageCreate', async message => {
  if (message.content === '!curhat') {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('open_form').setLabel('🌟 Curhat Yuk').setStyle(ButtonStyle.Primary)
    );

    await message.channel.send({ content: '**Curhat anonim? Klik tombolnya**', components: [row] });
  }
});

client.login(process.env.TOKEN);

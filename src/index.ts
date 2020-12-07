import axios from 'axios';
import { dateMapper, parseSchedule } from './parseSchedule';

import Discord from 'discord.js';

const axiosRequest = axios.create({
  headers: {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7,fr;q=0.6,de;q=0.5',
    'Cache-Control': 'max-age=0',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36'
  }
});

async function getPlans (excepted: string[]) {
  const getGroupUrl = (group: string) => `https://wcy.wat.edu.pl/pl/rozklad?grupa_id=${group}`;
  return await Promise.all(excepted.map(v => getGroupUrl(v)).map(async (url) => {
    return await axiosRequest(url).then(response => {
      return parseSchedule(response.data);
    });
  }));
}

function getTodayPlan (excepted: string) {
  return getPlans([excepted]).then(plans => {
    const minimal = new Date();   minimal.setHours(0, 0, 0, 0);
    const maximal = new Date();   maximal.setDate(maximal.getDate() + 1);
    return plans.map(plan => plan.filter((lesson) => {
      return minimal < lesson.endTime && lesson.startTime < maximal;
    }));
  }).then(plans => {
    return plans[0];
  });
}

function formatNumber(n: number) {
  const str = n.toString();
  return str.length > 1 ? str : '0' + str;
}

// Set default timezone
process.env.TZ = 'Europe/Warsaw';

const client = new Discord.Client();
client.on('ready', async () => {
  console.log(`Logged in as ${client.user!.tag}!`);
  for (const [id, channel] of client.channels.cache) {
    if (channel.type === 'text') {
      const textChannel = channel as Discord.TextChannel;
      if (!textChannel.name.startsWith('wat-plan-')) continue;
      textChannel.bulkDelete(1);
      const group = textChannel.name.replace('wat-plan-', '').toUpperCase();
      const lessons = await getTodayPlan(group);
      if (!lessons.length) continue;

      // Create pretty print message
      const embed = new Discord.MessageEmbed()
        .setTitle(`Plan lekcji na dzień ${new Date().toLocaleDateString()}`)
        .setColor(0xff0000)
        .setDescription(`Wygenerowne przez ${client.user!.tag}!`);

      for (let i = 1; i <= 7; i++) {
        const lesson = lessons.find(l => l.block_id === i);
        const [ startTime, endTime ] = dateMapper[i - 1];
        embed.addField(
          `${i}. ${formatNumber(startTime[0])}:${formatNumber(startTime[1])} - ${formatNumber(endTime[0])}:${formatNumber(endTime[1])}`,
          lesson ? lesson.details : '-'
        );
      }
      textChannel.send(embed);
    }
  }
  setTimeout(() => {
    client.destroy();
    process.exit(0);
  }, 2000);
});
client.login(process.env.TOKEN);

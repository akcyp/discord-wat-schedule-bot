import { parse } from 'node-html-parser';

export const dateMapper = [
  [[8, 0], [9, 35]],    //  8:00 -  9:35
  [[9, 50], [11, 25]],  //  9:50 - 11:25
  [[11, 40], [13, 15]], // 11:40 - 13:15
  [[13, 30], [15, 5]],  // 13:30 - 15:05
  [[15, 45], [17, 20]], // 15:45 - 17:20
  [[17, 35], [19, 10]], // 17:35 - 19:10
  [[19, 25], [21, 0]]   // 19:25 - 21:00
];

export function setTime(startDate: Date, endDate: Date, index: number) {
  const [start, end] = dateMapper[index - 1];
  startDate.setHours(start[0], start[1], 0, 0);
  endDate.setHours(end[0], end[1], 0, 0);
}

export class Lesson {
  public startTime: Date;
  public endTime: Date;
  constructor(
    public details: string,
    public shortcut: string,
    public type: string,
    public room: string,
    public index: string,
    public rawDate: string,
    public block_id: number
  ) {
    const formatted = rawDate.replace(/_/g, '-');
    this.startTime = new Date(formatted);
    this.endTime = new Date(formatted);
    setTime(this.startTime, this.endTime, block_id);
  }
}

export function parseSchedule (html: string): Lesson[] {
  const root = parse(html).querySelector('.lessons.hidden');
  const lessons = root.querySelectorAll('.lesson').map($lesson => {
    const date = $lesson.querySelector('.date').innerText;
    const details = $lesson.querySelector('.info').innerText;
    const nameHelper = $lesson.querySelector('.name').innerHTML.split('<br>');
    const block_id = parseInt(($lesson.querySelector('.block_id').innerText || '1').replace('block', ''));
    const shortcut = nameHelper[0] || '';
    const type = nameHelper[1] || '';
    const room = nameHelper[2] || '';
    const number = nameHelper[3] || '';
    return new Lesson(details, shortcut, type, room, number, date, block_id);
  });
  return lessons;
}
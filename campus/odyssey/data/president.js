/* 校长面对面 · Meet the President — the ONE place to edit for the President scene.
 *
 * Likeness & voice (authorised by the President):
 *   - Put the authorised portrait at  assets/president/portrait.jpg   (square crop works best, >= 512 px)
 *   - Put authorised voice recordings at assets/president/voice/<key>.mp3  (keys: open, q1, q2, q3, q4, close)
 *   Missing files are skipped silently: the scene falls back to an illustrated avatar and text only.
 *
 * Script: the lines below are DRAFTS written for the demo. They paraphrase themes from the President's
 * public speeches (e.g. "大胆点菜、敢点新菜"、"开眼界"、"跳出舒适圈"), but they are not his own words.
 * Replace them with wording approved by the President's Office, then set draft:false to hide the on-screen note.
 */
window.PRESIDENT = {
  draft: true,
  name: ['徐扬生 校长', 'President Xu Yangsheng'],
  portrait: 'assets/president/portrait.jpg',
  voiceDir: 'assets/president/voice/',
  open: ['同学们好。今天不讲大道理，就聊聊天。你们想问什么，都可以问。', 'Hello, everyone. No big speeches today — let us simply talk. Ask me anything you like.'],
  qa: [
    { key: 'q1', q: ['大学四年，最该学会的是什么？', 'What matters most to learn in four years of university?'],
      a: ['先学会做人，再学会做事。书本之外，去书院、去社团、去和不一样的人相处。大学要给你的，不只是一门专业，而是一个完整的人。', 'Learn to be a person first, then learn to do things. Beyond the books, go to your college, join a club, spend time with people unlike you. A university should give you not just a major, but a whole person.'] },
    { key: 'q2', q: ['选课时，选容易拿高分的，还是感兴趣但很难的？', 'Should I choose courses that are easy to score in, or hard ones I am curious about?'],
      a: ['大学像一桌很丰盛的宴席。我常劝同学们大胆"点菜"，尤其要敢点没尝过的"新菜"。分数只管一时，眼界是一辈子的。', 'A university is like a great banquet. I often urge students to order boldly — especially the dishes they have never tasted. Grades last a term; a wide horizon lasts a lifetime.'] },
    { key: 'q3', q: ['AI 时代，我们学的东西会不会被取代？', 'In the age of AI, will what we learn be replaced?'],
      a: ['工具会变，提出好问题的能力不会变。把 AI 当同学、当助手都可以，但判断和担当，要留给自己。', 'Tools change; the ability to ask a good question does not. Treat AI as a classmate or an assistant — but keep the judgement and the responsibility for yourself.'] },
    { key: 'q4', q: ['刚来有些不适应，怎么办？', 'I am finding it hard to settle in. What should I do?'],
      a: ['不适应，说明你正在长大。勇敢地跳出舒适圈，但也别一个人硬扛——老师、书院、同学，都在你身边。', 'Feeling unsettled means you are growing. Step bravely out of your comfort zone, but do not carry it alone — your teachers, your college and your classmates are right beside you.'] }
  ],
  close: ['谢谢大家的问题。欢迎你们成为港中大（深圳）的一员——这座校园，从今天起也是你们的。', 'Thank you for your questions. Welcome to CUHK-Shenzhen — from today, this campus is yours too.']
};

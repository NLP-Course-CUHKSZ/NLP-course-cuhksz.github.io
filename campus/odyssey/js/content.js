/* static content: colleges, places, guide, landmarks, cats, characters, world dressing */
(function () {
  'use strict';
  const G = window.G, W = G.world, ui = G.ui, L = G.L;
  const C = G.content = {};

  C.colleges = {
    shaw: { name: ['逸夫书院', 'Shaw College'], b: '逸夫书院A栋', color: '#c9764d', tag: ['下园 · 离教学楼最近', 'Lower Campus · steps from class'], d: ['大学创办的第一所书院，也是唯一位于下园的书院，六栋宿舍楼背靠山林。', 'The first college and the only one on the Lower Campus: six residential blocks backing onto the wooded hill.'] },
    diligentia: { name: ['学勤书院', 'Diligentia College'], b: '学勤书院A座', color: '#d8b24a', tag: ['上园 · 楼下有麦当劳', "Upper Campus · McDonald's downstairs"], d: ['淡黄色的外墙衬着深圳的蓝天，楼下就有麦当劳。', "Pale-yellow walls against the Shenzhen sky, with a McDonald's downstairs."] },
    muse: { name: ['思廷书院', 'Muse College'], b: '思廷书院A座', color: '#2f9c6a', tag: ['上园 · 紧邻服务中心', 'Upper Campus · by the Amenity Centre'], d: ['浅灰与翠绿相间，四周林木环绕，旁边就是服务中心。', 'Light grey and emerald green, ringed by trees, right beside the Amenity Centre.'] },
    harmonia: { name: ['祥波书院', 'Harmonia College'], b: '祥波书院A座', color: '#c8402e', tag: ['上园东缘 · 朱红色', 'Upper Campus east · vermilion'], d: ['朱红色的外观在青山绿树间格外醒目，四栋楼沿上园东缘排开。', 'Vermilion red against the green hills: four blocks along the eastern edge of the Upper Campus.'] },
    ling: { name: ['道扬书院', 'Ling College'], b: '道扬书院', color: '#3f7fc9', tag: ['上园正门内 · 蓝白相间', 'Inside the Upper gate · blue & white'], d: ['蓝白相间，与蓝天白云相呼应，位于上园正门内。', 'Blue and white like the sky above it, just inside the Upper Campus gate.'] },
    minerva: { name: ['厚含书院', 'Minerva College'], b: '厚含书院', color: '#e8892f', tag: ['上园最北 · 橙白配色', 'Upper Campus north · orange & white'], d: ['橙白配色，位于上园最北端的高台上，背靠青山。', 'Orange and white, on the high terrace at the north end of the Upper Campus.'] },
    eighth: { name: ['第八书院', 'The Eighth College'], b: '第八书院', color: '#5a8fa8', tag: ['中园 · 临神仙湖', 'Middle Campus · by Shenxian Lake'], d: ['大学最新的一所书院，随音乐学院校园一同启用，宿舍楼临神仙湖而立。', 'The newest college, opened with the School of Music campus; its blocks stand by Shenxian Lake.'] },
    seventh: { grad: true, name: ['永平书院', 'Yongping College'], b: '永平书院', color: '#7a4fb5', tag: ['上园 · 以研究生为主', 'Upper Campus · mainly postgraduates'], d: ['原称第七书院，紫白基调，是首间以研究生为主的书院，与厚含书院相邻。', 'Formerly the Seventh College: purple and white, the first college mainly for postgraduates, beside Minerva.'] }
  };

  C.places = {
    '大学图书馆': ['下园中轴上的标志性建筑，白色体量横跨林荫轴线，与学生中心之间隔着一方睡莲池。自习、借阅、研讨间都在这里。', 'The landmark on the central axis of the Lower Campus: a white volume bridging the tree-lined mall, facing the Student Centre across a water-lily pond.'],
    '学生中心': ['学生事务的大本营，楼前是校巴站：二楼饭堂，三楼职业规划与发展处（CPDO）和多功能厅，四楼心理咨询室，还有社团排练空间。', 'Hub of student life with the shuttle stop at the door: canteen on 2F, CPDO and the multi-function hall on 3F, counselling rooms on 4F, plus society rooms.'],
    '行政楼': ['大学行政中枢，分东、西两翼，屋顶覆有绿植。楼前广场是新生杯彩色跑的起点，旁边的美丽异木棉每到秋冬盛放。', 'The administrative hub, with east and west wings under a planted roof. The square hosts the Color Run start; the silk-floss trees beside it bloom pink every autumn.'],
    '教学楼A': ['教学楼 A（TA）：沿龙翔大道一字排开的教学楼群之首，错落的体量把城市喧嚣挡在外面。', 'Teaching A (TA): first of the teaching blocks along Longxiang Boulevard, screening the mall behind from traffic noise.'],
    '教学楼B': ['教学楼 B（TB）：以二层连廊与 TA、TC 相连，正门就在楼前。', 'Teaching B (TB): joined to TA and TC by second-floor walkways, with the main gate right outside.'],
    '教学楼C': ['教学楼 C（TC）：折线形平面围合出一个个小庭院。', 'Teaching C (TC): its zig-zag plan encloses a series of small courtyards.'],
    '教学楼D': ['教学楼 D（TD），又名张灵斌楼，内山书店就在一旁。下园社康中心（校内医务室）在下首层。', 'Teaching D (TD), also the Zhang Lingbin Building, with the university bookstore beside it. The Lower Campus health centre (campus clinic) is on the lower ground floor.'],
    '教学综合楼': ['教学综合楼（TX）：二期工程的核心，2023 年启用，由多栋高低错落的塔楼以空中连廊串联。', 'Teaching Complex (TX): the centrepiece of Phase II, opened in 2023 — a cluster of towers tied together by sky bridges.'],
    '礼文堂': ['大学礼堂：毕业典礼、大型演出与书院高桌晚宴的场地。', 'The university auditorium: congregations, concerts and college High Table dinners.'],
    '逸夫国际会议中心': ['国际学术交流中心，与礼文堂相邻，临湖而建。讲座、论坛与校长面对面在此举行。', 'The international conference centre beside Liwen Hall, overlooking the pond — home to talks, forums and town halls.'],
    '道远楼': ['数据科学学院所在地。弧形立面朝向启动区广场，老南门进门右手边、台阶之上就是它。', 'Home of the School of Data Science. Its curved front faces the Main Square, up the steps to the right of the old South Gate.'],
    '知新楼': ['启动区的主楼，2014 年大学在这里开学。楼内设有黄宜弘梁凤仪伉俪图书馆。', 'The main building of the start-up zone, where the university opened in 2014. It houses the Philip Wong and Anita Leung Library.'],
    '诚道楼': ['启动区教学办公楼之一，设有教学与实验用房。', 'One of the start-up zone buildings, with teaching rooms and labs.'], '志仁楼': ['启动区教学办公楼之一，设有教学与实验用房。', 'One of the start-up zone buildings, with teaching rooms and labs.'], '乐天楼': ['启动区教学办公楼之一，紧邻逸夫书院。', 'One of the start-up zone buildings, next to Shaw College.'],
    '涂辉龙楼': ['涂辉龙楼（实验楼 B 栋）：多个诺奖科学家研究院落户于此。', 'H.L. Tu Building (Research B), home to several Nobel-laureate institutes.'],
    '李贤义楼': ['李贤义楼（实验楼 A 栋）：四层有本科生物类教学实验室。', 'LEE Yin Yee Building (Research A) — undergraduate biology teaching labs on 4F.'],
    '科研楼': ['二期的科研综合大楼，下园最高的建筑，与钟楼一同立在中轴西端。', 'The Phase II research complex, tallest building on the Lower Campus, closing the west end of the axis with the Clock Tower.'],
    '大学体育馆': ['室内球场、游泳池与健身空间。', 'Indoor courts, a swimming pool and fitness rooms.'], '综合运动馆': ['田径场看台与运动馆，折板屋面是它的标志。', 'The grandstand and sports rooms beside the track, under a folded-plate roof.'],
    '钟楼': ['二期的地标，王维仁设计，造型取意中国传统的密檐塔，共十四层檐。同学们叫它"薯塔"。', 'The landmark of Phase II, designed by Wang Weijen after the Chinese dense-eave pagoda, with fourteen tiers of eaves. Students call it the "Potato Tower".'],
    '齐贤楼': ['林间的一栋公寓楼。', 'An apartment block tucked into the trees.'],
    '逸夫书院': C.colleges.shaw.d, '学勤书院': C.colleges.diligentia.d, '思廷书院': C.colleges.muse.d, '祥波书院': C.colleges.harmonia.d, '道扬书院': C.colleges.ling.d, '厚含书院': C.colleges.minerva.d, '永平书院': C.colleges.seventh.d, '第八书院': C.colleges.eighth.d,
    '服务中心': ['上园的生活配套：便利店、银行、餐饮都在这里；另设社康执业点。', 'Everyday services for the Upper Campus: convenience store, bank, food — and a clinic point.'],
    '明园': ['林间的一组低层院落，带一片坡地花园。', 'A low courtyard compound in the woods, with a sloping garden.'],
    '音乐学院音乐厅': ['音乐学院校园 2025 年启用。几座流线形的白色音乐厅像卵石一样落在山脚下。', 'The School of Music campus opened in 2025. Its concert halls sit at the foot of the hill like white pebbles.'],
    '音乐学院图书馆': ['音乐学院校园内的图书馆。', 'The library of the School of Music campus.'], '音乐学院教学楼': ['琴房、排练厅与教学用房。', 'Practice rooms, rehearsal halls and classrooms.'],
    '大运中心体育场': ['深圳大运中心体育场——2011 年世界大学生运动会主场馆，晶体般的"水晶石"造型。', 'Universiade Stadium, main venue of the 2011 Summer Universiade, shaped like a cluster of crystals.']
  };

  C.guide = [
    { icon: '📚', t: ['图书馆', 'Library'], d: ['按索书号找书：先比字母（类号），再比数字，最后比作者号。自助借还机刷校园卡即可。', 'Find books by call number: letters (class) first, then numbers, then the author code. Self-checkout takes your campus card.'] },
    { icon: '🏥', t: ['看病', 'Seeing a doctor'], d: ['下园社康中心在教学楼 D 栋下首层；上园服务中心另有执业点。可刷社保卡。AI 预问诊只是辅助，诊断听医生的。', 'The Lower Campus health centre is on the lower ground floor of Teaching D; another point is in the Upper Campus Service Centre. AI pre-consultation only assists — the doctor decides.'] },
    { icon: '💗', t: ['心理支持', 'Counselling'], d: ['学生中心四楼设有一对一心理咨询室。求助是成熟的表现，不是软弱。预约方式见学校官网。', 'One-to-one counselling rooms are on 4F of the Student Centre. Asking for help is a strength. See the official site to book.'] },
    { icon: '💼', t: ['职业规划（CPDO）', 'Careers (CPDO)'], d: ['职业规划与发展处在学生中心 304：简历修改、模拟面试、一对一咨询；招聘会常在 301 多功能厅。', 'CPDO is in Student Centre 304: résumé clinics, mock interviews, 1-on-1 advising; job fairs are often in hall 301.'] },
    { icon: '🏠', t: ['书院生活', 'College life'], d: ['书院是你的"家"：室友公约、导师、高桌晚宴都在这里发生。晚宴穿学生袍与正装，祝酒用葡萄汁，碰杯碰杯肚。', 'Your college is home: roommate agreements, tutors and High Table. Wear the gown with formal dress; toasts use grape juice — clink at the bowl of the glass.'] },
    { icon: '🏃', t: ['新生杯彩色跑', 'Freshman Cup Color Run'], d: ['每年新生杯的开幕活动：沿下园道路设 5 个彩粉站，终点还有水球大战。', 'The opener of the annual Freshman Cup: five powder stations around the Lower Campus and a water-balloon fight at the finish.'] },
    { icon: '🧪', t: ['实验室安全', 'Lab safety'], d: ['进实验室先穿实验服、戴护目镜和手套；离心机要对称配平；不带食物饮料进入。', 'Lab coat, goggles and gloves first; always balance the centrifuge; no food or drink.'] },
    { icon: '🚌', t: ['校内交通', 'Getting around'], d: ['上园、中园、下园之间可乘校巴；共享单车扫码即骑，注意礼让行人。', 'Shuttles link the Upper, Middle and Lower campuses; shared bikes unlock by scan — give way to pedestrians.'] },
    { icon: '🆘', t: ['紧急情况', 'Emergencies'], d: ['遇到紧急情况请拨打 120 / 110，或立即联系校园保安与书院值班老师。', 'In an emergency dial 120 / 110, or contact campus security and your college duty tutor at once.'] }
  ];

  C.stops = [
    { name: ['下园 · 大学图书馆', 'Lower · University Library'], d: ['教学楼群、学生中心', 'Teaching buildings, Student Centre'], at: '大学图书馆' },
    { name: ['下园 · 启动区钟楼', 'Lower · Bell Tower'], d: ['诚道楼、志仁楼、逸夫书院', 'Start-up Zone, Shaw College'], at: 'plaza' },
    { name: ['下园 · 体育馆', 'Lower · Sports Hall'], d: ['田径场、综合运动馆', 'Track, Sports Complex'], at: '大学体育馆' },
    { name: ['下园 · 正门', 'Lower · Main Gate'], d: ['龙翔大道', 'Longxiang Boulevard'], at: 'gate' },
    { name: ['上园 · 服务中心', 'Upper · Amenity Centre'], d: ['思廷、学勤、道扬书院', 'Muse, Diligentia, Ling'], at: '服务中心' },
    { name: ['上园 · 厚含书院', 'Upper · Minerva College'], d: ['永平书院、教职工宿舍', 'Yongping College, staff housing'], at: '厚含书院' },
    { name: ['中园 · 音乐学院', 'Middle · School of Music'], d: ['第八书院、神仙湖', 'The Eighth College, Shenxian Lake'], at: 'concert' }
  ];

  C.landmarks = [
    { id: 'lib', at: '大学图书馆', r: 30, name: ['大学图书馆', 'University Library'], d: ['白色体量横跨中轴，门前是一方睡莲池。', 'A white volume bridging the mall, fronted by a water-lily pond.'] },
    { id: 'tower', at: '钟楼', r: 26, name: ['钟楼', 'Clock Tower'], d: ['取意密檐塔的十四层檐，同学们叫它“薯塔”。', 'Fourteen tiers of eaves after a Chinese pagoda — students call it the “Potato Tower”.'] },
    { id: 'plaza', at: 'plaza', r: 26, name: ['启动区广场', 'Main Square'], d: ['知新楼与道远楼前的广场，大学最初的起点。', 'The square in front of Zhi Xin and Dao Yuan, where the university began.'] },
    { id: 'admin', at: '行政楼', r: 30, name: ['行政楼广场', 'Administration Square'], d: ['彩色跑的起点，也是新生拍照热点。', 'Start line of the Color Run and a favourite photo spot.'] },
    { id: 'shawcc', at: '逸夫国际会议中心', r: 28, name: ['逸夫国际会议中心', 'Shaw Conference Centre'], d: ['大师讲座与校长面对面在这里举行。', 'Home to big talks and town halls.'] },
    { id: 'liwen', at: '礼文堂', r: 26, name: ['礼文堂', 'Liwen Hall'], d: ['高桌晚宴与典礼的场地。', 'Venue for High Table and ceremonies.'] },
    { id: 'sc', at: '学生中心', r: 28, name: ['学生中心', 'Student Centre'], d: ['CPDO、心理咨询、饭堂、排练室一站式。', 'CPDO, counselling, canteen and rehearsal rooms.'] },
    { id: 'td', at: '教学楼D', r: 26, name: ['教学楼群', 'Teaching Buildings'], d: ['W 形的教学楼群，TD 下首层有社康中心。', 'The W-shaped teaching cluster; the clinic is under TD.'] },
    { id: 'gym', at: '大学体育馆', r: 30, name: ['大学体育馆', 'University Sports Hall'], d: ['挥汗如雨的地方。', 'Where the sweat happens.'] },
    { id: 'track', at: 'track', r: 40, name: ['田径场', 'Track & Field'], d: ['夜跑圣地。', 'The night-run favourite.'] },
    { id: 'gate', at: 'gateSign', r: 22, name: ['正门', 'Main Gate'], d: ['龙翔大道上的主入口，正对教学楼群。', 'The main entrance on Longxiang Boulevard, facing the teaching blocks.'] },
    { id: 'shaw', at: '逸夫书院A栋', r: 28, name: ['逸夫书院', 'Shaw College'], d: ['大学的第一所书院，也是唯一位于下园的书院。', 'The first college, and the only one on the Lower Campus.'] },
    { id: 'service', at: '服务中心', r: 28, name: ['上园服务中心', 'Amenity Centre'], d: ['便利店、银行、餐饮，生活所需都在这。', 'Shop, bank and food — daily life sorted.'] },
    { id: 'diligentia', at: '学勤书院A座', r: 28, name: ['学勤书院', 'Diligentia College'], d: ['淡黄色外墙的书院，楼下有麦当劳。', "Pale-yellow walls, and a McDonald's downstairs."] },
    { id: 'minerva', at: '厚含书院', r: 30, name: ['厚含书院', 'Minerva College'], d: ['橙白配色，位于上园最北端的高台上。', 'Orange and white, on the high terrace at the north end.'] },
    { id: 'music', at: 'concert', r: 34, name: ['音乐学院', 'School of Music'], d: ['白色的音乐厅像卵石一样落在山脚下。', 'Concert halls like white pebbles at the foot of the hill.'] },
    { id: 'peak', at: 'peak', r: 26, name: ['铜鼓岭', 'Tonggu Ridge'], d: ['上园与下园之间的山体，海拔约 146 米；"山—林—院"的规划把它完整保留。', 'The hill between the Upper and Lower campuses, about 146 m; the campus plan left it untouched.'] },
    { id: 'reservoir', at: 'reservoir', r: 40, name: ['神仙湖', 'Shenxian Lake'], d: ['即神仙岭水库。湖畔正在建设医学院的神仙湖校园。', 'Shenxianling Reservoir; the lakeside campus for the School of Medicine is rising on its shore.'] },
    { id: 'pond', at: 'pond', r: 34, name: ['会议中心湖畔', 'Lakeside by the Conference Centre'], d: ['会议中心临湖而建，背后就是铜鼓岭。', 'The conference centre overlooks this pond, with Tonggu Ridge behind.'] },
    { id: 'crystal', at: 'crystal', r: 60, name: ['大运中心"水晶石"', 'Universiade "Crystal"'], d: ['2011 年世界大学生运动会主场馆。', 'Main stadium of the 2011 Summer Universiade.'] }
  ];
  C.cats = [
    { id: 'c1', at: '大学图书馆', off: [9, 6], name: ['学霸', 'Scholar'], fur: 0xe9a55a, d: ['总在图书馆门口"监督"大家学习。', 'Supervises studying at the library door.'] },
    { id: 'c2', at: '逸夫书院A栋', off: [-7, 5], name: ['大橘', 'Big Orange'], fur: 0xf08a2a, d: ['十只橘猫九只胖。', 'Nine in ten orange cats are chonky.'] },
    { id: 'c3', at: '学生中心', off: [10, -4], name: ['奶茶', 'Milk Tea'], fur: 0xd9c2a3, d: ['喜欢蹭社团活动的热闹。', 'Loves crashing club events.'] },
    { id: 'c4', at: 'plaza', off: [8, 8], name: ['警长', 'Sheriff'], fur: 0x2b2b30, d: ['黑白分明，巡视启动区。', 'Patrols the Start-up Zone in black and white.'] },
    { id: 'c5', at: 'track', off: [30, -20], name: ['闪电', 'Bolt'], fur: 0x9a9aa2, d: ['田径场上最快的不是你。', "You're not the fastest on this track."] },
    { id: 'c6', at: '教学楼D', off: [-8, 7], name: ['DDL', 'Deadline'], fur: 0xf2f2ee, d: ['总在你最忙的时候出现。', 'Always shows up when you are busiest.'] },
    { id: 'c7', at: '服务中心', off: [8, 6], name: ['便利', 'Convenience'], fur: 0xc98f62, d: ['守着便利店等投喂。', 'Guards the shop, hoping for snacks.'] },
    { id: 'c8', at: '思廷书院A座', off: [-6, 8], name: ['缪斯', 'Muse'], fur: 0x6b5b4b, d: ['灵感女神本猫。', 'The muse herself.'] },
    { id: 'c9', at: 'concert', off: [12, 8], name: ['哆来咪', 'Do-Re-Mi'], fur: 0xe8d9b0, d: ['听得懂和弦进行。', 'Understands chord progressions.'] },
    { id: 'c10', at: '礼文堂', off: [7, 7], name: ['绅士', 'Gentleman'], fur: 0x33333a, d: ['自带"燕尾服"的奶牛猫。', 'A tuxedo cat, always dressed for High Table.'] }
  ];
  C.chatter = [
    ['今晚去图书馆吗？', 'Library tonight?'], ['TD 的电梯又在排队…', 'The TD lift queue again…'], ['DDL 是第一生产力。', 'Deadlines are the real motivation.'], ['饭堂还是外卖？', 'Canteen or delivery?'],
    ['Quiz 考得怎么样？', "How was the quiz?"], ['下午还有 tutorial。', 'Got a tutorial this afternoon.'], ['周末去爬神仙岭吧！', "Let's hike Shenxian Ridge this weekend!"], ['社团招新你报了几个？', 'How many clubs did you sign up for?'],
    ['这学期想选一门没碰过的课。', 'I want to pick a course I have never tried.'], ['高桌晚宴的袍子借到了吗？', 'Got your gown for High Table?'], ['彩色跑的衣服洗不掉了哈哈。', "My Color Run shirt will never be white again."], ['Office hour 去问问教授吧。', "Let's ask at office hours."],
    ['校巴来了快跑！', 'Shuttle is here, run!'], ['今天的晚霞好美。', "Tonight's sunset is gorgeous."], ['Hi~', 'Hi~'], ['加油！', 'You got this!'], ['Group project 约几点？', 'What time for the group project?'], ['我去 CPDO 改个简历。', "Off to CPDO to fix my résumé."]
  ];

  // dialogue portraits
  Object.assign(ui.AV, {
    sys: { kind: 'sys', icon: '📱', name: ['手机', 'Phone'] }, narr: { kind: 'sys', icon: '📖', name: ['', ''] },
    roommate: { skin: 1, hair: 0, top: 2, name: ['室友 小航', 'Roommate Hang'] }, lin: { skin: 0, hair: 2, top: 1, style: 1, name: ['O营组长 林晓', 'O-Leader Lin'] },
    sofia: { skin: 4, hair: 3, top: 7, style: 1, name: ['交换生 Sofia', 'Sofia (exchange)'] }, tutor: { skin: 1, hair: 0, top: 9, glasses: true, kind: 'suit', name: ['书院导师 陈老师', 'College Tutor Ms Chen'] },
    librarian: { skin: 0, hair: 1, top: 4, style: 1, glasses: true, name: ['图书馆员', 'Librarian'] }, prof: { skin: 1, hair: 0, top: 6, glasses: true, kind: 'suit', tie: '#3b5a9a', name: ['王教授', 'Prof. Wang'] },
    ta: { skin: 2, hair: 0, top: 8, name: ['助教 Kevin', 'TA Kevin'] }, huatuo: { kind: 'ai', bg: '#0e3d3a', bg2: '#06201e', name: ['华佗GPT · AI 预问诊', 'HuatuoGPT · AI pre-consultation'] },
    doctor: { skin: 0, hair: 0, top: 4, kind: 'doctor', glasses: true, name: ['李医生', 'Dr Li'] }, master: { skin: 1, hair: 4, top: 6, kind: 'gown', gray: true, glasses: true, name: ['书院院长', 'College Master'] },
    guest: { skin: 4, hair: 4, top: 6, kind: 'gown', gray: true, name: ['主礼嘉宾', 'Guest of Honour'] }, counselor: { skin: 0, hair: 2, top: 2, style: 1, name: ['咨询师 周老师', 'Counsellor Ms Zhou'] },
    cpdo: { skin: 0, hair: 1, top: 3, style: 1, kind: 'suit', tie: '#e5b53b', name: ['CPDO 顾问 Grace', 'CPDO Adviser Grace'] }, hr: { skin: 2, hair: 0, top: 6, kind: 'suit', name: ['面试官', 'Interviewer'] },
    labta: { skin: 0, hair: 0, top: 5, kind: 'lab', glasses: true, style: 1, name: ['实验员 赵老师', 'Lab Instructor Ms Zhao'] }, conductor: { skin: 1, hair: 4, top: 6, kind: 'suit', gray: true, name: ['乐团指挥', 'Conductor'] },
    guard: { skin: 2, hair: 0, top: 4, cap: '#2f3a56', name: ['保安大叔', 'Security Guard'] }, mc: { skin: 0, hair: 2, top: 0, style: 1, kind: 'suit', tie: '#5b2d90', name: ['主持人', 'Host'] },
    peer: { skin: 0, hair: 3, top: 3, name: ['同学', 'Classmate'] }, coach: { skin: 2, hair: 0, top: 3, cap: '#c0392b', name: ['体育老师', 'Coach'] },
    president: { img: (window.PRESIDENT || {}).portrait, skin: 0, hair: 4, top: 6, kind: 'pres', gray: true, glasses: true, name: (window.PRESIDENT || {}).name || ['校长', 'President'] }
  });

  // ------------------------------------------------------------ named positions
  const POS = {};
  C.pos = function (key) {
    if (!key) return null; if (typeof key === 'object') return key;
    if (key === 'dorm') return C.pos(C.colleges[G.S().college].b);
    if (POS[key]) return POS[key];
    const b = W.find(key); if (b) { const d = W.door(b); return POS[key] = { x: d.x, z: d.z, h: Math.atan2(-d.nx, -d.nz), nx: d.nx, nz: d.nz, b }; }
    console.warn('unknown place', key); return null;
  };
  // point offset from a place: f metres out from the wall, r metres to the right (when facing the building)
  C.off = function (key, f, r) { const p = C.pos(key); if (!p) return null; const nx = p.nx == null ? Math.sin(p.h + Math.PI) : p.nx, nz = p.nz == null ? Math.cos(p.h + Math.PI) : p.nz; let x = p.x + nx * f - nz * r, z = p.z + nz * f + nx * r; const t = { x, z }; G.col.resolve(t, 0.6); return { x: t.x, z: t.z, h: Math.atan2(-nx, -nz), nx, nz }; };
  C.resolve = function () {
    const snap = (x, z) => { const e = G.nav.nearestEdge(x, z, { maxd: 200 }); return e ? { x: e.x, z: e.z } : { x, z }; };
    // main gate: gate node on the campus side of Longxiang Blvd next to the teaching buildings
    let g = null, gd = 1e9; for (const p of W.pois) if (p.kind === 'gate') { const d = G.dist(p.x, p.z, 743, -165); if (d < gd) { gd = d; g = p; } }
    const lib = W.door(W.find('大学图书馆')); let dx = lib.x - g.x, dz = lib.z - g.z; const l0 = Math.hypot(dx, dz); dx /= l0; dz /= l0;
    const inside = snap(g.x + dx * 22, g.z + dz * 22); POS.gate = { x: inside.x, z: inside.z, h: Math.atan2(dx, dz) }; C.gateNode = g; C.gateDir = [dx, dz];
    POS.gateSign = { x: g.x - dx * 4, z: g.z - dz * 4, h: Math.atan2(-dx, -dz), nx: -dx, nz: -dz };
    const area = (pred) => W.areas.find(pred);
    const pl = area(a => a.name === '启动区广场'), tr = area(a => a.kind === 'trackfield' && a.campus === 'lower'), ct = area(a => a.kind === 'pitch' && a.sport === 'basketball' && a.campus === 'lower');
    if (pl) POS.plaza = Object.assign(snap(pl.cx, pl.cz), { h: 0 }); if (tr) { POS.track = { x: tr.cx, z: tr.cz, h: 0 }; C.trackArea = tr; } if (ct) { POS.court = { x: ct.cx, z: ct.cz, h: 0 }; C.courtArea = ct; }
    const mb = W.find('音乐学院音乐厅'); if (mb) { const d = W.door(mb); POS.concert = { x: d.x, z: d.z, h: Math.atan2(-d.nx, -d.nz), nx: d.nx, nz: d.nz, b: mb }; }
    const pk = W.pois.find(p => p.kind === 'peak' && p.zh === '铜鼓岭'); if (pk) POS.peak = Object.assign(snap(pk.x, pk.z), { h: 2.4 });
    const rv = area(a => a.kind === 'water' && a.name); if (rv) POS.reservoir = Object.assign(snap(rv.maxx - 20, rv.cz - 60), { h: -1.6 });
    const cc = W.find('逸夫国际会议中心'), pond = W.areas.filter(a => a.kind === 'water' && !a.name && a.area > 1500).sort((a, b) => G.dist(a.cx, a.cz, cc.cx, cc.cz) - G.dist(b.cx, b.cz, cc.cx, cc.cz))[0]; if (pond) { const q = W.closestOnRing(cc.cx, cc.cz, pond.ring), e = snap(q.x, q.z); POS.pond = { x: e.x, z: e.z, h: 3 }; }
    const st = W.find('大运中心体育场'); if (st) POS.crystal = Object.assign(snap(st.cx - 150, st.cz + 150), { h: 0.8 });
    const sc = C.pos('学生中心'); POS.fair = C.off('学生中心', 16, 0); POS.adminsq = C.off('行政楼', 14, 0);
  };

  // ------------------------------------------------------------ cats
  function catModel(fur) {
    const g = new THREE.Group(), m = new THREE.MeshLambertMaterial({ color: fur }), d = new THREE.MeshLambertMaterial({ color: 0x1a1a1e });
    const add = (w, h, dd, x, y, z, mat = m) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, dd), mat); b.position.set(x, y, z); b.castShadow = true; g.add(b); return b; };
    add(0.26, 0.24, 0.5, 0, 0.26, 0); add(0.26, 0.24, 0.24, 0, 0.46, 0.3); add(0.07, 0.1, 0.05, 0.09, 0.62, 0.3); add(0.07, 0.1, 0.05, -0.09, 0.62, 0.3);
    for (const [x, z] of [[0.09, 0.2], [-0.09, 0.2], [0.09, -0.2], [-0.09, -0.2]]) add(0.07, 0.16, 0.07, x, 0.08, z);
    add(0.03, 0.04, 0.02, 0.06, 0.48, 0.425, d); add(0.03, 0.04, 0.02, -0.06, 0.48, 0.425, d);
    const tail = add(0.06, 0.34, 0.06, 0, 0.5, -0.27); tail.geometry.translate(0, 0.12, 0); g.userData.tail = tail; return g;
  }
  C.catObjs = [];
  let spawned = false;
  C.spawnWorld = function () {
    if (spawned) return; spawned = true; const scene = G.scene;
    // entrance sign
    const gs = POS.gateSign, e = G.nav.nearestEdge(C.gateNode.x, C.gateNode.z, { maxd: 80, pred: q => /primary|secondary/.test(q.road.kind) });
    if (e) { const ax = W.nodes[e.e.a * 2], az = W.nodes[e.e.a * 2 + 1], ux0 = W.nodes[e.e.b * 2] - ax, uz0 = W.nodes[e.e.b * 2 + 1] - az, ul = Math.hypot(ux0, uz0) || 1, ux = ux0 / ul, uz = uz0 / ul; W.signWall(scene, gs.x + ux * 17, gs.z + uz * 17, Math.atan2(gs.nx, gs.nz), ['香港中文大學（深圳）', 'The Chinese University of Hong Kong, Shenzhen']); }
    // shared bikes & carts
    const racks = ['gate', '大学图书馆', '学生中心', '教学楼B', '教学楼D', 'plaza', '大学体育馆', '逸夫书院A栋', '行政楼', '礼文堂', '李贤义楼', '服务中心', '学勤书院A座', '思廷书院A座', '祥波书院A座', '道扬书院', '厚含书院', '永平书院', 'concert', '第八书院', '逸夫国际会议中心'];
    for (const k of racks) { for (let i = 0; i < 3; i++) { const p = k === 'gate' ? { x: POS.gate.x + C.gateDir[1] * (5 + i * 0.9), z: POS.gate.z - C.gateDir[0] * (5 + i * 0.9), h: POS.gate.h } : C.off(k, 3.4, 5 + i * 0.95); if (p && !W.buildingAt(p.x, p.z)) G.veh.spawn('bike', p.x, p.z, p.h + Math.PI / 2 + 0.2); } }
    for (const k of ['gate', '行政楼', '服务中心']) { const p = k === 'gate' ? { x: POS.gate.x - C.gateDir[1] * 7, z: POS.gate.z + C.gateDir[0] * 7, h: POS.gate.h } : C.off(k, 6, -9); if (p && !W.buildingAt(p.x, p.z)) G.veh.spawn('cart', p.x, p.z, p.h); }
    // cats
    for (const c of C.cats) {
      const p = C.off(c.at, c.off[0], c.off[1]) || C.pos(c.at); if (!p) continue; const m = catModel(c.fur), y = W.ground(p.x, p.z); m.position.set(p.x, y, p.z); m.rotation.y = Math.random() * 6.28; scene.add(m);
      const o = { def: c, x: p.x, z: p.z, y, m }; C.catObjs.push(o);
      G.inter.add({ x: p.x, z: p.z, r: 2.0, label: () => L('撸猫', 'Pet the cat') + ' · ' + G.tx(c.name), act: () => C.petCat(o) });
    }
    // landmark discovery
    for (const lm of C.landmarks) { const p = C.pos(lm.at); if (!p) continue; lm.p = p; G.inter.zone({ x: p.x, z: p.z, r: lm.r, enter: () => C.discover(lm) }); }
    // security guard at the main gate
    const gp = { x: C.gateNode.x + C.gateDir[1] * 5 + C.gateDir[0] * 3, z: C.gateNode.z - C.gateDir[0] * 5 + C.gateDir[1] * 3 };
    G.crowd.addNamed({ x: gp.x, z: gp.z, h: Math.atan2(-C.gateDir[0], -C.gateDir[1]), name: ui.AV.guard.name, top: 0x3b5a8a, pants: 0x2f3a56, hair: 0x1d1a19, pack: 0, talk: () => ui.dialog([{ av: 'guard', text: G.pick([['同学，骑车慢一点，礼让行人。校园里限速，安全第一！', 'Slow down on the bike and give way to pedestrians — safety first on campus!'], ['迷路了就看小地图，或者按 M 打开大地图点一栋楼导航。', 'Lost? Check the minimap, or press M and tap a building to navigate.'], ['上园、中园有点远，可以用手机里的"校巴快线"。', 'The Upper and Middle campuses are a hike — try the Shuttle app on your phone.']]) }]) });
    G.on('hour', hh => { const t = W.tower; if (!t || G.mode !== 'play') return; const d = G.dist(G.player.pos.x, G.player.pos.z, t.cx, t.cz); if (d < 520 && hh >= 7 && hh <= 22) { const v = G.clamp(1 - d / 520, 0.15, 1) * 0.22; for (let i = 0; i < Math.min(3, (hh % 12) || 12); i++) G.audio.bell(330, 3.2, v, G.audio.now() + i * 1.4); } });
    G.on('bump', n => { G.crowd.say(n, G.pick([['哎呀！慢点骑！', 'Whoa! Slow down!'], ['看路呀同学！', 'Watch where you are going!']]), 2.2); ui.toast(L('⚠️ 文明骑行：请礼让行人。', '⚠️ Ride politely — give way to pedestrians.')); G.audio.sfx('bad'); });
  };
  C.petCat = function (o) {
    const S = G.S(), c = o.def; G.audio.sfx('meow'); G.fx.burst({ x: o.x, y: o.y + 0.7, z: o.z, n: 10, colors: [0xff8fb0, 0xffc0d0], speed: 1.6, up: 1.3, size: 0.16, life: 1.1, gravity: -0.6 });
    o.m.rotation.y = Math.atan2(G.player.pos.x - o.x, G.player.pos.z - o.z);
    if (!S.cats[c.id]) { S.cats[c.id] = 1; ui.banner(L('校园猫图鉴', 'CAMPUS CAT'), G.tx(c.name), G.tx(c.d)); ui.gain({ well: 3 }); G.emit('cat', c); } else ui.toast(`🐱 ${G.tx(c.name)}：${L('喵~（心情变好了）', 'Meow~ (you feel better)')}`);
    G.player.stamina = 1;
  };
  C.discover = function (lm) {
    const S = G.S(); if (S.found[lm.id] || G.mode !== 'play' || G.visitor && false) return; S.found[lm.id] = 1; G.audio.sfx('pick');
    ui.banner(L('发现地标', 'LANDMARK DISCOVERED'), G.tx(lm.name), G.tx(lm.d)); ui.gain({ culture: 2 }, true); G.emit('found', lm); G.save.store();
  };
  C.update = function (dt) { for (const o of C.catObjs) { const t = o.m.userData.tail; if (t) t.rotation.z = Math.sin(G.t * 2 + o.x) * 0.5; } };
  // ambient student chatter near the player
  let chatT = 4;
  C.chatterTick = function (dt) {
    chatT -= dt; if (chatT > 0 || ui.busy() || (G.missions.active && G.missions.quiet)) return; chatT = 5 + Math.random() * 7;
    const P = G.player, near = G.crowd.list.filter(n => !n.named && !n.scripted && n.state !== 'off' && G.dist(n.x, n.z, P.pos.x, P.pos.z) < 13); if (near.length) G.crowd.say(G.pick(near), G.pick(C.chatter), 2.8);
  };
})();

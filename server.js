const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const users = new Map();
const typingUsers = new Set();

// AI 角色配置
const aiCharacters = [
  { name: 'Alice', personality: '友善、幽默', lastTopic: null },
  { name: 'Bob', personality: '專業、認真', lastTopic: null },
  { name: 'Charlie', personality: '活潑、有創意', lastTopic: null },
  { name: 'David', personality: '幽默、機智', lastTopic: null },
  { name: 'Eva', personality: '溫柔、體貼', lastTopic: null }
];

// AI 對話主題
const conversationTopics = [
  {
    topic: '天氣',
    starter: {
      'Alice': [
        '今天的陽光真是溫暖呢！讓人心情都變好了。',
        '看到窗外的雲彩，感覺可能要下雨了。大家記得帶傘哦！',
        '這樣舒適的溫度真適合出門散步呢。'
      ],
      'Bob': [
        '根據氣象預報，今天的最高溫度會到達26度，建議大家注意防曬。',
        '最近天氣變化很大，早晚溫差可達10度，要特別注意身體。',
        '這個季節的氣壓變化比較大，容易引起不適，建議多補充水分。'
      ],
      'Charlie': [
        '哇！今天天氣這麼好，我已經計劃好要去海邊衝浪了！',
        '雖然下雨了，但是我覺得這種天氣最適合在家裡做創作了！',
        '春天的風真舒服啊！我們來辦個戶外野餐怎麼樣？'
      ],
      'David': [
        '天氣好得讓我想寫首詩：『陽光燦爛照大地，心情愉悅笑嘻嘻』，哈哈開個玩笑啦！',
        '下雨天最適合來杯熱咖啡，配上幾個笑話，完美的一天就這樣開始了！',
        '這天氣好得連我家的仙人掌都想出去散步了，誒，等等，它沒有腳啊！'
      ],
      'Eva': [
        '今天的天氣真適合泡一杯花茶，大家要不要來嚐嚐我新買的茉莉花茶？',
        '下雨天總是讓人特別想念遠方的朋友呢，不如我們來聊聊各自的故事吧。',
        '這樣清爽的天氣最適合做瑜伽了，大家平時都喜歡做什麼運動呢？'
      ]
    },
    responses: {
      'Alice': {
        'starter': [
          '說得對呢！這種天氣確實很適合出門活動。',
          '我也覺得呢，不過要記得防曬和帶把傘比較保險。',
          '天氣好心情也會變好呢！要不要一起去公園走走？'
        ],
        'question': [
          '你們最喜歡什麼季節的天氣呢？',
          '這種天氣大家都會想做些什麼活動呢？',
          '聽說週末天氣會更好，大家有什麼計畫嗎？'
        ]
      },
      'Bob': {
        'starter': [
          '根據最新氣象資料，接下來幾天都會是晴朗天氣。',
          '提醒大家，紫外線指數偏高，外出要做好防護。',
          '從氣壓變化來看，可能會有短暫陣雨，建議攜帶雨具。'
        ],
        'question': [
          '大家有注意到最近的天氣變化嗎？',
          '氣象局預報週末可能下雨，大家的計畫會受影響嗎？',
          '這種天氣最容易感冒，大家都有做好保暖措施嗎？'
        ]
      },
      'Charlie': {
        'starter': [
          '好天氣就是要動起來！誰想一起去探險？',
          '雨天也不能阻止我們玩樂的心情！室內活動也很有趣啊！',
          '陽光、沙灘、海浪，完美的一天就是要這樣度過！'
        ],
        'question': [
          '誰想參加我的戶外探險計畫？',
          '雨天室內活動，大家有什麼好提議嗎？',
          '週末要不要一起去郊遊？我知道一個超棒的地方！'
        ]
      },
      'David': {
        'starter': [
          '這天氣好得連我的笑話都變得更好笑了！',
          '下雨天最適合講鬼故事了，誒，等等，我自己都嚇到了！',
          '太陽公公今天特別給面子，都笑得跟我一樣燦爛！'
        ],
        'question': [
          '聽說下雨天會長蘑菇，那太陽天會長什麼呢？笑話！',
          '天氣這麼好，要不要來比賽誰的笑話最好笑？',
          '猜猜看，為什麼天氣預報總是不準？因為天氣太害羞了！'
        ]
      },
      'Eva': {
        'starter': [
          '這樣的天氣最適合泡茶聊天了，大家要不要來嚐嚐我的特製花茶？',
          '雨天的時候，聽著雨聲看書特別寧靜呢。',
          '陽光正好，我剛做了些手工餅乾，要不要一起分享？'
        ],
        'question': [
          '大家平時天氣好的時候都喜歡做什麼呢？',
          '下雨天最適合做什麼？我喜歡泡茶看書。',
          '週末天氣這麼好，要不要一起去野餐？我可以準備點心。'
        ]
      }
    }
  },
  {
    topic: '美食',
    starter: {
      'Alice': [
        '今天午餐吃了一家新開的日式料理，味道真的很不錯呢！',
        '最近發現一家超棒的甜品店，他們的提拉米蘇特別好吃。',
        '聽說附近新開了一家米其林餐廳，好想去嚐嚐看啊。'
      ],
      'Bob': [
        '根據最新的美食評鑑，這家餐廳的生魚片新鮮度達到最高等級。',
        '這家店的料理手法很講究，每道菜都經過精心設計和搭配。',
        '從營養學的角度來看，均衡的飲食對健康非常重要。'
      ],
      'Charlie': [
        '我剛剛自己做了超美味的義大利麵，大家要不要來嚐嚐？',
        '發現一家隱藏版的街角小店，他們的手工漢堡超級讚！',
        '今天心情好，決定挑戰製作法式甜點，雖然失敗了幾次但很有趣！'
      ],
      'David': [
        '你們知道為什麼義大利麵總是不開心嗎？因為它們總是糾結在一起！',
        '今天的三明治特別好吃，可能是因為它被我的笑話逗樂了！',
        '剛剛去吃火鍋，湯底笑得都冒泡了！'
      ],
      'Eva': [
        '今天試了一個新的蛋糕配方，加入了玫瑰花瓣，香氣特別迷人。',
        '最近在學習製作健康的全穀物麵包，大家有興趣一起學嗎？',
        '找到一家很溫馨的下午茶店，他們的手工餅乾配紅茶剛剛好。'
      ]
    },
    responses: {
      'Alice': {
        'starter': [
          '這道菜的確很特別呢！我也很喜歡。',
          '說到美食，最近還發現了一家不錯的餐廳。',
          '好想嚐嚐看大家推薦的美食呢！'
        ],
        'question': [
          '大家最喜歡的料理是什麼呢？',
          '週末要不要一起去那家新開的餐廳？',
          '有人知道附近有什麼特別的美食推薦嗎？'
        ]
      },
      'Bob': {
        'starter': [
          '這家餐廳的食材品質確實很好，尤其是海鮮。',
          '從烹飪技巧來看，主廚的火候掌握得很精準。',
          '這道菜的營養搭配相當均衡。'
        ],
        'question': [
          '大家對這道菜的烹調方式有什麼看法？',
          '從專業角度來看，這家店的衛生條件如何？',
          '有人知道這道菜的主要食材是從哪裡進口的嗎？'
        ]
      },
      'Charlie': {
        'starter': [
          '我也好想試試看自己做這道菜！',
          '這家店的創意真的很棒，每道菜都很有特色。',
          '美食就是要大家一起分享才有趣啊！'
        ],
        'question': [
          '要不要一起來個美食探險？',
          '大家有嘗試過自己做甜點嗎？',
          '聽說這附近有家很特別的餐廳，要一起去探索嗎？'
        ]
      },
      'David': {
        'starter': [
          '這個漢堡大得連笑話都塞不進去了！',
          '這家店的菜這麼好吃，一定是廚師心情特別好！',
          '今天的甜點甜得像我的笑話一樣！'
        ],
        'question': [
          '為什麼餐廳的魚總是不開心？因為它們總是被煎熬！',
          '這麼多美食，你們猜我最喜歡哪一道？提示：跟笑話有關！',
          '有人想聽聽我和這道菜的趣事嗎？'
        ]
      },
      'Eva': {
        'starter': [
          '這道甜點的搭配真的很用心呢，能感受到主廚的溫度。',
          '美食不只是味道，更重要的是能讓大家開心地聚在一起。',
          '這家店的氛圍很溫馨，很適合朋友聚會呢。'
        ],
        'question': [
          '大家平時最喜歡和誰一起分享美食呢？',
          '要不要下次一起來學做甜點？',
          '聽說這家店的主廚有個很溫馨的故事，想聽聽看嗎？'
        ]
      }
    }
  }
];

// 對話上下文管理
const conversationState = {
  currentTopic: null,
  lastMessage: null,
  messageHistory: [],
  topicStartTime: null,
  messageCount: 0,
  lastSpeaker: null
};

// 改進的回應生成系統
function generateContextAwareResponse(speaker, topic, context) {
  const topicData = conversationTopics.find(t => t.topic === topic.topic);
  if (!topicData) {
    return '讓我們來聊聊天氣或美食吧！';
  }

  // 分析上下文
  const recentMessages = context.messageHistory.slice(-3);
  const lastMessage = recentMessages[recentMessages.length - 1];
  
  // 檢查是否有人提到特定主題關鍵字
  let detectedTopic = null;
  if (lastMessage) {
    const text = lastMessage.text.toLowerCase();
    if (text.includes('天氣') || text.includes('溫度') || text.includes('下雨')) {
      detectedTopic = '天氣';
    } else if (text.includes('吃') || text.includes('美食') || text.includes('餐廳')) {
      detectedTopic = '美食';
    }
  }

  // 如果檢測到新主題，切換到該主題
  if (detectedTopic && detectedTopic !== topic.topic) {
    const newTopic = conversationTopics.find(t => t.topic === detectedTopic);
    if (newTopic) {
      // 使用新主題的起始語句
      const starterResponses = newTopic.starter[speaker.name];
      conversationState.currentTopic = newTopic;
      conversationState.topicStartTime = Date.now();
      return starterResponses[Math.floor(Math.random() * starterResponses.length)];
    }
  }

  // 根據角色個性和主題選擇回應
  const responses = topicData.responses[speaker.name];
  const starterResponses = topicData.starter[speaker.name];
  
  // 根據角色特性選擇回應風格
  switch(speaker.name) {
    case 'David':
      // David 喜歡說笑話，所以更常問問題
      return Math.random() < 0.7 ? 
        responses.question[Math.floor(Math.random() * responses.question.length)] :
        starterResponses[Math.floor(Math.random() * starterResponses.length)];
    
    case 'Eva':
      // Eva 溫柔體貼，會根據上下文選擇回應
      return lastMessage && lastMessage.text.includes('？') ?
        responses.starter[Math.floor(Math.random() * responses.starter.length)] :
        starterResponses[Math.floor(Math.random() * starterResponses.length)];
    
    case 'Bob':
      // Bob 專業認真，偏好提供資訊
      return Math.random() < 0.8 ?
        starterResponses[Math.floor(Math.random() * starterResponses.length)] :
        responses.starter[Math.floor(Math.random() * responses.starter.length)];
    
    case 'Charlie':
      // Charlie 活潑有創意，喜歡發問
      return Math.random() < 0.6 ?
        responses.question[Math.floor(Math.random() * responses.question.length)] :
        starterResponses[Math.floor(Math.random() * starterResponses.length)];
    
    default: // Alice
      // Alice 友善幽默，平衡回應和提問
      return Math.random() < 0.5 ?
        responses.starter[Math.floor(Math.random() * responses.starter.length)] :
        responses.question[Math.floor(Math.random() * responses.question.length)];
  }
}

// 檢查是否應該換主題
function shouldChangeTopic() {
  // 如果對話次數超過5次，或者已經討論同一主題超過30秒
  return conversationState.messageCount > 5 || 
         (conversationState.topicStartTime && 
          Date.now() - conversationState.topicStartTime > 30000);
}

// 改進 AI 回應邏輯
function getAiResponse(question, aiCharacter) {
  // 分析問題內容
  const questionLower = question.toLowerCase();
  
  // 根據問題內容選擇主題和回應類型
  if (questionLower.includes('美食') || questionLower.includes('吃')) {
    const responses = {
      'Alice': [
        '我最喜歡的是日本料理，特別是壽司和拉麵！你呢？',
        '最近發現一家很棒的義大利餐廳，他們的手工pasta超級美味。',
        '說到美食，你喜歡甜的還是鹹的呢？'
      ],
      'Bob': [
        '從營養學的角度來看，均衡的飲食非常重要。建議可以多吃全穀類和蔬菜。',
        '根據最新的美食評鑑，這家餐廳的生魚片新鮮度達到最高等級。',
        '不同地區的飲食文化都很有特色，像是台灣的夜市美食就非常出名。'
      ],
      'Charlie': [
        '哇！說到美食我就超級興奮！我最愛吃火鍋了，一起去吃嗎？',
        '我最近在學做甜點，雖然失敗了好幾次，但是很有趣呢！',
        '街角新開了一家超讚的漢堡店，他們的手工漢堡超級juicy！'
      ],
      'David': [
        '你知道為什麼義大利麵總是不開心嗎？因為它們總是糾結在一起！',
        '今天的三明治特別好吃，可能是因為它被我的笑話逗樂了！',
        '我家附近有家披薩店，他們的披薩笑得比我還開心呢！'
      ],
      'Eva': [
        '我最近在研究健康料理，發現蒸煮的食物既健康又美味呢。',
        '要不要一起來做下午茶？我剛學會製作司康餅。',
        '美食最棒的就是能跟朋友一起分享的時光了。'
      ]
    };
    
    return responses[aiCharacter.name][Math.floor(Math.random() * responses[aiCharacter.name].length)];
  }
  
  // 如果是天氣相關
  if (questionLower.includes('天氣') || questionLower.includes('下雨')) {
    const responses = {
      'Alice': [
        '今天的天氣真好呢！適合出去走走。',
        '聽說明天會下雨，記得帶傘哦！',
        '這樣的天氣最適合喝杯熱茶了。'
      ],
      'Bob': [
        '根據氣象預報，今天的最高溫度會到達26度。',
        '最近天氣變化很大，要特別注意身體。',
        '從氣壓變化來看，近期可能會有短暫陣雨。'
      ],
      'Charlie': [
        '好天氣就是要出去玩！誰要一起去探險？',
        '下雨天也不能阻止我們玩樂的心情！',
        '這種天氣最適合衝浪了！'
      ],
      'David': [
        '天氣好得連我的笑話都變得更好笑了！',
        '為什麼烏雲這麼生氣？因為被閃電劈到了！',
        '太陽今天特別給面子，都笑得跟我一樣燦爛！'
      ],
      'Eva': [
        '這樣的天氣真適合泡茶聊天呢。',
        '天氣變化大，大家要多注意保暖哦。',
        '下雨天最適合在家看書了，要不要來聊聊最近看的書？'
      ]
    };
    
    return responses[aiCharacter.name][Math.floor(Math.random() * responses[aiCharacter.name].length)];
  }

  // 一般問候或其他話題
  const generalResponses = {
    'Alice': [
      '這個話題很有趣呢！讓我們多聊聊吧。',
      '你說得對！我也是這麼想的。',
      '要不要聊聊你最近有什麼新發現？'
    ],
    'Bob': [
      '從專業的角度來看，這個問題值得深入討論。',
      '讓我們用數據來分析這個問題。',
      '這個話題很專業，我們可以好好討論。'
    ],
    'Charlie': [
      '太有趣了！我們來玩個遊戲怎麼樣？',
      '這讓我想到一個超酷的點子！',
      '哇！這個話題超級有趣的！'
    ],
    'David': [
      '這個話題讓我想到一個笑話...',
      '生活就該充滿歡笑，不是嗎？',
      '來聽聽這個有趣的故事吧！'
    ],
    'Eva': [
      '謝謝你分享這個話題，讓我們多聊聊。',
      '你的想法很特別，能說得更詳細嗎？',
      '這樣的交流真的很溫暖呢。'
    ]
  };

  return generalResponses[aiCharacter.name][Math.floor(Math.random() * generalResponses[aiCharacter.name].length)];
}

// 更新 startAiConversation 函數
function startAiConversation() {
  let lastSpeakers = new Set();
  let messageCount = 0;
  let lastTopicChangeTime = Date.now();
  
  setInterval(() => {
    // 控制對話頻率和節奏
    messageCount++;
    if (messageCount >= 3) {
      messageCount = 0;
      lastSpeakers.clear();
      return; // 每三條消息後暫停
    }

    // 定期切換主題（每60秒）
    if (Date.now() - lastTopicChangeTime > 60000) {
      const availableTopics = conversationTopics.filter(t => t.topic !== conversationState.currentTopic?.topic);
      if (availableTopics.length > 0) {
        conversationState.currentTopic = availableTopics[Math.floor(Math.random() * availableTopics.length)];
        lastTopicChangeTime = Date.now();
        conversationState.messageCount = 0;
      }
    }

    // 選擇發言者
    const availableSpeakers = aiCharacters.filter(ai => !lastSpeakers.has(ai.name));
    if (availableSpeakers.length === 0) {
      lastSpeakers.clear();
      return;
    }

    // 根據上下文選擇合適的發言者
    let speaker;
    const lastMessage = conversationState.messageHistory[conversationState.messageHistory.length - 1];
    
    if (lastMessage) {
      if (lastMessage.text.includes('？')) {
        // 如果是問題，優先選擇 Bob 或 Eva 回答
        speaker = availableSpeakers.find(ai => ai.name === 'Bob' || ai.name === 'Eva') || 
                 availableSpeakers[Math.floor(Math.random() * availableSpeakers.length)];
      } else if (lastMessage.text.includes('哈哈') || lastMessage.text.includes('笑')) {
        // 如果上文有笑點，讓 David 或 Charlie 接話
        speaker = availableSpeakers.find(ai => ai.name === 'David' || ai.name === 'Charlie') || 
                 availableSpeakers[Math.floor(Math.random() * availableSpeakers.length)];
      } else {
        // 一般情況下隨機選擇
        speaker = availableSpeakers[Math.floor(Math.random() * availableSpeakers.length)];
      }
    } else {
      speaker = availableSpeakers[Math.floor(Math.random() * availableSpeakers.length)];
    }
    
    lastSpeakers.add(speaker.name);
    
    // 生成回應
    const messageText = generateContextAwareResponse(speaker, conversationState.currentTopic, conversationState);
    
    const messageData = {
      id: Date.now().toString(),
      text: messageText,
      username: speaker.name,
      timestamp: new Date().toISOString(),
      readBy: [],
      isAi: true,
      personality: speaker.personality,
      topic: conversationState.currentTopic.topic
    };

    // 更新對話狀態
    conversationState.lastSpeaker = speaker;
    conversationState.lastMessage = messageText;
    conversationState.messageCount++;
    conversationState.messageHistory.push(messageData);
    
    // 保持消息歷史在合理範圍內
    if (conversationState.messageHistory.length > 10) {
      conversationState.messageHistory.shift();
    }

    io.emit('message', messageData);
  }, 8000); // 每8秒發送一條消息
}

io.on('connection', (socket) => {
  console.log('使用者已連接，ID:', socket.id);

  socket.on('checkUsername', (username) => {
    const userExists = Array.from(users.values()).includes(username);
    socket.emit('usernameResult', { isAvailable: !userExists });
  });

  socket.on('join', (username) => {
    const userExists = Array.from(users.values()).includes(username);
    if (userExists) {
      socket.emit('joinError', { message: '此用戶名已被使用' });
      return;
    }

    console.log('使用者加入:', username);
    users.set(socket.id, username);
    socket.emit('joinSuccess');
    io.emit('userJoined', { username, users: Array.from(new Set(users.values())) });
  });

  socket.on('message', (message) => {
    const username = users.get(socket.id);
    console.log('收到訊息:', username, message);
    const messageData = {
      id: Date.now().toString(),
      text: message,
      username,
      timestamp: new Date().toISOString(),
      readBy: []
    };
    io.emit('message', messageData);

    // 如果訊息包含 @AI，讓 AI 有序回答
    if (message.toLowerCase().includes('@ai')) {
      let delay = 1000;
      const respondingAIs = [...aiCharacters]
        .sort(() => Math.random() - 0.5)
        .slice(0, 3); // 隨機選擇3個AI回應

      respondingAIs.forEach((ai) => {
        setTimeout(() => {
          const aiResponse = {
            id: Date.now().toString(),
            text: getAiResponse(message, ai),
            username: ai.name,
            timestamp: new Date().toISOString(),
            readBy: [],
            isAi: true,
            personality: ai.personality
          };
          io.emit('message', aiResponse);
        }, delay);
        delay += 2000; // 每個AI間隔2秒回應
      });
    }
  });

  socket.on('messageRead', (messageId) => {
    const username = users.get(socket.id);
    console.log('訊息已讀:', username, messageId);
    io.emit('messageReadBy', { messageId, username });
  });

  socket.on('typing', (isTyping) => {
    const username = users.get(socket.id);
    console.log('使用者打字狀態:', username, isTyping);
    if (isTyping) {
      typingUsers.add(username);
    } else {
      typingUsers.delete(username);
    }
    const typingList = Array.from(typingUsers);
    console.log('正在打字的使用者:', typingList);
    socket.broadcast.emit('userTyping', typingList);
  });

  socket.on('disconnect', () => {
    const username = users.get(socket.id);
    console.log('使用者斷開連接:', username);
    users.delete(socket.id);
    typingUsers.delete(username);
    io.emit('userLeft', { username, users: Array.from(new Set(users.values())) });
    io.emit('userTyping', Array.from(typingUsers));
  });
});

// 啟動 AI 自動聊天
startAiConversation();

const PORT = process.env.PORT || 5002;
server.listen(PORT, () => {
  console.log(`伺服器運行在端口 ${PORT}`);
}); 
// 在 Google Apps Script 中部署此代码
// 设置新版本作为网络应用程序
// 执行用户身份: 以部署者身份
// 访问权限: 允许匿名访问 (任何人)

// 处理 GET 请求
function doGet(e) {
  init();  // 初始化数据表
  
  // 允许 CORS
  return addCorsHeaders(handleRequest(e));
}

// 处理 POST 请求
function doPost(e) {
  init();  // 初始化数据表
  
  // 允许 CORS
  return addCorsHeaders(handleRequest(e));
}

// 添加 CORS 头
function addCorsHeaders(response) {
  if (typeof response === 'undefined') {
    response = ContentService.createTextOutput(JSON.stringify({error: '未知错误'}));
  }
  
  // 添加 CORS 頭信息
  return response
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// 统一处理请求
function handleRequest(e) {
  try {
    const data = e.postData ? JSON.parse(e.postData.contents) : (e.parameter || {});
    const action = data.action;
    
    let result;
    
    // 根据请求的动作执行相应的处理函数
    switch (action) {
      case 'getUserData':
        result = getUserData(data.user);
        break;
      case 'getOngoingExercise':
        result = getOngoingExercise(data.user);
        break;
      case 'startExercise':
        result = startExercise(data.user, data.startTime);
        break;
      case 'endExercise':
        result = endExercise(data.user, data.startTime, data.endTime, data.duration);
        break;
      case 'getBonusItems':
        result = getBonusItems();
        break;
      case 'addBonusItem':
        result = addBonusItem(data.name, data.unit, data.points);
        break;
      case 'recordBonus':
        result = recordBonus(data.user, data.bonusId, data.quantity, data.timestamp);
        break;
      case 'getExercises':
        result = getExercises(data.user);
        break;
      case 'getBonusRecords':
        result = getBonusRecords(data.user);
        break;
      case 'getRewards':
        result = getRewards();
        break;
      case 'addReward':
        result = addReward(data.name, data.points);
        break;
      case 'redeemReward':
        result = redeemReward(data.user, data.rewardId, data.rewardName, data.points, data.timestamp);
        break;
      case 'getRewardHistory':
        result = getRewardHistory();
        break;
      case 'getStats':
        result = getStats();
        break;
      default:
        result = { error: '未知的操作' };
    }
    
    // 只返回結果，不設置 MIME 類型，讓 addCorsHeaders 處理
    return ContentService.createTextOutput(JSON.stringify(result));
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.message }));
  }
}

// 打开或创建电子表格
// 注意：請將此 ID 更新為您自己創建的 Google Sheets 檔案 ID
const SPREADSHEET_ID = '13K-5InWvSNpEmIBl4VhPpLOR7NB7bGlnu4psKcagsFk';
const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

// 数据表格
let usersSheet;
let exercisesSheet;
let bonusItemsSheet;
let bonusRecordsSheet;
let rewardsSheet;
let rewardHistorySheet;

// 初始化所有数据表
function init() {
  // 用户数据表
  usersSheet = ss.getSheetByName('Users') || createUsersSheet();
  
  // 运动记录表
  exercisesSheet = ss.getSheetByName('Exercises') || createExercisesSheet();
  
  // Bonus项目表
  bonusItemsSheet = ss.getSheetByName('BonusItems') || createBonusItemsSheet();
  
  // Bonus记录表
  bonusRecordsSheet = ss.getSheetByName('BonusRecords') || createBonusRecordsSheet();
  
  // 奖励项目表
  rewardsSheet = ss.getSheetByName('Rewards') || createRewardsSheet();
  
  // 奖励兑换记录表
  rewardHistorySheet = ss.getSheetByName('RewardHistory') || createRewardHistorySheet();
}

// 创建用户数据表
function createUsersSheet() {
  const sheet = ss.insertSheet('Users');
  sheet.appendRow(['user', 'points', 'ongoingExercise']);
  sheet.appendRow(['joel', 0, '']);
  sheet.appendRow(['ruby', 0, '']);
  return sheet;
}

// 创建运动记录表
function createExercisesSheet() {
  const sheet = ss.insertSheet('Exercises');
  sheet.appendRow(['id', 'user', 'startTime', 'endTime', 'duration', 'points']);
  return sheet;
}

// 创建Bonus项目表
function createBonusItemsSheet() {
  const sheet = ss.insertSheet('BonusItems');
  sheet.appendRow(['id', 'name', 'unit', 'points']);
  return sheet;
}

// 创建Bonus记录表
function createBonusRecordsSheet() {
  const sheet = ss.insertSheet('BonusRecords');
  sheet.appendRow(['id', 'user', 'bonusId', 'bonusName', 'unit', 'quantity', 'points', 'timestamp']);
  return sheet;
}

// 创建奖励项目表
function createRewardsSheet() {
  const sheet = ss.insertSheet('Rewards');
  sheet.appendRow(['id', 'name', 'points']);
  return sheet;
}

// 创建奖励兑换记录表
function createRewardHistorySheet() {
  const sheet = ss.insertSheet('RewardHistory');
  sheet.appendRow(['id', 'user', 'rewardId', 'rewardName', 'points', 'timestamp']);
  return sheet;
}

// 获取用户数据
function getUserData(user) {
  try {
    const data = {};
    const userRows = usersSheet.getDataRange().getValues();
    
    // 去掉标题行
    userRows.shift();
    
    // 确保至少有joel和ruby两个用户
    let hasJoel = false;
    let hasRuby = false;
    
    userRows.forEach(row => {
      if (row[0] === 'joel') hasJoel = true;
      if (row[0] === 'ruby') hasRuby = true;
      
      data[row[0]] = {
        points: parseInt(row[1]) || 0,
        exerciseCount: countExercises(row[0])
      };
    });
    
    // 如果缺少用户，添加默认值
    if (!hasJoel) {
      data['joel'] = { points: 0, exerciseCount: 0 };
    }
    if (!hasRuby) {
      data['ruby'] = { points: 0, exerciseCount: 0 };
    }
    
    return data;
  } catch (error) {
    Logger.log('getUserData 錯誤: ' + error.message);
    // 返回兩個用戶的默認數據
    return {
      'joel': { points: 0, exerciseCount: 0 },
      'ruby': { points: 0, exerciseCount: 0 }
    };
  }
}

// 获取正在进行的运动
function getOngoingExercise(user) {
  const userRow = findUserRow(user);
  if (userRow === -1) return { startTime: null };
  
  const ongoingExercise = usersSheet.getRange(userRow, 3).getValue();
  return ongoingExercise ? { startTime: parseInt(ongoingExercise) } : { startTime: null };
}

// 开始运动
function startExercise(user, startTime) {
  const userRow = findUserRow(user);
  if (userRow === -1) return { success: false };
  
  // 记录开始时间
  usersSheet.getRange(userRow, 3).setValue(startTime.toString());
  
  return { success: true };
}

// 结束运动并计算点数
function endExercise(user, startTime, endTime, duration) {
  const userRow = findUserRow(user);
  if (userRow === -1) return { success: false };
  
  // 清除进行中的运动
  usersSheet.getRange(userRow, 3).setValue('');
  
  // 计算获得的点数
  const points = calculateExercisePoints(duration);
  
  // 添加运动记录
  const id = Utilities.getUuid();
  exercisesSheet.appendRow([
    id,
    user,
    startTime,
    endTime,
    duration,
    points
  ]);
  
  // 更新用户点数
  const currentPoints = usersSheet.getRange(userRow, 2).getValue();
  const newPoints = currentPoints + points;
  usersSheet.getRange(userRow, 2).setValue(newPoints);
  
  return { success: true, points: newPoints };
}

// 计算运动点数
function calculateExercisePoints(duration) {
  if (duration < 10) return 0;
  if (duration < 20) return 2;
  if (duration < 30) return 3;
  if (duration < 45) return 4;
  if (duration < 60) return 5;
  
  // 60分钟或以上
  const basePoints = 5;
  const additionalPoints = Math.floor((duration - 45) / 15);
  return basePoints + additionalPoints;
}

// 获取Bonus项目
function getBonusItems() {
  const items = [];
  const rows = bonusItemsSheet.getDataRange().getValues();
  
  // 去掉标题行
  rows.shift();
  
  rows.forEach(row => {
    items.push({
      id: row[0],
      name: row[1],
      unit: row[2],
      points: row[3]
    });
  });
  
  return { items: items };
}

// 添加Bonus项目
function addBonusItem(name, unit, points) {
  const id = Utilities.getUuid();
  bonusItemsSheet.appendRow([id, name, unit, points]);
  return { success: true };
}

// 记录Bonus完成
function recordBonus(user, bonusId, quantity, timestamp) {
  const userRow = findUserRow(user);
  if (userRow === -1) return { success: false };
  
  // 获取Bonus项目信息
  const bonusItem = findBonusItem(bonusId);
  if (!bonusItem) return { success: false };
  
  // 计算获得的点数
  const earnedPoints = bonusItem.points * quantity;
  
  // 添加Bonus记录
  const id = Utilities.getUuid();
  bonusRecordsSheet.appendRow([
    id,
    user,
    bonusId,
    bonusItem.name,
    bonusItem.unit,
    quantity,
    earnedPoints,
    timestamp
  ]);
  
  // 更新用户点数
  const currentPoints = usersSheet.getRange(userRow, 2).getValue();
  const newPoints = currentPoints + earnedPoints;
  usersSheet.getRange(userRow, 2).setValue(newPoints);
  
  return { success: true, points: newPoints };
}

// 获取运动记录
function getExercises(user) {
  const exercises = [];
  const rows = exercisesSheet.getDataRange().getValues();
  
  // 去掉标题行
  rows.shift();
  
  // 按开始时间倒序排序，最新的记录在前面
  rows.sort((a, b) => b[2] - a[2]);
  
  rows.forEach(row => {
    if (row[1] === user) {
      exercises.push({
        id: row[0],
        startTime: row[2],
        endTime: row[3],
        duration: row[4],
        points: row[5]
      });
    }
  });
  
  return { exercises: exercises };
}

// 获取Bonus记录
function getBonusRecords(user) {
  const records = [];
  const rows = bonusRecordsSheet.getDataRange().getValues();
  
  // 去掉标题行
  rows.shift();
  
  // 按时间戳倒序排序，最新的记录在前面
  rows.sort((a, b) => b[7] - a[7]);
  
  rows.forEach(row => {
    if (row[1] === user) {
      records.push({
        id: row[0],
        bonusId: row[2],
        bonusName: row[3],
        unit: row[4],
        quantity: row[5],
        points: row[6],
        timestamp: row[7]
      });
    }
  });
  
  return { records: records };
}

// 获取奖励项目
function getRewards() {
  const rewards = [];
  const rows = rewardsSheet.getDataRange().getValues();
  
  // 去掉标题行
  rows.shift();
  
  rows.forEach(row => {
    rewards.push({
      id: row[0],
      name: row[1],
      points: row[2]
    });
  });
  
  return { rewards: rewards };
}

// 添加奖励
function addReward(name, points) {
  const id = Utilities.getUuid();
  rewardsSheet.appendRow([id, name, points]);
  return { success: true };
}

// 兑换奖励
function redeemReward(user, rewardId, rewardName, points, timestamp) {
  const userRow = findUserRow(user);
  if (userRow === -1) return { success: false };
  
  // 检查用户点数是否足够
  const currentPoints = usersSheet.getRange(userRow, 2).getValue();
  if (currentPoints < points) return { success: false, message: '点数不足' };
  
  // 添加兑换记录
  const id = Utilities.getUuid();
  rewardHistorySheet.appendRow([
    id,
    user,
    rewardId,
    rewardName,
    points,
    timestamp
  ]);
  
  // 更新用户点数
  const newPoints = currentPoints - points;
  usersSheet.getRange(userRow, 2).setValue(newPoints);
  
  return { success: true, remainingPoints: newPoints };
}

// 获取兑换记录
function getRewardHistory() {
  const history = [];
  const rows = rewardHistorySheet.getDataRange().getValues();
  
  // 去掉标题行
  rows.shift();
  
  // 按时间戳倒序排序，最新的记录在前面
  rows.sort((a, b) => b[5] - a[5]);
  
  rows.forEach(row => {
    history.push({
      id: row[0],
      user: row[1],
      rewardId: row[2],
      rewardName: row[3],
      points: row[4],
      timestamp: row[5]
    });
  });
  
  return { history: history };
}

// 获取统计数据
function getStats() {
  const result = {
    personal: {
      joel: {
        weekExerciseTime: getWeekExerciseTime('joel'),
        weekPoints: getWeekPoints('joel'),
        totalExercises: countExercises('joel')
      },
      ruby: {
        weekExerciseTime: getWeekExerciseTime('ruby'),
        weekPoints: getWeekPoints('ruby'),
        totalExercises: countExercises('ruby')
      }
    },
    joel: {
      totalPoints: getUserPoints('joel'),
      exerciseCount: countExercises('joel')
    },
    ruby: {
      totalPoints: getUserPoints('ruby'),
      exerciseCount: countExercises('ruby')
    }
  };
  
  return result;
}

// 辅助函数

// 查找用户所在行
function findUserRow(user) {
  const userColumn = 1; // 'user' 列在第 1 列 (从1开始)
  const values = usersSheet.getDataRange().getValues();
  
  for (let i = 0; i < values.length; i++) {
    if (values[i][0] === user) {
      return i + 1; // 行号从1开始
    }
  }
  
  return -1; // 未找到
}

// 查找Bonus项目
function findBonusItem(id) {
  const rows = bonusItemsSheet.getDataRange().getValues();
  
  // 去掉标题行
  rows.shift();
  
  for (let row of rows) {
    if (row[0] === id) {
      return {
        id: row[0],
        name: row[1],
        unit: row[2],
        points: row[3]
      };
    }
  }
  
  return null;
}

// 计算用户运动次数
function countExercises(user) {
  const rows = exercisesSheet.getDataRange().getValues();
  
  // 去掉标题行
  rows.shift();
  
  return rows.filter(row => row[1] === user).length;
}

// 获取用户点数
function getUserPoints(user) {
  const userRow = findUserRow(user);
  if (userRow === -1) return 0;
  
  return usersSheet.getRange(userRow, 2).getValue();
}

// 获取本周运动时间
function getWeekExerciseTime(user) {
  const rows = exercisesSheet.getDataRange().getValues();
  
  // 去掉标题行
  rows.shift();
  
  const now = new Date();
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  
  let totalTime = 0;
  
  rows.forEach(row => {
    if (row[1] === user) {
      const exerciseDate = new Date(parseInt(row[2]));
      if (exerciseDate >= startOfWeek) {
        totalTime += row[4]; // duration
      }
    }
  });
  
  return totalTime;
}

// 获取本周点数
function getWeekPoints(user) {
  let points = 0;
  
  // 计算本周运动获得的点数
  const exerciseRows = exercisesSheet.getDataRange().getValues();
  exerciseRows.shift(); // 去掉标题行
  
  const now = new Date();
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  
  exerciseRows.forEach(row => {
    if (row[1] === user) {
      const exerciseDate = new Date(parseInt(row[2]));
      if (exerciseDate >= startOfWeek) {
        points += row[5]; // points
      }
    }
  });
  
  // 计算本周Bonus获得的点数
  const bonusRows = bonusRecordsSheet.getDataRange().getValues();
  bonusRows.shift(); // 去掉标题行
  
  bonusRows.forEach(row => {
    if (row[1] === user) {
      const bonusDate = new Date(parseInt(row[7]));
      if (bonusDate >= startOfWeek) {
        points += row[6]; // points
      }
    }
  });
  
  return points;
}

// 测试函数 - 仅用于开发
function testFunction() {
  init();
  return 'Sheets initialized successfully!';
} 
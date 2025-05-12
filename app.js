// Google Apps Script Web App URL
const API_URL = 'https://script.google.com/macros/s/AKfycbyn_wtulVI9RFOFV1MzdZrns8dacntzJHX6QgAKncHnO6hwxFMm9EnQ6lxRfnkkv1Ob/exec';

// 全局變量
let currentUser = null;
let exerciseStartTime = null;
let exerciseTimerInterval = null;
let userData = {
    joel: {
        points: 0,
        exerciseCount: 0
    },
    ruby: {
        points: 0,
        exerciseCount: 0
    }
};

// DOM元素
const loginScreen = document.getElementById('login-screen');
const mainScreen = document.getElementById('main-screen');
const currentUserElement = document.getElementById('current-user');
const totalPointsElement = document.getElementById('total-points');
const exerciseTimeElement = document.getElementById('exercise-time');
const notExercisingElement = document.getElementById('not-exercising');
const exercisingElement = document.getElementById('exercising');
const navButtons = document.querySelectorAll('.nav-btn');
const sections = document.querySelectorAll('.section');
const bonusSelectElement = document.getElementById('bonus-select');
const recentExercisesElement = document.getElementById('recent-exercises');
const recentBonusElement = document.getElementById('recent-bonus');
const rewardHistoryElement = document.getElementById('reward-history');
const rewardsListElement = document.getElementById('rewards-list');
const bonusItemsElement = document.getElementById('bonus-items');
const toastElement = document.getElementById('toast');
const loadingElement = document.getElementById('loading');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 登入按鈕點擊事件
    document.getElementById('login-joel').addEventListener('click', () => login('Joel'));
    document.getElementById('login-ruby').addEventListener('click', () => login('Ruby'));

    // 導航按鈕點擊事件
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.id.replace('nav-', '');
            switchSection(targetId);
        });
    });

    // 運動相關按鈕事件
    document.getElementById('start-exercise').addEventListener('click', startExercise);
    document.getElementById('end-exercise').addEventListener('click', endExercise);

    // Bonus相關按鈕事件
    document.getElementById('add-bonus').addEventListener('click', addBonusItem);
    document.getElementById('record-bonus').addEventListener('click', recordBonus);

    // 獎勵相關按鈕事件
    document.getElementById('add-reward').addEventListener('click', addReward);

    // 檢查是否有進行中的運動
    checkOngoingExercise();
});

// 登入功能
function login(username) {
    showLoading();
    
    // 設置當前用戶
    currentUser = username.toLowerCase();
    
    // 獲取用戶資料
    fetchData('getUserData', { user: currentUser })
        .then(data => {
            if (data) {
                userData = data;
                currentUserElement.textContent = username;
                updatePointsDisplay();
                
                // 獲取並顯示Bonus項目
                fetchBonusItems();
                
                // 獲取並顯示獎勵項目
                fetchRewards();
                
                // 獲取並顯示運動記錄
                fetchExercises();
                
                // 獲取並顯示Bonus記錄
                fetchBonusRecords();
                
                // 獲取並顯示兌換記錄
                fetchRewardHistory();
                
                // 更新統計數據
                updateStats();
                
                // 顯示主畫面
                loginScreen.classList.remove('active');
                mainScreen.classList.add('active');
                
                // 檢查是否有進行中的運動
                checkOngoingExercise();
            }
            hideLoading();
        })
        .catch(error => {
            console.error('登入失敗:', error);
            showToast('登入失敗，請稍後再試');
            hideLoading();
        });
}

// 檢查是否有進行中的運動
function checkOngoingExercise() {
    if (!currentUser) return;
    
    fetchData('getOngoingExercise', { user: currentUser })
        .then(data => {
            if (data && data.startTime) {
                exerciseStartTime = data.startTime;
                startExerciseTimer();
                notExercisingElement.classList.add('hidden');
                exercisingElement.classList.remove('hidden');
            }
        })
        .catch(error => {
            console.error('檢查進行中運動失敗:', error);
        });
}

// 開始運動
function startExercise() {
    if (exerciseStartTime) {
        showToast('已經有運動正在進行中');
        return;
    }
    
    showLoading();
    const timestamp = Date.now();
    
    fetchData('startExercise', { 
        user: currentUser, 
        startTime: timestamp 
    })
    .then(response => {
        if (response.success) {
            exerciseStartTime = timestamp;
            startExerciseTimer();
            notExercisingElement.classList.add('hidden');
            exercisingElement.classList.remove('hidden');
            showToast('運動開始計時');
        } else {
            showToast('運動開始失敗，請稍後再試');
        }
        hideLoading();
    })
    .catch(error => {
        console.error('開始運動失敗:', error);
        showToast('運動開始失敗，請稍後再試');
        hideLoading();
    });
}

// 開始運動計時器
function startExerciseTimer() {
    if (!exerciseStartTime) return;
    
    // 更新顯示
    updateExerciseTimer();
    
    // 設置定時器，每秒更新一次
    exerciseTimerInterval = setInterval(updateExerciseTimer, 1000);
}

// 更新運動計時器顯示
function updateExerciseTimer() {
    if (!exerciseStartTime) return;
    
    const currentTime = Date.now();
    const duration = currentTime - exerciseStartTime;
    
    // 將時間轉換為小時:分鐘:秒格式
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((duration % (1000 * 60)) / 1000);
    
    // 格式化為 HH:MM:SS
    exerciseTimeElement.textContent = 
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// 結束運動
function endExercise() {
    if (!exerciseStartTime) {
        showToast('沒有運動正在進行');
        return;
    }
    
    showLoading();
    const endTime = Date.now();
    const duration = Math.floor((endTime - exerciseStartTime) / (1000 * 60)); // 轉換為分鐘
    
    fetchData('endExercise', {
        user: currentUser,
        startTime: exerciseStartTime,
        endTime: endTime,
        duration: duration
    })
    .then(response => {
        if (response.success) {
            clearInterval(exerciseTimerInterval);
            exerciseStartTime = null;
            exerciseTimeElement.textContent = '00:00:00';
            notExercisingElement.classList.remove('hidden');
            exercisingElement.classList.add('hidden');
            
            updatePointsDisplay(response.points);
            
            // 更新運動記錄
            fetchExercises();
            
            // 更新統計數據
            updateStats();
            
            showToast(`運動結束！獲得 ${response.points} 點`);
        } else {
            showToast('運動結束失敗，請稍後再試');
        }
        hideLoading();
    })
    .catch(error => {
        console.error('結束運動失敗:', error);
        showToast('運動結束失敗，請稍後再試');
        hideLoading();
    });
}

// 獲取Bonus項目
function fetchBonusItems() {
    fetchData('getBonusItems', {})
        .then(data => {
            if (data && data.items) {
                displayBonusItems(data.items);
                updateBonusSelect(data.items);
            }
        })
        .catch(error => {
            console.error('獲取Bonus項目失敗:', error);
        });
}

// 顯示Bonus項目
function displayBonusItems(items) {
    bonusItemsElement.innerHTML = '';
    
    if (items.length === 0) {
        bonusItemsElement.innerHTML = '<p class="empty-message">尚未添加任何Bonus項目</p>';
        return;
    }
    
    items.forEach(item => {
        const bonusItemElement = document.createElement('div');
        bonusItemElement.className = 'bonus-item';
        bonusItemElement.innerHTML = `
            <div class="bonus-info">
                <span class="bonus-name">${item.name}</span>
                <span class="bonus-detail">每${item.unit}可得${item.points}點</span>
            </div>
        `;
        bonusItemsElement.appendChild(bonusItemElement);
    });
}

// 更新Bonus選擇框
function updateBonusSelect(items) {
    bonusSelectElement.innerHTML = '<option value="">-- 請選擇 --</option>';
    
    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = `${item.name} (${item.unit})`;
        bonusSelectElement.appendChild(option);
    });
}

// 添加Bonus項目
function addBonusItem() {
    const nameInput = document.getElementById('bonus-name');
    const unitInput = document.getElementById('bonus-unit');
    const pointsInput = document.getElementById('bonus-points');
    
    const name = nameInput.value.trim();
    const unit = unitInput.value.trim();
    const points = parseInt(pointsInput.value);
    
    if (!name || !unit || isNaN(points) || points <= 0) {
        showToast('請填寫完整的Bonus項目資訊');
        return;
    }
    
    showLoading();
    fetchData('addBonusItem', {
        name: name,
        unit: unit,
        points: points
    })
    .then(response => {
        if (response.success) {
            nameInput.value = '';
            unitInput.value = '';
            pointsInput.value = '1';
            
            // 重新獲取Bonus項目
            fetchBonusItems();
            
            showToast('Bonus項目添加成功');
        } else {
            showToast('添加Bonus項目失敗，請稍後再試');
        }
        hideLoading();
    })
    .catch(error => {
        console.error('添加Bonus項目失敗:', error);
        showToast('添加Bonus項目失敗，請稍後再試');
        hideLoading();
    });
}

// 記錄Bonus完成
function recordBonus() {
    const bonusId = bonusSelectElement.value;
    const quantityInput = document.getElementById('bonus-quantity');
    const quantity = parseInt(quantityInput.value);
    
    if (!bonusId || isNaN(quantity) || quantity <= 0) {
        showToast('請選擇項目並填寫有效的完成單位數');
        return;
    }
    
    showLoading();
    fetchData('recordBonus', {
        user: currentUser,
        bonusId: bonusId,
        quantity: quantity,
        timestamp: Date.now()
    })
    .then(response => {
        if (response.success) {
            bonusSelectElement.value = '';
            quantityInput.value = '1';
            
            updatePointsDisplay(response.points);
            
            // 重新獲取Bonus記錄
            fetchBonusRecords();
            
            // 更新統計數據
            updateStats();
            
            showToast(`Bonus記錄成功！獲得 ${response.points} 點`);
        } else {
            showToast('Bonus記錄失敗，請稍後再試');
        }
        hideLoading();
    })
    .catch(error => {
        console.error('記錄Bonus失敗:', error);
        showToast('Bonus記錄失敗，請稍後再試');
        hideLoading();
    });
}

// 獲取並顯示運動記錄
function fetchExercises() {
    if (!currentUser) return;
    
    fetchData('getExercises', { user: currentUser })
        .then(data => {
            if (data && data.exercises) {
                displayExercises(data.exercises);
            }
        })
        .catch(error => {
            console.error('獲取運動記錄失敗:', error);
        });
}

// 顯示運動記錄
function displayExercises(exercises) {
    recentExercisesElement.innerHTML = '';
    
    if (exercises.length === 0) {
        recentExercisesElement.innerHTML = '<p class="empty-message">尚未有運動記錄</p>';
        return;
    }
    
    exercises.slice(0, 10).forEach(exercise => {
        const date = new Date(exercise.startTime);
        const formattedDate = `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
        
        const recordElement = document.createElement('div');
        recordElement.className = 'record-item';
        recordElement.innerHTML = `
            <div class="record-title">${formattedDate} 運動 ${exercise.duration} 分鐘</div>
            <div class="record-detail">
                <span>獲得 ${exercise.points} 點</span>
                <span>${formatTime(exercise.startTime)} - ${formatTime(exercise.endTime)}</span>
            </div>
        `;
        recentExercisesElement.appendChild(recordElement);
    });
}

// 獲取並顯示Bonus記錄
function fetchBonusRecords() {
    if (!currentUser) return;
    
    fetchData('getBonusRecords', { user: currentUser })
        .then(data => {
            if (data && data.records) {
                displayBonusRecords(data.records);
            }
        })
        .catch(error => {
            console.error('獲取Bonus記錄失敗:', error);
        });
}

// 顯示Bonus記錄
function displayBonusRecords(records) {
    recentBonusElement.innerHTML = '';
    
    if (records.length === 0) {
        recentBonusElement.innerHTML = '<p class="empty-message">尚未有Bonus記錄</p>';
        return;
    }
    
    records.slice(0, 10).forEach(record => {
        const date = new Date(record.timestamp);
        const formattedDate = `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
        
        const recordElement = document.createElement('div');
        recordElement.className = 'record-item';
        recordElement.innerHTML = `
            <div class="record-title">${formattedDate} ${record.bonusName}</div>
            <div class="record-detail">
                <span>${record.quantity} ${record.unit}, 獲得 ${record.points} 點</span>
                <span>${formatTime(record.timestamp)}</span>
            </div>
        `;
        recentBonusElement.appendChild(recordElement);
    });
}

// 獲取獎勵項目
function fetchRewards() {
    fetchData('getRewards', {})
        .then(data => {
            if (data && data.rewards) {
                displayRewards(data.rewards);
            }
        })
        .catch(error => {
            console.error('獲取獎勵項目失敗:', error);
        });
}

// 顯示獎勵項目
function displayRewards(rewards) {
    rewardsListElement.innerHTML = '';
    
    if (rewards.length === 0) {
        rewardsListElement.innerHTML = '<p class="empty-message">尚未添加任何獎勵</p>';
        return;
    }
    
    rewards.forEach(reward => {
        const rewardElement = document.createElement('div');
        rewardElement.className = 'reward-item';
        rewardElement.innerHTML = `
            <div class="reward-info">
                <span class="reward-name">${reward.name}</span>
                <span class="reward-points">需要 ${reward.points} 點</span>
            </div>
            <button class="primary-btn redeem-btn" data-id="${reward.id}" data-points="${reward.points}" data-name="${reward.name}">兌換</button>
        `;
        rewardsListElement.appendChild(rewardElement);
    });
    
    // 添加兌換按鈕事件
    document.querySelectorAll('.redeem-btn').forEach(button => {
        button.addEventListener('click', function() {
            const rewardId = this.getAttribute('data-id');
            const rewardPoints = parseInt(this.getAttribute('data-points'));
            const rewardName = this.getAttribute('data-name');
            
            redeemReward(rewardId, rewardPoints, rewardName);
        });
    });
}

// 添加獎勵
function addReward() {
    const nameInput = document.getElementById('reward-name');
    const pointsInput = document.getElementById('reward-points');
    
    const name = nameInput.value.trim();
    const points = parseInt(pointsInput.value);
    
    if (!name || isNaN(points) || points <= 0) {
        showToast('請填寫完整的獎勵資訊');
        return;
    }
    
    showLoading();
    fetchData('addReward', {
        name: name,
        points: points
    })
    .then(response => {
        if (response.success) {
            nameInput.value = '';
            pointsInput.value = '10';
            
            // 重新獲取獎勵項目
            fetchRewards();
            
            showToast('獎勵添加成功');
        } else {
            showToast('添加獎勵失敗，請稍後再試');
        }
        hideLoading();
    })
    .catch(error => {
        console.error('添加獎勵失敗:', error);
        showToast('添加獎勵失敗，請稍後再試');
        hideLoading();
    });
}

// 兌換獎勵
function redeemReward(rewardId, rewardPoints, rewardName) {
    if (!currentUser) {
        showToast('請先登入');
        return;
    }
    
    // 檢查點數是否足夠
    fetchData('getUserData', { user: currentUser })
        .then(data => {
            if (data && data[currentUser] && data[currentUser].points >= rewardPoints) {
                // 點數足夠，進行兌換
                showLoading();
                fetchData('redeemReward', {
                    user: currentUser,
                    rewardId: rewardId,
                    rewardName: rewardName,
                    points: rewardPoints,
                    timestamp: Date.now()
                })
                .then(response => {
                    if (response.success) {
                        updatePointsDisplay(response.remainingPoints);
                        
                        // 重新獲取兌換記錄
                        fetchRewardHistory();
                        
                        // 更新統計數據
                        updateStats();
                        
                        showToast(`成功兌換「${rewardName}」！`);
                    } else {
                        showToast('兌換失敗，請稍後再試');
                    }
                    hideLoading();
                })
                .catch(error => {
                    console.error('兌換獎勵失敗:', error);
                    showToast('兌換失敗，請稍後再試');
                    hideLoading();
                });
            } else {
                showToast(`點數不足，需要 ${rewardPoints} 點`);
            }
        })
        .catch(error => {
            console.error('獲取用戶資料失敗:', error);
            showToast('兌換失敗，請稍後再試');
        });
}

// 獲取兌換記錄
function fetchRewardHistory() {
    fetchData('getRewardHistory', {})
        .then(data => {
            if (data && data.history) {
                displayRewardHistory(data.history);
            }
        })
        .catch(error => {
            console.error('獲取兌換記錄失敗:', error);
        });
}

// 顯示兌換記錄
function displayRewardHistory(history) {
    rewardHistoryElement.innerHTML = '';
    
    if (history.length === 0) {
        rewardHistoryElement.innerHTML = '<p class="empty-message">尚未有兌換記錄</p>';
        return;
    }
    
    history.slice(0, 10).forEach(record => {
        const date = new Date(record.timestamp);
        const formattedDate = `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
        
        const recordElement = document.createElement('div');
        recordElement.className = 'record-item';
        recordElement.innerHTML = `
            <div class="record-title">${formattedDate} ${record.user === 'joel' ? 'Joel' : 'Ruby'} 兌換了 ${record.rewardName}</div>
            <div class="record-detail">
                <span>消耗 ${record.points} 點</span>
                <span>${formatTime(record.timestamp)}</span>
            </div>
        `;
        rewardHistoryElement.appendChild(recordElement);
    });
}

// 更新統計數據
function updateStats() {
    if (!currentUser) return;
    
    fetchData('getStats', {})
        .then(data => {
            if (data) {
                // 個人統計
                document.getElementById('week-exercise-time').textContent = `${data.personal[currentUser].weekExerciseTime || 0} 分鐘`;
                document.getElementById('week-points').textContent = `${data.personal[currentUser].weekPoints || 0} 點`;
                document.getElementById('total-exercises').textContent = `${data.personal[currentUser].totalExercises || 0} 次`;
                
                // 雙人總覽
                document.getElementById('joel-total-points').textContent = `${data.joel.totalPoints || 0} 點`;
                document.getElementById('joel-exercise-count').textContent = `${data.joel.exerciseCount || 0} 次`;
                document.getElementById('ruby-total-points').textContent = `${data.ruby.totalPoints || 0} 點`;
                document.getElementById('ruby-exercise-count').textContent = `${data.ruby.exerciseCount || 0} 次`;
            }
        })
        .catch(error => {
            console.error('獲取統計數據失敗:', error);
        });
}

// 更新點數顯示
function updatePointsDisplay(points) {
    if (points !== undefined) {
        userData[currentUser].points = points;
    }
    totalPointsElement.textContent = `${userData[currentUser].points || 0} 點`;
}

// 切換頁面區塊
function switchSection(sectionName) {
    navButtons.forEach(button => {
        if (button.id === `nav-${sectionName}`) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
    
    sections.forEach(section => {
        if (section.id === `${sectionName}-section`) {
            section.classList.add('active');
        } else {
            section.classList.remove('active');
        }
    });
}

// API 請求函數
async function fetchData(action, params) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: action,
                ...params
            }),
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API 請求失敗:', error);
        throw error;
    }
}

// 工具函數
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

// 顯示 Toast 通知
function showToast(message) {
    toastElement.textContent = message;
    toastElement.classList.add('show');
    
    setTimeout(() => {
        toastElement.classList.remove('show');
    }, 3000);
}

// 顯示 Loading
function showLoading() {
    loadingElement.classList.remove('hidden');
}

// 隱藏 Loading
function hideLoading() {
    loadingElement.classList.add('hidden');
} 
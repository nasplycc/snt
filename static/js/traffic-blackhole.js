/**
 * 流量黑洞模块 - 修复版
 */

const TrafficBlackHoleModule = {
    charts: {},
    updateTimers: [],
    isRunning: false,
    selectedInterface: null,
    lastSpeed: 0,
    speedData: [],
    timeLabels: [],

    /**
     * 初始化流量黑洞模块
     */
    init() {
        console.log('TrafficBlackHoleModule.init() started');
        
        try {
            // 获取当前选择的网卡
            this.selectedInterface = this.getCurrentInterface();
            console.log('流量黑洞初始网卡:', this.selectedInterface);
            
            // 加载配置
            if (typeof ConfigModule !== 'undefined') {
                ConfigModule.loadDefaultValues();
            }
            
            // 初始化数据卡片
            this.initDataCards();
            
            // 加载初始数据
            this.loadInitialData();
            
            // 启动定时更新
            this.startTimers();
            
            console.log('TrafficBlackHoleModule.init() completed');
            console.log('流量黑洞模块初始化完成');
            
        } catch (error) {
            console.error('流量黑洞初始化失败:', error);
        }
    },

    /**
     * 获取当前选择的网卡
     */
    getCurrentInterface() {
        const savedInterface = localStorage.getItem('selectedInterface');
        const availableInterfaces = ['enp2s0', 'enp3s0', 'NodeBabyLink'];
        
        // 如果保存的网卡还在可用列表中，使用它
        if (savedInterface && availableInterfaces.includes(savedInterface)) {
            return savedInterface;
        }
        
        // 否则使用第一个可用网卡
        return availableInterfaces[0];
    },

    /**
     * 初始化数据卡片
     */
    initDataCards() {
        console.log('初始化流量黑洞数据卡片...');
        
        // 初始化图表容器（不再创建echarts图表）
        
        console.log('流量黑洞数据卡片初始化完成');
    },

    /**
     * 加载初始数据
     */
    loadInitialData() {
        console.log('正在加载流量黑洞初始数据...');
        
        // 获取当前状态
        fetch('/api/downonly/status')
            .then(response => response.json())
            .then(data => {
                this.isRunning = data.is_running;
                console.log('流量黑洞初始状态:', data);
                
                // 更新UI
                this.updateUI();
                
                console.log('流量黑洞初始数据加载完成');
            })
            .catch(error => {
                console.error('加载流量黑洞状态失败:', error);
                // 使用默认值
                this.isRunning = false;
                this.updateUI();
            });
    },

    /**
     * 启动定时器
     */
    startTimers() {
        console.log('启动流量黑洞定时器...');
        
        // 停止现有定时器
        this.stopTimers();
        
        // 立即执行一次数据更新
        if (this.isRunning) {
            this.updateChart();
        }
        this.updateServiceStatus();
        
        // 定时更新数据 (每2秒) - 无论是否运行都更新，这样才能显示数据
        this.updateTimers.push(setInterval(() => {
            this.updateDataCards();
        }, 2000));
        
        // 定时更新服务状态 (每5秒)
        this.updateTimers.push(setInterval(() => {
            this.updateServiceStatus();
        }, 5000));
        
        console.log('流量黑洞定时器启动完成，数量:', this.updateTimers.length);
    },

    /**
     * 停止定时器
     */
    stopTimers() {
        console.log('停止流量黑洞定时器...');
        
        this.updateTimers.forEach(timer => {
            clearInterval(timer);
        });
        this.updateTimers = [];
    },

    /**
     * 更新服务状态
     */
    updateServiceStatus() {
        fetch('/api/downonly/status')
            .then(response => response.json())
            .then(data => {
                this.isRunning = data.is_running;
                this.updateUI();
            })
            .catch(error => {
                console.error('更新服务状态失败:', error);
            });
    },

    /**
     * 更新UI界面
     */
    updateUI() {
        console.log('更新流量黑洞UI...');
        
        // 更新按钮状态
        const toggleBtn = document.getElementById('toggleDownOnly');
        if (toggleBtn) {
            toggleBtn.textContent = this.isRunning ? '停止流量黑洞' : '启动流量黑洞';
            toggleBtn.className = this.isRunning ? 
                'bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded' : 
                'bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded';
        }
        
        // 更新状态显示
        const statusElement = document.getElementById('downonlyStatus');
        if (statusElement) {
            statusElement.textContent = this.isRunning ? '运行中' : '已停止';
            statusElement.className = this.isRunning ? 'text-green-600 font-medium' : 'text-gray-600';
        }
        
        // 更新数据卡片
        this.updateDataCards();
    },

    /**
     * 更新数据卡片
     */
    updateDataCards() {
        console.log('更新流量黑洞数据卡片...');
        
        // 获取今日流量和状态信息
        fetch('/api/downonly/status')
            .then(response => response.json())
            .then(data => {
                console.log('获取到状态数据:', data);
                
                // 更新当前速度卡片（将Mbps转换为KB/s）
                const speedCard = document.getElementById('currentSpeed');
                if (speedCard) {
                    const currentSpeedMbps = data.speed_mbps || 0;
                    const currentSpeedKBps = currentSpeedMbps * 125; // Mbps to KB/s: 1 Mbps = 1000/8 = 125 KB/s
                    speedCard.textContent = `${currentSpeedKBps.toFixed(2)}`;
                    this.lastSpeed = currentSpeedMbps;
                }
                
                // 更新今日流量卡片
                const usageCard = document.getElementById('todayUsage');
                if (usageCard) {
                    const gbUsed = (data.today_bytes / (1024 * 1024 * 1024)).toFixed(2);
                    usageCard.textContent = `${gbUsed} GB`;
                }
                
                // 更新配额输入框 - 修复配额不能自定义的问题
                const quotaInput = document.getElementById('daily-quota-input');
                if (quotaInput) {
                    // 如果用户修改了配额，不自动覆盖
                    if (quotaInput.dataset.userModified === 'true') {
                        console.log('用户已修改配额，保持用户值:', quotaInput.value);
                    } else {
                        // 只有在配额有值时才更新
                        if (data.today_quota_bytes && data.today_quota_bytes > 0) {
                            const quotaGB = Math.floor(data.today_quota_bytes / (1024 * 1024 * 1024));
                            // 只有当配额框是空值或者默认值时才更新
                            if (!quotaInput.value || quotaInput.value === '150') {
                                quotaInput.value = quotaGB;
                            }
                        }
                    }
                }
                
                // 更新配额百分比卡片
                const quotaPercentCard = document.getElementById('usagePercent');
                if (quotaPercentCard) {
                    const gbUsed = data.today_bytes / (1024 * 1024 * 1024);
                    const quotaInput = document.getElementById('daily-quota-input');
                    const gbTotal = quotaInput ? parseInt(quotaInput.value) || 150 : 150;
                    const percent = gbTotal > 0 ? (gbUsed / gbTotal * 100).toFixed(1) : '0';
                    quotaPercentCard.textContent = `${percent}%`;
                }
                
                // 更新运行时间卡片
                const uptimeCard = document.getElementById('uptimeSeconds');
                if (uptimeCard) {
                    const uptimeHours = Math.floor(data.uptime_seconds / 3600);
                    const uptimeMinutes = Math.floor((data.uptime_seconds % 3600) / 60);
                    const uptimeSeconds = data.uptime_seconds % 60;
                    uptimeCard.textContent = `${uptimeHours}h ${uptimeMinutes}m ${uptimeSeconds}s`;
                }
            })
            .catch(error => {
                console.error('更新流量数据卡片失败:', error);
                // 使用默认值
                if (speedCard) {
                    speedCard.textContent = '0.00';
                }
            });
        
        console.log('流量黑洞数据卡片更新完成');
    },

    /**
     * 切换服务状态
     */
    toggleService() {
        console.log('正在切换流量黑洞服务状态...');
        
        const toggleBtn = document.getElementById('toggleDownOnly');
        if (!toggleBtn) {
            console.error('找不到切换按钮');
            return;
        }
        
        // 显示加载状态
        toggleBtn.disabled = true;
        toggleBtn.textContent = '处理中...';
        
        fetch('/api/downonly/toggle', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            this.isRunning = data.is_running;
            console.log('流量黑洞服务状态:', data);
            
            // 更新UI
            this.updateUI();
            
            // 显示通知
            this.showNotification(
                this.isRunning ? '流量黑洞服务已启动' : '流量黑洞服务已停止',
                this.isRunning ? 'success' : 'info'
            );
        })
        .catch(error => {
            console.error('切换服务状态失败:', error);
            this.showNotification('操作失败: ' + error.message, 'error');
        })
        .finally(() => {
            toggleBtn.disabled = false;
        });
    },

    /**
     * 显示通知
     */
    showNotification(message, type = 'info') {
        // 移除现有通知DOM元素
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        `;
        
        document.body.appendChild(notification);
        
        // 3秒后自动移除
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease-out';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 3000);
    }
};

// 暴露模块
window.TrafficBlackHoleModule = TrafficBlackHoleModule;
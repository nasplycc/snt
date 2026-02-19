/**
 * DownOnly 模块 - 修复版
 */

const DownOnlyModule = {
    charts: {
        speed: null,
        history: null
    },
    isRunning: false,
    updateTimers: [],

    /**
     * 初始化
     */
    init() {
        console.log('DownOnlyModule.init() started');
        
        this.initCharts();
        this.loadInitialData();
        this.startTimers();
        
        console.log('DownOnlyModule.init() completed');
    },

    /**
     * 初始化图表
     */
    initCharts() {
        const speedDom = document.getElementById('downonly-chart');
        const historyDom = document.getElementById('history-chart');
        
        if (!speedDom || !historyDom) {
            console.error('Chart elements not found');
            return;
        }

        this.charts.speed = echarts.init(speedDom);
        this.charts.history = echarts.init(historyDom);

        this.charts.speed.setOption(ChartConfigs.downonlySpeed());
        this.charts.history.setOption(ChartConfigs.history());
        
        console.log('DownOnly charts initialized');
    },

    /**
     * 加载初始数据
     */
    async loadInitialData() {
        try {
            await this.updateStatus();
            await this.updateHistory();
            await this.updateLogs();
            console.log('DownOnly initial data loaded');
        } catch (error) {
            console.error('加载初始数据失败:', error);
        }
    },

    /**
     * 启动定时器
     */
    startTimers() {
        // 清除现有定时器
        this.stopTimers();
        
        // 启动新的定时器
        this.updateTimers.push(setInterval(() => {
            if (typeof App !== 'undefined') {
                this.updateStatus();
            }
        }, 1000));
        
        this.updateTimers.push(setInterval(() => {
            if (typeof App !== 'undefined') {
                this.updateHistory();
            }
        }, 30000));
        
        this.updateTimers.push(setInterval(() => {
            if (typeof App !== 'undefined') {
                this.updateLogs();
            }
        }, 2000)); // 加快日志更新频率
        
        console.log('DownOnly timers started, count:', this.updateTimers.length);
    },
    
    /**
     * 停止定时器
     */
    stopTimers() {
        this.updateTimers.forEach(timer => clearInterval(timer));
        this.updateTimers = [];
        console.log('DownOnly timers stopped');
    },

    /**
     * 切换服务状态 - 修复版！
     */
    async toggleService() {
        console.log('toggleService() called');
        
        try {
            const response = await fetch('/api/downonly/toggle', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Toggle response:', data);
            
            this.isRunning = data.is_running;
            this.updateToggleButton();
            
            // 如果服务成功启动，强制更新状态
            if (this.isRunning) {
                console.log('Service started, forcing status update');
                setTimeout(() => this.updateStatus(), 2000);
            }
            
        } catch (error) {
            console.error('切换服务失败:', error);
            alert('切换服务失败: ' + error.message);
        }
    },

    /**
     * 更新按钮状态
     */
    updateToggleButton() {
        const btn = document.getElementById('toggle-btn');
        if (!btn) {
            console.error('toggle-btn not found');
            return;
        }
        
        if (this.isRunning) {
            btn.innerHTML = '<i class="fas fa-stop"></i> 停止服务';
            btn.className = 'btn btn-danger';
            console.log('状态已更新为: 运行中');
        } else {
            btn.innerHTML = '<i class="fas fa-play"></i> 启动服务';
            btn.className = 'btn btn-success';
            console.log('状态已更新为: 已停止');
        }
        
        console.log('Toggle button updated, isRunning:', this.isRunning);
    },

    /**
     * 更新状态 - 修复版！
     */
    async updateStatus() {
        try {
            console.log('正在更新DownOnly状态...');
            
            const response = await fetch('/api/downonly/status');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            this.isRunning = data.is_running;

            console.log('Status update - isRunning:', this.isRunning, 'data:', data);

            // 更新按钮
            this.updateToggleButton();

            // 更新状态指示器
            this.updateStatusIndicator(data.status);

            // 更新统计数据 - 使用更可靠的方式
            this.updateStatsCards(data);

            // 更新速度曲线
            this.updateSpeedChart(data.speed_mbps);
            
            // 更新日志
            await this.updateLogs();

        } catch (error) {
            console.error('更新状态失败:', error);
            // 即使出错也尝试更新UI
            this.updateStatsCards({
                is_running: false,
                speed_mbps: 0,
                today_bytes: 0,
                today_quota_gb: 150,
                uptime_seconds: 0
            });
        }
    },
    
    /**
     * 更新统计卡片 - 新增方法
     */
    updateStatsCards(data) {
        console.log('更新统计卡片:', data);
        
        // 速度卡片
        const doSpeed = document.getElementById('do-speed');
        if (doSpeed) {
            doSpeed.textContent = data.speed_mbps.toFixed(2);
            doSpeed.parentElement.classList.remove('text-gray-400');
            doSpeed.parentElement.classList.add('text-blue-600');
        }
        
        // 今日消耗卡片
        const doToday = document.getElementById('do-today');
        if (doToday) {
            doToday.textContent = Utils.formatBytes(data.today_bytes);
            doToday.parentElement.classList.remove('text-gray-400');
            doToday.parentElement.classList.add('text-green-600');
        }
        
        // 今日配额卡片
        const doQuota = document.getElementById('do-quota');
        if (doQuota) {
            doQuota.textContent = data.today_quota_gb;
            doQuota.parentElement.classList.remove('text-gray-400');
            doQuota.parentElement.classList.add('text-yellow-600');
        }
        
        // 运行时间卡片
        const doUptime = document.getElementById('do-uptime');
        if (doUptime) {
            doUptime.textContent = Utils.formatUptime(data.uptime_seconds);
            doUptime.parentElement.classList.remove('text-gray-400');
            doUptime.parentElement.classList.add('text-purple-600');
        }
        
        console.log('统计卡片已更新');
    },

    /**
     * 更新状态指示器
     */
    updateStatusIndicator(status) {
        const statusEl = document.getElementById('service-status');
        if (!statusEl) return;
        
        const statusMap = {
            'running': { text: '运行中', class: 'status-running' },
            'stopped': { text: '已停止', class: 'status-stopped' },
            'sleeping': { text: '休息中', class: 'status-sleeping' },
            'out_of_schedule': { text: '非运行时段', class: 'status-sleeping' },
            'quota_reached': { text: '已达配额', class: 'status-sleeping' }
        };

        const info = statusMap[status] || { text: status, class: 'status-stopped' };
        statusEl.className = `status-indicator ${info.class}`;
        statusEl.innerHTML = `<i class="fas fa-circle"></i> ${info.text}`;
        
        console.log('Status indicator updated:', info.text);
    },

    /**
     * 更新速度图表
     */
    updateSpeedChart(speed) {
        if (!this.charts.speed) return;
        
        const option = this.charts.speed.getOption();
        if (!option || !option.series || !option.series[0]) return;
        
        const currentData = option.series[0].data || [];
        const currentXAxis = option.xAxis[0].data || [];

        // 滚动数据
        currentData.shift();
        currentData.push(speed);
        currentXAxis.shift();
        currentXAxis.push(Utils.getCurrentTime());

        this.charts.speed.setOption({
            xAxis: [{ data: currentXAxis }],
            series: [{ data: currentData }]
        });
    },

    /**
     * 更新历史数据
     */
    async updateHistory() {
        const monthSelect = document.getElementById('month-select');
        if (!monthSelect) return;
        
        const month = monthSelect.value;
        try {
            const response = await fetch(`/api/downonly/history?month=${month}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            const days = data.days.map(d => d.day);
            const bytes = data.days.map(d => d.bytes);

            if (this.charts.history) {
                this.charts.history.setOption({
                    xAxis: { data: days },
                    series: [{ data: bytes }]
                });
            }
        } catch (error) {
            console.error('更新历史失败:', error);
        }
    },

    /**
     * 切换月份
     */
    changeMonth() {
        this.updateHistory();
    },

    /**
     * 更新日志 - 修复版！
     */
    async updateLogs() {
        try {
            const response = await fetch('/api/downonly/logs');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            const container = document.getElementById('log-container');
            if (!container) return;
            
            container.innerHTML = data.entries.map(e => 
                `<div class="log-entry"><span class="log-time">${e.time}</span> ${e.msg}</div>`
            ).join('');
            container.scrollTop = container.scrollHeight;
            
            console.log('Logs updated, entries:', data.entries.length);
        } catch (error) {
            console.error('更新日志失败:', error);
        }
    },

    /**
     * 销毁
     */
    destroy() {
        this.updateTimers.forEach(timer => clearInterval(timer));
        this.updateTimers = [];
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.dispose();
        });
    },

    /**
     * 调整大小
     */
    resize() {
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.resize();
        });
    }
};
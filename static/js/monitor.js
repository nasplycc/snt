/**
 * 流量监测模块 - 修复版
 */

const MonitorModule = {
    chart: null,
    currentInterface: '',
    dataBuffer: {
        timestamps: [],
        sent: [],
        recv: []
    },
    maxPoints: 60,
    currentStats: { sent_rate: 0, recv_rate: 0, total_sent: 0, total_recv: 0 },
    updateTimer: null,
    chartTimer: null,
    isInitialized: false,

    /**
     * 初始化
     */
    async init() {
        console.log('MonitorModule.init() started');
        
        // 获取当前选中的网卡
        const select = document.getElementById('interface-select');
        if (select) {
            // 强制刷新网卡列表
            try {
                const response = await fetch('/api/monitor/interfaces');
                const interfaces = await response.json();
                console.log('获取到的网卡列表:', interfaces);
                
                // 更新下拉框
                select.innerHTML = '';
                interfaces.forEach(interfaceName => {
                    const option = document.createElement('option');
                    option.value = interfaceName;
                    option.textContent = interfaceName;
                    select.appendChild(option);
                });
                
                // 设置当前选中的网卡
                if (interfaces.length > 0 && interfaces[0] !== 'lo') {
                    this.currentInterface = interfaces[0];
                    select.value = interfaces[0];
                } else {
                    this.currentInterface = interfaces[0] || 'enp2s0';
                    select.value = this.currentInterface;
                }
                
                console.log('当前选中的网卡:', this.currentInterface);
            } catch (error) {
                console.error('获取网卡列表失败:', error);
                // 使用默认值
                this.currentInterface = 'enp2s0';
                if (select) select.value = 'enp2s0';
            }
        }

        // 更新界面显示
        const interfaceNameEl = document.getElementById('interface-name');
        if (interfaceNameEl) {
            interfaceNameEl.textContent = this.currentInterface;
        }

        // 初始化图表
        this.initChart();
        
        // 加载历史数据
        await this.loadInitialHistory();
        
        // 标记初始化完成
        this.isInitialized = true;
        
        // 启动定时器
        this.startTimers();
        
        console.log('MonitorModule.init() completed');
    },

    /**
     * 初始化图表
     */
    initChart() {
        const chartDom = document.getElementById('monitor-chart');
        if (!chartDom) {
            console.error('monitor-chart element not found');
            return;
        }
        
        this.chart = echarts.init(chartDom);
        
        const option = {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'axis',
                backgroundColor: '#1e293b',
                borderColor: '#334155',
                textStyle: { color: '#f1f5f9' },
                axisPointer: {
                    type: 'cross',
                    animation: false,
                    label: { backgroundColor: '#3b82f6' }
                }
            },
            legend: {
                data: ['发送', '接收'],
                textStyle: { color: '#94a3b8' },
                top: 10
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: [],
                axisLine: { lineStyle: { color: '#334155' } },
                axisLabel: { 
                    color: '#94a3b8',
                    formatter: (value) => value.split(' ')[1] || value
                },
                splitLine: { show: false }
            },
            yAxis: {
                type: 'value',
                name: 'KB/s',
                nameTextStyle: { color: '#94a3b8' },
                axisLine: { lineStyle: { color: '#334155' } },
                axisLabel: { color: '#94a3b8' },
                splitLine: { lineStyle: { color: '#334155', type: 'dashed' } }
            },
            series: [
                {
                    name: '发送',
                    type: 'line',
                    smooth: true,
                    symbol: 'none',
                    sampling: 'lttb',
                    itemStyle: { color: '#3b82f6' },
                    lineStyle: { width: 2 },
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
                            { offset: 1, color: 'rgba(59, 130, 246, 0.01)' }
                        ])
                    },
                    data: []
                },
                {
                    name: '接收',
                    type: 'line',
                    smooth: true,
                    symbol: 'none',
                    sampling: 'lttb',
                    itemStyle: { color: '#10b981' },
                    lineStyle: { width: 2 },
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
                            { offset: 1, color: 'rgba(16, 185, 129, 0.01)' }
                        ])
                    },
                    data: []
                }
            ],
            animation: true,
            animationDuration: 300,
            animationEasing: 'linear'
        };
        
        this.chart.setOption(option);
        console.log('Chart initialized');
    },

    /**
     * 启动定时器
     */
    startTimers() {
        // 每秒更新统计数据
        this.updateTimer = setInterval(() => this.updateStats(), 1000);
        
        // 每2秒更新图表（加快刷新频率）
        this.chartTimer = setInterval(() => this.updateChartRealtime(), 2000);
        
        console.log('Timers started');
    },

    /**
     * 加载初始历史数据
     */
    async loadInitialHistory() {
        if (!this.currentInterface) {
            console.log('No interface selected, skipping history load');
            return;
        }

        try {
            console.log('Loading history for:', this.currentInterface);
            const response = await fetch(`/api/monitor/history/${this.currentInterface}`);
            const data = await response.json();
            
            if (data.timestamp && data.timestamp.length > 0) {
                this.dataBuffer.timestamps = data.timestamp.slice(-this.maxPoints);
                this.dataBuffer.sent = data.sent.slice(-this.maxPoints);
                this.dataBuffer.recv = data.recv.slice(-this.maxPoints);

                this.chart.setOption({
                    xAxis: { data: this.dataBuffer.timestamps },
                    series: [
                        { data: this.dataBuffer.sent },
                        { data: this.dataBuffer.recv }
                    ]
                });
                
                console.log('History loaded, points:', this.dataBuffer.timestamps.length);
            } else {
                console.log('No history data available');
                // 初始化空数据
                this.initEmptyData();
            }
        } catch (error) {
            console.error('加载历史数据失败:', error);
            this.initEmptyData();
        }
    },

    /**
     * 初始化空数据
     */
    initEmptyData() {
        const now = new Date();
        for (let i = this.maxPoints - 1; i >= 0; i--) {
            const t = new Date(now.getTime() - i * 2000);
            const timeStr = t.toLocaleTimeString('zh-CN', { 
                hour12: false, 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit' 
            });
            this.dataBuffer.timestamps.push(timeStr);
            this.dataBuffer.sent.push(0);
            this.dataBuffer.recv.push(0);
        }
        
        this.chart.setOption({
            xAxis: { data: this.dataBuffer.timestamps },
            series: [
                { data: this.dataBuffer.sent },
                { data: this.dataBuffer.recv }
            ]
        });
    },

    /**
     * 切换网卡 - 关键修复函数！
     */
    async changeInterface() {
        const select = document.getElementById('interface-select');
        if (!select) {
            console.error('Interface select element not found');
            return;
        }
        
        const newInterface = select.value;
        console.log('Changing interface from', this.currentInterface, 'to', newInterface);
        
        if (newInterface === this.currentInterface) {
            console.log('Interface not changed, same value');
            return;
        }

        this.currentInterface = newInterface;
        
        // 更新界面显示
        const interfaceNameEl = document.getElementById('interface-name');
        if (interfaceNameEl) {
            interfaceNameEl.textContent = this.currentInterface;
        }

        // 更新状态指示器
        const statusIndicator = document.getElementById('current-interface-display');
        if (statusIndicator) {
            statusIndicator.className = 'status-indicator status-running';
            statusIndicator.innerHTML = '<i class="fas fa-circle"></i> <span id="interface-name">' + this.currentInterface + '</span>';
        }

        console.log('Interface changed to:', this.currentInterface);
        
        // 清空缓冲区并重新加载
        this.dataBuffer = { timestamps: [], sent: [], recv: [] };
        await this.loadInitialHistory();
        await this.updateStats();
        
        // 重新启动定时器
        this.startTimers();
    },

    /**
     * 更新统计数据（每秒）
     */
    async updateStats() {
        if (!this.currentInterface) {
            console.log('No interface, skipping stats update');
            return;
        }

        try {
            const response = await fetch(`/api/monitor/stats/${this.currentInterface}`);
            const data = await response.json();
            
            if (data.error) {
                console.error('Stats error:', data.error);
                return;
            }

            this.currentStats = data;
            
            // 更新DOM
            const totalSentEl = document.getElementById('total-sent');
            const totalRecvEl = document.getElementById('total-recv');
            const sentRateEl = document.getElementById('sent-rate');
            const recvRateEl = document.getElementById('recv-rate');
            
            if (totalSentEl) totalSentEl.textContent = data.total_sent.toFixed(2);
            if (totalRecvEl) totalRecvEl.textContent = data.total_recv.toFixed(2);
            if (sentRateEl) sentRateEl.textContent = data.sent_rate.toFixed(2);
            if (recvRateEl) recvRateEl.textContent = data.recv_rate.toFixed(2);
            
            console.log('Stats updated:', data);
        } catch (error) {
            console.error('更新统计失败:', error);
        }
    },

    /**
     * 更新图表（每2秒）
     */
    updateChartRealtime() {
        if (!this.currentInterface || !this.isInitialized) {
            return;
        }

        const timeStr = Utils.getCurrentTime();
        const sentRate = parseFloat((this.currentStats.sent_rate || 0).toFixed(2));
        const recvRate = parseFloat((this.currentStats.recv_rate || 0).toFixed(2));

        // 添加新数据到缓冲区
        this.dataBuffer.timestamps.push(timeStr);
        this.dataBuffer.sent.push(sentRate);
        this.dataBuffer.recv.push(recvRate);

        // 保持最大数据点数
        if (this.dataBuffer.timestamps.length > this.maxPoints) {
            this.dataBuffer.timestamps.shift();
            this.dataBuffer.sent.shift();
            this.dataBuffer.recv.shift();
        }

        // 更新图表
        if (this.chart) {
            this.chart.setOption({
                xAxis: { 
                    data: this.dataBuffer.timestamps,
                    animation: false
                },
                series: [
                    { 
                        data: this.dataBuffer.sent,
                        animation: true,
                        animationDuration: 1000
                    },
                    { 
                        data: this.dataBuffer.recv,
                        animation: true,
                        animationDuration: 1000
                    }
                ]
            });
        }
        
        console.log('Chart updated:', timeStr, 'Sent:', sentRate, 'Recv:', recvRate);
    },

    /**
     * 销毁
     */
    destroy() {
        if (this.updateTimer) clearInterval(this.updateTimer);
        if (this.chartTimer) clearInterval(this.chartTimer);
        if (this.chart) this.chart.dispose();
    },

    /**
     * 调整大小
     */
    resize() {
        if (this.chart) this.chart.resize();
    }
};
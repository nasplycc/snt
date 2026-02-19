/**
 * Smart Network Tool - 主应用 - 修复版
 */

const App = {
    currentTab: 'monitor',

    /**
     * 初始化应用
     */
    init() {
        console.log('App.init() started');
        
        // 等待所有模块加载完成
        setTimeout(() => {
            try {
                // 初始化各模块
                if (typeof MonitorModule !== 'undefined') {
                    MonitorModule.init();
                    console.log('MonitorModule initialized');
                }
                
                if (typeof TrafficBlackHoleModule !== 'undefined') {
                    TrafficBlackHoleModule.init();
                    console.log('TrafficBlackHoleModule initialized');
                }
                
                if (typeof ConfigModule !== 'undefined') {
                    ConfigModule.load();
                    console.log('ConfigModule initialized');
                }
                
                console.log('All modules initialized successfully');
                
                // 窗口大小改变时调整图表
                window.addEventListener('resize', () => this.handleResize());
                
            } catch (error) {
                console.error('Error initializing modules:', error);
            }
        }, 100);
        
        console.log('App.init() completed');
    },

    /**
     * 处理窗口大小改变
     */
    handleResize() {
        if (typeof MonitorModule !== 'undefined') MonitorModule.resize();
        if (typeof TrafficBlackHoleModule !== 'undefined') TrafficBlackHoleModule.resize();
    },

    /**
     * 暴露全局函数（供HTML内联事件调用）
     */
    toggleDownOnly() {
        if (typeof TrafficBlackHoleModule !== 'undefined') {
            TrafficBlackHoleModule.toggleService();
        }
    },

    changeInterface() {
        if (typeof MonitorModule !== 'undefined') {
            MonitorModule.changeInterface();
        }
    },

    saveConfig(event) {
        if (typeof ConfigModule !== 'undefined') {
            ConfigModule.save(event);
        }
    },
    
    resetToDefault() {
        if (typeof ConfigModule !== 'undefined') {
            if (confirm('确定要恢复默认配置吗？当前配置将被覆盖。')) {
                ConfigModule.resetToDefault();
            }
        }
    }
};

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', () => App.init());

// 暴露全局函数（供HTML内联事件调用）
window.App = App;
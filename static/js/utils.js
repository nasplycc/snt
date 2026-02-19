/**
 * 通用工具函数
 */

const Utils = {
    /**
     * 格式化字节数
     */
    formatBytes(bytes) {
        if (bytes >= 1e12) return (bytes/1e12).toFixed(2) + ' TB';
        if (bytes >= 1e9) return (bytes/1e9).toFixed(2) + ' GB';
        if (bytes >= 1e6) return (bytes/1e6).toFixed(2) + ' MB';
        if (bytes >= 1e3) return (bytes/1e3).toFixed(2) + ' KB';
        return bytes + ' B';
    },

    /**
     * 格式化运行时间
     */
    formatUptime(seconds) {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    },

    /**
     * 获取当前时间字符串
     */
    getCurrentTime() {
        return new Date().toLocaleTimeString('zh-CN', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });
    },

    /**
     * 防抖函数
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * 安全的fetch包装
     */
    async fetchJson(url, options = {}) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`Fetch error for ${url}:`, error);
            throw error;
        }
    }
};
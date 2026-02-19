/**
 * ECharts 图表配置工厂
 */

const ChartConfigs = {
    /**
     * DownOnly实时速度图表配置
     */
    downonlySpeed() {
        const times = Array(30).fill('').map((_, i) => {
            const d = new Date();
            d.setSeconds(d.getSeconds() - (30 - i));
            return d.toLocaleTimeString('zh-CN', { 
                hour12: false, 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit' 
            });
        });

        return {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'axis',
                backgroundColor: '#1e293b',
                borderColor: '#334155',
                textStyle: { color: '#f1f5f9' },
                formatter: '{b}<br/>速度: {c} Mbps'
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
                data: times,
                axisLine: { lineStyle: { color: '#334155' } },
                axisLabel: { 
                    color: '#94a3b8',
                    interval: 4
                }
            },
            yAxis: {
                type: 'value',
                name: 'Mbps',
                nameTextStyle: { color: '#94a3b8' },
                axisLine: { lineStyle: { color: '#334155' } },
                axisLabel: { color: '#94a3b8' },
                splitLine: { lineStyle: { color: '#334155', type: 'dashed' } },
                min: 0
            },
            series: [{
                type: 'line',
                smooth: true,
                symbol: 'none',
                sampling: 'lttb',
                lineStyle: { color: '#3b82f6', width: 2 },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
                        { offset: 1, color: 'rgba(59, 130, 246, 0.01)' }
                    ])
                },
                data: Array(30).fill(0)
            }],
            animation: true,
            animationDuration: 500
        };
    },

    /**
     * 月度历史图表配置
     */
    history() {
        return {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'axis',
                backgroundColor: '#1e293b',
                borderColor: '#334155',
                textStyle: { color: '#f1f5f9' },
                formatter: (params) => {
                    const bytes = params[0].value;
                    let val = bytes;
                    let unit = 'B';
                    if (bytes >= 1e12) { val = bytes/1e12; unit = 'TB'; }
                    else if (bytes >= 1e9) { val = bytes/1e9; unit = 'GB'; }
                    else if (bytes >= 1e6) { val = bytes/1e6; unit = 'MB'; }
                    else if (bytes >= 1e3) { val = bytes/1e3; unit = 'KB'; }
                    return `${params[0].name}日<br/>流量: ${val.toFixed(2)} ${unit}`;
                }
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: Array(31).fill(0).map((_, i) => i + 1),
                axisLine: { lineStyle: { color: '#334155' } },
                axisLabel: { color: '#94a3b8' }
            },
            yAxis: {
                type: 'value',
                name: '流量',
                nameTextStyle: { color: '#94a3b8' },
                axisLine: { lineStyle: { color: '#334155' } },
                axisLabel: { 
                    color: '#94a3b8',
                    formatter: (value) => {
                        if (value >= 1e12) return (value/1e12).toFixed(1) + 'T';
                        if (value >= 1e9) return (value/1e9).toFixed(1) + 'G';
                        if (value >= 1e6) return (value/1e6).toFixed(1) + 'M';
                        if (value >= 1e3) return (value/1e3).toFixed(1) + 'K';
                        return value;
                    }
                },
                splitLine: { lineStyle: { color: '#334155', type: 'dashed' } }
            },
            series: [{
                type: 'bar',
                data: Array(31).fill(0),
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, '#3b82f6' },
                        { offset: 1, '#1d4ed8' }
                    ]),
                    borderRadius: [4, 4, 0, 0]
                }
            }],
            animation: true
        };
    }
};
/**
 * 配置模块 - 修复版
 */

const ConfigModule = {
    config: {
        "speed_limit_mbps": 10,
        "daily_quota_min_gb": 100,
        "daily_quota_max_gb": 200,
        "schedule_start": "00:00",
        "schedule_end": "23:59",
        "sleep_min_minutes": 10,
        "sleep_max_minutes": 20,
        "urls": []
    },
    isInitialized: false,
    notificationTimer: null,

    /**
     * 初始化配置模块
     */
    init() {
        console.log('ConfigModule.init() started');
        
        // 绑定配置表单提交事件
        const configForm = document.getElementById('config-form');
        if (configForm) {
            configForm.addEventListener('submit', (e) => {
                console.log('配置表单提交事件触发');
                e.preventDefault(); // 阻止默认提交行为
                e.stopPropagation(); // 阻止事件冒泡
                e.stopImmediatePropagation(); // 阻止其他监听器
                console.log('配置表单提交被阻止');
                
                // 延迟保存，避免页面跳转
                setTimeout(() => {
                    this.save();
                }, 10);
                
                return false; // 阻止默认行为
            });
            
            // 阻止所有可能的表单提交行为
            configForm.addEventListener('click', (e) => {
                if (e.target.type === 'submit') {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('提交按钮点击被阻止');
                    setTimeout(() => {
                        this.save();
                    }, 10);
                }
            });
        }
        
        // 加载配置
        this.load();
        this.isInitialized = true;
        
        console.log('ConfigModule.init() completed');
    },

    /**
     * 从配置文件加载默认值
     */
    loadDefaultValues() {
        console.log('开始加载默认配置值...');
        
        try {
            // 从配置服务获取默认配置
            fetch('/api/downonly/config')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('HTTP ' + response.status);
                    }
                    return response.json();
                })
                .then(config => {
                    console.log('从配置文件加载默认值:', config);
                    
                    // 更新表单字段
                    Object.entries(config).forEach(([key, value]) => {
                        const element = document.getElementById(this.getFieldId(key));
                        if (element) {
                            if (element.type === 'number') {
                                element.value = value;
                            } else if (element.type === 'text') {
                                element.value = value;
                            }
                            console.log(`更新字段 ${key} = ${value}`);
                        }
                    });
                    
                    // 更新URL列表
                    this.updateURLListFromConfig(config.urls || []);
                    
                })
                .catch(error => {
                    console.error('加载配置文件默认值失败:', error);
                    // 使用默认配置
                    this.loadDefaultConfig();
                });
        } catch (error) {
            console.error('加载配置文件默认值异常:', error);
            // 使用默认配置
            this.loadDefaultConfig();
        }
    },
    
    /**
     * 加载默认配置
     */
    loadDefaultConfig() {
        console.log('加载默认配置...');
        
        const defaultConfig = {
            speed_limit_mbps: 10,
            daily_quota_min_gb: 100,
            daily_quota_max_gb: 200,
            schedule_start: "00:00",
            schedule_end: "23:59",
            sleep_min_minutes: 10,
            sleep_max_minutes: 20,
            urls: []
        };
        
        // 更新表单字段
        Object.entries(defaultConfig).forEach(([key, value]) => {
            const element = document.getElementById(this.getFieldId(key));
            if (element) {
                if (element.type === 'number') {
                    element.value = value;
                } else if (element.type === 'text') {
                    element.value = value;
                }
                console.log(`设置默认字段 ${key} = ${value}`);
            }
        });
        
        // 更新URL列表
        this.updateURLListFromConfig(defaultConfig.urls || []);
    },

    /**
     * 根据配置键获取表单字段ID
     */
    getFieldId(configKey) {
        const fieldMap = {
            'speed_limit_mbps': 'speed-limit',
            'daily_quota_min_gb': 'daily-quota-min',
            'daily_quota_max_gb': 'daily-quota-max',
            'schedule_start': 'schedule-start',
            'schedule_end': 'schedule-end',
            'sleep_min_minutes': 'sleep-min',
            'sleep_max_minutes': 'sleep-max'
        };
        return fieldMap[configKey] || configKey;
    },

    /**
     * 从配置更新URL列表
     */
    updateURLListFromConfig(urls) {
        console.log('从配置更新URL列表:', urls);
        this.config.urls = urls || [];
        this.updateURLList();
    },

    /**
     * 加载配置
     */
    load() {
        console.log('开始加载配置...');
        
        return fetch('/api/downonly/config')
            .then(response => {
                console.log('配置加载响应状态:', response.status);
                if (!response.ok) {
                    throw new Error('HTTP ' + response.status);
                }
                return response.json();
            })
            .then(config => {
                console.log('加载配置成功:', config);
                this.config = {...config};
                // 更新URL列表显示
                this.updateURLList();
                return this.config;
            })
            .catch(error => {
                console.error('加载配置失败:', error);
                // 使用当前配置
                this.config = {...this.config};
                return this.config;
            });
    },

    /**
     * 保存配置 - 修复版本
     */
    save() {
        console.log('开始保存配置...');
        
        try {
            // 获取表单数据
            const config = {
                speed_limit_mbps: parseInt(document.getElementById('speed-limit').value) || 10,
                daily_quota_min_gb: parseInt(document.getElementById('daily-quota-min').value) || 100,
                daily_quota_max_gb: parseInt(document.getElementById('daily-quota-max').value) || 200,
                schedule_start: document.getElementById('schedule-start').value || '00:00',
                schedule_end: document.getElementById('schedule-end').value || '23:59',
                sleep_min_minutes: parseInt(document.getElementById('sleep-min').value) || 10,
                sleep_max_minutes: parseInt(document.getElementById('sleep-max').value) || 20,
                urls: []
            };
            
            // 获取所有URL输入框的值
            const urlInputs = document.querySelectorAll('#url-list input[type="url"]');
            urlInputs.forEach(input => {
                if (input.value.trim()) {
                    config.urls.push(input.value.trim());
                }
            });
            
            console.log('准备发送配置:', config);

            return fetch('/api/downonly/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(config)
            })
            .then(response => {
                console.log('配置保存响应:', response.status);
                if (!response.ok) {
                    throw new Error('保存配置失败: HTTP ' + response.status);
                }
                return response.json();
            })
            .then(result => {
                console.log('配置保存成功:', result);
                this.config = config;
                this.showNotification('配置已保存', 'success');
                return result;
            })
            .catch(error => {
                console.error('保存配置失败:', error);
                this.showNotification('保存配置失败: ' + error.message, 'error');
                throw error;
            });
        } catch (error) {
            console.error('保存配置异常:', error);
            this.showNotification('保存配置失败: ' + error.message, 'error');
            throw error;
        }
    },

    /**
     * 添加URL - 修复版本
     */
    addURL() {
        const urlInput = document.getElementById('url-input');
        if (!urlInput) return;
        
        const url = urlInput.value.trim();
        if (!url) {
            this.showNotification('请输入有效的URL', 'error');
            return;
        }
        
        // 验证URL格式
        try {
            new URL(url);
        } catch (e) {
            this.showNotification('请输入有效的URL格式', 'error');
            return;
        }
        
        console.log('准备添加URL:', url);
        
        // 直接更新配置并保存，避免异步操作复杂性
        if (!this.config.urls) {
            this.config.urls = [];
        }
        
        // 检查是否已存在
        if (this.config.urls.includes(url)) {
            this.showNotification('该URL已存在', 'error');
            return;
        }
        
        // 添加URL到当前配置
        this.config.urls.push(url);
        
        console.log('添加URL:', url, '当前列表:', this.config.urls);
        
        // 立即更新显示
        this.updateURLList();
        urlInput.value = '';
        
        // 保存配置
        this.save().then(() => {
            this.showNotification('URL已添加', 'success');
            // 重新加载配置以确保同步
            this.load();
        }).catch(error => {
            console.error('保存配置失败:', error);
            this.showNotification('保存配置失败', 'error');
        });
    },

    /**
     * 更新每日配额 - 简化版本
     */
    updateDailyQuota(quotaGB) {
        if (!quotaGB || quotaGB < 1) {
            this.showNotification('配额必须大于0', 'error');
            return;
        }
        
        console.log('更新配额为:', quotaGB);
        
        // 直接更新配额配置
        this.config.daily_quota_min_gb = parseInt(quotaGB);
        this.config.daily_quota_max_gb = parseInt(quotaGB);
        
        // 显示成功消息
        this.showNotification(`配额已更新为 ${quotaGB} GB`, 'success');
    },

    /**
     * 获取当前URL列表
     */
    getCurrentURLs() {
        const urlInputs = document.querySelectorAll('.url-input');
        return Array.from(urlInputs).map(input => input.value);
    },

    /**
     * 更新URL列表显示
     */
    updateURLList() {
        const urlList = document.getElementById('url-list');
        if (!urlList) return;
        
        console.log('更新URL列表，当前URLs:', this.config.urls);
        
        // 清空现有列表
        urlList.innerHTML = '';
        
        // 添加URL项
        if (this.config.urls && Array.isArray(this.config.urls) && this.config.urls.length > 0) {
            this.config.urls.forEach((url, index) => {
                if (url && url.trim()) {  // 只显示非空URL
                    const urlItem = document.createElement('div');
                    urlItem.className = 'url-item';
                    urlItem.style.cssText = 'margin-bottom: 10px; display: flex; align-items: center; gap: 10px;';
                    
                    // 创建删除按钮并绑定事件
                    const deleteBtn = document.createElement('button');
                    deleteBtn.type = 'button';
                    deleteBtn.setAttribute('data-index', index);
                    deleteBtn.className = 'btn btn-danger btn-sm delete-btn';
                    deleteBtn.style.cssText = 'padding: 5px 10px;';
                    deleteBtn.innerHTML = '<i class="fas fa-trash"></i> 删除';
                    
                    // 创建URL输入框
                    const urlInput = document.createElement('input');
                    urlInput.type = 'url';
                    urlInput.value = url;
                    urlInput.setAttribute('data-index', index);
                    urlInput.className = 'url-input';
                    urlInput.style.cssText = 'flex: 1;';
                    
                    // 组装URL项
                    urlItem.appendChild(urlInput);
                    urlItem.appendChild(deleteBtn);
                    urlList.appendChild(urlItem);
                    
                    // 立即为删除按钮绑定事件
                    deleteBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('删除按钮被点击:', index);
                        ConfigModule.removeURL(index);
                    });
                }
            });
        }
        
        // 添加添加按钮（如果不存在）
        const existingAddBtn = urlList.querySelector('#add-url-btn');
        if (!existingAddBtn) {
            const addButton = document.createElement('button');
            addButton.id = 'add-url-btn';
            addButton.className = 'btn btn-primary btn-sm';
            addButton.style.cssText = 'margin-top: 10px; padding: 5px 10px;';
            addButton.innerHTML = '<i class="fas fa-plus"></i> 添加到下载列表';
            
            // 为添加按钮绑定事件
            addButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('添加按钮被点击');
                ConfigModule.addURL();
            });
            
            urlList.appendChild(addButton);
        }
    },

    /**
     * 移除URL
     */
    removeURL(index) {
        if (!this.config.urls || !Array.isArray(this.config.urls)) {
            this.showNotification('配置加载失败', 'error');
            return;
        }
        
        // 检查索引是否有效
        if (index < 0 || index >= this.config.urls.length) {
            this.showNotification('无效的URL索引', 'error');
            return;
        }
        
        const urlToRemove = this.config.urls[index];
        
        if (urlToRemove && urlToRemove.trim()) {
            // 从配置中移除URL
            this.config.urls.splice(index, 1);
            
            console.log('移除URL:', urlToRemove, '索引:', index);
            console.log('移除后配置:', this.config.urls);
            
            // 立即更新显示
            this.updateURLList();
            
            // 保存配置
            this.save().then(() => {
                this.showNotification('URL已移除', 'success');
            }).catch(error => {
                console.error('保存配置失败:', error);
                this.showNotification('保存配置失败', 'error');
            });
        } else {
            this.showNotification('要删除的URL为空', 'error');
        }
    },

    /**
     * 重置为默认配置
     */
    resetToDefault() {
        if (confirm('确定要恢复默认配置吗？当前配置将被覆盖。')) {
            try {
                fetch('/api/downonly/config', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        "reset_to_default": true
                    })
                })
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    } else {
                        throw new Error('HTTP ' + response.status);
                    }
                })
                .then(result => {
                    this.showNotification('已恢复默认配置', 'success');
                    setTimeout(() => this.load(), 1000);
                })
                .catch(error => {
                    console.error('恢复默认配置失败:', error);
                    this.showNotification('恢复默认配置失败: ' + error.message, 'error');
                });
            } catch (error) {
                console.error('恢复默认配置异常:', error);
                this.showNotification('恢复默认配置失败: ' + error.message, 'error');
            }
        }
    },

    /**
     * 显示通知
     */
    showNotification(message, type = 'info') {
        // 清除现有通知
        if (this.notificationTimer) {
            clearTimeout(this.notificationTimer);
        }
        
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
        this.notificationTimer = setTimeout(() => {
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
window.ConfigModule = ConfigModule;
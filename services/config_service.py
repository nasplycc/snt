"""配置服务 - 修复版"""

import os
import json
from datetime import datetime

class ConfigService:
    """配置服务 - 修复版"""
    
    def __init__(self):
        # 使用正确的配置文件路径
        self.config_file = "/vol1/1000/Smart-Network-Tool/data/config.json"
        
        # 默认配置 - 与前端保持一致
        self.default_config = {
            "speed_limit_mbps": 10,
            "daily_quota_min_gb": 100,
            "daily_quota_max_gb": 200,
            "schedule_start": "00:00",
            "schedule_end": "23:59",
            "sleep_min_minutes": 10,
            "sleep_max_minutes": 20,
            "urls": []  # 移除所有默认下载源，只保留用户自定义的
        }
        
        # 确保目录存在
        os.makedirs(os.path.dirname(self.config_file), exist_ok=True)
        
        # 加载配置
        self.config = self.load_config()
        print(f"配置服务初始化完成")
        print(f"配置文件: {self.config_file}")
    
    def load_config(self):
        """加载配置 - 修复版"""
        try:
            print(f"正在加载配置文件: {self.config_file}")
            
            if os.path.exists(self.config_file):
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                    print(f"配置文件已加载")
                    
                    # 检查是否有嵌套的downonly配置，如果有则合并
                    if 'downonly' in config and isinstance(config['downonly'], dict):
                        print("检测到嵌套的downonly配置，进行合并")
                        # 将downonly中的配置合并到顶层
                        nested_config = config['downonly']
                        for key, value in nested_config.items():
                            if key not in config or (key == 'urls' and isinstance(value, list)):
                                config[key] = value
                        # 删除嵌套的downonly配置
                        del config['downonly']
                    
                    # 确保配置包含所有必要字段
                    for key, value in self.default_config.items():
                        if key not in config:
                            config[key] = value
                    
                    print(f"最终配置结构: {config}")
                    return config
            else:
                print("配置文件不存在，创建默认配置")
                # 保存默认配置
                self.save_config(self.default_config.copy())
                return self.default_config.copy()
        except Exception as e:
            print(f"加载配置失败: {e}")
            # 使用默认配置
            self.save_config(self.default_config.copy())
            return self.default_config.copy()
    
    def save_config(self, config):
        """保存配置 - 修复版"""
        try:
            print(f"正在保存配置到默认配置文件: {config}")
            
            # 确保目录存在
            os.makedirs(os.path.dirname(self.config_file), exist_ok=True)
            
            # 保存配置到默认配置文件
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=4, ensure_ascii=False)
            
            # 更新内存中的配置
            self.config = config.copy()
            
            print(f"配置已保存到默认配置文件: {self.config_file}")
            return True
            
        except Exception as e:
            print(f"保存配置失败: {e}")
            return False
    
    def get_config(self):
        """获取配置"""
        # 重新加载配置确保是最新的
        fresh_config = self.load_config()
        return fresh_config.copy()
    
    def update_config(self, updates):
        """更新配置"""
        config = self.get_config()
        
        # 特别处理URL列表，确保不丢失现有URL
        if 'urls' in updates:
            # 如果新URL列表不为空，则更新，否则保留现有URL
            if updates['urls'] and len(updates['urls']) > 0:
                config['urls'] = updates['urls']
            else:
                # 如果发送空URL列表，保持现有URL不变
                pass
        else:
            config.update(updates)
        
        # 如果有配额更新，通知流量黑洞服务
        if 'daily_quota_min_gb' in updates:
            try:
                from services.downonly_service import update_daily_quota
                update_daily_quota(updates.get('daily_quota_min_gb', 150))
            except Exception as e:
                print(f"更新流量黑洞配额失败: {e}")
        
        print(f"更新配置后最终配置: {config}")
        return self.save_config(config)
    
    def reset_to_default(self):
        """重置为默认配置"""
        return self.save_config(self.default_config.copy())

# 全局实例
config_service = ConfigService()

def get_config():
    return config_service.get_config()

def save_config(config):
    return config_service.save_config(config)

def update_config(updates):
    return config_service.update_config(updates)

def reset_to_default():
    return config_service.reset_to_default()
"""DownOnly路由 - 修复版"""

from flask import Blueprint, jsonify, request
from services.downonly_service import toggle_service as toggle_downonly, get_status, get_history
from services.config_service import get_config, save_config, update_config

downonly_bp = Blueprint('downonly', __name__, url_prefix='/api/downonly')


@downonly_bp.route('/status')
def get_status_route():
    """获取服务状态"""
    try:
        status = get_status()
        return jsonify(status)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@downonly_bp.route('/toggle', methods=['POST'])
def toggle_route():
    """启停切换"""
    try:
        result = toggle_downonly()
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@downonly_bp.route('/history')
def get_history_route():
    """获取月度历史"""
    try:
        month = request.args.get('month', 2, type=int)
        history = get_history(month)
        return jsonify(history)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@downonly_bp.route('/config', methods=['GET', 'POST'])
def config_route():
    """配置管理"""
    try:
        if request.method == 'POST':
            new_config = request.json
            result = update_config(new_config)
            if result:
                # 配置保存成功后，通知流量黑洞服务更新URL列表
                try:
                    downonly_service.update_urls_from_config()
                    print("流量黑洞服务URL列表已更新")
                except Exception as e:
                    print(f"通知流量黑洞服务失败: {e}")
                return jsonify({"ok": True})
            else:
                return jsonify({"error": "保存配置失败"}), 500
        else:
            config = get_config()
            return jsonify(config)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@downonly_bp.route('/speed')
def get_speed_route():
    """获取实时速度"""
    try:
        interface = request.args.get('interface', 'enp2s0')
        status = get_status()
        
        # 从服务状态中获取速度信息
        speed_mbps = status.get('speed_mbps', 0)
        
        return jsonify({
            "interface": interface,
            "speed": speed_mbps,
            "timestamp": status.get('last_update')
        })
    except Exception as e:
        return jsonify({"error": str(e), "speed": 0}), 500
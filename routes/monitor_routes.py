"""网卡监测路由 - 修复版"""

from flask import Blueprint, jsonify
from services.monitor_service import get_interfaces, get_stats, get_history

monitor_bp = Blueprint('monitor', __name__, url_prefix='/api/monitor')


@monitor_bp.route('/interfaces')
def get_interfaces_route():
    """获取网卡列表"""
    try:
        interfaces = get_interfaces()
        return jsonify(interfaces)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@monitor_bp.route('/stats/<interface>')
def get_stats_route(interface):
    """获取网卡实时统计"""
    try:
        stats = get_stats(interface)
        if 'error' in stats:
            return jsonify(stats), 404
        return jsonify(stats)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@monitor_bp.route('/history/<interface>')
def get_history_route(interface):
    """获取网卡历史数据"""
    try:
        history = get_history(interface)
        return jsonify(history)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
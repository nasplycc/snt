"""路由包初始化"""

from flask import Flask
from .monitor_routes import monitor_bp
from .downonly_routes import downonly_bp


def register_routes(app: Flask):
    """注册所有路由"""
    app.register_blueprint(monitor_bp)
    app.register_blueprint(downonly_bp)




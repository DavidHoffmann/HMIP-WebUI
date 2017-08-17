# -*- coding: utf-8 -*-

from flask import Flask, json, g
from flask import render_template
import os
import config
import sqlite3
import time

os.environ['TZ'] = config.TIMEZONE
time.tzset()

app = Flask(__name__, template_folder='templates')
app.config.update(
    DEBUG = config.DEBUG,
    SECRET_KEY = config.SECRET_KEY
)

# DATABASE
def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(config.DATABASE_FILENAME)
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def init_db():
    with app.app_context():
        db = get_db()
        with app.open_resource('schema.sql', mode='r') as f:
            db.cursor().executescript(f.read())
        db.commit()

def query_db(query, args=(), one=False):
    cur = get_db().execute(query, args)
    rv = cur.fetchall()
    cur.close()
    return (rv[0] if rv else None) if one else rv

# INDEX.HTML
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/hmip-webui.js')
def script():
    return render_template('hmip-webui.js')

# GROUPS
@app.route('/api/groups', methods=['GET'])
def api_groups():
    q = query_db('SELECT id, label FROM groups ORDER BY label;')
    return json.dumps(q)

@app.route('/api/groupdevices/<string:group_id>', methods=['GET'])
def api_group_devices(group_id):
    q = query_db('SELECT id, label, type FROM devices WHERE group_id = ? ORDER BY label;', [group_id])
    return json.dumps(q)

# LOGS
@app.route('/api/devicelogs/<int:cnt_values>/<string:device_id>', methods=['GET'])
def api_device_logs(cnt_values, device_id):
    q = query_db('SELECT DATETIME(created, "localtime"), window_state, valve_position, humidity, actual_temperature FROM logs WHERE device_id = ? ORDER BY created DESC LIMIT ?;', [device_id, cnt_values])
    return json.dumps(q)

if __name__ == '__main__':
    app.run(host = config.HOST)

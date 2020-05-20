from flask import Flask, render_template, request, json, send_file
from werkzeug.utils import secure_filename
from os.path import isfile, splitext
from time import time
from flask_socketio import SocketIO, send, emit, join_room, leave_room, rooms as myroom
from datetime import datetime

app = Flask(__name__)
#app.config['SECRET_KEY'] = 'vnkdjnfjknfl1232#'
socketio = SocketIO(app)
static = app.root_path + '/static/'

@app.route('/')
def home():
    return render_template('chat.html')

@app.route('/favicon.ico')
def myicon():
    path = static+'favicon.ico'
    return send_file(path)

@app.route('/saveChatImage', methods=['POST'])
def saveChatImage():
    try:
        file=request.files['file']
        name=secure_filename(file.filename)
        f,ext=splitext(name)
        name='img'+str(int(time()*100000))+ext
        fname=static+'chat/'+name
        file.save(fname)
        return json.dumps({'code':0, 'msg':'./static/chat/'+name})
    except Exception as e:
        return json.dumps({'code':1, 'msg':str(e)})


prooms= dict()
rooms = dict()
sid = dict()
@socketio.on('joinroom')
def dologin(u, r, p):
    u = u.lower()
    if r not in rooms:
        rooms[r]={'p':p, 'u':{u:request.sid}, 'cnt':0, 'msg':[],
                  'f':'./static/chat/room'+str(int(time()*1000))+'.txt'}
        if p=='':
            prooms[r]=1
        sid[request.sid]=(r,u)
    else:
        if rooms[r]['p']!=p:
            return 1, 'wrong password', 0
        elif u.lower() in rooms[r]['u']:
            return 2, f'Sorry, user "{u}" already exists!', 0
        rooms[r]['u'][u]=request.sid
        sid[request.sid]=(r,u)
    join_room(r)
    emit('newuser', u, room=r, broadcast=True, include_self=False)
    return 0, 'ok', rooms[r]['u'], rooms[r]['cnt']

@socketio.on('getprooms')
def getprooms():
    return prooms

@socketio.on('aminew')
def adduser(u, r, p):
    u=u.lower()
    myid = request.sid
    if r in rooms:
        if p != rooms[r]['p']:
            return 1,0
        join_room(r)
        rooms[r]['u'][u]=myid
        sid[myid]=(r,u)
        emit('backuser', u, room=r, broadcast=True, include_self=False)
        return 0,rooms[r]['cnt'],rooms[r]['u']
    else:
        join_room(r)
        rooms[r]={'p':p, 'u':{u:request.sid}, 'cnt':0, 'msg':[],
                  'f':'./static/chat/room'+str(int(time()*1000))+'.txt'}
        if p=='':
            prooms[r]=1
        sid[myid]=(r,u)
        return 0,0
            

@socketio.on('byebye')
def removeuser(u, r):
    u = u.lower()
    if r not in rooms or u not in rooms[r]['u']:
        return 1
    sid.pop(rooms[r]['u'].pop(u))
    if len(rooms[r]['u'])==0:
        socketio.close_room(r)
        if r in prooms:
            del prooms[r]
        print('\nroom ', r, ' closed\n')
        fpath=rooms[r]['f']
        if len(rooms[r]['msg']):
            with open(fpath, 'a', encoding="utf-8") as f:
                f.write('\n'.join(rooms[r]['msg']))
        del rooms[r]
        return 1
    leave_room(r)
    emit('byeuser', u, room=r, broadcast=True)
    return 1

@socketio.on('disconnect')
def removeuser2():
    if request.sid not in sid:
        return
    r,u = sid[request.sid]
    sid.pop(rooms[r]['u'].pop(u))
    if len(rooms[r]['u'])==0:
        socketio.close_room(r)
        if r in prooms:
            del prooms[r]
        print('\nroom ', r, ' closed\n')
        fpath=rooms[r]['f']
        with open(fpath, 'a', encoding="utf-8") as f:
            f.write('\n\n'.join(rooms[r]['msg']))
        del rooms[r]
        return
    leave_room(r)
    emit('byeuser', u, room=r, broadcast=True)

@socketio.on('msg')
def handle_my_custom_event(msg, user, room):
    print('\nreceived msg: ', msg, '\n')
    rooms[room]['cnt']+=1
    time = datetime.now().isoformat(' ',timespec='seconds')[5:].lstrip('0')
    if len(rooms[room]['u'])==1:
        emit('msgbot', 'hii' )
    else:
        emit('msg', (msg, time, rooms[room]['cnt']), room=room, broadcast=True, include_self=False)
    rooms[room]['msg'].append(msg)
    return time, rooms[room]['cnt']




if __name__ == '__main__':
    socketio.run(app, debug=True)

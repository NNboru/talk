@echo off
cd F:\Rohan\Python\html\flask\talk
f:
set FLASK_DEBUG=1
set FLASK_APP=chat.py
python -m flask run --host=0.0.0.0
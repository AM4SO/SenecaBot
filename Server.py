import asyncio
import websockets
import json
import pyautogui as gui
import time
import mysql.connector
import sqlite3
from sqlite3 import Error

USE_LOCAL_DATABASE = True

saveAnswersSQL = None

def connectToDatabaseLocal():
    print("Connecting to database")
    return sqlite3.connect("Database.db")

def setUpDatabaseLocal():
    cursor.execute("""CREATE TABLE IF NOT EXISTS Questions (
                        QuestionID INTEGER PRIMARY KEY AUTOINCREMENT,
                        QuestionText VARCHAR(300),
                        Answers VARCHAR(300))""")
    cursor.execute("""CREATE INDEX IF NOT EXISTS QuestionIndex
                        ON Questions(QuestionText)""")
    
def connectToDatabase():
    print("Connecting to database")
    return mysql.connector.connect(user="AMASO@senecacheat", password="9t62WANrZtJ@tqR", host="senecacheat.mysql.database.azure.com", port=3306, ssl_verify_cert=True, database="SenecaCheat")

def saveAnswers(question, answers):
    sql = saveAnswersSQL
    val = (question, answers)
    cursor.execute(sql, val)
    connection.commit()

def getAnswers(question):
    sql = "SELECT Answers FROM Questions WHERE QuestionText = '" + question + "'";
    cursor.execute(sql)
    result = cursor.fetchall()
    if len(result) == 0:
        return "UNKNOWN"
    elif len(result) > 1:
        print("WARNING: Multiple records found with QuestionText: " + question)
    return result[0][0]

async def handleRequest(websocket, req):
    if req["RequestType"] == "KeyboardInput":
        for v in req["Answers"]:
            gui.typewrite(v)
            gui.hotkey("ctrl","backspace")
            time.sleep(0.35)
        await websocket.send("DONE")
        return "DONE"
    elif req["RequestType"] == "StoreAnswer":
        saveAnswers(req["Question"], json.dumps(req["Answers"]))
        await websocket.send("DONE")
        return "DONE"
    elif req["RequestType"] == "GetAnswer":
        ans = getAnswers(req["Question"])
        await websocket.send(ans)
        return ans

async def handler(websocket):
    while True:
        try:
            message = await websocket.recv()
            request = json.loads(message)
            res = await handleRequest(websocket, request)
        except websockets.ConnectionClosedOK:
            break
        print(message + " : " + res)

connection = None
cursor = None
if not USE_LOCAL_DATABASE:
    saveAnswersSQL = "INSERT INTO Questions(QuestionText, Answers) VALUES (%s, %s)"
    try:
        connection = connectToDatabase()
        print("Connected to database")
    except:
        print("Failed to connect to database")
    cursor = connection.cursor()
else:
    try:
        saveAnswersSQL = "INSERT INTO Questions(QuestionText, Answers) VALUES (?, ?)"
        connection = connectToDatabaseLocal()
        print("Connected to database")
        cursor = connection.cursor()
        setUpDatabaseLocal()
        print("Database is ready to use")
    except:
        print("Failed to connect to database")

async def main():
    async with websockets.serve(handler, "", 8000):
        await asyncio.Future()  # run forever
        
if __name__ == "__main__":
    asyncio.run(main())


import requests
import sqlite3
import json
import subprocess
import os
import datetime

PATH = os.path.abspath(os.getcwd()).replace("\\","/")
senecaDomain = "https://school-leaderboards.app.senecalearning.com"

class senecaLogBase:
    filePath = None
    connection = None
    cursor = None
    def __init__(self, dbfile, sqlCommandsFile):
        self.filePath = dbfile
        self.connection = sqlite3.connect(dbfile)
        self.cursor = self.connection.cursor()
        print("Connected to database: " + dbfile)

        f = open(sqlCommandsFile)
        sqlCommands = f.read().split(";")
        f.close()
        for cmd in sqlCommands:
            self.cursor.execute(cmd)

    def addSchool(self, schoolId, name, town, isPrivate):
        schoolId = schoolId.replace("-","")
        self.cursor.execute("SELECT EXISTS(SELECT id FROM schools WHERE id=?)",(schoolId,))
        response = self.cursor.fetchall()

        if response[0][0] == 1:
            print("School already exists")
            return
        self.cursor.execute("INSERT INTO Schools(id,name,town,privateSchool) VALUES(?,?,?,?)",
                            (schoolId,name,town,isPrivate=="True"))
        self.connection.commit()
    def addLeaderboard(self, weekId, startTime, endTime):
        self.cursor.execute("SELECT EXISTS(SELECT * FROM LeaderboardWeeks WHERE id=?)",(weekId,))
        response = self.cursor.fetchall()
        if response[0][0] == 1:
            print("Leaderboard already exists:")
            #self.cursor.execute("SELECT * FROM LeaderboardWeeks WHERE id=?", (weekId,))
            #print(self.cursor.fetchall()[0])
            return
        self.cursor.execute("INSERT INTO LeaderboardWeeks(id,startTime,endTime) VALUES (?,DATETIME(?),DATETIME(?))",
                            (weekId,startTime, endTime))
        self.connection.commit()

    def addSchoolToLeaderboard(self, schoolId, leaderboardId):
        schoolId = schoolId.replace("-","")
        self.cursor.execute("""SELECT EXISTS(SELECT * FROM LeaderboardParticipations WHERE
                            participantSchoolId=? AND leaderboardId=?)""",(schoolId
                                                                           ,leaderboardId))
        response = self.cursor.fetchall()
        if response[0][0] == 1:
            print("School: " + schoolId + " already exists in leaderboard: " + leaderboardId)
            return
        
        self.cursor.execute("""INSERT INTO LeaderboardParticipations(leaderboardId,participantSchoolId)
                                Values (?,?)""", (leaderboardId, schoolId))
        self.connection.commit()
    
    def logParticipantProgress(self, logTime, participationId, score, leaderboardPos):
        sql = """INSERT INTO ParticipantProgressLogs
            (participationId, timeSinceStart, score, leaderboardPosition)
            VALUES (?,
                    JULIANDAY(?) - JULIANDAY((SELECT LeaderboardWeeks.startTime
                                            FROM LeaderboardParticipations
                                            INNER JOIN LeaderboardWeeks ON
                                                LeaderboardParticipations.leaderboardId = leaderboardWeeks.id
                                            WHERE LeaderboardParticipations.id=?))
                    ,?,?)"""
        self.cursor.execute(sql, (participationId, logTime, participationId, score, leaderboardPos))
        self.connection.commit()
    def getParticipationId(self, schoolId, leaderboardId):
        self.cursor.execute("""SELECT id FROM LeaderboardParticipations WHERE
                                participantSchoolId=? AND leaderboardId=?""",
                                (schoolId, leaderboardId))
        response = self.cursor.fetchall()
        if (len(response) == 0):
            return -1
        else:
            return response[0][0]
    def getProgressLogs(self, schoolId=None, leaderboardId=None, participationId=None, logId=None):
        innerJoin = """INNER JOIN LeaderboardParticipations ON
                        ParticipantProgressLogs.participationId = LeaderboardParticipations.id"""
        if logId:
            self.cursor.execute("SELECT * FROM ParticipantProgressLogs " + innerJoin +
                                " WHERE ParticipantProgressLogs.id=?",(logId,))
            return self.cursor.fetchall()[0]
        if participationId:
            self.cursor.execute("SELECT * FROM ParticipantProgressLogs " + innerJoin +
                                " WHERE participationId=?",
                                (participationId,))
            return self.cursor.fetchall()
        if schoolId or leaderboardId:
            sql = "SELECT * FROM ParticipantProgressLogs " + innerJoin + " WHERE "
            params = []
            if schoolId:
                sql += "participantSchoolId = ?" + " AND " * (not not leaderboardId)
                params.append(schoolId)
            if leaderboardId:
                sql += "leaderboardId=?"
                params.append(leaderboardId)
            self.cursor.execute(sql, params)
            return self.cursor.fetchall()
        self.cursor.execute("SELECT * FROM ParticipantProgressLogs " + innerJoin + " ")
        return self.cursor.fetchall()
    
    def closeConnection(self):
        self.connection.close()

timeOfLog = datetime.datetime.now().isoformat()
database = senecaLogBase("senecaTracker.db", "sqlCommands.txt")
database.addSchool("beb0ef9b1f884531b63ae1cf2dae5e04","dsfgdfg","dsfdsf","False")
database.addLeaderboard("testing","2022-09-18T21:00:00.000Z","2022-09-25T20:59:59.999Z")
database.addSchoolToLeaderboard("beb0ef9b1f884531b63ae1cf2dae5e04", "testing")
participationId = database.getParticipationId("beb0ef9b1f884531b63ae1cf2dae5e04", "testing")
database.logParticipantProgress(timeOfLog, participationId, 1000, 1)
logs = database.getProgressLogs()
for log in logs: ## [id, participationId, timeSinceStart, score, leaderboardPosition, lbPart.id, leaderboardId, schlId]
    #x = {"logId":log[0], "participationId":log[1], "score":log[2], "leaderboardPosiotion": log[3],
    #     "leaderboardParticipationId": log[4], "leaderboardId":log[5], "schoolId":log[6]}
    print(log)

database.closeConnection()

def getAccessKey():
    accessKeyFile = open("access-key.txt", "r")
    accessKey = accessKeyFile.read();
    accessKeyFile.close();
    return accessKey;

def getLeaderboard(accessKey):
    schoolId = "4b42f4b8-1451-4fe2-a5dc-8b577c79d16a"
    reqUrl = senecaDomain + "/api/leaderboards/school?schoolId=" + schoolId + "&category=localAuthority"
    correlationId = "1662849297057::736f326ff6e821d21c09b51cec32f928"
    reqHeaders = {"access-key": accessKey, "correlationid": correlationId}
    ret = requests.get(reqUrl, headers=reqHeaders)
    ret.close()
    return ret;

response = None
timeOfLog = datetime.datetime.now().isoformat()
while not response or response.status_code != 200:
    accessKey = getAccessKey();
    response = getLeaderboard(accessKey)
    if response.status_code == 401:
        print("Failed to get data from seneca API due to out of date access key")
        print("Getting new access key...")
        getToken = subprocess.Popen(PATH + "/getAccessKey.bat")#,shell=True)
        getToken.communicate()
        print("Got new access key")
    elif response.status_code != 200:
        raise "Fuck, it completely failed and I have no idea why"
    else:
        responseContent = response.json()
        print("\n\n\n" + str(responseContent))
        
    

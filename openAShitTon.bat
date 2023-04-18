SET /A BOTS=5
SET TASK_URL=https://app.senecalearning.com/classroom/course/2f7e3897-8547-4e08-b6f9-bbefc48a9d18/section/9f825957-bbd9-4ad8-96ad-268526bf858f/section-overview
FOR /L %%N IN (1,1,%BOTS%) DO (
start chrome /new-window %TASK_URL%
ping -n 2 127.0.0.1 -w 1000
)
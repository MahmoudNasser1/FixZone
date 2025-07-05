to kail tasks in server 
netstat -ano | findstr :3000
  TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING       31304
  TCP    [::]:3000              [::]:0                 LISTENING       31304

taskkill /PID 31304 /F
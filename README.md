# Summary 
uptime monitoring RESTful API server that allows authenticated users to monitor URLs, and get detailed uptime reports about their availability, average response time, and total uptime/downtime.
# Overview
  1.	Signup with email verification 
  2.	Login is stateless using JWT
  3.	CRUD operations for URL checks (GET, PUT and DELETE can be called only by the user who created the check).
  4.	Authenticated users can receive a notification whenever one of their URLs goes down using email 
  5.	Authenticated users can get detailed uptime reports about their URLs availability, average response time, and total uptime/downtime.
  6.	Authenticated users can group their checks by tags 
The Database used is mongo DB with mongoose ODM
# How to run: 
1.	By npm install -> then npm start or,
2.	By using docker -> docker-compose up command
3.  you should add MAILGUN_API_KEY and MAILGUN_DOMAIN to .env
# How it works
  1.	User head to sign up route and enter his name, email and password and confirmation sent to the user email
  2.	Then login using email and password and return JWT token which is used to authorize the user to Create, update and delete checks and get reports for these checks
  3.	Authorized user head to create checks route to create a check for URL 
  4.	Then start the monitoring by going to monitoring route and start it by the check id
  5.	The monitoring starts and at every check interval the report is saved in the database
  6.	The user stops monitoring by going to stop monitoring route

## The Monitor class:
> Is responsible for fetching the URL and start calculating response time, uptime, downtime if it down, outage and sending email if the server is down 
 
## API Documentation
|  Name |	Endpoint |	Method |	Parameters |	Response Code | Response	|
| :----------: |:-----------:|:-------:|:--------:|:----------:|:----------:|
|Signup|	/auth/signup|	POST|	Name, email, password |	201	|The user id|
|Login|	/auth/login|	POST|	email, password	|200	|Login token and user id|
|Confirm email|	/auth/confirm|	POST|	Verification token|	200	|
|Create check|	/check/create|	POST|	(*) Check options|	201	| Check id |
|Get all checks|	/check/all|	GET	|-|	200	|All authenticated user checks|
|Get check by id|	/check/{checkId}|	GET	|-|	200	|Check object by id|
|Get check by tags|	/monitoring/start/{tag}|	GET	|-|	200|	Check object by tag|
|Delete check|	/check/delete/{checkId}|	DELETE|	checkId	| 200	|
|Update check|	/check/update/{checkId}	|PUT	|checkId |	200	 | The updated check |
|Start monitoring|	/monitoring/start/{checkId}	|GET	|checkId	|200	|
|Stop monitoring|	/monitoring/stop	|POST|	-	|200	|
|Get all reports|	/monitoring/report	|GET	|-	| 200	| All authenticated user reports|

(*) check options {name, URL, protocol, path, webhook, timeout, interval, threshold, tags, port, ignoreSSL}

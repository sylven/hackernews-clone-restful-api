# hackernews-clone-restful-api
Hacker News clone RESTful API rewritten with Node.JS, using MongoDB.  
Project for ASW subject at fib.upc.edu.

## Members:     
- Silviu Chirvasa: sylven
- Gorka Piñol: heyslide
- Aleix Vaz: aleixvaz
- Miquel Orengo: miikelx

## Try it! (Login won't work because it needs the new Google API Secret)
https://hackernews-clone-restful-api.herokuapp.com/

## Getting Started
1. Replace google API configuration in server.js file.
2. Get Node.JS local environment set up with npm.
3. Install dependencies:

        $ npm install
4. Start app:

        $ npm start

5. Visit app:

		http://localhost:8080/

## Deploy to Heroku
1. heroku login
2. heroku git:remote -a hackernews-clone-restful-api
3. git push heroku develop:master

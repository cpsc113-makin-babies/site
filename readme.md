#CPSC Project - this is the StorQ App

This is our app, it will be amazing!

##How to run this

PORT=5000 SESSION_SECRET='sdf' MONGO_URL="mongodb://localhost:27017/babies" ./node_modules/.bin/nodemon index.js

I npm installed

npm install sequelize --save
npm install pg --save
npm install pg-hstore --save
npm install validator
npm install nodemon --save

and other stuff

you can run the server with...

    node index.js

    (Note this needs to be changed, 27017 is specific to Mongo)
    PORT=5000 SESSION_SECRET='sdf' PG_URI="postgres://postgres:postgres@localhost:5432/storq" ./node_modules/.bin/nodemon index.js

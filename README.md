
# INSTALLATION
```bash
    npm install
```

# CONFIGURATION
returned field and number of result for each page can be adjusted.
just edit _default.json_ file
- **resultPerPage** : indicate number of result for each page
- **fields** : feed's field selection of FB's Graph API.

a dot env file will be needed to store following information:
- USER_ID
- APP_ID
- APP_SECRET

store it at project's root directory and save as __.env__ (needed for user token generation)

# building
```bash
 npm run-script build
```

# RUN the server
if you have nodemon installed you can do (perfect for development because of autoreload):
```bash
nodemon dist/server/server.js
```

or if you don't have one:
```bash
node dist/server/server.js
```
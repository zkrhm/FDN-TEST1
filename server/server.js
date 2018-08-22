import FBGraph from './../lib/fb_api'
const Express = require('express')
const path = require('path')

process.env['NODE_CONFIG_DIR'] = './'
const config = require('config')

process.env.FBGRAPH_RESULT_PER_PAGE=config.get('fbgraph.resultPerPage')
process.env.FBGRAPH_FIELDS=config.get('fbgraph.fields')


var app = Express()
const url = require('url')

var fb_api = new FBGraph()

app.set('json spaces',3)
app.use('/static',Express.static('static'))

app.get('/api',(req, res)=>{
    res.setHeader('Content-type','application/json')

    let pagination = req.query.pagination
    if (pagination=='next'){
        fb_api = fb_api.fetchNext()
    }else if(pagination=='previous'||pagination == 'prev'){
        fb_api = fb_api.fetchPrevious()
    }

    fb_api.fetchFeed()
        .then(function(data){
            console.log("OK")
            res.send(JSON.stringify({
                data: data, 
                pagination:{
                    prev:`http://${req.headers.host}/api?pagination=previous`,
                    next:`http://${req.headers.host}/api?pagination=next`,
                }},null,3))
        }).catch(function(err){
            console.log("OUCH!"+JSON.stringify(err))
            if(err.type=='OAuthException'){
                res.status(403)
                res.send(JSON.stringify({
                    type:"OAuthError", 
                    message:`Your token is expired, re-acquire by visiting : https://www.facebook.com/v3.1/dialog/oauth?response_type=token&display=popup&client_id=${process.env.APP_ID}&redirect_uri=http://${req.headers.host}/static/redirect.html&scope=user_posts`,
                    oauthLogin: `https://www.facebook.com/v3.1/dialog/oauth?response_type=token&display=popup&client_id=${process.env.APP_ID}&redirect_uri=http://${req.headers.host}/static/redirect.html&scope=user_posts`
                },null,3))
            }if(err.type=='NoResult'){
                res.status(404)
                res.send(JSON.stringify(err,null,3))    
            }else{
                res.send(JSON.stringify(err,null,3))
            }
        })
})

app.get('/login-callback',(req,res)=>{
    //automatically set user's access token env variable
    process.env.USER_ACCESS_TOKEN=req.query.access_token

    res.redirect(301,`http://${req.headers.host}/api`)
})

app.listen(3000, ()=> console.log("running on port 3000"))
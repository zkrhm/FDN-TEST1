'use strict'

let _accessToken = null
// const graphUrl = `https://graph.facebook.com/v3.1/`
const FB = jest.genMockFromModule('fb')
const posts = require('./data')
const url = require('url')
function setData (data){
    console.log('mock called')
}

FB.__setData = setData
function setAccessToken (token){
    console.log(`"setAccessToken to __mock__ ${token}"`)
    _accessToken = token
}
FB.setAccessToken = setAccessToken


function api (req, fn){
    const reqUrl = url.parse(req)
    let token = 'ca354048'
    if (reqUrl.pathname.indexOf('me') == -1)
        token = reqUrl.query.paginationToken
    
    fn(posts[token])
}

FB.api = api

module.exports = FB
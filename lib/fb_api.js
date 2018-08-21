const FB = require('fb')
require('dotenv').config()

class FBGraph {
  
  constructor(){
    this.apiRequest = `/me/feed?fields=${process.env.FBGRAPH_FIELDS}&limit=${process.env.FBGRAPH_RESULT_PER_PAGE}`
    this.nextRequest = null
    this.prevRequest = null
    this.lastPaginationRequest = null
  }
  fetchNext(){
    if(this.nextRequest != null)
      this.apiRequest = this.nextRequest
      this.lastPaginationRequest = 'next'
    return this
  }
  fetchPrevious(){
    if(this.prevRequest != null)
      this.apiRequest = this.prevRequest
      this.lastPaginationRequest = 'prev'
    return this
  }
  fetchFeed() {
    let _obj = this
    console.log("requesting : "+_obj.apiRequest)
    return new Promise(function (resolve, reject) {
      FB.setAccessToken(process.env.USER_ACCESS_TOKEN)
      FB.api(_obj.apiRequest, function (res) {
        if (!res || res.error) {
          reject(res.error)
        }

        if (res.paging){
          // method and api domain included on paging , substring to remove it.
          _obj.nextRequest = res.paging.next.substring(31)
          _obj.prevRequest = res.paging.previous.substring(31)
          
        }

        if(!res.data || res.data.length == 0){
          reject({'type':'NoResult','message':`No more result available please set query string to: pagination=${_obj.lastPaginationRequest=='next'?'previous':'next'}`})
        }

        resolve(res.data)
      });
    })
  }
}

export {FBGraph as default}
jest.mock('fb')
import FBGraph from './fb_api'
import FB from 'fb'

describe('testing FBGraph library',()=>{
    
    beforeEach(()=>{
        
    })

    test('FBGraph can be initialize',()=>{
        let fbApi = null
        expect(()=>{
            const fbApi = new FBGraph()
        }).not.toThrowError()
    })

    it('call the mocks implementation',()=>{

        jest.mock('fb')
        require('fb').__setData('Hello')

        FB.api('/somehwer',(res)=>{
            expect(res).not.toBeNull()
            console.log(`mocks result : ${res}`)
        })  
    })

    const fbApi = new FBGraph()
    it('call fetchFeed and get result from mocks',()=>{
        fbApi.fetchFeed().then(data=>{
            expect(data).not.toBeUndefined()
        }).catch(err=>{
            expect(err).toBeUndefined()
        })
        
    })

    it('call to the end of the feed, and catching Promise catch',()=>{
        for(let i=0 ; i < 6; i++){
            fbApi.fetchPrevious().fetchFeed().then(data=>{
                console.log(data)
            }).catch(err=>{
                expect(err).not.toBeNull()
            })
        }
    })
})
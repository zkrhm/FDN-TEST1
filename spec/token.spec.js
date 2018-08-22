import {isDebugging} from './testingInit'
const puppeteer = require('puppeteer')

const APP = 'http://localhost:3000/api'
let page
let browser
const width = 1920;
const height = 1080;
let jsonPayload

process.env['NODE_CONFIG_DIR'] = './'
const config = require('config')

beforeAll(async ()=>{
    browser = await puppeteer.launch(isDebugging().puppeteer)
    page = await browser.newPage()
    await page.setViewport({width,height})

    process.env.USER_ACCESS_TOKEN = null
})

afterAll(async ()=>{
    // await page.goto('http://www.facebook.com')
    // await page.waitForNavigation({waitUntil: 'networkidle0'})
    await page.goto(`${APP}?pagination=prev`)
    let payload = await page.evaluate(getJsonPayload)

    while (payload.pagination){
        await page.goto(payload.pagination.prev)
        payload = await page.evaluate(getJsonPayload)
    }

    browser.close()
})

let getJsonPayload = () =>  {
    return JSON.parse(document.querySelector("pre").innerText)
}

beforeEach(async ()=>{
    await page.goto(APP)
    let content= await page.content()
    
    jsonPayload = await page.evaluate(getJsonPayload);

    if(jsonPayload.oauthLogin){
        console.log("has not login yet")
        await page.goto(jsonPayload.oauthLogin)

        await page.waitFor('input[name=email]')
        await page.$eval('input[name=email]', el => el.value = 'inazrabuu@hotmail.com')
        await page.$eval('input[name=pass]', el => el.value = 'P@ssw0rd')
        await page.click('input[type="submit"]')
        await page.waitForNavigation({waitUntil: 'networkidle0'})
    }else{
        //has been logged in.
        console.log("has been login")
        let statusCode = page.on('response',async (res)=>{
            return await res.status()
        })

        console.log('status code :'+statusCode)
    }
    
})

describe("fill up the token",()=>{
    test('check if fully arrived at landing page', async()=>{
        jsonPayload = await page.evaluate(getJsonPayload);

        expect(jsonPayload.data.length).toBeGreaterThan(0)
        
    },isDebugging().timeout)

    test('result per page equal to configuration', async() => {
        let payload = await page.evaluate(getJsonPayload)
        //sometimes item per page will less than number of result per page
        expect(payload.data.length).toBeLessThanOrEqual(config.get('fbgraph.resultPerPage'))
    })

    test('check if navigation exists', async ()=>{
        let payload = await page.evaluate(getJsonPayload)
        expect(payload.pagination).toBeDefined()
    })

    test('check if navigation works correctly (result of current page cannot be the same to the previous page)', async ()=>{
        let payload = await page.evaluate(getJsonPayload)
        let firstPost = payload.data[0]
        await page.goto(payload.pagination.next)
        let payload2 = await page.evaluate(getJsonPayload)
        let secondPost = payload2.data[0]
        expect(firstPost==secondPost).toBeFalsy()
    })

    test('check to navigate through all pages', async ()=>{
        let payload = await page.evaluate(getJsonPayload)

        while (payload.pagination){
            await page.goto(payload.pagination.next)
            payload = await page.evaluate(getJsonPayload)
        }
    })

    test('check http code == 404 when no longer post to paginate to', async () =>{
        page.on('response',(res)=>{
            expect(res.status()==404).toBeTruthy()
        })
    })
    
})
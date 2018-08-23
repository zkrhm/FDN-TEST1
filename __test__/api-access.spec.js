import {isDebugging} from './testingInit'
const puppeteer = require('puppeteer')
require('dotenv').config()

const APP = 'http://localhost:3000/api'
let page
let browser
const width = 1920
const height = 1080
let jsonPayload

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
        if( payload.pagination.prev == null )
            break
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
    
    jsonPayload = await page.evaluate(getJsonPayload)

    if(jsonPayload.oauthLogin){
        console.log("has not login yet")
        await page.goto(jsonPayload.oauthLogin)

        jsonPayload = await page.evaluate(getJsonPayload)
        let el = await page.evaluate(body=>body.outerHTML,page.$('input[name=email]'))

        if(!jsonPayload.oauthLogin && el)
            await page.waitFor('input[name=email]')
            await page.$eval('input[name=email]', el => el.value = process.env.FB_EMAIL )
            await page.$eval('input[name=pass]', el => el.value = process.env.FB_PASS)
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
        jsonPayload = await page.evaluate(getJsonPayload)
        let navNext = jsonPayload.pagination.next
        let navPrev = jsonPayload.pagination.previous

        if( navNext == null || navPrev == null ){
            let gotoUrl = navPrev==null?navNext:navPrev
            await page.goto(gotoUrl)
            jsonPayload = await page.evaluate(getJsonPayload)
        }
        expect(jsonPayload.data.length).toBeGreaterThan(0)
        
    },isDebugging().timeout)

    test('result per page less than or equal configuration', async() => {
        let payload = await page.evaluate(getJsonPayload)
        let navNext = payload.pagination.next
        let navPrev = payload.pagination.previous

        if( navNext == null || navPrev == null ){
            let gotoUrl = navPrev==null?navNext:navPrev
            await page.goto(gotoUrl)
            payload = await page.evaluate(getJsonPayload)
        }
        //sometimes item per page will less than number of result per page
        expect(payload.data.length).toBeLessThanOrEqual(parseInt(process.env.FBGRAPH_RESULT_PER_PAGE))
    })

    test('check if navigation exists', async ()=>{
        let payload = await page.evaluate(getJsonPayload)
        expect(payload.pagination).toBeDefined()
    })
    
})
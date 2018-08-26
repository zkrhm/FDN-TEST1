import { isDebugging } from './testingInit'
const puppeteer = require('puppeteer')
require('dotenv').config()

const APP = 'http://localhost:3000/api'
let page
let browser
const width = 1920
const height = 1080
const timeout = 60000
let jsonPayload

beforeAll(async () => {
    jest.setTimeout(timeout)
    browser = await puppeteer.launch(isDebugging().puppeteer)
    page = await browser.newPage()
    await page.setViewport({ width, height })
    page.on('load',()=>{
        console.log("loaded : "+page.url())
    })

    process.env.USER_ACCESS_TOKEN = null

    // console.log(`before each, goto : ${APP}`)
    // await page.goto(APP)

    // jsonPayload = await page.evaluate(getJsonPayload)
    // let thePage = new SeeThePage(page)
    // console.log(`---> before loop : ${JSON.stringify(jsonPayload)}`)

    let jsonStruct = null 
    
    let htmlStruct = null
    let isOn = true
    let isSessionTimeout = false
    let isItLoginPage = false
    const maxThrottle = 10
    let throttleCount = 0
    let destAddr = APP
    let accessPage = true
    let reloop = true
    let doEntry = false



    do{

        console.log(`var check > accessPage : ${accessPage} , doEntry: ${doEntry}`)
        if (accessPage){
            await page.goto(destAddr)

            // let input = await page.evaluate(()=>document.querySelector('body'))
            
            // console.log(`"selecting 'pre': ${input}"`)
            // if (input == null){
            //     doEntry = true
                let body = await page.evaluate(()=>document.querySelector('body'))
                console.log(`body content : ${body}`)
            // }
            
            accessPage = false

            
        }

        if (doEntry) {
            await page.goto(destAddr)
            console.log("doing data entry...")
            // await page.waitForSelector('#email')
            // let input = await page.evaluate(()=>document.querySelector('body'))
            // console.log(`input email : ${input.outerHTML}`)
            console.log("typing....")
            await page.click('#email')
            await page.keyboard.type('dev.meituan@gmail.com')
            console.log("finish typing..")
            await page.click('#pass')
            await page.keyboard.type('P@ssw0rd')
            await page.click('input[type="submit"')
            await page.waitForNavigation()
            console.log("end of typing..")

            doEntry = false
        }

       

        console.log("start of the loop ----- ")
        console.log(`throttle count : ${throttleCount}`)
        // let document = await page.evaluate(()=>document)
        // console.log(`document ${document.querySelector('pre')}`)

        jsonStruct = await page.evaluate(getJsonPayload)
        // htmlStruct = await page.evaluate(getHtmlPayload)

        console.log(`value check : jsonStruct => ${JSON.stringify(jsonStruct)} typeof ${typeof(jsonStruct)}`)
        console.log(`htmlStruct => ${htmlStruct}`)

        isOn = (jsonStruct != null && jsonStruct.hasOwnProperty('pagination'))
        isSessionTimeout = (jsonStruct != null && jsonStruct.hasOwnProperty('oauthLogin'))
        // isItLoginPage = (htmlStruct != null) && (htmlStruct != undefined)

        console.log(`Truth test : {isOn : ${isOn}, isSessionTimeout : ${isSessionTimeout}, isLoginPage : ${isItLoginPage}}`)

        if(isSessionTimeout){
            console.log("BRANCH 1 : session was timeout, doing oauthlogin..")
            destAddr = jsonStruct.oauthLogin
            doEntry = true
        }else if(isOn){
            console.log("BRANCH 2 : is Logged in!")
        }else{
            console.log("BRANCH 3 : it is login page. do entry set to True")
            // await page.waitForSelector('input[name=email]')
            doEntry = true
        }

        console.log("end of the loop -----")
        throttleCount += 1

        reloop = !isOn && throttleCount < maxThrottle
        console.log(`reloop : ${reloop}`)

    }while(reloop)

    if( throttleCount == maxThrottle)
        throw new Error("throttle limit exceeded")

    console.log("VISITING APP")

})

afterAll(async () => {
    // await page.goto('http://www.facebook.com')
    // await page.waitForNavigation({waitUntil: 'networkidle0'})
    // await page.goto(`${APP}?pagination=prev`)
    // let payload = await page.evaluate(getJsonPayload)

    // while (payload.pagination) {
    //     if (payload.pagination.prev == null)
    //         break
    //     await page.goto(payload.pagination.prev)
    //     payload = await page.evaluate(getJsonPayload)
    // }

    browser.close()
})

let getJsonPayload = () => {
    let dom = document.querySelector("pre")
    return (dom != null)?JSON.parse(dom.innerText):null
}

let getHtmlPayload = () =>{
    let dom = document.querySelector(['input[name=email]'])
    return (dom!=null)?dom:null
}

function mustBeLoggedIn(json) {
    if (!json.hasOwnProperty('pagination'))
        throw new Error("Login Required")
}

describe("fill up the token", () => {
    test('check if fully arrived at landing page', async () => {

        jsonPayload = await page.evaluate(getJsonPayload)
        mustBeLoggedIn(jsonPayload)

        let navNext = jsonPayload.pagination.next
        let navPrev = jsonPayload.pagination.previous

        if (navNext == null || navPrev == null) {
            let gotoUrl = navPrev == null ? navNext : navPrev
            await page.goto(gotoUrl)
            jsonPayload = await page.evaluate(getJsonPayload)
        }
        expect(jsonPayload.data.length).toBeGreaterThan(0)

    }, isDebugging().timeout)

    test('result per page less than or equal configuration', async () => {
        let payload = await page.evaluate(getJsonPayload)

        mustBeLoggedIn(payload)

        let navNext = payload.pagination.next
        let navPrev = payload.pagination.previous

        if (navNext == null || navPrev == null) {
            let gotoUrl = navPrev == null ? navNext : navPrev
            await page.goto(gotoUrl)
            payload = await page.evaluate(getJsonPayload)
        }
        //sometimes item per page will less than number of result per page
        expect(payload.data.length).toBeLessThanOrEqual(parseInt(process.env.FBGRAPH_RESULT_PER_PAGE))
    })

    test('check if navigation exists', async () => {
        let payload = await page.evaluate(getJsonPayload)
        mustBeLoggedIn(payload)
        expect(payload.pagination).toBeDefined()
    })

})
import { isDebugging } from './testingInit'
const puppeteer = require('puppeteer')
require('dotenv').config()

const APP = 'http://localhost:3000/api'
let page
let browser
const width = 1920
const height = 1080
let jsonPayload

beforeAll(async () => {
    browser = await puppeteer.launch(isDebugging().puppeteer)
    page = await browser.newPage()
    await page.setViewport({ width, height })

    process.env.USER_ACCESS_TOKEN = null
})

afterAll(async () => {
    // await page.goto('http://www.facebook.com')
    // await page.waitForNavigation({waitUntil: 'networkidle0'})
    await page.goto(`${APP}?pagination=prev`)
    let payload = await page.evaluate(getJsonPayload)

    while (payload.pagination) {
        if (payload.pagination.prev == null)
            break
        await page.goto(payload.pagination.prev)
        payload = await page.evaluate(getJsonPayload)
    }

    browser.close()
})

let getJsonPayload = () => {
    return JSON.parse(document.querySelector("pre").innerText)
}

class SeeThePage {
    constructor(page) {
        this.page = page
        this.content
        let _obj = this
        console.log("seeing the page")
    }

    getContent() {
        return this.content
    }

    isOn() {
        let _obj = this
        return new Promise(async (resolve, reject) => {

            const resp = await _obj.page.evaluate(() => {
                const pre = document.querySelector("pre")
                console.log(`"document is : ${JSON.stringify(document)}"`)
                if(pre != null) 
                    JSON.parse(pre.innerText)
                return null
            })
            console.log(`"is ON  ? ${resp}"`)
            resolve(resp != null && resp.hasOwnProperty('pagination'))
        })
    }

    isItLoginPage() {
        let _obj = this
        return new Promise(async (resolve, reject) => {
            await _obj.page.waitForSelector('input[name=email]')
            const input = await _obj.page.evaluate(() => {
                let o = document.querySelector('input[name=email]')
                return o==null?null:o.outerHTML
            })
            _obj.content = input
            console.log(`is login page ? ${JSON.stringify(input)}`)
            resolve(input != null)
        })
    }

    isTheSessionTimeout() {
        let _obj = this
        return new Promise(async (resolve, reject) => {
            const resp = await _obj.page.evaluate(() => {
                console.log(`session timeout : ${JSON.stringify(document)}`)
                const pre = document.querySelector("pre")
                if (pre != null) 
                    JSON.parse(pre.innerText)
                return null
            })
            console.log(`check if session is timeout : ${JSON.stringify(resp)}`)
            _obj.content = resp
            resolve(resp != null && resp.hasOwnProperty('oAuthLogin'))
        })
    }
}

function mustBeLoggedIn(json) {
    if (!json.hasOwnProperty('pagination'))
        throw new Error("Login Required")
}

beforeEach(async () => {
    await page.goto(APP)

    jsonPayload = await page.evaluate(getJsonPayload)
    // let thePage = new SeeThePage(page)

    let jsonStruct = null 
    
    let htmlStruct = null
    let isOn = true
    let isSessionTimeout = false
    let isItLoginPage = false
    do{
        jsonStruct = await page.evaluate(()=>document.querySelector('pre'))
        htmlStruct = await page.evaluate(()=>{document.querySelector('input[name=email]')})

        console.log(`value check : jsonStruct => ${JSON.stringify(jsonStruct)}`)
        console.log(`htmlStruct => ${htmlStruct}`)

        isOn = (jsonStruct != null && jsonStruct.hasOwnProperty('pagination'))
        isSessionTimeout = (jsonStruct != null && jsonStruct.hasOwnProperty('oAuthLogin'))
        isItLoginPage = (htmlStruct != null) && (htmlStruct != undefined)

        if(isSessionTimeout){
            console.log("BRANCH 1 : session was timeout")
            let obj = JSON.parse(jsonStruct)
            await page.goto(obj.oauthLogin)
            await page.waitForNavigation()
        }else if(isItLoginPage){
            console.log("BRANCH 2 : it is login page")
            await page.waitForSelector('input[name=email]')
            await page.$eval('input[name=email]', el => el.value = process.env.FB_MAIL)
            await page.$eval('input[name=pass]', el => el.value = process.env.FB_PASS)
            await page.click('input[type="submit"')
            await page.waitForNavigation({waitUntil: 'networkidle0'})

        }else{
            console.log("BRANCH 3 : is Logged in!")
        }


    }while(!isOn)

    console.log("VISITING APP")
    // while (! await thePage.isOn()) {
    //     if (await thePage.isTheSessionTimeout()) {
    //         console.log("BRANCH-1: Session Timeout. visiting ")
    //         const obj = thePage.getContent()
    //         await page.goto(obj.oauthLogin)
    //         await page.waitForNavigation()

    //     } else if (await thePage.isItLoginPage()) {
    //         console.log('BRANCH-2:it is login page...!!!')
    //         await page.$eval('input[name=email]', el => el.value = process.env.FB_EMAIL)
    //         await page.$eval('input[name=pass]', el => el.value = process.env.FB_PASS)
    //         await page.click('input[type="submit"]')
    //         await page.waitForNavigation({ waitUntil: 'networkidle0' })
    //     } else {
    //         //has been logged in.
    //         console.log("BRANCH-3:has been login, carry on..")
    //         let statusCode = page.on('response', async (res) => {
    //             return await res.status()
    //         })
    //     }
    //     thePage = new SeeThePage(page)
    // }
    // console.log("LEAVING LOOP")

})

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
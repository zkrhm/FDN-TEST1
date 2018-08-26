const puppeteer = require('puppeteer')
let browser
let page
const width = 1920
const height = 1080
describe('test',()=>{
    it('test',async()=>{
        jest.setTimeout(15000)
        browser = await puppeteer.launch({
            headless: false,
            slowMo: 80,
            args: [`--window-size=1920,1080`]
          })
        page = await browser.newPage()
        await page.setViewport({height,width})
        
        await page.goto('https://www.facebook.com/v3.1/dialog/oauth?response_type=token&display=popup&client_id=366621340543848&redirect_uri=http://localhost:3000/static/redirect.html&scope=user_posts')
        await page.waitForSelector('#email')
        // const input = await page.evaluate(()=>{
        //     return document.querySelector('input[name=email]').outerHTML
        // })
        // console.log(JSON.stringify(input))
        // await page.click('#email')
        // page.keyboard.type("hello@mail.com")
        await page.$eval('#email', el => el.value="hello@mail.com")
        
        // await page.$eval('input[name=email]', el => el.value = process.env.FB_EMAIL )
        // await page.$eval('input[name=pass]', el => el.value = process.env.FB_PASS)
    })
})


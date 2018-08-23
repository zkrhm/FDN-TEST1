const faker = require('faker')
const randInt = (max)=>{
    return Math.floor(Math.random() * Math.floor(max))
}

const getStatus = ()=>{
    return {
        message : faker.lorem.sentences(randInt(20)),
        created_time : faker.date.past(),
        id : faker.random.uuid
    }
}

const url = 'https://graph.facebook.com/v3.1'
let posts = {}
let page = 1

let prevPage = faker.random.uuid().substring(0,8)
let currentPage = faker.random.uuid().substring(0,8)
let nextPage = faker.random.uuid().substring(0,8)

posts[prevPage] = {
    data : []
}

for (let i = 0; i<5 ; i++){
    let pages = []
    for (let i = 0; i<5 ; i++){
        pages.push(getStatus())
    }

    posts[currentPage] = {
        data : pages,
        paging : {
            previous: `${url}/ID/page=${prevPage}` ,
            next :  `${url}/ID/page=${nextPage}`
        }
    }
    page += 1 
    prevPage = currentPage
    currentPage = nextPage
    nextPage = faker.random.uuid().substring(0,8)
}

posts[nextPage] = {
    data : []
}

console.log(JSON.stringify(posts))
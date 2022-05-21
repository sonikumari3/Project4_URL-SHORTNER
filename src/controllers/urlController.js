const urlModel = require("../models/urlModel")
const validUrl = require('valid-url')
const shortid = require('short-id')
const redis = require("redis");

const { promisify } = require("util");

// THIS IS BASE URL-----
const baseUrl = 'http:localhost:3000'

//CONNECT TO REDIS----
const redisClient = redis.createClient(
    13523,
    "redis-13523.c8.us-east-1-3.ec2.cloud.redislabs.com",
    { no_ready_check: true }
);
redisClient.auth("ERRe4CdxgtY9L3tHljnRONIM6FTVqwFM", function (err) {
    if (err) throw err;
});

redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
});

//CONNECTION SETUP FOR REDIS------

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

const shortUrl = async function (req, res) {
    try {
        // DESTRUCTURING DATA FETCH BY REQ.BODY----
        const { longUrl } = req.body

        //CHECK REQ.BODY IS EMPTY OR NOT----
        if (Object.keys(req.body).length == 0) {
            return res.status(400).send({ status: false, message: "please enter lomg url in req.body" })
        }

        // CHECK VALIDATION OF GIVEN LONG URL-----
        if (!validUrl.isUri(longUrl)) {
            return res.status(400).send({ status: false, message: "Invalid Long URL" })
        }

        // CHECK VALIDATION OF GIVEN BASE URL-----
        if (!validUrl.isUri(baseUrl)) {
            return res.status(400).send({ status: false, message: "Invalid Base URL" })
        }

        // FIND LONG URL ALRADY PRESENT OR NOT IN DB OR IN CASH IF IT IS IN DB SET INTO CACHE----
        let cahcedLongUrlData = await GET_ASYNC(`${longUrl}`)
        if (cahcedLongUrlData) {
            return res.status(200).send({ status: true, message: "url alrady shorted", data: JSON.parse(cahcedLongUrlData) })
        } else {
            let url = await urlModel.findOne({ longUrl })
            if (url) {
                await SET_ASYNC(`${longUrl}`, JSON.stringify(url))
                return res.status(200).send({ status: true, message: "alrady shorted ", data: url })
            }
        }
        // GENERATE URLCODE------
        const urlCode = shortid.generate()

        // IF YOU WANT TO CHECK UNIQUE PLSESE UNCOMMENT IT------
        // const urlCode = "428d08"
        //console.log(urlCode)

        // FIND DOCUMENT HAVING SAME URLCODE PRESENT OR NOT IN DB-----
        const findUrlCode = await urlModel.findOne({ urlCode: urlCode })
        //console.log(findUrlCode)
        if (findUrlCode) {
            // console.log(findUrlCode)
            return res.status(400).send({ status: false, message: "UrlCode alrady present in db" })
        }


        // CREATE SHORT URL----
        const shortUrl = baseUrl + '/' + urlCode

        // IF YOU WANT TO CHECK UNIQUE PLSESE UNCOMMENT IT------
        // const shortUrl ="http:localhost:3000/bd1ba0"
        //console.log(shortUrl)


        // FIND DOCUMENT HAVING SAME SHORTURL PRESENT OR NOT IN DB-----
        const findShortUrl = await urlModel.findOne({ shortUrl: shortUrl })
        if (findShortUrl) {
            return res.status(400).send({ status: false, message: "Short-Url alrady present in db" })
        }

        // MAKE OBJECT CONTAINING ALL MANDATORY FIELDS-----
        let createUrl = {
            longUrl: longUrl,
            shortUrl: shortUrl,
            urlCode: urlCode
        }
        // CREATE DOCUMENT IN DB------
        let createdata = await urlModel.create(createUrl)
        res.status(201).send({ status: true, data: createdata })
        let cache = await SET_ASYNC(`${urlCode}`, JSON.stringify(createdata))
        console.log(cache, " data set in cache")

    }
    catch (err) {
        return res.status(500).send({ status: false, Error: err.message })
    }
}

// REDIRECTING TO THE LONG URL----
const redirectUrl = async function (req, res) {
    try {
        //FETCH URLCODE FROM PARAMS----
        let urlCode = req.params.urlCode

        // FINDING IN CACHE MOMORY----
        let cahcedProfileData = await GET_ASYNC(`${req.params.urlCode}`)
        cahcedProfileData = JSON.parse(cahcedProfileData)
        // console.log(cahcedProfileData, " data from cache")
        if (cahcedProfileData) {
            //FOR STATUS CODE 32 PLEASE DISABLE (Automatically follow redirects) IN POSTMAN SETTING BELOW HTTP REQUEST-----
            res.status(302).redirect(cahcedProfileData.longUrl)
        }
        // IF DOCUMENT NOT FOUND IN CACHE THEN FIND IN DB AND SET INTO CACHE MEMORY----
        else {
            let longUrl = await urlModel.findOne({ urlCode: urlCode });
            if (!longUrl) {
                return res.status(404).send({ status: false, message: "url not found" })
            }
            // SET IN THE CACHE MEMORY-----
            await SET_ASYNC(`${req.params.urlCode}`, JSON.stringify(longUrl))
            res.status(302).redirect(longUrl.longUrl);
        }

    }
    catch (err) {
        return res.status(500).send({ status: false, Error: err.message })
    }
}

// EXPORT MODULE AND MAKE IT PUBLIC-----
module.exports.shortUrl = shortUrl
module.exports.redirectUrl = redirectUrl
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken')
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000;


//middleware
app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true,
    "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
}));
app.use(express.json())
app.use(cookieParser())


app.get('/', (req, res) => {
    res.send('Car doctores are working')
})


//myMiddlewares:
const logger = (req, res, next) => {
    console.log('log info:', req.method, req.url);
    next()
}

function verifyToken(req, res, next) {
    const token = req.cookies?.myToken
    if (!token) {
        return res.status(401).send({ message: 'Unauthorize user' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'Unauthorized access!' })
        }
        req.user = decoded
        next()
    })
}


const uri = `mongodb+srv://practice_user:practice_user@cluster0.jt5df8u.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        const database = client.db('carDoctorsDB')
        const serviceCollection = database.collection('services')
        const bookingCollection = database.collection('bookings')

        //( JWTs) auth...APIs
        app.post('/jwt', async (req, res) => {
            const user = req.body
            // console.log('user for token:', user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res
                .cookie('myToken', token, { httpOnly: true, secure: true, sameSite: 'none' })
                .send({ success: true });
        })

        app.post('/logout', async (req, res) => {
            const user = req.body;
            res.clearCookie('myToken', { maxAge: 0 }).send({ success: true })
        })


        // service related APIs
        app.get('/services', async (req, res) => {
            const cursor = serviceCollection.find()
            const result = await cursor.toArray()
            res.send(result)
        })

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const options = {
                projection: { title: 1, price: 1, service_id: 1 },
            };
            const result = await serviceCollection.findOne(query, options)
            res.send(result)
        })

        app.get('/bookings', logger, verifyToken, async (req, res) => {
            console.log(req.query.email);
            console.log('token owener info:', req.user.email);
            if (req.user.email !== req.query.email) {
                return res.status(403).send({ message: 'FORBIDDEN' })
            }
            let query = {}
            if (req.query?.email) {
                query = { 'user.email': req.query?.email }
            }
            const result = await bookingCollection.find(query).toArray()
            res.send(result)
        })

        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await bookingCollection.deleteOne(query)
            res.send(result)
        })


        // `````````````Post APIs`````````````
        app.post('/bookings', async (req, res) => {
            const doc = req.body
            const result = await bookingCollection.insertOne(doc)
            res.send(result)
        })


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
    }
}
run().catch(console.dir);



app.listen(port, () => {
    console.log(`Car doctor server is running on port ${port}`)
})
const express = require('express')
const cors = require('cors')
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


app.get('/', (req, res) => {
    res.send('Car doctores are working')
})


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
            console.log('user for token:', user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res
                .cookie('myToken', token, { httpOnly: true, secure: true, sameSite: 'none' })
                .send({ success: true });
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

        app.get('/bookings', async (req, res) => {
            const result = await bookingCollection.find().toArray()
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
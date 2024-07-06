const connectToMongo = require('./db');
const express = require('express')
var cors = require('cors')

connectToMongo();
const app = express()
const port = process.env.PORT

app.use(cors())
app.use(express.json())

// Available Routes

// Simple route to check if the app is listening
app.get('/', (req, res) => {
  res.send('App is listening and running!');
});

app.use('/api/auth', require('./routes/auth'))
app.use('/api/notes', require('./routes/notes'))


app.listen(port, () => {
  console.log(`iNotebook backend listening`)
})
require('dotenv').config();
const express = require('express')
const app = express()
const cors = require('cors');
const port = process.env.PORT || 3003
const connect = require('./DB/Connection.js')
const userRoutes = require('./Routes/UserRoutes.js')
const projectRoutes = require('./Routes/ProjectRoutes.js')

connect();

app.use(cors());
app.use(express.json());

app.use('/api',userRoutes)
app.use('/api',projectRoutes)

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
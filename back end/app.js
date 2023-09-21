const express = require('express') ;
const mongoose = require('mongoose') ;
const axios = require('axios') ;
const app = express() ;
const PORT = process.env.PORT || 3000 ;
const path = require('path') ;

// Serve static files from the "frontend" folder
app.use(express.static(path.join(__dirname, '../front end')));

// connecting my mongodb cluster

mongoose.connect('mongodb+srv://sahilj:sj1234@cluster0.jvme4rw.mongodb.net/' , {
    useNewUrlParser : true ,
    useUnifiedTopology : true , 
});

const db = mongoose.connection; // a reference to the default MongoDB connection created by mongoose
db.on('error' , console.error.bind(console, 'MongoDB connection error:')); //to log any error in mongodb connection in the console 

//defining a mongoose schema and model for storing the data
const tickerSchema = new mongoose.Schema({
    name: String ,
    last: Number ,
    buy: Number ,
    sell: Number ,
    volume: Number ,
    base_unit: String ,
});

const Ticker = mongoose.model('Ticker' , tickerSchema);

// API route to fetch and store data
app.get('/fetch-data' , async(req, res) => {
    try {
        // fetch data from wazirx api
        const response = await axios.get('https://api.wazirx.com/api/v2/tickers') ;
        const tickers = response.data ;

        // extracting the top 10 tickers and storing in database
        const top10Tickers = Object.values(tickers)
        .slice(0, 10) 
        .map((ticker) => ({
            name: ticker.symbol,
            last: parseFloat(ticker.last),
            buy: parseFloat(ticker.buy),
            sell: parseFloat(ticker.sell),
            volume: parseFloat(ticker.volume),
            base_unit: ticker.baseAsset,    
        }));
        await Ticker.deleteMany({}) ; //removing the existing data
        await Ticker.insertMany(top10Tickers) ; //inserting new data
       
        res.json({message: 'Data fetched and stored successfully. '}) ;
    } catch(error){
        console.error('Error fetching and storing data:' , error);
        res.status(500).json({error: 'Internal server error'}); 
    }
});

// new route to fetch data from the database
app.get('/get-data', async (req, res) => {
    try {
      // Use Mongoose to query the database and retrieve the data
      const data = await Ticker.find({}, '-_id name last buy sell volume base_unit');
  
      // Send data as a JSON response to the frontend
      res.json(data);
    } catch (error) {
      console.error('Error fetching data from the database:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

// start the server (express server)

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

require('dotenv').config();

const app = express();

app.use(cors({ origin: ['https://ams.codewithabdullah.site',
'https://ams.codewithabdullah.online'], 
   methods: ['GET','POST','PUT','DELETE'],
    credentials: true
}))
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/participants', require('./routes/participants'));
app.use('/api/deposits', require('./routes/deposits'));
app.use('/api/aftaar', require('./routes/aftaar'));
app.use('/api/reports', require('./routes/reports'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3001;

connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
});

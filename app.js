const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const morgan = require('morgan');
const exphbs = require('express-handlebars');
const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const methodOverride = require('method-override');
//Load config
dotenv.config({ path: './config/config.env' });

//Passport config
require('./config/passport')(passport);
connectDB();
const app = express();

//Middleware (Body Parser) to accept form data.
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
//Method override for delete put request.
app.use(
  methodOverride(function (req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      // look in urlencoded POST bodies and delete it
      var method = req.body._method;
      delete req.body._method;
      return method;
    }
  })
);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//Handlebars helpers
const {
  formatDate,
  stripTags,
  truncate,
  editIcon,
  select,
} = require('./helpers/hbs');
//Handlebars:
app.engine(
  '.hbs',
  exphbs.engine({
    helpers: { formatDate, stripTags, truncate, editIcon, select },
    defaultLayout: 'main',
    extname: '.hbs',
  })
);
app.set('view engine', '.hbs');

//Sessions
app.use(
  session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
  })
);
// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

//Set global variable
app.use(function (req, res, next) {
  res.locals.user = req.user || null;
  next();
});
//Static folder
app.use(express.static(path.join(__dirname, 'public')));
//Here we import router from routes/index
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/stories', require('./routes/stories'));
const PORT = process.env.PORT || 5000;

app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);

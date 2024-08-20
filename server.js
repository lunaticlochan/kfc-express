var express = require("express");
const session = require('express-session');
var app = express();
var port = 3001;


app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false
}));

app.set('view engine', 'ejs');



//routing
app.get("/", (req, res) => {
    const user = req.session.user;
    res.render('index', { user });
});

app.get("/login", (req, res) => {
    const user = req.session.user;
    if (user) {
        res.render('index');
    }
    else {
        res.render('login');
    }
});

app.get("/reg", (req, res) => {
    res.render('reg');
});

app.get("/manage", async (req, res) => {
    const user = req.session.user;
    if (!user) {
        res.render('login');
    }
    else {
        try {
            const user = req.session.user;
            const items = await Item.find();
            const oh = await Order.find({ username: user });
            // res.json(items);
            res.render('manage', { oh, items });
        } catch (err) {
            console.error('Error fetching items:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

});

app.get("/menu", async (req, res) => {

    // const items = req.session.item;
    try {
        const user = req.session.user;
        const items = await Item.find();
        // res.json(items);
        res.render('menu', { user, items });
    } catch (err) {
        console.error('Error fetching items:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }

});

app.get("/payment", (req, res) => {
    res.render('payment');
});

app.listen(port, () => {
    console.log("Server listening on port " + port);
});




//connection
var mongoose = require("mongoose");
mongoose.Promise = global.Promise;
mongoose.connect("mongodb+srv://nks:cloudpbl@pbl.qi4mb.mongodb.net/?retryWrites=true&w=majority&appName=pbl");

//schemas
var nameSchema = new mongoose.Schema({
    username: String,
    password: String
});

var itemSchema = new mongoose.Schema({
    item_name: String,
    item_price: {
        type: Number,
        required: true,
        min: 0, // optional: minimum value constraint
        max: 1000, // optional: maximum value constraint
    },
    item_rating: {
        type: Number,
        required: true,
        min: 0, // optional: minimum value constraint
        max: 5, // optional: maximum value constraint
    },
    item_description: String,
});

var orderSchema = new mongoose.Schema({
    username: String,
    order_items: String,
    order_total: Number,
    order_time: {
        type: Date,
        default: Date.now
    }
});






//idk wtf is this
var User = mongoose.model("User", nameSchema);
const Item = mongoose.model('Item', itemSchema);
const Order = mongoose.model('Order', orderSchema);

var bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('public'));




function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}





//methods
app.post("/register", (req, res) => {
    console.log(req.body);
    var myData = new User(req.body);
    myData.save()
        .then(item => {
            res.redirect('login');
        })
        .catch(err => {
            res.status(400).send("unable to save to database");
        });
});


app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username: username, password: password });
        if (!user) {
            res.redirect('/login');
        } else {
            req.session.user = username;
            res.redirect('/');
        }
    } catch (error) {
        res.status(500).send("Error occurred while trying to login.");
    }
});

// app.get('/items', async (req, res) => {

// });

app.post('/save-cart-items', (req, res) => {
    req.session.order=req.body;
    const cartItems = req.body; // Assuming cart items are sent in the request body
    var order_item = new Order(req.body);
    const orderItems = JSON.parse(cartItems);

    // // Calculate total items and total price
    // let order_items = 0;
    // let order_total = 0;
    // for (const item of cartItems) {
    //     order_items += item.name + " x" + item.quantity + "  ";
    //     order_total += item.price * item.quantity;
    // }
    // const createorder = new Order({
    //     username: req.session.user,
    //     order_items: order_items,
    //     order_total: order_total
    // })
    // createorder.save();
    // // Placeholder logic to save cart items to the database
    // // Replace this with your actual database saving logic
    // console.log('Received cart items:', createorder);
    
    // // Here you can perform database operations to save cart items

    // res.sendStatus(200); // Send success response
});

app.post('/savetodb',(req,res)=>{
    // console.log(req.session.order);
    const cItems=req.session.order;
    // const orderItems = JSON.parse(cItems);
    console.log(cItems);
    
    let order_items = 0;
    let order_total = 0;
    for (const item of cItems) {
        order_items += item.name + " x" + item.quantity + "  ";
        order_total += item.price * item.quantity;
    }
    const createorder = new Order({
        username: req.session.user,
        order_items: order_items,
        order_total: order_total
    })
    createorder.save();
    // Placeholder logic to save cart items to the database
    // Replace this with your actual database saving logic
    console.log('Received cart items:', createorder);
    // Here you can perform database operations to save cart items
    res.redirect('menu');
    // res.sendStatus(200); // Send success response
});

app.get('/logout', (req, res) => {
    // Destroy session
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/login');
    });
});

// app.post('/rating', async (req, res) => {
//     const rating = req.body.rating;
//     const i = req.body.productId;
//     const idata = await Item.findOne({ item_name: i });
//     const a = idata.item_rating;
//     // const b = (parseFloat(a) + parseFloat(i)) / 2;
//     // console.log('Input values:', a, rating);

//     // Parse input values as numbers
//     const parsedA = parseFloat(a);
//     const parsedI = parseFloat(rating);
//     // console.log('Parsed values:', parsedA, parsedI);

//     // Perform the calculation to find 'b'
//     const b = (parsedA + parsedI) / 2;
//     console.log('Calculated b:', b);
//     console.log(idata._id);
//     Item.updateOne(
//         { _id: idata._id },
//         { $set: { item_rating: b } },
//         (err, result) => {
//             if (err) {
//               console.error('Error updating item rating:', err);
//               return;
//             }
//             console.log('Item rating updated successfully');
//       }
//     )
// });


app.post('/rating', async (req, res) => {
    const rating = req.body.rating; // Rating value received from the client
    const productId = req.body.productId; // Product ID received from the client

    try {
        // Find the item in the database by its name (assuming item_name is unique)
        const item = await Item.findOne({ item_name: productId });
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        // Calculate the new rating
        const currentRating = item.item_rating;
        const parsedRating = parseFloat(rating);
        const newRating = (currentRating + parsedRating) / 2;

        // Update the item's rating in the database
        await Item.updateOne({ _id: item._id }, { $set: { item_rating: newRating } });

        // Send a success response
        res.redirect('manage');
    } catch (error) {
        console.error('Error updating item rating:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/pchange', async (req, res) => {
    const udata = await User.findOne({ username: req.session.user });
    const op=req.body.oldpassword;
    const np=req.body.newpassword;
    const rnp=req.body.newpasswordrepeat;
    console.log(udata.password,op);
    if(np==rnp && op==udata.password)
    {
        await User.updateOne({ _id: udata._id }, { $set: { password: np } });
        res.redirect('manage');
    }
});

app.post('/deleteaccount', async (req, res) => {
    const udata = await User.findOne({ username: req.session.user });
    const dp=req.body.password;
    console.log(udata.password,dp);
    if(dp==udata.password)
    {
        const deletedRecord = await User.findByIdAndDelete(udata._id);
        res.redirect("reg");
    }
});
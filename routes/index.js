var express = require('express');
var router = express.Router();

// Here I can store my Stripe public and private keys in an object in order to re-use them when I want... Thanks to JavaScript... It is not necessary but could be usefull I case the application would get bigger and grow.
var myOwnKeys = {
  public: "pk_test_27DZz9wOSAWIegt2jVjcNUz500G61ojKRC",
  private: "sk_test_9YtvdW5rJb87L8BW48ibn5Hx00SQVmFiZn"
};

// Now I need to require stripe and store the module in a variable in order to use it later in my script. I also add my private key defined just above.
var stripe = require("stripe")(myOwnKeys.private);

// Bikes array that we will use in index to desplay our bikes card with names, prices and urls

var dataBike = [
  {name:"BIKO45" ,url:"/images/bike-1.jpg" ,price:679 },
  {name:"ZOOK7" ,url:"/images/bike-2.jpg" ,price:799 },
  {name:"LIKO89" ,url:"/images/bike-3.jpg" ,price:839 },
  {name:"GEWO8" ,url:"/images/bike-4.jpg" ,price:1249 },
  {name:"KIWIT" ,url:"/images/bike-5.jpg" ,price:899 },
  {name:"NASAY" ,url:"/images/bike-6.jpg" ,price:1399 }
]

/* GET home page. */
router.get('/', function(req, res, next) {

  // we need to initialize our dataCardBike array to an empty array if this is the first time we connect, or it will send the error 'undefined', so we have to deal with this situation with the loop below :
  if(req.session.dataCardBike == undefined) {
    req.session.dataCardBike = [];
  }
  res.render('index',{dataBike});
});

/* GET Shop page. */
router.get('/shop', function(req, res, next) {
  res.render('index',{dataBike});
});

/* POST Update page. */
router.post('/update-shop', function(req, res, next) {

  // 1) saving the result in variables
  var position = req.body.position;
  var newQuantity = req.body.quantity;

  // 2) updating our dataCardBike array 
  req.session.dataCardBike[position].quantity = newQuantity;

  // 3) Render again the shop page with our dataCardBike array updated
  res.render('shop',{dataCardBike:req.session.dataCardBike});
});

/* POST Delete-bike page. */
router.post('/delete-shop', function(req, res, next) {
 
  // this method allows us to delete 1 element at the position : req.body.position
  // more informations : https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Array/splice
  req.session.dataCardBike.splice(req.body.position,1)

  res.render('shop',{dataCardBike:req.session.dataCardBike});
});


/* POSTShop page. */
router.post('/shop', function(req, res, next) {

  // We push inside dataCardBike our hidden form results from the front
  // more informations : https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Array/push
  req.session.dataCardBike.push({
    name:req.body.bikeNameFromFront,
    url: req.body.bikeImageFromFront,
    price:req.body.bikePriceFromFront,
    quantity:req.body.bikeQuantityFromFront
    })

  // we send to our shop page the dataCardBike array
  res.render('shop', {dataCardBike:req.session.dataCardBike});
});



/* POST checkout page. */
router.post('/charge', function(req, res, next) {

  console.log("from checkout", req.session.dataCardBike)

  console.log("from checkout", req.body);

  // Here I need to permute "request" (as given in the Stripe doc) to "req" (as I defined it in the parameters of my route juste above.)
  // const token = request.body.stripeToken;


 const token = req.body.stripeToken;

  // Now, I want to :
  // 1- calculate the total price in my backend to prevent any error or "hacking"
  // 2- store some information related to the order in the description part of the charge.
  // NB: there are several ways to achieve the same purpose here.

  var totalCmdFromBackEnd = 0;
  var ordersReferences = [];

  for (var i = 0; i < req.session.dataCardBike.length; i++) {
    totalCmdFromBackEnd = totalCmdFromBackEnd + (req.session.dataCardBike[i].quantity * req.session.dataCardBike[i].price);
    ordersReferences.push(req.session.dataCardBike[i].name)
  };

  var name = req.body.stripeShippingName + " | ";
  var fullAddress = req.body.stripeShippingAddressLine1 + " - " + req.body.stripeShippingAddressZip + " - " + req.body.stripeShippingAddressCity + " | ";
  var ordersList = "Ref: "+ ordersReferences.join(' - ');


  (async () => {
    const charge = await stripe.charges.create({
      amount: totalCmdFromBackEnd*100,
      currency: 'eur',
      description: name + fullAddress + ordersList,
      source: token
    }).then(req.session.dataCardBike = []);
  })();
  // BONUS: According to the Stripe documentation, I can use .then() to execute some code AFTER the execution of the charge script

  // BONUS : We could create a last view "confirm" for the user to deliver a confirmation message (OPTIONAL)
  res.render('confirm');
});




// export part ------
module.exports = router;

var express = require('express');
var router = express.Router();
var models = require('../models');
var whatsappController = require('../controllers/WhatsAppController');

// Home page route.
// router.get('/optin', whatsappController.optin);
router.get('/optin', whatsappController.postOptin);
router.post('/complete', whatsappController.completeOptin);

router.get('/optout/:kid', async(req, res) => {

  const randgen = require('../my_modules/randgen');
  var phoneval = require('../my_modules/phonevalidate');
  var phoneformat = require('../my_modules/phoneformat');

  //  for the sake of it, the only useful part of the 'clientid' is the third part of it... which is the client's userId
  let kid = req.params.kid;

  console.log('[[====================================');
  console.log('OPT-OUT DATA: ...' + kid);
  console.log('====================================]]');

  try {
      //  get user details
      let kont = await models.Contact.findByPk(kid, {
          include: [{
              model: models.User, 
              attributes: ['name', 'business']
          },{
              model: models.Group, 
              attributes: ['name']
          }],
      });

      if(!kont) throw {
          name: 'requesterror',
      };
      console.log('====================================');
      console.log('KONT DATA: ' + JSON.stringify(kont));
      console.log('====================================');
      let ctry = await models.Country.findAll({ 
          order: [ 
              ['name', 'ASC']
          ]
      })

      var flashtype, flash = req.flash('error');
      if(flash.length > 0) {
          flashtype = "error";           
      } else {
          flashtype = "success";
          flash = req.flash('success');
      }

      res.render('pages/smscompleteoptout', {
          _page: 'SMS Opt-Out',
          flashtype, flash,

          args: {
              ctry,
              kid,
              groupname: kont.group.name,
              username: kont.user.name,
              business: kont.user.business,
          }
      });
  
  
  } catch(e) {
      console.log('====================================');
      console.log('error: ' + e.name);
      console.log('error: ' + JSON.stringify(e));
      console.log('error: ' + e);
      console.log('====================================');
      res.render('pages/redirect-error', {
          page: '',
  
      });
  }

});
router.post('/optout', async(req, res) => {

  const randgen = require('../my_modules/randgen');
  var phoneval = require('../my_modules/phonevalidate');
  var phoneformat = require('../my_modules/phoneformat');

  //  for the sake of it, the only useful part of the 'clientid' is the third part of it... which is the client's userId
  
  try {
      //  get user details
      if(!(req.body.phone = phoneval(req.body.phone, req.body.country))) throw {
          name: 'phoneerror',
      };

      let kid = req.body.code;
      let phone = req.body.phone;
      let ctry = req.body.country;

      console.log('[[====================================');
      console.log('KID: ...' + kid + '; PHONE = ' + phone + '; CTRY' + ctry);
      console.log('====================================]]');

      let kont = await models.Contact.findByPk(kid);

      if(!kont || (kont.phone != phone)) throw {
          name: 'invalidoperation',
      } 

      if(!kont.do_sms) throw {
          name: 'notsubscribed',
      } 
      

      await kont.update({
          do_sms: false
      });

      console.log('====================================');
      console.log('whatsapp status changed: result = ' + JSON.stringify(kont));
      console.log('====================================');

      //  register opt-out
      await models.Optout.create({
          contactId: kid,
          userId: kont.userId,
          platform: 'SMS',
      })

      res.render('pages/smscompleteoptout', {
          _page: 'SMS Opt-Out',

          args: {}
      });

  } catch(e) {
      console.log('====================================');
      console.log('erroooooooooooooer: ' + JSON.stringify(e));
      console.log('====================================');
      let errmsg;
      if(e.name == 'SequelizeUniqueConstraintError') {
          errmsg = "A system error occured. Please try again later";
      }
      else if(e.name == 'invalidoperation') {
          errmsg = "The phone number you provided does not match this request. Please check and try again.";
      }
      else if(e.name == 'phoneerror') {
          errmsg = "There's an error with the provide phone number Please check and try again.";
      }
      else if(e.name == 'notsubscribed') {
          errmsg = "You did not opt in for this Group's messages or had already opted out.";
      }

      req.flash('error', errmsg);
      var backURL = req.header('Referer') || '/';
      res.redirect(backURL);

      /* res.render('pages/dashboard/whatsappcompleteoptout', {
          _page: 'WhatsApp Opt-Out',

          args: {
              error: errmsg
          }
      }); */

  }

});

module.exports = router;